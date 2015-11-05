/* 
 * begin.js
 * 
 * Copyright (c) 2013-2015, Kenneth Lo Shih
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, 
 *    this list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

(function(root) {
  "use strict";
 
  // var env = typeof(process) === 'object' ? process.env : root;

  /*
   * begin()
   */
  function begin(context) {
    return new Root(null, context);
  }
  
  /*+-------------------------------------------------------------------------* 
   |                                Statements                                | 
   *--------------------------------------------------------------------------*/

  var ArgKind = begin.ArgKind = 0x1,
      ErrKind = begin.ErrKind = 0x2,
      BrkKind = begin.BrkKind = 0x4,
      RetKind = begin.RetKind = 0x8,
      AllKind = begin.AllKind = 0xf;
  var STACK_MARKER = 'STACK';
  var slice = Array.prototype.slice;

  /* Find a next tick function. Try node.js's process.nextTick, setImmediate()
   * the finally setTimeout(). Use a polyfill if this isn't node and
   * setImmediate()'s not available https://github.com/YuzuJS/setImmediate */
  if (typeof(root.setImmediate) === 'function')
    begin.setImmediate = root.setImmediate;
  else if (typeof(setImmediate) === 'function')
    begin.setImmediate = setImmediate;
  else if (typeof(process) != 'undefined' && typeof(process.nextTick) === 'function')
    begin.setImmediate = process.nextTick;
  else if (typeof(root.setTimeout) === 'function')
    begin.setImmediate = function(func) { return root.setTimeout(func, 0) };
  else
    begin.setImmediate = function(func) { return setTimeout(func, 0) };

  /*+-------------------------------------------------------------------------* 
   |                                   Call                                   | 
   *--------------------------------------------------------------------------*/

  /** The Call class provides a representation. Calls also provide a Promise/A+
   *  and Deferred interfaces for convenience. It also provides an interfae to
   *  run() as a handler (no error first arg) or callback (yes error first
   *  arg).
   *  
   *  @class  begin.Call
   *  @since  1.0
   */
  var Call = begin.Call = function Call(block, context) {
    this.status = 'new';
    this.block = block;
    this.context = context || {};
    this.error = undefined;
    this.params = [];
  };
  
  /** @method Call#toString */
  Call.prototype.toString = function() {
  /** @method Call#toString */
  Call.prototype.toString = function() {
    return this.constructor.name + "(error:" + this.error + ",params:" + this.params.join(',') + (this.subcalls ? ",subcalls=" + this.subcalls.length : "") + ")";
  };

  /** Runs the call. Set the error, params and context prior to calling run.
   *
   *  @param  {function} callback The callback function ({function(err,..)})
   *  @since  1.0
   *  @method begin.Call#run
   */
  Call.prototype.run = function(callback) {
    if (this.status != 'new')
      throw new Error("Call cannot be run twice");
    if (!this.block) {
      throw new Error("No block");
      this.status = 'done';
      return callback && callback(), undefined;
    }
    var self = this;
    this.status = 'running';
hook && hook.emit('onBeginCall', this);
    this.block.run(this, function() {
      self.status = 'done';
      if (self.error === 'cancel')
        // console.log("Call.run(): clearing 'cancel' error"),
        self.error = null;
      if (self.error === 'return' && !('index' in self))
        self.error = null;
hook && hook.emit('onEndCall', self);
      callback && callback();
    });
  };

  /** Cancels the call
   *
   *  @param  cancelError The cancel error (optional)
   *  @param  callback Called when cancellation is complete (function(err))
   */
  Call.prototype.cancel = function(cancelError, callback) {
    /* cancelError will be passed to original caller in Root.end(). */
    this.cancelError = cancelError;
    var latch = false, replier = this.replier;
    function done(err) {
      if (latch)
        return;
      latch = true;
      if (replier)
        replier('cancel')
      callback && callback(err);
    }
    if (replier && replier.cancel) {
      var cancel = replier.cancel;
      if (isThenable(cancel)) {
        cancel
          .then(function(value) { done() })
          .catch(done);
      } else if (typeof(cancel) === 'function') {
        try {
          // console.log("Call.cancel(): calling cancel function: " + cancel);
          cancel();
          done();
        } catch(err) {
          done(err);
        }
      } else {
        done();
      }
    } else if (this.subcalls) {
      /* If there's no replier, the call is either complete or a subcall is in
       * progress. Ask each subcall to cancel. */
      var subcalls = this.subcalls;
      var inCount = subcalls.length, outCount = 0;
      var errs;
      for (var i = 0; i < inCount; i++) {
        (function(i) {
          var subcall = subcalls[i];
          subcall.cancel(null, function(err) {
            if (err)
              (errs || (errs = [])).push(err);
            if (++outCount === inCount) {
              if (errs) {
                var err = errs.shift();
                err.errors = errs;
                err.message += " (" + errs.join('; ') + ")";
                done(err);
              } else {
                done();
              }
            }
          });
        })(i);
      }
    }
  };

  /** Sets the *error* and *params*.
   *
   *  @param  error {error} The error (optional)
   *  @param  params {array} The parameters (optional)
   *  @return this
   *  @since  1.0
   *  @method begin.Call#set
   */
  Call.prototype.set = function(error, params) {
    if (error !== undefined) {
      this.error = error;
    }
    if (params !== undefined && Array.isArray(params)) {
      this.params.length = params.length;
      for (var i = params.length; i--; )
        this.params[i] = params[i];
    }
  };

  Call.prototype.setParams = function() {
    this.params.length = arguments.length;
    for (var i = arguments.length; i--; )
      this.params[i] = arguments[i];
  }

  /** Begins a subcall with the given *block*.
   *
   *  @param  block The block ({begin.Block}, required)
   *  @return The subcall ({begin.Call}, non-null)
   *  @since  1.0
   */
  Call.prototype.beginSubcall = function(block) {
    var subcontext = extend({}, this.context);
    var subcall = new Call(block || this.block, subcontext);
    subcall.set(this.error, this.params);
    (this.subcalls || (this.subcalls = [])).push(subcall);
    subcall.index = this.subcalls.length - 1;
    // subcall.supercall = this;
    if (this.subcalls.length == 1) {
hook && hook.emit('onOpenSubcalls', this);
      this.subcallErrors = [];
      this.subcallParams = [];
    }
hook && hook.emit('onBeginSubcall', this, subcall);
    return subcall;
  };

  Call.prototype.endSubcall = function(subcall) {
    if (!(subcall instanceof Call))
      throw new Error("Subcall required (subcall=" + subcall + ")");
    subcall.commit();
    this.subcallErrors[subcall.index] = subcall.error;
    this.subcallParams[subcall.index] = subcall.params[0];
    this.subcalls[subcall.index] = null;
hook && hook.emit('onEndSubcall', this, subcall);
  };

  /** Commits the call specifically for subcalls after all subcalls are
   *  completed. It aggregates errors from all subcalls and takes the first
   *  parameter from each.
   *
   *  @return this
   *  @since  1.0
   */
  Call.prototype.commit = function() {
    if (this.subcalls == null)
      return;
    var agg = this.subcallsError;
    delete(this.subcallsError);
// console.log("Call.commit() before", this);
    for (var i = 0, ic = this.subcallErrors.length; i < ic; i++) {
      var error = this.subcallErrors[i];
      if (error == null)
        continue;
      if (agg == null) {
        agg = error;
      } else if (typeof(agg) !== 'string') {
        agg.message += '; ' + (error.message || error);
        (agg.errors || (agg.errors = [])).push(error);
      }
    }
    this.error = agg;
    delete(this.subcallErrors);
    this.params = this.subcallParams;
    // console.log("Call.commit(): error=" + this.error + ", params=" + this.params);
    if (this.error === 'return') {
      if (Array.isArray(this.params))
        this.params.splice(1);
      // if (!('index' in this) /* root call, removes this.error */)
      //   this.error = null;
    }
    delete(this.subcallParams);
    delete(this.subcalls);
hook && hook.emit('onCloseSubcalls', this);
    return this;
  };


  function Class() {
    this.init.apply(this, arguments);
  }

  Class.extend = extendClass;

  Class.prototype.toString = function() {
    return this.constructor.name + '()';
  };

  Class.prototype.init = function() {
  };

  /*+-------------------------------------------------------------------------*
   |                                Statements                                |
   *--------------------------------------------------------------------------*/

  /** The Stmt class is an abstract base class for all begin statements.
   *
   *  @MARK: - Stmt
   */
  var Stmt = begin.Stmt = function Stmt(owner) {
    this.owner = owner;
hook && hook.emit('onCreateStmt', this);
  };
  Stmt.kind = ArgKind;

  Stmt.prototype.init = function(owner) {
    this.owner = owner;
  };

  Stmt.prototype.toString = function() {
    return this.constructor.name + '()';
  };

  Stmt.prototype.run = function(call, callback) {
    var self = this;
    hook && hook.emit('onBeginRun', call, self);
    this._run(call, function() {
      hook && hook.emit('onEndRun', call, self);
      callback && callback.apply(null, arguments);
    });
  };

  /** Runs a statement with the given array of *args* where the first item is an
   *  error or undefined or null and the remaining items are parameters. The
   *  statement is run within a *context* of properties used for each field.
   *
   *  The *callback(args)* is called upon completion of the statement, called
   *  with a single required argument, an array or arguments object, where the
   *  first item is an optional error.
   *
   *  @param  args The statement input arguments ({array}, required)
   *  @param  context The context ({object}, required)
   *  @param  callback A completion callback ({function(args)}, optional)
   *  @since  1.0
   *  @MARK:  -_run()
   */
  Stmt.prototype._run = function run(call, callback) {
    callback(args);
  };

  /** Invokes the *func* for the given *call* context.
   *
   *  @param  call The call ({begin.Call}, required)
   *  @param  func The function ({function(..)} or other, optional)
   *  @param  callback The callback ({function()}, required)
   *  @since  1.0
   */
  Stmt.prototype.invoke = function(call, func, callback) {
    if (!(call instanceof Call))
      throw new Error("Call must be a Call: " + call);
    var context = call.context;

    if (typeof(callback) != 'function')
      throw new Error("Callback must be a function");
    if (func === STACK_MARKER)
      return call.error = null, callback();
    if (isThenable(func)) {
      return func.then(
        function(v) { call.setParams(v); callback() },
        function(e) { call.set(e); callback(); }
      );
    }
    if (typeof(func) !== 'function') {
      return call.setParams(func), callback();
    }

    var sync = true, replied = false;
    function replier() {
      if (replied) {
hook && hook.emit('onEndInvokeDup', call, call.stmt, func, replier, arguments);
        return;
      }
hook && hook.emit('onEndInvoke', call, call.stmt, func, replier, arguments);
      call.stmt = call.replier = call.func = null;
      if (replier.cancel)
        call._cancel = replier.cancel, delete(replier.cancel);
      if (replier.rollback)
        call._rollback = replier.rollback, delete(replier.rollback);
      for (var key in replier)
        context[key] = replier[key];
      call.set(arguments[0], slice.call(arguments, 1));
      if (sync)
        begin.setImmediate(callback);
      else
        callback();
    }
    for (var key in context)
      replier[key] = context[key];
    replier.call = call;
    try {
      call.stmt = this, call.replier = replier, call.func = func;
hook && hook.emit('onBeginInvoke', call, this, func, replier);
      var result = func.apply(replier, call.params);
      if (result !== undefined) {
        if (isThenable(result)) {
          result.then(
            function(value) { replier(null, value) },
            function(error) { replier(error, null) }
          );
        } else {
          replier(null, result);
        }
      }
    } catch (error) {
      replier(error, null);
    } finally {
      sync = false;
    }
  };

  Stmt.extend = extendClass;

  /** Creates a sync version */
  Stmt.syncify = function(keys) {
    var proto = this.prototype;
    var superproto = proto.class.superclass.prototype;

//     console.log("Stmt.syncify (" + this.name + ") keys: " + Object.getOwnPropertyNames(proto).join(', ') + ", super: " + Object.getOwnPropertyNames(superproto).join(', '));

    options || (options = {});
    options.promise = true;
    return new Root(null, context, options);
  };
  begin.handler = function(context, options) {
    options || (options = {});
    options.handler = true;
    return new Root(null, context, options);
  };
  begin.callback = function(context, options) {
    options || (options = {});
    options.callback = true;
    return new Root(null, context, options);
  };

  Root.prototype.end = function end(callback) {
    var self = this;
    if (this.options.handler) {
      return function() {
        var call = new Call(self);
        call.set(null, arguments);
        call.run(function() {
          if (callback) {
            callback.apply(null, [call.error].concat(call.params));
          } else if (call.error) {
            throw call.error;
            // console.log("begin produced an error with no callback: " + call.error + "\n" + call.error.stack);
          }
        });
      };
    } else if (this.options.callback) {
      return function() {
        var call = new Call(self);
        call.set(arguments[0], slice.call(arguments, 1));
        call.run(function() {
          if (callback) {
            callback.apply(null, [call.error].concat(call.params));
          } else if (call.error) {
            throw call.error;
            // console.log("begin produced an error with no callback: " + call.error + "\n" + call.error.stack);
          }
        });
      };
    } else {
      var call = new Call(self);
      var promise = new Promise();
      call.run(function() {
        // console.log("Done with call=", call);
        if (call.error)
          promise._reject(call.error);
        else
          promise._fulfill(call.params[0]);
        if (callback)
          callback.apply(null, [call.error].concat(call.params));
//         else if (call.error)
//           // throw call.error;
//           // console.log("begin produced an error with no callback: " + call.error + "\n" + call.error.stack);
      });
      return promise;
    }
  };

  /*+-------------------------------------------------------------------------* 
   |                                 then(fn)                                 | 
   *--------------------------------------------------------------------------*/

  /** The Then class defines a stmt for a single asynchronous
   *  function.
   *  
   *  @MARK: - Then
   */
  var Then = begin.Then = Stmt.extend(function Then(owner, func) {
    Stmt.call(this, owner);
    this.func = func;
  });
  
  Then.prototype._run = function(call, callback) {
    this.invoke(call, this.func, function() {
      callback();
    });
  };
  
  Block.prototype.then = function(func) {
    if (func) {
      var stmt = new Then(this, func);
      this.stmts.push(stmt);
    }
    return this;
  };
//   Block.syncify(['then']);
 
//   Block.prototype.thenSync = syncify(Block.prototype.then);
//   Block.prototype.thenPass = passify(Block.prototype.then);
 
  /*+-------------------------------------------------------------------------*
   |                      if(fn).elseif(fn).else().end()                      | 
   *--------------------------------------------------------------------------*/

  var If = begin.If = Stmt.extend(function If(owner, cond, negate) {
    Stmt.call(this, owner);
    this.negate = !!negate;
    this.conds = [cond];
    this.blocks = [new begin.Block(this)];
  });
  
  Block.prototype.if = function(cond) {
    var stmt = new If(this, cond, false);
    this.stmts.push(stmt);
    return stmt.blocks[0];
  };
  Block.prototype.unless = function(cond) {
    var stmt = new If(this, cond, true);
    this.stmts.push(stmt);
    return stmt.blocks[0];
  };
  Block.prototype.elseif = function(cond) {
    if (!this.owner.elseif)
      throw new Error("Unexpected .elseif()");
    return this.owner.elseif(cond);
  },
  Block.prototype.else = function() {
    if (!this.owner.else)
      throw new Error("Unexpected .else()");
    return this.owner.else();
  };
  Block.syncify(['then']);
 
  If.prototype._run = function(call, callback) {
    // hook && hook.emit('onBeginRun', call, this);
    var self = this;
    var condArgs = call.params;
    var index = 0, count = this.blocks.length;
    (function If_next() {
      if (index < count) {
        var cond = self.conds[index],
            block = self.blocks[index];
        index++;
        call.set(undefined, condArgs);
        self.invoke(call, cond, function() {
          var error = call.error, result = call.params[0];
          if (call.error) {
            // hook && hook.emit('onEndRun', call, this);
            return callback();
          }
          if (!!result == !self.negate) { /* TRUE */
            block.run(call, callback);
          } else if (index < count) { /* FALSE, elseif */
            If_next();
          } else if (self.elseBlock) { /* FALSE, else */
            self.elseBlock.run(call, callback);
          } else { /* FALSE, no-else */
            // hook && hook.emit('onEndRun', call, this);
            callback();
          }
        });
      } else {
        // hook && hook.emit('onEndRun', call, this);
        callback();
      }
    })();
  };
  If.prototype.elseif = function(cond) {
    var block = new Block(this);
    this.conds.push(cond);
    this.blocks.push(block);
    return block;
  },
  If.prototype.else = function() {
    return this.elseBlock = new Block(this);
  };
 
  /*+-------------------------------------------------------------------------* 
   |                      case(fn).when(fn).else().end()                      | 
   *--------------------------------------------------------------------------*/

  var Case = begin.Case = begin.Stmt.extend(function Case(owner, control) {
    begin.Stmt.call(this, owner);
    this.control = control;
    this.conds = [];
    this.blocks = [];
    this.elseBlock = null;
  });

  begin.Block.prototype.case = function(control) {
    if (arguments.length == 0)
      control = 'STACK';
    var stmt = new Case(this, control);
    this.stmts.push(stmt);
    return stmt;
  };

  begin.Block.prototype.when = function(cond) {
    if (!this.owner.when)
      throw new Error("Unexpected .when()");
    if (arguments.length > 1)
      cond = slice.call(arguments);
    return this.owner.when(cond);
  };

  Case.prototype.when = function(cond) {
    if (arguments.length > 1)
      cond = slice.call(arguments);
    var block = new begin.Block(this);
    this.conds.push(cond);
    this.blocks.push(block);
    return block;
  };

  Case.prototype.else = function() {
    return this.elseBlock = new begin.Block(this);
  };

  Case.prototype.match = function(lhs, rhs) {
// console.log("lhs=" + lhs + ", rhs=" + rhs + ", regexp=" + (typeof(lhs) === 'string' && (rhs instanceof RegExp)));
    if (lhs == rhs) return true;
    if (lhs == null || rhs == null) return false;
    if (Array.isArray(rhs)) {
      for (var i = 0, ic = rhs.length; i < ic; i++) {
        if (this.match(lhs, rhs[i]))
          return true;
      }
      return false;
    }
    if (typeof(lhs) === 'string' && (rhs instanceof RegExp))
      return lhs.match(rhs);
    if (lhs.getTime && rhs.getTime && lhs.getTime() == rhs.getTime())
      return true;
    return false;
  };

  Case.prototype._run = function(call, callback) {
    var self = this;
    var control;
    var index = 0, count = this.blocks.length;
 
    /* Invoke the control value of the case, which we'll use to match */
    self.invoke(call, this.control, function() {
      if (call.error)
        return callback();
      control = call.params[0];
      Case_next();
      function Case_next() {
        if (index < count) {
          var cond = self.conds[index], block = self.blocks[index];
          index++;
          call.params.splice(0, call.params.length, control);
          if (typeof(cond) === 'function') {
            self.invoke(call, cond, function() {
              if (call.error)
                return callback();
              if (!!call.params[0]) {
                block.run(call, callback);
              } else {
                Case_next();
              }
            });
          } else {
            if (self.match(control, cond)) {
              block.run(call, callback);
            } else {
              Case_next();
            }
          }
        } else if (self.elseBlock) {
          self.elseBlock.run(call, callback);
        } else {
          callback();
        }
      }
    });
  };
 
  /*+-------------------------------------------------------------------------* 
   |                             while(fn)..end()                             | 
   *--------------------------------------------------------------------------*/

  var While = begin.While = Stmt.extend(function While(owner, cond, opts) {
    Stmt.call(this, owner);
    this.opts = opts || {};
    this.cond = cond;
    this.block = new Block(this);
  });
  While.kind = ArgKind | BrkKind;

  Block.prototype.while = function(opts, cond) {
    if (arguments.length == 1) cond = opts, opts = null;
    var stmt = new While(this, cond, opts);
    this.stmts.push(stmt);
    return stmt.block;
  };
  Block.prototype.until = function(opts, cond) {
    if (arguments.length == 1) cond = opts, opts = null;
    opts || (opts = {});
    opts.negate = true;
    return this.while(cond, opts);
  };

  While.prototype.init = function(owner, cond, opts) {
    Stmt.call(this, owner);
    this.opts = opts || {};
    this.cond = cond;
    this.block = new Block(this);
  };
  While.prototype._run = function(call, callback) {
    var self = this;
    var cond = this.cond,
        condArgs = call.params.slice(),
        negate = !!this.opts.negate;
    var pauseTime = this.opts.interval || 0;
    (function While_next() {
      var nextTime = Date.now() + pauseTime;
      self.invoke(call, cond, function() {
        var truth = call.params[0];
        if (call.error) {
          call.set(undefined, condArgs);
          return callback();
        }
        if (!!truth == !negate) {
          self.block.run(call, function() {
            if (call.error) {
              call.set(undefined, condArgs);
              return callback()
            }
            var nextInterval = nextTime - Date.now();
            if (nextInterval > 4)
              setTimeout(While_next, nextInterval);
            else
              While_next();
          });
        } else { /* FALSE */
          call.set(undefined, condArgs);
          callback();
        }
      });
    })();
  };
  While.prototype.elseif = function(cond) {
    var block = new Block(this);
    this.conds.push(cond);
    this.blocks.push(block);
    return block;
  };
  While.prototype.else = function() {
    return this.elseBlock = new Block(this);
  };
  

  /*+-------------------------------------------------------------------------* 
   |                             each(fn)..end()                              | 
   *--------------------------------------------------------------------------*/

  var Each = begin.Each = Stmt.extend(function Each(owner, opts, list) {
    Stmt.call(this, owner);
    this.opts = opts || {};
    this.list = list;
    this.block = new Block(this);
  });
  Each.kind = ArgKind | BrkKind;

  Block.prototype.each = function(opts, list) {
    if (arguments.length == 1) list = opts, opts = null;
    var stmt = new Each(this, opts, list);
    this.stmts.push(stmt);
    return stmt.block;
  };

  Each.prototype._run = function(call, callback) {
    var self = this, block = this.block;
    var workers = Math.max(0, this.opts.workers) || Infinity;
    
    this.items(call, function() {
      if (call.error)
        return callback();
      
      var items = self.coerce(call.params[0]);
      var values = items[0], keys = items[1];
      var index = 0, done = 0, count = values.length;
      if (count == 0) {
        call.setParams([]);
        return callback();
      }
      var current = 0, replies = Array(count);

      function Each_next() {
        var idx = index++, value = values[idx], key = keys[idx];
        var subcall = call.beginSubcall(block);
        subcall.params.splice(0, subcall.params.length, value, key);
        current++;
        block.run(subcall, function() {
          current--, done++;
          call.endSubcall(subcall);
          if (index < count) {
            while (current < workers && index < count) Each_next();
          } else if (current == 0) {
            call.commit();
            call.params.splice(0, call.params.length, call.params.slice());
            callback();
          }
        });
      }
      while (current < workers && index < count) Each_next();
    });
  };
  
  Each.prototype.items = function(call, callback) {
    switch (typeof(this.list)) {
      case 'function':
        this.invoke(call, this.list, callback);
        break;
      case 'undefined':
        return callback();
      default:
        call.params = [this.list];
        return callback();
    }
  };
  Each.prototype.coerce = function(items) {
    var values = [], keys = [];
    switch (typeof(items)) {
      case 'object':
        if (items == null)
          break;
        if (Array.isArray(items)) {
          for (var i = 0, ic = items.length; i < ic; i++)
            values.push(items[i]), keys.push(i);
        } else {
          for (var key in items)
            values.push(items[key]), keys.push(key);
        }
        break;
      case 'number':
        for (var i = 0; i < items; i++)
          keys.push(i), values.push(i);
        break;
    }
    return [values, keys];
  };
  
  /*+-------------------------------------------------------------------------* 
   |                              split()..end()                              | 
   *--------------------------------------------------------------------------*/

  /** The Split class defines a block-type
   *  
   *  @MARK:  - Split
   */
  var Split = begin.Split = Stmt.extend(function Split(owner) {
    Stmt.call(this, owner);
    this.block = new Block(this);
  });
  
  Block.prototype.split = function() {
    var stmt = new Split(this);
    stmt.owner = this;
    this.stmts.push(stmt);
    return stmt.block;
  };

  Split.prototype._run = function(call, callback) {
    var self = this, block = this.block, stmts = block.stmts;
    var inCount = stmts.length, outCount = 0;
    for (var i = 0; i < inCount; i++) {
      (function(i) {
        var stmt = stmts[i];
        var subcall = call.beginSubcall(block);
        stmt.run(subcall, function() {
          call.endSubcall(subcall);
          if (++outCount == inCount) {
            call.commit();
            callback();
          }
        });
      })(i);
    }
  };

  Block.prototype.parallel = Block.prototype.split;

  /*+-------------------------------------------------------------------------* 
   |                            stream(fn)..end()                             | 
   *--------------------------------------------------------------------------*/

  var Stream = begin.Stream = Stmt.extend(function Stream(owner, opts, stream) {
    Stmt.call(this, owner);
// console.log("-Stream(): stream with opts=" + opts + ", stream=" + stream);
    this.opts = opts;
    this.stream = stream;
    this.block = new Block(this);
  });

  Block.prototype.stream = function(opts, stream) {
    var stmt;
    switch (arguments.length) {
      case 0: stream = STACK_MARKER, opts = null; break;
      case 1: stream = opts, opts = null; break;
    }
    var stmt = new Stream(this, opts, stream);
    stmt.owner = this;
    this.stmts.push(stmt);
    return stmt.block;
  };
  
  Stream.prototype._run = function(call, callback) {
    var self = this, block = this.block;
    var stop = false, inCount = 0, outCount = 0;
    var oldArgs = call.params.slice();
    
// console.log("-Stream.run(): invoking call with this.stream=", this.stream);
    this.invoke(call, this.stream, function() {
      if (call.error)
        return callback();
      var stream = call.params[0];
      var dataEvent  = self.opts && self.opts.data  || 'data',
          errorEvent = self.opts && self.opts.error || 'error',
          closeEvent = self.opts && self.opts.close || 'close';
// console.log("-Stream.run(): called stream, call=", call);

      if (stream == null) {
        call.setParams([]);
        return callback();
      }
      stream.on(dataEvent, function(data) {
        var subcall = call.beginSubcall(block);
        subcall.params = [data, inCount++, stream];
        block.run(subcall, function() {
          outCount++;
// console.log("-Stream.run(): +" + inCount + "/-" + outCount + " end subcall=", subcall);
          call.endSubcall(subcall);
// console.log("-Stream.run(): iteration +" + inCount + "/-" + outCount + " call=" + call);
          if (stop && outCount == inCount) {
            call.commit();
            call.params.splice(0, call.params.length, call.params.slice());
// console.log("-Stream.run(): call=", call);
// console.log("-Stream.run(): +" + inCount + "/-" + outCount + " done on data, call=", call);
            callback();
          }
        });
      });
      stream.once(errorEvent, function(err) {
// console.log("-Stream.run(): +" + inCount + "/-" + outCount + " stopped=" + stop + ", error called: " + err + ", call=", call);
        if (stop) return;
        stop = true;
        call.subcallsError = err || 'error';
        if (outCount == inCount) {
          call.commit();
// console.log("-Stream.run(): done on error, call=", call);
          callback();
        }
      });
      stream.once(closeEvent, function() {
// console.log("-Stream.run(): +" + inCount + "/-" + outCount + " stopped=" + stop + ", close called");
        if (stop) return;
        stop = true;
        if (outCount == inCount) {
          call.commit();
          callback();
        }
      });
    });
    
    function done() {
      call.commit();
      call.params.splice(0, call.params.length, call.params.slice());
      callback();
    }
  
  };

  /*+-------------------------------------------------------------------------* 
   |                                 wait(ms)                                 | 
   *--------------------------------------------------------------------------*/

  /** The Wait class defines a block-type
   *  
   *  @MARK:  - Wait
   */
  var Wait = begin.Wait = Stmt.extend(function Wait(owner, timeout) {
    Stmt.call(this, owner);
    this.timeout = timeout || 0;
  });

  Block.prototype.wait = function(timeout) {
    var stmt = new Wait(this, timeout);
    stmt.owner = this;
    this.stmts.push(stmt);
    return this;
  };

  Wait.prototype._run = function(call, callback) {
    setTimeout(function() {
      callback();
    }, this.timeout);
  };
    

  /*+-------------------------------------------------------------------------* 
   |                             retry(n)..end()                              | 
   *--------------------------------------------------------------------------*/

  /** The Retry class defines a block-type
   *  
   *  @MARK:  - Retry
   */
  var Retry = begin.Retry = Stmt.extend(function Retry(owner, count) {
    Stmt.call(this, owner);
    this.block = new Block(this);
    this.count = count;
  });
  Retry.kind = ArgKind | BrkKind;
  
  Block.prototype.retry = function(count) {
    var stmt = new Retry(this, count);
    stmt.owner = this;
    this.stmts.push(stmt);
    return stmt.block;
  };
  
  Retry.prototype._run = function(call, callback) {
    var block = this.block, index = 0, count = this.count;
    function again() {
      if (index++ >= this.count)
        callback();
      block.run(call, function(err) {
        if (!err)
          return callback && callback();
      });
    }
    again();
  };

  /* 
   * This each statement above could be rewritten as any one the following are
   * functionally equivalent. They all create an each statement which iterates
   * over an array.
   */

  /*+-------------------------------------------------------------------------* 
   |                        catch(fn) | catch()..end()                        | 
   *--------------------------------------------------------------------------*/

  var Catch = begin.Catch = Stmt.extend(function Catch(owner, func) {
    Stmt.call(this, owner);
    this.func = func;
    if (!this.func)
      this.block = new Block(this);
  });

  Catch.kind = ErrKind | BrkKind;
  
  Block.prototype.catch = function(func) {
    var stmt = new Catch(this, func);
    this.stmts.push(stmt);
    return stmt.block || this;
  };

  Catch.prototype._run = function(call, callback) {
    call.params.splice(0, 0, call.error), call.error = null;
    
    if (this.func) {
      this.invoke(call, this.func, callback);
    } else if (this.block) {
//      call.unshift(call.error), call.error = null;
      this.block.run(call, callback);
    }
  };
    
  /*+-------------------------------------------------------------------------* 
   |                      finally(fn) | finally()..end()                      | 
  };

  Wait.prototype._run = function(call, callback) {
    setTimeout(function() {
      callback();
    }, this.timeout);
  };


  /*+-------------------------------------------------------------------------*
   |                             retry(n)..end()                              |
   *--------------------------------------------------------------------------*/

  /** The Retry class defines a block-type
   *
   *  @MARK:  - Retry
   */
  var Retry = begin.Retry = Stmt.extend(function Retry(owner, count) {
    Stmt.call(this, owner);
    this.block = new Block(this);
    this.count = count;
  });
  Retry.kind = ArgKind | BrkKind;

  Block.prototype.retry = function(count) { // MARK: -block.split()
    var stmt = new Retry(this, count);
    stmt.owner = this;
    this.stmts.push(stmt);
    return stmt.block;
  };

  Retry.prototype._run = function(call, callback) {
    var block = this.block, index = 0, count = this.count;
    function again() {
      if (index++ >= this.count)
        callback();
      block.run(call, function(err) {
        if (!err)
          return callback && callback();
      });
    }
    again();
  };

  /*
   * This each statement above could be rewritten as any one the following are
   * functionally equivalent. They all create an each statement which iterates
   * over an array.
   */

  /*+-------------------------------------------------------------------------*
   |                        catch(fn) | catch()..end()                        |
   *--------------------------------------------------------------------------*/

  var Catch = begin.Catch = Stmt.extend(function Catch(owner, func) { // MARK: -init()
    Stmt.call(this, owner);
    this.func = func;
    if (!this.func)
      this.block = new Block(this);
  });

  Catch.kind = ErrKind | BrkKind;

  Block.prototype.catch = function(func) { // MARK: -block.catch()
    var stmt = new Catch(this, func);
    this.stmts.push(stmt);
    return stmt.block || this;
  };

  Catch.prototype._run = function(call, callback) { // MARK: -run()
    call.params.splice(0, 0, call.error), call.error = null;

    if (this.func) {
      this.invoke(call, this.func, callback);
    } else if (this.block) {
//      call.unshift(call.error), call.error = null;
      this.block.run(call, callback);
    }
  };

  /*+-------------------------------------------------------------------------*
   |                      finally(fn) | finally()..end()                      |
   *--------------------------------------------------------------------------*/

  /** The Stmt.Finally class defines a block-type
   *
   *  @MARK:  - Finally
   */
  var Finally = begin.Finally = Stmt.extend(function Finally(owner, func) {
    Stmt.call(this, owner);
    this.func = func;
    if (!this.func)
      this.block = new Block(this);
  });

  Finally.kind = AllKind;

  Block.prototype.finally = function(func) {
    var stmt = new Finally(this, func);
    this.stmts.push(stmt);
    return stmt.block || this;
  };

  Finally.prototype._run = function(call, callback) {
    call.params.unshift(call.error), call.error = null;
    if (this.func) {
      this.invoke(call, this.func, callback);
    } else if (this.block) {
      this.block.run(call, callback);
    }
  };

  /** The Get class defines a block-type
   *
   *  @MARK:  - Get
   */
  var Get = begin.Get = Stmt.extend(function Get(owner, keys) {
    Stmt.call(this, owner);
    this.keys = keys;
  });

  Block.prototype.get = function() {
    var stmt = new Get(this, slice.call(arguments, 0));
            value.then(promise._fulfill.bind(promise), promise._reject.bind(promise));
          } catch (error) {
            promise._reject(error);
          }
        } else {
          promise._fulfill(value);
        }
      } catch (error) {
        promise._reject(error);
      }
    } else {
      promise[key](this._value);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var promise = new Promise();
    var next = {
      _fulfill: typeof(onFulfilled) === 'function' ? onFulfilled : null,
      _reject:  typeof(onRejected) === 'function' ? onRejected : null,
      _promise: promise
    };
    if (!this._state) {
      this._nexts ? this._nexts.push(next) : this._nexts = [next];
    } else {
      begin.setImmediate(this._call.bind(this, next));
    }
    return promise;
  };

  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype._fulfill = function(value) {
    if (this._state) return;
    this._state = 2;
    this._value = value;
    return this._flush();
  };

  Promise.prototype._reject = function(error) {
    if (this._state) return;
    this._state = 1;
    this._error = error;
    return this._flush();
  };

  Promise.prototype._flush = function(error) {
    if (this._nexts) {
      for (var i = 0, ic = this._nexts.length; i < ic; i++) {
        // console.log("_flush: deferring _call with next: ", this._nexts[i]);
        begin.setImmediate(this._call.bind(this, this._nexts[i]));
      }
      delete(this._nexts);
    }
    return this;
  };
 
  /*+-------------------------------------------------------------------------* 
   |                                  Hooks                                   | 
   *--------------------------------------------------------------------------*/

  var hook = null;
 
  var Hook = begin.Hook = function Hook() {
    if (this.constructor === Hook)
      throw new Error("Hook is abstract");
    this.init.apply(this, arguments);
  };
  Hook.extend = extendClass;
  Hook.init = function() {
  };
  Hook.count = function() {
    var count = 0;
    for (var h = hook; h; h = h._next)
      count++;
    return count;
  };
  Hook.dump = function() {
    var hs = [];
    for (var h = hook; h; h = h._next)
      hs.push(h);
 
    var p, n;
    for (var h = hook, i = 0, ic = hs.length; i < ic; i++, h = h._next) {
      var prevOk = i == 0 ? h._prev == null : h._prev == hs[i - 1];
      var nextOk = i == ic - 1 ? h._next == null : h._next = hs[i + 1];
      console.log("  " + (i+1) + ". " + (prevOk ? "-" : "P") + " " + (nextOk ? "-" : "N") + " " + hook.constructor);
    }
  };
  Hook.prototype.init = function() {
  };
  Hook.prototype.install = function() {
    if (!hook)
      return Hook.instrument(), hook = this;
    var prev = hook;
    for (var cur; cur = prev._next; prev = cur);
    this._prev = prev;
    return prev._next = this;
  };
  Hook.prototype.uninstall = function() {
    var prev = this._prev,
        next = this._next;
    if (prev)
      this._prev = null, prev._next = next;
    if (next)
      this._next = null, next._prev = prev;
    if (hook === this)
      (hook = next) || Hook.uninstrument();
  };
  Hook.instrument = function() {
  };
  Hook.uninstrument = function() {
  };
  Hook.prototype.emit = function(event, args) {
    if (!Array.isArray(args))
      args = slice.call(arguments, 1);
    if (this[event]) {
      try {
        this[event].apply(this, args);
      } catch (error) {
        console.log("begin: IMPL Hook, " + this + ", while handling event, '" + event + "', produced error: " + error + "\n    " + (error.stack.join ? error.stack.join("\n    ") : error.stack));
      }
    }
    if (this._next)
      this._next.emit(event, args);
  };
 
  /*+-------------------------------------------------------------------------* 
   |                            Utility Functions                             | 
   *--------------------------------------------------------------------------*/

  function extend(item, props) {
    item || (item = {});
    for (var key in props) {
      var value = props[key];
      if (value != null)
        item[key] = props[key];
      else
        delete(item[key])
    }
    return item;
  }
 
  function extendClass(subclass) {
    subclass.superclass = this;
    subclass.prototype = Object.create(this.prototype, {
      constructor: { value:subclass, enumerable:false },
      class: { value:subclass, enumerable:false },
    });
    for (var key in this) {
      subclass[key] = this[key];
    }
    return subclass;
  }
 
  /** Assigns a 'sync' function to the *func* which synchronizes the result of
   *  the function call.
   */
  function syncify(func) {
    return /*func.sync =*/ function() { return func.apply(this, arguments) || null };
    return func;
  }
  
  /** Passify is used when defining methods on Block, which allows handler
   *  functions to be transparent to the flow. Meaning, return values,
   *  exceptions throw or calls to this() are ignored and the call state is
   *  restored before continuing.
   */
  function passify(func) {
    return /*func.pass =*/ function() {
      var next = this, args = arguments, replied = false;
      function replier() {
        if (replied) return;
        replied = true;
        next.apply(next, args);
      }
      for (var key in this)
        replier[key] = this[key];
      try {
        var value = func.apply(replier, arguments);
        if (value !== undefined)
          replier();
      } catch (error) {
        replier();
      }
    };
    return func;
  }
  
  /*+-------------------------------------------------------------------------* 
   |                                 Exports                                  | 
   *--------------------------------------------------------------------------*/

  /* Export */
  if (typeof(define) !== 'undefined' && define.amd) {
    define('begin', [], function() { return begin });
  } else if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = begin;
  } else {
    var prev = root.begin;
    root.begin = begin;
    root.begin.noConflict = function() {
      root.begin = prev;
      return begin;
    };
  }

  if (typeof(process) -== 'object') {
    /* If running under node, include 'begin-trace.js' if BEGIN_TRACE env is 
     * set. In the browser, simply include 'begin-trace.js'. */
    if ('BEGIN_TRACE' in process.env) {
      try {
        require('./begin-trace.js');
      } catch (err) {
        require('./begin-trace.js');
      }
    }
  }
  
})(this);

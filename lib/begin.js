/* 
 * begin.js
 * 
 * Copyright (c) <YEAR>, <OWNER>
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
 
(function() {
  "use strict";
  
  /** Quick and dirty class definition.
   *
   *  @MARK:  - Class
   */
  var ignores = { k:/^(define|class|klass|className|superclass|subclasses|meta|init)$/, i:/^(class|klass)$|^__/ }, defn = false;
  function Class() {};
  Class.define = function(props, defs, opts) {
    var isClass = typeof(props) === 'function', force = opts && opts.force;
// var klass = typeof(props) === 'function' ? props : props.class;
    for (var key in defs) {
      if (!force && ignores[isClass ? 'k' : 'i'].test(key)) continue;
      var def = defs[key], prop = props[key];
      if (def === Class.define || props.superclass && key == 'init') continue;
      var override = typeof(prop) === 'function' && !prop.superclass && typeof(def) === 'function' && !def.superclass;
      props[key] = override ? wrap(def, prop) : def;
if (typeof(props[key]) == 'function') props[key].klass = props.class || props, props[key].type = props.klass ? '-' : '+', props[key].methodName = key;
    }
  };
  Class.extend = function(name, insProps, clsProps) {
    var Subclass = function() { if (defn) return; this.init && this.init.apply(this, arguments) }, subproto;
    Class.define(Subclass, {className:name, superclass:this, meta:{}, subclasses:[]}, {force:true});
    defn = true, subproto = Subclass.prototype = new this(), defn = false;
    Class.define(subproto, {class:Subclass, klass:Subclass}, {force:true});
    Class.define(Subclass, this);
    Class.define(Subclass, clsProps);
    Class.define(subproto, insProps);
    if (Subclass.init) Subclass.init();
    if (this.didExtend) this.didExtend(Subclass);
    return Subclass;
  };
  Class.className = 'Class', Class.superclass = null,
  Class.define(Class, {
    toString:function() { return this.className },
  })
  Class.define(Class.prototype, {
    init:function() {},
    toString:function() { return this.class.className + '()' },
  })
  function wrap(method, next) {
    return function() {
      var old = this._super;
      try {
        this._super = next;
        return method.apply(this, arguments);
      } finally {
        old ? this._super = old : delete(this._super);
      }
    };
  }
  
  var ErrKind = 1,
      ArgKind = 2,
      AllKind = 3;
  
  /*
   * MARK: - begin()
   */
  function begin(context) {
    return new Block(null, context);
  }
  
  begin.setImmediate = setImmediate;
  
  /*
   * MARK: - Stmt
   */
  var Stmt = begin.Stmt = Class.extend('Stmt', {
  
    init: function(owner) { // MARK: -init()
      this._super();
      this.owner = owner;
    },
    
    /** Runs a statement with the given array of *args* where the first item is
     *  an error or undefined or null and the remaining items are parameters.
     *  The statement is run within a *context* of properties used for each
     *  field.
     *  
     *  The *callback(args)* is called upon completion of the statement, called
     *  with a single required argument, an array or arguments object, where the
     *  first item is an optional error.
     *  
     *  @param  args The statement input arguments ({array}, required)
     *  @param  context The context ({object}, required)
     *  @param  callback A completion callback ({function(args)}, optional)
     *  @since  1.0
     *  @MARK:  -run()
     */
    run: null /*function(args, context, callback) {
      callback(args);
    }*/,
    
    /** Invokes the function, *func*, with the given *args* either synchronously
     *  or asynchronously. The function returns a non-undefined value or throws
     *  an error before return, the function is considered to have executed
     *  synchronously. Otherwise, the function is considered to be asynchronous
     *  and must cause `this` to be called with arguments `this(error, ...)`.
     *  
     *  The *callback(args)* is called when the invocation is complete with a
     *  single required argument, an array or arguments object, where the first
     *  item is an optional error.
     *  
     *  @param  func The function ({function}, required)
     *  @param  args An array of arguments ({array}, optional)
     *  @param  context The context properties ({object}, optional)
     *  @param  callback A completion callback ({function(err,..)}, optional)
     *  @since  1.0
     *  @MARK:  invoke()
     */
    invoke: function(func, args, context, callback) {
      if (!func) throw new Error("Function required");
      if (!callback) throw new Error("Callback required");
      if (typeof(func) !== 'function')
        return callback([null, func]);

      /* Creates the replier function, `this` */
      var synchronous = true, replied = false;
      function replier(error) {
        if (replied) {
          console.log("\x1b[32mAlready replied\x1b[0m");
          return;
        }
        replied = true;
        if (context) {
          for (var key in replier) context[key] = replier[key];
        }
        var reply = arguments;
        if (synchronous) {
          process.nextTick(function next() {
            callback(reply);
          });
        } else {
          callback(reply);
        }
      }
      if (context) {
        for (var key in context) replier[key] = context[key];
      }
      
      try {
        var result = func.apply(replier, args);
        if (result !== undefined)
          replier(null, result);
      } catch (error) {
        replier(error);
      } finally {
        synchronous = false;
      }
    },
  
  }, {
  
    didExtend: function(subclass) { // MARK: +didExtend()
      if (!Block)
        return;
      var defs = subclass.prototype.block;
      if (defs) {
        delete(subclass.prototype.block);
        Class.define(Block.prototype, defs);
      }
    },
    
    kind: ArgKind,
    
  });
  
  /*
   *  MARK: - Block
   */
  var Block = begin.Block = Stmt.extend('Block', {
    
    init: function(owner, options) { // MARK: -init()
      this._super(owner);
      this.stmts = [];
      if (!this.owner) {
        this.options = extend(options, defaultOptions);
        this.context = this.options.context || {};
      }
    },
    begin: function() { // MARK: -begin()
      var stmt = new Block(this);
      this.stmts.push(stmt);
      return stmt;
    },
    end: function(callback) { // MARK: -end()
      var owner = this.owner;
      if (owner && !(owner instanceof Block))
        owner = owner.owner;
      if (!owner && this.options.autorun) {
        if (!callback)
          callback = this.options.done || function(error) {
            if (error)
              throw error;
          };
        var self = this;
        this.run([], this.context, function(reply) {
// console.log("Root reply: " + JSON.stringify(Array.prototype.slice.call(arguments)));
          if (callback || (callback = self.options.done)) {
            callback.apply(null, reply);
          } else if (err) {
            throw err;
          }
        });
      }
      return owner || this;
    },
    run: function(args, context, callback) { // MARK: -run()
      if (this.stmts.length == 0)
        return callback.apply(null, args);
      var self = this;
      var index = 0, count = this.stmts.length;
      (function next(args) {
        var kind = args[0] ? ErrKind : ArgKind;
        var stmt, stmtKind;
        while (index < count) {
          stmt = self.stmts[index++], stmtKind = stmt.class.kind;
          if (stmtKind & kind)
            return stmt.run(args, context, next);
        }
        callback(args);
      })(args);
    },
    
  });

  /** The Step class defines a stmt for a single asynchronous
   *  function.
   *  
   *  @MARK: - Step
   */
  var Step = begin.Step = Stmt.extend('Step', {
  
    block: {
      step: function(func) { // MARK: -block.step()
        if (func) {
          var stmt = new Step(this, func);
          this.stmts.push(stmt);
        }
        return this;
      },
    },
  
    init: function(owner, func) { // MARK: -init()
      this._super(owner);
      this.func = func;
    },
    
    run: function(args, context, callback) { // MARK: -run()
      this.invoke(this.func, slice.call(args, 1), context, callback);
    },
    
  });
  
  /** The Stmt.If class defines a block-type
   *  
   *  @MARK:  - If
   */
  var If = begin.If = Stmt.extend('If', {
  
    block: {
      if: function(cond) { // MARK: -block.if()
        var stmt = new If(this, cond, false);
        this.stmts.push(stmt);
        return stmt.blocks[0];
      },
      unless: function(cond) { // MARK: -block.unless()
        var stmt = new If(this, cond, true);
        this.stmts.push(stmt);
        return stmt.blocks[0];
      },
      elseif: function(cond) { // MARK: -block.elseif()
        return this.owner.elseif(cond);
      },
      else: function() { // MARK: -block.else()
        return this.owner.else();
      },
    },
  
    init: function(owner, cond, negate) { // MARK: -init()
      this._super(owner);
      this.negate = !!negate;
      this.conds = [cond];
      this.blocks = [new Block(this)];
    },
    run: function(args, context, callback) { // MARK: -run()
      var self = this;
      var condArgs = slice.call(args, 1);
      var index = 0, count = this.blocks.length;
      (function next() {
        if (index < count) {
          var cond = self.conds[index],
              block = self.blocks[index];
          index++;
          self.invoke(cond, condArgs, context, function(resultArgs) {
            var error = resultArgs[0], result = resultArgs[1];
            if (error)
              return callback([error]);
            if (!!result == !self.negate) { /* TRUE */
              block.run(args, context, callback);
            } else if (index < count) { /* FALSE, elseif */
              next();
            } else if (self.elseBlock) { /* FALSE, else */
              self.elseBlock.run(args, context, callback);
            } else { /* FALSE, no-else */
              callback([null]);
            }
          });
        } else {
          callback([null]);
        }
      })();
    },
    elseif: function(cond) { // MARK: -elseif()
      var block = new Block(this);
      this.conds.push(cond);
      this.blocks.push(block);
      return block;
    },
    else: function() { // MARK: -else()
      return this.elseBlock = new Block(this);
    },
  
  });
  
  /** The While class defines a block-type
   *  
   *  @MARK:  - While
   */
  var While = begin.While = Stmt.extend('While', {
  
    block: {
      while: function(cond, opts) { // MARK: -block.while()
        var stmt = new While(this, cond, opts);
        this.stmts.push(stmt);
        return stmt.block;
      },
      until: function(cond, opts) { // MARK: -block.util()
        opts || (opts = {});
        opts.negate = true;
        return this.while(cond, opts);
      },
    },
  
    init: function(owner, cond, opts) { // MARK: -init()
      this._super(owner);
      this.opts = opts || {};
      this.cond = cond;
      this.block = new Block(this);
    },
    run: function(args, context, callback) { // MARK: -run()
      var self = this;
      var cond = this.cond,
          condArgs = slice.call(args, 1),
          negate = !!this.opts.negate,
          broke = false;
      var startTime = Date.now(),
          limitTime = this.opts.timeout > 0 ? startTime + this.opts.timeout : 0,
          pauseTime = this.opts.interval || 0;
      (function next() {
        var nextTime = Date.now() + pauseTime;
        self.invoke(cond, condArgs, context, function(condReply) {
          var error = condReply[0], truth = condReply[1];
          if (error)
            return callback([error]);
          if (!!truth == !negate) {
            oldBreak = context.break;
            context.break = function() { broke = true };
            self.block.run(args, context, function(blockReply) {
              var error = blockReply[0];
              if (error)
                return callback(error)
              oldBreak ? context.break = oldBreak : delete(context.break);
              if (broke)
                return callback(args);
              var nextInterval = nextTime - Date.now();
              if (nextInterval > 4)
                setTimeout(next, nextInterval);
              else
                next();
            });
          } else { /* FALSE */
            callback(args);
          }
        });
      })();
    },
    elseif: function(cond) { // MARK: -elseif()
      var block = new Block(this);
      this.conds.push(cond);
      this.blocks.push(block);
      return block;
    },
    else: function() { // MARK: -else()
      return this.elseBlock = new Block(this);
    },
  
  });
  
  /*
   * MARK:  - Each
   */
  var Each = begin.Each = Stmt.extend('Each', {
  
    block: {
      each: function(list, opts) { // MARK: -block.each()
        var stmt = new Each(this, list, opts);
        this.stmts.push(stmt);
        return stmt.block;
      },
    },
    init: function(owner, list, opts) { // MARK: -init()
      this._super(owner);
      this.list = list;
      this.opts = opts || {};
      this.block = new Block(this);
    },
    run: function(args, context, callback) { // MARK: -run()
      var self = this, block = this.block;
      var workers = Math.max(0, this.opts.workers) || Infinity;
      
      /* Get a list of items */
      this.items(args, context, function(itemsReply) {
        var error = itemsReply[0], items = itemsReply[1];
        if (error)
          return callback([error]);
        
        /* Coerce the items: array => [items, indexes], object => [values,
         * keys], number => [indexes, indexes], otherwise empty list */
        items = self.coerce(items);
        var values = items[0], keys = items[1];
        var index = 0, done = 0, count = values.length;
        if (count == 0)
          return callback([null, []]);
        var current = 0, replies = Array(count);
        
        function next() {
          var idx = index++, value = values[idx], key = keys[idx];
          var subcontext = extend({}, context);
          current++;
          block.run([null, value, key], subcontext, function(blockReply) {
            current--, done++;
            replies[idx] = blockReply;
            
            if (index < count) {
              /* pump workers, should be max 1 */
              while (current < workers && index < count) next();
              
            } else if (done >= count) {
              /* Done with all iterations */
              var error, results = Array(count);
              for (var i = 0; i < count; i++) {
                var r = replies[i], err = r[0];
                if (err) {
                  if (!error) {
                    error = err;
                  } else {
                    error.message += '; ' + err.message;
                    (error.errors || (error.errors = [])).push(err);
                  }
                } else {
                  results[i] = r.length == 2 ? r[1] : slice.call(r, 1);
                }
              }
              callback([error, results]);
            }
          });
        }
        /* pump workers */
        while (current < workers && index < count) next();
      });
    },
    items: function(args, context, callback) { // MARK: -items()
      switch (typeof(this.list)) {
        case 'function':
          this.invoke(this.list, slice.call(args, 1), context, callback);
          break;
        case 'undefined':
          return callback([null, args[1]]);
        default:
          return callback([null, this.list]);
      }
    },
    coerce: function(items) { // MARK: -coerce()
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
      // console.log("each.coerce: items=" + JSON.stringify(items) + ", keys=" + JSON.stringify(keys) + ", values=" + JSON.stringify(values));
      return [values, keys];
    },
    
  });
  
  /** The Split class defines a block-type
   *  
   *  @MARK:  - Split
   */
  var Split = begin.Split = Stmt.extend('Split', {
  
    block: {
      split: function() { // MARK: -block.split()
        var stmt = new Split(this);
        stmt.owner = this;
        this.stmts.push(stmt);
        return stmt.block;
      },
    },
  
    run: function(args, context, callback) {
      var self = this;
      var index = 0, count = this.block.stmts.length;
      var replies = [], replyCount = 0;
      for (var i = 0; i < count; i++) {
        (function(i) {
          var stmt = this.block.stmts[i];
          stmt.run(args,  _.clone(context), function() {
            replies[i] = arguments;
            if (++replyCount === count) {
              var error, results = [null];
              for (var r = 0; r < replyCount; r++) {
                var reply = replies[r], e = reply[0];
                if (e) {
                  if (!error) {
                    results[0] = error = e;
                  } else {
                    error.message += '; ' + e.message;
                    (error.errors || (error.errors = [])).push(e);
                  }
                } else {
                  var values = reply.slice(1);
                  results.push(values.length <= 1 ? values[0] : values);
                }
              }
              callback.apply([null, results]);
            }
          });
        })(i);
      }
    },
    
  });
  
  /*
   * MARK: - Catch
   */
  var Catch = begin.Catch = Stmt.extend('Catch', {
  
    block: {
      catch: function(func) { // MARK: -block.catch()
        var stmt = new Catch(this, func);
        this.stmts.push(stmt);
        return stmt.block || this;
      },
    },
  
    init: function(owner, func) { // MARK: -init()
      this._super(owner);
      this.func = func;
      if (!this.func)
        this.block = new Block(this);
    },
    run: function(args, context, callback) { // MARK: -run()
      if (this.func) {
        this.invoke(this.func, args, context, callback);
      } else if (this.block) {
        args = slice.call(args);
        args.splice(0, 0, null);
        this.block.run(args, context, callback);
      }
    },
    
  }, {
    kind: ErrKind,
  });
  
  /** The Stmt.Finally class defines a block-type
   *  
   *  @MARK:  - Finally
   */
  var Finally = begin.Finally = Stmt.extend('Finally', {
    
    block: {
      finally: function(func) {
        var stmt = new Finally(this, func);
        this.stmts.push(stmt);
        return stmt.block || this;
      },
    },
    init: function(owner, func) {
      this._super(owner);
      this.func = func;
      if (!this.func)
        this.block = new Block(this);
    },
    run: function(args, context, callback) {
      if (this.func) {
        this.invoke(this.func, args, context, callback);
      } else if (this.block) {
        this.block.run(args, context, callback);
      }
    },
    
  }, {
    kind: AllKind,
  });
  
  /** The Get class defines a block-type
   *  
   *  @MARK:  - Get
   */
  var Get = begin.Get = Stmt.extend('Get', {
    
    block: {
      get: function(func) {
        var stmt = new Finally(this, func);
        this.stmts.push(stmt);
        return stmt.block || this;
      },
    },
    init: function(owner, keys) {
      this._super(owner);
      this.keys = keys;
    },
    run: function(args, context, callback) {
      var nextArgs = Array(args.length + this.keys.length), index = 0;
      nextArgs[index++] = args[0];
      for (var i = 0, ic = this.keys.length; i < ic; i++) {
        nextArgs[index++] = context[this.keys[i]];
      }
      for (var i = 1, ic = args.length; i < ic; i++) {
        nextArgs[index++] = args[i];
      }
      callback(nextArgs);
    },
    
  }, {
    kind: AllKind,
  });
  
  /** The Set class defines a block-type
   *  
   *  @MARK:  - Set
   */
  var Set = begin.Set = Stmt.extend('Set', {
    
    block: {
      set: function(func) {
        var stmt = new Finally(this, func);
        this.stmts.push(stmt);
        return stmt.block || this;
      },
    },
    init: function(owner, keys) {
      this._super(owner);
      this.keys = keys;
    },
    run: function(args, context, callback) {
      for (var i = 0, ic = this.keys.length; i < ic; i++) {
        context[this.keys[i]] = args[1 + i];
      }
      callback(args);
    },
    
  }, {
    kind: AllKind,
  });
  
  /**
   *
   */
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
  
  var defaultOptions = {
    autorun: true,
  };
  var slice = Array.prototype.slice;

  Class.define(begin, {
//     Stmt:     Stmt,
//     Block:    Block,
//     Catch:    Catch,
//     Finally:  Finally,
//    invoke:   invoke,
    options: function(options) {
      defaultOptions = options || {};
    },
//    plugin:   plugin,
  });
  
  /* Export */
  if (typeof(define) !== 'undefined' && define.amd) {
    define('begin', [], function() { return begin });
  } else if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = begin;
  } else {
    root.begin = begin;
  }
  
  /* Export into underscore.js if exists */
  if (typeof(require)) {
    try {
      var _ = require('underscore.js');
      _.mixin({ begin:begin });
    } catch (error) {
    }
  }
  
})();
/*
 * lib/begin-trace.js
 */

(function(root) {
  'use strict';

  var begin = root.begin || require('./begin.js');

  var beginMark = typeof(process) !== 'undefined'
      ? function beginMark() { return process.hrtime() }
      : function beginMark() { return Date.now() };
  var endMark = typeof(process) !== 'undefined'
      ? function endMark(mark) { var time = process.hrtime(mark);
          return (time[0] + time[1] / 1e9) * 1e3 }
      : function endMark(mark) { return Date.now() - mark };

  var Trace = begin.Trace = begin.Hook.extend(function Trace() {
  });

  /** Returns a 2-tuple [file, line] of the first non-library stack frame.
   *
   *  @return a 2-tuple [file, line]
   */
  function firstNonLibFrame() {
    /* Obtain the stack for Node.js. For more information about stacks see
     * https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi */
    if (typeof(window) == 'undefined') {
      var l = Error.stackTraceLimit, p = Error.prepareStackTrace, error = {};
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(error, trace) { return trace };
      Error.captureStackTrace(error, firstNonLibFrame);
      var stack = error.stack;
      Error.stackTraceLimit = l, Error.prepareStackTrace = p;

      for (var i = 0, ic = stack.length; i < ic; i++) {
        var site = stack[i];
        var filename = site.getFileName();
        if (filename.indexOf(__dirname) < 0)
          return [site.getFileName(), site.getLineNumber()];
      }
      return null;
    } else {
      var error = new Error();
      var stack = error.stack.split(/\n/);
      for (var i = 0, ic = stack.length; i < ic; i++) {
        var site = stack[i], match;
        if (match = site.match(/\s*(.*)@(.*?)(?::(\d+)(?::(\d+))?)?/)) {
          if (!match[2].match(/begin(-trace)?.js/))
            return [match[2], match[3]];
        } else if (match = site.match(/ at (.*) \((.*)(?::(\d+)(?::(\d+))?)?\)/)) {
          if (!match[2].match(/begin(-trace)?.js/))
            return [match[2], match[3]];
        } else {
          throw new Error("Unsupported stack: " + site);
        }
      }
      return null;
    }
  }

  /**
   */
  Trace.prototype.onCreateStmt = function(stmt) {
    // console.log("\x1b[33monCreateStmt\x1b[0m stmt=" + stmt);
    // console.log(new Error().stack);

    var site = firstNonLibFrame();
    stmt.__file = site[0];
    stmt.__line = site[1];
    // console.log("Created stmt=" + stmt + ", at " + site.getFileName() + ":" + site.getLineNumber());
  };

  /** Observes that a call is beginning a run.
   *
   *  @param  call The call ({begin.Call}, required)
   *  @since  1.0
   */
  Trace.prototype.onBeginCall = function(call) {
    call._startTime = beginMark();
    // console.log("\x1b[33monBeginCall\x1b[0m call=", call);
  };

  /** Observes that a call is ending a run.
   *
   *  @param  call The call ({begin.Call}, required)
   *  @since  1.0
   */
  Trace.prototype.onEndCall = function(call) {
    var elapsed = endMark(call._startTime);
    // console.log("\x1b[33monEndCall\x1b[0m time=" + elapsed.toFixed(3) + " ms");
    // console.log("\x1b[33monEndCall\x1b[0m time=" + elapsed.toFixed(3) + " ms, call=", call);
  };

  Trace.prototype.onOpenSubcalls = function(call) {
    // console.log("\x1b[33monOpenSubcalls\x1b[0m");
  };

  Trace.prototype.onCloseSubcalls = function(call) {
    // console.log("\x1b[33monCloseSubcalls\x1b[0m");
  };

  Trace.prototype.onBeginSubcall = function(call, subcall) {
    // console.log("\x1b[33monBeginSubcall\x1b[0m");
  };

  Trace.prototype.onEndSubcall = function(call, subcall) {
    // console.log("\x1b[33monEndSubcall\x1b[0m");
  };

  Trace.prototype.onBeginInvoke = function(call, stmt, func, replier) {
    // console.log("\x1b[33monBeginInvoke\x1b[0m call=" + call + ", stmt=" + stmt + ", func=" + func);
    replier.__callTime = beginMark();
  };

  Trace.prototype.onEndInvoke = function(call, stmt, func, replier, args) {
    var e = endMark(replier.__callTime);
    delete(replier.__callTime);
    var file = stmt.__file, line = stmt.__line;
    file = file.slice(file.lastIndexOf('/') + 1);
    // console.log("\x1b[33monEndInvoke\x1b[0m " + e.toFixed(3) + " ms, " + file + ":" + line + ", arg=", args[1]);
    // var site = firstNonLibFrame();
    // console.log("\x1b[33monEndInvoke\x1b[0m " + e.toFixed(3) + " ms, call=" + call + ", stmt=" + stmt + ", func=" + func + ", args=", args, ", site=" + (site ? site.getFileName() + ":" + site.getLineNumber() : new Error().stack));
  };

  Trace.prototype.onEndInvokeDup = function(call, stmt, func) {
    // console.log("\x1b[33monEndInvokeDup\x1b[0m");
  };


  if (typeof(module) !== 'undefined')
    module.exports = Trace;

})(this);

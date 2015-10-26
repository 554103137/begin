/*
 * test/test-utils.js
 */

(function(root) {
  "use strict";
 
  var chai = typeof(root.chai) !== 'undefined' ? root.chai : require('chai'),
      expect = chai.expect,
      assert = chai.assert;

  var utils = {
 
    nextTick: function(fn) {
      if (typeof(process) !== 'undefined')
        return process.nextTick(fn);
      setTimeout(fn, 0);
    },
 
    setImmediate: function(fn) {
      if (typeof(setImmediate) !== 'undefined')
        return setImmediate(fn);
      setTimeout(fn, 0);
    },
 
    beginStopwatch: function() {
      if (typeof(process) === 'undefined')
        return Date.now();
      return process.hrtime();
    },
 
    endStopwatch: function(marker) {
      if (typeof(process) === 'undefined')
        return (Date.now() - marker) / 1e3;
      var time = process.hrtime(marker);
      return (time[0] + time[1] / 1e9) * 1e3;
    },
    
    checkEqual: function(done, expected, message) {
      /*var error = new Error();*/
      Array.isArray(expected) || (expected = [expected]);
      return function(err) {
        if (err) return done(err);
        try {
          var result = Array.prototype.slice.call(arguments, 1);
          assert.deepEqual(expected, result, message /*+ " at " + error.stack*/);
        } catch (err) {
          return done(err);
        }
        done();
      }
    },

    checkThrows: function(done, message) {
      return function(err, result) {
        if (err) return done();
        try {
          assert.throws(function() {}, message);
        } catch (err) {
          return done(err);
        }
        done();
      }
    },

  };
 
  /*+-------------------------------------------------------------------------* 
   |                                 Exports                                  | 
   *--------------------------------------------------------------------------*/

  /* Export */
  if (typeof(define) !== 'undefined' && define.amd) {
    define('utils', [], function() { return utils });
  } else if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = utils;
  } else {
    var prev = root.utils;
    root.utils = utils;
    root.utils.noConflict = function() {
      root.utils = prev;
      return utils;
    };
  }
  
})(this);
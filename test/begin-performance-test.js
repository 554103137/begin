/*
 * test/begin-performance-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

var async = typeof(async) !== 'undefined' ? async : null;

describe("Performance test", function() {

  describe("method", function() {
    this.timeout(60e3);
    
    it("should not be inefficient", function(done) {
    
      function fib1(n, cb) {
        callCount++;
        if (n <= 1)
          return utils.setImmediate(cb.bind(null, null, 1));
        var n1, n2;
        fib1(n - 1, function(err, v) {
          n1 = v;
          if (n2 !== undefined) done();
        });
        fib1(n - 2, function(err, v) {
          n2 = v;
          if (n1 !== undefined) done();
        });
        function done() {
          utils.setImmediate(cb.bind(null, null, n1 + n2));
        }
      }
      
      function fib2(n, cb) {
        callCount++;
        begin().
          if(n <= 1).
            then(function() { return 1 }).
          else().
            split().
              then(function() { fib2(n - 1, this) }).
              then(function() { fib2(n - 2, this) }).
            end().
            then(function(n1, n2) { return n1 + n2 }).
          end().
        end(cb);
      }
      
      function fib3(n, cb) {
        callCount++;
        if (n <= 1)
          return cb(null, 1);
        begin().
          then(function() { utils.nextTick(this) }).
          split().
            then(function() { fib3(n - 1, this) }).
            then(function() { fib3(n - 2, this) }).
          end().
          then(function(n1, n2) { return n1 + n2 }).
        end(cb);
      }
      
      function fib4(n, cb) {
        callCount++;
        if (n <= 1)
          return cb(null, 1);
        var n1, n2;
        return begin().
          then(function() {           fib4(n - 1, this) }).
          then(function(v) { n1 = v;  fib4(n - 2, this) }).
          then(function(v) { n2 = v;  return n1 + n2 }).
        end(cb);
      }
      
      function fib5(n, cb) {
        if (cb == null) throw new Error("Callback required");
        callCount++;
        if (n <= 1)
          // return cb(null, 1);
          return utils.setImmediate(cb.bind(null, null, 1));
        async.parallel(
          [ function(callback) { fib5(n - 1, callback) },
            function(callback) { fib5(n - 2, callback) },
          ],
          function(err, result) { cb(err, result[0] + result[1]) }
        );
      }
      
      var input = 20;
      var startTime, callCount = 0;
      
      begin().
      
        then(function() { utils.nextTick(this) }).
        then(function() {
          startTime = utils.beginStopwatch(), callCount = 0;
          fib1(input, this);
        }).
        then(function(output) {
          var elapsed = utils.endStopwatch(startTime);
          console.log("fib1(" + input + ") = " + output + " in " + elapsed.toFixed(3) + " ms - " + callCount + " calls, " + (callCount / elapsed).toFixed(3) + " calls/ms");
          this.fib1Time = elapsed;
          return null;
        }).
       
        then(function() { utils.nextTick(this) }).
        then(function() {
          startTime = utils.beginStopwatch(), callCount = 0;
          fib2(input, this);
        }).
        then(function(output) {
          var elapsed = utils.endStopwatch(startTime);
          console.log("fib2(" + input + ") = " + output + " in " + elapsed.toFixed(3) + " ms - " + callCount + " calls, " + (callCount / elapsed).toFixed(3) + " calls/ms - " + (elapsed/this.fib1Time).toFixed(1) + "x slower, " + ((elapsed - this.fib1Time) / callCount).toFixed(3) + " ms overhead/call");
          this.fib2Time = elapsed;
          return null;
        }).
       
        then(function() { utils.nextTick(this) }).
        then(function() {
          startTime = utils.beginStopwatch(), callCount = 0;
          fib3(input, this);
        }).
        then(function(output) {
          var elapsed = utils.endStopwatch(startTime);
          console.log("fib3(" + input + ") = " + output + " in " + elapsed.toFixed(3) + " ms - " + callCount + " calls, " + (callCount / elapsed).toFixed(3) + " calls/ms - " + (elapsed/this.fib1Time).toFixed(1) + "x slower, " + ((elapsed - this.fib1Time) / callCount).toFixed(3) + " ms overhead/call");
          this.fib3Time = elapsed;
          return null;
        }).
       
//         then(function() { utils.nextTick(this) }).
//         then(function() {
//           startTime = utils.beginStopwatch(), callCount = 0;
//           return fib4(input);
//         }).
//         then(function(output) {
//           var elapsed = process.hrtime(startTime);
//           elapsed = elapsed[0] * 1e3 + elapsed[1] / 1e6;
//           console.log("fib4(" + input + ") = " + output + " in " + elapsed.toFixed(3) + " ms - " + callCount + " calls, " + (callCount / elapsed).toFixed(3) + " calls/ms - " + (elapsed/this.fib1Time).toFixed(1) + "x slower, " + ((elapsed - this.fib1Time) / callCount).toFixed(3) + " ms overhead/call");
//           this.fib4Time = elapsed;
//           return null;
//         }).
       
//         then(function() { utils.nextTick(this) }).
//         then(function() {
//           startTime = utils.beginStopwatch(), callCount = 0;
//           fib5(input, this);
//         }).
       
        then(function(output) {
          var elapsed = utils.endStopwatch(startTime);
          console.log("fib5(" + input + ") = " + output + " in " + elapsed.toFixed(3) + " ms - " + callCount + " calls, " + (callCount / elapsed).toFixed(3) + " calls/ms - " + (elapsed/this.fib1Time).toFixed(1) + "x slower, " + ((elapsed - this.fib1Time) / callCount).toFixed(3) + " ms overhead/call");
          this.fib5Time = elapsed;
          return null;
        }).
       
      end(done);
      
    });
    
  });

});


/*
 * test/begin-hook-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;
var Trace = typeof(begin.Trace) !== 'undefined' ? begin.Trace : require('../lib/begin-trace.js');

describe("begin.Hook.Trace", function() {

  describe("Creating a trace hook", function() {
  
    it("should work", function(done) {
      new Trace().install();
      var startTime = utils.beginStopwatch();
      begin().
        then(function() { return 1 }).
        each(100).
          then(function(i) {
            this(null, i);
          }).
        end().
      end(function() {
        var e = utils.endStopwatch(startTime);
        console.log("block took: " + e.toFixed(3) + " ms");
        done();
      });
    });
    
  });
  
});


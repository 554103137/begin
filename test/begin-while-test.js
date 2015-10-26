/*
 * test/begin-while-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.While", function() {

  describe("While basics", function() {
    
    it("should work with noop while()", function(done) {
      begin().
        then(function() { return 'yes' }).
        while(function() { return false }).
          then(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    it("should work with looped while()", function(done) {
      var x = 0;
      begin().
        while(function() { return x < 10; }).
          then(function() { x += 1; return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, 10 ));
    });

    it("should work with looped exception", function(done) {
      var x = 0;
      begin().
        while(function() { return x < 10; }).
          then(function() { x += 1; throw new Error("HERE"); }).
        end().
        then(function() { return x }).
      end(utils.checkThrows(done, "should thrown in while()"));
    });
    
  });

});


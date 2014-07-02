/*
 * test/begin-while-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');

var begin = require('../lib/begin.js');
var utils = require('./test-utils.js');

describe("begin.While", function() {

  describe("While basics", function() {
    
    it("should work with noop while()", function(done) {
      begin().
        step(function() { return 'yes' }).
        while(function() { return false }).
          step(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    it("should work with looped while()", function(done) {
      var x = 0;
      begin().
        while(function() { return x < 10; }).
          step(function() { x += 1; return null }).
        end().
        step(function() { return x }).
      end(utils.checkEqual(done, 10 ));
    });
    
  });

});


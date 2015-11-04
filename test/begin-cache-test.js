/*
 * test/begin-cache-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Begin Cache", function() {

  describe("Test", function() {
    
    it("should work", function(done) {
      begin().
        then(function() {
          return true;
        }).
      end(done);
    });
    
  });

});


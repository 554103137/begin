/*
 * test/begin-errors-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Begin", function() {

  describe("Basics", function() {
    
    it("can run one step", function(done) {
      var x = 0;
      begin().
        then(function() { return null }).
        then(function() { throw new Error('Test') }).
        then(function() { x = 1; return null }).
      end(function(err, result) {
        // console.log(arguments);
        if (x !== 0)
          return done(new Error("x should be 0"));
        if (!err)
          return done(new Error("Error should be raised"));
        done();
      });
    });
    
  });

});


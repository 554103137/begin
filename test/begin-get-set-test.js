/*
 * test/begin-get-set-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Get and begin.Set", function() {

  describe("Basics", function() {
    
    it("should be able to get", function(done) {
      begin().
        then(function() {
          this.a = 'A';
          this.b = 'B';
          return null;
        }).
        get('a', 'b').
        then(function(a, b) {
          assert.equal(a, 'A');
          assert.equal(b, 'B');
          return 'yes!';
        }).
      end(utils.checkEqual(done, 'yes!'));
    });
    
    it("should be able to set", function(done) {
      begin().
        then(function() {
          this(null, 'A', 'B');
        }).
        set('a', 'b').
        then(function() {
          assert.equal(this.a, 'A');
          assert.equal(this.b, 'B');
          return 'yes!';
        }).
      end(utils.checkEqual(done, 'yes!'));
    });
    
  });

});


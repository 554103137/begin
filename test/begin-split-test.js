/*
 * test/begin-split-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Split", function() {

  describe("Block steps", function() {
  
    it("works with an empty block", function(done) {
      begin().
      end(utils.checkEqual(done, []));
    });
    
    it("works with a single split", function(done) {
      begin().
        split().
          then(function() { return 'a' }).
        end().
      end(utils.checkEqual(done, ['a']));
    });
    
    it("works with a n-split", function(done) {
      begin().
        split().
          then(function() { return 'a' }).
          then(function() { return 'b' }).
          then(function() { return 'c' }).
        end().
      end(utils.checkEqual(done, ['a', 'b', 'c']));
    });
    
    it("works with an async n-split", function(done) {
      begin().
        split().
          then(function() { setTimeout(this, 200, null, 'A') }).
          then(function() { setTimeout(this, 300, null, 'B') }).
          then(function() { setTimeout(this, 100, null, 'C') }).
        end().
      end(utils.checkEqual(done, ['A', 'B', 'C']));
    });
    
    it("works with an errors", function(done) {
      begin().
        split().
          then(function() { return 'A'; }).
          then(function() { throw new Error('B') }).
          then(function() { throw new Error('C') }).
        end().
//         catch(function(err) {
//           assert.equal(err.message, "B; C");
//           return true;
//         }).
      end(utils.checkThrows(done));
    });
    
  });
  
});


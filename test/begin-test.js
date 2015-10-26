/*
 * test/class-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

// var assert = require('assert');
var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect;

describe("Begin", function() {

  describe("Class works", function() {
    
    it("should work", function() {
      var block = new begin.Block();
      // log('info', "Block: %s", block);
    });
    
  });

  describe("Basics", function() {
    
    it("can run one step", function(done) {
      begin().
        then(function() { return 1 }).
        then(function(x) { return x + 2 }).
        then(function(x) { return x + 3 }).
      end(function(err, result) {
        // console.log("err=" + err + ", result=" + result);
        chai.expect(result).to.equal(6);
//         if (!err && result !== 5) {
//           // log('info', "Args: #yl[%s]", arguments);
//           err = new Error("Result should've been 6 but was " + result);
//         }
        done(err);
      });
    });
    
    it("can work as a promise creator", function() {
      var promise = begin().
        then(function(x) { return x + 1 }).
      end();
    });
    
  });

});


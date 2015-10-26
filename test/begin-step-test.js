/*
 * test/begin-step-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

if (false)
require('ec/lib/debug').
  trace(begin.Stmt).
  trace(begin.Block).
  trace(begin.Step).
  trace(begin.Each).
  trace(begin.Split).
  trace(begin.If).
  trace(begin.Catch).
  trace(begin.Finally).
  toString();

describe("begin.Step", function() {

  describe("Working with step", function() {
  
    it("should work", function(done) {
      begin().
      end(utils.checkEqual(done, []));
    });
    
    describe("Working synchronously", function() {
    
      it("should work with synchronous return 1", function(done) {
        begin().
          then(function() {
            return 1;
          }).
        end(utils.checkEqual(done, 1));
      });
      it("should work with synchronous this(1)", function(done) {
        begin().
          then(function() {
            this(null, 1);
          }).
        end(utils.checkEqual(done, 1));
      });
      it("should work with synchronous this(1, 2, 3)", function(done) {
        begin().
          then(function() {
            this(null, 1, 2, 3);
          }).
        end(utils.checkEqual(done, [1, 2, 3]));
      });
      it("should work with synchronous throw error", function(done) {
        begin().
          then(function() {
            throw new Error('ERROR');
          }).
        end(utils.checkThrows(done));
      });
      it("should work with synchronous this(error)", function(done) {
        begin().
          then(function() {
            this(new Error('ERROR'));
          }).
        end(utils.checkThrows(done));
      });

    });
    
    describe("Working asynchronously", function() {
    
      it("should work with asynchronous this(1)", function(done) {
        begin().
          then(function() {
            var next = this;
            utils.nextTick(function() {
              next(null, 1);
            });
          }).
        end(utils.checkEqual(done, 1));
      });
      it("should work with asynchronous this(1, 2, 3)", function(done) {
        begin().
          then(function() {
            utils.nextTick(this.bind(null, null, 1, 2, 3));
          }).
        end(utils.checkEqual(done, [1, 2, 3]));
      });
      it("should work with asynchronous this(error)", function(done) {
        begin().
          then(function() {
            var next = this;
            utils.nextTick(function() {
              next(new Error('ERROR'));
            });
          }).
        end(utils.checkThrows(done));
      });

    });
    
    describe("Getting results", function() {
      
      it("should pass along values", function(done) {
        begin().
          then(function() {
            return 1;
          }).
          then(function(x) {
            assert.equal(x, 1);
            return x;
          }).
        end(done);
      });
      it("should pass along values in a chain", function(done) {
        begin().
          then(function() {
            return 1;
          }).
          then(function(x) {
            return x + 2;
          }).
          then(function(x) {
            return x + 3;
          }).
          then(function(x) {
            assert.equal(x, 6);
            return x;
          }).
        end(done);
      });

    });
    
  });

});


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

describe("begin.Hook", function() {

  describe("Creating hooks", function() {
  
    it("should not be able to create a Hook instance", function() {
      assert.throws(function() { new begin.Hook() }, null, null, "shouldn't be able create an instanceof begin.Hook");
    });
    it("should be able to create a subclass", function() {
      var TestHook = begin.Hook.extend(function TestHook() {
      });
      var testHook = new TestHook();
    });
    
  });
  
  describe("Installing hooks", function() {
  
    it("should be able to install a hook", function() {
      var events = [];
      assert.equal(begin.Hook.count(), 0, "should have no hooks installed");
      
      /* Create a hook and install it */
      var TestHook = begin.Hook.extend(function TestHook() {
      });
      TestHook.prototype.onCreateStmt = function(stmt) {
        // console.log('onCreateStmt: stmt=' + stmt);
        events.push('onCreateStmt');
      };
      var testHook = new TestHook();
      testHook.install();
      assert.equal(begin.Hook.count(), 1, "should have one hook installed (" + begin.Hook.count() + " hooks)");
      
      begin().
      end();
      
      assert.deepEqual(events, ['onCreateStmt']);
      testHook.uninstall();
      assert.equal(begin.Hook.count(), 0, "should have no hooks installed (" + begin.Hook.count() + " hooks)");
      
    });
    
    it("should be able to install multiple hooks", function() {
      var events = [];
      assert.equal(begin.Hook.count(), 0, "should have no hooks installed (" + begin.Hook.count() + " hooks)");
      
      /* Create and install hook1 */
      var Hook1 = begin.Hook.extend(function Hook1() {
      });
      Hook1.prototype.onCreateStmt = function(stmt) {
        events.push('Hook1.onCreateStmt');
      };
      var hook1 = new Hook1();
      hook1.install();
      assert.equal(begin.Hook.count(), 1, "should have one hook installed (" + begin.Hook.count() + " hooks)");
      
      /* Create and install hook2 */
      var Hook2 = begin.Hook.extend(function Hook2() {
      });
      Hook2.prototype.onCreateStmt = function(stmt) {
        events.push('Hook2.onCreateStmt');
      };
      var hook2 = new Hook2();
      hook2.install();
      assert.equal(begin.Hook.count(), 2, "should have 2 hooks installed (" + begin.Hook.count() + " hooks)");
      
      begin().
      end();
      
      assert.deepEqual(events, ['Hook1.onCreateStmt', 'Hook2.onCreateStmt']);
      hook1.uninstall();
      hook2.uninstall();
      assert.equal(begin.Hook.count(), 0, "should have no hooks installed (" + begin.Hook.count() + " hooks)");
      
    });
    
  });
  
});


/*
 * test/begin-call-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Call", function() {

  describe("Basics", function() {
  
    it("is a class", function() {
      assert.equal(typeof(begin.Call), 'function');
    });
    
    it("can create a call", function() {
      var call = new begin.Call();
      assert.ok(call);
      assert.deepEqual(call.context, {}, "should default to an empty context");
      assert.ok(call.subcalls == null, "subcalls should be empty (" + call.subcalls + ")");
    });
    
  });
  
  describe("Basics", function() {
  
    it("can create subcalls", function() {
      var call = new begin.Call();
      call.context.test1 = 'x';
      assert.ok(call);
      var subcall = call.beginSubcall(null);
      assert.equal(subcall.index, 0, "subcall should have index 0");
      assert.ok(call !== subcall);
      assert.ok(call.context !== subcall.context);
      assert.deepEqual(call.subcalls, [subcall], "subcalls should contain the subcall we just created");
      call.endSubcall(subcall);
      assert.deepEqual(subcall.context, {test1:'x'}, "should be a copy of call context");
      subcall.context.test2 = 'y';
      // console.log("call.subcalls=", call.subcalls);
      assert.deepEqual(call.subcalls, [null], "subcalls should contain the subcall we just created: " + call.subcalls.join(','));
    });
    
    it("can provide subcall results", function() {
      var call = new begin.Call();
      call.set(null, [1]);
      call.context.a = 'x';
      
      var subcall1 = call.beginSubcall();
      assert.equal(call.subcalls.length, 1, "should have 1 subcall");
      assert.equal(subcall1.index, 0, "subcall index should be 0");
      assert.equal(subcall1.error, null, "subcall should have no error");
      assert.deepEqual(subcall1.params, [1], "subcall should keep params (" + JSON.stringify(subcall1.params) + ")");
      assert.ok(call.context !== subcall1.context);
      call.context.a = 'y';
      assert.equal(subcall1.context.a, 'x', "Subcall should have own context");
      
      subcall1.set(null, ['a', 1]);
      call.endSubcall(subcall1);
      
      var subcall2 = call.beginSubcall();
      assert.equal(call.subcalls.length, 2);
      assert.equal(subcall2.index, 1, "subcall index should be 1");
      assert.ok(subcall1 !== subcall2, "");
      assert.equal(subcall2.error, null, "subcall should have no error");
      assert.deepEqual(subcall2.params, [1], "subcall should keep params");
      call.context.a = 'z';
      assert.equal(subcall2.context.a, 'y');
      
      subcall2.set(null, ['b', 2]);
      call.endSubcall(subcall2);
      
      call.commit();
      assert.equal(call.error, null);
      assert.deepEqual(call.params, ['a', 'b']);
      
      // console.log(call);
      
    });
    
  });
  
});


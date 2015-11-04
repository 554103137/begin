/*
 * test/begin-block-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Block", function() {

  describe("Block steps", function() {
  
    it("works with an four-step synchronous success flow", function(done) {
      begin().
        then(function() { this(null, 1) }).
        then(function(x) { this(null, x + 1) }).
        then(function(x) { this(null, x + 1) }).
        then(function(x) { this(null, x + 1) }).
      end(utils.checkEqual(done, [4]));
    });
    it("works with an nested block synchronous success flow", function(done) {
      begin().
        then(function() { this(null, 1) }).
        begin().
          then(function(x) { this(null, x + 10) }).
          then(function(x) { this(null, x + 100) }).
          then(function(x) { this(null, x + 1000) }).
        end().
        then(function(x) { this(null, x + 10000) }).
        then(function(x) { this(null, x + 100000) }).
      end(utils.checkEqual(done, [111111]));
    });
    
  });
  
  describe("Finally", function() {
    
    describe("Basics", function() {
      
      it("should support bare finally()", function(done) {
        var events = [];
        begin().
          finally(function(err, x) { return events }).
        end(utils.checkEqual(done, [[]]));
      });
      it("should support return finally()", function(done) {
        var events = [];
        begin().
          then(function() {       events.push('step:a'); return 'A' }).
          finally(function(e,x) { events.push(fevent(e, x)); this(e, x) }).
          finally(function(e,x) { return events.join(' | ') }).
        end(utils.checkEqual(done, 'step:a | finally:e=,x=A'));
      });
      it("should support step-finally-step", function(done) {
        var events = [];
        begin().
          then(function() {       events.push('step:a'); return 'A' }).
          finally(function(e,x) { events.push(fevent(e, x)); this(e, x) }).
          then(function() {       events.push('step:b'); return 'A' }).
          finally(function() {    return events.join(' | ') }).
        end(utils.checkEqual(done, 'step:a | finally:e=,x=A | step:b'));
      });
      it("should support step-throw-finally-step", function(done) {
        var events = [];
        begin().
          then(function() {       events.push('step:a'); return 'A' }).
          then(function(x) {      events.push('step:b'); throw x + 'B'  }).
          finally(function(e,x) { events.push(fevent(e, x)); return e + 'C' }).
          then(function(x) {      events.push('step:c'); return x + 'D' }).
          finally(function() {    return events.join(' | ') }).
        end(utils.checkEqual(done, 'step:a | step:b | finally:e=AB,x= | step:c'));
      });
      
      function fevent(e, x) {
        return 'finally:e=' + (e || '') + ',x=' + (x || '');
      }
      
    });
    
  });
  
  describe("Catch", function() {
  
    describe("Throws Errors", function() {
      it("should catch a synchronous callback error", function(done) {
        var events = [];
        begin().
          then(function() {       events.push('step:a'); this('ERROR') }).
          catch(function(err) {   events.push('catch:b'); this(err + '-A') }).
          then(function() {       events.push('step:c'); this(null) }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b => undefined'));
      });
      it("should catch a synchronous thrown error", function(done) {
        var events = [];
        begin().
          then(function() {       events.push('step:a'); this('ERROR') }).
          catch(function(err) {   events.push('catch:b'); throw err + '-A' }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b => null'));
      });
      it("should catch an asynchronous error", function(done) {
        begin().
          then(function() { var step = this; setTimeout(function() { step('ERROR') }, 10) }).
          catch(function(err) { return err }).
        end(utils.checkEqual(done, ['ERROR']));
      });
      it("should support catch chains", function(done) {
        var events = [];
        begin().
          then(function() {      events.push('step:a'); this('ERROR') }).
          catch(function(err) { events.push('catch:b'); this(err + '-1') }).
          then(function(x) {     events.push('step:b'); return x + '-2' }).
          catch(function(err) { events.push('catch:c'); this(err + '-3') }).
          then(function(x) {     events.push('step:c'); return x + '-4' }).
          catch(function(err) { events.push('catch:d'); this(null,err+'-5') }).
          then(function(x) {     events.push('step:d'); return x + '-6' }).
          catch(function(err) { events.push('catch:e'); return err + '-7' }).
          then(function(x) {     events.push('step:e'); return x + '-8' }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b | catch:c | catch:d | step:d | step:e => ERROR-1-3-5-6-8'));
      });
    });
    
  });
  
});


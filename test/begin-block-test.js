/*
 * test/begin-block-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');

var begin = require('../lib/begin.js');
var utils = require('./test-utils.js');

describe("begin.Bock", function() {

  describe("Block steps", function() {
  
    it("works with an four-step synchronous success flow", function(done) {
      begin().
        step(function() { this(null, 1) }).
        step(function(x) { this(null, x + 1) }).
        step(function(x) { this(null, x + 1) }).
        step(function(x) { this(null, x + 1) }).
      end(utils.checkEqual(done, [4]));
    });
    it("works with an nested block synchronous success flow", function(done) {
      begin().
        step(function() { this(null, 1) }).
        begin().
          step(function(x) { this(null, x + 10) }).
          step(function(x) { this(null, x + 100) }).
          step(function(x) { this(null, x + 1000) }).
        end().
        step(function(x) { this(null, x + 10000) }).
        step(function(x) { this(null, x + 100000) }).
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
          step(function() {       events.push('step:a'); return 'A' }).
          finally(function(e,x) { events.push(fevent(e, x)); this(e, x) }).
          finally(function(e,x) { return events.join(' | ') }).
        end(utils.checkEqual(done, 'step:a | finally:e=,x=A'));
      });
      it("should support step-finally-step", function(done) {
        var events = [];
        begin().
          step(function() {       events.push('step:a'); return 'A' }).
          finally(function(e,x) { events.push(fevent(e, x)); this(e, x) }).
          step(function() {       events.push('step:b'); return 'A' }).
          finally(function() {    return events.join(' | ') }).
        end(utils.checkEqual(done, 'step:a | finally:e=,x=A | step:b'));
      });
      it("should support step-throw-finally-step", function(done) {
        var events = [];
        begin().
          step(function() {       events.push('step:a'); return 'A' }).
          step(function(x) {      events.push('step:b'); throw x + 'B'  }).
          finally(function(e,x) { events.push(fevent(e, x)); return e + 'C' }).
          step(function(x) {      events.push('step:c'); return x + 'D' }).
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
          step(function() {       events.push('step:a'); this('ERROR') }).
          catch(function(err) {   events.push('catch:b'); this(err + '-A') }).
          step(function() {       events.push('step:c'); this(null) }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b => undefined'));
      });
      it("should catch a synchronous thrown error", function(done) {
        var events = [];
        begin().
          step(function() {       events.push('step:a'); this('ERROR') }).
          catch(function(err) {   events.push('catch:b'); throw err + '-A' }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b => undefined'));
      });
      it("should catch an asynchronous error", function(done) {
        begin().
          step(function() { var step = this; setTimeout(function() { step('ERROR') }, 10) }).
          catch(function(err) { return err }).
        end(utils.checkEqual(done, ['ERROR']));
      });
      it("should support catch chains", function(done) {
        var events = [];
        begin().
          step(function() {     events.push('step:a'); this('ERROR') }).
          catch(function(err) { events.push('catch:b'); this(err + '-1') }).
          step(function(x) {     events.push('step:b'); return x + '-2' }).
          catch(function(err) { events.push('catch:c'); this(err + '-3') }).
          step(function(x) {     events.push('step:c'); return x + '-4' }).
          catch(function(err) { events.push('catch:d'); this(null,err+'-5') }).
          step(function(x) {     events.push('step:d'); return x + '-6' }).
          catch(function(err) { events.push('catch:e'); return err + '-7' }).
          step(function(x) {     events.push('step:e'); return x + '-8' }).
          finally(function(e,x) { return events.join(' | ') + ' => ' + x }).
        end(utils.checkEqual(done, 'step:a | catch:b | catch:c | catch:d | step:d | step:e => ERROR-1-3-5-6-8'));
      });
    });
    
  });
  
});


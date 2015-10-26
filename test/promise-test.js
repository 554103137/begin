/*
 * test/promise-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Promise", function() {

  describe("Basics", function() {
  
    it("should have", function(done) {
      var promise = new begin.Promise(function(res, rej) {
        setTimeout(res, 150, 'a');
      });
      promise.then(function(v) {
        if (v == 'a')
          done();
        else
          done(new Error("Invalid"));
      });
    });
    
    it("should have begin.Promise", function() {
      assert.ok(begin.Promise, "begin.Promise should be defined");
      assert.equal(typeof(begin.Promise), 'function', "begin.Promise should be a class");
    });
    
    it("should be able to call executor", function() {
      var called = false, resolve, reject;
      var promise = new begin.Promise(function(res, rej) {
        called = true;
        resolve = res;
        reject = rej;
      });
      assert.ok(called, "should call the executor");
      assert.ok(typeof(resolve), 'function');
      assert.ok(typeof(reject), 'function');
    });
    
    it("should be able to execute thens", function(done) {
      var promise = begin().
        then(function() { setTimeout(this, 10, null, 'yay!') }).
      end();
      promise.then(function(value) {
        if (value !== 'yay!')
          done(new Error("should've been 'yay!' but was: " + value));
        else
          done(null, value);
      });
      promise.catch(function(error) {
        done(error);
      });
    });

    it("should be able to chain thens", function(done) {
      var promise = begin().
        then(function() { setTimeout(this, 10, null, 'yay!') }).
      end();
      promise.then(function(value) {
        if (value !== 'yay!')
          done(new Error("should've been 'yay!'"));
        else
          done(null, value);
      });
      promise.catch(function(error) {
        done(error);
      });
    });

    it("should be able to execute catches", function(done) {
      var promise = begin().
        then(function() { setTimeout(this, 10, new Error('yay!')) }).
      end();
      promise.then(function(value) {
        done(new Error("should've thrown 'yay!'"));
      });
      promise.catch(function(error) {
        if (error.message == 'yay!')
          done();
        else
          done(error || new Error("what?"));
      });
    });

    it("should be able to have an error", function(done) {
      var promise = begin().
        then(function() {
          setTimeout(this, 100, 1);
        }).
      end();
      assert.ok(promise, "should have created promise");
      assert.ok(!promise.resolved, "should not yet be resolved");
      assert.ok(!promise.fulfilled, "should not yet be fulfilled");
      assert.ok(!promise.rejected, "should not yet be rejected");

//       log('info', "#bcy[Promise: #df[%s] (%s)]", promise, typeof(promise));
//       log('info', "#bcy[Promise keys: #df[%s]]", Object.getOwnPropertyNames(promise));
//       log('info', "#bcy[promise.value: #df[%s]]", promise.value);
//       log('info', "#bcy[promise.error: #df[%s]]", promise.error);
// 
//       var stream;
//       stream.on('line', begin.handler().
//         then(function(line) {
//           //
//         }).
//         catch(function(line) {
//         }).
//       end());
// 
//       setTimeout(function() {
//         try {
//           assert.ok(promise.resolved, "should not yet be resolved");
//           assert.ok(promise.fulfilled, "should not yet be fulfilled");
//           assert.ok(!promise.rejected, "should not yet be rejected");
// 
//           assert.equal(promise.value, 1, "should have value of 1");
//           assert.ok(promise.error == undefined, "should not have an error");
// 
//           log('info', "#bcy[Round 2]");
//           log('info', "#bcy[Promise: #df[%s] (%s)]", promise, typeof(promise));
//           log('info', "#bcy[Promise keys: #df[%s]]", Object.getOwnPropertyNames(promise));
//           log('info', "#bcy[promise.value: #df[%s]]", promise.value);
//           log('info', "#bcy[promise.error: #df[%s]]", promise.error);
//           done();
// 
//         } catch (error) {
//           done(error);
//         }
// 
//       }, 10);

      done();

    });
    
  });

});


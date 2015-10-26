/*
 * test/begin-block-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;
var events = require('events');

describe("begin.Stream", function() {

  describe("Finding streams", function() {
  
    it("supports taking stream from the stream function", function(done) {
      begin().
        stream(function() {
          var stream = new events.EventEmitter();
          setTimeout(function() {
            stream.emit('data', 1);
            stream.emit('close');
          }, 10);
          return stream;
        }).
          then(function(item) { setTimeout(this, 10, null, item) }).
        end().
      end(utils.checkEqual(done, [[1]]));
    });
  
    it("supports taking stream from the stack", function(done) {
      begin().
        then(function() {
          var stream = new events.EventEmitter();
          setTimeout(function() {
            stream.emit('data', 1);
            stream.emit('close');
          }, 10);
          return stream;
        }).
        stream().
          then(function(item) { setTimeout(this, 10, null, item) }).
        end().
      end(utils.checkEqual(done, [[1]]));
    });
  
    it("supports taking stream deferred", function(done) {
      begin().
        stream(function() {
          var stream = new events.EventEmitter();
          setTimeout(function() {
            stream.emit('data', 1);
            stream.emit('close');
          }, 20);
          setTimeout(this, 10, null, stream);
        }).
          then(function(item) { setTimeout(this, 10, null, item) }).
        end().
      end(utils.checkEqual(done, [[1]]));
    });
    
  });

  describe("Working with streams", function() {
  
    it("works with a modeled emitter", function(done) {
      begin().
        stream(function() {
          var interval = 10, timeout = 100;
          var expire = Date.now() + timeout;
          
          var count = 0;
          var stream = new events.EventEmitter();
          var pollTimer = setInterval(function() {
            stream.emit('data', count++);
            if (Date.now() >= expire) {
              // console.log("Closing: " + (Date.now() - expire) + " overage");
              clearInterval(pollTimer), pollTimer = null;
              stream.emit('close');
            }
          }, interval);
          return stream;
        }).
          then(function(i) {
// console.log("Perform iteration: " + i);
            return i;
          }).
        end().
        then(function(results) {
          /* only worry about the first 5 results */
          assert.deepEqual(results.slice(0, 5), [0,1,2,3,4,5,6,7,8,9].slice(0, 5));
          return 'yes!';
        }).
      end(utils.checkEqual(done, ['yes!']));
    });
    
    it("works with a modeled error emitter", function(done) {
      begin().
        stream(function() {
          var interval = 10, timeout = 100;
          var expire = Date.now() + timeout;
          
          var count = 0;
          var stream = new events.EventEmitter();
          var pollTimer = setInterval(function() {
            stream.emit('data', count++);
            if (Date.now() >= expire) {
              // console.log("Closing: " + (Date.now() - expire) + " overage");
              clearInterval(pollTimer), pollTimer = null;
              stream.emit('error', new Error("aborted"));
            }
          }, interval);
          return stream;
        }).
          then(function(i) {
// console.log("Perform iteration: " + i);
            setTimeout(this, 50, null, i);
          }).
        end().
        catch(function(error, results) {
// console.log("Returned with error=" + error + ", results=", results);
          assert.equal(error.message, "aborted");
          assert.deepEqual(results.slice(0, 5), [0,1,2,3,4,5,6,7,8,9].slice(0, 5));
          return 'yes!';
        }).
      end(utils.checkEqual(done, ['yes!']));
    });
    
  });
  
});


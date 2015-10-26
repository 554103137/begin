/*
 * test/begin-each-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Each", function() {

  describe("API", function() {
  
    it("should define begin.Each", function() {
      assert.ok(begin.Each);
    });
    
  });
  
  describe("Each basics", function() {
    
    it("should work with sync literal array", function(done) {
      var x = [];
      begin().
        each([1, 2, 3]).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    it("should work with sync function return array", function(done) {
      var x = [];
      begin().
        each(function() { return [1, 2, 3] }).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    it("should work with sync function callback array", function(done) {
      var x = [];
      begin().
        each(function() { this(null, [1, 2, 3]) }).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    
    it("should work with sync literal object with values", function(done) {
      var x = [];
      begin().
        each({a:1, b:2, c:3}).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    it("should work with sync function return object with values", function(done) {
      var x = [];
      begin().
        each(function() { return {a:1, b:2, c:3} }).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    it("should work with sync function callback object with values", function(done) {
      var x = [];
      begin().
        each(function() { this(null, {a:1, b:2, c:3}) }).
          then(function(i) { return i }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [[1, 2, 3]]));
    });
    
    it("should work with sync literal object with keys", function(done) {
      var x = [];
      begin().
        each({a:1, b:2, c:3}).
          then(function(i, k) { return k }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [['a', 'b', 'c']]));
    });
    it("should work with sync function return object with keys", function(done) {
      var x = [];
      begin().
        each(function() { return {a:1, b:2, c:3} }).
          then(function(i, k) { return k }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [['a', 'b', 'c']]));
    });
    it("should work with sync function callback object with keys", function(done) {
      var x = [];
      begin().
        each(function() { this(null, {a:1, b:2, c:3}) }).
          then(function(i, k) { return k }).
        end().
        then(function(v) { return v }).
      end(utils.checkEqual(done, [['a', 'b', 'c']]));
    });
    
  });
  
  describe("Each edge cases", function() {
    
    it("should work with no args", function(done) {
      var x = [];
      begin().
        each().
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
      end(utils.checkEqual(done, [[]]));
    });
    it("should work with undefined arg", function(done) {
      var x = [];
      begin().
        each(undefined).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
      end(utils.checkEqual(done, [[]]));
    });
    it("should work with null arg", function(done) {
      var x = [];
      begin().
        each(null).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
      end(utils.checkEqual(done, [[]]));
    });
    
  });
  
  describe("Iterating with numbers", function() {
    
    it("should work with number arg", function(done) {
      var x = [];
      begin().
        each(3).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[{i:0,k:0},{i:1,k:1},{i:2,k:2}]]));
    });
    it("should work with zero number arg", function(done) {
      var x = [];
      begin().
        each(0).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[]]));
    });
    it("should work with negative number arg", function(done) {
      var x = [];
      begin().
        each(-3).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[]]));
    });
    it("should work with number return function", function(done) {
      var x = [];
      begin().
        each(function() { return 3 }).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[{i:0,k:0},{i:1,k:1},{i:2,k:2}]]));
    });
    it("should work with number callback function", function(done) {
      var x = [];
      begin().
        each(function() { this(null, 3) }).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[{i:0,k:0},{i:1,k:1},{i:2,k:2}]]));
    });
    it("should work with number async callback function", function(done) {
      var x = [];
      begin().
        each(function() { setTimeout(this.bind(null, null, 3), 10) }).
          then(function(i, k) { x.push({i:i, k:k}); return null }).
        end().
        then(function() { return x }).
      end(utils.checkEqual(done, [[{i:0,k:0},{i:1,k:1},{i:2,k:2}]]));
    });
    
  });
  
  describe("Using workers option {workers:..}", function() {
  
    function testWorkers(count, workers, done) {
      var list = [], wait = 25;
      begin().
        each({workers:workers}, count).
          then(function(id) {
            this.id = id; // record the id index
            this.timeout1 = Math.random() * wait; // wait random < 100ms
            this.timeout2 = wait - this.timeout1; // wait a total of 100ms
            setTimeout(this, this.timeout1);
          }).
          then(function() {
            list.push(this.id);
            setTimeout(this, this.timeout2);
          }).
        end().
        then(function() {
          console.log("      \x1b[30m" + JSON.stringify(list) + "\x1b[0m");
          workers = workers > 0 ? workers : list.length;
          for (var i = 0, ic = list.length; i < ic; i += workers) {
            var r = list[i];
            if (r < i - 1 || r >= i + workers)
              throw new Error("Index list[" + i + "] == " + r + " but should be between [" + i + ", " + (i + workers) + "] (workers=" + workers + ", list=" + JSON.stringify(list) + ")");
          }
          return null;
        }).
      end(done);
    }
    
    it("should work with 1 worker", function(done) {
      this.timeout(10e3);
      testWorkers(50, 1, done);
    });
    it("should work with 2 workers", function(done) {
      this.timeout(10e3);
      testWorkers(50, 2, done);
    });
    it("should work with 5 workers", function(done) {
      this.timeout(10e3);
      testWorkers(50, 5, done);
    });
    it("should work with 10 workers", function(done) {
      this.timeout(10e3);
      testWorkers(50, 10, done);
    });
    it("should work with unlimited workers (0)", function(done) {
      this.timeout(10e3);
      testWorkers(50, 0, done);
    });
    
  });
  
  describe("Performance testing", function() {
    this.timeout(10e3);
    
    var letters = [];
    for (var i = 0; i < 26; i++)
      letters.push(String.fromCharCode('a'.charCodeAt(0) + i));
      
    it("should compare to direct", function(done) {
      var start = utils.beginStopwatch();
      var text = [];
      for (var x = 0; x < letters.length; x++) {
        for (var y = 0; y < letters.length; y++) {
          for (var z = 0; z < letters.length; z++) {
            text.push(letters[x] + letters[y] + letters[z]);
          }
        }
      }
      var time = utils.endStopwatch(start);
      console.log("direct: \x1b[32m" + text.length + " its @ " + time.toFixed(3) + " ms " + (time/text.length*1e3).toFixed(3) + " µs/it\x1b[0m");
      done();
    });
    
    it("should compare to by-hand", function(done) {
      var start = utils.beginStopwatch();
      var text = [];
      for (var x = 0; x < letters.length; x++) {
        for (var y = 0; y < letters.length; y++) {
          for (var z = 0; z < letters.length; z++) {
            text.push(letters[x] + letters[y] + letters[z]);
          }
        }
      }
      var time = utils.endStopwatch(start);
      console.log("coded:  \x1b[32m" + text.length + " its @ " + time.toFixed(3) + " ms " + (time/text.length*1e3).toFixed(3) + " µs/it\x1b[0m");
      done();
    });
    
    it("should compare to version 1", function(done) {
      var start = utils.beginStopwatch();
      var text = [];
      begin().
        each(letters).
          then(function(x) { this.x = x; return null }).
          each(letters).
            then(function(y) { this.y = y; return null }).
            each(letters).
              then(function(z) {
                this.z = z;
                text.push(this.x + this.y + z);
//                 if (this.x + this.y + this.z === 'zzz')
//                   console.log("stack: \n" + new Error().stack);
                return null;
              }).
            end().
          end().
        end().
        then(function() {
          var time = utils.endStopwatch(start);
          console.log("begin:  \x1b[32m" + text.length + " its @ " + time.toFixed(3) + " ms " + (time/text.length*1e3).toFixed(3) + " µs/it\x1b[0m");
          // console.log(text.join(' '));
          return true;
        }).
      end(done);
    });
    
    it("should compare to version 2", function(done) {
      var start = utils.beginStopwatch();
      var text = [];
      var x, y, z;
      begin().
        each(letters).
          then(function(xi) { x = xi; return null }).
          each(letters).
            then(function(yi) { y = yi; return null }).
            each(letters).
              then(function(zi) { z = zi;
                text.push(x + y + z);
//                 if (x + y + z === 'zzz')
//                   console.log("stack: \n" + new Error().stack);
                return null;
              }).
            end().
          end().
        end().
        then(function() {
          var time = utils.endStopwatch(start);
          console.log("begin:  \x1b[32m" + text.length + " its @ " + time.toFixed(3) + " ms " + (time/text.length*1e3).toFixed(3) + " µs/it\x1b[0m");
          // console.log(text.join(' '));
          return true;
        }).
      end(done);
    });
    
  });

});


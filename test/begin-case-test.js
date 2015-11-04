/*
 * test/begin-case-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.Case", function() {

  describe("Ways to resolve control value", function() {
    
    it("should work with literal control value", function(done) {
      begin().
        case(1).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with sync control value", function(done) {
      begin().
        case(function() { return 1 }).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with async control value", function(done) {
      begin().
        case(function() { setTimeout(this, 10, null, 1) }).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with direct promise control value", function(done) {
      var promise = begin().wait(10).then(1).end();
      begin().
        case(promise).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with sync promise control value", function(done) {
      begin().
        case(function() { return begin().wait(10).then(1).end(); }).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with async promise control value", function(done) {
      begin().
        case(function() { begin().wait(10).then(1).end(this); }).
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
    it("should work with previous control value", function(done) {
      begin().
        then(1).
        case().
          when(0).then('A').
          when(1).then('B').
          when(2).then('C').
          else().then('D').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    
  });

  describe("Control value types", function() {
    
    it("should work with string control, string match", function(done) {
      begin().
        case("a").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'A'));
    });
    it("should work with string control, number match", function(done) {
      begin().
        case("200").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'B'));
    });
    it("should work with string control, regexp match", function(done) {
      begin().
        case("c").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'C'));
    });
    it("should work with string control, array matches string", function(done) {
      begin().
        case("x").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'D'));
    });
    it("should work with string control, array matches regexp", function(done) {
      begin().
        case("z").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'D'));
    });
    it("should work with string control, else", function(done) {
      begin().
        case("r").
          when("a").then('A').
          when(200).then('B').
          when(/^C+$/i).then('C').
          when("x", "y", /Z/i).then('D').
          else().then('E').
        end().
      end(utils.checkEqual(done, 'E'));
    });
  
  });
  
  if (typeof(require) !== 'undefined') {
  
    describe("Integrates well", function() {
      
      it("should be support complex", function(done) {
        var dir = '/tmp';
        var fs = require('fs');
        var path = require('path');
        begin().
          each(function() { fs.readdir(dir, this) }).
            then(function(name, index) {
              this.name = name;
              this.path = path.join(dir, name);
              fs.stat(path.join(dir, name), this);
            }).
            set('stat').
            case().
              when(function(stat) { return stat.isDirectory() }).
                then(function() {
                  console.log("D " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isSymbolicLink() }).
                then(function() {
                  console.log("@ " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isBlockDevice() }).
                then(function() {
                  console.log("B " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isCharacterDevice() }).
                then(function() {
                  console.log("C " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isFIFO() }).
                then(function() {
                  console.log("F " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isSocket() }).
                then(function() {
                  console.log("S " + this.path);
                  return null;
                }).
              when(function(stat) { return stat.isFile() }).
                then(function() {
                  console.log("F " + this.path);
                  return null;
                }).
                case(function() { return this.ext = path.extname(this.path) }).
                  when('.log').
                    then(function() {
                      console.log("  (log file)");
                      return null;
                    }).
                  else().
                    then(function() {
                      console.log("  (unsupported file type: " + this.ext + ")");
                      return null;
                    }).
                end().
            end().
          end().
         
        end(done);
      });
      
    });
  
  }
    
});


/*
 * test/class-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');
var ec = require('ec'), _ = ec._, log = ec.log;

var begin = require('../lib/begin.js');

require('ec/lib/debug').
//  trace(SomeClass).
//  trace(require('../lib/some_file.js')).
  toString();

describe("Begin", function() {

  describe("Class works", function() {
    
    it("should work", function() {
      var block = new begin.Block();
      log('info', "Block: %s", block);
    });
    
  });

  describe("Basics", function() {
    
    it("can run one step", function(done) {
      begin().
        step(function() { return 1 }).
        step(function(x) { return x + 2 }).
        step(function(x) { return x + 3 }).
      end(function(err, result) {
        if (!err && result !== 6) {
          log('info', "Args: #yl[%s]", arguments);
          err = new Error("Result should've been 6 but was " + result);
        }
        done(err);
      });
    });
    
  });

});


/*
 * test/begin-errors-test.js
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

  describe("Basics", function() {
    
    it("can run one step", function(done) {
      var x = 0;
      begin().
        step(function() { return null }).
        step(function() { throw new Error('Test') }).
        step(function() { x = 1; return null }).
      end(function(err, result) {
        if (x !== 0)
          return done(new Error("x should be 0"));
        if (!err)
          return done(new Error("Error should be raised"));
        done();
      });
    });
    
  });

});


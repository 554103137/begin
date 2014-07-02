/*
 * test/begin-cache-test.js
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

describe("Begin Cache", function() {

  describe("Test", function() {
    
    it("should work", function(done) {
      _.begin().
        step(function() {
          return true;
        }).
      end(done);
    });
    
  });

});


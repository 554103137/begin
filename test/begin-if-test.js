/*
 * test/begin-if-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');

var begin = require('../lib/begin.js');
var utils = require('./test-utils.js');

describe("begin.If", function() {

  describe("If basics", function() {
    
    it("should work with if-clause", function(done) {
      begin().
        if(function() { return true }).
          step(function() { return 'yes' }).
        else().
          step(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    
    it("should work with if-else", function(done) {
      begin().
        if(function() { return false }).
          step(function() { return 'yes' }).
        else().
          step(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'no'));
    });
    
    it("should work with if-elseif", function(done) {
      begin().
        if(function() { return false }).
          step(function() { return 'yes' }).
        elseif(function() { return true }).
          step(function() { return 'no' }).
        else().
          step(function() { return 'maybe' }).
        end().
      end(utils.checkEqual(done, 'no'));
    });
    
    it("works fine deep clauses", function(done) {
      begin().
        if(function() { return true }).
          if(function() { return true }).
            if(function() { return true }).
              if(function() { return true }).
                if(function() { return true }).
                  step(function() { return 'yes' }).
                end().
              end().
            end().
          end().
        else().
          if(function() { return true }).
            if(function() { return true }).
              if(function() { return true }).
                if(function() { return true }).
                  step(function() { return 'no' }).
                end().
              end().
            end().
          end().
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    
  });

});


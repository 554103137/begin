/*
 * test/begin-if-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin.If", function() {

  describe("If basics", function() {
    
    it("should work with if-clause", function(done) {
      begin().
        if(function() { return true }).
          then(function() { return 'yes' }).
        else().
          then(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    
    it("should work with if-else", function(done) {
      begin().
        if(function() { return false }).
          then(function() { return 'yes' }).
        else().
          then(function() { return 'no' }).
        end().
      end(utils.checkEqual(done, 'no'));
    });
    
    it("should work with if-elseif", function(done) {
      begin().
        if(function() { return false }).
          then(function() { return 'yes' }).
        elseif(function() { return true }).
          then(function() { return 'no' }).
        else().
          then(function() { return 'maybe' }).
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
                  then(function() { return 'yes' }).
                end().
              end().
            end().
          end().
        else().
          if(function() { return true }).
            if(function() { return true }).
              if(function() { return true }).
                if(function() { return true }).
                  then(function() { return 'no' }).
                end().
              end().
            end().
          end().
        end().
      end(utils.checkEqual(done, 'yes'));
    });
    
  });

});


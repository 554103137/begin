/*
 * test/begin-map-reduce-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Map-Reduce", function() {

  describe("Basics", function() {
    
    it.skip("should be able to mapred", function(done) {
      begin().
        map([1, 2, 3]).
          then(function(v) { return v * 10 }).
        end().
        reduce({total:0,count:0}).
          then(function(result, value, index) {
            result.total += value;
            result.count++;
            return null;
          }).
        end().
        finalize().
          then(function(result) {
            result.average = result.count ? result.total / result.count : 0;
            return null;
          }).
        end().
        then(function(map) {
          console.log(map);
          return null;
        }).
      end(utils.checkEqual(done, 'yes!'));
    });
    
  });

});


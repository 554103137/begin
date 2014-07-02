/*
 * test/test-utils.js
 */

var assert = require('assert');

module.exports = {
  
  checkEqual: function(done, expected, message) {
    Array.isArray(expected) || (expected = [expected]);
    return function(err) {
      if (err) return done(err);
      try {
        var result = Array.prototype.slice.call(arguments, 1);
        assert.deepEqual(expected, result, message);
      } catch (err) {
        return done(err);
      }
      done();
    }
  },

  checkThrows: function(done, message) {
    return function(err, result) {
      if (err) return done();
      try {
        assert.throws(function() {}, message);
      } catch (err) {
        return done(err);
      }
      done();
    }
  },
  
};
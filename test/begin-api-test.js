/*
 * test/begin-api-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("begin", function() {

  describe("Using with begin()", function() {

    it("works with begin()", function() {
      var result = begin().
      end();
    });

  });

  describe("Using with begin.promise()", function() {

    it("works with begin.promise()", function() {
      var result = begin.promise().
      end();
    });

  });

  describe("Using with begin.callback()", function() {

    it("works with begin.callback()", function() {
      var result = begin.callback().
      end();
    });

  });

  describe("Using with begin.handler()", function() {

    it("works with begin.handler()", function() {
      var result = begin.handler().
      end();
    });

  });

});

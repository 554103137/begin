/*
 * test/begin-cancel-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Begin cancel()", function() {

  describe("Ca", function() {

    it("should cancel a timeout", function(done) {
      this.timeout(15e3);

      var promise = begin().
        then(function() {
          var timer = setTimeout(this, 10e3);
          this.cancel = function() {
            // console.log("clearing timeout");
            clearTimeout(timer);
            throw new Error("SHOULD SHOW UP IN PROMISE CANCEL");
          };
        }).
        then(function() {
          console.log("Passed");
          throw new Error('FAILED');
        }).
        catch(function(err) {
          console.log("Catch error: " + err);
          if (err.message === 'SUCCESS')
            return null;
          this(err);
        }).
      end(done);

      setTimeout(function() {
        try {
          promise.cancel(new Error('SUCCESS'), function(err) {
            // console.log("promise.cancel(): err=" + err);
          });
        } catch (err) {
          done(err);
        }
      }, 100);

    });

  });

});

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

describe.skip("Begin cancel()", function() {

  it.skip("should cancel a timeout", function(done) {
    this.timeout(5e3);

    var events = [],
        expected = [
          "got then",
          "send cancel",
          "got cancel",
//           "got end(err=main-error)",
          "got promise.cancel(err=null)"
        ];

    var promise = begin().
      then(function() {
        events.push("got then");
        var timer = setTimeout(this, 2e3);
        // Install a cancel method to clear the timer. This will be called later
        // by promise.cancel(..) below
        this.cancel = function() {
          events.push("got cancel");
          clearTimeout(timer);
        };
      }).
      then(function() {
        // Thens should not be called after cancelling
        events.push("shouldn't pass then");
        throw new Error('FAILED');
      }).
      catch(function(err) {
        // Catches should not be called after cancelling
        events.push("shouldn't catch then");
        this(err);
      }).
    end(function(err) {
      // err should be: new Error('main-error')
      events.push("got end(err=" + (err && err.message || null) + ")");
      console.log("end");
    });

    setTimeout(function() {
      events.push("send cancel");
      promise.cancel(new Error('main-error'), function(err) {
        // err should be null
        events.push("got promise.cancel(err=" + (err && err.message || null) + ")");
        // console.log(events);
        // console.log("promise.call", promise.call);
        try {
          expect(events).to.be.deep.equal(expected);
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 25);

  });

  it("should return then cancel's error to promise.cancel()", function(done) {
    /*
     * If a cancel produces an error, like with the following cancel handler
     *
     *     then(function() {
     *       this.cancel = function() { throw new Error('foo')) };
     *     })
     *
     * The 'foo' error will be return to the callback of promise.cancel(..).
     * This allows the cancellation to be recovered.
     */
    this.timeout(5e3);

    var events = [],
        expected = [
          "got then",
          "send cancel",            // sends catchError == null
          "got cancel",             // will throw 'cancel-error'
//          "got end(err=null)",      // gets catchError
          "got promise.cancel(err=cancel-error)" // receives 'cancel-error'
        ];

    var promise = begin().
      then(function() {
        events.push("got then");
        var timer = setTimeout(this, 2e3);
        this.cancel = function() {
          events.push("got cancel");
          clearTimeout(timer);
          throw new Error('cancel-error');
        };
      }).
    end(function(err) {
      // err should be: new Error('main-error')
      events.push("got end(err=" + (err && err.message || null) + ")");
    });

    setTimeout(function() {
      events.push("send cancel");
      promise.cancel(null, function(err) {
        // err should be: new Error('cancel-error')
        events.push("got promise.cancel(err=" + (err && err.message || null) + ")");
        // console.log(events);
        try {
          expect(events).to.be.deep.equal(expected);
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 25);

  });

  it("should return then cancel error to main's end()", function(done) {
    /*
     * If promise.cancel() is called with an error, that error will be passed
     * to the final result of the promise's callbacks and catches.
     *
     *     var promise = begin().
     *       ...
     *     end(function(err) {
     *       // err will be 'bar'
     *     });
     *     promise.cancel(new Error('bar'));
     */
    this.timeout(5e3);

    var events = [],
        expected = [
          "got then",
          "send cancel",            // sends catchError == null
          "got cancel",             // will throw 'cancel-error'
          "got end(err=main-error)", // gets catchError
          "got promise.cancel(err=null)" // receives 'cancel-error'
        ];

    var promise = begin().
      then(function() {
        events.push("got then");
        var timer = setTimeout(this, 2e3);
        this.cancel = function() {
          events.push("got cancel");
          clearTimeout(timer);
        };
      }).
    end(function(err) {
      // err should be: new Error('main-error')
      events.push("got end(err=" + (err && err.message || null) + ")");
    });

    setTimeout(function() {
      events.push("send cancel");
      promise.cancel(new Error('main-error'), function(err) {
        events.push("got promise.cancel(err=" + (err && err.message || null) + ")");
        // console.log(events);
        try {
          expect(events).to.be.deep.equal(expected);
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 25);

  });

  it("should return then cancel error to main's end()", function(done) {
    /*
     * If promise.cancel() is called with an error, that error will be passed
     * to the final result of the promise's callbacks and catches.
     *
     *     var promise = begin().
     *       ...
     *     end(function(err) {
     *       // err will be 'bar'
     *     });
     *     promise.cancel(new Error('bar'));
     */
    this.timeout(5e3);

    var events = [],
        expected = [
          "got then",
          "send cancel",            // sends catchError == null
          "got cancel",             // will throw 'cancel-error'
          "got end(err=main-error)", // gets catchError
          "got promise.cancel(err=null)" // receives 'cancel-error'
        ];

    var promise = begin().
      then(function() {
        events.push("got then");
        var timer = setTimeout(this, 2e3);
      }).
      then(function() {
        console.log("then pass");
        return null;
      }).
    end(function(err) {
      // err should be: new Error('main-error')
      events.push("got end(err=" + (err && err.message || null) + ")");
      console.log("end", events);
    });

    setTimeout(function() {
      events.push("send cancel");
      promise.cancel(new Error('main-error'), function(err) {
        events.push("got promise.cancel(err=" + (err && err.message || null) + ")");
        console.log("promise.cancel", events);
        // console.log(events);
        try {
          expect(events).to.be.deep.equal(expected);
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 25);

  });


  describe("Ca", function() {

    it("should cancel a timeout", function(done) {
      this.timeout(5e3);

      var events = [],
          expected = [
            "got then",
            "send cancel",
            "got cancel",
            "got end(err=main-error)",
            "got promise.cancel(err=cancel-error)"
          ];

      var promise = begin().
        then(function() {
          events.push("got then");
          var timer = setTimeout(this, 2e3);
          this.cancel = function() {
            events.push("got cancel");
            clearTimeout(timer);
            throw new Error("cancel-error");
          };
        }).
        then(function() {
          events.push("got passed then");
          throw new Error('FAILED');
        }).
        catch(function(err) {
          events.push("got caught then");
          this(err);
        }).
      end(function(err) {
        // err should be: new Error('main-error')
        events.push("got end(err=" + (err && err.message) + ")");
      });

      setTimeout(function() {
        events.push("send cancel");
        promise.cancel(new Error('main-error'), function(err) {
          // err should be: new Error('cancel-error')
          events.push("got promise.cancel(err=" + (err && err.message) + ")");
          console.log(events);
          expect(events).to.be.deep.equal(expected);
          done();
        });
      }, 100);

    });

  });

});

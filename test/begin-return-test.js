/*
 * test/begin-return-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../begin.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

describe("Begin returning values", function() {

  it("should support block return using this('return', val)", function(done) {
    var events = [];
    var expected = [
      'got finally(err=return, val=foo)',
      'got end(err=null, val=foo)'
    ];
    begin().
      begin().
        then(function() {
          this('return', 'foo');
        }).
      end().
      then(function(val) {
        events.push("shouldn't get then()");
        return val;
      }).
      catch(function(err) {
        events.push("shouldn't get catch()");
        this(err);
      }).
      finally(function(err, val) {
        events.push("got finally(err=" + err + ", val=" + val + ")");
        this(err, val);
      }).
    end(function(err, val) {
      events.push("got end(err=" + err + ", val=" + val + ")");
      expect(events).to.deep.equal(expected);
      done();
    });
  });

  it("should support block return using throw 'return'", function(done) {
    var events = [];
    var expected = [
      'got finally(err=return, val=null)',
      'got end(err=null, val=null)'
    ];
    begin().
      begin().
        then(function() {
          throw 'return';
        }).
      end().
      then(function(val) {
        events.push("shouldn't get then()");
        return val;
      }).
      catch(function(err) {
        events.push("shouldn't get catch()");
        this(err);
      }).
      finally(function(err, val) {
        events.push("got finally(err=" + err + ", val=" + val + ")");
        this(err, val);
      }).
    end(function(err, val) {
      events.push("got end(err=" + err + ", val=" + val + ")");
      expect(events).to.deep.equal(expected);
      done();
    });
  });

  it.skip("should support while return", function(done) {
    var events = [];
    var expected = [
      "got while then x=1",
      "got while then x=2",
      "got while then x=3",
      "got finally(err=return, val=foo)",
      "got end(err=null, val=foo)"
    ];
    var x = 0;
    begin().
      while(function() { return x++ < 5 }).
        then(function() {
          events.push("got while then x=" + x);
          if (x == 3)
            this('return', 'foo');
          return null;
        }).
      end().
      then(function(val) {
        events.push("shouldn't get then()");
        return val;
      }).
      catch(function(err) {
        events.push("shouldn't get catch()");
        this(err);
      }).
      finally(function(err, val) {
        events.push("got finally(err=" + err + ", val=" + val + ")");
        this(err, val);
      }).
    end(function(err, val) {
      events.push("got end(err=" + err + ", val=" + val + ")");
      expect(events).to.deep.equal(expected);
      done();
    });
  });

});

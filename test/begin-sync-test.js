/*
 * test/begin-sync-test.js
 * 
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var begin = typeof(begin) !== 'undefined' ? begin : require('../lib/begin.js');
var utils = typeof(utils) !== 'undefined' ? utils : require('./test-utils.js');
var chai = typeof(chai) !== 'undefined' ? chai : require('chai'),
    expect = chai.expect,
    assert = chai.assert;

if (false)
require('ec/lib/debug').
  trace(begin.Stmt).
  trace(begin.Block).
  trace(begin.Step).
  trace(begin.Each).
  trace(begin.Split).
  trace(begin.If).
  trace(begin.Catch).
  trace(begin.Finally).
  toString();

describe("begin syncify()", function() {

  it("should work", function(done) {
    begin().
      thenSync(function() {
        this.x = 1;
      }).
      then(function() {
        console.log("this.x", this.x);
        assert.equal(this.x, 1);
        return null;
      }).
    end(utils.checkEqual(done, null));
  });
    
});


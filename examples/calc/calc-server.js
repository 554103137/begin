
var begin = require('../..');

var tcp = require('tcp');

function CalcServer() {
}

CalcServer.prototype.start = function() {
  var self = this;
  if (this._start)
    return this._start;
  return self._start = begin().
    then(self._stop).
    finally.noop(function() {
      self._start = null;
      this.apply(this, arguments);
    }).
  end();

  var self = this;

  return self.__start || (self.__start = begin().
    then(self.__stop).
    finally.sync(function() {
      self.__start = null;

    }).
  end());
};

module.exports = CalcServer;

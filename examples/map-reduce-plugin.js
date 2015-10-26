
var begin = require('..');



// Add the API method to the begin.Block class. It's implementation should
// create the plugin subclass of Stmt.
begin.Block.prototype.map = function(array) {
};
begin.Block.prototype.reduce = function(func) {
  var stmt = new Reduce(this, message);
  this.stmts.push(stmt);
  return this;
};

// Create a subclass of Stmt or one of its subclasses and implement the run()
// method. The run() implementation takes input, if necessary, from the call's
// error and params property and writes to those same properties when complete
// before calling callback().

var Reduce = begin.Stmt.extend(function Reduce(owner, message) {
  begin.Stmt.call(this, owner);
  this.message = message;
});

Reduce.prototype.run = function(call, callback) {
  stdout.write("\x1b[32m" + this.message + "\x1b[0m ");
  stdin.resume();
  stdin.on('data', function(data) {
    call.set(undefined, [data.toString().trim()]);
    callback();
    stdin.pause();
  })
};

/*
 * Reduce test
 */
begin().
  prompt("User name:").
  case().
    when(/y(es)?|t(rue)?/i).
      sync.then().
    when(/n(o)?|f(alse)?/i).
    else().
  end().
  then(function(result) {
    console.log("result: " + result);
    return null;
  }).
end(function() {
  process.exit(0);
});


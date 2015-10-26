
var begin = require('..');

var Case = begin.Case = begin.Stmt.extend(function Case(owner, value) {
  begin.Stmt.call(this, owner);
  this.value = value;
  this.conds = [];
  this.blocks = [];
  this.elseBlock = null;
});

begin.Block.prototype.case = function(value) {
  if (arguments.length == 0)
    value = 'STACK';
  var stmt = new Case(this, value);
  this.stmts.push(stmt);
  return stmt;
};

begin.Block.prototype.when = function(cond) {
  if (!this.owner.when)
    throw new Error("Unexpected .when()");
  return this.owner.when(cond);
};

Case.prototype.when = function(cond) {
  if (arguments.length > 1)
    cond = slice.call(arguments);
  var block = new begin.Block(this);
  this.conds.push(cond);
  this.blocks.push(block);
  return block;
};

Case.prototype.else = function() {
  return this.elseBlock = new begin.Block(this);
};

var When = begin.When = begin.Stmt.extend(function When(owner, cond) {
  begin.Stmt.call(this, owner);
  this.cond = cond;
  this.block = new begin.Block(this);
});

Case.prototype.matches = function(lhs, rhs) {
  console.log("Checking is lhs,", lhs, ", matches rhs: ", rhs);
  if (lhs == rhs) return true;
  if (lhs == null || rhs == null) return false;
  if (Array.isArray(rhs)) {
    for (var i = 0, ic = rhs.length; i < ic; i++) {
      if (this.matches(lhs, rhs[i]))
        return true;
    }
    return false;
  }
  if (typeof(lhs) === 'string' && (rhs instanceof RegExp))
    return console.log("matching lhs against rhs regexp"), lhs.match(rhs);
  if (lhs.getTime && rhs.getTime && lhs.getTime() == rhs.getTime())
    return true;
  return false;
};

Case.prototype.run = function(call, callback) { // MARK: -run()
  var self = this;
  var condArgs = call.params;
  var index = 0, count = this.blocks.length;
  
  /* Invoke the value of the case, which we'll use to match */
  self.invoke(call, this.value, function() {
    if (call.error)
      return callback();
    value = call.params[0];
    Case_next();
// console.log("case value=" + value);
    function Case_next() {
      if (index < count) {
        var cond = self.conds[index], block = self.blocks[index];
        index++;
        call.params.splice(0, call.params.length, value);
        if (typeof(cond) == 'function') {
// console.log("next index=" + index + ", call=" + cond + ", block=" + block + ",call.params=",call.params);
          self.invoke(call, cond, function() {
            if (call.error)
              return callback();
            if (!!call.params[0]) {
              block.run(call, callback);
            } else {
              Case_next();
            }
          });
        } else {
// console.log("next index=" + index + ", cond=" + cond + ", block=" + block + ",call.params=",call.params);
          if (self.matches(value, cond)) {
            block.run(call, callback);
          } else {
            Case_next();
          }
        }
      } else if (self.elseBlock) {
        self.elseBlock.run(call, callback);
      } else {
        callback();
      }
    }
  });
};

begin().
  case(function() { return 'hello' }).
    when('test').
      then.sync(function() { console.log('got test'); }).
    when('other').
      then.sync(function() { console.log('got other'); }).
    when(/h*o$/).
      then.sync(function() { console.log('got /h*o$/'); }).
    when(function(v) { return v == 'test2' }).
      then.sync(function() { console.log('got v == test'); }).
    else().
      then.sync(function() { console.log('got else'); }).
  end().
end(function() {
  process.exit(0);
});


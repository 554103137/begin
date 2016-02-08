(function(root) {

  begin.Block.prototype.jqajax = function(url, opts) {

  };
  begin.Block.prototype.jqget = function(url, opts) {

  };
  begin.Block.prototype.jqpost = function(url, opts) {

  };
  begin.Block.prototype.jqjson = function(url, opts) {
    opts || (opts = {});
    opts.type = 'json';
    var stmt = new JqueryAjax(this, url, opts);
    this.stmts.push(stmt);
    return this;
  };

  var JqueryAjax = begin.Stmt.extend(function JqueryAjax(owner, url, opts) {
    begin.Stmt.call(this, owner);
    this.url = url;
    this.opts = opts;
  });

  JqueryAjax.prototype._run = function(call, callback) {
    $.ajax({
      dataType: null,
      url: url,
      data: data,

      $.getJSON('');

    });
  };

})();

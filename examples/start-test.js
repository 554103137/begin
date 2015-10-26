
var begin = require('../'),
    fs = require('fs'),
    path = require('path');

var url = require('url');
var tcp = require('tcp');
var http = require('http');
var StringDecoder = require('string_decoder').StringDecoder;

/*
 * In this example, we'll set up a stack with the following components:
 *
 *   - Calc server listening on a socket at port 6060 listening for JSON
 *     requests of the format { operator:"add", args:[1, 2] }.
 *   - Calc client implementing a calc('add', [1, 2]) method which calls
 *     the calc server
 *
 *   - Web server listening for calc requests to http://localhost:8080/calc/ 
 *     and forwarding a request to a calc client
 *   - Web client implementing a calc('add', [1, 2]) method which calls the 
 *     web server
 *
 * We'll have test
 */

/*
 * The WebClient class provides a web-based which communicates to a server.
 */
function WebClient(config) {
  this.config = config || {};
  this.httpUrl = url.parse(this.config.http || 'http://localhost:8080/');
}
WebClient.prototype.start = function() {
  var self = this;
  return begin().
    then.sync(function() {
      console.log("WebClient started");
    }).
  end();
};
WebClient.prototype.stop = function() {
  var self = this;
  return begin().
    then.sync(function() {
      console.log("WebClient stopped");
    }).
  end();
};
WebClient.prototype.calculate = function(operator /*, ...*/) {
  var self = this;
  return begin().
    then(function() {
      var data = JSON.stringify({
        operator: operator,
        params: [].slice.call(arguments, 1),
      });
      var req = http.createRequest({
        host:
      });
      req.write(data);
      req.end();
    }).
  end();
};

/*
 * The WebClient class
 */
function WebServer(config) {
  this.config = config || {};
  this.httpdUrl = url.parse(this.config.httpd || 'http://0.0.0.0:8080/');
}
WebServer.prototype.start = function() {
  var self = this;
  return begin().
    /* Start a CalcClient */
    then(function() {
      self.calcClient = new CalcClient({
        tcpd: self.config.calc || 'tcp://localhost:6060/',
      });
      return self.calcClient.start();
    }).
    then(function() {
      self.httpd = httpd.createServer();
      self.httpd.on('error', this);
      self.httpd.on('listen', this.bind(this, null));
      self.httpd.on('request', self.handle.bind(self));
      self.httpd.listen();
    }).
  end();
};
WebServer.prototype.stop = function() {
  var self = this;
  return begin().
    then(function() {
      return self.calcClient.stop();
    }).
  end();
};
WebServer.prototype.handle = function(req, res) {
  var request = {
    url: req.url,
    data: { }
};

/*
 * The CalcClient class
 */
function CalcClient(config) {
  this.config = config || {};
  this.calcUrl = url.parse(this.config.calc || 'tcp://localhost:6060/');
  this.ports = this.config.serverPorts || [6060];
  this.sockets = Array(this.ports.length);
}
CalcClient.prototype.start = function() {
  var self = this;
  return begin().
    /* Start a CalcClient */
    then(function() {
      self.calcClient = new CalcClient({
        tcpd: self.config.calc || 'tcp://localhost:6060/',
      });
      return self.calcClient.start();
    }).
    then(function() {
      self.httpd = httpd.createServer();
      self.httpd.on('error', this);
      self.httpd.on('listen', this.bind(this, null));
      self.httpd.on('request', self.handle.bind(self));
      self.httpd.listen();
    }).
  end();
};
CalcClient.prototype.stop = function() {
  var self = this;
  return begin().
    then(function() {
    }).
  end();
};
CalcClient.prototype.handle = function(req, res) {
  var request = {
    url: req.url,
    data: { },
  };
  return begin().
    retry(10).
      then(function() {
        var index = Math.floor(Math.random() * this.sockets.length);
        var socket = this.sockets[index];
        if (!socket) {
          return socket;
        } else {
          socket = this.sockets[index] = tcp.connect({});
          socket.once('error', this);
          socket.once('connect', this.bind(null, socket));
        }
      }).
    end().
    then(function() {
      socket.
    }).
  end();
};

/*
 * The WebClient class
 */
function CalcServer() {}
CalcServer.prototype.start = function() {
  var self = this;
  return begin().
    then(function() {
      self.parser = new JsonParser(self.handle.bind(self));
      self.tcpd = tcpd.createServer();
      self.tcpd.once('error', this);
      self.tcpd.on('listen', this.bind(this, null));
      self.tcpd.on('accept', self.accept.bind(self));
      self.tcpd.on('data', self.parser.push);
      self.tcpd.listen();
    }).
    then(function() {
      self.tcpd.on('error', function(error) {
        console.log("Had an error: " + error + "\n" + error.stack);
      });
      return null;
    }).
  end();
};
CalcServer.prototype.stop = function() {
  var self = this;
  return begin().
    then(function() {
    }).
  end();
};
CalcServer.prototype.accept = function(socket) {
};
CalcServer.prototype.handle = function(req, res) {
};

/* 
 * The JsonParser class provides a stream delimiter and JSON parser for LF/CRLF
 * separated JSON messages for received data. This is used by the CalcClient and
 * CalcServer to parse messages from each other.
 */
function JsonParser(handler) {
  var buffer = '';
  var decoder = new StringDecoder('utf8');
  this.push = function(chunk) {
    buffer += decoder.write(chunk);
    var parts = buffer.split(/\r?\n/);
    buffer = parts.pop();
    parts.forEach(function(part) { handler(JSON.parse(part)) });
  };
}

/* 
 * Test the servers
 * 
 * Start up a WebServer, CalcServer and a WebClient. Calculate 1 + 1. Stop all
 * of the servers.
 */
var calcServerPorts = [6060, 6061, 6062, 6063, 6064];
var calcServerCount = 5;
var calcRowCount = 5,
    calcColCount = 5;

begin({ calcServers:[], calcResult:[] }).
  then(function() {
    this.webServer = new WebServer({
      httpd: 'http://0.0.0.0:8080/',
      calc: { tcp:'tcp://localhost:6060/', serverPorts:calcServerPorts },
    });
    return this.webServer.start();
  }).
  each(calcServerPorts).
    then(function(port) {
      this.calcServer = new CalcServer({
        tcpd: 'tcp://0.0.0.0:' + port,
      });
      this.calcServers.push(this.calcServer);
      return this.calcServer.start();
    }).
  end().
  then(function() {
    this.webClient = new WebClient({
      http: 'tcp://localhost:8080/',
    });
    return this.webClient.start();
  }).
  
  /* Calculate the grid, asynchronously utilizing all of the calc servers:
   *
   *   0  1  2  3  4
   *   1  2  3  4  5
   *   2  3  4  5  6
   *   3  4  5  6  7
   *   4  5  6  7  8
   */
  each(calcRowCount).set('y').
    then.sync(function(y) {
      this.row = this.calcResult[y] = [];
    }).
    each(calcColCount).set('x').
      then(function() {
        return this.webClient.calc('add', [this.x, this.y]);
            // WebClient.calc() sends an HTTP request to WebServer
              // WebServer.handle() requests the calc from CalcClient
                // CalcClient.request() sends a socket request to CalcServer
                  // CalcServer.handle() calcs the sends result to CalcClient
                // CalcClient.request() returns the response to WebServer
              // WebServer.handle() returns the response to WebClient
            // WebClient.calc() returns the response
      }).
      then.sync(function(r) {
        this.row[this.x] = r;
      }).
    end().
  end().
  
  /* Output the result */
  then.sync(function() {
    console.log("Results:\n");
    this.calcResult.forEach(function(row) {
      var line = row.map(function(v) { return ("  "+v).slice(-3) }).join('');
      console.log("  " + line);
    });
    console.log("");
  }).
  
//   then(function() {
//     return this.webClient.calculate('add', 1, 1);
//         // WebClient.calculate() sends an HTTP request to WebServer
//           // WebServer.handle() requests the calc from CalcClient
//             // CalcClient.request() sends a socket request to CalcServer
//               // CalcServer.handle() calculates the sends result to CalcClient
//             // CalcClient.request() returns the response to WebServer
//           // WebServer.handle() returns the response to WebClient
//         // WebClient.calculate() returns the response
//   }).
//   set('result').
//   then.sync(function(result) {
//     console.log("Result is: " + result);
//   }).
  
  /* Regardless of what happens, stop the stack */
  finally().
    then.sync(function(result) {
      console.log(result);
    }).
    then(function() {
      return this.webClient && this.webClient.stop() || null;
    }).
    get('calcServers').
    each().
      then(function(calcServer) {
        return calcServer.stop();
      }).
    end().
    then(function() {
      return this.webServer && this.webServer.stop() || null;
    }).
    then.sync(function() {
      if (timer)
        clearTimeout(timer);
      return this.calcResult;
    }).
  end().
end();

var timer = setTimeout(function() {}, 60e3);


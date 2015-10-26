
var begin = require('../'),
    fs = require('fs'),
    path = require('path');

var dir = '/var/log';

begin().
  each(function() { fs.readdir(dir, this) }).
    then(function(filename, index) { 
      this.filepath = path.join(dir, filename);
      fs.stat(this.filepath, this);
    }).
    then(function(stat) {
      return { file:this.filepath, size:stat.size };
    }).
  end().
  then(function(files) {
    console.log(files);
        // Outputs:
        // [ { file: '/var/log/CDIS.custom', size: 12 },
        //   { file: '/var/log/DiagnosticMessages', size: 1122 },
        //   { file: '/var/log/accountpolicy.log', size: 90 },
        //   { file: '/var/log/accountpolicy.log.0.gz', size: 191 },
        //   { file: '/var/log/accountpolicy.log.1.gz', size: 424 },
        //   { file: '/var/log/accountpolicy.log.2.gz', size: 202 },
        //   ... ]
    return null;
  }).
end();
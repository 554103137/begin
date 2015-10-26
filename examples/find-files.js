
var begin = require('../'),
    fs = require('fs'),
    path = require('path');

/** Finds all files recursively based on the directory or array of directories
 *  given.
 *
 *  If the given directory or one of the given directories doesn't exist, ENO
 *  
 *  @param  dir A directory path or array of directory paths
 *  @param  filter A filter function (optional)
 *  @return callback A completion callback function, callback(error, files)
 */
function findFiles(dir, filter, callback) {

  var queue = Array.isArray(dir) ? dir : [dir];
  var lineCountByFile = {};
  
  /* Return a promise for the following begin()..end() block. If callback is
   * provided, then last end(callback) call will also call callback(error,
   * files) */
  return begin().
  
    // Dequeue a directory from the queue and set it in the context as 'dir' so
    // that it can be used later
    while(function() { return this.dir = queue.shift() || null }).
    
      // Read the directory asynchronously. fs.readdir() results in an array of
      // file names through which this each() statement will iterate in
      // parallel. If you want to limit the number of files read at any given
      // time, add a 'workers' option. For example, each({workers:10}, ...)
      // would limit to 10 files processed at any given time.
      each({workers:1}, function() { fs.readdir(this.dir, this) }).
      
        // Compose the full file path as set it in the context as 'filename' so
        // that it can be used later and then stat it
        then(function(name) {
          this.filename = path.join(this.dir, name);
          fs.stat(this.filename, this);
        }).
      
        // Set the value returned by fs.stat() as the 'stat' context variable so
        // that it can be used as this.stat.
        set('stat').
      
        // If a filter is provided, ask the filter to approve the file. The
        // filter can operate asynchronously by returning undefined and calling
        // this(err, truey|falsey) or returning a promise
        if(function() { return !filter || filter.call(this, this.filename, this.stat) }).

          if(function() { return this.stat.isDirectory() }).
          
            // If the filename is a directory, enqueue the directory so we can
            // iterate through it later.
            then(function() { queue.push(this.filename); this() }).
            
          elseif(function() { return this.stat.isFile() }).
          
            // If the filename is a file, read the contents of the file
            then(function() {
              fs.readFile(this.filename, 'utf8', this);
            }).
            
            // Count the number of lines in the file contents and return a
            // non-undefined value synchornously
            then(function(data) {
              lineCountByFile[this.filename] = data.split(/\r?\n/).length;
              return null;
            }).
            
          end().
          
        end().
        
        // Catch permissioning errors quietly throw by fs.stat() or
        // fs.readFile().
        catch(function(error) {
          switch (error.code) {
            case 'EACCES':
            case 'UNKNOWN':
              return null; // ignore error
            default:
              this(error); // or 'throw error;'
          }
        }).
          
      end().
      
      // Flow control doesn't reach here until all files in this directory are
      // processed, then returns to the top of the while() loop
      
      // Catch permissioning errors quietly throw by fs.readdir()
      catch(function(error) {
        switch (error.code) {
          case 'EACCES':
          case 'ENOENT':
          case 'ENOTDIR':
            return null; // ignore error
          default:
            this(error); // or 'throw error;'
        }
      }).
        
    end().
    
    // Finally, return the map of line counts by file names
    then(function() { return lineCountByFile }).
    
  end(callback);
}

function fileFilter(filename, stat) {
  return true;
}

findFiles('/tmp', fileFilter, function(error, files) {
  if (error) {
    console.log("Error", error);
  } else {
    console.log("Found files", files);
  }
  process.exit(0);
});

setTimeout(function() {}, 10e3);

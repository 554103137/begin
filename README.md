
# begin

**begin** is a small yet powerful asynchronous flow control library for node and browsers.

```js
	var begin = require('begin');
	
	begin()
	  then(function() { doStep1(this) }).
	  each(function() { return [1, 2, 3] })
		then(function(i) { doSomethingWithItem(i, this) }).
	  end().
	  catch(function(err) { console.log("Error: " + err); this(err) })
	end();
  
```js

    var begin = require('begin');
    var path = require('path');
    var StringDecoder = require('string_decoder').StringDecoder;

    function countLinesInDirectory(dir, callback) {
      var lineCounts = {};
      var queue = [dir];
      return begin().
      
        // Pop the next directory in the queue
        while(function() { return this.dir = queue.shift() }).
        
          // Read the directory 
          each(function() { fs.readdir(this.dir, this) }).
          
            then(function(name) {
              this.name = name;
              this.file = path.join(this.dir, this.name);
              fs.stat(this.file, this);
            }).
            
            case().
            
              /* If this is a directory, then queue the directory */
              when(function() { return this.stat.isDirectory }).
                then(function() {
                  queue.push(this.file);
                  return null;
                }).
              
              /* If this is a file, stream and count the lines */
              when(function() { return this.stat.isFile }).
                then(function() {
                  return countLinesInFile(this.file);
                }).
                then(function(lineCount) {
                  lineCounts[this.filePath] = lineCount;
                  return null;
                }).
                
            end().            
            
            catch(function(err) {
              if (err.code === 'EACCES')
                this(null);
              else
                this(err);
            }).
            
          end().
          
        end().
        
      end(callback);
    }
    
    function countLinesInFile(file, callback) {
      var lineCount = 0;
      var buffer = '';
      var decoder = new StringDecoder('utf8');
      return begin().
        stream(function() { return fs.createReadStream(file, {encoding:'utf8'}) }).
          then(function(data) {
            buffer += decoder.write(data);
            var parts = buffer.split(/\r?\n/);
            buffer = parts.pop();
            lineCount += parts.lenght;
            return null;
          }).
        end().
        then(function() {
          if (buffer)
            lineCount++;
          return lineCount;
        }).
      end();
    }
    
    countLinesInDirectory('/tmp')
      .then(function(lineCounts) {
        console.log(lineCounts);
      });
      
```
	
### <a id="plugin"></a> Plugins
	
**begin** is extensible via plugins. The [begin.plugin()](#plugin) method allows you to define, redefine or remove begin operations as you see fit. The plugin method takes 

	begin.plugin(blockMethods, pluginMethods);
 
Where ***blockMethods*** is an object containing DSL methods added to [blocks](#block), ***pluginMethods*** is an object containing methods for the plugin including an **init** method, which is called when initializaing

	begin.plugin('Wait', {
	  init: function(timeout, func) {
	  	this.timeout = timeout;
	  	this.func = func;
	  },
	  run: function(args, context, callback) {
	    setTimeout(function() {
	      callback.apply(_this, args);
	    }, this.timeout);
	  },
	}, {
	  wait: function(timeout, func) {
	  	var step = new begin.Wait(timeout, func);
	  	this.steps.push(step);
	  	return step;
	  },
	});

	begin.plugin(
	  {
		poll: function(interval, func) {
		  var step = new Poll(this, interval, func);
		  return step;
		},
	  },
	  {
		init: function(interval, func) {
		  this.interval = interval;
		  this.func = func;
		},
		run: function(args, context, callback) {
		  var _this = this;
		  this.invoke(this, this.func, slice.call(args, 1), context, function(err, result) {
			if (err)
			  return callback && callback(err)
			if (result)
			  return callback && callback.apply(_this, args)
			setTimeout(function() {
			  _this.run(args, context, callback);
			}, _this.interval)
		  }
		},
	  },
	)

	var begin = require('begin'),
	    fs = require('fs'),
	    path = require('path');
	
	function countLinesInFiles(dir, callback) {
	  begin().
		// Throw is equivalent to this(err) and return of any
		// non-undefined is equivalent to this(null, result).
		then(function()	   { if (!dir) throw new Error("dir required");
								return true }).
		// Each calls the function asynchronously and iterates in parallel
		each(function()	   { fs.readdir(task.dir, this) }).
		  then(function()	 { fs.readFile(this.file, 'utf8', this) }).
		  then(function(data) { return data.split(/\r\n|\r|\n/).length }).
		  // Catches errors like when fs.readFile() is called for a directory
		  catch(function(err) { return 0 }).
		end().
		// Each results in an array of results for each file
		then(function(counts) { var sum = 0;
								counts.forEach(function(count) { sum += count });
								return sum }).
		finally(function(err, total) {
		  total || (total = 0);
		  console.log("Found err=" + err + " +  total=" + total);
		  this(err, total);
		}).
	  // Return the last value, the sum of line numbers in all files or a
	  // fs.readdir() error if one occurs
	  end(callback);
	}

### Why Yet Another Async Library for Node.js?

There are already several excellent asynchronous libraries out there. Why would we want another one? The primary motivation to create a new async library was a matter of semantics. Often times, when writing asynchronous functions, you want the flexibility to mix both synchronous and asynchronous operations, nest parallel and serial operations, all using the concise semantics that minimize nested callbacks.

Let's take a look an example function and its possible implementations:

	/* Counts the number of lines in each file matching the optional *filter* in
	 * the directory given and returns information to *callback(err, info)*
	 * where *info* is contains the following keys:
	 * 
	 * - `lines` - An object mapping file names to number of lines
	 * - `total` - The total number of lines
	 * - `files` - The total number of files
	 * - `average` - The average number of lines per file
	 * 
	 * The optional *filter* function takes the arguments: `file`, `stat`,
	 * `callback`, where `file` is the file name, `stat` is a fs.Stat for the
	 * file and should call `callback(err, matches)` where `matches` is a truthy
	 * value if the filter includes this file.
	 * 
	 * This function uses *lookupFromCache(stat, callback)* and 
	 * *saveToCache(stat, count, callback)* to use a cache of line counts to 
	 * reduce file I/O.
	 * 
	 * @param dir The directory name @param filter The optional filter function
	 * @param callback The callback function
	 */
	function countLinesInDirectory(dir, filter, callback) {
	  ...
	}

This is what it looks like implemented with **begin** done in 39 lines of code.

	var begin = require('begin'),
		path = require('path');
	
	function countLinesInDirectory(dir, filter, callback) {
	  var result = { files:0, lines:{}, total:0, average:null, errors:{} };
	  begin().
		each(function() { fs.readdir(dir, this) }).
		  then(function(name) {
			this.file = path.join(dir, name);
			fs.stat(this.file, this);
		  }).
		  if(function(stat) {
			this.stat = stat;
			if (!stat.isFile())
			  return false;
			else if (filter)
			  filter(this.file, stat, this)
			else
			  return true;
		  }).
			then(function(stat) { lookupFromCache(stat, this) }).
			if(function(count) { return count < 0 }).
			  then(function() { fs.readFile(this.file, this) }).
			  then(function(data) {
				this.count = data.split(/\r\n|\r|\n/).length;
				saveInCache(this.stat, this.count, this);
			  }).
			  get('count').
			end().
			catch(function(err) { errors[this.file] = err; return -1 }).
			then(function(count) {
			  if (count > 0)
				total += lines[this.file] = count; 
			  result.files++;
			  return true;
			}).
		  end().
		end().
		then(function() {
		  result.average = result.files > 0 ? result.total / result.files : 0;
		  return result;
		}).
	  end(callback);
	}

In contrast, here is an implementation of the function using **async** in 68 lines of code.

	var async = require('async'),
		path = require('path');

	function countLinesInDirectory(dir, filter, callback) {
	  if (typeof(dir) !== 'string')
		return callback && callback(new TypeError('path must be a string'));
	  var result = { files:0, lines:{}, total:0, average:null, errors:{} };
	  async.waterfall([
		function(cb) {
		  fs.readdir(dir, cb);
		},
		function(files, cb) {
		  async.forEach(files, function(name, cb) {
			var file = path.join(dir, name);
			async.waterfall([
			  function(cb) { fs.stat(file, cb) },
			  function(stat, cb) {
				if (!stat.isFile())
				  return cb();
				async.waterfall([
				  function(cb) {
					if (filter)
					  filter(file, stat, cb)
					else
					  cb(null, true)
				  },
				  function(matched, cb) {
					if (matched) {
					  async.waterfall([
						function(cb) {
						  try {
							lookupFromCache(stat, cb)
						  } catch (err) {
							cb(err)
						  }
						},
						function(count, cb) {
						  result.files++;
						  if (count < 0) {
							async.waterfall([
							  function(cb) { fs.readFile(file, 'utf8', cb) },
							  function(data, cb) {
								var count = data.split(/\r\n|\r|\n/).length;
								result.total += result.lines[file] = count;
								saveInCache(stat, count, cb)
							  },
							], cb);
						  } else {
							result.total += result.lines[file] = count;
							cb();
						  }
						}
					  ], cb)
					} else {
					  cb();
					}
				  }
				], cb);
			  },
			], cb);
		  }, cb)
		},
		function() {
		  result.average = result.files > 0 ? result.total / result.files : 0;
		  cb(null, result);
		},
	  ], callback);
	}

This **async** version of `countLinesInDirectory()`, which probably could be improved, calls **async** 6 times, once whenever there is a switch off between iteration and serial operations or when control is handed back to your code to handle conditionals. The **begin** implementation above is calls **begin** just once. This not only makes code more readable but also less error prone. 

The primary issue with using **async**, however, is the same issue when writing asynchronous code without using a library: some asynchronous operations still require nested callbacks. In this example **async** code, callbacks are nested 6-deep (lines 12, 13, 17, 27, 37 and 42). Minimizing nested callbacks is the primary motivation to use an async library. The **begin** implementation above doesn't nest callbacks. 

### Features

* Uses DSL semantics to chain statements
* Supports synchronous and asynchronous statements
* Supports the following 
  * `begin()`…`end()` blocks of steps
  * `then()` statements
  * `if()`…`elseif()`...`else()`...`end()` conditionals 
  * `catch()` and `finally()` error handling
  * `split()` for parallel steps
  * `each()`…`end()` parallel and serial iteration over arrays or objects
  * `while()`…`end()` serial looping
  * `pipeline()`…`end()` step pipelining
  * `wait()` and `poll()` for unconditional or conditional timeouts
  * `on()` for event observation with timeout
  * `get()` and `set()` for working with context variables
  * `map()`, `reduce()` and `finalize()` for calculations
* Supports embedded *blocks* of statements
* Supports cancelling (or aborting) a begin from within callbacks
* Supports `if`, `elseif` and `else` asynchronous conditionals
* Supports asynchronous `each` 
* Supports `catch` and `finally`
* Contextual data via properties on `this`
* No external dependencies
* Lightweight
* Extensible via plugins

### Supporting Cancellation

    var block = begin().
      then(function() {
      	var timer = setTimeout(this, 60e3);
      	this.cancel = function() {
      	  clearInterval(timer);
      	  return true;
      	};
      }).
      then(function() {
        var anotherTimer = setTimeout(this, 60e3);
      }).
      then(function() {
      	console.log("Done");
      	return true;
      }).
    end();
    
    // Then later…
    block.cancel();

If you set the `cancel` function on `this`, the function will be used to cancel the current step or steps. If those current steps aren't cancellable, an error is thrown.


### Statements

- Creating Blocks
  - [begin](#begin) <br/>
	Starts a new block of statements
  - [end](#end) <br/>
	Ends a block of statements
- Evaluating Statements
  - [step](#step) <br/>
	One statement step
  - [if](#if), [elseif](#if), [else](#if) <br/>
	Conditionals
  - [each](#if), [split](#if) <br/>
	Parallel iteration and operations
  - [while](#if), [until](#if) <br/>
	Conditional looping
- Waiting for Timeouts and Events
  - [poll](#if), [wait](#if) <br/>
	Conditional and unconditional timeouts
  - [on](#if), [once](#if) <br/>
	Observing events with timeouts
- Using Context Variables
  - [set](#if), [get](#if) <br/>
	Setting and getting context variables
- Handling Errors
  - [catch](#if) <br/>
	Catching and handling errors
  - [finally](#if) <br/>
	Cleaning up


### How node-begin works

	begin().
	  then(function() {
		fs.readFile('./greeting.txt', 'utf8', this);
	  }).
	  then(function(greeting) {
		if (greeting.length == 0)
		  throw new Error("No greeting");
		return greeting;
	  }).
	end(callback);

**begin** allows you to declare a sequence of steps which may be synchronous or asynchronous depending on how you write the functions you provide. These functions take in the arguments from the results of the previous step and return results to the following step.

There are 4 ways to return results in a function:

1. Call or cause something else to call `this(err)` 
2. Throw an error: `throw err` is equivalent to `this(err)`
3. Call or cause something else to call `this(null, result1, result2, ...)`
4. Return a result other than undefined: `return result` is equivalent to `this(null, result)`

This obviates the need for 

When an error occurs the result all subsequent steps are skipped other than the next `catch` and/or any `finally` steps. See `catch` and `finally` below.

### Synchronous and asynchronous behavior

A begin is executed immediately when you call `end()` on the top-level block. If
all of your steps are synchronous, the begin completes synchronously. The begin 
module doesn't use `process.nextTick(…)` or `setTimeout(…)` to evaluate. This
allows you to bring initial synchronous code, such as setting initial state, inside a **begin** which can benefit from error handling and callback chaining. 

	function doSomeWork(file, callback) {
	  var self = this;
	  begin().
		then(function() {
		  if (self.status === 'working')
			throw new Error('Already working');
		  self.status = 'working';
		  fs.readFile(file, this)
		}).
		then(function(data) {
		  self.processData(data, this)
		}).
		finally(function() {
		  self.status = 'done';
		  return true;
		})
	  end(callback);
	}

In this example, we put the `self.status` checking statements inside the first step. Since the **begin** evaluates immediately when you `end()` the top level block, the `self.status` check is evaluated synchronously. This gives you the benefits of detecting if 

		  if (self.status === 'working')
			throw new Error('Already working');

inside the first step. Since it is synchronous, it gets evaluated before `doSomeWork(…)` returns. 

#### Cancelling or Timing out Begins

Occasionally, you may want to limit the amount of time a **begin** evaluates. You can create a timeout on a **begin** using the `timeout` option, specifying the milliseconds after which the entire **begin** produces an error.

	begin(null, {timeout:1000}).
	  then(function() { doIt(this) }).
	end(callback);

In this example, if `doIt(…)` step takes more than one second, the step results in an error, forwarding the error to `callback`.

You may additionally want to programmatically cancel a **begin** regardless of the steps remaining to be taken. To do this, each step that requires it, define `this.cancel` as a function that works to cancel the step. 

	function doSomeWork(callback) {
	  var self = this;
	  this.work = begin().
		then(function() {
		  doIt(this);
		  this.cancel = function() { stopIt(this) };
		}).
		finally(function() {
		  self.work = null;
		  return true;
		})
	  end();
	}
	function cancel() {
	  if (this.work)
		this.work.cancel();
	}

### Using with underscore.js

If you already use underscore.js throughout your project, node-begin extends 
underscore with a `begin()` function so that you can write your begins like this:

	_.begin().
	  then(function() { ... }).
	end();
  
This way, you'll  only have to `require('begin')` just once in your project to make it available to all of your modules. 

### Context variables

Often times when writing asynchronous functions, you want to pass around state
but end up writing a lot of glue just to pass along a variable.

  _.begin().
	  then(function() { getFile(this) }).
	  then(function(file) {
		var callback = this;
		fs.stat(file, function(err, stat) { callback(err, file, stat) });
	  }).
	  then(function(file, stat) {
		if (!stat.exists) 
		  throw new Error("File, '" + file + "' doesn't exist");
		return file;
	  }).
	end();

Instead, you can add any property you'd like to `this` which will be available
to all subsequent functions. The above begin can be instead written as:

	_.begin().
	  then(function() { getFile(this) }).
	  then(function(file) {
		this.file = file;
		fs.stat(this.file, this);
	  }).
	  then(function(stat) {
		if (!stat.exists) 
		  throw new Error("File, '" + this.file + "' doesn't exist");
		return this.file;
	  }).
	end();
  
There are also `set` and `get` steps that allow you to work with context 
variables. 

	_.begin().
	  then(function() { getFile(this) }).
	  set('file').
	  then(function(file) {
		fs.stat(this.file, this);
	  }).
	  then(function(stat) {
		if (!stat.exists) 
		  throw new Error("File, '" + this.file + "' doesn't exist");
		return this.file;
	  }).
	end();

All steps have access to the contextual variables from prior steps. Steps, such
as `each()` and `split()` that kick off parallel execution get their own 
shallow copy of contextual variables so that they don't clobber each other. 
THis a



	
	begin().
	  // Read in list of files from file-list.txt
	  then(function() { fs.readFile('./file-list.txt', 'utf8', this) }).
	  // Each line is the name of a directory
	  each(function(data) { return data.split(/\r\n|\n/) }).
		// List the directory
		each(function(dir, i) { fs.readdir(dir, this) }).
		  then(function(file) { if ( }).
		end().
		then(function() {
		  for (var i = 0, ic = arguments.length; i < ic; i++)
			
		}).
	  
	  then(function(data) {  }).
	  each(function(data) { return data.split(/\r\n|\n/) }).
		then(function(line, i) { fs.readFile(line, this) }).
		
	  end().
	  then(function() { ... }).
	  catch(function() { ... }).
	end(callback);

### <a id="each"></a> each( [*options*,] *func_or_array* )

	each(function(args, ..) { .. }).
	  /* block taking arguments (item, index) */
	end()
	
	each(array).
	  /* block taking arguments (item, index) */
	end()

If `func_or_array` is an array, the block is iterated in parallel for each item in the array.

If `func_or_array` is a function, the result of the function is taken as such an array. This function follows rules of all step functions:

- Takes as arguments the result of the previous step
- `this` is a callback function
- May be synchronous or asynchronous
  - Should call `this(null, array)` or `return array` with the *array* to iterate
  - Should call `this(err)` or `throw` upon error
- May use or set context variables on `this`

If the *array* is falsy, behavior of `each()` is the same as if *array* were an empty array.

A call to `each()` should be followed by DSL-declared block and balanced with an `end()`. The contained block will be executed once in parallel for each item in the *array*. Since `each()`'s block operates in parallel, each iteration of the block gets its own shallow copy of context variables. If statements in the block sets context variables, they are scoped only to the block. 

The result of `each()` is an array of results. If the block results in multiple return values, they are grouped as an array. For example:
	
	each([1, 2, 3]).
	  then(function(x) { this(null, x*2) }).
	end().
	then(function(result) { console.log(JSON.stringify(result)) })
	// => [2,4,6]

	each([1, 2, 3]).
	  then(function(x) { this(null, x*2, x*2 + 1) }).
	end().
	then(function(result) { console.log(JSON.stringify(result)) })
	// => [[2,3],[4,5],[6,7]]

	each([1, 2, 3]).
	  then(function(x) { if ((x % 2) == 0) return x; else this(null, x, x*x); }).
	end().
	then(function(result) { console.log(JSON.stringify(result)) })
	// => [[1,1],2,[3,9]]

### <a id="step"></a> then(*func*)

	then(function(..) { .. })

Step statements are executed sequentially. This function follows rules of all step functions:

- Takes as arguments the result of the previous step
- `this` is a callback function
- May be synchronous or asynchronous
  - Should call `this(null, result, …)` or `return result` with the result
  - Should call `this(err)` or `throw` upon error
- May use or set context variables on `this`

### <a id="block"></a> begin()…end()

	begin().
	  /* block statements */
	end()

Blocks group a set of statements and executes them sequentially, passing the results of one statement as the arguments to the next. Whenever an error occurs, either as a result of a call to `this(err)` or a `throw`, subsequent normal statements are skipped and the first [catch()](#catch) statement is evaluated, which may throw an error itself, in which case, the next [catch()](#catch) statement is evaluated. 

##### Working with catch() and finally()

[finally()](#finally) statements are always evaluated in order, regardless of whether an error has occurred or not. For example, 

	begin().
	  then(function()	   { console.log('step A'); return true }).
	  finally(function()	{ console.log('finally 1'); return true }).
	  then(function()	   { throw Error() }).
	  then(function()	   { console.log('step B'); return true }).
	  finally(function()	{ console.log('finally 2'); return true }).
	  catch(function(error) { console.log('catch/throw C'); this(error) })
	  finally(function()	{ console.log('finally 3'); return true }).
	  catch(function(error) { console.log('catch D'); this() })
	  finally(function()	{ console.log('finally 4'); return true }).
	end()
	/* 
	 * Outputs:
	 *   step A
	 *   finally 1
	 *   finally 2
	 *   catch/throw C
	 *   finally 3
	 *   catch D
	 *   finally 4
	 */

##### Giving end() a callback

	begin().
	  /* block statements */
	end(callback)

If you provide [end()](#block) with a *callback* function, it is executed as if the *callback* were provided to a [finally()](#finally) appended to the end of the block. This is provided as a convenience for the common use case of passing along errors and results. 

	 function doSomeWork(callback) {
	   begin()
		 /* block statements */
	   end(callback);
	 }


### <a id="stream"></a> stream(*func*)…end()

	stream({}, function() { return stream; }).
	  then(function() { … }).
	  then(function() { … }).
	end()

Streams iterate over data items in an event stream. By default, streams observe the events 'data', 'error' and 'close'.   

### Cancelling

	then(function() {
	  var timer = setTimeout(this, 60e3, null, "test");
	  this.onCancel(function() {
	    clearTimeout(timer);
	    return null;
	  });
	})

The cancel function provides a mechanism to cancel the current step. A block may be cancelled at any time.


### <a id="pipeline"></a> pipeline(*func*)…end()

	pipeline(function() { return array }).
	  then(function() { … }).
	  then(function() { … }).
	  then(function() { … }).
	  then(function() { … }).
	end()

Pipelined block works just like [each()](#each), evaluating a block over each entry in an array or object, except  

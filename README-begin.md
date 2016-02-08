# begin

**begin** is a small yet powerful fluent asynchronous library.

    var begin = require('begin');
    var fs = require('fs');
    var path = require('path');

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
            //   ...etc... ]
        return null;
      }).
    end();

## Features

- `begin()`...`end()` blocks
- `if()`...`elseif()`...`else()`...`end()` asynchronous conditionals and `unless()` negations
- `catch()` and `finally()` statements and blocks
- `split()` or `parallel()` statements
- `each()` array or count iterations with worker limits
- `while()` and `until()` conditional loops
- `stream()`..`end()` for consuming readable streams with worker limits
- Block-scoped variables on `this`
- Multiple Call


> [begin](http://www.google.com/) v1.2 ▸ [case]() ▸ **profile/create**

##### Examples

```js
function test() {
  hello("Test");
}
```

#### Parameters

### case()..when()..else()..end()

**case(** [*control*] **)**.. (**when(** [*func*] **)**.. | )* [**else()**..] **end()** &mdash; Hello  
Creates

- **when(** [*func*] **)**
- **when(** *value* [, *value*]* **)**
- **else()**
- **end()**

Test

    begin().
      case(function() { setTimeout(this, 100, "DEF") }).
        when("ABC").
          then(function() { throw new Error("Invalid input"); }).
        when(/^D[A-Z]{2,}$/, "XYZ").
          then(function() { console.log("Valid input"); return true }).
        else().
          then(function(value) { throw new Error("Unsupported input: " + value); }).
      end().
    end();

The *control* variable may be given as a value, as a promise to the value, as a function returning the value synchronously or asynchronously or via a promise. If no *control* variable is given, then the current value on the stack is given.





### while([*opts*,] *funcOrValue*) <br/> until([*opts*,] *funcOrValue*)

    begin().
      while(function() { setTimeout(this, 100, true) }).
        then(function(value, index) { return { value:value, index:index } }).
      end().
    end();

### each([*opts*,] *funcOrArrayOrObjectOrCount*)

    begin().
      each(function() { setTimeout(this, 100, [0, 1, 2]) }).
        then(function(value, index) { return { value:value, index:index } }).
      end().
      then(function(results) { console.log(results); return null; });
    end();

    begin().
      each(function() { return [0, 1, 2] }).
        then(function(value, index) { return { value:value, index:index } }).
      end().
      then(function(results) { console.log(results); return null; });
    end();

    begin().
      each([0, 1, 2]).
        then(function(value, index) { return { value:value, index:index } }).
      end().
      then(function(results) { console.log(results); return null; });
    end();

##### Kinds of Values

The `each()`..`end()` statement iterates over the following kinds values:

- **Array**, iterates over each calling the statements with `function(item, index)`
- **Object**, iterates over each key value pair with `function(value, key)`
- **Number**, iterates the block the specified number of times
- `null` or `undefined` is considered an empty array
- Any other value is considered a single valued array

##### Sources of Values

Values may be provided to `each()` in one of the following ways

- `each(function() {..})` calls the function to provide the value either directly using return of a non-undefined value or indirectly through a call to `this(error, values)`
- `each(promise)` waits for the promise to resolve
- `each(values)` literal values are may be provided
- `each()` uses the result of the previous statement

#### Context

Each iteration gets a copy of  

#### Result

The result of each iteration is returned an array to the next statement following the each block.

    begin()
      each([1, 2, 3])
        then(function(value) { return value * 10 }).
      end().
      then(function(values) {
        console.log(values);
        return null;
      }).
    end();

would output `[10, 20, 30]`. Note that only the first value is used in the result.


If `opts` is given,

<table>
<tr><td style="vertical-align:top"><b>workers</b></td>
    <td>The number of iterations to run in parallel. If *workers* is non-positive, or if *workers* is not specified, its assumed to be +Infinity, meaning all iterates are run in parallel. For example, if *workers* is specified as 3, only three items from the array are iterated at a time. As items complete, another iteration is kicked off until all items have been processed.</td></tr>
</table>


### Promises

#### Using as a Promise

    var promise = begin.promise().
      then(function() { setTimeout(this, 100, 'Tim') }).
    end();

    promise.then(function(name) {
      console.log("Hello, " + name + "!");  // Outputs: "Hello, Tim!"
    });

Begin can be used to create promises.

#### Working with Promises

    begin().
      then(function() {
        return doSomethingReturningPromise();
      }).
      then(function(value) {
        console.log("value: ", value);
        return null;
      }).
      catch(function(error) {
        console.log("error: ", error);
        throw error;
      }).
    end();

Begin statements plays nice with promises. Any function can return a promise and **begin** will wait for the promise to fulfill or reject before proceeding.

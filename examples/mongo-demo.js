
var begin = require('../begin.js');
var MongoClient = require('mongodb').MongoClient;

/*
 * This example connects to 'mongodb://localhost/test-db', uses two collections
 * 'foo' and 'bar'. It first drops the collections, then create indexes and
 * inserts some dummy data into 'foo'. It streams those docs from 'foo', filters
 * and transforms them into 'bar'.
 *
 * This example shows
 *   - thenSync() when functions are never async
 *   - parallel()..end() for simultaneous tasks
 *   - stream()..end() for use with Readable streams
 *
 * Run with:
 *   $ npm install mongodb
 *   $ node example/mongo-reader.js
 */

var keepalive = setTimeout(function() {}, 10e3);

begin().
  then(function() {
    MongoClient.connect('mongodb://localhost:27017/test-db', this);
  }).

  // Get the collections. The thenSync() can also be written as:
  // then(function() { ...; return null; })
  thenSync(function(db) {
    this.db = db;
    this.fooColl = this.db.collection('foo');
    this.barColl = this.db.collection('bar');
  }).

  // Set up 'foo' and 'bar' in parallel
  parallel().
    // Set up 'foo', drop and recreate index, insert dummy data
    begin().
      then(function() {
        this.fooColl.drop(this);
      }).
      then(function() {
        this.fooColl.ensureIndex('x', {x:1}, this);
      }).
      each(10).
        then(function(val) {
          this.fooColl.insertOne({x:val}, {w:1}, this);
        }).
      end().
    end().
    // Set up 'bar', drop and recreate index
    begin().
      then(function() {
        this.barColl.drop(this);
      }).
      then(function() {
        this.barColl.ensureIndex('y', {y:1}, this);
      }).
    end().
  end().

  // Stream the foo collection, copy and transform every other doc into
  // then bar collection
  stream(function() { return this.fooColl.find().stream() }).
    then(function(doc) {
      if ((doc.x % 2) == 1)
        return null; // skip over even items
      this.barColl.insertOne({ x:doc.x, y:doc.x / 2 }, {w:1}, this);
    }).
  end().

  /* Log all of the bar documents */
  then(function() {
    this.barColl.find().toArray(this);
  }).
  then(function(docs) {
    console.log(docs);
    return null;
  }).

  // When everything's finished, close the db
  then(function() {
    this.db.close(false, this);
  }).

  /* Report */
  finally(function(err, val) {
    if (err)
      console.log("Failed: " + err);
    else
      console.log("Result: " + val);
    clearTimeout(keepalive);
    return null;
  }).
end();

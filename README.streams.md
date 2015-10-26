# Begin Streams

    /* Cats a file in chunks */
    var file;
    begin().
      stream(function() { return fs.createReadStream(file, {encoding:'utf8'}) }).
        then(function(chunk) {
          console.log(chunk);
          return null;
        }).
      end().
      then(function() {
        console.log("Done");
        return null;
      }).
    end();
    
The **stream** statement provides the ability to consume [Readable Streams](https://nodejs.org/api/stream.html#stream_class_stream_readable) or other event emitters with a *close* event, *error* event and *data* event, though a stream statement can use other event names. 

Each *data* item is iterated through the subsequent block until the stream is exhausted or an error is thrown. The stream statement does not end until the stream is closed. 


    var mongodb = require('node-mongodb-native');
    var userIds = [..];
    var usersCollection = ..;
    
    /* This function opens a connection to MongoDB, creates an avatars collection, 
     * converts thumbnails for active users crops and posts them to the web cache 
     * and marks the.
     *
     * @
     */
    function check(callback) {
      begin().
      
        then(function() {
          mongodb.MongoClient.connect('mongodb://localhost/test', this);
        }).
        
        set('db').
        
        then(function() {
          this.users = this.db.collection('users');
          this.avatars = this.db.collection('user.avatars');          
          return this.users.find({status:'active'}, {fields:{avatarId:1}}).stream();
        }).
        
        stream().
          then(function(user) {
            var imagePath = '/var/black/abcdef/';
            fs.readFileStream(imagePath, 'utf8');
          }).
          stream().
          end().
        end().
        
        stream(function() { return usersCollection.find({}).stream() }).
          then(function(user) {
            var name = '/avatars/' + user._id + '.jpg';
            
          }).
        end().
        
      end(callback);
    }




### Using with MongoDB Cursors

    /* Cats a file in chunks */
    var collection;
    begin().
      stream(function() { return collection.find({}).stream() }).
        then(function(doc) {
          console.log("doc: " + JSON.stringify(doc));
          return null;
        }).
      end().
      then(function() {
        console.log("Done finding documents");
        return null;
      }).
    end();

The above gives you an example of how to stream documents from a MongoDB cursor. Alternatively, you may use the listener interface to observe events directly.

    /* Cats a file in chunks */
    var stream = collection.find({}).stream();
    var listener = begin.listener().
      then(function(doc) {
        console.log("doc: " + JSON.stringify(doc));
        return null;
      }).
    end();
    stream.on('data', listener);
    
The listener interface returns a listener function.
# Promise

    /* Create a promise */
    var promise = new Promise().
      then(function() {
        setTimeout(this.bind(this, 12), 1e3);
      }).
    end();
    
    // Output "12" after 1 second
    promise.then(function(value) {
      console.log(value);
    });
    
    
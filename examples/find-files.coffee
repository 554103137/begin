

begin = require('..')


findFiles = (dir, filter, callback) ->

  queue = if Array.isArray(dir) then dir else [dir]
  lineCountByFile = {}
  console.log("queue: " + queue + ", dir: #{dir}")

  begin().
    then((-> console.log("here")), null).
    while(-> this.dir = queue.shift() || null).
      then((-> console.log("dir: #{this.dir}")), null).
      each({workers:1}, -> fs.readdir(this.dir, this)).
        then((name) ->
          this.filename = path.join(this.dir, name)
          fs.stat(this.filename, this)
        ).
      end().
    end().
    then(-> lineCountByFile).
  end(callback)

findFiles('/tmp').
  then((map) ->
    console.log("map:", map)
  )

setTimeout((->return null), 1e3);
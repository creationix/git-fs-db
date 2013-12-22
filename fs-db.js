module.exports = function (platform) {

  var isHash = /^[a-z0-9]{40}$/;
  return fsDb;

  function fsDb(fs) {
    var inflate = platform.inflate;
    var deflate = platform.deflate;

    return {
      get: get,
      set: set,
      has: has,
      del: del,
      keys: keys,
      init: init,
      clear: clear,
    };

    function get(key, callback) {
      if (!callback) return get.bind(this, key);
      if (isHash.test(key)) {
        return fs.read(hashToPath(key), function (err, deflated) {
          if (err) return callback(err);
          return inflate(deflated, callback);
        });
      }
      return fs.read(key, "ascii")(callback);
    }

    function set(key, value, callback) {
      if (!callback) return set.bind(this, key, value);
      if (isHash.test(key)) {
        return deflate(value, function (err, deflated) {
          if (err) return callback(err);
          return write(hashToPath(key), deflated, callback);
        });
      }
      return write(key, value, callback);
    }

    function write(path, data, callback) {
      return mkdirp(dirname(path), function (err) {
        if (err) return callback(err);
        return fs.write(path, data)(callback);
      });
    }

    function del(key, callback) {
      if (!callback) return del.bind(this, key);
      if (isHash.test(key)) {
        return unlink(hashToPath(key), callback);
      }
      return unlink(key, callback);
    }

    function unlink(path, callback) {
      fs.unlink(path, function (err) {
        if (err) return callback(err);
        clean(dirname(path));
      });
      function clean(dir) {
        if (dir.length <= 1) return callback();
        return fs.rmdir(dir, function (err) {
          if (!err) return clean(dirname(dir));
          if (err.code === "ENOTEMPTY" || err.code === "ENOENT") {
            return callback();
          }
          return callback(err);
        });
      }
    }

    function has(key, callback) {
      if (!callback) return has.bind(this, key);
      if (isHash.test(key)) {
        return fs.stat(hashToPath(key), onStat);
      }
      return fs.stat(key, onStat);
      function onStat(err) {
        if (err) {
          if (err.code === "ENOENT") return callback();
          return callback(err);
        }
        return callback(null, true);
      }
    }

    function keys(prefix, callback) {
      if (!callback) return keys.bind(this, prefix);
      var results = [ ];
      var targets = [ ];

      // Ensure path ends with exactly one trailing slash.
      function trail (path) {
        return path + (path[path.length - 1] == '/' ? '' : '/' )
      }
      // generate potential matches for everything under this prefix
      // Takes a callback and calls it once async `fs.readdir` is done.
      function listKeys (prefix, cb) {
        var list = [ ];
        fs.readdir(prefix, function (err, found) {
          if (!err) found.forEach(function (item) {
            // transform the matches into paths relative to repo root
            var name = trail(prefix) + item;
            // make note of outstanding candidates
            targets.unshift(name);
            list.push(name);
          });
          // continue relevant matches
          cb(err, list);
        });
      }

      // Since listKeys above is async, and we may need to recurse
      // through several subdirectories which may or may not have
      // their own matches, we use a basic FIFO queue.
      // shift first item off the queue and calls if finish if
      // done.
      function shift ( ) {
        var t = targets.shift( );
        // if there is nothing left to do, finish
        if (!t) {
          finish(null, null);
        }
      }

      // test one candidate key
      function isKeyName (name, cb) {
        // Async generate matches, delay callback.
        listKeys(name, function (err, found) {
          // At this point readdir has potentially already worked
          // several times already, and we are investigating a
          // potential leaf in a tree.
          // a complete key name will generate an error
          if (err && (err.code == 'ENOTDIR')) {
            err = null;
            // a complete key name (with extra slash)
            return cb(null, name);
          }
          // a partial key name generates additional matches
          cb(err, null, found);
        });
      }

      // investigate list of potential matches
      function onKeys (err, list) {
        // only respond to non errors, make sure list is sorted for
        // stable testable output
        if (!err) list.sort( ).forEach(function (name, i) {
            // for each potential key, separate remaining subdirectory
            // matches from matched key names.
            isKeyName(name, function (err, found, remain) {
              // We've been delaying until confirmation to release
              // this candidate's task.
              shift( );
              // A partial key generates remaining to process.
              // Order matters here, returning onKeys before adding
              // name makes this a greedy directory depth first
              // search.
              if (remain) return onKeys(err, remain);
              // A complete key should be added to results list.
              if (name) results.push(name);
              if (!err && !remain && i == list.length - 1) {
                // If there is nothing left to do, exactly one more
                // shift should trigger finish.
                if (targets.length === 0) {
                  shift( );
                }
              }
            });
        });
      }

      // calling finish(null, null) is only way to trigger data
      function finish (err, data) {
        // Initial calls to fs.readdir should bubble errors back to
        // caller.
        // Subsequent calls to verify potential keynames depend on
        // error checking in very specific ways to detect valid
        // keynames.
        if (err) callback(err);
        if (data) onKeys(err, data);
        if (!data) callback(err, results);
      }

      // Start pattern matcher.
      return listKeys(prefix || "/", finish);
    }


    function hashToPath(hash) {
      return "objects/" + hash.substr(0, 2) + "/" + hash.substr(2);
    }

    function mkdirp(path, callback) {
      fs.mkdir(path)(function (err) {
        if (!err || err.code === "EEXIST") return callback();
        if (err.code === "ENOENT") {
          return mkdirp(dirname(path), function (err) {
            if (err) return callback(err);
            mkdirp(path, callback);
          });
        }
        return callback(err);
      });
    }

    function init(callback) {
      if (!callback) return init.bind(this);
      callback();
    }

    function clear(callback) {
      if (!callback) return clear.bind(this);
      callback(new Error("TODO: rm-rf the directory"));
    }
  }

};

function dirname(path) {
  var index = path.lastIndexOf("/");
  if (index < 0) return ".";
  if (index === 0) return "/";
  return path.substr(0, index);
}

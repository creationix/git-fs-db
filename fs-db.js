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
      function listKeys (prefix, cb) {
        console.log('listKeys', prefix);
        var list = [ ];
        fs.readdir(prefix, function (err, found) {
          if (!err) found.forEach(function (item) {
            var name = prefix + '/' + item + '';
            targets.unshift(name);
            list.push(name);
          });
          cb(err, list);

        });
      }
      function shift ( ) {
        var t = targets.shift( );
        console.log("LEFT", targets.length);
        if (!t) {
          finish(null, null);
        }

      }
      function onKeys (err, list) {
        function isKeyName (name, cb) {
          listKeys(name, function (err, found) {
            if (err && (err.code == 'ENOENT' || err.code == 'ENOTDIR')) {
              err = null;
              // shift( );
              return cb(null, name);
            }
            cb(err, null, found);
          });
        }
        console.log("err", err);
        console.log("LIST", targets.length, list);
        if (!err) list.forEach(function (key, i) {
            // targets.unshift(key);

            console.log('forEach list', 'err', err, 'key', key);
            var name = key;
            console.log('name', name);
            isKeyName(name, function (err, found, remain) {
              console.log ('FOUND', i, '(', name ,')', err, found, remain ? remain.length : remain, 'left');
              var count = i;
              shift( );
              if (remain) return onKeys(err, remain);
              if (name) results.push(name);
              if (!err && !remain && count == list.length - 1) {
                console.log("END?", 'targets', targets.length, 'list', list.length, list, 'count', count);
                if (targets.length === 0) {
                  shift( );
                }
              }
            });
        });
        if (!err) {

        }

      }
      function finish (err, data) {
        console.log("FINISH", targets.length);
        if (err) callback(err);
        if (data) onKeys(err, data.slice(0));
        if (!data) callback(err, results);
      }

      return listKeys(prefix || "/", onKeys);
      // return fs.readdir(prefix || "/", callback);
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

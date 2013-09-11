module.exports = function (platform) {

  return fsDb;

  function fsDb(fs) {
    var inflate = platform.inflate;
    var deflate = platform.deflate;

    return {
      load: load,
      save: save,
      remove: remove,
      read: read,
      write: write,
      unlink: unlink,
      readdir: readdir
    };

    function load(hash, callback) {
      if (!callback) return load.bind(this, hash);
      return fs.read(hashToPath(hash), function (err, deflated) {
        if (err) return callback(err);
        return inflate(deflated, callback);
      });
    }

    function save(hash, buffer, callback) {
      if (!callback) return save.bind(this, hash, buffer);
      return deflate(buffer, function (err, deflated) {
        if (err) return callback(err);
        return write(hashToPath(hash), deflated, callback);
      });
    }

    function remove(hash, callback) {
      if (!callback) return remove.bind(this, hash);
      return unlink(hashToPath(hash), callback);
    }

    function read(path, callback) {
      if (!callback) return fs.read(path, "ascii");
      return fs.read(path, "ascii")(callback);
    }

    function write(path, data, callback) {
      if (!callback) return write.bind(this, path, data);
      return mkdirp(dirname(path), function (err) {
        if (err) return callback(err);
        return fs.write(path, data)(callback);
      });
    }

    function unlink(path, callback) {
      if (!callback) return unlink.bind(this, path);
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

    function readdir(path, callback) {
      if (!callback) return readdir.bind(this, path);
      return fs.readdir(path, callback);
    }

    function hashToPath(hash) {
      return "objects/" + hash.substr(0, 2) + "/" + hash.substr(2);
    }

    function mkdirp(path, callback) {
      if (!callback) return mkdirp.bind(this, path);
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
  }

};

function dirname(path) {
  var index = path.lastIndexOf("/");
  if (index < 0) return ".";
  if (index === 0) return "/";
  return path.substr(0, index);
}

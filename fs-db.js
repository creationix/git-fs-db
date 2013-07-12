var inflate = require('./inflate.js');
var deflate = require('./deflate.js');
var sha1 = require('sha1-digest');
var dirname = require('path').dirname;
var map = require('./map.js');
var parallel = require('./parallel.js');
var serial = require('./serial.js');
var bops = require('bops');

module.exports = fsDb;

function fsDb(fs, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (!callback) return fsDb.bind(this, fs, options);
  if (!options) options = {};
  if (!options.bare) fs = fs(".git");

  var db = {
    write: write,
    read: read,
    save: save,
    load: load,
    remove: remove
  };

  if (options.init) {
    var config = { core: {
      repositoryformatversion: 0,
      filemode: true,
      bare: !!options.bare
    }};
    return init(config)(function (err) {
      if (err) return callback(err);
      callback(null, db);
    });
  }

  return callback(null, db);

  function hashToPath(hash) {
    return "objects/" + hash.substr(0, 2) + "/" + hash.substr(2);
  }

  function write(path, data, callback) {
    if (!callback) return write.bind(this, path, data);
    mkdirp(dirname(path), function (err) {
      if (err) return callback(err);
      fs.write(path, data)(callback);
    });
  }

  function read(path, callback) {
    if (!callback) return fs.read(path, "ascii");
    fs.read(path, "ascii")(callback);
  }

  function save(object, callback) {
    if (!callback) return save.bind(this, object);
    var tmp = "." + (Math.random() * 0x100000000).toString(32) + Date.now().toString(32) + ".tmp";
    var header = object.type + " " + object.size + "\0";
    var sha1sum = sha1();
    var hash;

    var stream = { read: objectRead, abort: object.body.abort };

    function objectRead(onRead) {
      if (header) {
        var chunk = bops.create(header);
        header = null;
        sha1sum.update(chunk);
        return onRead(null, chunk);
      }
      object.body.read(function (err, chunk) {
        if (err) return onRead(err);
        if (chunk === undefined) {
          hash = sha1sum.digest();
          return onRead();
        }
        sha1sum.update(chunk);
        onRead(null, chunk);
      });
    }

    fs.writeStream(tmp, function (err, sink) {
      if (err) return callback(err);
      sink(deflate(stream), function (err) {
        if (err) return callback(err);
        var path = hashToPath(hash);
        mkdirp(dirname(path), function (err) {
          if (err) return callback(err);
          fs.rename(tmp, path, function (err) {
            if (err) return callback(err);
            callback(null, hash);
          });
        });
      });
    });
  }

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    fs.readStream(hashToPath(hash), function (err, stream) {
      if (err) return callback(err);
      decode(inflate(stream), callback);
    });
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    var path = hashToPath(hash);
    fs.unlink(path, function (err) {
      if (err) return callback(err);
      fs.rmdir(dirname(path), function (err) {
        if (err && err.code !== "ENOTEMPTY") {
          return callback(err);
        }
        callback();
      });
    });
  }

  function init(config) {
    var conf = map(config, function (key, section) {
      return "[" + key + "]\n" + map(section, function (key, value) {
        return "\t" + key + " = " + JSON.stringify(value) + "\n";
      });
    });
    var description = "Unnamed repository; edit this file 'description' to name the repository.\n";
    var exclude =
      "# git ls-files --others --exclude-from=.git/info/exclude\n" +
      "# Lines that start with '#' are comments.\n" +
      "# For a project mostly in C, the following would be a good set of\n" +
      "# exclude patterns (uncomment them if you want to use them):\n" +
      "# *.[oa]\n" +
      "# *~\n";
    return serial(
      fs.mkdir("."),
      parallel(
        fs.mkdir("branches"),
        write("config", conf),
        write("description", description),
        write("HEAD", "ref: refs/heads/master\n"),
        fs.mkdir("hooks"),
        serial(
          fs.mkdir("info"),
          write("info/exclude", exclude)
        ),
        serial(
          fs.mkdir("objects"),
          parallel(
            fs.mkdir("objects/info"),
            fs.mkdir("objects/pack")
          )
        ),
        serial(
          fs.mkdir("refs"),
          parallel(
            fs.mkdir("refs/heads"),
            fs.mkdir("refs/tags")
          )
        )
      )
    );
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

// Partially parse an object stream to extract out the type and size headers.
function decode(stream, callback) {
  if (!callback) return decode.bind(this, stream);
  var initial = null;
  var parts = [];

  stream.read(onRead);

  function onRead(err, chunk) {
    if (err) return callback(err);
    for (var i = 0, l = chunk.length; i < l; i++) {
      if (!chunk[i]) {
        parts.push(bops.subarray(chunk, 0, i));
        initial = i + 1 < l && bops.subarray(chunk, i + 1);
        return ready();
      }
    }
    parts.push(chunk);
    stream.read(onRead);
  }

  function ready() {
    var header = bops.to(bops.join(parts)).split(" ");
    callback(null, {
      type: header[0],
      size: parseInt(header[1], 10),
      body: { read: objectRead, abort: stream.abort }
    });
  }

  function objectRead(onRead) {
    if (initial) {
      var chunk = initial;
      initial = null;
      return onRead(null, chunk);
    }
    return stream.read(onRead);
  }
}

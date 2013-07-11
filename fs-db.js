var inflate = require('./inflate.js');
var deflate = require('./deflate.js');
var sha1 = require('./sha1.js');
var dirname = require('path').dirname;
var map = require('./map.js');
var parallel = require('./parallel.js');
var serial = require('./serial.js');

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
    throw new Error("TODO: Implement save");    
  }

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    throw new Error("TODO: Implement load");    
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    throw new Error("TODO: Implement remove");    
  }

  function init(config) {
    console.log("INIT", config);
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
  

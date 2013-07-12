var fs = require('simple-fs')(__dirname + "/test.git");
var bops = require('bops');
var binarySource = require('simple-stream-helpers/binary-source.js');
var consume = require('simple-stream-helpers/consume.js');

// Test the test db.
var data = bops.create("Hello World\n");
var db, hash, object;

console.log("Initilizing new git repo");
require('./.')(fs, { bare: true, init: true }, function (err, result) {
  if (err) throw err;
  console.log("Created", db);
  db = result;
  save();
});

function saveBlob(data, callback) {
  db.save({
    type: "blob",
    size: data.length,
    body: binarySource(data)
  }, callback);
}

function save() {
  object = {
    type: "blob",
    size: data.length,
    body: binarySource(data)
  };
  console.log("Saving", object);
  db.save(object)(function (err, result) {
    if (err) throw err;
    hash = result;
    console.log("Saved to", hash);
    load();
  });
}

function load() {
  console.log("Loading %s from database", hash);
  db.load(hash)(function (err, obj) {
  if (err) throw err;
    console.log("Loaded", obj);
    console.log("Consuming body...");
    consume(obj.body)(function (err, items) {
      if (err) throw err;
      console.log([bops.to(bops.join(items))]);
      remove();
    });
  });
}

function remove() {
  console.log("Removing %s from database", hash);
  db.remove(hash)(function (err) {
    if (err) throw err;
    console.log("Removed");
  });
}

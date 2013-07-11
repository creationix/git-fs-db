var fs = require('simple-fs')(__dirname + "/test.git");
var bops = require('bops');
var binarySource = require('simple-stream-helpers/binary-source.js');
var consume = require('simple-stream-helpers/consume.js');

// Test the test db.
var data = bops.create("Hello World\n");

require('./.')(fs, { bare: true, init: true }, function (err, db) {
  if (err) throw err;

  db.save({
    type: "blob",
    size: data.length,
    body: binarySource(data)
  })(function (err, hash) {
    if (err) throw err;
    console.log(hash);
    db.load(hash)(function (err, obj) {
    if (err) throw err;
      console.log(obj);
      consume(obj.body)(function (err, items) {
        if (err) throw err;
        console.log(items);
      });
    });
  });

});




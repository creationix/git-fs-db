var zlib = require('zlib');

module.exports = inflate;

// inflate(stream<deflated_binary>) -> stream<binary>
function inflate(input) {
  var dataQueue = [];
  var readQueue = [];
  var reading = false, done = false;

  var inf = new zlib.Inflate();
  inf.on("error", onError);
  inf.on("data", onData);
  inf.on("end", onEnd);

  function onEnd() {
    dataQueue.push([]);
    check();
  }

  function onError(err) {
    dataQueue.push([err]);
    check();
  }

  function onData(chunk) {
    dataQueue.push([null, chunk]);
    check();
  }

  function check() {
    while (readQueue.length && dataQueue.length) {
      readQueue.shift().apply(null, dataQueue.shift());
    }

    if (!reading && !done && readQueue.length) {
      reading = true;
      input.read(onRead);
    }
  }

  function onRead(err, chunk) {
    reading = false;
    if (chunk === undefined) {
      done = true;
      if (err) dataQueue.push([err]);
      inf.end();
    }
    else inf.write(chunk);
    check();
  }

  return { read: read, abort: input.abort };

  function read(callback) {
    readQueue.push(callback);
    check();
  }

}
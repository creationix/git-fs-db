var zlib = require('zlib');

module.exports = deflate;

// deflate(source<binary>) -> source<deflated_binary>
function deflate(input) {
  var dataQueue = [];
  var readQueue = [];
  var reading = false, done = false;

  var def = zlib.createDeflate();
  def.on("error", onError);
  def.on("data", onData);
  def.on("end", onEnd);

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
      def.end();
    }
    else def.write(chunk);
    check();
  }

  return { read: read, abort: input.abort };

  function read(callback) {
    readQueue.push(callback);
    check();
  }
}

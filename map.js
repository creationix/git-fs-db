module.exports = map;
function map(obj, fn) {
  var keys = Object.keys(obj);
  var str = "";
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    str += fn(key, obj[key]);
  }
  return str;
}

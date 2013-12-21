
var should = require('should');

if (!module.parent) {
  var platform = require('git-node-platform');
  var fs = require('fs');
  var fsDB = require('../.');
  console.log("MAIN");
  db = fsDB(platform)(platform.fs("test/keys/"));
  db.init( );
  console.log('db', db);
  db.keys('refs/', console.log);

} else {
  describe('git-fs-db backend', function ( ) {
    describe('is a module', function ( ) {
      it('should be required with platform', function (done) {
        var platform = require('git-node-platform');
        var fs = require('fs');
        var fsDB = require('../.')(platform);

        done( );
      });
      describe('db interface', function () {
        var platform = require('git-node-platform');
        var fs = require('fs');
        var fsDB = require('../.')(platform);
        it('should initialize with path', function (done) {
          var path = platform.fs('test/keys');
          var db = fsDB(path);
          should.exist(db.init);
          db.init( );

          done( );
        });
        it('path prefix should generate matchs', function (done) {
          var path = platform.fs('test/keys');
          var db = fsDB(path);
          should.exist(db.init);
          db.init( );
          db.keys('refs/', function (err, keys) {
            should.not.exist(err);
            var correct = [ ];
            // console.log("FINISHED", err, 'keys', keys);
            // keys.join("\n").should.equal(correct.join("\n"));
            done( );
          });

        });
      });
    });

  });
}

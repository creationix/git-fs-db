
var should = require('should');

if (!module.parent) {
  var platform = require('git-node-platform');
  var fs = require('fs');
  var fsDB = require('../.');
  console.log("MAIN");
  db = fsDB(platform)(platform.fs("test/keys/"));
  db.init( );
  function msg (msg) {
    return function ( ) { console.log(msg, arguments); };
  }
  function match(ref) {
    db.keys(ref, msg('MATCH ' + ref));
  }
  match('refs/foo/');
  match('refs/two');
  match('refs/four');

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
      });
      function text (list) {
        return list.join("\n");
      }
      describe('once initialized', function () {
        var platform = require('git-node-platform');
        var fs = require('fs');
        var fsDB = require('../.')(platform);
        var path = platform.fs('test/keys');
        var db = fsDB(path);
        should.exist(db.init);

        it('should generate one match given refs/one', function (done) {
          db.init( );
          db.keys('refs/one/', function (err, keys) {
            should.not.exist(err);
            var correct = [ 'refs/one/.gitkeep' ];

            keys.length.should.equal(1);
            text(keys).should.equal(text(correct));
            done( );
          });

        });

        it('should generate matches given refs/two', function (done) {
          db.init( );
          db.keys('refs/two', function (err, keys) {
            should.not.exist(err);
            var correct = [ 'refs/two/aaa', 'refs/two/bbb' ];

            keys.length.should.equal(2);
            text(keys).should.equal(text(correct));
            done( );
          });

        });

        it('should generate matches given refs/three', function (done) {
          db.init( );
          db.keys('refs/three', function (err, keys) {
            should.not.exist(err);
            var correct =  [ 'refs/three/one/aaa', 'refs/three/one/bbb', 'refs/three/one/ccc',
                'refs/three/three/aaa', 'refs/three/three/bbb', 'refs/three/three/ccc',
                'refs/three/two/aaa', 'refs/three/two/bbb', 'refs/three/two/ccc' ]
              ;

            keys.length.should.equal(9);

            text(keys).should.equal(text(correct));
            done( );
          });

        });

        it('should generate matches given refs/four', function (done) {
          db.init( );
          db.keys('refs/four', function (err, keys) {
            should.not.exist(err);
            var correct = [ 'refs/four/one/aa/aaaa', 'refs/four/one/aa/bbb',
                'refs/four/one/aa/ccc', 'refs/four/one/aa/ddd', 'refs/four/one/bb/aaaa',
                'refs/four/one/bb/bbb', 'refs/four/one/bb/ccc', 'refs/four/one/bb/ddd',
                'refs/four/one/cc/aaaa', 'refs/four/one/cc/bbb', 'refs/four/one/cc/ccc',
                'refs/four/one/cc/ddd', 'refs/four/one/dd/aaaa', 'refs/four/one/dd/bbb',
                'refs/four/one/dd/ccc', 'refs/four/one/dd/ddd', 'refs/four/three/aa/aaaa',
                'refs/four/three/aa/bbb', 'refs/four/three/aa/ccc', 'refs/four/three/aa/ddd',
                'refs/four/three/bb/aaaa', 'refs/four/three/bb/bbb', 'refs/four/three/bb/ccc',
                'refs/four/three/bb/ddd', 'refs/four/three/cc/aaaa', 'refs/four/three/cc/bbb',
                'refs/four/three/cc/ccc', 'refs/four/three/cc/ddd', 'refs/four/three/dd/aaaa',
                'refs/four/three/dd/bbb', 'refs/four/three/dd/ccc', 'refs/four/three/dd/ddd',
                'refs/four/two/aa/aaaa', 'refs/four/two/aa/bbb', 'refs/four/two/aa/ccc',
                'refs/four/two/aa/ddd', 'refs/four/two/bb/aaaa', 'refs/four/two/bb/bbb',
                'refs/four/two/bb/ccc', 'refs/four/two/bb/ddd', 'refs/four/two/cc/aaaa',
                'refs/four/two/cc/bbb', 'refs/four/two/cc/ccc', 'refs/four/two/cc/ddd',
                'refs/four/two/dd/aaaa', 'refs/four/two/dd/bbb', 'refs/four/two/dd/ccc',
                'refs/four/two/dd/ddd' ]

            ;
            keys.length.should.equal(48);
            text(keys).should.equal(text(correct));
            done( );
          });

        });

        it('should generate matches given refs/foo', function (done) {
          db.init( );
          db.keys('refs/foo', function (err, keys) {
            should.not.exist(err);
            var correct = [ 'refs/foo/qan/.gitkeep', 'refs/foo/qux/.gitkeep',
                'refs/foo/bar/bazz/.gitkeep', 'refs/foo/bar/bee/.gitkeep',
                'refs/foo/bar/buzz/.gitkeep' ]
            ;
            keys.length.should.equal(5);
            text(keys).should.equal(text(correct));
            done( );
          });

        });

        it('should generate errors given bad refs', function (done) {
          db.init( );
          db.keys('bad', function (err, keys) {
            should.exist(err);
            err.code.should.equal('ENOENT');
            done( );
          });

        });
      });
    });

  });
}

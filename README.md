git-fs-db
=========

A [git-db][] implementation that wraps a [git-fs][] interface instance.  Creates real git repos in the fs.

All examples on this page use [continuables][] with yield assuming some generator helper like [gen-run][].  They can however work with normal callback code as well.

```js
var result = yield operation(arg1, arg2);
```

Is the same as:

```js
operation(arg1, arg2)(function (err, result) {
  if (err) throw err;
  // handle result
});
```

But can even be written as:

```js
operation(arg1, arg2, function (err, result) {
  if (err) throw err;
  // handle result
});
```

Since all the functions support both callback-last and return-continuable styles.

## fsDb(fs, options) -> continuable&lt;db>

Given a [git-fs][] implementation return a [git-db][] implementation.

```js
// Create a filesystem interface rooted at the place we want to create the repo.
var fs = require('simple-fs')('/path/to/my/repo.git');
// Create a database instance as a bare repo creating the directory structure.
var db = yield require('git-fs-db')(fs, {bare: true, init: true});
```

### db.read(path) -> continuable&lt;value>

Read a value from a file as a string.  Used for reading refs.

```js
var master = yield db.read("/refs/heads/master");
```

### db.write(path, value) -> continuable

Write a value to a file.  Used for things like git refs.  Will create parent directories automatically.

```js
yield db.write("/ref/heads/master", master);
```

### db.load(hash) -> continuable&lt;object>

Load a git object from the database by hash.  Return in the continuable.

```js
var obj = yield db.load(hash);
```

In this module, git objects are simply type, size, and a binary stream of data.
The stream is in [simple-stream][] format.

```js
{
  type: string,   // commit, tag, tree, blob, ofs-delta, ref-delta, etc...
  size: integer,  // number of bytes in the stream
  body: stream    // binary simple-stream of the body
}
````

### db.save(object) -> continuable&lt;hash>

Save a git object to the database, return the hash in the continuable when done.

```js
var hash = yield db.save(obj);
```

### db.remove(hash) -> continuable

Remove an item from the database.

```js
yield db.remove(hash);
```

## License

The MIT License (MIT)

Copyright (c) 2013 Tim Caswell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


[git-db]: https://github.com/creationix/js-git/blob/master/specs/git-db.md
[git-fs]: https://github.com/creationix/js-git/blob/master/specs/fs.md
[simple-stream]: https://github.com/creationix/js-git/blob/master/specs/simple-stream.md
[continuables]: https://github.com/creationix/js-git/blob/master/specs/continuable.md
[gen-run]: https://github.com/creationix/gen-run

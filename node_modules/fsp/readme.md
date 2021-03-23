# fsp - an 'fs' returning A+ promises (when).

[![Build Status](https://travis-ci.org/anodynos/fsp.svg?branch=master)](https://travis-ci.org/anodynos/fsp)
[![Up to date Status](https://david-dm.org/anodynos/fsp.png)](https://david-dm.org/anodynos/fsp.png)

A minimal `fs` that returns A+ promises ([when](https://github.com/cujojs/when)). For each `fs.xxx` function, it adds an `fs.xxxP` returning promises.

## Usage

Just `fs = require('fsp')` instead of `'fs'` and omit the last callback parameter when calling a promise-returning `fs.xxxxP` function.

For example you can do

```
  var fs = require('fsp');

  fs.readFileP("some/file.txt", {encoding:'utf8'}).then(
    function(text){...}, function(err){}
  );
```

and all the other cool things you can do with promises.

Of course `fs.readFile` and `fs.readFileSync` are still available.

Note: `fs.existsP` works as expected - it resolves to boolean `true` / `false` if file exists or not (it never rejects - it uses [`fs-exists`](https://www.npmjs.org/package/fs-exists)).

# License

The MIT License

Copyright (c) 2013-2014 Agelos Pikoulas (agelos.pikoulas@gmail.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

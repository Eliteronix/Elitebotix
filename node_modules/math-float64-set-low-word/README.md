Set Low Word
===
[![NPM version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][dependencies-image]][dependencies-url]

> Sets the less significant 32 bits of a [double-precision floating-point number][ieee754].


## Installation

``` bash
$ npm install math-float64-set-low-word
```


## Usage

``` javascript
var setLowWord = require( 'math-float64-set-low-word' );
```

#### setLowWord( x, low )

Sets the less significant 32 bits (lower order word) of a [double-precision floating-point number][ieee754] `x` to a bit sequence represented by an unsigned 32-bit integer `low`. The returned `double` will have the same more significant 32 bits (higher order word) as `x`.

``` javascript
var low = 5 >>> 0;
// => 00000000000000000000000000000101

var x = 3.14e201;
// => 0 11010011100 01001000001011000011 10010011110010110101100010000010

var y = setLowWord( x, low );
// returns 3.139998651394392e+201 => 0 11010011100 01001000001011000011 00000000000000000000000000000101
```

Setting the lower order bits of `NaN` or positive or negative `infinity` will return `NaN`, as `NaN` is [defined][ieee754] as a `double` whose exponent bit sequence is all ones and whose fraction can be any bit sequence __except__ all zeros. Positive and negative `infinity` are [defined][ieee754] as `doubles` with an exponent bit sequence equal to all ones and a fraction equal to all zeros. Hence, changing the less significant bits of positive and negative `infinity` converts each value to `NaN`.

``` javascript
var pinf = require( 'const-pinf-float64' );
var ninf = require( 'const-ninf-float64' );

var low = 12345678;

var y = setLowWord( pinf, low );
// returns NaN  

y = setLowWord( ninf, low );
// returns NaN

y = setLowWord( NaN, low );
// returns NaN
```


## Examples

``` javascript
var pow = require( 'math-power' );
var round = require( 'math-round' );
var setLowWord = require( 'math-float64-set-low-word' );

var MAX_UINT;
var frac;
var exp;
var low;
var x;
var y;
var i;

// Max unsigned 32-bit integer:
MAX_UINT = pow( 2, 32 ) - 1;

// Generate a random double-precision floating-point number:
frac = Math.random() * 10;
exp = -round( Math.random() * 323 );
x = frac * pow( 10, exp );

// Replace the lower order word of `x` to generate new random numbers having the same higher order word...
for ( i = 0; i < 100; i++ ) {
	low = round( Math.random()*MAX_UINT );
	y = setLowWord( x, low );
	console.log( 'x: %d. new low word: %d. y: %d.', x, low, y );
}
```

To run the example code from the top-level application directory,

``` bash
$ node ./examples/index.js
```


---
## Tests

### Unit

This repository uses [tape][tape] for unit tests. To run the tests, execute the following command in the top-level application directory:

``` bash
$ make test
```

All new feature development should have corresponding unit tests to validate correct functionality.


### Test Coverage

This repository uses [Istanbul][istanbul] as its code coverage tool. To generate a test coverage report, execute the following command in the top-level application directory:

``` bash
$ make test-cov
```

Istanbul creates a `./reports/coverage` directory. To access an HTML version of the report,

``` bash
$ make view-cov
```


### Browser Support

This repository uses [Testling][testling] for browser testing. To run the tests in a (headless) local web browser, execute the following command in the top-level application directory:

``` bash
$ make test-browsers
```

To view the tests in a local web browser,

``` bash
$ make view-browser-tests
```

<!-- [![browser support][browsers-image]][browsers-url] -->


---
## License

[MIT license](http://opensource.org/licenses/MIT).


## Copyright

Copyright &copy; 2016. The [Compute.io][compute-io] Authors.


[npm-image]: http://img.shields.io/npm/v/math-float64-set-low-word.svg
[npm-url]: https://npmjs.org/package/math-float64-set-low-word

[build-image]: http://img.shields.io/travis/math-io/float64-set-low-word/master.svg
[build-url]: https://travis-ci.org/math-io/float64-set-low-word

[coverage-image]: https://img.shields.io/codecov/c/github/math-io/float64-set-low-word/master.svg
[coverage-url]: https://codecov.io/github/math-io/float64-set-low-word?branch=master

[dependencies-image]: http://img.shields.io/david/math-io/float64-set-low-word.svg
[dependencies-url]: https://david-dm.org/math-io/float64-set-low-word

[dev-dependencies-image]: http://img.shields.io/david/dev/math-io/float64-set-low-word.svg
[dev-dependencies-url]: https://david-dm.org/dev/math-io/float64-set-low-word

[github-issues-image]: http://img.shields.io/github/issues/math-io/float64-set-low-word.svg
[github-issues-url]: https://github.com/math-io/float64-set-low-word/issues

[tape]: https://github.com/substack/tape
[istanbul]: https://github.com/gotwarlost/istanbul
[testling]: https://ci.testling.com

[compute-io]: https://github.com/compute-io/
[ieee754]: https://en.wikipedia.org/wiki/IEEE_754-1985

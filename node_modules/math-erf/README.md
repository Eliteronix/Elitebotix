erf
===
[![NPM version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][dependencies-image]][dependencies-url]

> [Error function][error-function].

The [error function][error-function] is defined as

<div class="equation" align="center" data-raw-text="\operatorname{erf}(x) = \frac{2}{\sqrt\pi}\int_0^x e^{-t^2}\,\mathrm dt." data-equation="eq:error_function">
	<img src="https://cdn.rawgit.com/math-io/erf/a04ac9320eaaca5f8a09fd4b590834bea0376361/docs/img/eqn.svg" alt="Error function.">
	<br>
</div>


## Installation

``` bash
$ npm install math-erf
```


## Usage

``` javascript
var erf = require( 'math-erf' );
```

#### erf( x )

Evaluates the [error function][error-function].

``` javascript
var y = erf( 2 );
// returns ~0.9953

y = erf( -1 );
// returns ~-0.8427
```

If provided `NaN`, the `function` returns `NaN`.

``` javascript
var y = erf( NaN );
// returns NaN
```

The [error function][error-function] is an [odd function][odd-function]; i.e., `erf(-x) = -erf(x)`. Thus, in accordance with the [IEEE 754][ieee754] standard, if provided `-0`, the `function` returns `-0`.

``` javascript
var y = erf( -0 );
// returns -0
```


## Examples

``` javascript
var linspace = require( 'compute-linspace' );
var erf = require( 'math-erf' );

var x = linspace( -10, 10, 100 );
var y;
var i;

for ( i = 0; i < x.length; i++ ) {
	y = erf( x[ i ] );
	console.log( 'x: %d, erf(x): %d', x[ i ], y );
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


[npm-image]: http://img.shields.io/npm/v/math-erf.svg
[npm-url]: https://npmjs.org/package/math-erf

[build-image]: http://img.shields.io/travis/math-io/erf/master.svg
[build-url]: https://travis-ci.org/math-io/erf

[coverage-image]: https://img.shields.io/codecov/c/github/math-io/erf/master.svg
[coverage-url]: https://codecov.io/github/math-io/erf?branch=master

[dependencies-image]: http://img.shields.io/david/math-io/erf.svg
[dependencies-url]: https://david-dm.org/math-io/erf

[dev-dependencies-image]: http://img.shields.io/david/dev/math-io/erf.svg
[dev-dependencies-url]: https://david-dm.org/dev/math-io/erf

[github-issues-image]: http://img.shields.io/github/issues/math-io/erf.svg
[github-issues-url]: https://github.com/math-io/erf/issues

[tape]: https://github.com/substack/tape
[istanbul]: https://github.com/gotwarlost/istanbul
[testling]: https://ci.testling.com

[compute-io]: https://github.com/compute-io/
[error-function]: https://en.wikipedia.org/wiki/Error_function
[odd-function]: https://en.wikipedia.org/wiki/Even_and_odd_functions
[ieee754]: https://en.wikipedia.org/wiki/IEEE_754-1985
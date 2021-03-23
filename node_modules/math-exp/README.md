Natural Exponential Function
===
[![NPM version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][dependencies-image]][dependencies-url]

> Natural [exponential function][exponential-function].

The natural [exponential function][exponential-function] is defined as

<div class="equation" align="center" data-raw-text="y = e^x" data-equation="eq:natural_exponential_function">
	<img src="https://cdn.rawgit.com/math-io/exp/1ecfe1ee0dc303c2ebb2b0471f0328106eb915cd/docs/img/eqn.svg" alt="Natural exponential function definition.">
	<br>
</div>

where `e` is [Euler's][eulers-number] number.


## Installation

``` bash
$ npm install math-exp
```


## Usage

``` javascript
var exp = require( 'math-exp' );
```

#### exp( x )

Evaluates the natural [exponential function][exponential-function].

``` javascript
var val = exp( 4 );
// returns ~54.5982

val = exp( -9 );
// returns ~1.234e-4

val = exp( 0 );
// returns 1

val = exp( NaN );
// returns NaN
```


## Examples

``` javascript
var exp = require( 'math-exp' );

var x;
var i;

for ( i = 0; i < 100; i++ ) {
	x = Math.random()*100 - 50;
	console.log( 'e^%d = %d', x, exp( x ) );
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


[npm-image]: http://img.shields.io/npm/v/math-exp.svg
[npm-url]: https://npmjs.org/package/math-exp

[build-image]: http://img.shields.io/travis/math-io/exp/master.svg
[build-url]: https://travis-ci.org/math-io/exp

[coverage-image]: https://img.shields.io/codecov/c/github/math-io/exp/master.svg
[coverage-url]: https://codecov.io/github/math-io/exp?branch=master

[dependencies-image]: http://img.shields.io/david/math-io/exp.svg
[dependencies-url]: https://david-dm.org/math-io/exp

[dev-dependencies-image]: http://img.shields.io/david/dev/math-io/exp.svg
[dev-dependencies-url]: https://david-dm.org/dev/math-io/exp

[github-issues-image]: http://img.shields.io/github/issues/math-io/exp.svg
[github-issues-url]: https://github.com/math-io/exp/issues

[tape]: https://github.com/substack/tape
[istanbul]: https://github.com/gotwarlost/istanbul
[testling]: https://ci.testling.com

[compute-io]: https://github.com/compute-io/
[exponential-function]: https://en.wikipedia.org/wiki/Exponential_function
[eulers-number]: https://en.wikipedia.org/wiki/E_(mathematical_constant)

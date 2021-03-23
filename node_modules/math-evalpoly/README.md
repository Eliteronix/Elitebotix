evalpoly
===
[![NPM version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][dependencies-image]][dependencies-url]

> Evaluates a [polynomial][polynomial].


## Installation

``` bash
$ npm install math-evalpoly
```


## Usage

``` javascript
var evalpoly = require( 'math-evalpoly' );
```

#### evalpoly( c, x )

Evaluates a [polynomial][polynomial] having coefficients `c` and degree `n` at a value `x`, where `n = c.length-1`.

``` javascript
var v = evalpoly( [3,2,1], 10 );
// returns 123 => 3*10^0 + 2*10^1 + 1*10^2
```

The coefficients should be ordered in __ascending__ degree. For example, for a [polynomial][polynomial]

<div class="equation" align="center" data-raw-text="c_nx^n + c_{n-1}x^{n-1} + \ldots + c_1x^1 + c_0 = \sum_{i=0}^{n} c_ix^i" data-equation="eq:polynomial">
	<img src="https://cdn.rawgit.com/math-io/polynomial/ada0be8175ce943fd804dd191755c8b303021a20/docs/img/eqn.svg" alt="Polynomial expression.">
	<br>
</div>

the coefficients would be

```
[c_0, c_1, ..., c_(n-1), c_n]
```

matching the summation notation.


#### evalpoly.factory( c )

Uses code generation to in-line coefficients and return a reusable `function` for evaluating a [polynomial][polynomial].

``` javascript
var poly = evalpoly.factory( [3,2,1] );

var v = poly( 10 );
// returns 123 => 3*10^0 + 2*10^1 + 1*10^2

v = poly( 5 );
// returns 38 => 3*5^0 + 2*5^1 + 1*5^2
```

__Note__: For hot code paths in which coefficients are invariant, the generated `function` will be more performant than the main export.


## Examples

``` javascript
var round = require( 'math-round' );
var evalpoly = require( 'math-evalpoly' );

var coef;
var sign;
var poly;
var v;
var i;

// Create an array of random coefficients...
coef = new Float64Array( 10 );
for ( i = 0; i < coef.length; i++ ) {
	if ( Math.random() < 0.5 ) {
		sign = -1;
	} else {
		sign = 1;
	}
	coef[ i ] = sign * round( Math.random()*100 );
}

// Evaluate the polynomial at random values...
for ( i = 0; i < 100; i++ ) {
	v = Math.random() * 100;
	console.log( 'f(%d) = %d', v, evalpoly( coef, v ) );
}

// Generate an `evalpoly` function...
poly = evalpoly.factory( coef );
for ( i = 0; i < 100; i++ ) {
	v = Math.random()*100 - 50;
	console.log( 'f(%d) = %d', v, poly( v ) );
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

Copyright &copy; 2016. The [Compute.io][compute-io] Authors..


[npm-image]: http://img.shields.io/npm/v/math-evalpoly.svg
[npm-url]: https://npmjs.org/package/math-evalpoly

[build-image]: http://img.shields.io/travis/math-io/evalpoly/master.svg
[build-url]: https://travis-ci.org/math-io/evalpoly

[coverage-image]: https://img.shields.io/codecov/c/github/math-io/evalpoly/master.svg
[coverage-url]: https://codecov.io/github/math-io/evalpoly?branch=master

[dependencies-image]: http://img.shields.io/david/math-io/evalpoly.svg
[dependencies-url]: https://david-dm.org/math-io/evalpoly

[dev-dependencies-image]: http://img.shields.io/david/dev/math-io/evalpoly.svg
[dev-dependencies-url]: https://david-dm.org/dev/math-io/evalpoly

[github-issues-image]: http://img.shields.io/github/issues/math-io/evalpoly.svg
[github-issues-url]: https://github.com/math-io/evalpoly/issues

[tape]: https://github.com/substack/tape
[istanbul]: https://github.com/gotwarlost/istanbul
[testling]: https://ci.testling.com

[polynomial]: https://en.wikipedia.org/wiki/Polynomial
[compute-io]: https://github.com/compute-io

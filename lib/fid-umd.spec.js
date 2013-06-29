/**
 * Tests confirming FidUmd operates as expected
 */
/*global beforeEach, describe, expect, it, jasmine, spyOn*/

'use strict';

var FidUmd;
FidUmd = require('./fid-umd.js');

describe('FidUmd', function () {
	it('constructs', function () {
		var umd;
		umd = new FidUmd();
		// Simply not throwing works for me
	});

	describe('prototype', function () {
		var umd;

		beforeEach(function () {
			umd = new FidUmd();
		});

		describe('createPostamble', function () {
			it('returns something to close a header', function () {
				var result;
				result = umd.createPostamble();
				/*jslint evil:true*/
				eval('((function () {' + result);
				/*jslint evil:false*/
			});
		});

		describe('createPreamble()', function () {
			beforeEach(function () {
				spyOn(umd, 'createPreambleCommonJs').andReturn('COMMONJS\n');
				spyOn(umd, 'createPreambleRequireJs').andReturn('REQUIREJS\n');
				spyOn(umd, 'createPreambleYui').andReturn('YUI\n');
				spyOn(umd, 'createPreambleRoot').andReturn('ROOT\n');
			});

			it('adds a marker with JSON config', function () {
				var matches, result;
				result = umd.createPreamble({
					depends: []
				});
				/*jslint regexp:true*/
				matches = result.match(/\/\/ fid-umd (.*)/);
				/*jslint regexp:false*/
				expect(matches.length).toBe(2);
				JSON.parse(matches[1]);
			});

			it('compensates for jslint', function () {
				var matches, result;
				result = umd.createPreamble({
					depends: [],
					jslint: true
				});
				expect(result).toContain('/*global');
				expect(result).toContain('"use strict";');
			});

			it('calls all of the preamble makers', function () {
				var result;
				result = umd.createPreamble({
					depends: []
				});
				[
					'COMMONJS',
					'REQUIREJS',
					'YUI',
					'ROOT'
				].forEach(function (module) {
					expect(result).toContain(module);
				});
			});

			it('throws if it can not work', function () {
				var result;
				result = umd.createPreamble({
					depends: []
				});
				expect(result).toContain('throw new Error');
			});

			it('uses the right name', function () {
				var result;
				result = umd.createPreamble({
					depends: [],
					name: 'Unknown'
				});
				expect(result).not.toContain('Rainbow');
				expect(result).toContain('Unknown');
				result = umd.createPreamble({
					depends: [],
					name: 'Rainbow'
				});
				expect(result).toContain('Rainbow');
				expect(result).not.toContain('Unknown');
			});

			it('makes a call with no dependencies', function () {
				var result;
				result = umd.createPreamble({
					depends: []
				});
				expect(result).not.toContain('[]');
				expect(result).toContain('this, function () {');
			});

			it('lists dependencies in order', function () {
				var result;
				result = umd.createPreamble({
					depends: [
						{
							name: "Watermelon"
						},
						{
							name: "beefJerkey"
						}
					]
				});
				expect(result).toContain('this, function (Watermelon, beefJerkey) {');
			});
		});

		describe('createPreambleCommonJs()', function () {
			it('calls f() without dependencies', function () {
				var result;
				result = umd.createPreambleCommonJs({
					depends: []
				});
				expect(result).toContain('f()');
			});

			it('calls f() with dependencies', function () {
				var result;
				result = umd.createPreambleCommonJs({
					depends: [
						{
							commonjs: './aa'
						},
						{
							commonjs: 'bb'
						},
						{
							commonjs: '/home/users/cc'
						}
					]
				});
				expect(result).toContain('f(require("./aa"), require("bb"), require("/home/users/cc"))');
			});
		});

		describe('createPreambleRequireJs()', function () {
			it('calls f() without dependencies', function () {
				var result;
				result = umd.createPreambleRequireJs({
					depends: []
				});
				expect(result).toContain('[], f)');
			});

			it('calls f() with dependencies', function () {
				var result;
				result = umd.createPreambleRequireJs({
					depends: [
						{
							requirejs: "Blue"
						},
						{
							requirejs: "amber"
						}
					]
				});
				expect(result).toContain('["Blue","amber"], f)');
			});
		});

		describe('createPreambleRoot()', function () {
			it('calls f() without dependencies', function () {
				var result;
				result = umd.createPreambleRoot({
					depends: []
				});
				expect(result).toContain(' = f()');
			});

			it('calls f() with dependencies', function () {
				var result;
				result = umd.createPreambleRoot({
					depends: [
						{
							root: "URI"
						},
						{
							root: "advancedArray"
						}
					]
				});
				expect(result).toContain(' = f(r.URI, r.advancedArray)');
			});
		});

		describe('createPreambleYui()', function () {
			it('calls f() without dependencies', function () {
				var result;
				result = umd.createPreambleYui({
					depends: []
				});
				expect(result).toContain(' = f()');
			});

			it('calls f() with dependencies', function () {
				var result;
				result = umd.createPreambleYui({
					depends: [
						{
							yui: "Right"
						},
						{
							yui: "left"
						}
					]
				});
				expect(result).toContain('["Right","left"]');
				expect(result).toContain(' = f(Right, left)');
			});
		});
	});

	describe('functionally', function () {
		describe('with mocked create(Pre|Post)amble', function () {
			var umd;

			beforeEach(function () {
				umd = new FidUmd();
				umd.createPreamble = function () {
					return 'PREAMBLE';
				};
				umd.createPostamble = function () {
					return 'POSTAMBLE';
				};
			});

			describe('update()', function () {
				it('works without markers and add a newline', function () {
					var result;
					result = umd.update('a\nb\nc');
					// It adds a newline after c
					expect(result).toBe('PREAMBLEa\nb\nc\nPOSTAMBLE');
				});
				it('works without markers and will not double a newline', function () {
					var result;
					result = umd.update('a\nb\nc\n');
					// No extra newline after c
					expect(result).toBe('PREAMBLEa\nb\nc\nPOSTAMBLE');
				});
			});
		});

		describe('update()', function () {
			it('does not double preamble/postamble', function () {
				var code, postamble, preamble, result, umd;
				umd = new FidUmd();
				result = umd.update('----------\n');
				result = result.split('----------\n');
				preamble = result[0];
				postamble = result[1];
				expect(preamble.length).toBeGreaterThan(0);
				expect(postamble.length).toBeGreaterThan(0);
				code = '/**\n';
				code += ' * This is some code.\n';
				code += ' */\n';
				code += preamble;
				code += '\t//my stuff goes here\n';
				code += '\tfunction TestingThing() {}\n';
				code += '\treturn TestingThing;\n';
				code += postamble;
				code += '// and here is the real end';
				result = umd.update(code);
				expect(result).toEqual(code);
			});
		});
	});
});

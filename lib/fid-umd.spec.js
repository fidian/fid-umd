/**
 * Tests confirming FidUmd operates as expected
 */
/*global beforeEach, describe, expect, it, jasmine, spyOn*/

'use strict';

var FidUmd;
FidUmd = require('./fid-umd');

describe('FidUmd', function () {
    it('constructs', function () {
        var umd;
        umd = new FidUmd();
        expect(umd instanceof FidUmd).toBe(true);
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
                expect(result).toContain('}))');
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
                var result;
                result = umd.createPreamble({
                    depends: [],
                    jslint: true
                });
                expect(result).toContain('/*global');
                expect(result).toContain('"use strict";');
            });

            it('calls all of the preamble makers', function () {
                umd.createPreamble({
                    depends: []
                });
                expect(umd.createPreambleCommonJs).toHaveBeenCalled();
                expect(umd.createPreambleRequireJs).toHaveBeenCalled();
                expect(umd.createPreambleYui).toHaveBeenCalled();
                expect(umd.createPreambleRoot).toHaveBeenCalled();
            });

            it('throws if it can not work', function () {
                var result;
                result = umd.createPreamble({
                    depends: []
                });
                expect(result).toContain('throw new Error');
            });

            it('has no debugging by default', function () {
                var result;
                result = umd.createPreamble({
                    depends: []
                });
                expect(result).not.toContain('console.log');
            });

            it('can add debugging', function () {
                var result;
                result = umd.createPreamble({
                    depends: [],
                    debug: true
                });
                expect(result).toContain('console.log');
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

            it('renames the factory when "global" is on', function () {
                var result;
                result = umd.createPreamble({
                    depends: [],
                    global: true
                });
                expect(result).toContain('function (n, r, s)');
                expect(result).toContain('var f = function (');
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

        describe('createPreambleGlobalScope()', function () {
            it('calls f() without dependencies', function () {
                var result;
                result = umd.createPreambleGlobalScope({
                    depends: []
                });
                expect(result).toContain('s.call(r)');
            });

            it('calls f() with dependencies', function () {
                var result;
                result = umd.createPreambleGlobalScope({
                    depends: [
                        {
                            name: "x"
                        },
                        {
                            name: "XXX"
                        }
                    ]
                });
                expect(result).toContain('s.call(r, x, XXX)');
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
                expect(result).toContain('["Blue", "amber"], f)');
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
                expect(result).toContain('["Right", "left"]');
                expect(result).toContain(' = f(Y.Right, Y.left)');
            });
        });

        describe('dependsProperty()', function () {
            it('works with no depends', function () {
                var result;
                result = umd.dependsProperty([], 'name');
                expect(result).toEqual([]);
            });

            it('returns the correct property', function () {
                var result;
                result = umd.dependsProperty([
                    {
                        name: 'name1',
                        sven: 'sven1'
                    },
                    {
                        name: 'name2',
                        sven: 'sven2'
                    }
                ], 'sven');
                expect(result).toEqual([
                    'sven1',
                    'sven2'
                ]);
            });

            it('returns undefined when appropriate', function () {
                var result;
                result = umd.dependsProperty([
                    {
                        name: 'name1'
                    },
                    {
                        name: 'name2'
                    }
                ], 'Name');
                expect(result).toEqual([
                    undefined,
                    undefined
                ]);
            });
        });

        describe('detectConfig()', function () {
            beforeEach(function () {
                spyOn(umd, 'standardizeConfig').andCallFake(function (input) {
                    return input;
                });
            });

            it('works when no config was found', function () {
                var result;
                result = umd.detectConfig('// some JavaScript code');
                expect(result).toEqual({});
            });

            it('requires JSON object', function () {
                var result;
                result = umd.detectConfig('// fid-umd { blah blah');
                expect(result).toEqual({});
            });

            it('falls back to a plain config with invalid JSON', function () {
                expect(function () {
                    umd.detectConfig('// fid-umd {{}');
                }).toThrow();
            });

            it('uses an existing JSON object', function () {
                var result;
                result = umd.detectConfig('// other text\n\t// fid-umd {"works":true}\nMore text');
                expect(result).toEqual({
                    works: true
                });
            });
        });

        describe('expandDepends()', function () {
            it('parses a name', function () {
                var result;
                result = umd.expandDepends('SomeName');
                expect(result).toEqual({
                    commonjs: 'SomeName',
                    name: 'SomeName',
                    requirejs: 'SomeName',
                    root: 'SomeName',
                    yui: 'SomeName'
                });
            });

            it('defaults name to Unknown', function () {
                var result;
                result = umd.expandDepends({});
                expect(result).toEqual({
                    commonjs: 'Unknown',
                    name: 'Unknown',
                    requirejs: 'Unknown',
                    root: 'Unknown',
                    yui: 'Unknown'
                });
            });

            it('defaults everything to name', function () {
                var result;
                result = umd.expandDepends({
                    name: 'Elephant'
                });
                expect(result).toEqual({
                    commonjs: 'Elephant',
                    name: 'Elephant',
                    requirejs: 'Elephant',
                    root: 'Elephant',
                    yui: 'Elephant'
                });
            });

            it('filters out invalid properties', function () {
                var result;
                result = umd.expandDepends({
                    name: 'Elephant',
                    garbage: true,
                    joiner: ', '
                });
                expect(result).toEqual({
                    commonjs: 'Elephant',
                    name: 'Elephant',
                    requirejs: 'Elephant',
                    root: 'Elephant',
                    yui: 'Elephant'
                });
            });

            it('preserves all good properties', function () {
                var obj, result;
                obj = {
                    commonjs: 'CommonJS',
                    name: 'Name',
                    requirejs: 'RequireJS',
                    root: 'Root',
                    yui: 'YUI'
                };
                result = umd.expandDepends(obj);
                expect(result).toEqual(obj);
            });
        });

        describe('exportConfig()', function () {
            beforeEach(function () {
                spyOn(umd, 'unexpandDepends').andCallFake(function (input) {
                    return input;
                });
            });

            it('preserves only known keys', function () {
                var result;
                result = umd.exportConfig({
                    twinkle: 'twinkle',
                    little: 'star',
                    name: 'TestModule',
                    jslint: true,
                    depends: [
                        'one',
                        'two'
                    ],
                    telephone: 1
                });
                result = JSON.parse(result);
                expect(result).toEqual({
                    jslint: 1,  // Condensed to 1
                    depends: [
                        'one',
                        'two'
                    ],
                    name: 'TestModule'
                });
            });

            it('condenses values', function () {
                var result;
                result = umd.exportConfig({
                    jslint: false,  // Removed if falsy
                    depends: [],  // Removed if empty
                    name: '',  // Removed if length of 0
                    debug: true  // Converted to 1
                });
                result = JSON.parse(result);
                expect(result).toEqual({
                    debug: 1
                });
            });
        });

        describe('makeLetter()', function () {
            it('starts off with "a"', function () {
                var result;
                result = umd.makeLetter(0);
                expect(result).toEqual('a');
            });
            it('continues to "z"', function () {
                var result;
                result = umd.makeLetter(25);
                expect(result).toEqual('z');
            });
            it('then goes to "a0"', function () {
                var result;
                result = umd.makeLetter(26);
                expect(result).toEqual('a0');
            });
        });

        describe('standardizeConfig()', function () {
            beforeEach(function () {
                spyOn(umd, 'expandDepends').andCallFake(function (input) {
                    return input;
                });
            });

            it('sets good defaults', function () {
                var result;
                result = umd.standardizeConfig({});
                expect(result).toEqual({
                    debug: false,
                    depends: [],
                    global: false,
                    jslint: false,
                    name: 'Unknown'
                });
            });

            it('uses existing values', function () {
                var result;
                result = umd.standardizeConfig({
                    debug: true,
                    depends: [
                        'one',
                        'two'
                    ],
                    jslint: true,
                    name: 'Waffle'
                });
                expect(result).toEqual({
                    debug: true,
                    depends: [
                        'one',
                        'two'
                    ],
                    global: false,
                    jslint: true,
                    name: 'Waffle'
                });
            });
        });

        describe('splitCode()', function () {
            it('returns all code as first element when no markers present', function () {
                var result;
                result = umd.splitCode('abcdef', /AAA/, /BBB/);
                expect(result).toEqual([
                    'abcdef',
                    ''
                ]);
            });

            it('works with one marker present', function () {
                var result;
                result = umd.splitCode('abcAAAdef', /AAA/, /BBB/);
                expect(result).toEqual([
                    'abc',
                    'def'
                ]);
            });

            it('works with both markers present', function () {
                var result;
                result = umd.splitCode('abcAAAdefBBBghi', /AAA/, /BBB/);
                expect(result).toEqual([
                    'abc',
                    'ghi'
                ]);
            });

            it('is not fooled by multiple markers', function () {
                var result;
                result = umd.splitCode('abcAAAdefAAAghiBBBjklAAAmnoBBBpqrBBB', /AAA/, /BBB/);
                expect(result).toEqual([
                    'abc',
                    'jklAAAmnoBBBpqrBBB'
                ]);
            });
        });

        describe('stringifyArray()', function () {
            it('stringifies an empty array', function () {
                var result;
                result = umd.stringifyArray([]);
                expect(result).toBe('[]');
            });

            it('stringifies an array with one item', function () {
                var result;
                result = umd.stringifyArray(['one']);
                expect(result).toBe('["one"]');
            });

            it('stringifies an array with three items', function () {
                var result;
                result = umd.stringifyArray(['one', 'two', 'three']);
                expect(result).toBe('["one", "two", "three"]');
            });
        });

        describe('tryTo()', function () {
            it('skips debug code and keeps using "ignore"', function () {
                var result;
                result = umd.tryTo('STRING', {}, 'method');
                expect(result).toEqual('    try { STRING } catch (ignore) {}\n');
                result = umd.tryTo('STRING2', {}, 'method');
                expect(result).toEqual('    try { STRING2 } catch (ignore) {}\n');
            });

            it('adds debug code', function () {
                var result;
                result = umd.tryTo('STRING', {
                    debug: true
                }, 'method');
                expect(result).toEqual('    try { STRING } catch (a) { console.log("method attempt failed for " + n, a); }\n');
            });

            it('keeps incrementing the counter to provide unique catch variables', function () {
                var expectedVariables;

                // Skip f, n, r, s and ones with a leading number
                expectedVariables = ['a', 'b', 'c', 'd', 'e', 'g', 'h', 'i',
                    'j', 'k', 'l', 'm', 'o', 'p', 'q', 't', 'u', 'v',
                    'w', 'x', 'y', 'z', 'a0', 'a1', 'a2'];

                expectedVariables.forEach(function (expected) {
                    var result;
                    result = umd.tryTo('AAA', {
                        debug: true
                    }, 'method');
                    expect(result).toContain('catch (' + expected + ')');
                });
            });
        });

        describe('unexpandDepends()', function () {
            it('can keep all values that are unique', function () {
                var obj, result;
                obj = {
                    commonjs: 'CommonJS',
                    name: 'Name',
                    requirejs: 'RequireJS',
                    root: 'Root',
                    yui: 'YUI'
                };
                result = umd.unexpandDepends(obj);
                expect(result).toEqual(obj);
            });

            it('removes properties that match "name"', function () {
                var result;
                result = umd.unexpandDepends({
                    commonjs: 'b',
                    name: 'a',
                    requirejs: 'a',
                    root: 'b',
                    yui: 'a'
                });
                expect(result).toEqual({
                    commonjs: 'b',
                    name: 'a',
                    root: 'b'
                });
            });

            it('consolidates an object to a string if they all match "name"', function () {
                var result;
                result = umd.unexpandDepends({
                    commonjs: 'a',
                    name: 'a',
                    requirejs: 'a',
                    root: 'a',
                    yui: 'a'
                });
                expect(result).toEqual('a');
            });
        });
    });

    describe('functionally test update* methods', function () {
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
            it('removes the full header when just using a marker', function () {
                var result, split, umd;
                umd = new FidUmd();
                result = umd.update('// fid-umd {"name":"Awesome","depends":["FakeLibrary","TestingModule"]}\nCODE');
                split = result.split(/ fid-umd /);
                expect(split[0]).toBe('//');
                expect(split[2]).toBe('end\nCODE\n    //');
                expect(split[4]).toBe('post-end\n');
            });

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
                code += '    //my stuff goes here\n';
                code += '    function TestingThing() {}\n';
                code += '    return TestingThing;\n';
                code += postamble;
                code += '// and here is the real end';
                result = umd.update(code);
                expect(result).toEqual(code);
            });
        });
    });
});

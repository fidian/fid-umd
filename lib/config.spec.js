/**
 * Tests confirming FidUmd operates as expected
 */
/*global beforeEach, describe, expect, it, jasmine, spyOn*/

'use strict';

var Config;

Config = require('./config');
describe('Config', function () {
    describe('constructor', function () {
        it('constructs with "new"', function () {
            var config;

            config = new Config();
            expect(config instanceof Config).toBe(true);
        });
        it('constructs without "new"', function () {
            var config, configConstructor;

            configConstructor = Config;  // Work around jslint
            config = configConstructor();
            expect(config instanceof Config).toBe(true);
        });
    });
    describe('instance', function () {
        var config;

        beforeEach(function () {
            config = new Config();
        });
        describe('initially', function () {
            it('has required properties', function () {
                expect(config.debug).toBe(false);
                expect(config.depends).toEqual([]);
                expect(config.functionsNeeded).toEqual({});
                expect(config.global).toBe(false);
                expect(config.globalVariables).toEqual({});
                expect(config.jslint).toBe(false);
                expect(config.name).toBe('Unknown');
            });
        });
        describe('dependsProperty()', function () {
            it('works with no depends', function () {
                expect(config.dependsProperty('name')).toEqual([]);
            });
            it('returns the correct property', function () {
                config.depends = [
                    {
                        name: 'name1',
                        sven: 'sven1'
                    },
                    {
                        name: 'name2',
                        sven: 'sven2'
                    }
                ];
                expect(config.dependsProperty('sven')).toEqual([
                    'sven1',
                    'sven2'
                ]);
            });
            it('returns undefined when appropriate', function () {
                config.depends = [
                    {
                        name: 'name1'
                    },
                    {
                        name: 'name2'
                    }
                ];
                expect(config.dependsProperty('Name')).toEqual([
                    undefined,
                    undefined
                ]);
            });
        });
        describe('expandDepends()', function () {
            it('parses a name', function () {
                var result;

                result = config.expandDepends('SomeName');
                expect(result).toEqual({
                    amd: 'SomeName',
                    commonjs: 'SomeName',
                    commonjsmod: '',
                    modulejs: 'SomeName',
                    name: 'SomeName',
                    nodejs: 'SomeName',
                    root: 'SomeName',
                    yui: 'SomeName'
                });
            });
            it('defaults name to Unknown', function () {
                var result;

                result = config.expandDepends({});
                expect(result).toEqual({
                    amd: 'Unknown',
                    commonjs: 'Unknown',
                    commonjsmod: '',
                    modulejs: 'Unknown',
                    name: 'Unknown',
                    nodejs: 'Unknown',
                    root: 'Unknown',
                    yui: 'Unknown'
                });
            });
            it('defaults everything to name', function () {
                var result;

                result = config.expandDepends({
                    name: 'Elephant'
                });
                expect(result).toEqual({
                    amd: 'Elephant',
                    commonjs: 'Elephant',
                    commonjsmod: '',
                    modulejs: 'Elephant',
                    name: 'Elephant',
                    nodejs: 'Elephant',
                    root: 'Elephant',
                    yui: 'Elephant'
                });
            });
            it('filters out invalid properties', function () {
                var result;

                result = config.expandDepends({
                    name: 'Elephant',
                    garbage: true,
                    joiner: ', '
                });
                expect(result).toEqual({
                    amd: 'Elephant',
                    commonjs: 'Elephant',
                    commonjsmod: '',
                    modulejs: 'Elephant',
                    name: 'Elephant',
                    nodejs: 'Elephant',
                    root: 'Elephant',
                    yui: 'Elephant'
                });
            });
            it('preserves all good properties', function () {
                var obj, result;

                obj = {
                    amd: 'AMD',
                    commonjs: 'CommonJS',
                    commonjsmod: 'CommonJSMod',
                    modulejs: 'ModuleJS',
                    name: 'Name',
                    nodejs: 'NodeJS',
                    root: 'Root',
                    yui: 'YUI'
                };
                result = config.expandDepends(obj);
                expect(result).toEqual(obj);
            });
        });
        describe('exportConfig()', function () {
            beforeEach(function () {
                spyOn(config, 'unexpandDepends').and.callFake(function (input) {
                    return input;
                });
            });
            it('preserves only known keys', function () {
                var result;

                config.twinkle = 'twinkle';  // Ignored
                config.name = 'TestModule';
                config.jslint = true;  // Condensed to 1
                config.depends = [
                    'one',
                    'two'
                ];
                result = config.exportConfig();
                result = JSON.parse(result);
                expect(result).toEqual({
                    jslint: 1,
                    depends: [
                        'one',
                        'two'
                    ],
                    name: 'TestModule'
                });
            });
            it('condenses values', function () {
                var result;

                config.debug = true;  // Converted to 1
                config.name = '';  // Removed if length of 0
                result = config.exportConfig();
                result = JSON.parse(result);
                expect(result).toEqual({
                    debug: 1
                });
            });
        });
        describe('loadConfig()', function () {
            function compareProperties(expected) {
                Object.keys(expected).forEach(function (key) {
                    expect(config[key]).toEqual(expected[key]);
                });
            }

            beforeEach(function () {
                spyOn(config, 'expandDepends').and.callFake(function (input) {
                    return input;
                });
            });
            it('sets good defaults', function () {
                config.loadConfig({});
                compareProperties({
                    debug: false,
                    depends: [],
                    global: false,
                    jslint: false,
                    name: 'Unknown'
                });
            });
            it('uses existing values', function () {
                config.loadConfig({
                    debug: true,
                    depends: [
                        'one',
                        'two'
                    ],
                    jslint: true,
                    name: 'Waffle'
                });
                compareProperties({
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
        describe('unexpandDepends()', function () {
            it('can keep all values that are unique', function () {
                var obj, result;
                obj = {
                    amd: 'AMD',
                    commonjs: 'CommonJS',
                    commonjsmod: 'CommonJSMod',
                    modulejs: 'ModuleJS',
                    name: 'Name',
                    nodejs: 'NodeJS',
                    root: 'Root',
                    yui: 'YUI'
                };
                result = config.unexpandDepends(obj);
                expect(result).toEqual(obj);
            });

            it('removes properties that match "name"', function () {
                var result;
                result = config.unexpandDepends({
                    amd: 'a',
                    commonjs: 'b',
                    modulejs: 'a',
                    name: 'a',
                    nodejs: 'a',
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
                result = config.unexpandDepends({
                    amd: 'a',
                    commonjs: 'a',
                    name: 'a',
                    modulejs: 'a',
                    nodejs: 'a',
                    root: 'a',
                    yui: 'a'
                });
                expect(result).toEqual('a');
            });
        });
    });
});

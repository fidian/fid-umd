/**
 * Tests confirming FidUmd operates as expected
 */
/*global beforeEach, describe, expect, it, jasmine, spyOn*/

'use strict';

var FidUmd;

FidUmd = require('./fid-umd');
describe('FidUmd', function () {
    describe('construction', function () {
        it('constructs with "new"', function () {
            var umd;
            umd = new FidUmd();
            expect(umd instanceof FidUmd).toBe(true);
        });
        it('constructs without "new"', function () {
            var fidUmd, umd;

            fidUmd = FidUmd;  // Work around jslint
            umd = fidUmd();
            expect(umd instanceof FidUmd).toBe(true);
        });
    });
    describe('instance', function () {
        var umd;

        beforeEach(function () {
            umd = new FidUmd();
        });
        describe('configureModuleSystems', function () {
            it('returns instances of the module systems', function () {
                var result;

                result = umd.configureModuleSystems({
                    dependsProperty: function () {
                        return 'fake config';
                    },
                    functionsNeeded: {},
                    globalVariables: {}
                });
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(6);
                expect(result[0] instanceof require('./modules/nodejs')).toBe(true);
                expect(result[1] instanceof require('./modules/commonjs')).toBe(true);
                expect(result[2] instanceof require('./modules/amd')).toBe(true);
                expect(result[3] instanceof require('./modules/modulejs')).toBe(true);
                expect(result[4] instanceof require('./modules/yui')).toBe(true);
                expect(result[5] instanceof require('./modules/root')).toBe(true);
            });
        });
        describe('createPostamble', function () {
            it('returns a footer that closes the header', function () {
                var result;

                result = umd.createPostamble();
                expect(result).toContain('\n}));\n');
            });
        });
        describe('createPreamble()', function () {
            var configSpy;

            beforeEach(function () {
                spyOn(umd, 'configureModuleSystems').and.returnValue([]);
                spyOn(umd, 'createPreambleGlobalScope').and.returnValue('CREATE_PREAMBLE_GLOBAL_SCOPE\n');
                spyOn(umd, 'jslintGlobalVariables').and.returnValue('JSLINT_GLOBAL_VARIABLES\n');
                spyOn(umd, 'writeNeededFunctions').and.returnValue('NEEDED_FUNCTIONS\n');
                configSpy = jasmine.createSpyObj('config', [
                    'dependsProperty',
                    'exportConfig'
                ]);
                configSpy.dependsProperty.and.returnValue([
                    'DEPENDS',
                    'PROPERTY']);
                configSpy.exportConfig.and.returnValue('EXPORT_CONFIG');
                configSpy.name = 'ConfigSpy';
            });
            describe('empty config', function () {
                it('writes a basic preamble', function () {
                    expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factory) {\nNEEDED_FUNCTIONS\n\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    // fid-umd end\n');
                });
            });
            describe('when global is enabled', function () {
                it('writes a global preamble', function () {
                    configSpy.global = true;
                    expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factoryForGlobal) {\nCREATE_PREAMBLE_GLOBAL_SCOPE\nNEEDED_FUNCTIONS\n\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    // fid-umd end\n');
                });
            });
            describe('when jslint is enabled', function () {
                it('adds "use strict" and a directive to ignore this', function () {
                    configSpy.jslint = true;
                    expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\n/*jslint this*/\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factory) {\n    "use strict";\nNEEDED_FUNCTIONS\n\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    "use strict";\n    // fid-umd end\n');
                });
            });
            describe('when debug is enabled', function () {
                it('writes a basic preamble', function () {
                    configSpy.debug = true;
                    expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factory) {\nNEEDED_FUNCTIONS\n    console.log("Attempting to define " + name);\n\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    // fid-umd end\n');
                });
            });
            describe('with three modules', function () {
                beforeEach(function () {
                    umd.configureModuleSystems.and.returnValue([
                        {
                            condition: function () {
                                return 'condition1';
                            },
                            loader: function () {
                                return 'loader1';
                            },
                            name: 'one'
                        },
                        {
                            condition: function () {
                                return 'condition2';
                            },
                            loader: function () {
                                return 'loader2';
                            },
                            name: 'two'
                        },
                        {
                            condition: function () {
                                return null;
                            },
                            loader: function () {
                                return 'loader3';
                            },
                            name: 'three'
                        }
                    ]);
                });
                it('writes a basic preamble', function () {
                    expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factory) {\nNEEDED_FUNCTIONS\n    if (condition1) {\n        loader1\n    } else if (condition2) {\n        loader2\n    } else {\n        loader3\n    }\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    // fid-umd end\n');
                });
                describe('with debug enabled', function () {
                    it('writes extended debugging information', function () {
                        configSpy.debug = true;
                        expect(umd.createPreamble(configSpy)).toBe('// fid-umd EXPORT_CONFIG\nJSLINT_GLOBAL_VARIABLES\n(function (name, root, factory) {\nNEEDED_FUNCTIONS\n    console.log("Attempting to define " + name);\n    if (condition1) {\n        console.log("one detected");\n        loader1\n        console.log("one success");\n    } else if (condition2) {\n        console.log("two detected");\n        loader2\n        console.log("two success");\n    } else {\n        console.log("three detected");\n        loader3\n        console.log("three success");\n    }\n}("ConfigSpy", this, function (DEPENDS, PROPERTY) {\n    // fid-umd end\n');
                    });
                });
            });
        });
        describe('createPreambleGlobalScope()', function () {
            var configSpy;

            beforeEach(function () {
                configSpy = jasmine.createSpyObj('config', [
                    'dependsProperty'
                ]);
            });
            describe('without dependencies', function () {
                beforeEach(function () {
                    configSpy.dependsProperty.and.returnValue([]);
                });
                it('does not require dependencies', function () {
                    expect(umd.createPreambleGlobalScope(configSpy)).toEqual('    function factory() { return factoryForGlobal.call(root); };\n');
                });
            });
            describe('with dependencies', function () {
                beforeEach(function () {
                    configSpy.dependsProperty.and.returnValue([
                        'DEPENDS',
                        'PROPERTY'
                    ]);
                });
                it('includes dependencies', function () {
                    expect(umd.createPreambleGlobalScope(configSpy)).toEqual('    function factory(DEPENDS, PROPERTY) { return factoryForGlobal.call(root, DEPENDS, PROPERTY); };\n');
                });
            });
        });
        describe('detectConfig()', function () {
            var ConfigConstructor, loadConfig;

            beforeEach(function () {
                ConfigConstructor = function () {
                    return undefined;
                };
                loadConfig = jasmine.createSpy('loadConfig');
                ConfigConstructor.prototype.loadConfig = loadConfig;
            });
            it('works when no config was found', function () {
                umd.detectConfig('// some JavaScript code', ConfigConstructor);
                expect(loadConfig).not.toHaveBeenCalled();
            });
            it('requires JSON object', function () {
                umd.detectConfig('// fid-umd { blah blah', ConfigConstructor);
                expect(loadConfig).not.toHaveBeenCalled();
            });
            it('falls back to a plain config with invalid JSON', function () {
                expect(function () {
                    umd.detectConfig('// fid-umd {{}', ConfigConstructor);
                }).toThrow();
            });
            it('uses an existing JSON object', function () {
                umd.detectConfig('// other text\n\t// fid-umd {"works":true}\nMore text', ConfigConstructor);
                expect(loadConfig).toHaveBeenCalledWith({
                    works: true
                });
            });
        });
        describe('jslintGlobalVariables()', function () {
            it('returns nothing when jslint is disabled', function () {
                var result;

                result = umd.jslintGlobalVariables({
                    globalVariables: {
                        one: 1,
                        two: 2
                    },
                    jslint: false
                });
                expect(result).toEqual('');
            });
            it('returns nothing for no globals', function () {
                var result;

                result = umd.jslintGlobalVariables({
                    globalVariables: {},
                    jslint: true
                });
                expect(result).toEqual('');
            });
            it('returns comment with global variables', function () {
                var result;

                result = umd.jslintGlobalVariables({
                    globalVariables: {
                        one: 1,
                        two: 2
                    },
                    jslint: true
                });
                expect(result).toEqual('/* global one, two */\n');
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
        describe('writeNeededFunctions', function () {
            it('does nothing by default', function () {
                expect(umd.writeNeededFunctions({
                    functionsNeeded: {}
                })).toEqual('');
            });
            it('has an "isObject" function', function () {
                expect(umd.writeNeededFunctions({
                    functionsNeeded: {
                        isObject: true
                    }
                })).toEqual('    function isObject(x) { return typeof x === "object"; }\n');
            });
            it('adds newlines to "isObject" for jslint', function () {
                expect(umd.writeNeededFunctions({
                    functionsNeeded: {
                        isObject: true
                    },
                    jslint: true
                })).toEqual('    function isObject(x) {\n        return typeof x === "object";\n    }\n');
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

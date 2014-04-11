/**
 * Config - Configuration object for FidUmd markup
 *
 * @module Config
 * @license MIT
 */
// fid-umd {"name":"Config","jslint":1}
/*global define, modulejs, YUI*/
(function (name, root, factory) {
    "use strict";
    function isObject(x) { return typeof x === "object"; }
    if (isObject(module) && isObject(module.exports)) {
        module.exports = factory();
    } else if (isObject(exports)) {
        exports[name] = factory();
    } else if (isObject(define) && define.amd) {
        define(name, [], factory);
    } else if (isObject(modulejs)) {
        modulejs.define(name, factory);
    } else if (isObject(YUI)) {
        YUI.add(name, function (Y) { Y[name] = factory(); });
    } else {
        root[name] = factory();
    }
}("Config", this, function () {
    "use strict";
    // fid-umd end


    /**
     * Create a new configuration object
     *
     * @constructor
     * @alias module:Config
     * @property {string} name Module name
     * @property {!Array.<~depends>} depends Dependencies
     * @property {boolean} global When true, factory runs in global scope
     * @property {boolean} jslint Flag enabling jslint comments
     * @property {string} name Name of module being created
     */
    function Config() {
        if (!(this instanceof Config)) {
            return new Config();
        }

        this.debug = false;
        this.depends = [];
        this.functionsNeeded = {};
        this.global = false;
        this.globalVariables = {};  // For jslint's special comment
        this.jslint = false;
        this.name = 'Unknown';
    }


    /**
     * Config properties used when loading/saving fid-umd header markers.
     * Keep these in non-alphabetical order and instead sort them by
     * where they should appear in the resulting object.
     *
     * @readonly
     * @const
     */
    Config.prototype.configProperties = {
        name: 'string',
        debug: 'boolean',
        jslint: 'boolean',
        global: 'boolean',
        depends: 'array'
    };


    /**
     * Module loading systems
     *
     * @readonly
     * @const
     */
    Config.prototype.configModuleSystems = [
        "amd",
        "commonjs",
        "modulejs",
        "nodejs",
        "root",
        "yui"
    ];


    /**
     * Additional configuration for module loading systems
     */
    Config.prototype.configModuleSystemsAdditional = [
        "commonjsmod"
    ];


    /**
     * Grab a value from all of the depends
     *
     * @param {!Array.<~depends>} depends Array of depends objects
     * @param {string} property Name of property
     * @return {Array.<string>} The values from the depends objects
     */
    Config.prototype.dependsProperty = function (property) {
        return this.depends.map(function (oneDependency) {
            return oneDependency[property];
        });
    };


    /**
     * Expanded depends objects
     *
     * @typedef {Object} Config~depends
     * @property {string} amd Module name/path for AMD
     * @property {string} commonjs Filename for CommonJS
     * @property {string} commonjsmod Module name for CommonJS
     * @property {string} name Module name as seen inside your function
     * @property {string} root Name in a root object, like a browser's window
     * @property {string} yui YUI Module name
     */


    /**
     * Force properties to be in a standard form to reduce the code elsewhere.
     *
     * @param {!Object} inObj Shortened form of {@link Config}
     * @return this
     */
    Config.prototype.loadConfig = function (inObj) {
        var self;

        self = this;
        Object.keys(this.configProperties).forEach(function (key) {
            var v = inObj[key];

            switch (self.configProperties[key]) {
            case 'array':
                // Preserve if length > 0
                if (!Array.isArray(v) || !v.length) {
                    v = [];
                }
                break;

            case 'boolean':
                // Cast to boolean
                v = !!v;
                break;

            case 'string':
                // Save strings that have a length
                if (typeof v !== 'string' || !v.length) {
                    v = "";
                }

                break;
            }

            self[key] = v;
        });

        // Set defaults
        if (self.name === "") {
            self.name = 'Unknown';
        }

        // Expand depends into full objects
        self.depends = self.depends.map(this.expandDepends.bind(this));

        return this;
    };


    /**
     * Expand a depends array into a an array of full object
     *
     * Full object has these properties
     *   amd: Module name/path to load, defaults to "name" property
     *   nodejs: Module or filename to load, defaults to "name" property
     *   commonjs: Filename to load, defaults to "name" property
     *   commonjsmod: Module to load, defaults using the object that's returned
     *   name: Name of the variable passed into the factory
     *   root: Property off root object, defaults to "name" property
     *   yui: YUI module name, defaults to "name" property
     *
     * Input (JSON) -> output (JavaScript) examples:
     *   "Name" ->
     *     { commonjs: "Name", commonjsmod: "", name: "Name",
     *       nodejs: "Name", amd: "Name", root: "Name", yui: "Name" }
     *   {"name":"Template",commonjs:"./template",root:"TemplateThing"} ->
     *     { commonjs: "./template", commonjsmod: "Template", name: "Template",
     *       nodejs: "Template", amd: "Template", root: "TemplateThing",
     *       yui: "Template" }
     *
     * @param {!(string|Object)} input
     * @return {Config~depends}
     */
    Config.prototype.expandDepends = function (input) {
        var result, self;

        function copyProperty(prop) {
            if (input[prop]) {
                result[prop] = input[prop];
            } else {
                result[prop] = result.name;
            }
        }

        function makeDefault(str) {
            var output;

            output = {
                name: str
            };
            self.configModuleSystems.forEach(function (systemName) {
                output[systemName] = str;
            });

            return output;
        }

        self = this;

        if (typeof input === 'string') {
            return makeDefault(input);
        }

        if (!input.name) {
            result = makeDefault('Unknown');
        } else {
            result = makeDefault(input.name);
        }

        this.configModuleSystems.forEach(copyProperty);
        this.configModuleSystemsAdditional.forEach(copyProperty);

        return result;
    };


    /**
     * Export the config as a string, only preserving properties we want and
     * in a minimal format.
     *
     * Only preserves these properties:
     *     name:  string
     *     depends:  array of strings unless it is empty
     *     jslint:  boolean, saved as 1 or unset
     *
     * @return {string}
     */
    Config.prototype.exportConfig = function () {
        var outObj, self;

        self = this;
        outObj = {};

        Object.keys(this.configProperties).forEach(function (key) {
            var v = self[key];

            // We never save falsy values
            if (!v) {
                return;
            }

            switch (self.configProperties[key]) {
            case 'array':
                // Preserve if length > 0
                if (!Array.isArray(v) || !v.length) {
                    return;
                }
                break;

            case 'boolean':
                // Save as a 1, a very short value
                v = 1;
                break;

            case 'string':
                // Save strings that have a length
                if (typeof v !== 'string' || !v.length) {
                    return;
                }

                break;
            }
            outObj[key] = v;
        });

        // Shrink the depends array of objects
        if (outObj.depends) {
            outObj.depends = outObj.depends.map(this.unexpandDepends.bind(this));
        }

        return JSON.stringify(outObj);
    };


    /**
     * Condense a depends object into as small of a form as possible.
     * This is the reverse of expandDepends()
     *
     * @param {!Config~depends} input
     * @return {(Object|string)} Shortened form of {@link FidUmd~depends}
     */
    Config.prototype.unexpandDepends = function (input) {
        var output;

        output = {
            name: input.name
        };
        this.configModuleSystems.forEach(function (prop) {
            if (input[prop] !== input.name) {
                output[prop] = input[prop];
            }
        });
        this.configModuleSystemsAdditional.forEach(function (prop) {
            if (input[prop]) {
                output[prop] = input[prop];
            }
        });

        if (Object.keys(output).length === 1) {
            return output.name;
        }

        return output;
    };


    return Config;


    // fid-umd post
}));
// fid-umd post-end

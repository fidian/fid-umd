!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.FidUmd=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Configuration object for FidUmd
 */
"use strict";


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
        if (input[prop] !== undefined) {
            result[prop] = input[prop];
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
        self.configModuleSystemsAdditional.forEach(function (systemName) {
            output[systemName] = '';
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


module.exports = Config;

},{}],2:[function(require,module,exports){
/**
 * Amd - UMD generator fragment for AMD
 *
 * @module Amd
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Amd
 * @param {Config} config
 */
function Amd(config) {
    if (!(this instanceof Amd)) {
        return new Amd(config);
    }

    this.config = config;
    this.name = "amd";
    this.depends = config.dependsProperty(this.name);
    config.functionsNeeded.isObject = true;
    config.globalVariables.define = true;
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * For AMD, you need to use the `define` function, but only after
 * you check for `define.amd` to be truthy.
 *
 * @return {string}
 */
Amd.prototype.condition = function () {
    return 'isObject(root.define) && root.define.amd';
};


/**
 * Generate the module load code.
 *
 * For AMD, this looks like the following examples, making calls to
 * a `define` function.
 *
 *     define(factory);
 *     define([ "One", "Two" ], factory);
 *
 * @return {string}
 */
Amd.prototype.loader = function () {
    var code;

    code = 'root.define(name, [';

    if (this.depends.length) {
        code += '"' + this.depends.join('", "') + '"';
    }

    code += '], factory);';

    return code;
};


module.exports = Amd;

},{}],3:[function(require,module,exports){
/**
 * Commonjs - UMD generator fragment for CommonJS
 *
 * @module Commonjs
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Commonjs
 * @param {Config} config
 */
function Commonjs(config) {
    if (!(this instanceof Commonjs)) {
        return new Commonjs(config);
    }

    this.name = "commonjs";
    this.config = config;
    this.config.globalVariables.exports = true;
    this.dependsFile = config.dependsProperty(this.name);
    this.dependsModule = config.dependsProperty(this.name + "mod");
    config.functionsNeeded.isObject = true;
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * For common.js, you are supposed to only add properties to `exports`.
 * To keep this in line with other module loaders, only one thing is added
 * to `exports`, which matches the module name.  This may not be the same
 * for other CommonJS modules.
 *
 * @return {string}
 */
Commonjs.prototype.condition = function () {
    return 'isObject(root.exports)';
};


/**
 * Generate the module load code.
 *
 * For CommonJS, this looks like one of these examples.
 *
 *     exports.myModule = factory();
 *     exports.myModule = factory(require('one').One, require('two').Two);
 *
 * @return {string}
 */
Commonjs.prototype.loader = function () {
    var code, i;

    code = 'root.exports[name] = factory(';

    for (i = 0; i < this.dependsFile.length; i += 1) {
        if (i > 0) {
            code += ', ';
        }

        code += 'root.require(' + JSON.stringify(this.dependsFile[i]) + ')';

        if (this.dependsModule[i]) {
            code += '.' + this.dependsModule[i];
        }
    }

    code += ');';

    return code;
};


module.exports = Commonjs;

},{}],4:[function(require,module,exports){
/**
 * Modulejs - UMD generator fragment for modulejs
 *
 * @module Modulejs
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Modulejs
 * @param {Config} config
 */
function Modulejs(config) {
    if (!(this instanceof Modulejs)) {
        return new Modulejs(config);
    }

    this.config = config;
    this.name = "modulejs";
    this.depends = config.dependsProperty(this.name);
    config.functionsNeeded.isObject = true;
    config.globalVariables.modulejs = true;
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * For modulejs, everything is accessed via the `modulejs` object.
 *
 * @return {string}
 */
Modulejs.prototype.condition = function () {
    return 'isObject(root.modulejs)';
};


/**
 * Generate the module load code.
 *
 * For modulejs, this looks like the following examples, which is very
 * similar to RequireJS.
 *
 *     modulejs.define("myModule", factory);
 *     modulejs.define("myModule", [ "One", "Two" ], factory);
 *
 * @return {string}
 */
Modulejs.prototype.loader = function () {
    var code;

    code = 'root.modulejs.define(name, ';

    if (this.depends.length) {
        code += '["' + this.depends.join('", "') + '"], ';
    }

    code += 'factory);';

    return code;
};


module.exports = Modulejs;

},{}],5:[function(require,module,exports){
/**
 * Nodejs - UMD generator fragment for Node.js
 *
 * @module Nodejs
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Nodejs
 * @param {Config} config
 */
function Nodejs(config) {
    if (!(this instanceof Nodejs)) {
        return new Nodejs(config);
    }

    this.config = config;
    this.config.globalVariables.module = true;
    this.name = "nodejs";
    this.depends = config.dependsProperty(this.name);
    config.functionsNeeded.isObject = true;
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * For Node.js, you are supposed to replace `module.exports` with the
 * thing you wish to export, or add properties to `exports`.  We choose
 * the former version to export just one object.
 *
 * @return {string}
 */
Nodejs.prototype.condition = function () {
    return 'isObject(root.module) && isObject(root.module.exports)';
};


/**
 * Generate the module load code.
 *
 * For Node.js, this looks like `module.exports = factory()`, passing
 * in dependencies to the factory.
 *
 *     module.exports = factory();
 *     module.exports = factory(require('one'), require('two'));
 *
 * @return {string}
 */
Nodejs.prototype.loader = function () {
    var code, i;

    code = 'root.module.exports = factory(';

    for (i = 0; i < this.depends.length; i += 1) {
        if (i > 0) {
            code += ', ';
        }

        code += 'root.require(' + JSON.stringify(this.depends[i]) + ')';
    }

    code += ');';

    return code;
};


module.exports = Nodejs;

},{}],6:[function(require,module,exports){
/**
 * Root - UMD generator fragment for adding to the global object
 *
 * @module Root
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Root
 * @param {Config} config
 */
function Root(config) {
    if (!(this instanceof Root)) {
        return new Root(config);
    }

    this.config = config;
    this.name = "root";
    this.depends = config.dependsProperty(this.name);
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * When we attach to the global object, we don't need to ever check.
 *
 * @return {string}
 */
Root.prototype.condition = function () {
    return '';
};


/**
 * Generate the module load code.
 *
 * For attaching to the global object, we just assume things have been
 * loaded.
 *
 *     root.myModule = factory();
 *     root.myModule = factory(root.One, root.Two);
 *
 * @return {string}
 */
Root.prototype.loader = function () {
    var code;

    code = 'root[name] = factory(';

    if (this.depends.length) {
        code += 'root.' + this.depends.join(', root.');
    }

    code += ');';

    return code;
};


module.exports = Root;

},{}],7:[function(require,module,exports){
/**
 * Yui - UMD generator fragment for YUI
 *
 * @module Yui
 * @license MIT
 */
"use strict";


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:Yui
 * @param {Config} config
 */
function Yui(config) {
    if (!(this instanceof Yui)) {
        return new Yui(config);
    }

    this.config = config;
    this.name = "yui";
    this.config.functionsNeeded.isObject = true;
    this.config.globalVariables.YUI = true;
    this.depends = config.dependsProperty(this.name);
}


/**
 * Return the condition that checks if this is the right environment.
 *
 * For YUI, you use the global YUI object.
 *
 * @return {string}
 */
Yui.prototype.condition = function () {
    var code;

    code = 'isObject(root.YUI)';

    return code;
};


/**
 * Generate the module load code.
 *
 * For YUI there are two syntaxes, one is for no dependencies and the other
 * lets you specify a list of dependencies.
 *
 *     YUI.add("myModule", function (Y) { Y.myModule = factory(); });
 *     YUI.add("myModule", function (Y) {
 *         Y.myModule = factory(Y.One, Y.Two); }, "",
 *         { requires: ["One", "Two"] });
 *
 * @return {string}
 */
Yui.prototype.loader = function () {
    var code;

    code = 'root.YUI.add(name, function (Y) { Y[name] = factory(';

    if (this.depends.length) {
        code += 'Y.' + this.depends.join(', Y.');
    }

    code += '); }';

    if (this.depends.length) {
        code += ', "", { requires: ["' + this.depends.join('", "') + '"] }';
    }

    code += ');';
    return code;
};


module.exports = Yui;

},{}],8:[function(require,module,exports){
/**
 * FidUmd - UMD generator to wrap your JavaScript modules
 *
 * @module FidUmd
 * @license MIT
 */
"use strict";

var Config, moduleSystemObjects;

// Prepare our list of module systems in the order we wish to use them
moduleSystemObjects = [
    require('./modules/nodejs'),
    require('./modules/commonjs'),
    require('./modules/amd'),
    require('./modules/modulejs'),
    require('./modules/yui'),
    require('./modules/root')
];

Config = require('./config');


/**
 * Create an object that can wrap code in UMD headers/footers
 *
 * @constructor
 * @alias module:FidUmd
 * @property {number} counter Used for generating unique variables in tryTo()
 */
function FidUmd() {
    if (!(this instanceof FidUmd)) {
        return new FidUmd();
    }
}


/**
 * Creates configured module system instances
 *
 * @return {Array.<Object>}
 */
FidUmd.prototype.configureModuleSystems = function (config) {
    return moduleSystemObjects.map(function (System) {
        return new System(config);
    });
};


/**
 * Create the postamble string.  This is almost always at the end of
 * the file
 *
 * @return {string}
 */
FidUmd.prototype.createPostamble = function () {
    return '    // fid-umd post\n}));\n// fid-umd post-end\n';
};


/**
 * Create a preamble string
 *
 * config is an object similar to this
 *
 * // No dependencies
 * config = {
 *     name: "MyObject"
 * }
 *
 * // Dependency on OneOne and TwoTwo
 * // For node, OneOne is an external library, TwoTwo is something local
 * config = {
 *     name: 'HorseRacingTrack',
 *     depends: [
 *         'OneOne',
 *         'TwoTwo'
 *     ]
 * }
 *
 * @param {!Config} config Controls dependencies and exported name
 * @return {string} Preamble
 */
FidUmd.prototype.createPreamble = function (config) {
    var code, dependencies, i, moduleSystems, preamble;

    moduleSystems = this.configureModuleSystems(config);

    // Marker for the preamble
    preamble = '// fid-umd ' + config.exportConfig() + '\n';
    preamble += this.jslintGlobalVariables(config);

    if (config.global) {
        preamble += '(function (name, root, factoryForGlobal) {\n';
    } else {
        preamble += '(function (name, root, factory) {\n';
    }

    if (config.jslint) {
        preamble += '    "use strict";\n';
    }

    if (config.global) {
        // This calls factoryWithoutContext in the global scope
        preamble += this.createPreambleGlobalScope(config);
    }

    preamble += this.writeNeededFunctions(config);

    if (config.debug) {
        preamble += '    console.log("Attempting to define " + name);\n';
    }

    // Add the various loaders
    for (i = 0; i < moduleSystems.length; i += 1) {
        if (i === 0) {
            preamble += '    ';
        } else {
            preamble += ' else ';
        }

        code = moduleSystems[i].condition();

        if (code) {
            preamble += 'if (' + code + ') ';
        }

        preamble += '{\n';

        if (config.debug) {
            preamble += '        console.log("' + moduleSystems[i].name + ' detected");\n';
        }

        preamble += '        ';
        preamble += moduleSystems[i].loader();
        preamble += '\n';

        if (config.debug) {
            preamble += '        console.log("' + moduleSystems[i].name + ' success");\n';
        }

        preamble += '    }';
    }

    // Finish the preamble
    dependencies = config.dependsProperty('name').join(', ');
    preamble += "\n";
    preamble += '}(' + JSON.stringify(config.name) + ', this, function (' + dependencies + ') {\n';

    if (config.jslint) {
        preamble += '    "use strict";\n';
    }

    preamble += '    // fid-umd end\n';
    return preamble;
};


/**
 * Defines the factory() function when we want to execute the
 * factory in global scope
 *
 * @param {!Config} config Determines dependencies
 * @return {string} Preamble
 */
FidUmd.prototype.createPreambleGlobalScope = function (config) {
    var dependencies, preamble;

    dependencies = config.dependsProperty('name').join(', ');
    preamble = '    function factory(' + dependencies + ') { return factoryForGlobal.call(root';

    if (dependencies) {
        preamble += ', ' + dependencies;
    }

    preamble += '); };\n';
    return preamble;
};


/**
 * Detect an existing config or create a new default config
 *
 * @param {string} code
 * @param {Function} ConfigConstructor
 * @return {Object} Short version of {@link FidUmd~config} object
 */
FidUmd.prototype.detectConfig = function (code, ConfigConstructor) {
    var config, matches, parsedConfig;

    /*jslint regexp:true*/
    matches = code.match(/\/\/ fid-umd (\{.*\})/);
    /*jslint regexp:false*/
    config = new ConfigConstructor();

    if (matches) {
        try {
            parsedConfig = JSON.parse(matches[1]);
            config.loadConfig(parsedConfig);
        } catch (e) {
            throw new Error('Invalid JSON: ' + matches[1]);
        }
    }

    return config;
};


/**
 * To avoid warnings with jslint, write a "globals" declaration
 * at the top of the UMD
 *
 * @param {Config} config
 * @return {string}
 */
FidUmd.prototype.jslintGlobalVariables = function (config) {
    var globals, name;

    globals = [];

    for (name in config.globalVariables) {
        if (config.globalVariables.hasOwnProperty(name)) {
            globals.push(name);
        }
    }

    if (!config.jslint || !globals.length) {
        return '';
    }

    return '/* global ' + globals.join(', ') + ' */\n';
};


/**
 * Split code into chunks
 *
 * Look for the first marker.
 *     If not found, return [ code, '' ]
 *     If found, look for the second marker after the first
 *         If not found, return [ code-before-first, code-after-first ]
 *         If found, return [code-before-first, code-after-second ]
 *
 * @param {string} code
 * @param {!RegExp} startMarker
 * @param {!RegExp} endMarker
 * @return {Array.<string>} Code before and after markers
 */
FidUmd.prototype.splitCode = function (code, startMarker, endMarker) {
    var match, result;

    result = [
        code,
        ''
    ];
    match = code.match(startMarker);

    if (!match) {
        // Did not match
        return result;
    }

    result[0] = code.substr(0, match.index);
    result[1] = code.substr(match.index + match[0].length);

    // Now look for the end marker
    match = result[1].match(endMarker);

    if (match) {
        // Limit the "after" portion to everything after the marker
        result[1] = result[1].substr(match.index + match[0].length);
    }

    return result;
};


/**
 * Update the UMD code in some JavaScript
 *
 * @param {string} oldCode
 * @return {string} Updated code with new preamble and postamble
 */
FidUmd.prototype.update = function (oldCode) {
    var config, newCode;

    if (!oldCode) {
        oldCode = '';
    }

    oldCode = oldCode.toString();
    config = this.detectConfig(oldCode, Config);
    newCode = oldCode;
    newCode = this.updatePreamble(newCode, config);
    newCode = this.updatePostamble(newCode);
    return newCode;
};


/**
 * Update the postamble
 *
 * @param {string} inCode Code to update
 * @param {!Config} config
 * @return {string} Updated code
 */
FidUmd.prototype.updatePostamble = function (inCode) {
    var outCode, outCodePieces;

    outCodePieces = this.splitCode(inCode, /^[\t ]*\/\/ fid-umd post\n?/m, /[\t ]*\/\/ fid-umd post-end\n?/m);
    outCode = outCodePieces[0];

    if (outCode.substr(-1) !== "\n") {
        outCode += "\n";
    }

    outCode += this.createPostamble() + outCodePieces[1];
    return outCode;
};


/**
 * Update the preamble
 *
 * @param {string} inCode Code to update
 * @param {!Config} config
 * @return {string} Updated code
 */
FidUmd.prototype.updatePreamble = function (inCode, config) {
    var outCode, outCodePieces;

    /*jslint regexp:true*/
    outCodePieces = this.splitCode(inCode, /^[ \t]*\/\/ fid-umd \{.*\n?/m, /^[ \t]*\/\/ fid-umd end\n?/m);
    /*jslint regexp:false*/

    // Force the preamble to be at the beginning
    if (outCodePieces[1] === '') {
        outCodePieces[1] = outCodePieces[0];
        outCodePieces[0] = '';
    }

    outCode = outCodePieces[0] + this.createPreamble(config) + outCodePieces[1];
    return outCode;
};


/**
 * Write out the code for necessary functions.
 *
 * @param {!Config} config
 * @return {string}
 */
FidUmd.prototype.writeNeededFunctions = function (config) {
    var result;

    result = '';

    if (config.functionsNeeded.isObject) {
        result += '    function isObject(x) { return typeof x === "object"; }\n';
    }

    return result;
};


module.exports = FidUmd;

},{"./config":1,"./modules/amd":2,"./modules/commonjs":3,"./modules/modulejs":4,"./modules/nodejs":5,"./modules/root":6,"./modules/yui":7}]},{},[8])(8)
});
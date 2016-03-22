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

    if (config.jslint) {
        preamble += '/*jslint this*/\n';
    }

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

        code = moduleSystems[i].condition(config);

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
        if (config.jslint) {
            result += '    function isObject(x) {\n        return typeof x === "object";\n    }\n';
        } else {
            result += '    function isObject(x) { return typeof x === "object"; }\n';
        }
    }

    return result;
};


module.exports = FidUmd;

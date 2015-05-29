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
Commonjs.prototype.condition = function (config) {
    if (config.jslint) {
        return '(typeof exports)[0] === "o"';
    }

    return 'isObject(exports)';
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

    code = 'exports[name] = factory(';

    for (i = 0; i < this.dependsFile.length; i += 1) {
        if (i > 0) {
            code += ', ';
        }

        code += 'require(' + JSON.stringify(this.dependsFile[i]) + ')';

        if (this.dependsModule[i]) {
            code += '.' + this.dependsModule[i];
        }
    }

    code += ');';

    return code;
};


module.exports = Commonjs;

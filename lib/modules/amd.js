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

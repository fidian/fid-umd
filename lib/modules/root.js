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

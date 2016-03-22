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

    if (this.config.jslint) {
        code = 'root.YUI.add(name, function (Y) {\n            Y[name] = factory(';
    } else {
        code = 'root.YUI.add(name, function (Y) { Y[name] = factory(';
    }

    if (this.depends.length) {
        code += 'Y.' + this.depends.join(', Y.');
    }

    if (this.config.jslint) {
        code += ');\n        }';
    } else {
        code += '); }';
    }

    if (this.depends.length) {
        code += ', "", { requires: ["' + this.depends.join('", "') + '"] }';
    }

    code += ');';
    return code;
};


module.exports = Yui;

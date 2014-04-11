/**
 * Yui - UMD generator fragment for YUI
 *
 * @module Yui
 * @license MIT
 */
// fid-umd {"name":"Yui","jslint":1}
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
}("Yui", this, function () {
    "use strict";
    // fid-umd end


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

        code = 'isObject(YUI)';

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

        code = 'YUI.add(name, function (Y) { Y[name] = factory(';

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


    return Yui;


    // fid-umd post
}));
// fid-umd post-end

/**
 * Yui - UMD generator fragment for YUI
 *
 * @module Yui
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Yui"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
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

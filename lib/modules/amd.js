/**
 * Amd - UMD generator fragment for AMD
 *
 * @module Amd
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Amd"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("Amd", this, function () {
    "use strict";
    // fid-umd end


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
        return 'isObject(define) && define.amd';
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

        code = 'define(name, [';

        if (this.depends.length) {
            code += '"' + this.depends.join('", "') + '"';
        }

        code += '], factory);';

        return code;
    };


    return Amd;


    // fid-umd post
}));
// fid-umd post-end

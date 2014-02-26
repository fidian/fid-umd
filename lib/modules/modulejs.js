/**
 * Modulejs - UMD generator fragment for modulejs
 *
 * @module Modulejs
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Modulejs"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("Modulejs", this, function () {
    "use strict";
    // fid-umd end


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
        return 'isObject(modulejs)';
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

        code = 'define(name, ';

        if (this.depends.length) {
            code += '["' + this.depends.join('", "') + '"], ';
        }

        code += 'factory);';

        return code;
    };


    return Modulejs;


    // fid-umd post
}));
// fid-umd post-end

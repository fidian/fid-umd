/**
 * Modulejs - UMD generator fragment for modulejs
 *
 * @module Modulejs
 * @license MIT
 */
// fid-umd {"name":"Modulejs","jslint":1}
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

        code = 'modulejs.define(name, ';

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

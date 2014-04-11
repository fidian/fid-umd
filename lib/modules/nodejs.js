/**
 * Nodejs - UMD generator fragment for Node.js
 *
 * @module Nodejs
 * @license MIT
 */
// fid-umd {"name":"Nodejs","jslint":1}
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
}("Nodejs", this, function () {
    "use strict";
    // fid-umd end


    /**
     * Create an object that can wrap code in UMD headers/footers
     *
     * @constructor
     * @alias module:Nodejs
     * @param {Config} config
     */
    function Nodejs(config) {
        if (!(this instanceof Nodejs)) {
            return new Nodejs(config);
        }

        this.config = config;
        this.name = "nodejs";
        this.depends = config.dependsProperty(this.name);
        config.functionsNeeded.isObject = true;
    }


    /**
     * Return the condition that checks if this is the right environment.
     *
     * For Node.js, you are supposed to replace `module.exports` with the
     * thing you wish to export, or add properties to `exports`.  We choose
     * the former version to export just one object.
     *
     * @return {string}
     */
    Nodejs.prototype.condition = function () {
        return 'isObject(module) && isObject(module.exports)';
    };


    /**
     * Generate the module load code.
     *
     * For Node.js, this looks like `module.exports = factory()`, passing
     * in dependencies to the factory.
     *
     *     module.exports = factory();
     *     module.exports = factory(require('one'), require('two'));
     *
     * @return {string}
     */
    Nodejs.prototype.loader = function () {
        var code, i;

        code = 'module.exports = factory(';

        for (i = 0; i < this.depends.length; i += 1) {
            if (i > 0) {
                code += ', ';
            }

            code += 'require(' + JSON.stringify(this.depends[i]) + ')';
        }

        code += ');';

        return code;
    };


    return Nodejs;


    // fid-umd post
}));
// fid-umd post-end

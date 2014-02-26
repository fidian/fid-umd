/**
 * Nodejs - UMD generator fragment for Node.js
 *
 * @module Nodejs
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Nodejs"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
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

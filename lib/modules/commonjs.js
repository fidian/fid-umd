/**
 * Commonjs - UMD generator fragment for CommonJS
 *
 * @module Commonjs
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Commonjs"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("Commonjs", this, function () {
    "use strict";
    // fid-umd end


    /**
     * Create an object that can wrap code in UMD headers/footers
     *
     * @constructor
     * @alias module:Commonjs
     * @param {Config} config
     */
    function Commonjs(config) {
        if (!(this instanceof Commonjs)) {
            return new Commonjs(config);
        }

        this.name = "commonjs";
        this.config = config;
        this.dependsFile = config.dependsProperty(this.name);
        this.dependsModule = config.dependsProperty(this.name + "mod");
        config.functionsNeeded.isObject = true;
    }


    /**
     * Return the condition that checks if this is the right environment.
     *
     * For common.js, you are supposed to only add properties to `exports`.
     * To keep this in line with other module loaders, only one thing is added
     * to `exports`, which matches the module name.  This may not be the same
     * for other CommonJS modules.
     *
     * @return {string}
     */
    Commonjs.prototype.condition = function () {
        return 'isObject(exports)';
    };


    /**
     * Generate the module load code.
     *
     * For CommonJS, this looks like one of these examples.
     *
     *     exports.myModule = factory();
     *     exports.myModule = factory(require('one').One, require('two').Two);
     *
     * @return {string}
     */
    Commonjs.prototype.loader = function () {
        var code, i;

        code = 'exports[name] = factory(';

        for (i = 0; i < this.dependsFile.length; i += 1) {
            if (i > 0) {
                code += ', ';
            }

            code += 'require(' + JSON.stringify(this.dependsFile[i]) + ')';

            if (this.dependsModule[i]) {
                code += '.' + this.dependsModule[i];
            }
        }

        code += ');';

        return code;
    };


    return Commonjs;


    // fid-umd post
}));
// fid-umd post-end

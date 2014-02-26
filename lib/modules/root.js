/**
 * Root - UMD generator fragment for adding to the global object
 *
 * @module Root
 * @license MIT
 */
// fid-umd {"jslint":1,"name":"Root"}
/*global define, YUI */
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("Root", this, function () {
    "use strict";
    // fid-umd end


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


    return Root;


    // fid-umd post
}));
// fid-umd post-end

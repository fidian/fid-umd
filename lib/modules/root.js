/**
 * Root - UMD generator fragment for adding to the global object
 *
 * @module Root
 * @license MIT
 */
// fid-umd {"name":"Root","jslint":1}
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

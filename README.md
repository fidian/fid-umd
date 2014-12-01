Universal Module Definition
===========================

Using a universal module definition (UMD) with your JavaScript lets you write a library or module that can be used in every environment.  You might be thinking of writing something that is only usable in the browser, but because you used UMD now a node.js developer can use your code as well.  UMD also eliminates the need for global variables that point to other libraries because they are passed into your code.

This library uses a pattern to define a module for multiple systems with the same source file.  In general, it looks like this:

    Header
	Code to make the object
	Footer

Until now, a developer would have to write their own module loading code.  They would copy and paste, then tweak the top few lines of their JavaScript by hand or else just gear their code to a single module system.  Alternately they would be forced to use a build system like Browserify to build files before they could be consumed by browsers.

Now there is a third option: using a tool to create the header and footer.  This same tool should also allow you to update the headers and footers in case you have additional dependencies that are required or maybe allow supporting yet another module system when the tool is updated.  Less work for the developer, more happiness because your code is more universal.  You can even load it directly in the browser without a compile step.

The project is based off of examples from [UMDjs], which provided a great base and fallback code for testing multiple module systems.  It was revised with the content from this [StackOverflow Post], which showed a concise way to test if objects do what you would expect.  It works with "use strict" and supports more module systems than the alternatives.

[![Build Status](https://secure.travis-ci.org/fidian/fid-umd.png)](http://travis-ci.org/fidian/fid-umd)


Supported Module Systems
------------------------

* CommonJS - [Narwhal](https://github.com/tlrobinson/narwhal), [Montage](http://montagejs.org/), [curl.js](http://github.com/unscriptable/curl) and more.
* NodeJS - Used by [Node](http://nodejs.org/) (aka node.js).  It's very similar to CommonJS but not quite identical.
* AMD - [RequireJS](http://requirejs.org/), [curl.js](http://github.com/uncriptable/curl) and more.
* YUI - Yahoo! has their own [module loader](http://yuilibrary.com/).
* modulejs - A lightweight dependency [resolver](https://github.com/lrsjng/modulejs)
* Globals - Adds to `window` in web browsers.  Adds to the global object for [Rhino](https://developer.mozilla.org/en-US/docs/Rhino).  No dependency resolution, so keep the order correct when loading files.

My goal is not to get in the way and to support your choice of module systems.  If another person wants to use your library in their system, you'd ideally have to make no changes to support it.  The world will be a better place.


How Does It Work?
-----------------

What this does is change your existing code ...

    // *** Your JavaScript is here ***

... into a UMD wrapped version.

    // fid-umd {"name":"Unknown"}
    (function (name, root, factory) {
        function isObject(x) { return typeof x === "object"; }
        if (isObject(root.module) && isObject(root.module.exports)) {
            root.module.exports = factory();
        } else if (isObject(root.exports)) {
            root.exports[name] = factory();
        } else if (isObject(root.define) && root.define.amd) {
            root.define(name, [], factory);
        } else if (isObject(root.modulejs)) {
            root.modulejs.define(name, factory);
        } else if (isObject(root.YUI)) {
            root.YUI.add(name, function (Y) { Y[name] = factory(); });
        } else {
            root[name] = factory();
        }
    }("Unknown", this, function () {
        // fid-umd end
        // *** Your JavaScript is here ***
        // fid-umd post
    }));
    // fid-umd post-end


Your module is probably not called `Unknown` so let's change that and make it called `BottledAwesome`.  Also, let's pretend your code needs two other libraries: `FakeLibrary` and `TestingModule`.  Change just the first `fid-umd` line to match what you see here ...

    // fid-umd {"name":"BottledAwesome","depends":["FakeLibrary","TestingModule"]}

When you run it again the header will change to look like this.

// fid-umd {"name":"BottledAwesome","depends":["FakeLibrary","TestingModule"]}
(function (name, root, factory) {
    function isObject(x) { return typeof x === "object"; }
    if (isObject(root.module) && isObject(root.module.exports)) {
        root.module.exports = factory(root.require("FakeLibrary"), root.require("TestingModule"));
    } else if (isObject(root.exports)) {
        root.exports[name] = factory(root.require("FakeLibrary"), root.require("TestingModule"));
    } else if (isObject(root.define) && root.define.amd) {
        root.define(name, ["FakeLibrary", "TestingModule"], factory);
    } else if (isObject(root.modulejs)) {
        root.modulejs.define(name, ["FakeLibrary", "TestingModule"], factory);
    } else if (isObject(root.YUI)) {
        root.YUI.add(name, function (Y) { Y[name] = factory(Y.FakeLibrary, Y.TestingModule); }, "", { requires: ["FakeLibrary", "TestingModule"] });
    } else {
        root[name] = factory(root.FakeLibrary, root.TestingModule);
    }
}("BottledAwesome", this, function (FakeLibrary, TestingModule) {
    // fid-umd end

Boy, that gets complicated in a hurry.  Inside your code you will have access to `FakeLibrary` and `TestingModule`.  Adding and changing dependencies can be a chore and this tool eliminates the tedium of maintaining UMD in your libraries, letting you focus on writing good code.


Configuration Object
--------------------

The configuration object, on the first line of the header, is where your library's name and dependencies are listed.  It can take the following properties, with only `name` being required.  Other properties are shrunk down to consume less space when JSON encoded.  Invalid properties are removed.

### name (string, required)

The `name` property is the only required property and it defines the name of the module you are creating and exporting.  If not set, this defaults to "Undefined", which is a terrible name.  I strongly hope you change it to match what you are really trying to write.

### debug (boolean)

If enabled, a lot of additional `console.log` calls are made to help diagnose why things are not working.  I strongly only enabling this until you fix a dependency problem or do whatever is needed to get the app to load properly, then turn it off and regenerate the UMD header.

### depends (array)

Here is where you specify the modules your code relies upon.  The simplest form is a string, which will use the same name for a module in every environment.

    "depends":["FidUmd"]

For more complex situations, where you may have different ways to include the module depending on the loading system, you might need to use the object form.  The above single string example is identical to this longer form.  During updates, the longer form here will get condensed to the single string version above.

    "depends":[{"commonjs":"./fid-umd","commonjsmod":"FidUmd","name":"FidUmd","amd":"FidUmd","root":"FidUmd","yui":"FidUmd"}]

The object form has the following properties.  This next example is exploded and commented JSON.  It won't work as-is in the `fid-umd` heading.

    "depends":[{
        "amd":"lib/fid-umd",  // Different location for AMD
        "commonjs":"./fid-umd",  // Filename for CommonJS
        "commonjsmod":"FidUmd",  // Module's exported name for CommonJS
        "modulejs":"FidUmd",  // module.js
        "nodejs":"./fid-umd",  // Filename for Node.js
        "name":"FidUmd",  // Variable name passed into your code and default value
        "root":"asyncLoader('fidUmd')",  // Web browser and Rhino
        "yui":"FidUmdLibrary"  // Example of a weird export for YUI
    }]

Any property that is the same as `name` does not need to be specified.  On updates, those properties are removed because duplication makes the heading line longer.

If `commonjsmod` is set to an empty string, the whole exported object will be passed in.  This is to allow for different ways people expose different modules.  You'll also notice that for `root` the configuration is calling a function.  This is acceptable, since that string is just appended after the global object's name in the markup.  It results in something like `this.asyncLoader('fidUmd')`.

When there are no dependencies, this property is removed during updates.  Otherwise the values in the array are either shrunk down to the single strings or object versions as described above.

### jslint (boolean)

When enabled (via `true` or `1`), this generates some extra markup so the header and footer will pass validation with the node implementation of [jslint](https://github.com/reid/node-jslint) or [jslint.com](http://jslint.com).  This option condenses down to either the number 1 (enabled) or the property is removed (disabled) during updates.

### global (boolean)

When enabled (via `true` or `1`), this will run the factory function in the global object's context.  This will let you access `window` in browsers without having to use global variables or violating "use strict".  More separation from the global object is better, so this option's default is `false`.


Using the Command Line Version
------------------------------

First, use `npm install -g fid-umd` to install the program on your system.  You may need to run `sudo` to grant root privileges or remove the `-g` flag to install it locally.

From here, just point the program at your JavaScript files.  It's the same command to add it the first time and to update an existing header.

    fid-umd my-javascript-file.js

You can pass multiple files on the command line and they all will get processed.


Using the Library Directly
--------------------------

The FidUmd object is really intended to be called through a single `.update()` method.

    umd = new FidUmd();
    myCode = '// Your JavaScript is here';

    try {
        newCode = umd.update(myCode);  // Updates the code
    } catch (ex) {
        // Happens when the config is not valid JSON
        console.log('error updating code: ' + ex.toString());
    }


Adding to package.json
----------------------

This repository will run `fid-umd` against itself by using the command `npm run-script umd`.  You can have that happen for your project as well.  First, add the `devDependencies` and then add a `script` entry to your `package.json` config file.

    "devDependencies": {
		... other dependencies ...
		"fid-umd": *,
		... more dependencies ...
	},
	"scripts": {
		... your scripts for things ...
		"umd": "grep -rl '// fid-umd' lib/ --include \\*.js | xargs fid-umd"
		... other scripts here ...
	}


Module Loader Considerations
----------------------------

### AMD

The module is exported with a name instead of having it generated without a name in order to better support bundling.  Without a name you are unable to concatenate and minify your JavaScript into a single file.


Running Tests
-------------

FidUmd is tested with [Travis CI](http://travis-ci.org/fidian/fid-umd) automatically.  You can run them yourselves using `npm test` to run them once or `npm run watch` to have the tests run automatically when any files change.  Tests are important!,


Important Upgrade Notes
-----------------------

2.0:
 * The dependency property named `requirejs` is renamed to `amd`.
 * The dependency property named `commonjs` was split to `commonjs` and `nodejs`.
 * CommonJS module names are now able to be specified in dependencies with `commonjsmod`.
 * Split the per-module code to special objects.
 * Changed from a `try`/`catch` style to `if`/`else`
 * Added `modulejs` system.


Additional Reading
------------------

* [Demystifying CommonJS](http://dailyjs.com/2010/10/18/modules/) - Covers common misconceptions and some discussion around CommonJS.
* [Why AMD](http://requirejs.org/docs/whyamd.html) - Explains how CommonJS wasn't geared toward the browser and how AMD and RequireJS addresses those limitations.
* [AMD is Better For The Web](http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules/) - Key differences between AMD and CommonJS as module systems.
* [Writing Module JS](http://addyosmani.com/writing-modular-js/) - Great in-depth discussion about module formats and how to load them.
* [AMD is Not the Answer](http://tomdale.net/2012/01/amd-is-not-the-answer/) - Counter argument against AMD.
* [UMDjs] - Static examples of UMD variations.
* [JS Module Boilerplate](https://gist.github.com/wilmoore/3880415) - Another UMD template that shows what loading systems work with it.
* [uRequire](http://urequire.org/) - Remove the UMD boilerplate but add a build step where you target your module for a specific system.
* [Browserify](http://browserify.org/) - Use Node.js style modules in the browser.  Requires a build step.
* [SystemJS](https://github.com/systemjs/systemjs) - Unified module loader that also supports ES6 modules.


[StackOverflow Post]: http://stackoverflow.com/questions/415160/best-method-of-instantiating-an-xmlhttprequest-object
[UMDjs]: https://github.com/umdjs/umd

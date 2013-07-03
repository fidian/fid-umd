Universal Module Definition
===========================

Using a universal module definition (UMD) with your JavaScript lets you write a library or module that can be used in every environment.  You might be thinking of writing something that is only usable in the browser, but because you used UMD now a node.js developer can use your code as well.  UMD also eliminates the need for global variables that point to other libraries because they are passed into your code.

This library uses a pattern to define a module for multiple systems with the same source file.  In general, it looks like this:

    Header
	Code to make the object
	Footer
	
Until now, a developer would have to write their own module loading code.  They would copy and paste, then tweak the top few lines of their JavaScript by hand or else just gear their code to a single module system.  Now, those pains are gone.

You should use a tool to create the header and footer.  This same tool should also allow you to update the headers and footers in case you have additional dependencies that are required or maybe allow supporting yet another module system when the tool is updated.  Less work for the developer, more happiness because your tool is more universal.

The project is based off of examples from [UMDjs], which provided a great base and fallback code for testing multiple module systems.  It was revised with the content from this [StackOverflow Post], which showed a concise way to test if objects do what you would expect.

[![Build Status](https://secure.travis-ci.org/fidian/fid-umd.png)](http://travis-ci.org/fidian/fid-umd)


Supported Module Systems
------------------------

* CommonJS - Used by [Node](http://nodejs.org/) (aka node.js), [Narwhal](https://github.com/tlrobinson/narwhal), [Montage](http://montagejs.org/), [curl.js](http://github.com/unscriptable/curl) and more.
* AMD - [RequireJS](http://requirejs.org/), [curl.js](http://github.com/uncriptable/curl) and more.
* YUI - Yahoo! has their own [module loader](http://yuilibrary.com/).
* Globals - Adds to `window` in web browsers.  Adds to the global object for [Rhino](https://developer.mozilla.org/en-US/docs/Rhino).  No dependency resolution, so keep the order correct.

My goal is not to get in the way and to support your choice of module systems.  If another person wants to use your library in their system, you'd ideally have to make no changes to support it.  The world will be a better place.


How Does It Work?
-----------------

What this does is change your existing code ...

    // *** Your JavaScript is here ***

... into a UMD wrapped version.

    // fid-umd {"name":"Unknown"}
    (function (n, r, f) {
        try { module.exports = f(); return; } catch (a) {}
        try { exports[n] = f(); return; } catch (b) {}
        try { return define.amd && define(n, [], f); } catch (c) {}
        try { YUI.add(n, function (Y) { Y[n] = f();}); } catch (d) {}
        try { r[n] = f(); } catch (e) {}
        throw new Error("Unable to export " + n);
    }("Unknown", this, function () {
        // fid-umd end
        // *** Your JavaScript is here ***
        // fid-umd post
    }));
    // fid-umd post-end

Your module is probably not called "Unknown" so let's change that and make it called Awesome.  Also, let's pretend your code needs some other libraries: FakeLibrary and TestingModule.  Change just the first "fid-umd" line to match what you see here ...

    // fid-umd {"name":"Awesome","depends":["FakeLibrary","TestingModule"]}
    
When you run it again the header will change to look like this.

    // fid-umd {"name":"Awesome","depends":["FakeLibrary","TestingModule"]}
    (function (n, r, f) {
        try { module.exports = f(require("FakeLibrary"), require("TestingModule")); return; } catch (a) {}
        try { exports[n] = f(require("FakeLibrary"), require("TestingModule")); return; } catch (b) {}
        try { return define.amd && define(n, ["FakeLibrary","TestingModule"], f); } catch (c) {}
        try { return YUI.add(n, function (Y) { Y[n] = f(FakeLibrary, TestingModule); }, "", { requires: ["FakeLibrary","TestingModule"] }); } catch (d) {}
        try { r[n] = f(r.FakeLibrary, r.TestingModule); } catch (e) {}
        throw new Error("Unable to export " + n);
    }("Awesome", this, function (FakeLibrary, TestingModule) {
        // fid-umd end

Boy, that gets complicated in a hurry.  Inside your code you will have access to FakeLibrary and TestingModule.  Adding and changing dependencies can be a chore and this tool eliminates the tedium, letting you focus on writing good code.


Configuration Object
--------------------

The configuration object, on the first line of the header, is where your library's name and dependencies are listed.  It can take the following properties, with only `name` being required.  Other properties are shrunk down to consume less space when JSON encoded, so don't be surprised to notice the removal empty `depends` arrays.

### name (string, required)

The `name` property is the only required property and it defines the name of the module you are creating and exporting.  If not set, this defaults to "Undefined", which is a terrible name.  I strongly hope you change it to match what you are really trying to write.

### depends (array)

Here is where you specify the modules your code relies upon.  The simplest form is a string, which will use the same name for a module in every environment.

    "depends":["FidUmd"]

For more complex situations, where you may have different ways to include the module depending on the loading system, you might need to use the object form.  The above single string example is identical to this longer form.  During updates, the longer form here will get condensed to the single string version above.

    "depends":[{"commonjs":"FidUmd","name":"FidUmd","requirejs":"FidUmd","root":"FidUmd","yui":"FidUmd"}]

The object form has the following properties.  This next example is exploded and commented JSON.  It won't work as-is in the `fid-umd` heading.

    "depends":[{
        "commonjs":"./fid-umd",  // Filename, perhaps for node.js
        "name":"FidUmd",  // Variable name passed into your code
        "requirejs":"lib/fid-umd",  // Different location for RequireJS
        "root":"asyncLoader('fidUmd')",  // Web browser and Rhino
        "yui":"FidUmdLibrary"  // Example of a weird export for YUI
    }]

Any property that is the same as `name` does not need to be specified.  On updates, those properties are removed because duplication makes the heading line longer.

When there are no dependencies, this property is removed during updates.  Otherwise the values in the array are either shrunk down to the single strings or object versions as described above.

### jslint (boolean)

When enabled (via `true` or `1`), this generates some extra markup so the header and footer will pass validation with the node implementation of [jslint](https://github.com/reid/node-jslint) or [jslint.com](http://jslint.com).  This option condenses down to either the number 1 (enabled) or the property is removed (disabled) during updates.


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
        newCode = umd.update();
    } catch (ex) {
        // Happens when the config is not valid JSON
        console.log('error updating code: ' + ex.toString());
    }


Running Tests
-------------

FidUmd is tested with [Travis CI](http://travis-ci.org/fidian/fid-umd) automatically.  You can run them yourselves using `npm test` to run them once or `npm run-script auto` to have the tests run automatically when any files change.  Tests are important!


Additional Reading
------------------

* [Demystifying CommonJS](http://dailyjs.com/2010/10/18/modules/) - Covers common misconceptions and some discussion around CommonJS.
* [Why AMD](http://requirejs.org/docs/whyamd.html) - Explains how CommonJS wasn't geared toward the browser and how RequireJS addresses those limitations.
* [AMD is Better For The Web](http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules/) - Key differences between AMD and CommonJS as module systems.
* [Writing Module JS](http://addyosmani.com/writing-modular-js/) - Great in-depth discussion about module formats and how to load them.
* [AMD is Not the Answer](http://tomdale.net/2012/01/amd-is-not-the-answer/) - Counter argument against AMD.
* [UMDjs] - Static examples of UMD variations.
* [JS Module Boilerplate](https://gist.github.com/wilmoore/3880415) - Another UMD template.

[StackOverflow Post]: http://stackoverflow.com/questions/415160/best-method-of-instantiating-an-xmlhttprequest-object
[UMDjs]: https://github.com/umdjs/umd

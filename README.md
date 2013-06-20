Universal Module Definition
===========================

This library uses a pattern to define a module for multiple systems with the same source file.  In general, it looks like this:

    Header
	Code to make the object
	Footer

The project is based off of examples from [UMDjs], which provided a great base and fallback code for testing multiple module systems.  It was revised with the content from this [StackOverflow Post], which showed a concise way to test if objects do what you would expect.


What's Supported
----------------

* CommonJS - Used by [Node](http://nodejs.org/) (aka node.js), [Narwhal](https://github.com/tlrobinson/narwhal), [Montage](http://montagejs.org/), [curl.js](http://github.com/unscriptable/curl) and more.
* AMD - [RequireJS](http://requirejs.org/), [curl.js](http://github.com/uncriptable/curl) and more.
* YUI - Yahoo! has their own [module loader](http://yuilibrary.com/).
* Globals - Adds to `window` in web browsers.  Adds to the global object for [Rhino](https://developer.mozilla.org/en-US/docs/Rhino).  No dependency resolution, so keep the order correct.

My goal is not to get in the way and to support your choice of module systems.  If another person wants to use your library in their system, you'd ideally have to make no changes to support it.  The world will be a better place.


Additional Reading
------------------

* [Demystifying CommonJS](http://dailyjs.com/2010/10/18/modules/) - Covers common misconceptions and some discussion around CommonJS.
* [Why AMD](http://requirejs.org/docs/whyamd.html) - Explains how CommonJS wasn't geared toward the browser and how RequireJS addresses those limitations.
* [AMD is Better For The Web](http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules/) - Key differences between AMD and CommonJS as module systems.
* [Writing Module JS](http://addyosmani.com/writing-modular-js/) - Great in-depth discussion about module formats and how to load them.
* [AMD is Not the Answer](http://tomdale.net/2012/01/amd-is-not-the-answer/) - Counter argument against AMD.
* [UMDjs] - Static examples of UMD variations.

[StackOverflow Post]: http://stackoverflow.com/questions/415160/best-method-of-instantiating-an-xmlhttprequest-object
[UMDjs]: https://github.com/umdjs/umd

/**
 * FidUmd - UMD generator to wrap your JavaScript modules
 *
 * @module FidUmd
 * @license MIT
 */
// fid-umd {"debug":1,"jslint":1,"name":"FidUmd"}
/*global define, YUI*/
(function (n, r, f) {
	"use strict";
	try { module.exports = f(); return; } catch (a) { console.log("module.exports attempt failed for " + n, a); }
	try { exports[n] = f(); return; } catch (b) { console.log("exports[n] attempt failed for " + n, b); }
	try { return define.amd && define(n, [], f); } catch (c) { console.log("define attempt failed for " + n, c); }
	try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (d) { console.log("YUI attempt failed for " + n, d); }
	try { r[n] = f(); return; } catch (e) { console.log("root object attempt failed for " + n, e); }
	console.log("Unable to export " + n);
	throw new Error("Unable to export " + n);
}("FidUmd", this, function () {
	"use strict";
	// fid-umd end


	/**
	 * Create an object that can wrap code in UMD headers/footers
	 *
	 * @constructor
	 * @alias module:FidUmd
	 * @property {number} counter Used for generating unique variables in tryTo()
	 */
	function FidUmd() {
		if (!(this instanceof FidUmd)) {
			return new FidUmd();
		}

		this.counter = 0;  // For tryTo(), reset by createPreamble()
	}


	/**
	 * Expanded config object
	 *
	 * An abbreviated form will be saved to the JavaScript file.
	 *
	 * @typedef {Object} FidUmd~config
	 * @property {string} name Module name
	 * @property {!Array.<FidUmd~depends>} depends Dependencies
	 * @property {boolean} jslint Flag enabling jslint comments
	 * @property {boolean} global Flag enabling running in global scope
	 */


	/**
	 * Expanded depends objects
	 *
	 * @typedef {Object} FidUmd~depends
	 * @property {string} commonjs Filename or module name for CommonJS
	 * @property {string} name Module name as seen inside your function
	 * @property {string} requirejs Module name/path for RequireJS
	 * @property {string} root Name in a root object, like a browser's window
	 * @property {string} yui YUI Module name
	 */


	/**
	 * Config properties used when loading/saving fid-umd header markers
	 *
	 * @readonly
	 * @const
	 */
	FidUmd.prototype.configProperties = {
		debug: 'boolean',
		depends: 'array',
		global: 'boolean',
		jslint: 'boolean',
		name: 'string'
	};


	/**
	 * Create the postamble string.  This is almost always at the end of
	 * the file
	 *
	 * @param {!FidUmd~config} config
	 * @return {string}
	 */
	FidUmd.prototype.createPostamble = function (config) {
		var name;  // Necessary to hide the markers
		name = '// fid-umd ';
		return '\t' + name + 'post\n}));\n' + name + 'post-end\n';
	};


	/**
	 * Create a preamble string
	 *
	 * config is an object similar to this
	 *
	 * // No dependencies
	 * config = {
	 *     name: "MyObject"
	 * }
	 *
	 * // Dependency on OneOne and TwoTwo
	 * // For node, OneOne is an external library, TwoTwo is something local
	 * config = {
	 *     name: 'HorseRacingTrack',
	 *     depends: [
	 *         'OneOne',
	 *         'TwoTwo'
	 *     ]
	 * }
	 *
	 * @param {!FidUmd~config} config Controls dependencies and exported name
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreamble = function (config) {
		var dependencies, preamble;

		this.counter = 0;  // for tryTo

		// Marker for the preamble
		preamble = '// fid-umd ' + this.exportConfig(config) + '\n';

		if (config.jslint) {
			preamble += '/*global define, YUI*/\n';
		}

		// n = name of this module that we are exporting
		// r = root, the context at the time the code is running
		// f = factory, the function providing the thing to export
		// s = original factory when running in a global scope
		if (config.global) {
			preamble += '(function (n, r, s) {\n';
		} else {
			preamble += '(function (n, r, f) {\n';
		}

		if (config.jslint) {
			preamble += '\t"use strict";\n';
		}

		if (config.global) {
			preamble += this.createPreambleGlobalScope(config);
		}

		// Add the various loaders
		preamble += this.createPreambleCommonJs(config);
		preamble += this.createPreambleRequireJs(config);
		preamble += this.createPreambleYui(config);
		preamble += this.createPreambleRoot(config);

		// Failed to load
		if (config.debug) {
			preamble += '\tconsole.log("Unable to export " + n);\n';
		}

		preamble += '\tthrow new Error("Unable to export " + n);\n';

		// Finish the preamble
		dependencies = this.dependsProperty(config.depends, 'name').join(', ');
		preamble += '}(' + JSON.stringify(config.name) + ', this, function (' + dependencies + ') {\n';

		if (config.jslint) {
			preamble += '\t"use strict";\n';
		}

		preamble += '\t// fid-umd end\n';
		return preamble;
	};


	/**
	 * CommonJS always defines exports and may define module.
	 * Used in node, Montage
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreambleCommonJs = function (config) {
		var assignment, code, require;

		require = this.dependsProperty(config.depends, 'commonjs');
		require = require.map(function (input) {
			return 'require(' + JSON.stringify(input) + ')';
		}).join(', ');
		assignment = ' = f(' + require + '); return;';

		// Using module.exports isn't strict CommonJS - it's more just node.js.
		// Using just exports is CommonJS.
		code = this.tryTo('module.exports' + assignment, config, 'module.exports');
		code += this.tryTo('exports[n]' + assignment, config, 'exports[n]');
		return code;
	};


	/**
	 * Defines the f() function when we want to execute the
	 * factory in global scope
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreambleGlobalScope = function (config) {
		var dependencies, preamble;

		dependencies = this.dependsProperty(config.depends, 'name').join(', ');
		preamble = '\tvar f = function (' + dependencies + ') { return s.call(r';

		if (dependencies.length) {
			preamble += ', ' + dependencies;
		}

		preamble += '); };\n';
		return preamble;
	};


	/**
	 * RequireJS uses a define function
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreambleRequireJs = function (config) {
		var dependencies, require;
		dependencies = this.dependsProperty(config.depends, 'requirejs');
		require = this.stringifyArray(dependencies);
		return this.tryTo('return define.amd && define(n, ' + require + ', f);', config, 'define');
	};


	/**
	 * Browsers and global objects.  There is no automatic dependency
	 * resolution with this approach.
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreambleRoot = function (config) {
		var args, dependencies;
		dependencies = this.dependsProperty(config.depends, 'root');
		dependencies = dependencies.map(function (dep) {
			return 'r.' + dep;
		}).join(', ');
		return this.tryTo('r[n] = f(' + dependencies + '); return;', config, 'root object');
	};


	/**
	 * YUI
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @return {string} Preamble
	 */
	FidUmd.prototype.createPreambleYui = function (config) {
		var dependencies, dependsPassed, dependsList;

		dependencies = this.dependsProperty(config.depends, 'yui');

		if (!dependencies.length) {
			return this.tryTo('return YUI.add(n, function (Y) { Y[n] = f(); });', config, 'YUI');
		}

		dependsPassed = 'Y.' + dependencies.join(', Y.');
		dependsList = this.stringifyArray(dependencies);
		return this.tryTo('return YUI.add(n, function (Y) { Y[n] = f(' + dependsPassed + '); }, "", { requires: ' + dependsList + ' });', config, 'YUI');
	};


	/**
	 * Grab a value from all of the depends
	 *
	 * @param {!Array.<FidUmd~depends>} depends Array of depends objects
	 * @param {string} property Name of property
	 * @return {Array.<string>} The values from the depends objects
	 */
	FidUmd.prototype.dependsProperty = function (depends, property) {
		return depends.map(function (oneDependency) {
			return oneDependency[property];
		});
	};


	/**
	 * Detect an existing config or create a new default config
	 *
	 * @param {string} code
	 * @return {Object} Short version of {@link FidUmd~config} object
	 */
	FidUmd.prototype.detectConfig = function (code) {
		var config, matches;

		/*jslint regexp:true*/
		matches = code.match(/\/\/ fid-umd (\{.*\})/);
		/*jslint regexp:false*/

		if (matches) {
			try {
				config = JSON.parse(matches[1]);
				return this.standardizeConfig(config);
			} catch (e) {
				throw new Error('Invalid JSON: ' + matches[1]);
			}
		}

		// Return a reasonable default
		return this.standardizeConfig({});
	};


	/**
	 * Expand a depends array into a an array of full object
	 *
	 * Full object has these properties
	 *   commonjs: Module or filename to load, defaults to "name" property
	 *   name: Name of the variable passed into the factory
	 *   requirejs: Module name to load, defaults to "name" property
	 *   root: Property off root object, defaults to "name" property
	 *   yui: YUI module name, defaults to "name" property
	 *
	 * Input (JSON) -> output (JavaScript) examples:
	 *   "Name" ->
	 *     { commonjs: "Name", name: "Name", requirejs: "Name",
	 *       root: "Name", yui: "Name" }
	 *   {"name":"Template",commonjs:"./template",root:"TemplateThing"} ->
	 *     { commonjs: "./template", name: "Template", requirejs: "Template",
	 *       root: "TemplateThing", yui: "Template" }
	 *
	 * @param {!(string|Object)} input
	 * @return {FidUmd~depends}
	 */
	FidUmd.prototype.expandDepends = function (input) {
		var result;

		function makeDefault(str) {
			return {
				commonjs: str,
				name: str,
				requirejs: str,
				root: str,
				yui: str
			};
		}

		if (typeof input === 'string') {
			return makeDefault(input);
		}

		if (!input.name) {
			result = makeDefault('Unknown');
		} else {
			result = makeDefault(input.name);
		}

		[ "commonjs", "requirejs", "root", "yui" ].forEach(function (prop) {
			if (input[prop]) {
				result[prop] = input[prop];
			} else {
				result[prop] = result.name;
			}
		});

		return result;
	};


	/**
	 * Export the config as a string, only preserving properties we want and
	 * in a minimal format.
	 *
	 * Only preserves these properties:
	 *     name:  string
	 *     depends:  array of strings unless it is empty
	 *     jslint:  boolean, saved as 1 or unset
	 *
	 * @param {!FidUmd~config} config
	 * @return {string}
	 */
	FidUmd.prototype.exportConfig = function (config) {
		var myself, outObj;

		myself = this;
		outObj = {};

		Object.keys(this.configProperties).forEach(function (key) {
			var v = config[key];

			// We never save falsy values
			if (!v) {
				return;
			}

			switch (myself.configProperties[key]) {
			case 'array':
				// Preserve if length > 0
				if (!Array.isArray(v) || !v.length) {
					return;
				}
				break;

			case 'boolean':
				// Save as a 1, a very short value
				v = 1;
				break;

			case 'string':
				// Save strings that have a length
				if (typeof v !== 'string' || !v.length) {
					return;
				}

				break;
			}
			outObj[key] = v;
		});

		// Shrink the depends array of objects
		if (outObj.depends) {
			outObj.depends = outObj.depends.map(this.unexpandDepends.bind(this));
		}

		return JSON.stringify(outObj);
	};


	/**
	 * Create a short variable.  Must start with a letter.  Can provide
	 * 'a', 'b', ..., 'z', 'a0', 'a1', etc.
	 *
	 * @param {number} index
	 * @return {string} Letter
	 */
	FidUmd.prototype.makeLetter = function (index) {
		index += 10;

		if (index >= 36) {
			index += 324;  // Skip variables like '10', '12', etc.
		}

		return index.toString(36);
	};


	/**
	 * Force properties to be in a standard form to reduce the code elsewhere.
	 *
	 * @param {!Object} inObj Shortened form of {@link FidUmd~config}
	 * @return {FidUmd~config}
	 */
	FidUmd.prototype.standardizeConfig = function (inObj) {
		var myself, outObj;

		outObj = {};
		myself = this;
		Object.keys(this.configProperties).forEach(function (key) {
			var v = inObj[key];

			switch (myself.configProperties[key]) {
			case 'array':
				// Preserve if length > 0
				if (!Array.isArray(v) || !v.length) {
					v = [];
				}
				break;

			case 'boolean':
				// Cast to boolean
				v = !!v;
				break;

			case 'string':
				// Save strings that have a length
				if (typeof v !== 'string' || !v.length) {
					v = "";
				}

				break;
			}

			outObj[key] = v;
		});

		// Set defaults
		if (outObj.name === "") {
			outObj.name = 'Unknown';
		}

		// Expand depends into full objects
		outObj.depends = outObj.depends.map(this.expandDepends.bind(this));

		return outObj;
	};


	/**
	 * Split code into chunks
	 *
	 * Look for the first marker.
	 *     If not found, return [ code, '' ]
	 *     If found, look for the second marker after the first
	 *         If not found, return [ code-before-first, code-after-first ]
	 *         If found, return [code-before-first, code-after-second ]
	 *
	 * @param {string} code
	 * @param {!RegExp} startMarker
	 * @param {!RegExp} endMarker
	 * @return {Array.<string>} Code before and after markers
	 */
	FidUmd.prototype.splitCode = function (code, startMarker, endMarker) {
		var match, result;

		result = [ code, '' ];
		match = code.match(startMarker);

		if (!match) {
			// Did not match
			return result;
		}

		result[0] = code.substr(0, match.index);
		result[1] = code.substr(match.index + match[0].length);

		// Now look for the end marker
		match = result[1].match(endMarker);

		if (match) {
			// Limit the "after" portion to everything after the marker
			result[1] = result[1].substr(match.index + match[0].length);
		}

		return result;
	};


	/**
	 * Convert an array into its string equivalent
	 *
	 * This also adds a space after commas so jslint doesn't throw warnings
	 *
	 * @param {!Array.<string>} list
	 * @return {string}
	 */
	FidUmd.prototype.stringifyArray = function (list) {
		var result;
		result = list.map(function (item) {
			return JSON.stringify(item);
		});
		result = '[' + result.join(', ') + ']';
		return result;
	};


	/**
	 * Return the code that will attempt to use a particular module system.
	 *
	 * Uses this.counter to generate unique exception variables so jslint
	 * will not complain.
	 *
	 * @param {!FidUmd~config} config Determines dependencies
	 * @param {string} attempt Code to attempt to execute
	 * @return {string}
	 */
	FidUmd.prototype.tryTo = function (attempt, config, method) {
		var code, letter;

		// Figure out the letter for the exception
		letter = this.makeLetter(this.counter);
		this.counter += 1;

		while (letter === 'f' || letter === 'n' || letter === 'r' || letter === 's') {
			letter = this.makeLetter(this.counter);
			this.counter += 1;
		}

		// Build the code
		code = '\ttry { ' + attempt + ' } catch (' + letter + ') {';

		if (config.debug) {
			code += ' console.log("' + method + ' attempt failed for " + n, ' + letter + '); ';
		}

		code += '}\n';
		return code;
	};


	/**
	 * Condense a depends object into as small of a form as possible.
	 * This is the reverse of expandDepends()
	 *
	 * @param {!FidUmd~depends} input
	 * @return {(Object|string)} Shortened form of {@link FidUmd~depends}
	 */
	FidUmd.prototype.unexpandDepends = function (input) {
		var deletes, output;

		output = {
			name: input.name
		};
		[ "commonjs", "requirejs", "root", "yui" ].forEach(function (prop) {
			if (input[prop] !== input.name) {
				output[prop] = input[prop];
			}
		});

		if (Object.keys(output).length === 1) {
			return output.name;
		}

		return output;
	};


	/**
	 * Update the UMD code in some JavaScript
	 *
	 * @param {string} oldCode
	 * @return {string} Updated code with new preamble and postamble
	 */
	FidUmd.prototype.update = function (oldCode) {
		var config, newCode;

		config = this.detectConfig(oldCode);
		newCode = oldCode;
		newCode = this.updatePreamble(newCode, config);
		newCode = this.updatePostamble(newCode, config);
		return newCode;
	};


	/**
	 * Update the postamble
	 *
	 * @param {string} inCode Code to update
	 * @param {!FidUmd~config} config
	 * @return {string} Updated code
	 */
	FidUmd.prototype.updatePostamble = function (inCode, config) {
		var outCode, outCodePieces;

		outCodePieces = this.splitCode(inCode, /[\t ]*\/\/ fid-umd post\n?/, /\/\/ fid-umd post-end\n?/);
		outCode = outCodePieces[0];

		if (outCode.substr(-1) !== "\n") {
			outCode += "\n";
		}

		outCode += this.createPostamble(config) + outCodePieces[1];
		return outCode;
	};


	/**
	 * Update the preamble
	 *
	 * @param {string} inCode Code to update
	 * @param {!FidUmd~config} config
	 * @return {string} Updated code
	 */
	FidUmd.prototype.updatePreamble = function (inCode, config) {
		var outCode, outCodePieces;

		/*jslint regexp:true*/
		outCodePieces = this.splitCode(inCode, /\/\/ fid-umd \{.*\n?/, /\/\/ fid-umd end\n?/);
		/*jslint regexp:false*/

		// Force the preamble to be at the beginning
		if (outCodePieces[1] === '') {
			outCodePieces[1] = outCodePieces[0];
			outCodePieces[0] = '';
		}

		outCode = outCodePieces[0] + this.createPreamble(config) + outCodePieces[1];
		return outCode;
	};


	return FidUmd;


	// fid-umd post
}));
// fid-umd post-end

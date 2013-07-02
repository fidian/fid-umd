// fid-umd {"name":"FidUmd","jslint":1}
/*global define, YUI*/
(function (n, r, f) {
	"use strict";
	try { module.exports = f(); return; } catch (a) {}
	try { exports[n] = f(); return; } catch (b) {}
	try { return define.amd && define(n, [], f); } catch (c) {}
	try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (d) {}
	try { r[n] = f(); return; } catch (e) {}
	throw new Error("Unable to export " + n);
}("FidUmd", this, function () {
	// fid-umd end
	'use strict';

	/**
	 * Empty function to use as a constructor
	 */
	function FidUmd() {
		this.counter = 10;  // For tryTo(), reset by createPreamble()
	}


	/**
	 * Config properties
	 */
	FidUmd.prototype.configProperties = {
		name: 'string',
		depends: 'array',
		jslint: 'boolean'
	};


	/**
	 * Create the postamble string.  This is almost always at the end of
	 * the file
	 *
	 * @param object config
	 * @return string
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
	 * @param object config Controls the dependencies and the exported name
	 */
	FidUmd.prototype.createPreamble = function (config) {
		var dependencies, preamble;

		this.counter = 10;  // for tryTo

		// Marker for the preamble
		preamble = '// fid-umd ' + this.exportConfig(config) + '\n';

		if (config.jslint) {
			preamble += '/*global define, YUI*/\n';
		}

		// n = name of this module that we are exporting
		// r = root, the context at the time the code is running
		// f = factory, the function providing the thing to export
		preamble += '(function (n, r, f) {\n';

		if (config.jslint) {
			preamble += '\t"use strict";\n';
		}

		// Add the various loaders
		preamble += this.createPreambleCommonJs(config);
		preamble += this.createPreambleRequireJs(config);
		preamble += this.createPreambleYui(config);
		preamble += this.createPreambleRoot(config);
		preamble += '\tthrow new Error("Unable to export " + n);\n';

		// Finish the preamble
		dependencies = this.dependsProperty(config.depends, 'name').join(', ');
		preamble += '}(' + JSON.stringify(config.name) + ', this, function (' + dependencies + ') {\n';
		preamble += '\t// fid-umd end\n';
		return preamble;
	};


	/**
	 * CommonJS always defines exports and may define module.
	 * Used in node, Montage
	 *
	 * @param object config See createPreamble()
	 * @return string
	 */
	FidUmd.prototype.createPreambleCommonJs = function (config) {
		var assignment, require;

		require = this.dependsProperty(config.depends, 'commonjs');
		require = require.map(function (input) {
			return 'require(' + JSON.stringify(input) + ')';
		}).join(', ');
		assignment = ' = f(' + require + '); return;';

		return this.tryTo('module.exports' + assignment, 'exports[n]' + assignment);
	};


	/**
	 * RequireJS uses a define function
	 *
	 * @param object config See createPreamble()
	 * @return string
	 */
	FidUmd.prototype.createPreambleRequireJs = function (config) {
		var dependencies, require;
		dependencies = this.dependsProperty(config.depends, 'requirejs');
		require = JSON.stringify(dependencies);
		return this.tryTo('return define.amd && define(n, ' + require + ', f);');
	};


	/**
	 * Browsers and global objects.  There is no automatic dependency
	 * resolution with this approach.
	 *
	 * @param object config See createPreamble()
	 * @return string
	 */
	FidUmd.prototype.createPreambleRoot = function (config) {
		var args, dependencies;
		dependencies = this.dependsProperty(config.depends, 'root');
		dependencies = dependencies.map(function (dep) {
			return 'r.' + dep;
		}).join(', ');
		return this.tryTo('r[n] = f(' + dependencies + '); return;');
	};


	/**
	 * YUI
	 *
	 * @param object config See createPreamble()
	 * @return string
	 */
	FidUmd.prototype.createPreambleYui = function (config) {
		var dependencies, dependsPassed, dependsList;

		dependencies = this.dependsProperty(config.depends, 'yui');

		if (!dependencies.length) {
			return this.tryTo('return YUI.add(n, function (Y) { Y[n] = f(); });');
		}

		dependsPassed = 'Y.' + dependencies.join(', Y.');
		dependsList = JSON.stringify(dependencies);
		return this.tryTo('return YUI.add(n, function (Y) { Y[n] = f(' + dependsPassed + '); }, "", { requires: ' + dependsList + ' });');
	};


	/**
	 * Grab a value from all of the depends
	 *
	 * @param array depends Array of depends objects
	 * @param string property Name of property
	 * @return array|string
	 */
	FidUmd.prototype.dependsProperty = function (depends, property) {
		return depends.map(function (oneDependency) {
			return oneDependency[property];
		});
	};


	/**
	 * Detect an existing config or create a new default config
	 *
	 * @param string code
	 * @return object
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
	 * @param string|object input
	 * @return object
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
	 * @param object config
	 * @return string
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
	 * Force properties to be in a standard form to reduce the code elsewhere.
	 *
	 * @param object config
	 * @return object
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
	 * @param string code
	 * @param RegExp startMarker
	 * @param RegExp endMarker
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
	 * Return the code that will attempt to use a particular module system.
	 *
	 * Uses this.counter to generate unique exception variables so jslint
	 * will not complain.
	 *
	 * @param string... Strings to turn into attempts
	 * @return string
	 */
	FidUmd.prototype.tryTo = function () {
		var args, myself;
		myself = this;
		args = Array.prototype.slice.call(arguments, 0);
		args = args.map(function (arg) {
			var str;
			str = '\ttry { ' + arg + ' } catch (' + myself.counter.toString(36) + ') {}';
			myself.counter += 1;

			// Skip f, n, r
			if (myself.counter === 15 || myself.counter === 23 || myself.counter === 27) {
				myself.counter += 1;
			}

			// Skip variables '10', '12', etc.
			if (myself.counter === 36) {
				myself.counter = 360;
			}

			return str;
		});
		args = args.join("\n") + "\n";
		return args;
	};


	/**
	 * Condense a depends object into as small of a form as possible.
	 * This is the reverse of expandDepends()
	 *
	 * @param object input
	 * @return object|string
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
	 * @param string code
	 * @return string Updated code with new preamble and postamble
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
	 * @param string inCode Code to update
	 * @param object config
	 * @return string Updated code
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
	 * @param string inCode Code to update
	 * @param object config
	 * @return string Updated code
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

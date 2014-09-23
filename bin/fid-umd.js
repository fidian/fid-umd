#!/usr/bin/env node

"use strict";

var FidUmd, filenames, fs, OptionParser, options, parser;

FidUmd = require('../lib/fid-umd');
fs = require('fs');
OptionParser = require('option-parser');
parser = new OptionParser();
options = {
    statusCode: 0,
    stdinRead: false
};

parser.addOption('h', 'help', 'Display this help message').action(function () {
    console.log('Update or add UMD to JavaScript files');
    console.log('');
    console.log('Usage:');
    console.log('\t' + parser.programName() + ' [options] filename [filename [...]]');
    console.log('');
    console.log('Available Options:');
    console.log(parser.help());
    console.log('');
    console.log('If there are any files that have invalid JSON in their "fid-umd" markers,');
    console.log('they will not be updated and this program will have a failure status code.');
    process.exit(0);
});

function getFileContents(filename) {
    /*jslint stupid:true*/
    if (filename !== '-') {
        return fs.readFileSync(filename, 'utf-8').toString();
    }

    if (options.stdinRead) {
        throw new Error('Aready read from stdin');
    }

    if (fs.existsSync('/dev/stdin')) {
        return fs.readFileSync('/dev/stdin', 'utf-8').toString();
    }
    /*jslint stupid:false*/

    throw new Error('/dev/stdin does not exist and must read from stream synchronously');
}

function updateFile(filename) {
    var contents, umd;

    try {
        umd = new FidUmd();
        /*jslint stupid:true*/
        contents = getFileContents(filename);
        contents = umd.update(contents);

        if (filename !== '-') {
            fs.writeFileSync(filename, contents);
        } else {
            process.stdout.write(contents);
        }
        /*jslint stupid:false*/
    } catch (ex) {
        console.log('Unable to update ' + filename);
        console.log(ex.toString());
        console.log(ex.stack);
        options.statusCode = 1;
    }
}


filenames = parser.parse();
filenames.forEach(updateFile);

if (filenames.length === 0) {
    console.error('Please pass filenames on the command line');
    console.error('For a list of options, use --help');
}

process.exit(options.statusCode);

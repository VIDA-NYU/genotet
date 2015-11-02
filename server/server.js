/**
 * @fileoverview Server code main entry.
 */

'use strict';

/**
 * Configuration flag for running environment.
 * Data path changes w.r.t. this flag.
 * @const {string}
 */
// TODO(bowen): This is sort of hacky and we may think of a better way of
// System configuration
var runEnv = 'laptop';

// Include libraries.
var express = require('express');
var fs = require('fs');
var util = require('util');
var Buffer = require('buffer').Buffer;
var constants = require('constants');

// Include server resources.
var segtree = require('./segtree.js');
var utils = require('./utils.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expmat = require('./expmat.js');

// Application
var app = express();

/**
 * Path of wiggle files.
 * @type {string}
 */
var wiggleAddr;
/**
 * Path of network files.
 * @type {string}
 */
var networkAddr;
/**
 * Path of expression matrix files.
 * @type {string}
 */
var expmatAddr;

// Determine the file paths.
switch(runEnv) {
  case 'vida':
    wiggleAddr = '/data/bonneau/wiggle/';
    networkAddr = '/data/bonneau/network/';
    expmatAddr = '/data/bonneau/';
    break;
  case 'laptop':
    wiggleAddr = 'D:/bnetvis_data/wiggle/';
    networkAddr = 'D:/bnetvis_data/network/';
    expmatAddr = 'D:/bnetvis_data/';
    break;
  case 'lab':
    wiggleAddr = '/home/bowen/bnetvis_data/wiggle/';
    networkAddr = '/home/bowen/bnetvis_data/network/';
    expmatAddr = '/home/bowen/bnetvis_data/';
    break;
}
/**
 * Path of the name code file that maps gene names to binding data track names.
 * @type {string}
 */
var codeFile = wiggleAddr + 'namecode';

/**
 * Path of the exon info file.
 * @type {string}
 */
var exonFile = wiggleAddr + 'exons.bin';

/**
 * Mapping from expression matrix names to their file locations.
 * @type {!Object<string>}
 */
var expmatFile = {
  'b-subtilis': expmatAddr + 'expressionMatrix.bin',
  'rna-seq': expmatAddr + 'rnaseq.bin'
};

/**
 * Mapping from expression matrix names to their TFA file locations.
 * @type {!Object<string>}
 */
var tfamatFile = {
  'b-subtilis': expmatAddr + 'tfa.matrix2.bin',
  'rna-seq': null
};

/**
 * Mapping from expression matrix names to their binding data track names.
 * @type {!Object<string>}
 */
var genecodes = {};

/**
 * Reads the genes' name codes and stores the mapping in genecodes.
 * @param {fs.ReadStream} input
 */
function readCodes(input) {
  var remaining = '';
  input.on('data', function(data) {
    remaining += data;
  });
  input.on('end', function() {
    var w = remaining.split(RegExp(/\s+/));
    for (var i = 0; i < w.length; i += 2) {
      genecodes[w[i].toLowerCase()] = w[i + 1];
    }
  });
}

/**
 * POST request is not used as it conflicts with jsonp.
 */
app.post('/genotet', function(req, res) {
  var type = req.body.type;
  console.log('POST', type);
});

/**
 * GET request handlers.
 */
app.get('/genotet', function(req, res) {
  var type = req.query.type;
  var data;
  console.log('GET', type);

  switch(type) {
    // Network data queries
    case 'net':
      var net = req.query.net.toLowerCase(),
        exp = utils.decodeSpecialChar(req.query.exp),
        file = networkAddr + net + '.bnet';
      data = network.getNet(file, exp);
      break;
    case 'edges':
      // Edges incident to one node
      var net = req.query.net.toLowerCase(),
        name = req.query.name,
        file = networkAddr + net + '.bnet';
      data = network.getEdges(file, name);
      break;
    case 'comb':
      var net = req.query.net,
        exp = utils.decodeSpecialChar(req.query.exp),
        file = networkAddr + net + '.bnet';
      data = network.getComb(file, exp);
      break;
    case 'targets':
      var name = req.query.name,
        net = req.query.net;
      file = networkAddr + net + '.bnet';
      data = networkgetNetTargets(file, name);
      break;

    // Binding data queries
    case 'exons':
      var chr = req.query.chr;
      data = binding.getExons(exonFile, chr);
      break;
    case 'srchexon':
      var name = req.query.name.toLowerCase();
      data = binding.searchExon(exonFile, name);
      break;
    case 'binding':
      // Binding data query [xl, xr], return 200 sample, high resolution binding data.
      var xl = req.query.xl,
        xr = req.query.xr,
        chr = req.query.chr,
        name = utils.decodeSpecialChar(req.query.name).toLowerCase(),
        namecode = genecodes[name];

      var file = wiggleAddr + namecode + '/' + namecode +
        '_treat_afterfiting_chr' + chr + '.bcwig';

      data = binding.getBinding(file, xl, xr);
      data.name = name;
      data.chr = chr;
      break;
    case 'bindingsmp':
      var xl = req.query.xl,
        xr = req.query.xr,
        chr = req.query.chr,
        name = utils.decodeSpecialChar(req.query.name).toLowerCase(),
        namecode = genecodes[name];

      var file = wiggleAddr + namecode + '/' + namecode +
        '_treat_afterfiting_chr' + chr + '.bcwig';

      data = binding.getBindingSampling(file);
      data.name = name;
      data.chr = chr;
      break;

    // Expression matrix data queries
    case 'expmat':
      var file = expmatFile[req.query.mat];
      var exprows = req.query.exprows;
      var expcols = req.query.expcols;
      data = expmat.getExpmat(file, exprows, expcols);
      break;
    case 'expmatline':
      var mat = req.query.mat;
      var name = req.query.name;
      var fileExp = expmatFile[mat], fileTfa = tfamatFile[mat];
      name = name.toLowerCase();
      data = expmat.getExpmatLine(fileExp, fileTfa, name);
      break;

    // Undefined type, error
    default:
      console.error('invalid argument');
      data = '';
  }
  res.jsonp(data);
});

// Rad the name code file.
var codestream = fs.createReadStream(codeFile);
readCodes(codestream);

// Start the application.
app.listen(3000);

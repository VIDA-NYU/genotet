/**
 * @fileoverview Server code main entry.
 */

'use strict';

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
/**
 * Path of bigwig to Wig conversion script
 * @type {string}
 */
var bigwigtoWigAddr;

/**
 * Reads the configuration file and gets the file paths.
 */
function config() {
  var tokens = fs.readFileSync('server/config')
    .toString()
    .split(RegExp(/\s+/));
  for (var i = 0; i < tokens.length; i += 3) {
    var variable = tokens[i];
    var value = tokens[i + 2];
    switch(variable) {
      case 'bindingPath':
        wiggleAddr = value;
        break;
      case 'networkPath':
        networkAddr = value;
        break;
      case 'expressionPath':
        expmatAddr = value;
        break;
      case 'bigwigtoWigPath':
        bigwigtoWigAddr = value;
    }
  }
}
// Configures the server paths.
config();


/**
 * Mapping from expression matrix names to their binding data track names.
 * @type {!Object<string>}
 */
var genecodes = {};
/**
 * Path of the name code file that maps gene names to binding data track names.
 * @type {string}
 */
var codeFile = wiggleAddr + 'namecode';
/**
 * Reads the genes' name codes and stores the mapping in genecodes.
 */
function readCodes() {
  var tokens = fs.readFileSync(codeFile)
    .toString()
    .split(RegExp(/\s+/));
  for (var i = 0; i < tokens.length; i += 2) {
    var gene = tokens[i].toLowerCase();
    var code = tokens[i + 1];
    genecodes[gene] = code;
  }
}
// Read the name code file.
readCodes();


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
 * POST request is not used as it conflicts with jsonp.
 */
app.post('/genotet', function(req, res) {
  var type = req.body.type;
  console.log('POST', type);

  switch(type) {
    // upload
    case 'upload':
      var fileType = req.body.fileType;

      var prefix;
      if (fileType == 'network') {
        prefix = networkAddr;
      } else if (fileType == 'wiggle') {
        prefix = wiggleAddr;
      } else if (fileType == 'expmat') {
        prefix = expmatAddr;
      }

      uploader.uploadFile(req.body, prefix, bigwigtoWigAddr);
  }
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
      exp = exp == '' ? 'a^' : exp;
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
      exprows = exprows == '' ? 'a^' : exprows;
      expcols = expcols == '' ? 'a^' : expcols;
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

// Start the application.
app.listen(3000);

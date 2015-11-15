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
var multer = require('multer');

// Include server resources.
var segtree = require('./segtree.js');
var utils = require('./utils.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expression = require('./expression.js');
var uploader = require('./uploader.js');

// Application
var app = express();

var upload = multer({
  dest: '/genotet/'
});

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
var expressionAddr;
/**
 * Path of bigwig to Wig conversion script
 * @type {string}
 */
var bigWigToWigAddr;

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
        expressionAddr = value;
        break;
      case 'bigWigToWigPath':
        bigWigToWigAddr = value;
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
var expressionFile = {
  'b-subtilis': expressionAddr + 'expressionMatrix.bin',
  'rna-seq': expressionAddr + 'rnaseq.bin'
};

/**
 * Mapping from expression matrix names to their TFA file locations.
 * @type {!Object<string>}
 */
var tfamatFile = {
  'b-subtilis': expressionAddr + 'tfa.matrix2.bin',
  'rna-seq': null
};

/**
 * POST request is not used as it conflicts with jsonp.
 */
app.post('/genotet/upload', upload.single('file'), function(req, res) {
  console.log('POST upload');

  var prefix;
  switch(req.body.type) {
    case 'network':
      prefix = networkAddr;
      break;
    case 'binding':
      prefix = wiggleAddr;
      break;
    case 'expression':
      prefix = expressionAddr;
      break;
  }
  uploader.uploadFile(req.body, req.file, prefix, bigWigToWigAddr);
  res.header('Access-Control-Allow-Origin', '*');
  res.jsonp({
    success: true
  });
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
    case 'network':
      var networkName = req.query.networkName.toLowerCase(),
        geneRegex = utils.decodeSpecialChar(req.query.geneRegex),
        file = networkAddr + networkName + '.bnet';
      geneRegex = geneRegex == '' ? 'a^' : geneRegex;
      data = network.getNet(file, geneRegex);
      break;
    case 'incident-edges':
      // Edges incident to one node
      var networkName = req.query.networkName.toLowerCase(),
        gene = req.query.gene,
        file = networkAddr + networkName + '.bnet';
      data = network.getIncidentEdges(file, gene);
      break;
    case 'combined-regulation':
      var networkName = req.query.networkName,
        geneRegex = utils.decodeSpecialChar(req.query.geneRegex),
        file = networkAddr + networkName + '.bnet';
      data = network.getComb(file, geneRegex);
      break;
    case 'list-network':
      data = network.listNetwork(networkAddr);
      break;

    // Binding data queries
    case 'exons':
      var chr = req.query.chr;
      data = binding.getExons(exonFile, chr);
      break;
    case 'locus':
      var gene = req.query.gene.toLowerCase();
      data = binding.searchExon(exonFile, gene);
      break;
    case 'binding':
      // Binding data query [xl, xr], return # samples.
      var xl = req.query.xl,
        xr = req.query.xr,
        chr = req.query.chr,
        gene = utils.decodeSpecialChar(req.query.gene).toLowerCase();

      var namecode = genecodes[gene];

      console.log(gene, namecode);


      var file = wiggleAddr + namecode + '/' + namecode +
          '_treat_afterfiting_chr' + chr + '.bcwig';

      data = binding.getBinding(file, xl, xr);
      data.gene = gene;
      data.chr = chr;
      break;
    case 'list-binding':
      data = binding.listBindingGenes(wiggleAddr);
      break;

    // Expression matrix data queries
    case 'expression':
      var file = expressionFile[req.query.mat];
      var exprows = req.query.exprows;
      var expcols = req.query.expcols;
      exprows = exprows == '' ? 'a^' : exprows;
      expcols = expcols == '' ? 'a^' : expcols;
      data = expression.getExpmat(file, exprows, expcols);
      break;
    case 'expression-profile':
      var mat = req.query.mat;
      var name = req.query.name;
      var fileExp = expressionFile[mat], fileTfa = tfamatFile[mat];
      name = name.toLowerCase();
      data = expression.getExpmatLine(fileExp, fileTfa, name);
      break;
    case 'list-matrix':
      data = expmat.listMatrix(expmatAddr);
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

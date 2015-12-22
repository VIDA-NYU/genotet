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
var bed = require('./bed.js');

// Application
var app = express();

/**
 * Path of wiggle files.
 * @type {string}
 */
var wigglePath;
/**
 * Path of network files.
 * @type {string}
 */
var networkPath;
/**
 * Path of expression matrix files.
 * @type {string}
 */
var expressionPath;
/**
 * Path of bigwig to Wig conversion script
 * @type {string}
 */
var bigWigToWigPath;
/**
 * Path of temporary uploaded files.
 * @type {string}
 */
var uploadPath;
/**
 * Path of bed data files.
 * @type {string}
 */
var bedPath;
/**
 * Path of config file.
 * @type {string}
 */
var configPath = 'server/config';

// Parse command arguments.
process.argv.forEach(function(token, index) {
  var tokens = token.split(['=']);
  var arg = tokens.length >= 1 ? tokens[0] : '';
  var val = tokens.length >= 2 ? tokens[1] : '';
  switch (arg) {
    case '--config':
      if (val) {
        configPath = val;
      }
      break;
  }
});

/**
 * Reads the configuration file and gets the file paths.
 */
function config() {
  var tokens = fs.readFileSync(configPath)
    .toString()
    .split(RegExp(/\s+/));
  for (var i = 0; i < tokens.length; i += 3) {
    var variable = tokens[i];
    var value = tokens[i + 2];
    switch (variable) {
      case 'bindingPath':
        wigglePath = value;
        break;
      case 'networkPath':
        networkPath = value;
        break;
      case 'expressionPath':
        expressionPath = value;
        break;
      case 'bigWigToWigPath':
        bigWigToWigPath = value;
        break;
      case 'uploadPath':
        uploadPath = value;
        break;
      case 'bedPath':
        bedPath = value;
        break;
    }
  }
}
// Configures the server paths.
config();

var upload = multer({
  dest: uploadPath
});


/**
 * Path of the exon info file.
 * @type {string}
 */
var exonFile = wigglePath + 'exons.bin';

/**
 * Mapping from expression matrix names to their file locations.
 * @type {!Object<string>}
 */
var expressionFile = {
  'b-subtilis': expressionPath + 'expressionMatrix.bin',
  'rna-seq': expressionPath + 'rnaseq.bin'
};

/**
 * Mapping from expression matrix names to their TFA file locations.
 * @type {!Object<string>}
 */
var tfamatFile = {
  'b-subtilis': expressionPath + 'tfa.matrix2.bin',
  'rna-seq': null
};

/**
 * POST request is not used as it conflicts with jsonp.
 */
app.post('/genotet/upload', upload.single('file'), function(req, res) {
  console.log('POST upload');

  var prefix;
  switch (req.body.type) {
    case 'network':
      prefix = networkPath;
      break;
    case 'binding':
      prefix = wigglePath;
      break;
    case 'expression':
      prefix = expressionPath;
      break;
    case 'bed':
      prefix = bedPath;
      break;
  }
  uploader.uploadFile(req.body, req.file, prefix, bigWigToWigPath);
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

  switch (type) {
    // Network data queries
    case 'network':
      var networkName = req.query.networkName.toLowerCase(),
        geneRegex = utils.decodeSpecialChar(req.query.geneRegex),
        fileType = 'text';
        file = networkPath + networkName + '.bnet';
      if (fileType == 'text') {
        file = networkPath + networkName;
      }
      geneRegex = geneRegex == '' ? 'a^' : geneRegex;
      data = network.getNet(file, geneRegex, fileType);
      break;
    case 'incident-edges':
      // Edges incident to one node
      var networkName = req.query.networkName.toLowerCase(),
        gene = req.query.gene,
        file = networkPath + networkName;
      data = network.getIncidentEdges(file, gene);
      break;
    case 'combined-regulation':
      var networkName = req.query.networkName,
        geneRegex = utils.decodeSpecialChar(req.query.geneRegex),
        file = networkPath + networkName + '.bnet';
      data = network.getComb(file, geneRegex);
      break;
    case 'list-network':
      data = network.listNetwork(networkPath);
      break;
    case 'read-net':
      var networkName = req.query.networkName;
      var file = networkPath + networkName;
      var geneRegex = req.query.geneRegex;
      var result = network.readNetwork(file, geneRegex);
      if (result.success) {
        data = result.data;
      } else {
        data = null;
        console.log('network data invalid');
      }
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
        gene = utils.decodeSpecialChar(req.query.gene);
      var file = wigglePath + gene + '_chr/' + gene + '_chr' + chr + '.bcwig';

      data = binding.getBinding(file, xl, xr);
      data.gene = gene;
      data.chr = chr;
      break;
    case 'list-binding':
      data = binding.listBindingGenes(wigglePath);
      break;

    // Expression matrix data queries
    /*
    // TODO(jiaming): either remove old expression entry, or uniformly use
    // fileType to distinguish processing method.
    case 'expression':
      var file = expressionFile[req.query.matrixName];
      var exprows = req.query.geneRegex;
      var expcols = req.query.conditionRegex;
      exprows = exprows == '' ? 'a^' : exprows;
      expcols = expcols == '' ? 'a^' : expcols;
      data = expression.getExpmat(file, exprows, expcols);
      break;
    */
    case 'expression-profile':
      var mat = req.query.mat;
      var name = req.query.name;
      var fileExp = expressionFile[mat], fileTfa = tfamatFile[mat];
      name = name.toLowerCase();
      data = expression.getExpmatLine(fileExp, fileTfa, name);
      break;
    case 'list-matrix':
      data = expression.listMatrix(expmatPath);
      break;
    case 'expression':
      var file = expressionPath + req.query.matrixName;
      var geneRegex = req.query.geneRegex;
      var conditionRegex = req.query.conditionRegex;
      data = expression.readExpression(file, geneRegex, conditionRegex);
      break;

    // Bed data queries
    case 'bed':
      var file = req.query.file;
      var chr = req.query.chr;
      var dir = bedPath + file + '_chr/' + file + '_' + chr;
      data = bed.readBed(dir, req.query.xl, req.query.xr);
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

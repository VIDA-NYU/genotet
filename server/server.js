/**
 * @fileoverview Server code main entry.
 */

var express = require('express');
var fs = require('fs');
var multer = require('multer');

var segtree = require('./segtree.js');
var utils = require('./utils.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expression = require('./expression.js');
var uploader = require('./uploader.js');
var bed = require('./bed.js');
var mapping = require('./mapping.js');

// Application
var app = express();

/**
 * Genotet namespace.
 * @const
 */
var genotet = {};

/**
 * @typedef {{
 *   type: string,
 *   message: string
 * }}
 */
genotet.Error;

/**
 * Path of wiggle files.
 * @type {string}
 */
var bindingPath;
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
 * Path of mapping files.
 * @type {string}
 */
var mappingPath;
/**
 * Path of config file.
 * @type {string}
 */
var configPath = 'server/config';

// Parse command arguments.
process.argv.forEach(function(token) {
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
        bindingPath = value;
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
      case 'mappingPath':
        mappingPath = value;
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
var exonFile = bindingPath + 'exons.bin';

/**
 * POST request is not used as it conflicts with jsonp.
 */
app.post('/genotet/upload', upload.single('file'), function(req, res) {
  console.log('POST upload');

  var prefix = '';
  switch (req.body.type) {
    case genotet.FileType.NETWORK:
      prefix = networkPath;
      break;
    case genotet.FileType.BINDING:
      prefix = bindingPath;
      break;
    case genotet.FileType.EXPRESSION:
      prefix = expressionPath;
      break;
    case genotet.FileType.BED:
      prefix = bedPath;
      break;
    case genotet.FileType.MAPPING:
      prefix = mappingPath;
      break;
  }
  var body = {
    type: req.body.type,
    name: req.body.name,
    description: req.body.description
  };
  uploader.uploadFile(body, req.file, prefix, bigWigToWigPath);
  res.header('Access-Control-Allow-Origin', '*');
  res.jsonp({
    success: true
  });
});

// GET request handlers.
app.get('/genotet', function(req, res) {
  var query = req.query;
  var type = query.type;
  var data;
  console.log('GET', type);
  switch (type) {
    // Network data queries
    case 'network':
      data = network.query.network(query, networkPath);
      break;
    case 'network-info':
      data = network.query.allNodes(query, networkPath);
      break;
    case 'incident-edges':
      data = network.query.incidentEdges(query, networkPath);
      break;
    case 'combined-regulation':
      data = network.query.combinedRegulation(query, networkPath);
      break;
    case 'incremental-edges':
      data = network.query.incrementalEdges(query, networkPath);
      break;

    // Binding data queries
    case 'binding':
      data = binding.query.histogram(query, bindingPath);
      break;
    case 'exons':
      data = binding.query.exons(query, exonFile);
      break;
    case 'locus':
      data = binding.query.locus(query, exonFile);
      break;

    case 'expression':
      data = expression.query.matrix(query, expressionPath);
      break;
    case 'expression-info':
      data = expression.query.matrixInfo(query, expressionPath);
      break;
    case 'tfa-profile':
      data = expression.query.tfaProfile(query, expressionPath);
      break;

    // Bed data queries
    case 'bed':
      data = bed.query.motifs(query, bedPath);
      break;

    // Mapping data queries
    case 'mapping':
      data = mapping.query.getMapping(query, mappingPath);
      break;

    // Data listing
    case 'list-network':
      data = network.query.list(networkPath);
      break;
    case 'list-binding':
      data = binding.query.list(bindingPath);
      break;
    case 'list-expression':
      data = expression.query.list(expressionPath);
      break;
    case 'list-bed':
      data = bed.query.list(bedPath);
      break;
    case 'list-mapping':
      data = mapping.query.list(mappingPath);
      break;

    // Undefined type, error
    default:
      console.error('invalid query type');
      data = {
        error: {
          type: 'query',
          message: 'invalid query type'
        }
      };
  }
  res.jsonp(data);
});

// Start the application.
app.listen(3000);

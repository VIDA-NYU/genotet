/**
 * @fileoverview Server code main entry.
 */

var express = require('express');
var fs = require('fs');
var multer = require('multer');
var bodyParser = require('body-parser');

var segtree = require('./segtree.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expression = require('./expression.js');
var uploader = require('./uploader.js');
var bed = require('./bed.js');
var mapping = require('./mapping.js');
var log = require('./log.js');
var dbData = require('./dbData.js');

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
 * Path for data storage.
 * @type {string}
 */
var dataPath;
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
 * Path of user logs.
 * @type {string}
 */
var logPath;
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
      case 'dataPath':
        dataPath = value;
        break;
      case 'bigWigToWigPath':
        bigWigToWigPath = value;
        break;
    }
  }
  uploadPath = dataPath + 'upload/';
  logPath = dataPath + 'log/'
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
var exonFile = dataPath + 'exons.bin';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/**
 * User log POST handler.
 */
app.post('/genotet/log', function(req, res) {
  log.serverLog('POST', 'user-log');

  log.query.userLog(logPath, req.body);
});

/**
 * Upload POST handler.
 */
app.post('/genotet/upload', upload.single('file'), function(req, res) {
  log.serverLog('POST upload');

  var body = {
    type: req.body.type,
    dataName: req.body.name,
    description: req.body.description
  };
  var data = {};
  dbData.createConnection(function(db, err) {
    uploader.uploadFile(body, req.file, dataPath, bigWigToWigPath, db,
      function(err) {
        data = err;
      });
  });
  res.header('Access-Control-Allow-Origin', '*');
  if (data.error) {
    res.status(500).json(data.error);
  } else {
    res.json({
      success: true
    });
  }
});

/**
 * GET request handler.
 */
app.get('/genotet', function(req, res) {

  var serverResponse = function() {
    res.header('Access-Control-Allow-Origin', '*');
    if (data.error) {
      res.status(500).json(data.error);
    } else {
      res.json(data);
    }
  };

  var query = JSON.parse(req.query.data);
  var type = query.type;
  var data;
  log.serverLog('GET', type);
  dbData.createConnection(function(db, err) {
    switch (type) {
      // Network data queries
      case network.QueryType.NETWORK:
        data = network.query.network(query, dataPath);
        serverResponse();
        break;
      case network.QueryType.NETWORK_INFO:
        data = network.query.allNodes(query, dataPath);
        serverResponse();
        break;
      case network.QueryType.INCIDENT_EDGES:
        data = network.query.incidentEdges(query, dataPath);
        serverResponse();
        break;
      case network.QueryType.COMBINED_REGULATION:
        data = network.query.combinedRegulation(query, dataPath);
        serverResponse();
        break;
      case network.QueryType.INCREMENTAL_EDGES:
        data = network.query.incrementalEdges(query, dataPath);
        serverResponse();
        break;

      // Binding data queries
      case binding.QueryType.BINDING:
        data = binding.query.histogram(db, query, dataPath, function(result) {
          data = result;
          serverResponse();
        });
        break;
      case binding.QueryType.EXONS:
        data = binding.query.exons(query, exonFile);
        serverResponse();
        break;
      case binding.QueryType.LOCUS:
        data = binding.query.locus(query, exonFile);
        serverResponse();
        break;

      // Expression data queries
      case expression.QueryType.EXPRESSION:
        data = expression.query.matrix(query, dataPath);
        serverResponse();
        break;
      case expression.QueryType.EXPRESSION_INFO:
        data = expression.query.matrixInfo(query, dataPath);
        serverResponse();
        break;
      case expression.QueryType.PROFILE:
        data = expression.query.profile(query, dataPath);
        serverResponse();
        break;
      case expression.QueryType.TFA_PROFILE:
        data = expression.query.tfaProfile(query, dataPath);
        serverResponse();
        break;

      // Bed data queries
      case bed.QueryType.BED:
        data = bed.query.motifs(query, dataPath);
        serverResponse();
        break;

      // Mapping data queries
      case mapping.QueryType.MAPPING:
        data = mapping.query.getMapping(query, dataPath);
        serverResponse();
        break;

      // Data listing
      case network.QueryType.LIST_NETWORK:
        network.query.list(db, function(result) {
          data = result;
          serverResponse();
        });
        break;
      case binding.QueryType.LIST_BINDING:
        binding.query.list(db, function(result) {
          data = result;
          serverResponse();
        });
        break;
      case expression.QueryType.LIST_EXPRESSION:
        expression.query.list(db, function(result) {
          data = result;
          serverResponse();
        });
        break;
      case bed.QueryType.LIST_BED:
        bed.query.list(db, function(result) {
          data = result;
          serverResponse();
        });
        break;
      case mapping.QueryType.LIST_MAPPING:
        mapping.query.list(db, function(result) {
          data = result;
          serverResponse();
        });
        break;

      // Undefined type, error
      default:
        log.serverLog('invalid query type');
        data = {
          error: {
            type: 'query',
            message: 'invalid query type'
          }
        };
        serverResponse();
    }
    //console.log(data);


  });
});

// Error Handler
app.use(function(err, req, res, next) {
  log.serverLog(err.stack);
  res.status(500);
  res.json('Internal Server Error');
});

// Start the application.
var server = app.listen(3000);
server.setTimeout(1200000);

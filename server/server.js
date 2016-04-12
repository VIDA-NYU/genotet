/**
 * @fileoverview Server code main entry.
 */

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var https = require('https');
var multer = require('multer');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var assert = require('assert');
var cookieParser = require('cookie-parser');
var mongoUrl = 'mongodb://localhost:27017/express';

var segtree = require('./segtree.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expression = require('./expression.js');
var uploader = require('./uploader.js');
var user = require('./user.js');
var bed = require('./bed.js');
var mapping = require('./mapping.js');
var log = require('./log.js');
var database = require('./database.js');

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

/**
 * Path of private key file.
 * @type {string}
 */
var privateKeyPath;
/**
 * Path of certificate file.
 * @type {string}
 */
var certificatePath;

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
      case 'privateKeyPath':
        privateKeyPath = value;
        break;
      case 'certificatePath':
        certificatePath = value;
        break;
    }
  }
  uploadPath = dataPath + 'upload/';
  logPath = dataPath + 'log/';
}
// Configures the server paths.
config();

var upload = multer({
  dest: uploadPath
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

/**
 * Path of the exon info file.
 * @type {string}
 */
var exonFile = dataPath + 'exons.bin';

/**
 * Database connection.
 */
MongoClient.connect(mongoUrl, function(err, db) {
  if (err) {
    log.serverLog(err.message);
    return;
  }
  log.serverLog('connected to MongoDB');
  database.db = db;

  // Start the application.
  // TODO(Liana): Direct HTTP to HTTPS.
  var server = app.listen(3000);
  server.setTimeout(1200000);
});

/**
 * User authenticate handler.
 */
app.use('/genotet', function(req, res, next) {
  if (req.url == '/check') {
    res.status(200);
  }
  else if (req.url == '/user') {
    next();
  } else {
    if (req.cookies.sessionId === undefined) {
      res.status(500).json({
        error: 'user not recognized.'
      });
    }
    else {
      user.findUsername(req.cookies.sessionId, function(result) {
        if (!result.error) {
          req.username = result;
          next();
        } else {
          res.status(500).json(data);
        }
      });
    }
  }
});

/**
 * Server response.
 * @param {Object|user.Error|undefined} data Server responce data.
 * @param {!express.Response} res Express response.
 */
var serverResponse = function(data, res) {
  res.header('Access-Control-Allow-Origin', '*');
  if (!data) {
    res.status(200).json({});
  } else if (data.error) {
    log.serverLog(data.error);
    res.status(500).json(data.error);
  } else {
    res.json(data);
  }
};

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
  uploader.uploadFile(body, req.file, dataPath, bigWigToWigPath, req.username,
    function(ret) {
      serverResponse(/** @type {Object} */(ret), res);
    });
});

app.post('/genotet/user', function(req, res) {
  log.serverLog('POST user');

  var query = req.body;
  var type = query.type;
  var data;

  switch (type) {
    case user.QueryType.SIGNUP:
      user.query.signUp(query, function(data) {
        serverResponse(data, res);
      });
      break;
    case user.QueryType.SIGNIN:
      user.query.signIn(query, function(data) {
        serverResponse(data, res);
      });
      break;
    case user.QueryType.AUTOSIGNIN:
      user.query.autoSignIn(query, function(data) {
        serverResponse(data, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type', type);
      data = {
        error: {
          type: 'query',
          message: 'invalid query type'
        }
      };
      serverResponse(data, res);
  }
});

// GET request handlers.
app.get('/genotet', function(req, res) {
  var query = JSON.parse(req.query.data);
  var type = query.type;

  log.serverLog('GET', type);

  switch (type) {
    // Network data queries
    case network.QueryType.NETWORK:
      serverResponse(network.query.network(query, dataPath), res);
      break;
    case network.QueryType.NETWORK_INFO:
      serverResponse(network.query.allNodes(query, dataPath), res);
      break;
    case network.QueryType.INCIDENT_EDGES:
      serverResponse(network.query.incidentEdges(query, dataPath), res);
      break;
    case network.QueryType.COMBINED_REGULATION:
      serverResponse(network.query.combinedRegulation(query, dataPath), res);
      break;
    case network.QueryType.INCREMENTAL_EDGES:
      serverResponse(network.query.incrementalEdges(query, dataPath), res);
      break;

    // Binding data queries
    case binding.QueryType.BINDING:
      binding.query.histogram(query, dataPath, req.username, function(result) {
        serverResponse(result, res);
      });
      break;
    case binding.QueryType.EXONS:
      serverResponse(binding.query.exons(query, exonFile), res);
      break;
    case binding.QueryType.LOCUS:
      serverResponse(binding.query.locus(query, exonFile), res);
      break;

    // Expression data queries
    case expression.QueryType.EXPRESSION:
      serverResponse(expression.query.matrix(query, dataPath), res);
      break;
    case expression.QueryType.EXPRESSION_INFO:
      serverResponse(expression.query.matrixInfo(query, dataPath), res);
      break;
    case expression.QueryType.PROFILE:
      serverResponse(expression.query.profile(query, dataPath), res);
      break;
    case expression.QueryType.TFA_PROFILE:
      serverResponse(expression.query.tfaProfile(query, dataPath), res);
      break;

    // Bed data queries
    case bed.QueryType.BED:
      serverResponse(bed.query.motifs(query, dataPath), res);
      break;

    // Mapping data queries
    case mapping.QueryType.MAPPING:
      serverResponse(mapping.query.getMapping(query, dataPath), res);
      break;

    // Data listing
    case network.QueryType.LIST_NETWORK:
      network.query.list(function(result) {
        serverResponse(result, res);
      });
      break;
    case binding.QueryType.LIST_BINDING:
      binding.query.list(function(result) {
        serverResponse(result, res);
      });
      break;
    case expression.QueryType.LIST_EXPRESSION:
      expression.query.list(function(result) {
        serverResponse(result, res);
      });
      break;
    case bed.QueryType.LIST_BED:
      bed.query.list(function(result) {
        serverResponse(result, res);
      });
      break;
    case mapping.QueryType.LIST_MAPPING:
      mapping.query.list(function(result) {
        serverResponse(result, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type');
      var data = {
        error: {
          type: 'query',
          message: 'invalid query type'
        }
      };
      serverResponse(data, res);
  }
});

// Error Handler
app.use(function(err, req, res, next) {
  log.serverLog(err.stack);
  res.status(500);
  res.json('Internal Server Error');
});

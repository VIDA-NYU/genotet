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
var session = require('express-session');
var mongoUrl = 'mongodb://localhost:27017/';
var FileStore = require('session-file-store')(session);

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
/**
 * Name of mongo database.
 * @type {string}
 */
var mongoDatabase;

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
      case 'mongoDatabase':
        mongoDatabase = value;
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
app.use(session({
  name: 'genotet-session',
  secret: 'genotet',
  cookie: {
    maxAge: 3600000
  },
  saveUninitialized: true,
  resave: true,
  store: new FileStore()
}));

/**
 * Path of the exon info file.
 * @type {string}
 */
var exonFile = dataPath + 'exons.bin';

/**
 * User authenticate handler.
 */
app.use('/genotet', function(req, res, next) {

  if (req.url.substr(0, 6) == '/check') {
    res.header('Access-Control-Allow-Origin', 'http://localhost');
    res.jsonp({});
  }
  else if (req.url.substr(0, 5) == '/user') {
    next();
  } else {
    if (req.session.id === undefined) {
      res.header('Access-Control-Allow-Origin', 'http://localhost');
      log.serverLog('user not recognized.');
      res.jsonp({
        error: 'user not recognized.'
      });
    }
    else {
      user.findUsername(req.session.id, function(result) {
        if (!result.error) {
          log.serverLog('username', result);
          req.username = result;
          next();
        } else {
          log.serverLog(result.error);
          res.header('Access-Control-Allow-Origin', 'http://localhost');
          res.jsonp(result);
        }
      });
    }
  }
});

/**
 * Sends back JSONP response.
 * @param {Object|undefined} data Server response data.
 * @param {!express.Response} res Express response.
 */
var jsonpResponse = function(data, res) {
  if (data == undefined) {
    // data is null because some callback does not return values
    res.status(200).jsonp({});
  } else if (data.error) {
    log.serverLog(data.error);
    res.status(200).jsonp({error: data.error});
  } else {
    res.status(200).jsonp(data);
  }
};

/**
 * Sends back JSON response.
 * @param {Object|user.Error|undefined} data Server response data.
 * @param {!express.Response} res Express response.
 */
var jsonResponse = function(data, res) {
  // TODO(bowen): need to change cross-origin to https://localhost as well
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', 'http://localhost');
  if (data == undefined) {
    // data is null because some callback does not return values
    res.status(200).json({});
  } else if (data.error) {
    log.serverLog(data.error);
    res.status(500).json(data.error);
  } else {
    res.status(200).json(data);
  }
};

/**
 * User log POST handler.
 */
app.get('/genotet/log', function(req, res) {
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
      jsonResponse(/** @type {Object} */(ret), res);
    });
});


app.get('/genotet/user', function(req, res) {
  log.serverLog('GET user');

  var query = JSON.parse(req.query.data);
  query.sessionId = req.session.id;
  var type = query.type;

  switch (type) {
    case user.QueryType.SIGNUP:
      user.query.signUp(query, function(data) {
        jsonpResponse(data, res);
      });
      break;
    case user.QueryType.SIGNIN:
      user.query.signIn(query, function(data) {
        jsonpResponse(data, res);
      });
      break;
    case user.QueryType.AUTOSIGNIN:
      user.query.autoSignIn(query, function(data) {
        jsonpResponse(data, res);
      });
      break;
    case user.QueryType.LOGOUT:
      user.query.logOut(query, function(data) {
        jsonpResponse(data, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type', type);
      jsonpResponse({error: 'invalid GET query type'}, res);
  }
});


// GET request handlers.
app.get('/genotet', function(req, res) {
  // bowen: here session id should remain the same across queries.
  // TODO(bowen): after confirming the above, please remove this log.
  console.log('Session Id:', req.session.id);

  var query = JSON.parse(req.query.data);
  query.username = req.username;
  var type = query.type;

  log.serverLog('GET', type);

  switch (type) {
    // Network data queries
    case network.QueryType.NETWORK:
      jsonpResponse(network.query.network(query, dataPath), res);
      break;
    case network.QueryType.NETWORK_INFO:
      jsonpResponse(network.query.allNodes(query, dataPath), res);
      break;
    case network.QueryType.INCIDENT_EDGES:
      jsonpResponse(network.query.incidentEdges(query, dataPath), res);
      break;
    case network.QueryType.COMBINED_REGULATION:
      jsonpResponse(network.query.combinedRegulation(query, dataPath), res);
      break;
    case network.QueryType.INCREMENTAL_EDGES:
      jsonpResponse(network.query.incrementalEdges(query, dataPath), res);
      break;

    // Binding data queries
    case binding.QueryType.BINDING:
      binding.query.histogram(query, dataPath, function(result) {
        jsonpResponse(result, res);
      });
      break;
    case binding.QueryType.EXONS:
      jsonpResponse(binding.query.exons(query, exonFile), res);
      break;
    case binding.QueryType.LOCUS:
      jsonpResponse(binding.query.locus(query, exonFile), res);
      break;

    // Expression data queries
    case expression.QueryType.EXPRESSION:
      jsonpResponse(expression.query.matrix(query, dataPath), res);
      break;
    case expression.QueryType.EXPRESSION_INFO:
      jsonpResponse(expression.query.matrixInfo(query, dataPath), res);
      break;
    case expression.QueryType.PROFILE:
      jsonpResponse(expression.query.profile(query, dataPath), res);
      break;
    case expression.QueryType.TFA_PROFILE:
      jsonpResponse(expression.query.tfaProfile(query, dataPath), res);
      break;

    // Bed data queries
    case bed.QueryType.BED:
      jsonpResponse(bed.query.motifs(query, dataPath), res);
      break;

    // Mapping data queries
    case mapping.QueryType.MAPPING:
      jsonpResponse(mapping.query.getMapping(query, dataPath), res);
      break;

    // Data listing
    case network.QueryType.LIST_NETWORK:
      network.query.list(query, function(result) {
        jsonpResponse(result, res);
      });
      break;
    case binding.QueryType.LIST_BINDING:
      binding.query.list(query, function(result) {
        jsonpResponse(result, res);
      });
      break;
    case expression.QueryType.LIST_EXPRESSION:
      expression.query.list(query, function(result) {
        jsonpResponse(result, res);
      });
      break;
    case bed.QueryType.LIST_BED:
      bed.query.list(query, function(result) {
        jsonpResponse(result, res);
      });
      break;
    case mapping.QueryType.LIST_MAPPING:
      mapping.query.list(query, function(result) {
        jsonpResponse(result, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type');
      jsonpResponse({error: 'invalid GET query type'}, res);
  }
});

// Error Handler
app.use(function(err, req, res, next) {
  log.serverLog(err.stack);
  res.jsonp({error: 'internal server error'});
});

/**
 * User authenticate handler.
 */
MongoClient.connect(mongoUrl, function(err, mongoClient) {
  if (err) {
    log.serverLog(err.message);
    return;
  }
  log.serverLog('connected to MongoDB');
  database.db = mongoClient.db(mongoDatabase);

  // Start the application.
  // TODO(Liana): Direct HTTP to HTTPS.
  var server = app.listen(3000);
  server.setTimeout(1200000);
});

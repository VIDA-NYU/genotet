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
    maxAge: 3600000,
    httpOnly: false
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
 * @type {!Array<string>}
 */
var allowedOrigins = [
  // TODO(bowen): need to change cross-origin to https://localhost as well
  'https://localhost',
  'file://'
];

/**
 * Sends back JSON response.
 * @param {Object|user.Error|undefined} data Server response data.
 * @param {!express.Request} req Express request.
 * @param {!express.Response} res Express response.
 */
var jsonResponse = function(data, req, res) {
  // In normal usage, the request origin is 'http://localhost' (or the running
  // domain name). In testing the request origin is 'file://'. We must allow
  // two possibilities, however it is not allowed to set two Allow-Origins.
  // Therefore we must match the allowed origins one by one.
  // Note that you cannot set allowOrigin to '*', which is not compatible with
  // Allow-Credentials being true.
  var allowOrigin = '';
  allowedOrigins.forEach(function(origin) {
    if (req.headers.origin == origin) {
      allowOrigin = origin;
    }
  });
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Credentials', true);

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
 * Check request handler.
 */
app.get('/genotet/check', function(req, res) {
  jsonResponse({}, req, res);
});

/**
 * User authentication handler.
 */
app.post('/genotet/user', function(req, res) {
  log.serverLog('POST user');
  console.log('Session Id (POST):', req.session.id);

  var query = JSON.parse(req.body.data);
  query.sessionId = req.session.id;
  var type = query.type;

  switch (type) {
    case user.QueryType.SIGNUP:
      user.query.signUp(query, function(data) {
        jsonResponse(data, req, res);
      });
      break;
    case user.QueryType.SIGNIN:
      user.query.signIn(query, function(data) {
        jsonResponse(data, req, res);
      });
      break;
    case user.QueryType.AUTOSIGNIN:
      user.query.autoSignIn(query, function(data) {
        jsonResponse(data, req, res);
      });
      break;
    case user.QueryType.LOGOUT:
      user.query.logOut(query, function(data) {
        jsonResponse(data, req, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type', type);
      jsonResponse({error: 'invalid POST query type'}, req, res);
  }
});

/**
 * User indentification handler.
 */
app.use('/genotet', function(req, res, next) {

  if (req.session.id === undefined) {
    var err = {error: 'no valid session found'};
    jsonResponse(err, req, res);
  } else {
    user.findUsername(req.session.id, function(result) {
      if (!result.error) {
        log.serverLog('username', result);
        req.username = result;
        next();
      } else {
        log.serverLog(result.error);
        jsonResponse(result, req, res);
      }
    });
  }
});

/**
 * User log POST handler.
 */
app.post('/genotet/log', function(req, res) {
  log.serverLog('POST', 'user-log');
  var query = JSON.parse(req.body.data);
  query.sessionId = req.session.id;
  query.username = req.username;

  log.query.userLog(logPath, query);
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
      jsonResponse(/** @type {Object} */(ret), req, res);
    });
});

// GET request handlers.
app.get('/genotet', function(req, res) {
  // bowen: here session id should remain the same across queries.
  // TODO(bowen): after confirming the above, please remove this log.
  console.log('Session Id (GET):', req.session.id);

  var query = JSON.parse(req.query.data);
  query.username = req.username;
  var type = query.type;

  log.serverLog('GET', type);

  switch (type) {
    // Network data queries
    case network.QueryType.NETWORK:
      jsonResponse(network.query.network(query, dataPath), req, res);
      break;
    case network.QueryType.NETWORK_INFO:
      jsonResponse(network.query.allNodes(query, dataPath), req, res);
      break;
    case network.QueryType.INCIDENT_EDGES:
      jsonResponse(network.query.incidentEdges(query, dataPath), req, res);
      break;
    case network.QueryType.COMBINED_REGULATION:
      jsonResponse(network.query.combinedRegulation(query, dataPath), req, res);
      break;
    case network.QueryType.INCREMENTAL_EDGES:
      jsonResponse(network.query.incrementalEdges(query, dataPath), req, res);
      break;

    // Binding data queries
    case binding.QueryType.BINDING:
      binding.query.histogram(query, dataPath, function(result) {
        jsonResponse(result, req, res);
      });
      break;
    case binding.QueryType.EXONS:
      jsonResponse(binding.query.exons(query, exonFile), req, res);
      break;
    case binding.QueryType.LOCUS:
      jsonResponse(binding.query.locus(query, exonFile), req, res);
      break;

    // Expression data queries
    case expression.QueryType.EXPRESSION:
      jsonResponse(expression.query.matrix(query, dataPath), req, res);
      break;
    case expression.QueryType.EXPRESSION_INFO:
      jsonResponse(expression.query.matrixInfo(query, dataPath), req, res);
      break;
    case expression.QueryType.PROFILE:
      jsonResponse(expression.query.profile(query, dataPath), req, res);
      break;
    case expression.QueryType.TFA_PROFILE:
      jsonResponse(expression.query.tfaProfile(query, dataPath), req, res);
      break;

    // Bed data queries
    case bed.QueryType.BED:
      jsonResponse(bed.query.motifs(query, dataPath), req, res);
      break;

    // Mapping data queries
    case mapping.QueryType.MAPPING:
      jsonResponse(mapping.query.getMapping(query, dataPath), req, res);
      break;

    // Data listing
    case network.QueryType.LIST_NETWORK:
      network.query.list(query, function(result) {
        jsonResponse(result, req, res);
      });
      break;
    case binding.QueryType.LIST_BINDING:
      binding.query.list(query, function(result) {
        jsonResponse(result, req, res);
      });
      break;
    case expression.QueryType.LIST_EXPRESSION:
      expression.query.list(query, function(result) {
        jsonResponse(result, req, res);
      });
      break;
    case bed.QueryType.LIST_BED:
      bed.query.list(query, function(result) {
        jsonResponse(result, req, res);
      });
      break;
    case mapping.QueryType.LIST_MAPPING:
      mapping.query.list(query, function(result) {
        jsonResponse(result, req, res);
      });
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type');
      jsonResponse({error: 'invalid GET query type'}, req, res);
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
  var privateKey = fs.readFileSync(privateKeyPath);
  var certificate = fs.readFileSync(certificatePath);
  var httpsOptions = {
    key: privateKey,
    cert: certificate
  };
  var httpsServer = https.createServer(
    /** @type {?} */(httpsOptions),
    /** @type {?} */(app)
  ).listen(3000);
  /** @type {?} */(httpsServer).setTimeout(1200000);
});

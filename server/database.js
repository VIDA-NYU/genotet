/**
 * @fileoverview database access object for data.
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/express';

var log = require('./log');
var user = require('./user');
var utils = require('./utils');

/** @type {database} */
module.exports = database;

/**
 * @constructor
 */
function database() {}

/**
 * @private @const {string}
 */
database.DATA_COLLECTION_ = 'file';

/**
 * @private @const {string}
 */
database.PROGRESS_COLLECTION_ = 'uploadProgress';

/**
 * @typedef {{
 *   error: (string|undefined)
 * }}
 */
database.Error;

/**
 * @typedef {{
 *   fileName: string,
 *   dataName: string,
 *   description: string,
 *   chrs: Array<string>
 * }}
 */
database.File;

/**
 * // TODO(jiaming): This should go to the middleware of server.
 * Creates a connection to the mongodb.
 * @param {function(!mongodb.Db, Object=)} callback The callback function.
 */
database.createConnection = function(callback) {
  MongoClient.connect(mongoUrl, function(err, db) {
    callback(db, err);
  });
};

/**
 * Inserts a new file into database.
 * @param {!mongodb.Db} db The database.
 * @param {string} path Path to the folder of the file.
 * @param {string} fileName File name of the file.
 * @param {!Object} property Properties of the file.
 * @param {function(database.Error)} callback Callback function.
 */
database.insertFile = function(db, path, fileName, property, callback) {
  var collection = db.collection(database.DATA_COLLECTION_);
  collection.insertOne({
    fileName: fileName,
    path: path,
    property: property,
    user: user.getUsername()
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
      return;
    }
    log.serverLog(result);
  });

  collection = db.collection(database.PROGRESS_COLLECTION_);
  collection.insertOne({
    fileName: fileName,
    user: user.getUsername(),
    percentage: 0
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
      return;
    }
    log.serverLog(result);
    callback({});
  });
};

/**
 * Updates processing progress in database.
 * @param {!mongodb.Db} db The database.
 * @param {string} fileName File name of the file.
 * @param {number} percentage Processing progress percentage.
 * @param {function(database.Error)} callback Callback function.
 */
database.updateProgress = function(db, fileName, percentage, callback) {
  var collection = db.collection(database.PROGRESS_COLLECTION_);
  collection.updateOne(
    {fileName: fileName},
    {$set: {percentage: percentage}},
    function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err});
        return;
      }
      log.serverLog(result);
      callback({});
    });
};

/**
 * Gets data list from database.
 * @param {!mongodb.Db} db The database object.
 * @param {string} type The file type to list.
 * @param {function((Array<!database.File>|database.Error))} callback
 */
database.getList = function(db, type, callback) {
  var collection = db.collection(database.DATA_COLLECTION_);
  var cursor = collection.find({
    user: user.getUsername()
  });
  var ret = [];
  cursor.each(function(err, doc) {
    if (err) {
      log.serverLog(err.message);
      return;
    }
    if (doc == null) {
      callback(ret);
      return;
    }
    if (doc.property.type == type) {
      var file = {
        fileName: doc.fileName,
        dataName: doc.property.dataName,
        description: doc.property.description
      };
      if (type == 'binding') {
        file.chrs = doc.chrs;
      }
      ret.push(file);
    }
  });
};

/**
 * Inserts chromosomes to database for binding files.
 * @param {!mongodb.Db} db The database object.
 * @param {string} fileName The binding file name.
 * @param {!Array<string>} chrs The chromosomes to be inserted.
 * @param {function(database.Error)} callback The callback function.
 */
database.insertBindingChrs = function(db, fileName, chrs, callback) {
  var collection = db.collection(database.DATA_COLLECTION_);
  collection.updateOne(
    {fileName: fileName,
    user: user.getUsername()},
    {$set: {chrs: chrs}},
    function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err});
        return;
      }
      log.serverLog(result);
      callback({});
  });
};

/**
 * Gets the gene for binding files from database.
 * @param {!mongodb.Db} db The database object.
 * @param {string} fileName The file which the gene belongs to.
 * @param {function((string|database.Error))} callback The callback function.
 */
database.getBindingGene = function(db, fileName, callback) {
  var collection = db.collection(database.DATA_COLLECTION_);
  // TODO(jiaming): change it to getOne function.
  collection.find(
    {fileName: fileName, user: user.getUsername()}
  ).toArray(function(err, docs) {
    if (err) {
      callback({error: err});
      return;
    }
    if (docs.length) {
      callback(docs[0].property.dataName);
    }
  });
};

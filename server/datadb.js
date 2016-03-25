/**
 * @fileoverview database access object for data.
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/express';

var log = require('./log');

/** @type {dao} */
module.exports = datadb;

/**
 * @constructor
 */
function datadb() {}

/**
 * @const {string}
 */
datadb.DATA_COLLECTION = 'file';

/**
 * @const {string}
 */
datadb.PROGRESS_COLLECTION = 'uploadProgress';

/**
 * @type {string}
 */
datadb.USERNAME = 'anonymous';

/**
 * @typedef {{
 *   error: string
 * }}
 */
datadb.Error;

/**
 * Creates a connection to the mongodb.
 * @param {function(!mongodb.Db, Object=)} callback The callback function.
 */
datadb.createConnection = function(callback) {
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
 * @param {function(Object)} callback Callback function.
 */
datadb.insertFile = function(db, path, fileName, property, callback) {
  var collection = db.collection(datadb.DATA_COLLECTION);
  collection.insertOne({
    fileName: fileName,
    path: path,
    property: property,
    user: datadb.USERNAME
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
    }
    log.serverLog(result);
  });

  collection = db.collection(datadb.PROGRESS_COLLECTION);
  collection.insertOne({
    fileName: fileName,
    user: datadb.USERNAME,
    percentage: 0
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
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
 * @param {function(Object)} callback Callback function.
 */
datadb.updateProgress = function(db, fileName, percentage, callback) {
  var collection = db.collection(datadb.PROGRESS_COLLECTION);
  collection.updateOne({fileName: fileName},
    {$set: {percentage: percentage}}, function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err});
      }
      log.serverLog(result);
      callback({});
    });
};

/**
 * Gets data list from database.
 * @param {!mongodb.Db} db The database object.
 * @param {string} type The file type to list.
 * @return {!Array<!Object>}
 */
datadb.getList = function(db, type) {
  var collection = db.collection(datadb.DATA_COLLECTION);
  var cursor = collection.find({
    property: {type: type},
    username: datadb.USERNAME
  });
  var ret = [];
  cursor.toArray(function(err, docs) {
    if (docs.length) {
      docs.forEach(function(doc) {
        ret.push({
          fileName: doc.fileName,
          dataName: doc.property.dataName,
          description: doc.property.description
        });
      });
    }
  });
  return ret;
};

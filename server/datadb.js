/**
 * @fileoverview database access object.
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var assert = require('assert');
var mongoUrl = 'mongodb://localhost:27017/express';

var log = require('./log');

/** @type {dao} */
module.exports = dao;

/**
 * @constructor
 */
function dao() {}

/**
 * @const {string}
 */
dao.DATA_COLLECTION = 'file';

/**
 * @const {string}
 */
dao.PROGRESS_COLLECTION = 'uploadProgress';

/**
 * @type {string}
 */
dao.USERNAME = 'anonymous';

/**
 * @typedef {{
 *   error: string
 * }}
 */
dao.Error;

/**
 * Updates the database when uploading a file.
 * @param {string} path Path to the folder for the file.
 * @param {string} fileName File name of the file.
 * @param {!Object} property Properties of the file.
 */
dao.uploadFile = function(path, fileName, property) {
  MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err'', );
    log.serverLog('connected to MongoDB');
    dao.insertFile_(db, path, fileName, property, function() {
      db.close();
    });
  });
};

/**
 * Updates process progress in database when pre processing the data.
 * @param {string} fileName File name of the data.
 * @param {number} percentage Progress percentage of the process.
 */
dao.updateProgress = function(fileName, percentage) {
  MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err);
    log.serverLog('connect to MongoDB');
    log.serverLog(fileName, percentage);
    dao.updateProgress_(db, fileName, percentage, function() {
      db.close();
    });
  });
};

db.createConnection = function(callback) {
  MongoClient.connect(url, function(err, db) {
    callback(db);
  });
}

// end public functions

/**
 * Inserts a new file into database.
 * @param {!mongodb.Db} db The database.
 * @param {string} path Path to the folder of the file.
 * @param {string} fileName File name of the file.
 * @param {!Object} property Properties of the file.
 * @param {function(string)} callback Callback function.
 * @private
 */
dao.insertFile_ = function(db, path, fileName, property, callback) {
  var collection = db.collection(dao.DATA_COLLECTION);
  collection.insertOne({
    fileName: fileName,
    path: path,
    property: property,
    user: dao.USERNAME
  }, function(err, result) {
    assert.equal(null, err);
    log.serverLog(result);
  });

  collection = db.collection(dao.PROGRESS_COLLECTION);
  collection.insertOne({
    fileName: fileName,
    user: dao.USERNAME,
    percentage: 0
  }, function(err, result) {
    assert.equal(null, err);
    log.serverLog(result);
    callback(result);
  });
};

/**
 * Updates processing progress in database.
 * @param {!mongodb.Db} db The database.
 * @param {string} fileName File name of the file.
 * @param {number} percentage Processing progress percentage.
 * @param {function(string)} callback Callback function.
 * @private
 */
dao.updateProgress_ = function(db, fileName, percentage, callback) {
  var collection = db.collection(dao.PROGRESS_COLLECTION);
  log.serverLog(percentage);
  collection.updateOne({fileName: fileName},
    {$set: {percentage: percentage}}, function(err, result) {
      assert.equal(null, err);
      log.serverLog(result);
      callback(result);
    });
};

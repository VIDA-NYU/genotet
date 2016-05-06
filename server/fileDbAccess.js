/**
 * @fileoverview file database access object.
 */

var database = require('./database');
var log = require('./log');
var user = require('./user');

/** @type {fileDbAccess} */
module.exports = fileDbAccess;

/**
 * @constructor
 */
function fileDbAccess() {}

/**
 * @typedef {{
 *   error: string
 * }}
 */
fileDbAccess.Error;

/**
 * @typedef {{
 *   fileName: string,
 *   dataName: string,
 *   description: string,
 *   chrs: Array<string>
 * }}
 */
fileDbAccess.File;

/**
 * Inserts a new file into database.
 * @param {string} path Path to the folder of the file.
 * @param {string} fileName File name of the file.
 * @param {!Object} property Properties of the file.
 * @param {string} username The username.
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.insertFile = function(path, fileName, property, username,
                                   callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
  collection.deleteMany({
    fileName: fileName,
    user: username
    }, function(err) {
    if (err) {
      log.serverLog(err);
      callback({error: err.message});
      return;
    }
    collection.insertOne({
      fileName: fileName,
      path: path,
      property: property,
      user: username
    }, function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err.message});
        return;
      }
      log.serverLog(result);
      callback();
    });
  });
};

/**
 * Insert an entry for upload progress in database.
 * @param {string} fileName The file to insert.
 * @param {string} username The username.
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.insertProgress = function(fileName, username, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.PROGRESS);
  collection.insertOne({
    fileName: fileName,
    user: username,
    percentage: 0
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err.message});
      return;
    }
    log.serverLog(result);
    callback();
  });
};

/**
 * Updates processing progress in database.
 * @param {string} fileName File name of the file.
 * @param {number} percentage Processing progress percentage.
 * @param {string} username The username.
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.updateProgress = function(fileName, percentage, username,
                                       callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.PROGRESS);
  collection.updateOne(
    {fileName: fileName, user: username},
    {$set: {percentage: percentage}},
    function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err.message});
        return;
      }
      log.serverLog(result);
      callback();
    });
};

/**
 * Gets data list from database.
 * @param {string} type The file type to list.
 * @param {string} username The username.
 * @param {function((Array<!fileDbAccess.File>|fileDbAccess.Error))} callback
 */
fileDbAccess.getList = function(type, username, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
  var cursor = collection.find({
    user: username
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
 * @param {string} fileName The binding file name.
 * @param {!Array<string>} chrs The chromosomes to be inserted.
 * @param {string} username The username.
 * @param {function(fileDbAccess.Error=)} callback The callback function.
 */
fileDbAccess.insertBindingChrs = function(fileName, chrs, username, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
  collection.updateOne(
    {fileName: fileName, user: username},
    {$set: {chrs: chrs}},
    function(err, result) {
      if (err) {
        log.serverLog(err);
        callback({error: err});
        return;
      }
      log.serverLog(result);
      callback();
    });
};

/**
 * Gets the gene for binding files from database.
 * @param {string} fileName The file which the gene belongs to.
 * @param {function((string|fileDbAccess.Error))} callback The callback.
 */
fileDbAccess.getBindingGene = function(fileName, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
  var query = {fileName: fileName};
  database.getOne(collection, query, function(result) {
    if (!result) {
      log.serverLog('binding file not found', fileName);
      return;
    }
    callback(result.property.dataName);
  });
};

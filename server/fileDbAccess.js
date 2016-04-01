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
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.insertFile = function(path, fileName, property, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
  collection.insertOne({
    fileName: fileName,
    path: path,
    property: property,
    user: user.getUsername()
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
 * Insert an entry for upload progress in database.
 * @param {string} fileName The file to insert.
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.insertProgress = function(fileName, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.PROGRESS);
  collection.insertOne({
    fileName: fileName,
    user: user.getUsername(),
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
 * @param {function(fileDbAccess.Error=)} callback Callback function.
 */
fileDbAccess.updateProgress = function(fileName, percentage, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.PROGRESS);
  collection.updateOne(
    {fileName: fileName},
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
 * @param {function((Array<!fileDbAccess.File>|fileDbAccess.Error))} callback
 */
fileDbAccess.getList = function(type, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
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
 * @param {string} fileName The binding file name.
 * @param {!Array<string>} chrs The chromosomes to be inserted.
 * @param {function(fileDbAccess.Error=)} callback The callback function.
 */
fileDbAccess.insertBindingChrs = function(fileName, chrs, callback) {
  var db = database.db;
  var collection = db.collection(database.Collection.DATA);
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
  // TODO(jiaming): change it to getOne function.
  collection.find(
    {fileName: fileName, user: user.getUsername()}
  ).toArray(function(err, docs) {
    if (err) {
      callback({error: err.message});
      return;
    }
    if (docs.length) {
      callback(docs[0].property.dataName);
    }
  });
};

/**
 * @fileoverview database access object for data.
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/express';

var log = require('./log');

/** @type {dbData} */
module.exports = dbData;

/**
 * @constructor
 */
function dbData() {}

/**
 * @private @const {string}
 */
dbData.DATA_COLLECTION_ = 'file';

/**
 * @private @const {string}
 */
dbData.PROGRESS_COLLECTION_ = 'uploadProgress';

/**
 * @private @type {string}
 */
dbData.USERNAME_ = 'anonymous';

/**
 * @typedef {{
 *   error: string
 * }}
 */
dbData.Error;

/**
 * Creates a connection to the mongodb.
 * @param {function(!mongodb.Db, Object=)} callback The callback function.
 */
dbData.createConnection = function(callback) {
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
dbData.insertFile = function(db, path, fileName, property, callback) {
  var collection = db.collection(dbData.DATA_COLLECTION_);
  collection.insertOne({
    fileName: fileName,
    path: path,
    property: property,
    user: dbData.USERNAME_
  }, function(err, result) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
    }
    log.serverLog(result);
  });

  collection = db.collection(dbData.PROGRESS_COLLECTION_);
  collection.insertOne({
    fileName: fileName,
    user: dbData.USERNAME_,
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
dbData.updateProgress = function(db, fileName, percentage, callback) {
  var collection = db.collection(dbData.PROGRESS_COLLECTION_);
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
 * @param {function(*)} callback
 */
dbData.getList = function(db, type, callback) {
  var collection = db.collection(dbData.DATA_COLLECTION_);
  var cursor = collection.find({
    user: dbData.USERNAME_
  });
  var ret = [];
  cursor.toArray(function(err, docs) {
    if (err) {
      log.serverLog(err);
      callback({error: err});
    }
    log.serverLog(docs.length);
    if (docs.length) {
      docs.forEach(function(doc) {
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
    }
    callback(ret);
  });
};

/**
 * Inserts chromosomes to database for binding files.
 * @param {!mongodb.Db} db The database object.
 * @param {string} fileName The binding file name.
 * @param {!Array<string>} chrs The chromosomes to be inserted.
 * @param {function(*)} callback The callback function.
 */
dbData.insertBindingChrs = function(db, fileName, chrs, callback) {
  var collection = db.collection(dbData.DATA_COLLECTION_);
  collection.updateOne({
    fileName: fileName,
    user: dbData.USERNAME_
  }, {$set: {chrs: chrs}}, function(err, result) {
    log.serverLog(result);
  });
};

/**
 * Gets the gene for binding files from database.
 * @param {!mongodb.Db} db The database object.
 * @param {string} fileName The file which the gene belongs to.
 * @param {function(*)} callback The callback function.
 */
dbData.getBindingGene = function(db, fileName, callback) {
  var collection = db.collection(dbData.DATA_COLLECTION_);
  collection.find({
    fileName: fileName,
    user: dbData.USERNAME_
  }).toArray(function(err, docs) {
    if (err) {
      callback({error: err});
    }
    if (docs.length) {
      callback(docs[0].property.dataName);
    }
  });
};

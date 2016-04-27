/**
 * @fileoverview database access object for data.
 */

var log = require('./log.js');
var utils = require('./utils.js');

/** @type {database} */
module.exports = database;

/**
 * @constructor
 */
function database() {}

/**
 * Mongodb database for server.
 * @type {!mongodb.Db}
 */
database.db;

/** @enum {string} */
database.Collection = {
  DATA: 'file',
  PROGRESS: 'uploadProgress'
};

/**
 * @typedef {{
 *   error: string
 * }}
 */
database.Error;

/**
 * Fetches one entry from the database collection.
 * @param {!mongodb.Collection} collection Database collection.
 * @param {!mongodb.Query} query Database query.
 * @param {function(database.Error|!Object)} callback Callback function.
 */
database.getOne = function(collection, query, callback) {
  var cursor = collection.find(query);
  cursor.count(function(err, count) {
    if (err) {
      log.serverLog(err.message);
      callback({error: err.message});
      return;
    }
    if (count > 1) {
      var errMessage = 'getting ' + count + ' results in getOne';
      log.serverLog(errMessage);
      callback({error: errMessage});
      return;
    }
    // Each will be executed only once.
    cursor.each(function(err, doc) {
      if (err) {
        log.serverLog(err.message);
        callback({error: err.message});
        return;
      }
      if (doc !== null) {
        delete doc['_id'];
        callback(doc);
      }
    });
  });
};

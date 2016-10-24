/**
 * @fileoverview database access object for data.
 */

var log = require('./log.js');
var utils = require('./utils.js');
var assert = require('assert');

/** @type {database} */
module.exports = database;

/**
 * @constructor
 */
function database() {}

/**
 * Mongodb database for server.
 * @type {!mongodb.Db|undefined}
 */
database.db = undefined;

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
 * @param {function((Object|database.Error))} callback Callback function.
 */
database.getOne = function(collection, query, callback) {
  collection.find(query).limit(5).toArray(function(err, docs) {
    if (err) {
      log.serverLog(err.message);
      callback({error: err.message});
      return;
    }
    if (docs.length > 1) {
      var errMessage = 'getting (>=) ' + docs.length + ' results in getOne';
      log.serverLog(errMessage);
      callback({error: errMessage});
      return;
    } else if (docs.length == 0) {
      callback(null);
      return;
    }
    var doc = docs[0];
    delete doc['_id'];
    callback(doc);
  });
};

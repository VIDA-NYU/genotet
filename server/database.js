/**
 * @fileoverview database function handler
 */
var log = require('./log.js');

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

/**
 * Checks the user information for signing in.
 * @param {!mongodb.Collection} collection Database collection.
 * @param {!mongodb.Query} query Database query.
 * @param {!Array<!Object>} data Query result.
 * @param {function(!Object)} cursorCallback Callback function.
 */
database.getOne = function(collection, query, data, cursorCallback) {
  var cursor = collection.find(query);
  cursor.count(function(err, count) {
    if (err) {
      log.serverLog(err.message);
      return;
    }
    if (count > 1) {
      log.serverLog('getting ' + count +
        ' results while expecting one in getOne');
      return;
    }
    cursor.each(function(err, doc) {
      if (err) {
        log.serverLog(err.message);
        return;
      }
      if (doc != null) {
        delete doc['_id'];
        data.push(doc);
      } else {
        cursorCallback(data[0]);
      }
    });
  });
};

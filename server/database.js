/**
 * @fileoverview database function handler
 */
var assert = require('assert');

var log = require('./log.js');

/** @type {database} */
module.exports = database;

/**
 * @constructor
 */
function database() {}

/**
 * Checks the user information for signing in.
 * @param {!Object} collection Database collection.
 * @param {!Object} query Database query.
 * @param {!Array<!Object>} data User Information.
 * @param {function(!Object)} cursorCallback Callback function.
 */
database.getOne = function(collection, query, data, cursorCallback) {
  var cursor = collection.find(query);
  cursor.count(function(err, count) {
    if (err) {
      log.serverLog(err);
      return;
    }
    if (count > 1) {
      log.serverLog('multiple results');
      return;
    }
    console.log(count);
    cursor.each(function(err, doc) {
      assert.equal(err, null, err);
      if (doc != null) {
        data.push(doc);
      } else {
        cursorCallback(data);
      }
    });
  });
};

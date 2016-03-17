/**
 * @fileoverview Node.js mongodb externs.
 */

/**
 * @constructor
 * @return {!mongodb}
 */
function mongodb() {}

/** @type {!Object} */
mongodb.MongoClient;

/**
 * @param {string} url
 * @param {function()} callback
 */
mongodb.MongoClient.connect = function(url, callback) {};

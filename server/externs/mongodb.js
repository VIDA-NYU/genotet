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

/**
 * @constructor
 * @return {!mongodb.Db}
 */
mongodb.Db = function() {};

/**
 * @param {string} dbName Name of database.
 */
mongodb.Db.prototype.collection = function(dbName) {};

/**
 * @param {Object=} query
 * @param {Object=} projection
 */
mongodb.Db.prototype.collection.find = function(query, projection) {};

/**
 * @param {Object} document
 * @param {Object=} writeConcern
 */
mongodb.Db.prototype.collection.insertOne = function(document, writeConcern) {};

/**
 * @param {Object} query
 * @param {Object} update
 * @param {boolean=} upsert
 * @param {boolean=} multi
 * @param {Object=} writeConcern
 */
mongodb.Db.prototype.collection.update = function(query, update, upsert, multi, writeConcern) {};

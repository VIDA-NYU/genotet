/**
 * @fileoverview Node.js mongodb externs.
 */

/** @const */
var mongodb = {};

/**
 * @constructor
 * @return {!mongodb.Cursor}
 */
mongodb.Cursor = function() {};

/** @const */
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
 * @return {!mongodb.Cursor}
 */
mongodb.Db.prototype.collection.find = function(query, projection) {};

/**
 * @param {!Object} document
 * @param {Object=} writeConcern
 */
mongodb.Db.prototype.collection.insertOne = function(document, writeConcern) {};

/**
 * @param {!Object} query
 * @param {!Object} update
 * @param {boolean=} upsert
 * @param {boolean=} multi
 * @param {Object=} writeConcern
 */
mongodb.Db.prototype.collection.update = function(query, update, upsert, multi, writeConcern) {};

/**
 * @param {function()} callback
 */
mongodb.Cursor.prototype.each = function(callback) {};
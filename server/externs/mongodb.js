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
 * @constructor
 * @return {!mongodb.Collection}
 */
mongodb.Collection = function() {};

/**
 * @constructor
 * @return {!mongodb.Projection}
 */
mongodb.Projection = function() {};

/**
 * @typedef {{
 *   name: string,
 *   message: string
 * }}
 */
mongodb.Error;

/**
 * @typedef {!Object}
 */
mongodb.Query;

/**
 * @typedef {!Object}
 */
mongodb.Doc;

/**
 * @param {string} dbName Name of database.
 * @return {!mongodb.Collection}
 */
mongodb.Db.prototype.collection = function(dbName) {};

/**
 * @param {!mongodb.Query} query
 * @param {mongodb.Projection=} projection
 * @return {!mongodb.Cursor}
 */
mongodb.Collection.prototype.find = function(query, projection) {};

/**
 * @param {!Object} document
 * @param {Object=} writeConcern
 */
mongodb.Collection.prototype.insertOne = function(document, writeConcern) {};

/**
 * @param {!Object} document
 * @param {Object=} writeConcern
 */
mongodb.Collection.prototype.deleteMany = function(document, writeConcern) {};

/**
 * @param {!mongodb.Query} query
 * @param {!Object} update
 * @param {Object<{
 *   upsert: boolean
 * }>} upsert
 * @param {boolean=} multi
 * @param {Object=} writeConcern
 */
mongodb.Collection.prototype.update = function(query, update, upsert, multi, writeConcern) {};

/**
 * @param {!Object} filter
 * @param {!Object} update
 * @param {Object=} writeConcern
 */
mongodb.Collection.prototype.updateOne = function(filter, update, writeConcern) {};

/**
 * @param {function(!mongodb.Error, !mongodb.Doc)} callback
 */
mongodb.Cursor.prototype.each = function(callback) {};

/**
 * @param {function(!mongodb.Error, number)} callback
 */
mongodb.Cursor.prototype.count = function(callback) {};

/**
 * @param {function(!mongodb.Error, !mongodb.Doc)} callback
 */
mongodb.Cursor.prototype.toArray = function(callback) {};

/**
 * @param {number} arg
 * @return {!mongodb.Cursor}
 */
mongodb.Cursor.prototype.limit = function(arg) {};

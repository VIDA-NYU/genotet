/**
 * @fileoverview Server handler for mapping data.
 */

var fs = require('fs');

var log = require('./log');
var database = require('./database');

/** @type {mapping} */
module.exports = mapping;

/**
 * @constructor
 */
function mapping() {}

/** @enum {string} */
mapping.QueryType = {
  MAPPING: 'mapping',
  LIST_MAPPING: 'list-mapping'
};

/**
 * @typedef {{
 *   error: string
 * }}
 */
mapping.Error;

/** @const */
mapping.query = {};

/**
 * Lists all the mapping files.
 * @param {!mongodb.Db} db The database object.
 * @param {function(Array<string>)} callback The callback function.
 */
mapping.query.list = function(db, callback) {
  database.getList(db, 'mapping', function(data) {
    var ret = data.map(function(mappingFile) {
      return mappingFile.fileName;
    });
    callback(ret);
  });
};

/**
 * @param {*|{
 *   fileName: string
 * }} query
 * @param {string} dataPath
 * @return {!Object<string>|mapping.Error}
 */
mapping.query.getMapping = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  var mappingPath = dataPath + 'anonymous/' + mapping.MAPPING_PREFIX_;
  return mapping.getMapping_(mappingPath + query.fileName);
};

// End Public APIs

/**
 * Path after data path
 * @private @const {string}
 */
mapping.MAPPING_PREFIX_ = 'mapping/';

/**
 * Gets mapping rules.
 * @param {string} filePath Path to the mapping file.
 * @return {!Object<string>}
 * @private
 */
mapping.getMapping_ = function(filePath) {
  log.serverLog('get mapping', filePath);
  var mappingRules = {};
  var content = fs.readFileSync(filePath, 'utf-8').toString()
    .split('\n');
  content.forEach(function(line) {
    var entry = line.split(/[\t\s]+/);
    var gene = entry[0];
    var bindingFile = entry[1];
    mappingRules[gene.toLowerCase()] = bindingFile;
  });
  return mappingRules;
};

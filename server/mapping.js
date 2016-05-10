/**
 * @fileoverview Server handler for mapping data.
 */

var fs = require('fs');

var log = require('./log');
var fileDbAccess = require('./fileDbAccess');
var user = require('./user');
var utils = require('./utils');

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
 * @param {*|{
 *   username: string
 * }} query
 * @param {function(Array<string>)} callback The callback function.
 */
mapping.query.list = function(query, callback) {
  fileDbAccess.getList('mapping', query.username, function(data) {
    var ret = data.map(function(mappingFile) {
      return mappingFile.fileName;
    });
    callback(ret);
  });
};

/**
 * @param {*|{
 *   username: string,
 *   fileName: string
 * }} query
 * @param {string} dataPath
 * @return {!Object<string>|mapping.Error}
 */
mapping.query.getMapping = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  var file = mapping.checkFile_(query, dataPath);
  if (file.error) {
    return {error: file.error};
  }
  return mapping.getMapping_(file.path);
};

// End Public APIs

/**
 * Path after data path
 * @private @const {string}
 */
mapping.PATH_PREFIX_ = 'mapping/';

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

/**
 * Checks if the mapping file exists and if not returns error.
 * @param {{
 *   fileName: string,
 *   username: string,
 *   shared: string
 * }|*} query
 * @param {string} dataPath
 * @return {{path: string}|mapping.Error}
 * @private
 */
mapping.checkFile_ = function(query, dataPath) {
  var file = utils.getFilePath({
    dataPath: dataPath,
    typePrefix: mapping.PATH_PREFIX_,
    fileName: query.fileName,
    username: query.username,
    shared: query.shared
  });
  if (!file.exists) {
    var error = 'mapping file not found: ' + file.path;
    log.serverLog(error);
    return {error: error};
  }
  return {path: file.path};
};

/**
 * @fileoverview Server handler for mapping data.
 */

var fs = require('fs');

var log = require('./log');

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
 * @param {string} mappingPath Path to the mapping file folder.
 * @return {?Array<string>}
 */
mapping.query.list = function(mappingPath) {
  var files = fs.readdirSync(mappingPath);
  var mappingFiles = [];
  files.forEach(function(file) {
    if (file.lastIndexOf('.data') > 0 &&
      file.lastIndexOf('.data') == file.length - 5) {
      var fileName = file.replace(/\.data$/, '');
      mappingFiles.push(fileName);
    }
  });
  return mappingFiles;
};

/**
 * @param {*|{
 *   fileName: string
 * }} query
 * @param {string} mappingPath
 * @return {!Object<string>|mapping.Error}
 */
mapping.query.getMapping = function(query, mappingPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  return mapping.getMapping_(mappingPath + query.fileName + '.data');
};

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

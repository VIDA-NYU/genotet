/**
 * @fileoverview Server handler for mapping data.
 */

var fs = require('fs');

/** @type {mapping} */
module.exports = mapping;

/**
 * @constructor
 */
function mapping() {}

/** @const */
mapping.query = {};

/**
 * @typedef {{
 *   fileName: string
 * }}
 */
mapping.query.GetMapping;

/**
 * Lists all the mapping files.
 * @param {string} mappingPath Path to the mapping file folder.
 * @return {{
 *   fileList: ?Array<string>
 * }}
 */
mapping.query.list = function(mappingPath) {
  return {
    fileList: fs.readdirSync(mappingPath)
  };
};

/**
 * @param {!mapping.query.GetMapping} query
 * @param {string} mappingPath
 * @return {{mappingName: !Object<string>}}
 */
mapping.query.getMapping = function(query, mappingPath) {
  return mapping.getMapping_(mappingPath + query.fileName);
};

/**
 * Gets mapping rules.
 * @param {string} filePath Path to the mapping file.
 * @return {{mappingName: !Object<string>}}
 * @private
 */
mapping.getMapping_ = function(filePath) {
  var mappingName = {};
  var content = fs.readFileSync(filePath, 'utf-8').toString()
    .split('\n');
  content.forEach(function(line) {
    var entry = line.split(' ');
    var gene = entry[0];
    var bindingFile = entry[1];
    mappingName[gene] = bindingFile;
  });
  return {
    mappingName: mappingName
  };
};

/**
 * @fileoverview Server handler for expression matrix.
 */

var utils = require('./utils');
var fs = require('fs');

/** @type {expression} */
module.exports = expression;

/**
 * @constructor
 */
function expression() {}

/**
 * @typedef {{
 *   numrows: number,
 *   numcols: number,
 *   rownames: !Array<string>,
 *   colnames: !Array<string>,
 *   values: !Array<number>
 * }}
 */
expression.RawMatrix;

/**
 * @typedef {{
 *   allGeneNames: !Object<string>,
 *   allConditionNames: !Object<string>,
 *   allValueMin: number,
 *   allValueMax: number
 * }}
 */
expression.MatrixInfo;

/**
 * @typedef {{
 *   values: !Array<!Array<number>>,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
expression.Matrix;

/**
 * @typedef {{
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   tfaValues: !Array<{
 *     index: number,
 *     value: number
 *   }>,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
expression.TfaProfile;

/** @const */
expression.query = {};

/**
 * @typedef {{
 *   fileName: string
 * }}
 */
expression.query.MatrixInfo;

/**
 * @typedef {{
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>
 * }}
 */
expression.query.Matrix;

/**
 * @typedef {{
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>
 * }}
 */
expression.query.TfaProfile;

// Start public APIs
/**
 * @param {!expression.query.MatrixInfo} query
 * @param {string} expressionPath
 * @return {expression.MatrixInfo}
 */
expression.query.matrixInfo = function(query, expressionPath) {
  var file = expressionPath + query.fileName;
  return expression.getMatrixInfo_(file);
};

/**
 * @param {!expression.query.Matrix} query
 * @param {string} expressionPath
 * @return {?expression.Matrix}
 */
expression.query.matrix = function(query, expressionPath) {
  var file = expressionPath + query.fileName;
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  return expression.readExpression_(file, geneNames, conditionNames);
};

/**
 * @param {!expression.query.TfaProfile} query
 * @return {?expression.TfaProfile}
 * @param {string} expressionPath
 */
expression.query.tfaProfile = function(query, expressionPath) {
  var file = expressionPath + query.fileName;
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  return expression.getTfaProfile_(file, geneNames, conditionNames);
};

/**
 * @param {string} expressionPath
 * @return {!Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>}
 */
expression.query.list = function(expressionPath) {
  return expression.listMatrix_(expressionPath);
};
// End public APIs

/**
 * Gets the expression matrix profile of given genes and conditions.
 * @param {string} fileName TFA file name.
 * @param {!Array<string>} geneNames Names of the expression matrix.
 * @param {!Array<string>} conditionNames Names of the expression matrix.
 * @return {?expression.TfaProfile} Gene expression profile as a JS object.
 * @private
 */
expression.getTfaProfile_ = function(fileName, geneNames, conditionNames) {
  // TFA profile has the same format as an expression matrix.
  var result = expression.readExpression_(fileName, geneNames, conditionNames);
  var allTfaValues = [];
  var valueMin = Infinity;
  var valueMax = -Infinity;
  geneNames.forEach(function(geneName, i) {
    var tfaValues = [];
    conditionNames.forEach(function(conditionName, j) {
      var tfaValue = result.values[i][j];
      if (tfaValue) {
        tfaValues.push({
          value: tfaValue,
          index: j
        });
        valueMin = Math.min(valueMin, tfaValue);
        valueMax = Math.max(valueMax, tfaValue);
      }
    });
    tfaValues.sort(function(a, b) {
      return a.index - b.index;
    });
    allTfaValues.push(tfaValues);
  });
  console.log('returning TFA line', geneNames.join(','));
  return {
    geneNames: geneNames,
    conditionNames: conditionNames,
    tfaValues: allTfaValues,
    valueMin: valueMin,
    valueMax: valueMax
  };
};

/**
 * Lists all the expression matrix files in the server
 * @param {string} expressionPath Folder of the expression matrix file in the
 *     server.
 * @return {!Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>} array of object of each expression matrix file
 * @private
 */
expression.listMatrix_ = function(expressionPath) {
  var folder = expressionPath;
  var ret = [];
  var files = fs.readdirSync(folder);
  files.forEach(function(file) {
    if (file.indexOf('.txt') != -1) {
      var fname = file.substr(0, file.length - 4);
      var content = fs.readFileSync(folder + file, 'utf8')
        .toString().split('\n');
      var matrixName = content[0];
      var description = content.slice(1).join('');
      ret.push({
        matrixName: matrixName,
        fileName: fname,
        description: description
      });
    }
  });
  return ret;
};

/**
 * Reads expression matrix from text file.
 * @param {string} expressionFile Path to the expression file.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for condition selection.
 * @return {expression.Matrix}
 * @private
 */
expression.readExpression_ = function(expressionFile, geneNames,
                                      conditionNames) {
  var values = [];
  var isFirstRow = true;
  var conditions = [];
  var allGeneNames = {};
  var allConditionNames = {};
  var valueMax = -Infinity;
  var valueMin = Infinity;

  var lines = fs.readFileSync(expressionFile).toString().split('\n');
  lines.forEach(function(line, lineIndex) {
    var parts = line.split(/[\t\s]+/);
    if (parts.length == 0) {
      return;
    }
    if (isFirstRow) {
      // first row contains the conditions
      isFirstRow = false;
      for (var i = 1; i < parts.length; i++) {
        allConditionNames[parts[i]] = i;
      }
      conditionNames.forEach(function(conditionName) {
        var conditionIndex = allConditionNames[conditionName];
        if (conditionName in allConditionNames) {
          conditions.push(conditionIndex);
        }
      });
    } else {
      // other rows contain a gene, and values
      allGeneNames[parts[0]] = lineIndex;
    }
  });
  geneNames.forEach(function(geneName) {
    var geneIndex = allGeneNames[geneName];
    if (geneName in allGeneNames) {
      var parts = lines[geneIndex].split(/[\t\s]+/);
      var tmpLine = [];
      conditions.forEach(function(conditionIndex) {
        var value = parseFloat(parts[conditionIndex]);
        valueMin = Math.min(valueMin, value);
        valueMax = Math.max(valueMax, value);
        tmpLine.push(value);
      });
      values.push(tmpLine);
    }
  });
  console.log('returning tfa line', geneNames.join(','));
  return {
    values: values,
    geneNames: geneNames,
    conditionNames: conditionNames,
    valueMin: valueMin,
    valueMax: valueMax
  };
};

/**
 * Reads all of the expression matrix data from text file.
 * @param {string} expressionFile Path to the expression file.
 * @return {!expression.MatrixInfo}
 * @private
 */
expression.getMatrixInfo_ = function(expressionFile) {
  var isFirstRow = true;
  var allGeneNames = {};
  var allConditionNames = {};
  var allValueMax = -Infinity;
  var allValueMin = Infinity;

  var lines = fs.readFileSync(expressionFile).toString().split('\n');
  lines.forEach(function(line, lineIndex) {
    var parts = line.split('\t');
    if (isFirstRow) {
      // first row contains the conditions
      isFirstRow = false;
      for (var i = 1; i < parts.length; i++) {
        allConditionNames[parts[i]] = i - 1;
      }
    } else {
      // other rows contain a gene, and values
      allGeneNames[parts[0]] = lineIndex - 1;
      for (var i = 1; i < parts.length; i++) {
        var value = parseFloat(parts[i]);
        allValueMin = Math.min(allValueMin, value);
        allValueMax = Math.max(allValueMax, value);
      }
    }
  });
  return {
    allGeneNames: allGeneNames,
    allConditionNames: allConditionNames,
    allValueMin: allValueMin,
    allValueMax: allValueMax
  };
};

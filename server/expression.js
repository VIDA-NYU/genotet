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

/** @enum {string} */
expression.QueryType = {
  EXPRESSION: 'expression',
  EXPRESSION_INFO: 'expression-info',
  PROFILE: 'profile',
  TFA_PROFILE: 'tfa-profile',
  LIST_EXPRESSION: 'list-expression'
};

/**
 * @typedef {{
 *   allGeneNames: !Object<{
 *     index: number,
 *     rawName: string
 *   }>,
 *   allConditionNames: !Object<{
 *     index: number,
 *     rawName: string
 *   }>,
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
 *   error: string
 * }}
 */
expression.Error;

/**
 * @typedef {{
 *   values: !Array<!Array<number>>,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
expression.Profile;

/**
 * @typedef {{
 *   tfaValues: !Array<{
 *     index: number,
 *     value: number
 *   }>,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
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
expression.query.Profile;

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
 * @param {expression.query.MatrixInfo} query
 * @param {string} expressionPath
 * @return {expression.MatrixInfo|expression.Error}
 */
expression.query.matrixInfo = function(query, expressionPath) {
  var file = expressionPath + query.fileName + '.data';
  if (!fs.existsSync(file)) {
    return {
      error: 'expression file not found.'
    };
  }
  return expression.getMatrixInfo_(file);
};

/**
 * @param {expression.query.Matrix} query
 * @param {string} expressionPath
 * @return {?expression.Matrix|expression.Error}
 */
expression.query.matrix = function(query, expressionPath) {
  var file = expressionPath + query.fileName + '.data';
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  if (!fs.existsSync(file)) {
    return {
      error: 'expression file not found.'
    };
  }
  return expression.readMatrix_(file, geneNames, conditionNames);
};

/**
 * @param {expression.query.Profile} query
 * @param {string} expressionPath
 * @return {?expression.Profile|expression.Error}
 */
expression.query.profile = function(query, expressionPath) {
  var file = expressionPath + query.fileName;
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  if (!fs.existsSync(file)) {
    return {
      error: 'expression file not found.'
    };
  }
  return expression.readMatrix_(file, geneNames, conditionNames);
};

/**
 * @param {expression.query.TfaProfile} query
 * @param {string} expressionPath
 * @return {?expression.TfaProfile|expression.Error}
 */
expression.query.tfaProfile = function(query, expressionPath) {
  var file = expressionPath + query.fileName + '.data';
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  if (!fs.existsSync(file)) {
    return {
      error: 'TFA matrix file not found.'
    };
  }
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
 * @param {!Array<string>} geneNames Names of the selected genes.
 * @param {!Array<string>} conditionNames Names of the selected conditions.
 * @return {?expression.TfaProfile} Gene expression profile as a JS object.
 * @private
 */
expression.getTfaProfile_ = function(fileName, geneNames, conditionNames) {
  // TFA profile has the same format as an expression matrix.
  // With null geneNames and conditionNames input, returns the whole matrix.
  var result = expression.readMatrix_(fileName, null, null);
  var allTfaValues = [];
  var valueMin = Infinity;
  var valueMax = -Infinity;
  var allGeneNames = {};
  var allConditionNames = {};

  result.geneNames.forEach(function(gene, index) {
    allGeneNames[gene] = index;
  });
  result.conditionNames.forEach(function(condition, index) {
    allConditionNames[condition] = index;
  });
  geneNames.forEach(function(geneName) {
    if (geneName in allGeneNames) {
      var rowNum = allGeneNames[geneName];
      var tfaValues = [];
      conditionNames.forEach(function(conditionName, i) {
        if (conditionName in allConditionNames) {
          var colNum = allConditionNames[conditionName];
          var tfaValue = result.values[rowNum][colNum];
          if (tfaValue) {
            tfaValues.push({
              value: tfaValue,
              index: i
            });
            valueMin = Math.min(valueMin, tfaValue);
            valueMax = Math.max(valueMax, tfaValue);
          }
        }
      });
      tfaValues.sort(function(a, b) {
        return a.index - b.index;
      });
      allTfaValues.push(tfaValues);
    }
  });
  console.log('returning TFA line', geneNames.join(','));
  return {
    tfaValues: allTfaValues,
    geneNames: geneNames,
    conditionNames: conditionNames,
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
    if (file.lastIndexOf('.data') > 0 &&
      file.lastIndexOf('.data') == file.length - 5) {
      var fileName = file.replace(/\.data$/, '');
      var matrixName = '';
      var description = '';
      var descriptionFile = folder + fileName + '.desc';
      if (fs.existsSync(descriptionFile)) {
        var content = fs.readFileSync(descriptionFile, 'utf8')
          .toString().split('\n');
        matrixName = content[0];
        description = content.slice(1).join('');
      }
      ret.push({
        matrixName: matrixName,
        fileName: fileName,
        description: description
      });
    }
  });
  return ret;
};

/**
 * Reads matrix from text file, returns the whole matrix when input genes and
 * conditions are null.
 * @param {string} fileName Path to the matrix file.
 * @param {Array<string>} inputGenes Names for gene selection.
 * @param {Array<string>} inputConditions Names for condition selection.
 * @return {!expression.Matrix}
 * @private
 */
expression.readMatrix_ = function(fileName, inputGenes,
                                      inputConditions) {
  var values = [];
  var isFirstRow = true;
  var conditions = [];
  var allGeneNames = {};
  var allConditionNames = {};
  var valueMax = -Infinity;
  var valueMin = Infinity;
  var geneNames = [];
  var conditionNames = [];

  var lines = fs.readFileSync(fileName).toString().split('\n');
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
      if (!inputConditions) {
        for (var i = 1; i < parts.length; i++) {
          conditionNames.push(parts[i]);
        }
      } else {
        inputConditions.forEach(function(condition) {
          conditionNames.push(condition);
        });
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
  if (!inputGenes) {
    for (var gene in allGeneNames) {
      geneNames.push(gene);
    }
  } else {
    inputGenes.forEach(function(gene) {
      geneNames.push(gene);
    });
  }
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
    var parts = line.split(/[\t\s]+/);
    if (isFirstRow) {
      // first row contains the conditions
      isFirstRow = false;
      for (var i = 1; i < parts.length; i++) {
        allConditionNames[parts[i].toLowerCase()] = {
          index: i - 1,
          rawName: parts[i]
        };
      }
    } else {
      // other rows contain a gene, and values
      allGeneNames[parts[0].toLowerCase()] = {
        index: lineIndex - 1,
        rawName: parts[0]
      };
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

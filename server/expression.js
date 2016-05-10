/**
 * @fileoverview Server handler for expression matrix.
 */

var fs = require('fs');

var log = require('./log');
var fileDbAccess = require('./fileDbAccess');
var utils = require('./utils');

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

// Start public APIs
/**
 * @param {*|{
 *   fileName: string,
 *   username: string,
 *   shared: string
 * }} query
 * @param {string} dataPath
 * @return {expression.MatrixInfo|expression.Error}
 */
expression.query.matrixInfo = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  var file = expression.checkFile_(query, dataPath);
  if (file.error) {
    return {error: file.error};
  }
  return expression.getMatrixInfo_(file.path);
};

/**
 * @param {*|{
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   username: string
 * }} query
 * @param {string} dataPath
 * @return {expression.Matrix|expression.Error}
 */
expression.query.matrix = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  if (query.geneNames === undefined) {
    return {error: 'geneNames is undefined'};
  }
  if (query.conditionNames === undefined) {
    return {error: 'conditionNames is undefined'};
  }
  var file = expression.checkFile_(query, dataPath);
  if (file.error) {
    return {error: file.error};
  }
  return expression.readMatrix_(file.path, query.geneNames,
    query.conditionNames);
};

/**
 * @param {*|{
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   username: string
 * }} query
 * @param {string} dataPath
 * @return {expression.Profile|expression.Error}
 */
expression.query.profile = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  if (query.geneNames === undefined) {
    return {error: 'geneNames is undefined'};
  }
  if (query.conditionNames === undefined) {
    return {error: 'conditionNames is undefined'};
  }
  var file = expression.checkFile_(query, dataPath);
  if (file.error) {
    return {error: file.error};
  }
  return expression.readMatrix_(file.path, query.geneNames,
    query.conditionNames);
};

/**
 * @param {*|{
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   username: string
 * }} query
 * @param {string} dataPath
 * @return {expression.TfaProfile|expression.Error}
 */
expression.query.tfaProfile = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  if (query.geneNames === undefined) {
    return {error: 'geneNames is undefined'};
  }
  if (query.conditionNames === undefined) {
    return {error: 'conditionNames is undefined'};
  }
  var file = expression.checkFile_(query, dataPath);
  if (file.error) {
    return {error: file.error};
  }
  return expression.getTfaProfile_(file.path, query.geneNames,
    query.conditionNames);
};

/**
 * @param {*|{
 *   username: string
 * }} query
 * @param {function(Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>)} callback The callback function.
 */
expression.query.list = function(query, callback) {
  expression.listMatrix_(query.username, function(data) {
    callback(data);
  });
};
// End public APIs

/**
 * Path after data path for expression files.
 * @private @const {string}
 */
expression.PATH_PREFIX_ = 'expression/';

/**
 * Gets the expression matrix profile of given genes and conditions.
 * @param {string} fileName TFA file name.
 * @param {!Array<string>} geneNames Names of the selected genes.
 * @param {!Array<string>} conditionNames Names of the selected conditions.
 * @return {expression.TfaProfile} Gene expression profile as a JS object.
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
    allGeneNames[gene.toLowerCase()] = {
      index: index,
      rawName: gene
    };
  });
  result.conditionNames.forEach(function(condition, index) {
    allConditionNames[condition.toLowerCase()] = {
      index: index,
      rawName: condition
    };
  });
  geneNames.forEach(function(geneName) {
    if (geneName.toLowerCase() in allGeneNames) {
      var rowNum = allGeneNames[geneName.toLowerCase()].index;
      var tfaValues = [];
      conditionNames.forEach(function(conditionName, i) {
        if (conditionName.toLowerCase() in allConditionNames) {
          var colNum = allConditionNames[conditionName.toLowerCase()].index;
          var tfaValue = result.values[rowNum][colNum];
          if (!tfaValue) {
            return;
          }
          tfaValues.push({
            value: tfaValue,
            index: i
          });
          valueMin = Math.min(valueMin, tfaValue);
          valueMax = Math.max(valueMax, tfaValue);
        }
      });
      tfaValues.sort(function(a, b) {
        return a.index - b.index;
      });
      allTfaValues.push(tfaValues);
    }
  });
  log.serverLog('returning TFA line', geneNames.join(','));
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
 * @param {string} username The username.
 * @param {function(!Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>)} callback The callback function.
 * @private
 */
expression.listMatrix_ = function(username, callback) {
  fileDbAccess.getList('expression', username, function(data) {
    var ret = data.map(function(matrixFile) {
      return {
        matrixName: matrixFile.dataName,
        fileName: matrixFile.fileName,
        description: matrixFile.description
      };
    });
    callback(ret);
  });
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
        allConditionNames[parts[i].toLowerCase()] = {
          index: i,
          rawName: parts[i]
        };
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
        var conditionIndex = allConditionNames[conditionName.toLowerCase()]
          .index;
        if (conditionName.toLowerCase() in allConditionNames) {
          conditions.push(conditionIndex);
        }
      });
    } else {
      // other rows contain a gene, and values
      allGeneNames[parts[0].toLowerCase()] = {
        index: lineIndex,
        rawName: parts[0]
      };
    }
  });
  if (!inputGenes) {
    for (var gene in allGeneNames) {
      geneNames.push(allGeneNames[gene].rawName);
    }
  } else {
    inputGenes.forEach(function(gene) {
      geneNames.push(gene);
    });
  }
  geneNames.forEach(function(geneName) {
    var geneIndex = allGeneNames[geneName.toLowerCase()].index;
    if (geneName.toLowerCase() in allGeneNames) {
      var parts = lines[geneIndex].split(/[\t\s]+/);
      var tmpLine = [];
      conditions.forEach(function(conditionIndex) {
        var value = parseFloat(parts[conditionIndex]);
        if (!value) {
          return;
        }
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
        if (!value) {
          continue;
        }
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

/**
 * Checks if the expression file exists and if not returns error.
 * @param {{
 *   fileName: string,
 *   username: string,
 *   shared: string
 * }|*} query
 * @param {string} dataPath
 * @return {{path: string}|expression.Error}
 * @private
 */
expression.checkFile_ = function(query, dataPath) {
  var file = utils.getFilePath({
    dataPath: dataPath,
    typePrefix: expression.PATH_PREFIX_,
    fileName: query.fileName,
    username: query.username,
    shared: query.shared
  });
  if (!file.exists) {
    var error = 'expression file not found: ' + file.path;
    log.serverLog(error);
    return {error: error};
  }
  return {path: file.path};
};

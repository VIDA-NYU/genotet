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
 *   values: !Array<!Array<number>>
 * }}
 */
expression.RawMatrix;

/**
 * @typedef {{
 *   allGeneNames: !Object<string>,
 *   allConditionNames: !Array<string>,
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
expression.Profile;

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
 * @param {!expression.query.Profile} query
 * @param {!Object<string>} expressionFile
 * @param {!Object<string>} tfamatFile
 * @return {?expression.Profile}
 */
expression.query.profile = function(query, expressionFile, tfamatFile) {
  var matrix = query.fileName;
  var geneNames = query.geneNames;
  var conditionNames = query.conditionNames;
  var fileExp = expressionFile[matrix], fileTfa = tfamatFile[matrix];
  return expression.getProfile_(fileExp, fileTfa, geneNames, conditionNames);
};

/**
 * @param {string} expressionPath
 * @return {!Array<{
 *   matrixName: string,
 *   description: string
 * }>}
 */
expression.query.list = function(expressionPath) {
  return expression.listMatrix_(expressionPath);
};
// End public APIs



/**
 * Reads the expression matrix data from the buffer.
 * @param {!Buffer} buf File buffer of the expression matrix data.
 * @return {!Object} Expression matrix data as a JS object.
 * @private
 */
expression.readExpmat_ = function(buf) {
  var result = {};
  var offset = 0;
  var n = buf.readInt32LE(0);
  var m = buf.readInt32LE(4);
  var lrows = buf.readInt32LE(8);
  var lcols = buf.readInt32LE(12);
  offset += 16;
  var rowstr = buf.toString('utf8', offset, offset + lrows); offset += lrows;
  var colstr = buf.toString('utf8', offset, offset + lcols); offset += lcols;
  result.numrows = n;
  result.numcols = m;
  result.rownames = rowstr.split(' ');
  result.colnames = colstr.split(' ');
  result.values = [];
  result.min = 1E10; result.max = -1E10;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < m; j++) {
      var val = buf.readDoubleLE(offset);
      offset += 8;
      result.values.push(val);
      result.min = Math.min(result.min, val);
      result.max = Math.max(result.max, val);
    }
  }
  return result;
};

/**
 * Reads the TFA matrix data from the given buffer.
 * @param {!Buffer} buf Buffer of the TFA matrix data file.
 * @return {!expression.RawMatrix} The TFA matrix data as a JS object.
 * @private
 */
expression.readTFAmat_ = function(buf) {
  var result = {};
  var offset = 0;
  var n = buf.readInt32LE(0);
  var m = buf.readInt32LE(4);
  var lrows = buf.readInt32LE(8);
  var lcols = buf.readInt32LE(12);
  offset += 16;
  var rowstr = buf.toString('utf8', offset, offset + lrows); offset += lrows;
  var colstr = buf.toString('utf8', offset, offset + lcols); offset += lcols;
  result.numrows = n;
  result.numcols = m;
  result.rownames = rowstr.split(' ');
  result.colnames = colstr.split(' ');
  result.values = [];
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < m; j++) {
      var val = buf.readDoubleLE(offset);
      offset += 8;
      result.values.push(val);
    }
  }
  return result;
};

/**
 * Reads the TFA matrix profile of a given gene.
 * @param {string} file TFA matrix file name.
 * @param {string} name Name of the gene to be profiled.
 * @return {?{name: string, values: !Array<number>}}
 *     TFA profile of the given gene.
 * @private
 */
expression.getTFAmatLine_ = function(file, name) {
  //var file = tfamatFile[mat];
  var buf = utils.readFileToBuf(file);
  if (buf == null) {
    console.error('cannot read file', file);
    return null;
  }
  var result = expression.readTFAmat_(/** @type {!Buffer} */(buf));
  name = name.toLowerCase();
  for (var i = 0; i < result.rownames.length; i++) {
    if (result.rownames[i].toLowerCase() == name) {
      name = result.rownames[i];
      break;
    }
  }
  var values = [];
  for (var j = 0; j < result.numcols; j++) {
    values.push(result.values[i * result.numcols + j]);
  }
  console.log('returning tfa line', name);
  var data = {'name': name, 'values': values};
  return data;
};

/**
 * Gets the expression matrix profile of given genes and conditions.
 * @param {string} fileExp File name of the expression matrix.
 * @param {string} fileTFA File name of the TFA matrix.
 * @param {!Array<string>} geneNames Names of the expression matrix.
 * @param {!Array<string>} conditionNames Names of the expression matrix.
 * @return {?expression.Profile} Gene expression profile as a JS object.
 * @private
 */
expression.getProfile_ = function(fileExp, fileTFA, geneNames,
                                     conditionNames) {
  var bufExp = utils.readFileToBuf(fileExp);
  var bufTFA = null;
  if (fileTFA != null) {
    bufTFA = utils.readFileToBuf(fileTFA);
  }
  if (bufExp == null) {
    console.error('cannot read file', fileExp);
    return null;
  }
  if (fileTFA != null && bufTFA == null) {
    console.error('cannot read file', fileTFA);
    return null;
  }

  var resultExp = expression.readExpmat_(bufExp);
  var resultTFA;
  if (fileTFA != null) {
    resultTFA = expression.readTFAmat_(/** @type {!Buffer} */(bufTFA));
  }

  if (geneNames.length == 0) {
    return null; // cannot find gene
  }

  var allTfaValues = [];
  var allGeneNames = {};
  var allConditionNames = {};
  var valueMin = Infinity;
  var valueMax = -Infinity;
  if (fileTFA != null) {
    resultTFA.rownames.forEach(function(geneName, i) {
      allGeneNames[geneName] = i;
    });
    resultTFA.colnames.forEach(function(conditionName, i) {
      allConditionNames[conditionName] = i;
    });
    geneNames.forEach(function(geneName) {
      var tfai = allGeneNames[geneName];
      var tfaValues = [];
      conditionNames.forEach(function(conditionName, j) {
        var idx = allConditionNames[conditionName];
        if (conditionName in allConditionNames) {
          var tfaValue = resultTFA.values[tfai * resultTFA.numcols + j];
          if (tfaValue) {
            tfaValues.push({
              value: tfaValue,
              index: j
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
    });
  }
  console.log('returning tfa line', geneNames.join(','));
  return {
    geneNames: geneNames,
    conditionNames: conditionNames,
    tfaValues: allTfaValues,
    valueMin: valueMin,
    valueMax: valueMax
  };
};


/**
 * Gets the expression matrix data.
 * @param {string} file File name of the expression matrix data.
 * @param {string} exprows Regex selecting the genes.
 * @param {string} expcols Regex selecting the experiment conditions.
 * @return {?expression.Matrix}
 * @private
 */
expression.getExpmat_ = function(file, exprows, expcols) {
  console.log(file);

  var buf = utils.readFileToBuf(file);
  if (buf == null) {
    console.error('cannot read file', file);
    return null;
  }
  var result = expression.readExpmat_(buf);

  var expr = null;
  var expc = null;
  try {
    expr = RegExp(exprows, 'i');
    expc = RegExp(expcols, 'i');
  } catch (e) {
    console.log('incorrect regular expression');
    expr = expc = 'a^';
  }
  console.log(expr, expc);

  var selrows = {}, selcols = {};
  var selrowids = [], selcolids = [];
  var selrownames = [], selcolnames = [];
  for (var i = 0; i < result.numrows; i++) {
    if (result.rownames[i].match(expr)) {
      selrows[i] = true;
      selrowids.push(i);
      selrownames.push(result.rownames[i]);
    }
  }
  for (var i = 0; i < result.numcols; i++) {
    if (result.colnames[i].match(expc)) {
      selcols[i] = true;
      selcolids.push(i);
      selcolnames.push(result.colnames[i]);
    }
  }
  var numSelrows = selrownames.length, numSelcols = selcolnames.length;
  var values = [];
  var min = Infinity, max = -Infinity;
  for (var i = 0; i < numSelrows; i++) {
    var row = [];
    for (var j = 0; j < numSelcols; j++) {
      var val = result.values[selrowids[i] * result.numcols + selcolids[j]];
      min = Math.min(min, val);
      max = Math.max(max, val);
      row.push(val);
    }
    values.push(row);
  }

  console.log('return', numSelrows, 'rows', numSelcols,
      'columns with value range [' + min + ', ' + max + ']');
  return {
    values: values,
    valueMin: min,
    valueMax: max,
    allValueMin: result.min,
    allValueMax: result.max,
    geneNames: selrownames,
    conditionNames: selcolnames
  };
};

/**
 * Lists all the expression matrix files in the server
 * @param {string} expressionPath Folder of the expression matrix file in the
 *     server.
 * @return {!Array<{
 *   matrixName: string,
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
 * @return {expression.MatrixInfo}
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

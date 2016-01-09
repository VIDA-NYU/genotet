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
 *   values: !Array<!Array<number>>,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   valueMin: number,
 *   valueMax: number,
 *   allValueMin: number,
 *   allValueMax: number
 * }}
 */
expression.Matrix;

/**
 * @typedef {{
 *   name: string,
 *   values: !Array<number>,
 *   tfaValues: !Array<number>
 * }}
 */
expression.Profile;

/** @const */
expression.query = {};

/**
 * @typedef {{
 *   fileName: string,
 *   geneRegex: string,
 *   conditionRegex: string
 * }}
 */
expression.query.Matrix;

/**
 * @typedef {{
 *   fileName: string,
 *   gene: string
 * }}
 */
expression.query.Profile;

// Start public APIs
/**
 * @param {!expression.query.Matrix} query
 * @param {string} expressionPath
 * @return {?expression.Matrix}
 */
expression.query.matrix = function(query, expressionPath) {
  var file = expressionPath + query.fileName;
  var geneRegex = query.geneRegex;
  var conditionRegex = query.conditionRegex;
  return expression.readExpression_(file, geneRegex, conditionRegex);
};

/**
 * @param {!expression.query.Profile} query
 * @param {!Object<string>} expressionFile
 * @param {!Object<string>} tfamatFile
 * @return {?expression.Profile}
 */
expression.query.profile = function(query, expressionFile, tfamatFile) {
  var matrix = query.matrixName;
  var gene = query.gene.toLowerCase();
  var fileExp = expressionFile[matrix], fileTfa = tfamatFile[matrix];
  return expression.getExpmatLine_(fileExp, fileTfa, gene);
};

/**
 * @param {string} expressionAddr
 * @return {!Array<{
 *   matrixName: string,
 *   description: string
 * }>}
 */
expression.query.list = function(expressionAddr) {
  return expression.listMatrix_(expressionAddr);
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
 * Gets the expression matrix profile of a given gene.
 * @param {string} fileExp File name of the expression matrix.
 * @param {string} fileTFA File name of the TFA matrix.
 * @param {string} name Name of the gene to be profiled.
 * @return {?expression.Profile} Gene expression profile as a JS object.
 * @private
 */
expression.getExpmatLine_ = function(fileExp, fileTFA, name) {
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

  for (var i = 0; i < resultExp.rownames.length; i++) {
    if (resultExp.rownames[i].toLowerCase() == name) {
      name = resultExp.rownames[i];
      break;
    }
  }
  if (i == resultExp.rownames.length) {
    return null;// cannot find gene
  }
  var tfaValues = [];
  if (fileTFA != null) {
    var tfai = resultTFA.rownames.indexOf(name);
    if (tfai != -1) {
      for (var j = 0; j < resultTFA.numcols; j++) {
        var idx = resultExp.colnames.indexOf(resultTFA.colnames[j]);
        tfaValues.push({
          value: resultTFA.values[tfai * resultTFA.numcols + j],
          index: idx
        });
      }
      tfaValues.sort(function(a, b) {
        return a.index - b.index;
      });
    }
  }
  var values = [];
  for (var j = 0; j < resultExp.numcols; j++) {
    values.push(resultExp.values[i * resultExp.numcols + j]);
  }
  console.log('returning line', name);
  return {
    name: name,
    values: values,
    tfaValues: tfaValues
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
      var fd = fs.openSync(folder + file, 'r');
      var content = fs.readFileSync(folder + file, 'utf8')
        .toString().split('\n');
      var matrixName = content[0];
      var description = '';
      for (var i = 1; i < content.length; i++) {
        description += content[i];
        if (i != content.length - 1) {
          description += '\n';
        }
      }
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
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} conditionRegex Regex for condition selection.
 * @return {expression.Matrix}
 * @private
 */
expression.readExpression_ = function(expressionFile, geneRegex,
                                     conditionRegex) {
  var values = [];
  var isFirstCol = true;
  var conditions = [];
  var geneNames = [];
  var conditionNames = [];
  var valueMax = -Infinity;
  var valueMin = Infinity;
  var allValueMax = -Infinity;
  var allValueMin = Infinity;

  var expGene;
  var expCondition;
  var validCol = [];
  try {
    expGene = RegExp(geneRegex, 'i');
    expCondition = RegExp(conditionRegex, 'i');
  } catch (e) {
    console.log('incorrect regular expression');
    expGene = expCondition = 'a^';
  }
  var lines = fs.readFileSync(expressionFile).toString().split('\n');
  lines.forEach(function(line) {
    var parts = line.split('\t');
    if (isFirstCol) {
      // first column contains the conditions
      isFirstCol = false;
      for (var i = 1; i < parts.length; i++) {
        if (parts[i].match(expCondition)) {
          conditions.push(i);
          validCol.push(true);
          conditionNames.push(parts[i]);
        } else {
          validCol.push(false);
        }
      }
    } else {
      // other columns contain a gene, and values
      if (parts[0].match(expGene)) {
        geneNames.push(parts[0]);
        var tmpLine = [];
        for (var i = 1; i < parts.length; i++) {
          var value = parseFloat(parts[i]);
          if (validCol[i - 1]) {
            valueMin = Math.min(valueMin, value);
            valueMax = Math.max(valueMax, value);
            tmpLine.push(value);
          }
          allValueMin = Math.min(allValueMin, value);
          allValueMax = Math.max(allValueMax, value);
        }
        values.push(tmpLine);
      } else {
        for (var i = 1; i < parts.length; i++) {
          var value = parseFloat(parts[i]);
          allValueMin = Math.min(allValueMin, value);
          allValueMax = Math.max(allValueMax, value);
        }
      }
    }
  });
  return {
    values: values,
    geneNames: geneNames,
    conditionNames: conditionNames,
    valueMin: valueMin,
    valueMax: valueMax,
    allValueMin: allValueMin,
    allValueMax: allValueMax
  };
};

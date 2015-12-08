/**
 * @fileoverview Server handler for expression matrix.
 */

'use strict';

var utils = require('./utils');

var fs = require('fs');
var rl = require('readline');

module.exports = {
  /**
   * Reads the expression matrix data from the buffer.
   * @param {Buffer} buf File buffer of the expression matrix data.
   * @return {!Object} Expression matrix data as a JS object.
   */
  readExpmat: function(buf) {
    var result = {};
    var offset = 0;
    var n = buf.readInt32LE(0),
      m = buf.readInt32LE(4),
      lrows = buf.readInt32LE(8),
      lcols = buf.readInt32LE(12);
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
  },

  /**
   * Reads the TFA matrix data from the given buffer.
   * @param {string} buf Buffer of the TFA matrix data file.
   * @return {!Object} The TFA matrix data as a JS object.
   */
  readTFAmat: function(buf) {
    var result = {};
    var offset = 0;
    var n = buf.readInt32LE(0),
      m = buf.readInt32LE(4),
      lrows = buf.readInt32LE(8),
      lcols = buf.readInt32LE(12);
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
  },

  /**
   * Reads the TFA matrix profile of a given gene.
   * @param {string} file TFA matrix file name.
   * @param {string} name Name of the gene to be profiled.
   * @return {{name: string, values: !Array<number>}}
   *     TFA profile of the given gene.
   */
  getTFAmatLine: function(file, name) {
    //var file = tfamatFile[mat];
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = readTFAmat(buf);
    name = name.toLowerCase();
    for (var i = 0; i < result.rownames.length; i++) {
      if (result.rownames[i].toLowerCase() == name) { name = result.rownames[i]; break; }
    }
    var values = [];
    for (var j = 0; j < result.numcols; j++) values.push(result.values[i * result.numcols + j]);
    console.log('returning tfa line', name);
    var data = {'name': name, 'values': values};
    return data;
  },

  /**
   * Gets the expression matrix profile of a given gene.
   * @param {string} fileExp File name of the expression matrix.
   * @param {string} fileTFA File name of the TFA matrix.
   * @param {string} name Name of the gene to be profiled.
   * @return {{
   *     name: string,
   *     values: !Array<number>,
   *     tfaValues: !Array<number>
   *   }} Gene expression profile as a JS object.
   */
  getExpmatLine: function(fileExp, fileTFA, name) {
    var bufExp = utils.readFileToBuf(fileExp);
    var bufTFA = null;
    if (fileTFA != null) {
      bufTFA = utils.readFileToBuf(fileTFA)
    }

    if (bufExp == null) {
      return console.error('cannot read file', fileExp), [];
    }
    if (fileTFA != null && bufTFA == null) {
      return console.error('cannot read file', fileTFA), [];
    }

    var resultExp = this.readExpmat(bufExp);
    var resultTFA;
    if (fileTFA != null) {
      resultTFA = readTFAmat(bufTFA);
    }

    for (var i = 0; i < resultExp.rownames.length; i++) {
      if (resultExp.rownames[i].toLowerCase() == name) {
        name = resultExp.rownames[i];
        break;
      }
    }
    if (i == resultExp.rownames.length)
      return [];// cannot find gene
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
    }
  },

  /**
   * Gets the expression matrix data.
   * @param {string} file File name of the expression matrix data.
   * @param {string} exprows Regex selecting the genes.
   * @param {string} expcols Regex selecting the experiment conditions.
   * @return {{
   *     values: !Array<!Array<number>>,
   *     valueMin: number,
   *     valueMax: number,
   *     allValueMin: number,
   *     allValueMax: number,
   *     geneNames: !Array<string>,
   *     conditionNames: !Array<string>
   *   }}
   */
  getExpmat: function(file, exprows, expcols) {
    console.log(file);

    var buf = utils.readFileToBuf(file);
    if (buf == null) { res.send('[]'); console.error('cannot read file', file); return; }
    var result = this.readExpmat(buf);

    var expr = null, expc = null;
    try {
      expr = RegExp(exprows, 'i');
      expc = RegExp(expcols, 'i');
    }catch (e) {
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
    }
  },

  /**
   * List all the expression matrix files in the server
   * @param {string} expmatAddr Folder of the expression matrix file in the server
   * @return {Array} array of object of each expression matrix file
   */
  listMatrix: function(expmatAddr) {
    var folder = expmatAddr;
    var ret = [];
    var files = fs.readdirSync(folder);
    for (var i = 0; i < files.length; i++) {
      var stat = fs.lstatSync(folder + files[i]);
      if (!stat.isDirectory) {
        if (files[i].indexOf('.txt') != -1) {
          var fname = files[i].substr(0, files[i].length - 4);
          var description;
          var fd = fs.openSync(folder + files[i]);
          fs.readSync(fd, description);
          ret.push({
            matrixName: fname,
            description: description.toString()
          });
        }
      }
    }
    return ret;
  },

  /**
   * Read expression matrix from text file
   * @param {string} expressionFile path to the expression file
   * @return {Object} the expression matrix
   */
  readExpression: function(expressionFile, geneRegex, conditionRegex) {
    var values = [];
    var isFirstCol = true;
    var values = [];
    var conditions = [];
    var geneNames = [];
    var conditionNames = [];
    var valueMax = -Infinity;
    var valueMin = Infinity;
    var allValueMax = -Infinity;
    var allValueMin = Infinity;
    var expGene, expCondition;
    var validCol = [];
    try {
      expGene = RegExp(geneRegex, 'i');
      expCondition = RegExp(conditionRegex, 'i');
    }catch (e) {
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
        }
        else {
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
  }
};

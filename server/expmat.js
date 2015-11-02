/**
 * @fileoverview Server handler for expression matrix.
 */

'use strict';

var utils = require('./utils');

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
  readTfamat: function(buf) {
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
  getTfamatLine: function(file, name) {
    //var file = tfamatFile[mat];
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = readTfamat(buf);
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
   * @param {string} fileTfa File name of the TFA matrix.
   * @param {string} name Name of the gene to be profiled.
   * @returns {{
   *     name: string,
   *     values: !Array<number>,
   *     tfaValues: !Array<number>
   *   }} Gene expression profile as a JS object.
   */
  getExpmatLine: function(fileExp, fileTfa, name) {
    var bufExp = utils.readFileToBuf(fileExp);
    if (fileTfa != null) {
      bufTfa = utils.readFileToBuf(fileTfa)
    }

    if (bufExp == null) {
      return console.error('cannot read file', fileExp), [];
    }
    if (fileTfa != null && bufTfa == null) {
      return console.error('cannot read file', fileTfa), [];
    }

    var resultExp = this.readExpmat(bufExp);
    var resultTfa;
    if (fileTfa != null) {
      resultTfa = readTfamat(bufTfa);
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
    if (fileTfa != null) {
      var tfai = resultTfa.rownames.indexOf(name);
      if (tfai != -1) {
        for (var j = 0; j < resultTfa.numcols; j++) {
          var idx = resultExp.colnames.indexOf(resultTfa.colnames[j]);
          tfaValues.push({'value': resultTfa.values[tfai * resultTfa.numcols + j], 'index': idx});
        }
        tfaValues.sort(function(a, b) { return a.index - b.index; });
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
   * @returns {{
   *     data: !Array<!Array<number>>,
   *     min: number,
   *     max: number,
   *     minAll: number,
   *     maxAll: number,
   *     numGenes: number,
   *     numConds: number,
   *     geneNames: !Array<string>,
   *     condNames: !Array<string>
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
      expr = expc = '.*';
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
    /*
    // TODO(bowen): Temporarily keeping the old matrix sampling code. Just in case...
      resol = Math.max(1, resol);
    var nresol = Math.ceil(height / resol), mresol = Math.ceil(width / resol);
    var n = numSelrows, m = numSelcols; // note that x,y are reversed between svg and matrix data
    var nsmp = true, msmp = true;
    if (n < nresol) nsmp = false;
    else n = nresol;
    if (m < mresol) msmp = false;
    else m = mresol;

    var xl = 0, yl = 0, xr = numSelcols - 1E-3, yr = numSelrows - 1E-3;
    //if(xr==0) xr=0.9; if(yr==0) yr=0.9; // prevent overflow
    var data = {};
    var max = 0, min = 1E10;
    var ys = [], xs = [];
    for (var i = 0; i <= n; i++) {
      if (nsmp == false) {
        ys.push(i == n ? n - 1 : i);
      }else {
        var y = yl + i / n * (yr - yl);
        ys.push(y);
      }
    }
    for (var j = 0; j <= m; j++) {
      if (msmp == false) {
        xs.push(j == m ? m - 1 : j);
      }else {
        var x = xl + j / m * (xr - xl);
        xs.push(x);
      }
    }
    //console.log(nsmp, msmp, xs, ys);
    data.data = [];
    for (var i = 0; i < n; i++) {
      var il = ys[i], ir = ys[i + 1];
          il = Math.floor(il); ir = Math.max(il + 1, Math.floor(ir));
      for (var j = 0; j < m; j++) {
        var jl = xs[j], jr = xs[j + 1];
              jl = Math.floor(jl); jr = Math.max(jl + 1, Math.floor(jr));
        var cnt = 0;
        for (var p = il; p < ir; p++) for (var q = jl; q < jr; q++) {
          cnt = Math.max(cnt, values[p * numSelcols + q]);
        }
        max = Math.max(cnt, max);
              min = Math.min(cnt, min);
        data.data.push({'x': j / m * width, 'y': i / n * height, 'count': cnt});
      }
    }
    */
    console.log('return', numSelrows, 'rows', numSelcols,
        'columns with value range [' + min + ', ' + max + ']');
    return {
      data: values,
      min: min,
      max: max,
      minAll: result.min,
      maxAll: result.max,
      numGenes: numSelrows,
      numConds: numSelcols,
      geneNames: selrownames,
      condNames: selcolnames
    }
  }
};

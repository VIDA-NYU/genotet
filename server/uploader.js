/**
 * @fileoverview upload function handler
 */

'use strict'

var path;
var fs = require('fs');
var multer = require('multer');
var shell = require('shelljs');

var utils = require('./utils');
var binding = require('./binding');
var segtree = require('./segtree');

var upload = multer();

module.exports = {

  /**
   * Upload a file or a directory to server.
   * @param req {Object} Including query parameders.
   * @param wiggleAddr {String} Wiggle data directory to upload to.
   * @param networkAddr {String} Network Data directory to upload to.
   * @param expmatAddr {String} Expression Matrix data directory to upload to.
   * @param bigwigtoWigAddr {String} Directory of script of BigwigtoWig.
   * @param genecodes {Array} Namecode conversion of gene.
   * @returns {!Object} Success or not as a JS Object.
   */
  uploadFile: function(req, wiggleAddr, networkAddr, expmatAddr, bigwigtoWigAddr, genecodes) {

    var fileType = req.type;

    var fullPath;
		if (fileType == 'network') {
			fullPath = networkAddr;
		} else if (fileType == 'wiggle') {
			fullPath = wiggleAddr;
		} else if (fileType == 'expmat') {
			fullPath = expmatAddr;
		}

    var isFinish = true;
    upload = multer({dest: fullPath});
    upload(req);

    if (!isFinish)
      return {
        success: 'false'
      };
    if (fileType == 'wiggle') {
      var dataPath = fullPath + req.file.fieldname;
      this.bigwigtoBcwig(fullPath, req.file.filedname, bigwigtoWigAddr, genecodes)
    }
    return {
      success: 'true'
    };
  },

  /**
   * Convert bigwig file to bcwig file and construct segment trees.
   * @param prefix {String} Folder that contains the bw file.
   * @param bwFile {String} Name of the bigwig file.
   * @param bigwigtoWigAddr {String} The convention script path.
   * @param genecodes {Array} Namecode convention of gene.
   */
  bigwigtoBcwig: function(prefix, bwFile, bigwigtoWigAddr, genecodes) {
    // convert *.bw into *.wig
    var wigFileName = bwFile.substr(0, bwFile.length - 3) + '.wig';
    shell.exec('./' + bigwigtoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);

    // convert *.wig into *.bcwig
    var seg = new Array();  // for segment tree
    for (var i = 1; i < 20; i++) {
      var chName = 'chr' + i.toString();
      seg[chName] = [];
    }
    seg['chrM'] = [];
    seg['chrX'] = [];
    seg['chrY'] = [];

    var buf = fs.readFileSync(prefix + wigFileName);
    var wigLine = buf.toString().split('\n');
    var lastxr = -1;
    for (var i = 1; i < wigLine.length; i++) {
      if (wigLine.contains('#'))
        continue;
      var wigLinePart = wigLine.split(RegExp(/\s+/));
      var chName = wigLinePart[0];
      var xl = parseInt(wigLinePart[1]);
      var xr = parseInt(wigLinePart[2]);
      var val = parseFloat(wigLinePart[3]);
      if (xl != lastxr) {
        seg[chName].push({
          'x': lastxr,
          'val': 0
        });
      }
      seg[chName].push({
        'x': xl,
        'val': val
      });
      lastxr = xr;
    }

    // write to *.bcwig file
    var namecode = genecodes[bwFile.substr(0, bwFile.length - 3)];
    fs.mkdir(prefix + namecode);
    for (var chr in seg) {
      var bcwigFile = prefix + namecode + '/' + namecode + '_treat_afterfiting_' + chr + '.bcwig';
      for (var i = 0; i < seg[chr].length; i++) {
        var bcwigBuf = new Buffer(6 * seg[chr].length);

        bcwigBuf.writeInt32LE(seg[chr][i].x, i * 6);
        bcwigBuf.writeInt16LE(seg[chr][i].val, i * 6 + 4);
        var fd = fs.openSync(bcwigFile, 'w');
        fs.writeSync(fd, buf, 0, 6 * seg[chr].length, 0);
      }
    }

    // build segment tree and save
    for (var chr in seg) {
      var segFile = prefix + namecode + '/' + namecode + 'treat_afterfiting_' + chr + '.seg';
      var nodes = [];
      segtree.buildSegmentTree(nodes, seg[chr]);
      var segBuf = new Buffer(4 + 2 * nodes.length);
      segBuf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++, offset += 2) {
        segBuf.writeInt16LE(nodes[i], offset);
      }
      var fd = fs.openSync(segFile, 'w');
      fs.writeSync(fd, segBuf, 0, offset, 0);
    }
  }

};

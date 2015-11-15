/**
 * @fileoverview upload function handler
 */

'use strict'

var path;
var fs = require('fs');
var child = require('child_process');

var utils = require('./utils.js');
var segtree = require('./segtree.js');

module.exports = {

  /**
   * Uploads a file or a directory to server.
   * @param {{
   *   type: string,
   *   name: string,
   *   description: string
   * }} desc File description.
   * @param {Object} file File object received from multer.
   * @param {string} prefix The destination folder to upload the file to.
   * @param {string} bigWigToWigAddr Directory of script of UCSC bigWigToWig.
   * @returns {Object} Success or not as a JS Object.
   */
  uploadFile: function(desc, file, prefix, bigWigToWigAddr) {
    var fileType = desc.type;
    console.log(desc);
    console.log(file);
    var source = fs.createReadStream(file.path);
    var dest = fs.createWriteStream(prefix + desc.name);
    source.pipe(dest);
    source.on("end", function(){});
    source.on("err", function(err){});
    fs.unlink(file.path);

    // write down the network name and description
    var fd = fs.openSync(prefix + desc.name + ".txt", 'w');
    fs.writeSync(fd, desc.description);
    fs.closeSync(fd);

    if (desc.type == 'binding') {
      //this.bigwigtoBcwig(prefix, desc.name, bigWigToWigAddr);
    }

    return {
      success: true
    };

  },

  /**
   * Converts bigwig file to bcwig file and construct segment trees.
   * @param {string} prefix Folder that contains the bw file.
   * @param {string} bwFile Name of the bigwig file (without prefix).
   * @param {string} bigwigtoWigAder The convention script path.
   */
  bigwigtoBcwig: function(prefix, bwFile, bigWigWoWigAddr) {
    // convert *.bw into *.wig
    var wigFileName = bwFile + '.wig';
    console.log('start transfer');
    //child.execSync(bigWigWoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);
    console.log(bigWigWoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);

    // convert *.wig into *.bcwig
    var seg = {};  // for segment tree, 22 trees for each chromosome, it is a map
    for (var i = 1; i < 20; i++) {
      var chName = 'chr' + i;
      seg[chName] = [];
    }
    seg['chrM'] = [];
    seg['chrX'] = [];
    seg['chrY'] = [];

    var buf = fs.readFileSync(prefix + wigFileName);
    var wigLine = buf.toString().split('\n');
    var lastxr = -1;
    for (var i = 1; i < wigLine.length; i++) {
      if (wigLine.contains('#')) {
        continue;
      }
      var wigLinePart = wigLine.split(RegExp(/\s+/));
      var chName = wigLinePart[0];
      var xl = parseInt(wigLinePart[1]);
      var xr = parseInt(wigLinePart[2]);
      var val = parseFloat(wigLinePart[3]);
      if (xl != lastxr) {
        seg[chName].push({
          x: lastxr,
          val: 0
        });
      }
      seg[chName].push({
        x: xl,
        val: val
      });
      lastxr = xr;
    }

    // write to *.bcwig file
    var namecode = bwFile;

    // if the folder already exists, then delete it
    if (fs.exists(prefix + namecode)) {
      fs.rmdirSync(prefix + namecode);
      console.log('Wiggle file ' + namecode + ' is replaced.');
    }
    fs.mkdir(prefix + namecode);

    for (var chr in seg) {
      var bcwigFile = prefix + namecode + '/' + namecode + '_' + chr + '.bcwig';
      for (var i = 0; i < seg[chr].length; i++) {
        var bcwigBuf = new Buffer(8 * seg[chr].length);

        bcwigBuf.writeInt32LE(seg[chr][i].x, i * 4);
        bcwigBuf.writeFloatLE(seg[chr][i].val, i * 4 + 4);
        var fd = fs.openSync(bcwigFile, 'w');
        fs.writeSync(fd, buf, 0, 4 * seg[chr].length, 0);
        fs.closeSync(fd);
      }
    }


    // build segment tree and save
    for (var chr in seg) {
      var segFile = prefix + namecode + '/' + namecode + '_' + chr + '.seg';
      var nodes = [];
      segtree.buildSegmentTree(nodes, seg[chr]);
      var segBuf = new Buffer(4 + 4 * nodes.length);
      segBuf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++, offset += 2) {
        segBuf.writeFloatLE(nodes[i], offset);
      }
      var fd = fs.openSync(segFile, 'w');
      fs.writeSync(fd, segBuf, 0, offset, 0);
      fs.closeSync(fd);
    }
  }

};

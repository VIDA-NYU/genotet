/**
 * @fileoverview upload function handler
 */

'use strict';

var path;
var fs = require('fs');
var child = require('child_process');
var rl = require('readline');
var mkdirp = require('mkdirp');

var utils = require('./utils.js');
var segtree = require('./segtree.js');

/** @const */
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
   * @return {Object} Success or not as a JS Object.
   * @this {uploader}
   */
  uploadFile: function(desc, file, prefix, bigWigToWigAddr) {
    var source = fs.createReadStream(file.path);
    if (fs.existsSync(prefix + desc.name)) {
      console.log('wiggle file already exists');
      return {
        success: false,
        reason: 'wiggle file already exists for current name'
      };
    }
    var dest = fs.createWriteStream(prefix + desc.name);
    source.pipe(dest);
    source
      .on('end', function() {
        fs.unlink(file.path);
        if (desc.type == 'binding') {
          this.bigWigToBCWig(prefix, desc.name, bigWigToWigAddr);
        } else if (desc.type == 'bed') {
          this.bedSort(prefix, desc.name);
        }
      }.bind(this))
      .on('err', function(err) {
        console.log(err);
        return {
          success: false,
          reason: 'error copying file'
        };
      });

    // write down the network name and description
    var fd = fs.openSync(prefix + desc.name + '.txt', 'w');
    fs.writeSync(fd, desc.description);
    fs.closeSync(fd);

    return {
      success: true
    };

  },

  /**
   * Converts bigwig file to bcwig file and construct segment trees.
   * @param {string} prefix Folder that contains the bw file.
   * @param {string} bwFile Name of the bigwig file (without prefix).
   * @param {string} bigWigToWigAddr The convention script path.
   */
  bigWigToBCWig: function(prefix, bwFile, bigWigToWigAddr) {
    // convert *.bw into *.wig
    var wigFileName = bwFile + '.wig';
    console.log('start transfer');
    var cmd = [
      bigWigToWigAddr,
      prefix + bwFile,
      prefix + wigFileName
    ].join(' ');
    child.execSync(cmd);
    console.log(cmd);

    // convert *.wig into *.bcwig
    var seg = {};  // for segment tree

    // solve each line
    var lines = rl.createInterface({
      input: fs.createReadStream(prefix + wigFileName),
      terminal: false
    });
    var lastxr = -1;
    var lastChrXr = {}, lastValue = {};
    lines.on('line', function(line) {
      if (line.indexOf('#') == -1) {
        var linePart = line.split(RegExp(/\s+/));
        var chName = linePart[0];
        var xl = parseInt(linePart[1]);
        var xr = parseInt(linePart[2]);
        var val = parseFloat(linePart[3]);
        lastChrXr[chName] = xr;
        lastValue[chName] = val;
        if (!seg.hasOwnProperty(linePart[0])) {
          seg[linePart[0]] = [];
        }
        if (xl != lastxr && lastxr > -1) {
          seg[chName].push({
            x: lastxr,
            value: 0.0
          });
        }
        seg[chName].push({
          x: xl,
          value: val
        });
        lastxr = xr;
      }
    });

    lines.on('close', function() {
      for (var chr in lastChrXr) {
        seg[chr].push({
          x: lastChrXr[chr],
          value: lastValue[chr]
        });
      }
      // write to *.bcwig file
      // console.log('start log it');
      // if the folder already exists, then delete it
      var folder = prefix + bwFile + '_chr';
      if (fs.existsSync(folder)) {
        fs.rmdirSync(folder);
        console.log('Wiggle file ' + bwFile + ' is replaced.');
      }
      fs.mkdirSync(folder);

      for (var chr in seg) {
        var bcwigFile = folder + '/' + bwFile + '_' + chr + '.bcwig';
        var bcwigBuf = new Buffer(8 * seg[chr].length);
        for (var i = 0; i < seg[chr].length; i++) {
          bcwigBuf.writeInt32LE(seg[chr][i].x, i * 4);
          bcwigBuf.writeFloatLE(seg[chr][i].value, i * 4 + 4);
        }
        var fd = fs.openSync(bcwigFile, 'w');
        fs.writeSync(fd, bcwigBuf, 0, 8 * seg[chr].length, 0);
        fs.closeSync(fd);
      }

      // build segment tree and save
      for (var chr in seg) {
        var segFile = folder + '/' + bwFile + '_' + chr + '.seg';
        var nodes = [];
        segtree.buildSegmentTree(nodes, seg[chr]);
        var segBuf = new Buffer(4 + nodes.length * 4);
        segBuf.writeInt32LE(nodes.length, 0);
        for (var i = 0, offset = 4; i < nodes.length; i++, offset += 4) {
          segBuf.writeFloatLE(nodes[i], offset);
        }
        var fd = fs.openSync(segFile, 'w');
        fs.writeSync(fd, segBuf, 0, offset, 0);
        fs.closeSync(fd);
      }

      console.log('Wiggle file separate done.');
    });

  },

  /**
   * Sort bed data segments and write it into separate files.
   * @param {string} prefix Folder to the bed files.
   * @param {string} bedFile File name of the bed file.
   */
  bedSort: function(prefix, bedFile) {
    var lines = rl.createInterface({
      input: fs.createReadStream(prefix + bedFile),
      terminal: false
    });
    console.log('separating bed data...');
    var data = {};
    lines.on('line', function(line) {
      var parts = line.split('\t');
      if (parts[0].indexOf('track') != -1) {
        return;
      }
      if (!data.hasOwnProperty(parts[0])) {
        data[parts[0]] = [];
      }
      data[parts[0]].push({
        chrStart: parseInt(parts[1]),
        chrEnd: parseInt(parts[2]),
        name: parts[3]
      });
    });
    lines.on('close', function() {
      console.log('writing bed data...');
      var folder = prefix + bedFile + '_chr';
      fs.mkdirSync(folder);
      for (var chr in data) {
        data[chr].sort(function(a, b) {
          return a.chrStart - b.chrStart;
        });
        var chrFileName = folder + '/' + bedFile + '_' + chr;
        var fd = fs.openSync(chrFileName, 'w');
        for (var i = 0; i < data[chr].length; i++) {
          fs.writeSync(fd, data[chr][i].chrStart + '\t' + data[chr][i].chrEnd +
            '\n');
        }
        fs.closeSync(fd);
      }
      console.log('bed chromosome data finish.');
    });
  }

};

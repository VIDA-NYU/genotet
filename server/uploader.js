/**
 * @fileoverview upload function handler
 */
var fs = require('fs');
var childProcess = require('child_process');
var readline = require('readline');
var mkdirp = require('mkdirp');

var utils = require('./utils.js');
var segtree = require('./segtree.js');

/** @type {uploader} */
module.exports = uploader;

/**
 * @constructor
 */
function uploader() {}

/** @enum {string} */
uploader.FileType = {
  NETWORK: 'network',
  EXPRESSION: 'expression',
  BINDING: 'binding',
  BED: 'bed',
  MAPPING: 'mapping'
};

/**
 * Size of a binding entry, one int, one double.
 * @private @const {number}
 */
uploader.ENTRY_SIZE_ = 12;

/**
 * Size of one double, for binding file storage.
 * @private @const {number}
 */
uploader.DOUBLE_SIZE_ = 8;

/**
 * Uploads a file or a directory to server.
 * @param {{
 *   type: uploader.FileType,
 *   name: string,
 *   description: string,
 * }} desc File description.
 * @param {!multer.File} file File object received from multer.
 * @param {string} prefix The destination folder to upload the file to.
 * @param {string} bigWigToWigAddr Directory of script of UCSC bigWigToWig.
 * @param {string} uploadPath Directory of temporary files.
 * @return {Object} Success or not as a JS Object.
 */
uploader.uploadFile = function(desc, file, prefix, bigWigToWigAddr,
                               uploadPath) {
  var fileName = file.originalname;
  if (fs.existsSync(prefix + fileName)) {
    fs.unlinkSync(prefix + fileName);
  }
  // create a pending file.
  var fd = fs.openSync(uploadPath + fileName + '.pending', 'w');
  fs.writeSync(fd, 'pending');
  fs.closeSync(fd);
  var source = fs.createReadStream(file.path);
  var dest = fs.createWriteStream(prefix + fileName);
  source.pipe(dest);
  source
    .on('end', function() {
      fs.unlinkSync(file.path);
      if (desc.type == uploader.FileType.BINDING) {
        uploader.bigWigToBCWig(prefix, fileName, bigWigToWigAddr, uploadPath);
      } else if (desc.type == uploader.FileType.BED) {
        uploader.bedSort(prefix, fileName, uploadPath);
      } else {
        // remove it when finished.
        fs.unlinkSync(uploadPath + fileName + '.pending');
      }
      if (desc.type != uploader.FileType.MAPPING) {
        // write down the data name and description
        var fd = fs.openSync(prefix + fileName + '.txt', 'w');
        fs.writeSync(fd, desc.name + '\n');
        fs.writeSync(fd, desc.description);
        fs.closeSync(fd);
      }
    })
    .on('err', function(err) {
      return {
        error: {
          type: 'copyFailed',
          message: 'upload file copy failed'
        }
      };
    });
  return {};
};

/**
 * Converts bigwig file to bcwig file and construct segment trees.
 * @param {string} prefix Folder that contains the bw file.
 * @param {string} bwFile Name of the bigwig file (without prefix).
 * @param {string} bigWigToWigAddr The convention script path.
 * @param {string} uploadPath Directory of temporary files.
 */
uploader.bigWigToBCWig = function(prefix, bwFile, bigWigToWigAddr, uploadPath) {
  // convert *.bw into *.wig
  var wigFileName = bwFile + '.wig';
  console.log('start transfer');
  var cmd = [
    bigWigToWigAddr,
    prefix + bwFile,
    prefix + wigFileName
  ].join(' ');
  childProcess.execSync(cmd);
  console.log(cmd);

  // convert *.wig into *.bcwig
  var seg = {};  // for segment tree

  // solve each line
  var lines = readline.createInterface({
    input: fs.createReadStream(prefix + wigFileName),
    terminal: false
  });
  var lastChrXr = {}, lastValue = {};
  lines.on('line', function(line) {
    if (line.indexOf('#') == -1) {
      var linePart = line.split(RegExp(/\s+/));
      var chName = linePart[0];
      var xl = parseInt(linePart[1], 10);
      var xr = parseInt(linePart[2], 10);
      var val = parseFloat(linePart[3]);
      //console.log(seg);
      if (!(linePart[0] in seg)) {
        seg[linePart[0]] = [];
      }
      if (xl != lastChrXr[chName] && lastChrXr[chName] > -1) {
        seg[chName].push({
          x: lastChrXr[chName],
          value: 0.0
        });
      }
      seg[chName].push({
        x: xl,
        value: val
      });
      lastChrXr[chName] = xr;
      lastValue[chName] = val;
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
      cmd = [
        'rm',
        '-r',
        folder
      ].join(' ');
      childProcess.execSync(cmd);
    }
    fs.mkdirSync(folder);

    for (var chr in seg) {
      var bcwigFile = folder + '/' + bwFile + '_' + chr + '.bcwig';
      var bcwigBuf = new Buffer(uploader.ENTRY_SIZE_ * seg[chr].length);
      for (var i = 0; i < seg[chr].length; i++) {
        bcwigBuf.writeInt32LE(seg[chr][i].x, i * uploader.ENTRY_SIZE_);
        bcwigBuf.writeDoubleLE(seg[chr][i].value, i * uploader.ENTRY_SIZE_ + 4);
      }
      var fd = fs.openSync(bcwigFile, 'w');
      fs.writeSync(fd, bcwigBuf, 0, uploader.ENTRY_SIZE_ * seg[chr].length, 0);
      fs.closeSync(fd);
    }

    // build segment tree and save
    for (var chr in seg) {
      var segFile = folder + '/' + bwFile + '_' + chr + '.seg';
      var nodes = [];
      segtree.buildSegmentTree(nodes, seg[chr]);
      var segBuf = new Buffer(4 + nodes.length * uploader.DOUBLE_SIZE_);
      segBuf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++,
        offset += uploader.DOUBLE_SIZE_) {
        segBuf.writeDoubleLE(nodes[i], offset);
      }
      var fd = fs.openSync(segFile, 'w');
      fs.writeSync(fd, segBuf, 0, offset, 0);
      fs.closeSync(fd);
    }

    fs.unlinkSync(uploadPath + bwFile + '.pending');
    console.log('binding data separate done.');
  });
};

/**
 * Sorts bed data segments and write it into separate files.
 * @param {string} prefix Folder to the bed files.
 * @param {string} bedFile File name of the bed file.
 * @param {string} uploadPath Directory of temporary files.
 */
uploader.bedSort = function(prefix, bedFile, uploadPath) {
  var lines = readline.createInterface({
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
    if (!(parts[0] in data)) {
      data[parts[0]] = [];
    }
    data[parts[0]].push({
      chrStart: parseInt(parts[1], 10),
      chrEnd: parseInt(parts[2], 10),
      name: parts[3]
    });
  });

  lines.on('close', function() {
    console.log('writing bed data...');
    var folder = prefix + bedFile + '_chr';
    if (fs.existsSync(folder)) {
      var cmd = [
        'rm',
        '-r',
        folder
      ].join(' ');
      childProcess.execSync(cmd);
    }
    fs.mkdirSync(folder);
    for (var chr in data) {
      data[chr].sort(function(a, b) {
        if (a.chrStart == b.chrStart) {
          return a.chrEnd - b.chrEnd;
        }
        return a.chrStart - b.chrStart;
      });
      var chrFileName = folder + '/' + bedFile + '_' + chr;
      var fd = fs.openSync(chrFileName, 'w');
      for (var i = 0; i < data[chr].length; i++) {
        fs.writeSync(fd, data[chr][i].chrStart + '\t' + data[chr][i].chrEnd +
          '\t' + data[chr][i].name);
        if (i < data[chr].length - 1) {
          fs.writeSync(fd, '\n');
        }
      }
      fs.closeSync(fd);
    }

    fs.unlinkSync(uploadPath + bedFile + '.pending');
    console.log('bed chromosome data finish.');
  });
};

/**
 * Checks whether the file has been uploaded and processed.
 * @param {{
 *  fileName: string
 * }} query Parameters for file checking.
 * @param {string} prefix Path to the folder.
 * @return {boolean} File exists or not
 */
uploader.checkFinish = function(query, prefix) {
  var isFinish = !fs.existsSync(prefix + query.fileName + '.pending');
  return isFinish;
};

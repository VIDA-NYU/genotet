
// server handler of uploading

'use strict'

var path;
var fs = require('fs');
var multer = require('multer');

var utils = require('./utils');
var segtree = require('./segtree');
var binding = require('./binding');

var upload = multer();

module.exports = {

  uploadFile: function(req, res, wiggleAddr, networkAddr, expmatAddr) {

    var fileType = req.query.type;

    var fullPath;
		if (fileType == 'network') {
			fullPath = networkAddr;
		} else if (fileType == 'wiggle') {
			fullPath = wiggleAddr;
		} else if (fileType == 'expmat') {
			fullPath = expmatAddr;
		}

    upload = multer({dest: fullPath});
    var isFinish = upload(req,res,function(err){
      if (err)
        return -1;
      return 1;
    });

    if (!isFinish)
      return {
        success: 'false'
      };
    if (fileType == 'wiggle') {

    } else if (fileType == 'network') {

    } else if (fileType == 'expmat') {

    }
    return {
      success: 'true'
    };
  }
	
};


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

  uploadFile: function(req, res, runEnv) {

    if (runEnv == 'jm_mac') {
      path = '/Users/JiamingDong/Documents/vida_data/';
    }

    var fullPath;
		if (fileType == 'network') {
			fullPath = path + 'network/';
		} else if (fileType == 'wiggle') {
			fullPath = path + 'wiggle'
		} else if (fileType == 'expmat') {
			fullPath = path;
		}

    upload = multer({dest: fullPath});
    return upload(req,res,function(err){
      if (err)
        return -1;
      return 1;
    });
  }
	
};

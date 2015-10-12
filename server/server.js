
// server code main entry

'use strict';

var runEnv = 'laptop';

var express = require('express'),
	fs = require('fs'),
	util = require('util'),
	bodyParser = require('body-parser'),
	Buffer = require('buffer').Buffer,
	constants = require('constants');

// include server sources
var	segtree = require('./segtree.js'),
	utils = require('./utils.js'),
  network = require('./network.js'),
	binding = require('./binding.js'),
	expmat = require('./expmat.js');

var app = express();
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '50mb'
}));
app.use(bodyParser.json({
  limit: '50mb'
}));


var wiggleAddr, networkAddr, expmatAddr;
if (runEnv == 'vida') {
	wiggleAddr = '/data/bonneau/wiggle/';
	networkAddr = '/data/bonneau/network/';
	expmatAddr = '/data/bonneau/';
} else if (runEnv == 'laptop') {
	wiggleAddr = 'D:/bnetvis_data/wiggle/';
	networkAddr = 'D:/bnetvis_data/network/';
	expmatAddr = 'D:/bnetvis_data/';
} else if (runEnv == 'lab') {
	wiggleAddr = '/home/bowen/bnetvis_data/wiggle/';
	networkAddr = '/home/bowen/bnetvis_data/network/';
	expmatAddr = '/home/bowen/bnetvis_data/';
}
var codeFile = wiggleAddr + 'namecode';
var exonFile = wiggleAddr + 'exons.bin';
var expmatFile = {
  'B-Subtilis': expmatAddr + 'expressionMatrix.bin',
  'RNA-Seq': expmatAddr + 'rnaseq.bin'
};
var tfamatFile = {
  'B-Subtilis': expmatAddr + 'tfa.matrix2.bin',
  'RNA-Seq': null
};



var genecodes = {};
function readCodes(input) {
  var remaining = '';
  input.on('data', function(data) { remaining += data; });
  input.on('end', function() {
      var w = remaining.split(RegExp(/\s+/));
      for (var i = 0; i < w.length; i += 2) genecodes[w[i].toLowerCase()] = w[i + 1];
    });
}

app.post('/', function(req, res) {
	var type = req.body.type;
	console.log('POST', type);
	var data;
	if (type == 'net') {
	  var net = req.body.net,
	   exp = req.body.exp;
		data = network.getNet(networkAddr + net + '.bnet', exp);
	}else if (type == 'expmat') {
		var mat = req.body.mat,
		  width = req.body.width,
		  height = req.body.height,
		  exprows = req.body.exprows,
		  expcols = req.body.expcols,
		  resol = req.body.resol;
		var file = expmatFile[mat];
		data = expmat.getExpmat(file, width, height, exprows, expcols, resol);
	}
	res.send(data);
});

app.get('/', function(req, res) {
	var type = req.query.type;
	//var nodeId = parseInt(req.query.nodeId);
	console.log('GET', type);

	var data;

  // network queries
	if (type == 'net') {	// (sub) network
    var net = req.query.net.toLowerCase(),
        exp = utils.decodeSpecialChar(req.query.exp),
        file = networkAddr + net + '.bnet';
    data = network.getNet(file, exp);
	} else if (type == 'edges') { // edges incident to one node
    var net = req.query.net.toLowerCase(),
        name = req.query.name,
        file = networkAddr + net + '.bnet';
    data = network.getEdges(file, name);
	} else if (type == 'comb') {
    var net = req.query.net,
        exp = utils.decodeSpecialChar(req.query.exp),
        file = networkAddr + net + '.bnet';
		data = network.getComb(file, exp);
	} else if (type == 'targets') {
    var name = req.query.name,
        net = req.query.net;
        file = networkAddr + net + '.bnet';
    data = networkgetNetTargets(file, name);
  }

  // binding queries
  else if (type == 'exons') {
		var chr = req.query.chr;
		data = binding.getExons(exonFile, chr);
	} else if (type == 'srchexon') {
		var name = req.query.name.toLowerCase();
		data = binding.searchExon(exonFile, name);
	} else if (type == 'binding') {
	  // binding data query [xl, xr], return 200 sample, high resolution binding data
		var xl = req.query.xl,
		    xr = req.query.xr,
		    chr = req.query.chr,
		    name = utils.decodeSpecialChar(req.query.name).toLowerCase(),
		    namecode = genecodes[name];

    var file = wiggleAddr + namecode + '/' + namecode +
      '_treat_afterfiting_chr' + chr + '.bcwig';

		data = binding.getBinding(file, xl, xr);
		data.name = name;
    data.chr = chr;
	} else if (type == 'bindingsmp') { // binding data sampling version (used for histogram overview)
    var xl = req.query.xl,
      xr = req.query.xr,
      chr = req.query.chr,
      name = utils.decodeSpecialChar(req.query.name).toLowerCase(),
      namecode = genecodes[name];

		var file = wiggleAddr + namecode + '/' + namecode +
      '_treat_afterfiting_chr' + chr + '.bcwig';

		data = binding.getBindingSampling(file);
	  data.name = name;
	  data.chr = chr;
	}

	// expression matrix query
	else if (type == 'expmatline') {
		var mat = req.query.mat;
		var name = req.query.name;
		var fileExp = expmatFile[mat], fileTfa = tfamatFile[mat];
		name = name.toLowerCase();
		data = expmat.getExpmatLine(fileExp, fileTfa, name);
	}

  else {
    console.log('invalid argument');
    res.send('');
	}

	res.send(data); // send response

});

// read the namecode file
var codestream = fs.createReadStream(codeFile);
readCodes(codestream);

//http.createServer(app).listen(80);
app.listen(3000);

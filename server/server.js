var runEnv = "laptop";

var express = require('express'),
	fs = require('fs'),
	util = require('util'),
	bodyParser = require('body-parser'),
	Buffer = require('buffer').Buffer,
	constants = require('constants');

var app = express();
app.use(bodyParser.urlencoded({
	extended: true,
	limit: "50mb"
}));
app.use(bodyParser.json({
  limit: "50mb"
}));

var genecodes = {};
var wiggleAddr, networkAddr, expmatAddr;
if(runEnv == "vida"){
	wiggleAddr = "/data/bonneau/wiggle/";
	networkAddr = "/data/bonneau/network/";
	expmatAddr = "/data/bonneau/";
}else if(runEnv == "laptop"){
	wiggleAddr = "E:/bnetvis_data/wiggle/";
	networkAddr = "E:/bnetvis_data/network/";
	expmatAddr = "E:/bnetvis_data/";
}else if(runEnv == "lab"){
	wiggleAddr = "/home/bowen/bnetvis_data/wiggle/";
	networkAddr = "/home/bowen/bnetvis_data/network/";
	expmatAddr = "/home/bowen/bnetvis_data/";
}
var codeFile = wiggleAddr + "namecode";
var exonFile = wiggleAddr + "exons.bin";
var expmatFile = {"B-Subtilis": expmatAddr + "expressionMatrix.bin", "RNA-Seq": expmatAddr + "rnaseq.bin"};
var tfamatFile = {"B-Subtilis": expmatAddr + "tfa.matrix2.bin", "RNA-Seq": null};


// binging data cache, maximum size 4
var numSamples = 1000;
var cacheSize = 4;
var bindingCache = {};
bindingCache.list = new Array();
bindingCache.cache = {};

function buildSegmentTree(nodes, vals){	// vals shall be {x:.., value:..}
	var n = vals.length;
	return buildSegmentTreeExec(nodes, 0, n-1, vals);
}
function buildSegmentTreeExec(nodes, xl, xr, vals){
	if(xr==xl){
		nodes.push(vals[xl].value);
		return;
	}
	nodes.push(0);
	var index = nodes.length-1;
	var xm = (xr+xl)>>1;
	buildSegmentTreeExec(nodes, xl, xm, vals);
	buildSegmentTreeExec(nodes, xm+1, xr, vals);
	//var cntleft = xm-xl+1, cntright = xr-xm;
	//console.log(index, left, index+1, right, index+cntleft*2);
	nodes[index] = Math.max(nodes[index+1], nodes[index+(xm-xl+1)*2]);
}
function querySegmentTree(nodes, index, xl, xr, nodexl, nodexr){
	if(xr < xl) return 0;
	if(xl <= nodexl && xr >= nodexr) return nodes[index];
	var xm = (nodexl+nodexr)>>1;
	return Math.max(querySegmentTree(nodes, index+1, xl, Math.min(xr, xm), nodexl, xm), querySegmentTree(nodes, index+(xm-nodexl+1)*2, Math.max(xm+1, xl), xr, xm+1, nodexr));
}

function readCodes(input){
	var remaining = "";
	input.on('data', function(data){ remaining += data; } );
	input.on('end', function(){
			var w = remaining.split(RegExp(/\s+/));
			for(var i=0;i<w.length;i+=2) genecodes[w[i]] = w[i+1];
		});
}
function readFileToBuf(file){
	if(fs.existsSync(file)==false)  return null;
	var stats = fs.statSync(file);
	var numBytes = stats.size;
	var buf = new Buffer(numBytes);
	var fd = fs.openSync(file, 'r');
	fs.readSync(fd, buf, 0, numBytes, 0);
	return buf;
}
function readExons(buf){
	var result = new Array();
	var offset = 0;
	while(true){
		var lstr = buf.readInt32LE(offset); offset += 4;
		if(lstr==0) break;
		var str = buf.toString('utf8', offset, offset+lstr).split(" ");
		var name = str[0], name2 = str[1], chr = str[2], strand = str[3];
		offset += lstr;
		var txStart = buf.readInt32LE(offset), txEnd = buf.readInt32LE(offset+4),
			cdsStart = buf.readInt32LE(offset+8), cdsEnd = buf.readInt32LE(offset+12),
			exonCount = buf.readInt32LE(offset+16);
		offset += 20;
		var exonRanges = new Array();
		for(var i=0; i<exonCount; i++){
			var s = buf.readInt32LE(offset), t = buf.readInt32LE(offset+4);
			offset += 8;
			exonRanges.push({"start": s, "end": t});
		}
		var exon = {"name": name, "name2": name2, "chr": chr, "strand": strand,
		"txStart": txStart, "txEnd": txEnd, "cdsStart": cdsStart, "cdsEnd": cdsEnd,
		"exonCount": exonCount, "exonRanges": exonRanges};
		result.push(exon);
	}
	return result;
}
function readTfamat(buf){
	var result = {};
	var offset = 0;
	var n = buf.readInt32LE(0), m = buf.readInt32LE(4), lrows = buf.readInt32LE(8), lcols = buf.readInt32LE(12);
	offset += 16;
	var rowstr = buf.toString('utf8', offset, offset+lrows); offset += lrows;
	var colstr = buf.toString('utf8', offset, offset+lcols); offset += lcols;
	result.numrows = n;
	result.numcols = m;
	result.rownames = rowstr.split(" ");
	result.colnames = colstr.split(" ");
	result.values = new Array();
	for(var i=0; i<n; i++){
		for(var j=0; j<m; j++){
			var val = buf.readDoubleLE(offset);
			offset += 8;
			result.values.push(val);
		}
	}
	return result;
}
function readExpmat(buf){
	var result = {};
	var offset = 0;
	var n = buf.readInt32LE(0), m = buf.readInt32LE(4), lrows = buf.readInt32LE(8), lcols = buf.readInt32LE(12);
	offset += 16;
	var rowstr = buf.toString('utf8', offset, offset+lrows); offset += lrows;
	var colstr = buf.toString('utf8', offset, offset+lcols); offset += lcols;
	result.numrows = n;
	result.numcols = m;
	result.rownames = rowstr.split(" ");
	result.colnames = colstr.split(" ");
	result.values = new Array();
	result.min = 1E10; result.max = -1E10;
	for(var i=0; i<n; i++){
		for(var j=0; j<m; j++){
			var val = buf.readDoubleLE(offset);
			offset += 8;
			result.values.push(val);
			result.min = Math.min(result.min, val);
			result.max = Math.max(result.max, val);
		}
	}
	return result;
}
function getExons(res, chr){
	var file = exonFile;
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return;}
	var result = readExons(buf);
	var data = [];
	for(var i=0; i<result.length; i++) if(result[i].chr==chr) data.push(result[i]);
	res.send(data);
}
function getTfamatLine(res, mat, name){
	var file = tfamatFile[mat];
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return;}
	var result = readTfamat(buf);
	name = name.toLowerCase();
	for(var i=0; i<result.rownames.length; i++){
		if(result.rownames[i].toLowerCase() == name) { name = result.rownames[i]; break; }
	}
	var values = new Array();
	for(var j=0; j<result.numcols; j++) values.push(result.values[i*result.numcols + j]);
	console.log("returning tfa line", name);
	var data = {"name": name, "values": values};
	res.send(data);
}
function getExpmatLine(res, mat, name){
	var fileExp = expmatFile[mat], fileTfa = tfamatFile[mat];
	var bufExp = readFileToBuf(fileExp);
	if(fileTfa!=null) bufTfa = readFileToBuf(fileTfa);
	if(bufExp==null){ res.send("[]"); console.error("cannot read file", fileExp); return; }
	if(fileTfa!=null && bufTfa==null){ res.send("[]"); console.error("cannot read file", fileTfa); return; }

	var resultExp = readExpmat(bufExp);
	if(fileTfa!=null) var resultTfa = readTfamat(bufTfa);
	name = name.toLowerCase();
	for(var i=0; i<resultExp.rownames.length; i++) if(resultExp.rownames[i].toLowerCase() == name) { name = resultExp.rownames[i]; break; }
	if(i==resultExp.rownames.length){ res.send("[]"); return; }	// cannot find gene
	var tfaValues = new Array();
	if (fileTfa!=null) {
		var tfai = resultTfa.rownames.indexOf(name);
		if(tfai!=-1){
			for(var j=0; j<resultTfa.numcols; j++){
				var idx = resultExp.colnames.indexOf(resultTfa.colnames[j]);
				tfaValues.push({"value": resultTfa.values[tfai*resultTfa.numcols + j], "index": idx});
			}
			tfaValues.sort(function(a,b){ return a.index-b.index; });
		}
	}

	var values = new Array();
	for(var j=0; j<resultExp.numcols; j++) values.push(resultExp.values[i*resultExp.numcols + j]);
	console.log("returning line", name);
	var data = {"name":name, "values":values, "tfaValues": tfaValues};
	res.send(data);
}
function getExpmat(res, mat, width, height, exprows, expcols, resol){
	if(width==null || height==null){ res.send(""); console.error("width or height is null"); return; }
	var file = expmatFile[mat];
	console.log(mat, file);
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return; }
	var result = readExpmat(buf);

	var expr = null, expc = null;
	try{
		expr = RegExp(exprows, "i");
		expc = RegExp(expcols, "i");
	}catch(e){
		console.log("incorrect regular expression");
		expr = expc = ".*";
	}
	console.log(mat, width, height, expr, expc);

	var selrows = {}, selcols = {},
		selrowids = new Array(), selcolids = new Array(),
		selrownames = new Array(), selcolnames = new Array();
	for(var i=0; i<result.numrows; i++){
		if(result.rownames[i].match(expr)) {
			selrows[i] = true;
			selrowids.push(i);
			selrownames.push(result.rownames[i]);
		}
	}
	for(var i=0; i<result.numcols; i++){
		if(result.colnames[i].match(expc)) {
			selcols[i] = true;
			selcolids.push(i);
			selcolnames.push(result.colnames[i]);
		}
	}
	var numSelrows = selrownames.length, numSelcols = selcolnames.length;
	var values = new Array();
	for(var i=0; i<numSelrows; i++){
		for(var j=0; j<numSelcols; j++){
			values.push(result.values[selrowids[i]*result.numcols+selcolids[j]]);
		}
	}

    resol = Math.max(1, resol);
	var nresol = Math.ceil(height/resol), mresol = Math.ceil(width/resol);
	var n = numSelrows, m = numSelcols; // note that x,y are reversed between svg and matrix data
	var nsmp=true, msmp=true;
	if (n < nresol) nsmp = false;
	else n = nresol;
	if (m < mresol) msmp = false;
	else m = mresol;

	var xl = 0, yl = 0, xr = numSelcols-1E-3, yr = numSelrows-1E-3;
	//if(xr==0) xr=0.9; if(yr==0) yr=0.9;	// prevent overflow
	var data = {};
	var max = 0, min = 1E10;
	var ys = new Array(), xs = new Array();
	for(var i=0; i<=n; i++){
		if (nsmp == false) {
			ys.push(i==n?n-1:i);
		}else{
			var y = yl + i/n*(yr-yl);
			ys.push(y);
		}
	}
	for(var j=0; j<=m; j++){
		if (msmp == false) {
			xs.push(j==m?m-1:j);
		}else{
			var x = xl + j/m*(xr-xl);
			xs.push(x);
		}
	}
	//console.log(nsmp, msmp, xs, ys);
	data.data = new Array();
	for(var i=0; i<n; i++){
		var il = ys[i], ir = ys[i+1];
        il = Math.floor(il); ir = Math.max(il+1, Math.floor(ir));
		for(var j=0; j<m; j++){
			var jl = xs[j], jr = xs[j+1];
            jl = Math.floor(jl); jr = Math.max(jl+1, Math.floor(jr));
			var cnt = 0;
			for(var p=il; p<ir; p++) for(var q=jl; q<jr; q++){
				cnt = Math.max(cnt, values[p*numSelcols + q]);
			}
			max = Math.max(cnt, max);
            min = Math.min(cnt, min);
			data.data.push({"x": j/m*width, "y": i/n*height, "count": cnt});
		}
	}
	data.max = max; data.min = min;
	data.maxAll = result.max; data.minAll = result.min;
	data.numcols = numSelcols;
	data.numrows = numSelrows;
	data.rownames = selrownames;
	data.colnames = selcolnames;
	data.selrows = selrows;
	data.selcols = selcols;
	data.n = n;
	data.m = m;
	console.log("returning size", data.numrows, data.numcols, n, m, max, min);
	res.send(data);
}

function readNet(buf){
	var offset = 0;
	var numNode = buf.readInt32LE(offset), numTF = buf.readInt32LE(offset+4), nameBytes = buf.readInt32LE(offset+8);
	offset += 12;
	var namestr = buf.toString('utf8', offset, offset+nameBytes);
	var names = namestr.split(" ");	// read node names
	offset += nameBytes;
	var nodes = new Array();
	for(var i=0;i<numNode;i++) nodes.push({"id":i, "name": names[i], "isTF":i<numTF?true:false});
	var numEdge = buf.readInt32LE(offset);
	offset += 4;
	var edges = new Array();
	for(var i=0;i<numEdge;i++){
		var s = buf.readInt32LE(offset),
			t = buf.readInt32LE(offset+4),
			w = buf.readDoubleLE(offset+8);
		offset += 16;
		edges.push({"id":i, "source": s, "target": t, "weight": [w]});
	}
	var result = {};
	result.numNode = numNode;
	result.numEdge = numEdge;
	result.nodes = nodes;
	result.edges = edges;
	result.names = names;
	return result;
}
function getNet(res, net, exp){
	console.log(net, exp);
	net = net.toLowerCase();
	var file = networkAddr+net+".bnet";
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return; }
	var result = readNet(buf);
	var nodes = new Array(), edges = new Array();
	var j = 0, mapping = {}; // mapping is used for reindex the nodes
	try{
		exp = RegExp(exp, "i");
	}catch(e){
		exp = "a^";	// return empty network
	}
	for(var i=0;i<result.numNode;i++){
		if(result.names[i].match(exp)!=null){
			var nd = result.nodes[i];
			nd.index = j;
			nodes.push(nd);
			mapping[i] = j++;
		}
	}
	j = 0;
	var wmax = -1E10, wmin = 1E10;
	for(var i=0;i<result.numEdge;i++){
		var s = result.edges[i].source, t = result.edges[i].target, w = result.edges[i].weight;
		wmax = Math.max(w, wmax);
		wmin = Math.min(w, wmin);
		if(mapping[s]!=null && mapping[t]!=null){
			edges.push({"id":i, "index":j++, "source": mapping[s], "target": mapping[t], "weight": [w]});
		}
	}
	console.log("return", nodes.length+"/"+result.numNode, "nodes and", edges.length+"/"+result.numEdge, "edges");
	var data = {};
	data.nodes = nodes;
	data.links = edges;
	data.wmax = wmax;
	data.wmin = wmin;
	res.send(data);
}
function getNetTargets(res, net, name){
	var file = networkAddr+net+".bnet";
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return; }
	var result = readNet(buf);
	var exp = "^"+name+"$";
	for(var i=0; i<result.numEdge; i++){
		var s = result.edges[i].source, t = result.edges[i].target;
		if(result.names[s]==name){
			exp += "|^"+result.names[t]+"$";
		}
	}
	res.send({"exp":exp});
}
function getEdges(res, net, name){
	var file = networkAddr+net+".bnet";
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return; }
	var result = readNet(buf);
	var edges = new Array();
	for(var i=0;i<result.numEdge;i++){
		var s = result.edges[i].source, t = result.edges[i].target, w = result.edges[i].weight;
		if(result.names[s]==name || result.names[t]==name){
			edges.push({"id":i, "source": result.names[s], "target": result.names[t], "weight": w, "sourceId":s, "targetId":t}); // source and target are names
		}
	}
	res.send(edges);
}
function getComb(res, net, exp){
	console.log(net, exp);
	var file = networkAddr+net+".bnet";
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return; }
	var result = readNet(buf);
	try{
		exp = RegExp(exp, "i");
	}catch(e){
		console.log("incorrect regular expression");
		res.send("[]");
		return;
	}
	var tfs = {}, tfcnt = 0, regcnt = {};
	for(var i=0;i<result.numNode;i++){
		var name = result.nodes[i].name;
		regcnt[name] = 0;
		if (result.nodes[i].name.match(exp)) {
			if (tfs[name]==null) {
				tfs[name] = true;
				tfcnt++;
			}
		}
	}
	console.log(tfs, tfcnt);
	for(var i=0;i<result.numEdge;i++){
		var s = result.edges[i].source, t = result.edges[i].target;
		if (tfs[result.nodes[s].name] == true) {
			regcnt[result.nodes[t].name] ++;
		}
	}
	var nodes = [];
	for (var name in regcnt) {
		if (regcnt[name] == tfcnt) {
			nodes.push(name);
		}
	}
	console.log("comb request returns", nodes.length);
	res.send(nodes);
}
function searchExon(res, name){
	var file = exonFile;
	var buf = readFileToBuf(file);
	if(buf==null){ res.send("[]"); console.error("cannot read file", file); return;}
	var result = readExons(buf);
	name = name.toLowerCase();
	for( var i=0;i<result.length; i++){
		if(result[i].name2.toLowerCase() == name){
			res.send({"success":true, "chr":result[i].chr, "txStart": result[i].txStart, "txEnd": result[i].txEnd});
			break;
		}
	}
	res.send({"success": false});
}

function loadHistogram(name, chr){	// return the cached intervals & rmq
	console.log("check cache", name, chr);
	if(bindingCache.cache[name+"*"+chr]!=null) return bindingCache.cache[name+"*"+chr];
	console.log("no cache");

	// read bcwig file
	var file = wiggleAddr+genecodes[name]+"/"+genecodes[name]+"_treat_afterfiting_chr"+chr+".bcwig";
	var buf = readFileToBuf(file);
	if(buf==null){ console.error("cannot read file", file); return null; }

	var n = buf.length/6;
	var offset = 0;
	var segs = new Array();
	for(var i=0; i<n; i++){
		var x = buf.readInt32LE(offset),
			val = buf.readInt16LE(offset+4);
		segs.push({"x":x, "value":val});
		offset += 6; // 1 int, 1 short
	}
	console.log("read complete, cache size", bindingCache.list.length);

	if(bindingCache.list.length==cacheSize){
		console.log("cache full, discarded head element");
		delete bindingCache.cache[bindingCache.list[0]];
		bindingCache.list[0] = null;
		bindingCache.list = bindingCache.list.slice(1); // remove the head element
	}

	var cache = {};
	bindingCache.list.push(name+"*"+chr);
	bindingCache.cache[name+"*"+chr] = cache;

	cache.segs = segs;
	cache.xmin = segs[0].x;
	cache.xmax = segs[segs.length-1].x;
	// build segment tree
	var segfile = wiggleAddr+genecodes[name]+"/"+genecodes[name]+"_treat_afterfiting_chr"+chr+".seg";
	var buf = readFileToBuf(segfile);
	if(buf==null){	// no segtree file, build the tree
		var nodes = new Array();
		buildSegmentTree(nodes, segs, buf);
		cache.nodes = nodes;
		console.log("SegmentTree constructed");

		var buf = new Buffer(4+nodes.length*2);
		buf.writeInt32LE(nodes.length, 0);
		for(var i=0, offset=4; i<nodes.length; i++, offset+=2) buf.writeInt16LE(nodes[i], offset);
		var fd = fs.openSync(segfile, 'w');
		fs.writeSync(fd, buf, 0, offset, 0);
		console.log("SegmentTree written");
	}else{
		var num = buf.readInt32LE(0);
		var nodes = new Array();
		for(var i=0, offset=4; i<num; i++, offset+=2) nodes.push( buf.readInt16LE(offset) );
		cache.nodes = nodes;
		console.log("SegmentTree read");
	}
	return cache;
}

function binarySearch(segs, x){
	var ll = 0, rr = segs.length-1;
	while(ll<=rr){
		var m = (ll+rr)>>1;
		if(segs[m].x > x) rr = m - 1;
		else ll = m + 1;
	}
	if(rr==segs.length) rr = -1; // not found
	return rr;
}

function getBinding(res, name, chr, x1, x2){
	for (var gene in genecodes) {
		if (gene.toLowerCase() == name.toLowerCase()) {
			name = gene;
			break;
		}
	}
	console.log(name, chr, x1, x2);
	var cache = loadHistogram(name, chr);
	if(cache==null){
		console.log("cache load error");
		res.send("[]");	//no file exists
		return;
	}

	if(x1!=null && x2!=null) var xl = parseInt(x1), xr = parseInt(x2);
	else var xl = cache.xmin, xr = cache.xmax;

	// do sampling here, the sampling takes the range maximum for each bar
	// the sampling binary search the entry point, and then query the rmq table
	var hist = {};
	hist.xMin = xl; hist.xMax = xr; hist.name = name; hist.chr = chr; hist.values = new Array();
	var n = numSamples, span = xr-xl, segslen = (cache.nodes.length+1)>>1;
	for(var i=0; i<n; i++){
		var l = xl + i/n*span, r = xl + (i+1)/n*span - 0.1;	// [inclusive, exclusive) range
		var li = binarySearch(cache.segs, l),
			ri = binarySearch(cache.segs, r);
		if(li==-1 && ri!=-1) li = 0;
		else if(li!=-1 && ri==-1) ri = cache.segs.length-1;
		else if(li==-1 && ri==-1){
			hist.values.push({"x": l, "value": 0});
			continue;
		}

		var val = querySegmentTree(cache.nodes, 0, li, ri, 0, segslen-1);
		hist.values.push({"x": l, "value": val});
	}
	console.log("returning", n, "samples of", xl, xr);
	res.send(hist);
}

function getBindingSampling(res, name, chr){
	getBinding(res, name, chr);
}
function decodeSpecialChar(url){
	url = url.replace(/%2B/g, "+");
	url = url.replace(/%3F/g, "?");
	return url;
}


app.post('/', function(req, res){
	var type = req.body.type;
	console.log("POST", type);
	if(type=="net"){
		getNet(res, req.body.net, req.body.exp);
	}else if(type == "expmat"){
		var mat = req.body.mat, width = req.body.width, height = req.body.height, exprows = req.body.exprows, expcols = req.body.expcols, resol = req.body.resol;
		getExpmat(res, mat, width, height, exprows, expcols, resol);
	}
});

app.get('/', function(req, res) {
	var type = req.query.type;
	//var nodeId = parseInt(req.query.nodeId);

	console.log("GET", type);

	if(type == "net"){	// (sub) network
		var net = req.query.net;
		var exp = req.query.exp;
		exp = decodeSpecialChar(exp);
	    getNet(res, net, exp);
	}else if(type == "edges"){ // edges incident to one node
		var net = req.query.net;
		var name = req.query.name;
	    getEdges(res, net, name);
	}else if(type == "comb"){
		var net = req.query.net;
		var exp = req.query.exp;
		exp = decodeSpecialChar(exp);
		getComb(res, net, exp);
	}else if(type == "exons"){
		var chr = req.query.chr;
		getExons(res, chr);
	}else if(type == "srchexon"){
		var name = req.query.name;
		searchExon(res, name);
	}else if(type == "binding"){ // binding data query [xl, xr], return 200 sample, high resolution binding data
		var xl = req.query.xl, xr = req.query.xr;
		var chr = req.query.chr;
		var name = req.query.name;
		name = decodeSpecialChar(name);
		getBinding(res, name, chr, xl, xr);
	}else if(type == "bindingsmp"){ // binding data sampling version (used for histogram overview)
		var name = req.query.name;
		var chr = req.query.chr;
		name = decodeSpecialChar(name);
		getBindingSampling(res, name, chr);
	}else if(type == "expmatline"){
		var mat = req.query.mat;
		var name = req.query.name;
		getExpmatLine(res, mat, name);
	}else if(type=="targets"){
		var name = req.query.name, net = req.query.net;
		getNetTargets(res, net, name);
	}else{
	    console.log("invalid argument");
	    res.send("");
	}

	/*
	else if(type == "targetrange"){ // obsolete, binding data range for edges
		var name = req.query.name;
		getTargetRange(res, name);
	}
	*/

});


// read the namecode file
var codestream = fs.createReadStream(codeFile);
readCodes(codestream);


//http.createServer(app).listen(80);
app.listen(3000);

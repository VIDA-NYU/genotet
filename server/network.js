
// server handler for regulatory network

"use strict";

var utils = require("./utils");

module.exports = {

  readNet: function(buf) {
    var offset = 0;
    var numNode = buf.readInt32LE(offset),
      numTF = buf.readInt32LE(offset+4),
      nameBytes = buf.readInt32LE(offset+8);
    offset += 12;
    var namestr = buf.toString('utf8', offset, offset+nameBytes);
    var names = namestr.split(" "); // read node names
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
  },

  getNet: function(file, exp) {
    console.log(file, exp);
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error("cannot read file", file), [];

    var result = this.readNet(buf);
    var nodes = new Array(), edges = new Array();
    var j = 0, mapping = {}; // mapping is used for reindex the nodes
    try{
      exp = RegExp(exp, "i");
    }catch(e){
      exp = "a^"; // return empty network
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
    return data;
  },

  getNetTargets: function(file, name) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error("cannot read file", file), [];
    var result = readNet(buf);
    var exp = "^"+name+"$";
    for(var i=0; i<result.numEdge; i++){
      var s = result.edges[i].source, t = result.edges[i].target;
      if(result.names[s]==name){
        exp += "|^"+result.names[t]+"$";
      }
    }
    return {
      "exp": exp
    };
  },

  getEdges: function(file, name) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error("cannot read file", file), [];
    var result = readNet(buf);
    var edges = new Array();
    for(var i=0;i<result.numEdge;i++){
      var s = result.edges[i].source, t = result.edges[i].target, w = result.edges[i].weight;
      if(result.names[s]==name || result.names[t]==name){
        edges.push({"id":i, "source": result.names[s], "target": result.names[t], "weight": w, "sourceId":s, "targetId":t}); // source and target are names
      }
    }
    return edges;
  },

  getComb: function(file, exp) {
    console.log(file, exp);
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error("cannot read file", file), [];
    var result = readNet(buf);
    try {
      exp = RegExp(exp, "i");
    } catch(e) {
      return console.error("incorrect regular expression"), [];
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
    return nodes;
  }

};

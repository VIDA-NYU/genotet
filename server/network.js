/**
 * @fileoverview Server handler for regulatory network.
 */

'use strict';

var utils = require('./utils');

module.exports = {

  readNet: function(buf) {
    // Read number of nodes, number of TFs, and number of bytes for node names.
    var numNode = buf.readInt32LE(0);
    var numTF = buf.readInt32LE(4);
    var nameBytes = buf.readInt32LE(8);

    var offset = 12;
    var namestr = buf.toString('utf8', offset, offset + nameBytes);
    var names = namestr.split(' '); // read node names
    offset += nameBytes;

    var nodes = [];
    for (var i = 0; i < numNode; i++) {
      nodes.push({
        id: names[i],
        name: names[i],
        isTF: i < numTF ? true : false
      });
    }
    var numEdge = buf.readInt32LE(offset);
    offset += 4;

    var edges = [];
    for (var i = 0; i < numEdge; i++) {
      var s = buf.readInt32LE(offset);
      var t = buf.readInt32LE(offset + 4);
      var w = buf.readDoubleLE(offset + 8);
      offset += 16;
      edges.push({
        id: names[s] + ',' + names[t],
        source: names[s],
        target: names[t],
        weight: w
      });
    }
    return {
      numNode: numNode,
      numEdge: numEdge,
      nodes: nodes,
      edges: edges,
      names: names
    };
  },

  getNet: function(file, exp) {
    console.log(file, exp);
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];

    var result = this.readNet(buf);
    var nodes = [], nodeKeys = {};
    var edges = [];
    try {
      exp = RegExp(exp, 'i');
    }catch (e) {
      exp = 'a^'; // return empty network
    }
    for (var i = 0; i < result.numNode; i++) {
      if (result.names[i].match(exp) != null) {
        var nd = result.nodes[i];
        nodes.push(nd);
        nodeKeys[result.names[i]] = true;
      }
    }
    var wmax = -Infinity, wmin = Infinity;
    for (var i = 0; i < result.numEdge; i++) {
      var s = result.edges[i].source;
      var t = result.edges[i].target;
      var w = result.edges[i].weight;
      wmax = Math.max(w, wmax);
      wmin = Math.min(w, wmin);
      if (nodeKeys[s] && nodeKeys[t]) {
        edges.push({
          id: result.edges[i].id,
          source: s,
          target: t,
          weight: w
        });
      }
    }
    console.log('return',
      nodes.length + '/'+ result.numNode,
      'nodes and',
      edges.length + '/'+ result.numEdge,
      'edges'
    );

    return {
      nodes: nodes,
      edges: edges,
      wmax: wmax,
      wmin: wmin
    };
  },

  getNetTargets: function(file, name) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = this.readNet(buf);
    var exp = '^'+ name + '$';
    for (var i = 0; i < result.numEdge; i++) {
      var s = result.edges[i].source, t = result.edges[i].target;
      if (result.names[s] == name) {
        exp += '|^'+ result.names[t] + '$';
      }
    }
    return {
      exp: exp
    };
  },

  getEdges: function(file, name) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = this.readNet(buf);
    var edges = new Array();
    for (var i = 0; i < result.numEdge; i++) {
      var s = result.edges[i].source, t = result.edges[i].target, w = result.edges[i].weight;
      if (result.names[s] == name || result.names[t] == name) {
        edges.push({
          id: result.names[s] + ',' + result.names[t],
          source: result.names[s],
          target: result.names[t],
          weight: w,
          sourceId: s,
          targetId: t
        }); // source and target are names
      }
    }
    return edges;
  },

  getComb: function(file, exp) {
    console.log(file, exp);
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = this.readNet(buf);
    try {
      exp = RegExp(exp, 'i');
    } catch (e) {
      return console.error('incorrect regular expression'), [];
    }
    var tfs = {}, tfcnt = 0, regcnt = {};
    for (var i = 0; i < result.numNode; i++) {
      var name = result.nodes[i].name;
      regcnt[name] = 0;
      if (result.nodes[i].name.match(exp)) {
        if (tfs[name] == null) {
          tfs[name] = true;
          tfcnt++;
        }
      }
    }
    console.log(tfs, tfcnt);
    for (var i = 0; i < result.numEdge; i++) {
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
    console.log('comb request returns', nodes.length);
    return nodes;
  }

};

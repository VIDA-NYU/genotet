/**
 * @fileoverview Server handler for regulatory network.
 */

'use strict';

var utils = require('./utils');

module.exports = {
  /**
   * Reads the network data from the buffer.
   * @param {Buffer} buf File buffer of the network data.
   * @returns {{
   *     numNode: number,
   *     numEdge: number,
   *     nodes: !Array,
   *     edges: !Array,
   *     names: !Array<string>
   *   }}
   */
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

  /**
   * Reads and returns the network data.
   * @param {string} file Network file name.
   * @param {string} exp Regex for gene selection.
   * @returns {{
   *     nodes: Array,
   *     edges: Array,
   *     wmax: number,
   *     wmin: number
   *   }} The network data JS object.
   */
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

  /**
   * Gets the genes being targeted by the given gene.
   * @param {string} file Network file name.
   * @param {string} name Regulator gene name.
   * @returns {{exp: string}} Regex selecting the targeted genes.
   */
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

  /**
   * Gets the incident edges of a given gene.
   * @param {string} file Network file name.
   * @param {string} name Gene name of which to get the incident edges.
   * @returns {!Array} Incident edges.
   */
  getEdges: function(file, name) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = this.readNet(buf);
    var edges = [];
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

  /**
   * Finds the combined regulators that regulate the selected genes.
   * @param {string} file Network file name.
   * @param {string} exp Regex selecting the regulated targets.
   * @returns {!Array} The combined regulators.
   */
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
  },

  /**
   * List all the networks in the server
   * @param {string} networkAddr Folder of the network in the server
   * @returns {Array} array of object of each network file
   */
  listNetwork: function(networkAddr) {
    var descFile = networkAddr + 'NetworkInfo';
    var ret = [];
    var buf = utils.readFileToBuf(descFile);
    var descLine = buf.toString().split('\n');
    for (var i = 0; i < descLine.length; i++) {
      var part = descLine[i].split('\t');
      ret.push({
        fileName: part[0],
        networkName: part[1],
        description: part[2]
      });
    }
    return ret;
  }
};

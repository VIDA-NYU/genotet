/**
 * @fileoverview Server handler for regulatory network.
 */

var fs = require('fs');
var utils = require('./utils.js');

/** @type {network} */
module.exports = network;

/**
 * @constructor
 */
function network() {}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   isTF: boolean
 * }}
 */
network.Node;

/**
 * @typedef {{
 *   id: string,
 *   source: string,
 *   target: string,
 *   weight: !Array<number>
 * }}
 */
network.Edge;

/**
 * @typedef {{
 *   numNodes: number,
 *   numEdges: number,
 *   nodes: !Array<!network.Node>,
 *   edges: !Array<!network.Edge>,
 *   names: !Array<string>
 * }}
 */
network.RawNetwork;

/**
 * @typedef {{
 *   nodes: !Array<!Object>,
 *   edges: !Array<!Object>,
 *   weightMax: number,
 *   weightMin: number
 * }}
 */
network.Network;

/** @const */
network.query = {};

/**
 * @typedef {{
 *   networkName: string,
 *   geneRegex: string
 * }}
 */
network.query.Network;

/**
 * @typedef {{
 *   networkName: string,
 *   gene: string
 * }}
 */
network.query.IncidentEdges;

/**
 * @typedef {{
 *   networkName: string,
 *   geneRegex: string
 * }}
 */
network.query.CombinedRegulation;

// Start public APIs
/**
 * @param {!network.query.Network} query
 * @param {string} networkPath
 * @return {?network.Network}
 */
network.query.network = function(query, networkPath) {
  var networkName = query.networkName.toLowerCase();
  var geneRegex = utils.decodeSpecialChar(query.geneRegex);
  var fileType = 'text';
  var file = networkPath + networkName + '.bnet';
  if (fileType == 'text') {
    file = networkPath + networkName;
  }
  geneRegex = geneRegex == '' ? 'a^' : geneRegex;
  return network.getNet_(file, geneRegex, fileType);
};

/**
 * @param {!network.query.IncidentEdges} query
 * @param {string} networkPath
 * @return {!Array<!network.Edge>}
 */
network.query.incidentEdges = function(query, networkPath) {
  var networkName = query.networkName.toLowerCase();
  var gene = query.gene;
  var file = networkPath + networkName;
  return network.getIncidentEdges_(file, gene);
};

/**
 * @param {!network.query.CombinedRegulation} query
 * @param {string} networkPath
 * @return {!Array<!network.Node>}
 */
network.query.combinedRegulation = function(query, networkPath) {
  var networkName = query.networkName;
  var geneRegex = utils.decodeSpecialChar(query.geneRegex);
  var file = networkPath + networkName + '.bnet';
  // TODO(jiaming): fix old file read
  return network.getComb_(file, geneRegex);
};

/**
 * @param {string} networkAddr
 * @return {!Array<{
 *   networkName: string,
 *   description: string
 * }>}
 */
network.query.list = function(networkAddr) {
  return network.listNetwork_(networkAddr);
};
// End public APIs

/**
 * Reads the entire network data from the buffer.
 * @param {!Buffer} buf File buffer of the network data.
 * @return {!network.RawNetwork}
 * @private
 */
network.readNet_ = function(buf) {
  // Read number of nodes, number of TFs, and number of bytes for node names.
  var numNodes = buf.readInt32LE(0);
  var numTFs = buf.readInt32LE(4);
  var nameBytes = buf.readInt32LE(8);

  var offset = 12;
  var namestr = buf.toString('utf8', offset, offset + nameBytes);
  var names = namestr.split(' '); // read node names
  offset += nameBytes;

  var nodes = [];
  for (var i = 0; i < numNodes; i++) {
    nodes.push({
      id: names[i],
      name: names[i],
      isTF: i < numTFs ? true : false
    });
  }
  var numEdges = buf.readInt32LE(offset);
  offset += 4;

  var edges = [];
  for (var i = 0; i < numEdges; i++) {
    var s = buf.readInt32LE(offset);
    var t = buf.readInt32LE(offset + 4);
    var w = buf.readDoubleLE(offset + 8);
    offset += 16;
    var weight = [];
    weight.push(w);
    edges.push({
      id: names[s] + ',' + names[t],
      source: names[s],
      target: names[t],
      weight: weight
    });
  }
  return {
    numNodes: numNodes,
    numEdges: numEdges,
    nodes: nodes,
    edges: edges,
    names: names
  };
};

/**
 * Gets the network data according to the gene selection.
 * @param {string} file Network file name.
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} fileType 'text' or 'bin'.
 * @return {?network.Network} The network data object.
 * @private
 */
network.getNet_ = function(file, geneRegex, fileType) {
  console.log(file, geneRegex);
  var result;
  if (fileType == 'bin') {
    var buf = utils.readFileToBuf(file);
    if (buf == null) {
      console.error('cannot read file', file);
      return null;
    }
    result = network.readNet_(buf);
  } else if (fileType == 'text') {
    result = network.readNetwork_(file);
  }

  var nodes = [], nodeKeys = {};
  var edges = [];
  var regex;
  try {
    regex = RegExp(geneRegex, 'i');
  } catch (e) {
    regex = 'a^'; // return empty network
  }

  var numNode = result.nodes.length;
  var numEdge = result.edges.length;
  for (var i = 0; i < numNode; i++) {
    if (result.names[i].match(regex) != null) {
      var nd = result.nodes[i];
      nodes.push(nd);
      nodeKeys[result.names[i]] = true;
    }
  }
  var wmax = -Infinity, wmin = Infinity;
  for (var i = 0; i < numEdge; i++) {
    var s = result.edges[i].source;
    var t = result.edges[i].target;
    var w = result.edges[i].weight;
    for (var j = 0; j < w.length; j++) {
      wmax = Math.max(w[j], wmax);
      wmin = Math.min(w[j], wmin);
    }
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
    nodes.length + '/' + result.numNodes,
    'nodes and',
    edges.length + '/' + result.numEdges,
    'edges'
  );

  return {
    nodes: nodes,
    edges: edges,
    valueNames: result.valueNames,
    weightMax: wmax,
    weightMin: wmin
  };
};

/**
 * Gets the incident edges of a given gene.
 * @param {string} file Network file name.
 * @param {string} gene Gene name of which to get the incident edges.
 * @return {!Array<!network.Edge>} Incident edges.
 * @private
 */
network.getIncidentEdges_ = function(file, gene) {
  var result = network.readNetwork_(file);
  gene = gene.toLowerCase();
  var edges = [];
  result.edges.forEach(function(edge) {
    if (edge.source.toLowerCase() == gene ||
        edge.target.toLowerCase() == gene) {
      edges.push(edge);
    }
  });
  return edges;
};

/**
 * Finds the genes regulated by all the given TFs.
 * @param {string} file Network file name.
 * @param {string} exp Regex selecting the regulated targets.
 * @return {!Array<!network.Node>} The combined regulators.
 * @private
 */
network.getComb_ = function(file, exp) {
  console.log(file, exp);
  var buf = utils.readFileToBuf(file);
  if (buf == null) {
    console.error('cannot read file', file);
    return [];
  }
  var result = network.readNet_(buf);
  var regex;
  try {
    regex = RegExp(exp, 'i');
  } catch (e) {
    console.error('incorrect regular expression');
    return [];
  }
  var tfs = {}, tfcnt = 0, regcnt = {};
  for (var i = 0; i < result.numNodes; i++) {
    var name = result.nodes[i].name;
    regcnt[name] = 0;
    if (result.nodes[i].name.match(regex)) {
      if (tfs[name] == null) {
        tfs[name] = true;
        tfcnt++;
      }
    }
  }
  console.log(tfs, tfcnt);
  for (var i = 0; i < result.numEdges; i++) {
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
};

/**
 * Read network from a .tsv file.
 * @param {string} networkFile path to the .tsv network file.
 * @return {Object} data of the network.
 * @private
 */
network.readNetwork_ = function(networkFile) {
  var validFile = true;
  var ret = {};
  var edges = [];
  var nodes = [];
  var names = [];
  var nodeId = {};
  var isFirst = true;
  var valueNames = [];
  var lines = fs.readFileSync(networkFile).toString().split('\n');
  for (var lineNum in lines) {
    var line = lines[lineNum];
    if (!validFile) continue;
    var parts = line.split(/[\t\s]+/);
    if (parts.length < 3) {
      validFile = false;
      continue;
    }
    if (isFirst) {
      isFirst = false;
      for (var i = 2; i < parts.length; i++) {
        valueNames.push(parts[i]);
      }
      continue;
    }
    var numbers = [];
    for (var i = 2; i < parts.length; i++) {
      numbers.push(parseFloat(parts[i]));
    }
    if (nodeId.hasOwnProperty(parts[0])) {
      nodes[nodeId[parts[0]]].isTF = true;
    } else {
      names.push(parts[0]);
      nodes.push({
        id: parts[0],
        label: parts[0],
        isTF: true
      });
      nodeId[parts[0]] = nodes.length - 1;
    }
    if (!nodeId.hasOwnProperty(parts[1])) {
      names.push(parts[1]);
      nodes.push({
        id: parts[1],
        label: parts[1],
        isTF: false
      });
      nodeId[parts[0]] = nodes.length - 1;
    }
    edges.push({
      id: parts[0] + ',' + parts[1],
      source: parts[0],
      target: parts[1],
      weight: numbers
    });
  }
  ret.nodes = nodes;
  ret.edges = edges;
  ret.names = names;
  ret.numNodes = nodes.length;
  ret.numEdges = edges.length;
  ret.valueNames = valueNames;

  return ret;
};

/**
 * List all the networks in the server
 * @param {string} networkAddr Folder of the network in the server
 * @return {!Array<{
 *   networkName: string,
 *   description: string
 * }>} Array of network file info.
 * @private
 */
network.listNetwork_ = function(networkAddr) {
  var folder = networkAddr;
  var ret = [];
  var files = fs.readdirSync(folder);
  for (var i = 0; i < files.length; i++) {
    var stat = fs.lstatSync(folder + files[i]);
    if (!stat.isDirectory) {
      if (files[i].indexOf('.txt') != -1) {
        var fname = files[i].substr(0, files[i].length - 4);
        var description = '';
        var fd = fs.openSync(folder + files[i]);
        fs.readSync(fd, description);
        ret.push({
          networkName: fname,
          description: description.toString()
        });
      }
    }
  }
  return ret;
};

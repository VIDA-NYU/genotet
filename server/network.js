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
 *   label: string,
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
 *   fileName: string,
 *   genes: !Array<string>
 * }}
 */
network.query.Network;

/**
 * @typedef {{
 *   fileName: string,
 *   gene: string
 * }}
 */
network.query.IncidentEdges;

/**
 * @typedef {{
 *   fileName: string,
 *   geneRegex: string
 * }}
 */
network.query.CombinedRegulation;

/**
 * @typedef {{
 *   fileName: string,
 *   genes: !Array<string>,
 *   nodes: !Array<!network.Node>
 * }}
 */
network.query.IncrementalEdges;

/**
 * @typedef {{
 *   fileName: string
 * }}
 */
network.query.AllNodes;

// Start public APIs
/**
 * @param {!network.query.Network} query
 * @param {string} networkPath
 * @return {?network.Network}
 */
network.query.network = function(query, networkPath) {
  var fileName = query.fileName;
  var file = networkPath + fileName;
  return network.getNet_(file, query.genes);
};

/**
 * @param {!network.query.IncidentEdges} query
 * @param {string} networkPath
 * @return {!Array<!network.Edge>}
 */
network.query.incidentEdges = function(query, networkPath) {
  var fileName = query.fileName;
  var gene = query.gene;
  var file = networkPath + fileName;
  return network.getIncidentEdges_(file, gene);
};

/**
 * @param {!network.query.CombinedRegulation} query
 * @param {string} networkPath
 * @return {!Array<!network.Node>}
 */
network.query.combinedRegulation = function(query, networkPath) {
  var fileName = query.fileName;
  var geneRegex = utils.decodeSpecialChar(query.geneRegex);
  var file = networkPath + fileName;
  // TODO(jiaming): fix old file read
  return network.getComb_(file, geneRegex);
};

/**
 * @param {!network.query.IncrementalEdges} query
 * @param {string} networkPath
 * @return {{
 *   edges: !Array<!network.Edge>
 * }}
 */
network.query.incrementalEdges = function(query, networkPath) {
  var fileName = query.fileName;
  var genes = query.genes;
  var file = networkPath + fileName;
  var nodes = query.nodes;
  return network.incrementalEdges_(file, genes, nodes);
};

/**
 * @param {string} networkPath
 * @return {!Array<{
 *   networkName: string,
 *   description: string
 * }>}
 */
network.query.list = function(networkPath) {
  return network.listNetwork_(networkPath);
};

/**
 * @param {!network.query.AllNodes} query
 * @param {string} networkPath
 * @return {{
 *   nodes: !Array<!network.Node>
 * }}
 */
network.query.allNodes = function(query, networkPath) {
  var file = networkPath + query.fileName;
  return network.allNodes_(file);
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
 * @param {!Array<string>} genes Genes for gene selection.
 * @return {?network.Network} The network data object.
 * @private
 */
network.getNet_ = function(file, genes) {
  console.log('get network', file);
  var result = network.readNetwork_(file);

  var nodes = [], nodeKeys = {};
  var edges = [];
  genes.forEach(function(gene) {
    nodeKeys[gene] = true;
  });

  var numNode = result.nodes.length;
  var numEdge = result.edges.length;
  for (var i = 0; i < numNode; i++) {
    if (result.nodes[i].id in nodeKeys) {
      var nd = result.nodes[i];
      nodes.push(nd);
    }
  }

  var wmax = -Infinity, wmin = Infinity;
  for (var i = 0; i < numEdge; i++) {
    var s = result.edges[i].source;
    var t = result.edges[i].target;
    var w = result.edges[i].weight;
    if (s in nodeKeys && t in nodeKeys) {
      for (var j = 0; j < w.length; j++) {
        wmax = Math.max(w[j], wmax);
        wmin = Math.min(w[j], wmin);
      }
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
  console.log('get combination', file, exp);
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
    var name = result.nodes[i].id;
    regcnt[name] = 0;
    if (result.nodes[i].id.match(regex)) {
      if (tfs[name] == null) {
        tfs[name] = true;
        tfcnt++;
      }
    }
  }
  console.log(tfs, tfcnt);
  for (var i = 0; i < result.numEdges; i++) {
    var s = result.edges[i].source, t = result.edges[i].target;
    if (tfs[result.nodes[s].id] == true) {
      regcnt[result.nodes[t].id]++;
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
 * Reads network from a .tsv file.
 * @param {string} networkFile path to the .tsv network file.
 * @return {!network.RawNetwork} Data of the network.
 * @private
 */
network.readNetwork_ = function(networkFile) {
  var validFile = true;
  var edges = [];
  var nodes = [];
  var names = [];
  var nodeId = {};
  var isFirst = true;
  var valueNames = [];
  var lines = fs.readFileSync(networkFile).toString().split('\n');
  lines.forEach(function(line) {
    if (!validFile) {
      return;
    }
    var parts = line.split(/[\t\s]+/);
    var source = parts[0];
    var target = parts[1];
    if (parts.length < 3) {
      validFile = false;
      return;
    }
    if (isFirst) {
      isFirst = false;
      for (var i = 2; i < parts.length; i++) {
        valueNames.push(parts[i]);
      }
      return;
    }
    var numbers = [];
    for (var i = 2; i < parts.length; i++) {
      numbers.push(parseFloat(parts[i]));
    }
    if (source in nodeId) {
      nodes[nodeId[source]].isTF = true;
    } else {
      names.push(source);
      nodes.push({
        id: source,
        label: source,
        isTF: true
      });
      nodeId[source] = nodes.length - 1;
    }
    if (!(target in nodeId)) {
      names.push(target);
      nodes.push({
        id: target,
        label: target,
        isTF: false
      });
      nodeId[target] = nodes.length - 1;
    }
    edges.push({
      id: source + ',' + target,
      source: source,
      target: target,
      weight: numbers
    });
  });

  return {
    nodes: nodes,
    edges: edges,
    names: names,
    numNodes: nodes.length,
    numEdges: edges.length,
    valueNames: valueNames
  };
};

/**
 * Lists all the networks in the server.
 * @param {string} networkPath Folder of the network in the server.
 * @return {!Array<{
 *   networkName: string,
 *   description: string
 * }>} Array of network file info.
 * @private
 */
network.listNetwork_ = function(networkPath) {
  var folder = networkPath;
  var ret = [];
  var files = fs.readdirSync(folder);
  files.forEach(function(file) {
    if (file.indexOf('.txt') != -1) {
      var fname = file.substr(0, file.length - 4);
      var content = fs.readFileSync(folder + file, 'utf8')
        .toString().split('\n');
      var networkName = content[0];
      var description = content.slice(1).join('');
      ret.push({
        fileName: fname,
        networkName: networkName,
        description: description
      });
    }
  });
  return ret;
};

/**
 * Finds all edges connecting the gene to other exist genes.
 * @param {string} file Network file path.
 * @param {!Array<string>} genes Genes to add to the graph.
 * @param {!Array<!network.Node>} nodes Nodes that already in the network.
 * @return {{
 *   edges: !Array<!network.Edge>
 * }} Edges between the new gene and network.
 * @private
 */
network.incrementalEdges_ = function(file, genes, nodes) {
  var oldNodes = {};
  nodes.forEach(function(node) {
    oldNodes[node.id] = true;
  });
  var newNodes = {};
  genes.forEach(function(gene) {
    if (!(gene in oldNodes)) {
      newNodes[gene] = true;
    }
  });
  var result = network.readNetwork_(file);
  var edges = result.edges.filter(function(edge) {
    return ((edge.source in newNodes && edge.target in oldNodes) ||
    (edge.source in oldNodes && edge.target in newNodes) ||
    (edge.source in newNodes && edge.target in newNodes));
  });
  return {
    edges: edges
  };
};

/**
 * Gets the nodes info for the whole network.
 * @param {string} file File path of the network.
 * @return {{
 *   nodes: !Array<!network.Node>
 * }} The node info.
 * @private
 */
network.allNodes_ = function(file) {
  var data = network.readNetwork_(file);
  return {
    nodes: data.nodes
  };
};

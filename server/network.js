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

/** @enum {string} */
network.QueryType = {
  NETWORK: 'network',
  NETWORK_INFO: 'network-info',
  INCIDENT_EDGES: 'incident-edges',
  COMBINED_REGULATION: 'combined-regulation',
  INCREMENTAL_EDGES: 'incremental-edges',
  LIST_NETWORK: 'list-network'
};

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
 *   genes: !Array<string>
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
  var file = networkPath + fileName + '.data';
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
  var file = networkPath + fileName + '.data';
  return network.getIncidentEdges_(file, gene);
};

/**
 * @param {!network.query.CombinedRegulation} query
 * @param {string} networkPath
 * @return {!Array<string>}
 */
network.query.combinedRegulation = function(query, networkPath) {
  var fileName = query.fileName;
  var file = networkPath + fileName + '.data';
  return network.getCombinedRegulation_(file, query.genes);
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
  var file = networkPath + fileName + '.data';
  var nodes = query.nodes;
  return network.incrementalEdges_(file, genes, nodes);
};

/**
 * @param {string} networkPath
 * @return {!Array<{
 *   fileName: string,
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
  var file = networkPath + query.fileName + '.data';
  return network.allNodes_(file);
};
// End public APIs

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
    nodeKeys[gene.toLowerCase()] = true;
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
    if (edge.source == gene || edge.target == gene) {
      edges.push(edge);
    }
  });
  return edges;
};

/**
 * Finds the genes regulated by all the given TFs.
 * @param {string} file Network file name.
 * @param {!Array<string>} genes Genes selecting the regulated targets.
 * @return {!Array<string>} The combined regulators.
 * @private
 */
network.getCombinedRegulation_ = function(file, genes) {
  console.log('get combination', file);
  var result = network.readNetwork_(file);
  var geneMap = {};
  genes.forEach(function(gene) {
    geneMap[gene] = true;
  });
  var tfs = {}, tfcnt = 0, regcnt = {};
  result.nodes.forEach(function(node) {
    var nodeId = node.id;
    regcnt[nodeId] = 0;
    if (nodeId in geneMap) {
      tfs[nodeId] = true;
      tfcnt++;
    }
  });
  result.edges.forEach(function(edge) {
    var source = edge.source;
    var target = edge.target;
    if (source in tfs) {
      console.log(source + ' ' + target);
      regcnt[target]++;
    }
  });
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
    if (parts.length < 2) {
      return;
    }
    if (isFirst) {
      isFirst = false;
      for (var i = 2; i < parts.length; i++) {
        valueNames.push(parts[i]);
      }
      return;
    }
    var source = parts[0];
    var target = parts[1];
    var sourceLowerCase = source.toLowerCase();
    var targetLowerCase = target.toLowerCase();
    if (parts.length < 3) {
      validFile = false;
      return;
    }
    var numbers = [];
    for (var i = 2; i < parts.length; i++) {
      numbers.push(parseFloat(parts[i]));
    }
    if (source in nodeId) {
      nodes[nodeId[source]].isTF = true;
    } else {
      names.push(sourceLowerCase);
      nodes.push({
        id: sourceLowerCase,
        label: source,
        isTF: true
      });
      nodeId[source] = nodes.length - 1;
    }
    if (!(target in nodeId)) {
      names.push(targetLowerCase);
      nodes.push({
        id: targetLowerCase,
        label: target,
        isTF: false
      });
      nodeId[target] = nodes.length - 1;
    }
    edges.push({
      id: sourceLowerCase + ',' + targetLowerCase,
      source: sourceLowerCase,
      target: targetLowerCase,
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
 *   fileName: string,
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
    if (file.lastIndexOf('.data') > 0 &&
      file.lastIndexOf('.data') == file.length - 5) {
      var fileName = file.replace(/\.data$/, '');
      var networkName = '';
      var description = '';
      var descriptionFile = folder + fileName + '.desc';
      if (fs.existsSync(descriptionFile)) {
        var content = fs.readFileSync(descriptionFile, 'utf8')
          .toString().split('\n');
        networkName = content[0];
        description = content.slice(1).join('');
      }
      ret.push({
        fileName: fileName,
        networkName: networkName,
        description: description
      });
    }
  });
  return ret;
};

/**
 * Finds all edges connecting the gene to other existing genes.
 * @param {string} file Network file path.
 * @param {!Array<string>} genes Genes to add to the graph.
 * @param {!Array<!network.Node>} nodes Nodes that are already in the network.
 * @return {{
 *   edges: !Array<!network.Edge>
 * }} Edges between the new gene and the existing network genes.
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

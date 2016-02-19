/**
 * @fileoverview Gene regulatory network data loader.
 */

'use strict';

/**
 * NetworkLoader loads the gene regulatory network data.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewLoader}
 * @constructor
 */
genotet.NetworkLoader = function(data) {
  genotet.NetworkLoader.base.constructor.call(this, data);

  _.extend(this.data, {
    network: null,
    networkInfo: {
      fileName: null
    }
  });
};

genotet.utils.inherit(genotet.NetworkLoader, genotet.ViewLoader);

/**
 * Loads the network data, adding the genes given by geneRegex.
 * @param {string} fileName Network File name.
 * @param {string} inputGenes The input genes.
 * @param {boolean} isRegex Whether inputGene is regex.
 * @override
 */
genotet.NetworkLoader.prototype.load = function(fileName, inputGenes, isRegex) {
  var genes = this.prepareGenes_(inputGenes, isRegex);
  this.data.genes = genes;
  this.loadNetwork_(fileName, genes);
};

/**
 * Prepares gene array for the input gene string and isRegex.
 * @param {string} inputGenes Input string for genes.
 * @param {boolean} isRegex If inputGene is regex.
 * @return {!Array<string>}
 * @private
 */
genotet.NetworkLoader.prototype.prepareGenes_ = function(inputGenes, isRegex) {
  var genes = [];
  if (isRegex) {
    var regex;
    try {
      regex = RegExp(inputGenes, 'i');
    } catch (e) {
      genotet.error('invalid gene regex', inputGenes);
      return [];
    }
    this.data.networkInfo.nodes.forEach(function(node) {
      if (node.id.match(regex)) {
        genes.push(node.id);
      }
    });
  } else {
    genes = inputGenes.toLowerCase().split(/[\s,]+/).filter(function(gene) {
        return gene in this.data.networkInfo.isTF;
    }.bind(this));
  }
  return genes;
};

/**
 * Gets the network info.
 * @param {string} fileName File name of the network.
 */
genotet.NetworkLoader.prototype.loadNetworkInfo = function(fileName) {
  var params = {
    type: genotet.QueryType.NETWORK_INFO,
    fileName: fileName
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.networkInfo = $.extend({}, this.data.networkInfo, data);
    this.data.networkInfo.nodeLabel = {};
    this.data.networkInfo.isTF = {};
    this.data.networkInfo.nodes.forEach(function(node) {
      this.data.networkInfo.nodeLabel[node.id] = node.label;
      this.data.networkInfo.isTF[node.id] = node.label;
    }, this);
    this.signal('infoLoaded');
  }.bind(this), 'cannot load network info');
};

/**
 * Implements the network loading ajax call.
 * @param {string} fileName File Name of the network.
 * @param {!Array<string>} genes Genes that selects the gene set.
 * @private
 */
genotet.NetworkLoader.prototype.loadNetwork_ = function(fileName, genes) {
  var params = {
    type: genotet.QueryType.NETWORK,
    fileName: fileName,
    genes: genes
  };

  this.get(genotet.data.serverURL, params, function(data) {
    if (!genes.length) {
      genotet.warning('input gene not found');
      return;
    }
    // Store the last applied fileName and genes.
    _.extend(data, {
      fileName: fileName,
      genes: genes,
      edgeMap: {}
    });

    this.data.network = data;
    this.buildEdgeMap_();
  }.bind(this), 'cannot load network');
};

/**
 * Updates the genes in the current network.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} inputGenes Genes that selects the genes to be updated.
 * @param {boolean} isRegex Whether update is based on regex.
 */
genotet.NetworkLoader.prototype.updateGenes = function(method, inputGenes,
                                                       isRegex) {
  var genes = this.prepareGenes_(inputGenes, isRegex);
  if (!genes.length) {
    genotet.warning('no valid genes found');
    return;
  }

  switch (method) {
    case 'set':
      this.loadNetwork_(this.data.networkInfo.fileName, genes);
      break;
    case 'add':
      this.addGenes_(genes);
      break;
    case 'remove':
      this.deleteGenes_(genes);
      this.signal('hideNode', genes);
      break;
  }
};

/**
 * Fetches the incident edges of a given node.
 * @param {!genotet.NetworkNode} node Node of which the incident
 * edges are queried.
 */
genotet.NetworkLoader.prototype.incidentEdges = function(node) {
  var params = {
    type: genotet.QueryType.INCIDENT_EDGES,
    fileName: this.data.networkInfo.fileName,
    gene: node.id
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.incidentEdges = data;
    this.signal('incidentEdges');
  }.bind(this), 'cannot get incident edges');
};

/**
 * Adds genes to the network, and the edges to the original graph.
 * @param {!Array<string>} genes Names of the genes.
 * @private
 */
genotet.NetworkLoader.prototype.addGenes_ = function(genes) {
  var oldGenes = genotet.utils.keySet(
    this.data.network.nodes.map(function(node) {
      return node.id;
    }));
  var newGenes = genes.filter(function(gene) {
    return !(gene in oldGenes);
  });

  if (!newGenes.length) {
    genotet.warning('genes are already in the network');
    return;
  }

  var params = {
    type: genotet.QueryType.INCREMENTAL_EDGES,
    fileName: this.data.networkInfo.fileName,
    genes: newGenes,
    nodes: this.data.network.nodes
  };

  this.get(genotet.data.serverURL, params, function(data) {
    this.data.network.nodes = this.data.network.nodes
      .concat(newGenes.map(function(gene) {
      return {
        id: gene,
        label: this.data.networkInfo.nodeLabel[gene],
        isTF: this.data.networkInfo.isTF[gene]
      };
      }.bind(this)));
    this.data.network.edges = this.data.network.edges.concat(data.edges);
  }.bind(this), 'cannot add genes');
};

/**
 * Deletes genes from graph and related edges.
 * @param {!Array<string>} genes Names of the genes.
 * @private
 */
genotet.NetworkLoader.prototype.deleteGenes_ = function(genes) {
  var geneMap = genotet.utils.keySet(genes);
  // delete the nodes
  this.data.network.nodes = this.data.network.nodes.filter(function(node) {
    return !(node.id in geneMap);
  });
  // delete the edges
  this.data.network.edges = this.data.network.edges.filter(function(edge) {
    return !(edge.source in geneMap) && !(edge.target in geneMap);
  });
};

/**
 * Adds edges to the network.
 * @param {!Array<!genotet.NetworkEdge>} edges Edges to be add into network.
 */
genotet.NetworkLoader.prototype.addEdges = function(edges) {
  edges.forEach(function(edge) {
    var source = edge.source;
    var target = edge.target;
    var weight = edge.weight;
    var sourceExists = false, targetExists = false;
    this.data.network.nodes.forEach(function(node) {
      if (source == node.id) {
        sourceExists = true;
      }
      if (target == node.id) {
        targetExists = true;
      }
    });
    if (!sourceExists) {
      this.data.network.nodes.push({
        id: source,
        label: this.data.networkInfo.nodeLabel[source],
        isTF: true
      });
    }
    if (!targetExists) {
      this.data.network.nodes.push({
        id: target,
        label: this.data.networkInfo.nodeLabel[target],
        isTF: this.data.networkInfo.isTF[target]
      });
    }
    this.data.network.edges.push({
      id: source + ',' + target,
      source: source,
      target: target,
      weight: weight
    });
  }, this);
  this.buildEdgeMap_();
};

/**
 * Deletes edges from the network.
 * @param {!Array<!genotet.NetworkEdge>} edges Edges to be deleted.
 */
genotet.NetworkLoader.prototype.deleteEdges = function(edges) {
  var edgeMap = genotet.utils.keySet(edges.map(function(edge) {
    return edge.id;
  }));
  this.data.network.edges = this.data.network.edges.filter(function(edge) {
    return !(edge.id in edgeMap);
  });
  this.buildEdgeMap_();
};

/**
 * Builds the edge map from edge id to edge.
 * @private
 */
genotet.NetworkLoader.prototype.buildEdgeMap_ = function() {
  this.data.network.edgeMap = {};
  this.data.network.edges.forEach(function(edge) {
    this.data.network.edgeMap[edge.id] = edge;
  }, this);
};

/**
 * Finds the combined regulation genes and adds them into the network.
 * @param {string} inputGenes Input genes for combined regulation.
 * @param {boolean} isRegex Whether combined regulation is based on regex.
 */
genotet.NetworkLoader.prototype.loadCombinedRegulation = function(inputGenes,
                                                           isRegex) {
  var genes = this.prepareGenes_(inputGenes, isRegex);
  var params = {
    type: genotet.QueryType.COMBINED_REGULATION,
    fileName: this.data.networkInfo.fileName,
    genes: genes
  };

  if (!genes.length) {
    genotet.warning('cannot find genes in the network');
    return;
  }

  this.get(genotet.data.serverURL, params, function(data) {
    this.addGenes_(data);
  }.bind(this), 'can not get combined regulation');
};

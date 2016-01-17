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
};

genotet.utils.inherit(genotet.NetworkLoader, genotet.ViewLoader);

/**
 * Loads the network data, adding the genes given by geneRegex.
 * @param {string} fileName Network File name.
 * @param {string} inputGene The input genes.
 * @param {boolean} isRegex If inputGene is regex representation.
 * @override
 */
genotet.NetworkLoader.prototype.load = function(fileName, inputGene, isRegex) {
  var genes = this.prepareGene_(inputGene, isRegex);
  this.data.genes = genes;
  this.loadNetwork_(fileName, genes);
};

/**
 * Prepares gene array for the input gene string and isRegex.
 * @param {string} inputGene Input string for genes.
 * @param {boolean} isRegex If inputGene is regex.
 * @return {!Array<string>}
 * @private
 */
genotet.NetworkLoader.prototype.prepareGene_ = function(inputGene, isRegex) {
  var genes = [];
  if (isRegex) {
    var regex;
    try {
      regex = RegExp(inputGene, 'i');
    } catch (e) {
      genotet.error('invalid gene regex', inputGene);
      return [];
    }
    genes = _.filter(this.data.networkInfo.nodes, function(node) {
      return node.id.match(regex);
    });
  } else {
    genes = inputGene.split(',');
  }
  return genes;
};

/**
 * Gets the network info.
 * @param {string} fileName File name of the network.
 */
genotet.NetworkLoader.prototype.loadNetworkInfo = function(fileName) {
  var params = {
    type: 'network-info',
    fileName: fileName
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.networkInfo = data;
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
    type: 'network',
    fileName: fileName,
    genes: genes
  };
  this.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied fileName and genes.

    if (data.genes.length == 0) {
      genotet.warning('input gene not found');
      return;
    }

    _.extend(data, {
      fileName: fileName,
      genes: genes
    });
    this.data.network = data;
  }.bind(this), 'cannot load network');
};

/**
 * Updates the genes in the current network.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} inputGene Genes that selects the genes to be updated.
 * @param {boolean} isRegex Update is based on regex or not.
 */
genotet.NetworkLoader.prototype.updateGenes = function(method, inputGene,
                                                       isRegex) {
  var genes = this.prepareGene_(inputGene, isRegex);
  switch (method) {
    case 'set':
      this.loadNetwork_(this.data.network.fileName, genes);
      break;
    case 'add':
      this.addGene_(genes);
      break;
    case 'remove':
      this.deleteGene_(genes);
      break;
  }
};

/**
 * Fetches the incident edges of a given node.
 * @param {!Object} node Node of which the incident edges are queried.
 */
genotet.NetworkLoader.prototype.incidentEdges = function(node) {
  var params = {
    type: 'incident-edges',
    fileName: this.data.network.fileName,
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
genotet.NetworkLoader.prototype.addGene_ = function(genes) {
  var oldGenes = {};
  this.data.network.nodes.forEach(function(node) {
    oldGenes[node.id] = true;
  });
  var newGenes = [];
  genes.forEach(function(gene) {
    if (!(gene in oldGenes)) {
      newGenes.push(gene);
    }
  });

  if (newGenes.length == 0) {
    genotet.warning('Genes are already in graph');
    return;
  }

  var params = {
    type: 'add-gene',
    fileName: this.data.network.fileName,
    gene: newGenes,
    nodes: this.data.network.nodes
  };

  this.get(genotet.data.serverURL, params, function(data) {
    var isTF = {};
    this.data.networkInfo.nodes.forEach(function(node) {
      isTF[node.id] = node.isTF;
    });
    newGenes.forEach(function(gene) {
      this.data.network.nodes.push({
        id: gene,
        name: gene,
        isTF: isTF[gene]
      });
    }.bind(this));
    data.edges.forEach(function(edge) {
      this.data.network.edges.push(edge);
    }.bind(this));
  }.bind(this), 'cannot add one gene');
};

/**
 * Delete one gene from graph and related edges.
 * @param {!Array<string>} genes Names of the genes.
 * @private
 */
genotet.NetworkLoader.prototype.deleteGene_ = function(genes) {
  var geneMap = {};
  genes.forEach(function(gene) {
    geneMap[gene] = true;
  });
  // delete the node
  for (var i = 0; i < this.data.network.nodes.length; i++) {
    if (this.data.network.nodes[i].id in geneMap) {
      this.data.network.nodes.splice(i);
      break;
    }
  }
  // delete the edges
  for (var i = this.data.network.edges.length - 1; i >= 0; i--) {
    if (this.data.network.edges[i].source in geneMap ||
      this.data.network.edges[i].target in geneMap) {
      this.data.network.edges.splice(i);
    }
  }
};

/**
 * Add one edge to the graph.
 * @param {string} source Source of the edge.
 * @param {string} target Target of the edge.
 * @param {!Array<number>} weight Weights of the edge.
 */
genotet.NetworkLoader.prototype.addOneEdge = function(source, target, weight) {
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
      name: source,
      isTF: true
    });
  }
  if (!targetExists) {
    var isTF = false;
    this.data.networkInfo.nodes.forEach(function(node) {
      if (target == node.id) {
        isTF = node.isTF;
      }
    });
    this.data.network.nodes.push({
      id: target,
      name: target,
      isTF: isTF
    });
  }

  this.data.network.edges.push({
    id: source + ',' + target,
    source: source,
    target: target,
    weight: weight
  });
};

/**
 * Delete one edge from the graph.
 * @param {string} source Source of the edge.
 * @param {string} target Target of the edge.
 */
genotet.NetworkLoader.prototype.deleteOneEdge = function(source, target) {
  for (var i = 0; i < this.data.network.edges.length; i++) {
    if (this.data.network.edges[i].source == source &&
      this.data.network.edges[i].target == target) {
      this.data.network.edges.splice(i);
      break;
    }
  }
  var sourceExists = false, targetExists = false;
  this.data.network.edges.forEach(function(edges) {
    if (source == edges.source || source == edges.target) {
      sourceExists = true;
    }
    if (target == edges.target || target == edges.target) {
      targetExists = true;
    }
  });
  if (!sourceExists) {
    for (var i = 0; i < this.data.network.nodes.length; i++) {
      if (this.data.network.nodes[i].id == source) {
        this.data.network.nodes.splice(i);
        break;
      }
    }
  }
  if (!targetExists) {
    for (var i = 0; i < this.data.network.nodes.length; i++) {
      if (this.data.network.nodes[i].id == target) {
        this.data.network.nodes.splice(i);
        break;
      }
    }
  }
};

/*
LoaderGraph.prototype.loadComb = function(net, exp) {
    var loader = this;
  var oexp = exp;
  exp = utils.encodeSpecialChar(exp);
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp',
    data: {
      args: 'type=comb&net=' + net + '&exp=' + exp
    },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);
        if (data.length == 0) {
        options.alert('There is no common targets.');
        return;
      }
      var addexp = 'a^';
      for (var i = 0; i < data.length; i++) addexp += '|^'+ data[i] + '$';
      //console.log(oexp);
      addexp += '|'+ oexp;
      loader.addNodes(addexp);
    }
  });
};
*/

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
    incidentEdges: null,
    geneRegex: null,
    options: null
  });
};

genotet.utils.inherit(genotet.NetworkLoader, genotet.ViewLoader);

/**
 * Loads the network data, adding the genes given by geneRegex.
 * @param {string} fileName Network File name.
 * @param {string} geneRegex Regex for gene selection.
 * @override
 */
genotet.NetworkLoader.prototype.load = function(fileName, geneRegex) {
  this.loadNetwork_(fileName, geneRegex);
};

/**
 * Implements the network loading ajax call.
 * @param {string} fileName FIle Name of the network.
 * @param {string} geneRegex Regex that selects the gene set.
 * @private
 */
genotet.NetworkLoader.prototype.loadNetwork_ = function(fileName,
                                                        geneRegex) {
  var params = {
    type: 'network',
    fileName: fileName,
    geneRegex: geneRegex
  };
  this.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied fileName and geneRegex.
    _.extend(data, {
      fileName: fileName,
      geneRegex: geneRegex
    });
    this.data.network = data;
  }.bind(this), 'cannot load network');
};

/**
 * Updates the genes in the current network.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} geneRegex Regex that selects the genes to be updated.
 */
genotet.NetworkLoader.prototype.updateGenes = function(method, geneRegex) {
  var regex = this.data.geneRegex;
  switch (method) {
    case 'set':
      // Totally replace the regex.
      regex = geneRegex;
      break;
    case 'add':
      // Concat the two regex's. We need to include the previously existing
      // genes too so as to find the edges between the new genes and old
      // ones.
      regex += '|' + geneRegex;
      break;
    case 'remove':
      // Remove genes do not need communication with the server.
      this.removeGenes_(geneRegex);
      // Return immediately. No ajax.
      return;
  }
  this.load(this.data.fileName, regex);
};


/**
 * Removes the selected genes from the current network data.
 * @param {string} geneRegex Regex selecting the genes to be removed.
 * @private
 */
genotet.NetworkLoader.prototype.removeGenes_ = function(geneRegex) {
  var regex;
  try {
    regex = RegExp(geneRegex, 'i');
  } catch (e) {
    genotet.error('invalid gene regex', geneRegex);
    return;
  }
  this.data.network.nodes = _.filter(this.data.network.nodes, function(node) {
    return !node.id.match(regex);
  });
  this.data.network.edges = _.filter(this.data.network.edges, function(edge) {
    return !edge.source.match(regex) && !edge.target.match(regex);
  });

  this.updateGeneRegex_();
  this.signal('geneRemove');
};

/**
 * Updates the regex that selects the current gene set. Because of gene
 * removal, unlike gene addition, it is hard to incrementally modify the regex.
 * This function sets the gene regex to a verbose concatenation of the gene
 * ids. This is only called in removeGenes_().
 * @private
 */
genotet.NetworkLoader.prototype.updateGeneRegex_ = function() {
  var regex = '';
  this.data.network.nodes.forEach(function(node, index) {
    regex += node.id + (index == this.data.network.nodes.length - 1 ? '' : '|');
  }, this);
  this.data.geneRegex = regex;
};

/**
 * Fetches the incident edges of a given node.
 * @param {!Object} node Node of which the incident edges are queried.
 */
genotet.NetworkLoader.prototype.incidentEdges = function(node) {
  var params = {
    type: 'incident-edges',
    fileName: this.data.fileName,
    gene: node.id
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.incidentEdges = data;
    this.signal('incidentEdges');
  }.bind(this), 'cannot get incident edges');
};

/**
 * Adds one gene to the network, and the edges to the original graph
 * @param {string} gene Name of the gene
 */
genotet.NetworkLoader.prototype.addOneGene = function(gene) {
  var params = {
    type: 'add-gene',
    fileName: this.data.fileName,
    gene: gene
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.network.nodes.push({
      id: gene,
      name: gene,
      isTF: data.isTF
    });
    for (var edge in data.edges) {
      this.data.network.edges.push(edge);
    }
  }.bind(this), 'cannot add one gene');
};

/**
 * Delete one gene from graph and related edges
 * @param {string} gene Name of the gene
 */
genotet.NetworkLoader.prototype.deleteOneGene = function(gene) {
  // delete the node
  for (var i = 0; i < this.data.network.nodes.length; i++) {
    if (this.data.network.nodes[i].id == gene) {
      this.data.network.nodes.splice(i);
      break;
    }
  }
  // delete the edges
  for (var i = this.data.network.edges.length - 1; i >= 0; i--) {
    if (this.data.network.edges[i].source == gene ||
      this.data.network.edges[i].target == gene) {
      this.data.network.edges.splice(i);
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

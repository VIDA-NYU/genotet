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
 * @param {string} networkName Network name.
 * @param {string} geneRegex Regex for gene selection.
 * @override
 */
genotet.NetworkLoader.prototype.load = function(networkName, geneRegex) {
  this.loadNetwork_(networkName, geneRegex);
};

/**
 * Implements the network loading ajax call.
 * @param {string} networkName Name of the network.
 * @param {string} geneRegex Regex that selects the gene set.
 * @private
 */
genotet.NetworkLoader.prototype.loadNetwork_ = function(networkName,
                                                        geneRegex) {
  this.signal('loadStart');
  var params = {
    type: 'network',
    networkName: networkName,
    geneRegex: geneRegex
  };
  $.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied networkName and geneRegex.
    _.extend(data, {
      networkName: networkName,
      geneRegex: geneRegex
    });
    _.extend(this.data, data);
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load network', params));
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
  this.load(this.data.networkName, regex);
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
  this.data.nodes = _.filter(this.data.nodes, function(node) {
    return !node.id.match(regex);
  });
  this.data.edges = _.filter(this.data.edges, function(edge) {
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
  this.data.nodes.forEach(function(node, index) {
    regex += node.id + (index == this.data.nodes.length - 1 ? '' : '|');
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
    networkName: this.data.networkName,
    gene: node.id
  };
  $.get(genotet.data.serverURL, params, function(data) {
    this.data.incidentEdges = data;
    this.signal('incidentEdges');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot get incident edges', params));
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

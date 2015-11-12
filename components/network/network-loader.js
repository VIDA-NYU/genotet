/**
 * @fileoverview Gene regulatory network data loader.
 */

'use strict';

/**
 * NetworkLoader loads the gene regulatory network data.
 * @param {!Object} data Data object to be written.
 * @constructor
 */
function NetworkLoader(data) {
  NetworkLoader.base.constructor.call(this, data);
}

NetworkLoader.prototype = Object.create(ViewLoader.prototype);
NetworkLoader.prototype.constructor = NetworkLoader;
NetworkLoader.base = ViewLoader.prototype;


/**
 * Loads the network data, adding the genes given by geneRegex.
 * @param {string} networkName Network name.
 * @param {string} geneRegex Regex for gene selection.
 * @override
 */
NetworkLoader.prototype.load = function(networkName, geneRegex) {
  this.loadNetwork_(networkName, geneRegex);
};

/**
 * Implements the network loading ajax call.
 * @param {string} networkName Name of the network.
 * @param {string} geneRegex Regex that selects the gene set.
 * @private
 */
NetworkLoader.prototype.loadNetwork_ = function(networkName, geneRegex) {
  this.signal('loadStart');
  var params = {
    type: 'net',
    net: networkName,
    exp: geneRegex
  };
  $.get(Data.serverURL, params, function(data) {
    // Store the last applied networkName and geneRegex.
    _(data).extend({
      networkName: networkName,
      geneRegex: geneRegex
    });
    _(this.data).extend(data);
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load network', params));
};

/**
 * Updates the genes in the current network.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} geneRegex Regex that selects the genes to be updated.
 */
NetworkLoader.prototype.updateGenes = function(method, geneRegex) {
  var regex = this.data.geneRegex;
  switch(method) {
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
  this.signal('loadStart');
  var params = {
    type: 'net',
    net: this.data.networkName, // Use the previous network name
    exp: regex
  };
  $.get(Data.serverURL, params, function(data) {
    data.geneRegex = regex;
    _(this.data).extend(data);
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot update genes in the network', params));
};


/**
 * Removes the selected genes from the current network data.
 * @param {string} geneRegex Regex selecting the genes to be removed.
 * @private
 */
NetworkLoader.prototype.removeGenes_ = function(geneRegex) {
  var regex;
  try {
    regex = RegExp(geneRegex, 'i');
  } catch (e) {
    Core.error('invalid gene regex', geneRegex);
    return;
  };
  this.data.nodes = _(this.data.nodes).filter(function(node) {
    return !node.id.match(regex);
  });
  this.data.edges = _(this.data.edges).filter(function(edge) {
    return !edge.source.match(regex) && !edge.target.match(regex);
  });

  this.updateGeneRegex_();
  this.signal('gene-remove');
};

/**
 * Updates the regex that selects the current gene set. Because of gene
 * removal, unlike gene addition, it is hard to incrementally modify the regex.
 * This function sets the gene regex to a verbose concatenation of the gene
 * ids. This is only called in removeGenes_().
 */
NetworkLoader.prototype.updateGeneRegex_ = function() {
  var regex = '';
  this.data.nodes.forEach(function(node, index) {
    regex += node.id + (index == this.data.nodes.length - 1 ? '' : '|');
  }, this);
  this.data.geneRegex = regex;
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
    error: function(xhr, status, err) { loader.error('cannot load combinatorial regulated genes\n' + status + '\n' + err); },
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

LoaderGraph.prototype.loadEdges = function(net, name) {
  var loader = this;
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp',
    data: {
      args: 'type=edges&net=' + net + '&name=' + name
    },
    error: function(xhr, status, err) { loader.error('cannot load edges\n' + status + '\n' + err); },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);

      var viewname = loader.parentView.viewname + '-list';
      var view = $('#view'+ loader.parentView.viewid);
      var left = parseInt(view.css('left')) + parseInt(view.css('width')),
        top = parseInt(view.css('top'));
      createView(viewname, 'table', null, loader.parentView.layout.rawheight, left, top);

      linkView(loader.parentView.viewname, viewname);
      linkView(viewname, loader.parentView.viewname);  // link back
      groupView(viewname, loader.parentView.viewname);

      var wrapper = {};
      wrapper.net = net;
      wrapper.name = name;
      wrapper.columns = ['Source', 'Target', 'Weight', 'Loaded'];
      wrapper.rows = data;
      var viewdata = loader.parentView.viewdata;
      for (var i = 0; i < wrapper.rows.length; i++) {
        if (viewdata.visibleLinks[wrapper.rows[i].id] == true) wrapper.rows[i].loaded = 'Yes';
        else wrapper.rows[i].loaded = '';
      }
      getView(viewname).viewdata = wrapper;
      getView(viewname).layout.reloadData();
    }
  });
};
*/

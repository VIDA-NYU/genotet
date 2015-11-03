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
 * Adds selected nodes to the network.
 * @param {string} nodes Regular expression selecting the nodes to be added.
 */
NetworkLoader.prototype.addNodes = function(nodes) {  // nodes are regexp
  var exp = 'a^';
  for (var i = 0; i < this.data.nodes.length; i++) {
    exp += '|^' + this.data.nodes[i].name + '$';
  }
  exp += '|' + nodes;
  this.loadNetwork_(this.data.networkName, exp);
};


/**
 * Removes selected nodes from the network.
 * @param {string} exp Regular expression selecting the nodes to be removed.
 */
NetworkLoader.prototype.removeNodes = function(exp) {
  var reg = RegExp(exp, 'i');
  for (var i = 0; i < data.nodes.length; i++) {
    if (data.nodes[i].name.match(reg)) {
      delete data.visibleNodes[data.nodes[i].id];
    }
  }
  for (var i = 0; i < data.links.length; i++) {
    if (data.visibleNodes[data.links[i].source.id] == null || data.visibleNodes[data.links[i].target.id] == null) {  // hide incident edges
      delete data.visibleLinks[data.links[i].id];
    }
  }
  this.reparseData(true);
};


/**
 * Adds the given edges to the network.
 * @param {!Array<!Object>} edges Array of the edges to be added.
 */
NetworkLoader.prototype.addEdges = function(edges) {
  var data = this.parentView.viewdata;
  var nodes = data.nodes, nodeids = {};
  var exp = '';
  for (var i = 0; i < nodes.length; i++) {
    nodeids[nodes[i].id] = true;
    exp += '^' + nodes[i].name + '$|';
  }
  for (var i = 0; i < edges.length; i++) {
    data.visibleLinks[edges[i].id] = true;
    if (nodeids[edges[i].sourceId] == null) {
      nodeids[edges[i].sourceId] = true;
      data.visibleNodes[edges[i].sourceId] = true;
      exp += '^' + edges[i].source + '$|';
    }
    if (nodeids[edges[i].targetId] == null) {
      nodeids[edges[i].targetId] = true;
      data.visibleNodes[edges[i].targetId] = true;
      exp += '^' + edges[i].target + '$|';
    }
  }
  exp += '[]';
  this.updateNetwork(exp);
};


/**
 * Removes the given edges from the network.
 * @param {!Array<!Object>} edges Array of edges to be removed.
 */
NetworkLoader.prototype.removeEdges = function(edges) {
  var data = this.parentView.viewdata;
  var links = data.links;
  for (var i = 0; i < edges.length; i++) {
    if (data.visibleLinks[edges[i].id] == true) delete data.visibleLinks[edges[i].id];
  }
  this.reparseData(true); // removal of edges
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

    $(this).trigger('genotet.loadComplete');
  }.bind(this), 'jsonp')
    .fail(function() {
      Core.error('cannot load network data', JSON.stringify(params));
      this.signal('loadFail');
    }.bind(this));
};

/*
LoaderGraph.prototype.updateData = function(identifier) {
  if (identifier.action == 'show') {
    this.addEdges(identifier.data);
  }else if (identifier.action == 'hide') {
    this.removeEdges(identifier.data);
  }
};

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

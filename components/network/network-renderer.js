/**
 * @fileoverview Renderer of the NetworkView.
 */

'use strict';

/**
 * NetworkRenderer renders the visualizations for the NetworkView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {ViewRenderer}
 * @constructor
 */
function NetworkRenderer(container, data) {
  NetworkRenderer.base.constructor.call(this, container, data);
  this.init();
}

NetworkRenderer.prototype = Object.create(ViewRenderer.prototype);
NetworkRenderer.prototype.constructor = NetworkRenderer;
NetworkRenderer.base = ViewRenderer.prototype;

/**
 * State of mouse interaction.
 * @enum {number}
 */
NetworkRenderer.prototype.MouseState = {
  NONE: 0,
  SELECT: 1,
  ZOOM: 2
};

/** @const {number} */
NetworkRenderer.prototype.NODE_LABEL_OFFSET_X = 10;
/** @const {number} */
NetworkRenderer.prototype.NODE_LABEL_OFFSET_Y = 5;
/** @const {number} */
NetworkRenderer.prototype.NODE_SIZE = 5;


/** @inheritDoc */
NetworkRenderer.prototype.init = function() {
  NetworkRenderer.base.init.call(this);

  /**
   * Filter settings.
   * @protected {!Object}
   */
  this.filter = {
    edgeWeight: [-Infinity, Infinity],
    showTFToTF: true,
    showTFToNonTF: true
  };

  /**
   * Display settings.
   * @protected {!Object}
   */
  this.options = {
    showLabels: true,
    labelGap: 10.0
  };

  // Color scale encoding edge weights.
  /** @private {!d3.scale} */
  this.colorScale_ = d3.scale.linear();

  // Navigation state.
  /** @private {!Array<number>} */
  this.translate_ = [0, 0];
  /** @private {number} */
  this.scale_ = 1.0;
  /** @private {NetworkRenderer.MouseState} */
  this.mouseState_ = this.MouseState.NONE;

  /** @private {d3.zoom} */
  this.zoom = d3.behavior.zoom();

  /**
   * Node objects storing the rendering properties of network nodes.
   * Node objects are used by D3 force-directed layout.
   * The keys of the object is the node IDs. Currently ID is the node name.
   * @private {!Object<!Object>}
   */
  this.nodes_ = {};

  /**
   * Edge objects storing the rendering properties of network edges.
   * Edge objects are used by D3 force-directed layout.
   * The keys of the object is {source node ID} + ',' + {target node ID}
   * @private {!Object<!Object>}
   */
  this.edges_ = {};

  /**
   * D3 force for graph layout.
   * @private {!d3.force}
   */
  this.force_ = d3.layout.force();

  /**
   * Parameters for D3 force layout.
   * @private {!Object<number>}
   */
  this.forceParams_ = {
    charge: -20000,
    gravity: 1.0,
    linkDistance: 20,
    friction: 0.6
  };

  /**
   * Whether D3 force is updating.
   * @private {boolean}
   */
  this.forcing_ = false;

  // Create group elements in the svg for nodes, edges, etc.
  // Groups shall be created in the reverse order of their appearing order.
  /**
   * Svg group for edges.
   * @private {!d3.selection}
   */
  this.svgEdges_ = this.canvas.append('g')
    .classed('edges', true);
  /**
   * Svg group for nodes.
   * @private {!d3.selection}
   */
  this.svgNodes_ = this.canvas.append('g')
    .classed('nodes', true);
  /**
   * Svg group for node labels.
   * @private {!d3.selection}
   */
  this.svgNodeLabels_ = this.canvas.append('g')
    .classed('node-labels', true);
};


/**
 * Renders the network onto the scene.
 * @override
 */
NetworkRenderer.prototype.render = function() {
  if (!this.dataReady_()) {
    return;
  }
  this.force_
    .size([this.canvasWidth_, this.canvasHeight_])
    .start();
};

/**
 * Prepares the network data and renders the network.
 * @override
 */
NetworkRenderer.prototype.dataLoaded = function() {
  this.prepareData_();
  this.render();
};

/**
 * Re-renders the scene upon resize.
 * @override
 */
NetworkRenderer.prototype.resize = function() {
  NetworkRenderer.base.resize.call(this);
  this.render();
};

/**
 * Checks whether the data has been loaded.
 * @private
 */
NetworkRenderer.prototype.dataReady_ = function() {
  return this.data.nodes;
};

/**
 * Prepares necessary things for rendering the data, e.g. color scale.
 * @private
 */
NetworkRenderer.prototype.prepareData_ = function() {
  this.colorScale_ = d3.scale.linear()
    .domain([this.data.wmin, this.data.wmax])
    .range(Data.redGreenScale);

  this.data.nodes.forEach(function(node) {
    if (!this.nodes_[node.id]) {
      this.nodes_[node.id] = _.extend({}, node);
    }
  }, this);
  this.data.edges.forEach(function(edge) {
    if (!this.nodes_[edge.source] || !this.nodes_[edge.target]) {
      Core.error('edge contains nodes that do not exist', JSON.stringify(edge));
    }
    if (!this.edges_[edge.id]) {
      this.edges_[edge.id] = {
        id: edge.id,
        source: this.nodes_[edge.source],
        target: this.nodes_[edge.target],
        weight: edge.weight
      };
    }
  }, this);

  this.force_ = d3.layout.force()
    .nodes(_.toArray(this.nodes_))
    .links(_.toArray(this.edges_))
    .charge(this.forceParams_.charge)
    .gravity(this.forceParams_.gravity)
    .linkDistance(this.forceParams_.linkDistance)
    .friction(this.forceParams_.friction)
    .on('start', function() {
      this.forcing = true;
    }.bind(this))
    .on('tick', this.drawNetwork_.bind(this))
    .on('end', function() {
      this.forcing = false;
    }.bind(this));
};

/**
 * Renders the network onto the canvas. The rendering uses D3 update scheme
 * so that existing objects get only updated.
 * @private
 */
NetworkRenderer.prototype.drawNetwork_ = function() {
  this.drawNodes_();
  this.drawEdges_();
};

/**
 * Renders the network nodes.
 * @private
 */
NetworkRenderer.prototype.drawNodes_ = function() {
  var nodes = this.svgNodes_.selectAll('circle')
    .data(_.toArray(this.nodes_), function(node) {
      return node.id;
    });
  nodes.enter().append('circle')
    .attr('r', this.NODE_SIZE);
  nodes.exit().remove();
  nodes.attr('cx', function(node) { return node.x; })
    .attr('cy', function(node) { return node.y; });
  if (this.options.showLabels) {
    this.drawNodeLabels_();
  }
};

/**
 * Renders the node labels. This is only called from drawNodes_
 * when options.showLabels is set.
 * @private
 */
NetworkRenderer.prototype.drawNodeLabels_ = function() {
  var labels = this.svgNodeLabels_.selectAll('text')
    .data(_.toArray(this.nodes_), function(node) {
      return node.id;
    });
  labels.enter().append('text')
    .text(function(node) {
      return node.name;
    })
  labels.exit().remove();
  labels
    .attr('x', function(node) {
      return node.x + this.NODE_LABEL_OFFSET_X;
    }.bind(this))
    .attr('y', function(node) {
      return node.y + this.NODE_LABEL_OFFSET_Y;
    }.bind(this));
};

/**
 * Renders the network edges.
 * @private
 */
NetworkRenderer.prototype.drawEdges_ = function() {
  var line = d3.svg.line().interpolate('linear');
  var edges = this.svgEdges_.selectAll('path')
    .data(_.toArray(this.edges_), function(edge) {
      return edge.id;
    });
  edges.enter().append('path')
    .style('stroke', function(edge) {
      return this.colorScale_(edge.weight);
    }.bind(this));
  edges.exit().remove();
  edges.attr('d', function(edge) {
    var points = [
      [edge.source.x, edge.source.y],
      [edge.target.x, edge.target.y]
    ];
    return line(points);
  });
};


NetworkRenderer.prototype.initLayout = function(removeOnly) {
  var layout = this;
  this.nodes = this.data.nodes;
  this.links = this.data.links;
  // replace node id by reference
  for (var i = 0; i < this.nodes.length; i++) {
    if (this.nodes[i].x == null) this.nodes[i].x = Math.floor(Math.random() * this.width);
    if (this.nodes[i].y == null) this.nodes[i].y = Math.floor(Math.random() * this.graphHeight);
  }
  for (var i = 0; i < this.links.length; i++) {
    this.links[i].source = this.nodes[this.links[i].source];
    this.links[i].target = this.nodes[this.links[i].target];
  }


  this.forcing = true;
  $('#'+ this.htmlid + ' #force').attr('checked', true);

    //var color = d3.scale.category20();
  // compute an initial layout
  this.renderLayout();
  this.computeForce();
  if (removeOnly == true) this.force.stop();
};


NetworkRenderer.prototype.computeForce = function() {
  this.force.nodes(this.nodes).links(this.links).size([this.width, this.graphHeight]);
  //this.force.start(); // even if force is not needed, you need to start force because it replaces node index of links by node references
  //for(var i=0; i<300; i++) this.force.tick();
  //this.force.stop();
};

NetworkRenderer.prototype.renderLayout = function() {
  this.renderGraph();
};

NetworkRenderer.prototype.removeLayout = function() {
   $('#'+ this.htmlid + " div[name='ui']").remove();
   $('#'+ this.htmlid + ' #layoutwrapper').remove();
   $('#'+ this.htmlid + ' #hint').remove();
   $('#'+ this.htmlid + ' svg').remove();
};

NetworkRenderer.prototype.renderUI = function() {
  var layout = this;
  $('#'+ this.htmlid + ' .ui-widget-header').after("<div name='ui'><div>" +
  "<span style='margin-left: 5px; font-weight:900'>NETWORK</span>" +
  "<select id='netname' title='Choose the network data'>" +
    "<option value='th17'>TH17</option>" +
    "<option value='confidence'>Confidence</option>" +
    "<option value='prediction'>Prediction</option>" +
    "<option value='strength'>Strength</option>" +
    '</select>' +
    "<span style='margin-left: 5px; font-weight:900'>GENE</span>" +
  "<input type='text' id='gene' size='10' title='Add/remove/select genes in the network. " +
  " Usage: [add/rm/sel] regexp | regexp. If no action is specified, default behavior is sel.'>" +
  "<span style='margin-left: 5px;'>COMBREG</span>" +
  "<input type='text' id='comb' size='10' title='Add nodes into the graph that are regulated by selected genes. Usage: regexp'>" +
  '</div>' +
  "<input type='checkbox' id='label' title='Show/hide node labels'> Label " +
  "<input type='checkbox' id='tf2tf' title='Show/hide edges between 2 TFs'> TF-TF " +
  "<input type='checkbox' id='tf2ntf' title='Show/hide edges bettwen a TF and a non-TF'> TF-nonTF " +
  "<input type='checkbox' id='force' title='Turn on/off force of the graph layout'> Force " +
  "<input type='checkbox' id='edgelist' title='Auto pop incident edge list when a node is clicked'> EdgeList " +
  '</div>');

  $('#'+ this.htmlid + " #netname option[value='" + this.parentView.loader.lastIdentifier.net + "']").attr('selected', true);
  $('#'+ this.htmlid + ' #netname').change(function() {
    var net = $(this).select('option:selected').val();
    console.log(net);
    if (net != layout.parentView.loader.lastIdentifier.net)
      layout.parentView.loader.loadData({'net': net, 'exp': 'a^'});
  });
  $('#'+ this.htmlid + ' #gene').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('gene'); });
  $('#'+ this.htmlid + ' #comb').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('comb'); });
  $('#'+ this.htmlid + ' #label').attr('checked', this.showLabel)
    .change(function() { return layout.toggleLabel(); });
  $('#'+ this.htmlid + ' #tf2tf').attr('checked', this.showTF2TFEdge)
    .change(function() { return layout.toggleTF2TFEdge(); });
  $('#'+ this.htmlid + ' #tf2ntf').attr('checked', this.showTF2nTFEdge)
    .change(function() { return layout.toggleTF2nTFEdge(); });
  $('#'+ this.htmlid + ' #force').attr('checked', this.forcing)
    .change(function() { return layout.toggleForce(); });
  $('#'+ this.htmlid + ' #edgelist').attr('checked', this.edgeListing)
    .change(function() { return layout.toggleEdgeListing(); });
  this.uiHeight = $('#'+ this.htmlid + " div[name='ui']").height();
};

NetworkRenderer.prototype.uiUpdate = function(type) {
  var loader = this.parentView.loader;
  if (type == 'gene') {
    var srch = $('#'+ this.htmlid + ' #gene').val();
    var cmd = srch.split(' ');
    if (cmd.length == 1 || (cmd.length == 2 && cmd[0] == 'sel')) {
      var exp = cmd.length == 1 ? cmd[0] : cmd[1];
      this.showMsg('Loading...');
      loader.loadNetwork(loader.lastIdentifier.net, exp);
    }else if (cmd.length == 2 && (cmd[0] == 'add' || cmd[0] == 'rm')) {
      if (cmd[0] == 'add') {
        loader.addNodes(cmd[1]);
      }else if (cmd[0] == 'rm') {
        loader.removeNodes(cmd[1]);
      }
    }else {
      options.alert('invalid syntax, usage: add/rm/sel regexp | regexp');
      return;
    }
  }else if (type == 'comb') {
    var exp = $('#'+ this.htmlid + ' #comb').val();
    if (exp == '') return;
    loader.loadComb(loader.lastIdentifier.net, exp);
  }
};

NetworkRenderer.prototype.renderGraph = function() {
    var nodes = this.nodes,
  links = this.links;

  var embWidth = manager.embedSize(this.width),
      embHeight = manager.embedSize(this.graphHeight);

    var layout = this;
  // make svg
  $('#'+ this.htmlid).append("<div id='layoutwrapper'></div>");
  $('#'+ this.htmlid + ' #layoutwrapper')
    .addClass('renderdiv')
    .css('width', embWidth)
    .css('height', embHeight);

    this.svg = d3.select('#'+ this.htmlid + ' #layoutwrapper').append('svg');
    this.svg
      .style('width', embWidth)
      .style('height', embHeight);


    var background = this.svg.selectAll('#background').data([{'zone': 'background'}]).enter().append('rect')
    .attr('class', 'iobj')
    .attr('id', 'background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', layout.width)
    .attr('height', layout.graphHeight)
    .call(this.zoom
      .on('zoomstart', function(d) { return layout.graphZoomstart(d); })
      .on('zoom', function(d) { return layout.graphZoom(d); })
      .on('zoomend', function(d) { return layout.graphZoomend(d); })
    );

    // draw links (before nodes)
    var link = this.svg.selectAll('.link').data(links).enter().append('line')
        .attr('class', 'link')
    .attr('id', function(d) { return 'e'+ d.id; })
    .attr('visibility', function(d) { return layout.checkVisible(d); })
        .style('stroke', function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); })
    .attr('x1', function(d) { return layout.edgeCoordinate(d, 'x1') * layout.scale + layout.trans[0]; })
        .attr('y1', function(d) { return layout.edgeCoordinate(d, 'y1') * layout.scale + layout.trans[1]; })
        .attr('x2', function(d) { return layout.edgeCoordinate(d, 'x2') * layout.scale + layout.trans[0]; })
        .attr('y2', function(d) { return layout.edgeCoordinate(d, 'y2') * layout.scale + layout.trans[1]; });
    var linkdir = this.svg.selectAll('.linkdir').data(links).enter().append('polygon')
        .attr('class', 'linkdir')
    .attr('id', function(d) { return 'ed'+ d.id; })
    .attr('visibility', function(d) { return layout.checkVisible(d); })
        .style('stroke', function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); })
    .attr('points', function(d) { return layout.edgeArrow(d); });

  // highlight and select links
  var link_highlight = this.svg.selectAll('#link_highlight').data([{}]).enter().append('line')
      .attr('id', 'link_highlight')
      .attr('class', 'link_highlight')
      .attr('visibility', 'hidden');
  var linkdir_highlight = this.svg.selectAll('#linkdir_highlight').data([{}]).enter().append('polygon')
      .attr('id', 'linkdir_highlight')
      .attr('class', 'linkdir_highlight')
      .attr('visibility', 'hidden');
  var link_select = this.svg.selectAll('#link_select').data([{}]).enter().append('line')
      .attr('id', 'link_select')
      .attr('class', 'link_select')
      .attr('visibility', 'hidden');
  var linkdir_select = this.svg.selectAll('#linkdir_select').data([{}]).enter().append('polygon')
      .attr('id', 'linkdir_select')
      .attr('class', 'linkdir_select')
      .attr('visibility', 'hidden');

  // draw nodes
  var node = this.svg.selectAll('.node').data(nodes).enter().append('circle')
        .attr('class', 'node')
    .attr('id', function(d) {return 'v'+ d.id; })
        .attr('r', function(d) { return d.focus ? 6 : 5; })
        .style('fill', function(d) { return d.selected ? 'orange': (d.isTF ? 'white': '#C0C0C0'); })
    .attr('cx', function(d) { return d.x * layout.scale + layout.trans[0]; })
        .attr('cy', function(d) { return d.y * layout.scale + layout.trans[1]; });

  // highlight and select nodes
  var node_highlight = this.svg.selectAll('#node_highlight').data([{}]).enter().append('circle')
      .attr('id', 'node_highlight')
      .attr('class', 'node_highlight')
      .attr('visibility', 'hidden');
  var node_select = this.svg.selectAll('#node_select').data([{}]).enter().append('circle')
      .attr('id', 'node_select')
      .attr('class', 'node_select')
      .attr('visibility', 'hidden');

  // label shall be between rendered objects and iobjs
  var label = this.svg.selectAll('.label').data(nodes) .enter().append('text')
    .text(function(d) { return d.name; })
    .attr('class', 'label')
    .attr('id', function(d) { return 'lbl_v'+ d.id; })
    .attr('font-size', function(d) { return d.focus ? '15px': '10px'; })
    .attr('fill', function(d) { return d.focus ? '#ec2828': 'black'; })
    .attr('x', function(d) { return layout.nodes[d.index].x * layout.scale + layout.trans[0]; })
    .attr('y', function(d) { return layout.nodes[d.index].y * layout.scale - layout.labelGap + layout.trans[1]; })
    .attr('visibility', function(d) { return layout.showLabel ? 'visible': 'hidden'; });

  // interactive objects
  var linkiobj = this.svg.selectAll('.linkiobj').data(links).enter().append('line')
        .attr('class', 'linkiobj')
    .attr('id', function(d) { return 'iobj_e'+ d.id; })
    .attr('visibility', function(d) { return layout.checkVisible(d); })
    .attr('x1', function(d) { return layout.edgeCoordinate(d, 'x1') * layout.scale + layout.trans[0]; })
        .attr('y1', function(d) { return layout.edgeCoordinate(d, 'y1') * layout.scale + layout.trans[1]; })
        .attr('x2', function(d) { return layout.edgeCoordinate(d, 'x2') * layout.scale + layout.trans[0]; })
        .attr('y2', function(d) { return layout.edgeCoordinate(d, 'y2') * layout.scale + layout.trans[1]; })
    .on('click', function(d) { return layout.selectLink(d); })
    .on('mousedown', function(d) { return layout.mouseDownLink(d); })
    .on('mouseenter', function(d) { return layout.highlightLink(d); })
    .on('mouseleave', function(d) { return layout.unhighlightLink(d); })
    .call(this.zoom
      .on('zoomstart', function(d) { return layout.graphZoomstart(d); })
      .on('zoom', function(d) { return layout.graphZoom(d); })
      .on('zoomend', function(d) { return layout.graphZoomend(d); })
    );
    var nodeiobj = this.svg.selectAll('.nodeiobj').data(nodes).enter().append('circle')
        .attr('class', 'nodeiobj')
    .attr('id', function(d) { return 'iobj_v'+ d.id; })
    .attr('r', 10.0)
    .attr('cx', function(d) { return d.x * layout.scale + layout.trans[0]; })
        .attr('cy', function(d) { return d.y * layout.scale + layout.trans[1]; })
    //.on("click", function(d) { return layout.selectNode(d); })
    .on('mousedown', function(d) { return layout.mouseDownNode(d); })
    .on('mouseenter', function(d) { return layout.highlightNode(d); })
    .on('mouseleave', function(d) { return layout.unhighlightNode(d); })
    .call(d3.behavior.drag()
      .origin(function(d) { return {'x': d.x * layout.scale + layout.trans[0], 'y': d.y * layout.scale + layout.trans[1]}; })
      .on('dragstart', function(d) { return layout.nodeDragStart(d); })
      .on('drag', function(d) { return layout.nodeDrag(d); })
      .on('dragend', function(d) { return layout.nodeDragEnd(d); })
      )
    .call(this.zoom
      .on('zoomstart', function(d) { return layout.graphZoomstart(d); })
      .on('zoom', function(d) { return layout.graphZoom(d); })
      .on('zoomend', function(d) { return layout.graphZoomend(d); })
    );

    node.append('title')
        .text(function(d) { return d.name; });

  // edge node hint
  var info = this.svg.selectAll('#graphinfo').data([{}]).enter().append('text')
    .attr('id', 'graphinfo')
    .attr('class', 'graphinfo')
    .attr('x', 5)
    .attr('y', this.graphHeight - 10)
    .text('');
};

NetworkRenderer.prototype.visualizeElement = function(element, type) {

  var elementProcessed;
  if (type == 'highlight') {
    elementProcessed = this.highlightedElement;
  }else if (type == 'select') {
    elementProcessed = this.selectedElement;
  }

  if (elementProcessed.content != null) {
    // clear selected
    if (elementProcessed.type == 'node') {
      this.svg.selectAll('#node_'+ type)
        .attr('visibility', 'hidden');
    }else if (elementProcessed.type == 'link') {
      this.svg.selectAll('#link_'+ type)
        .attr('visibility', 'hidden');
      this.svg.selectAll('#linkdir_'+ type)
        .attr('visibility', 'hidden');
    }
  }

  if (element == null) {
    elementProcessed = {};
    return;
  }else {
    elementProcessed.content = element.content;
    elementProcessed.type = element.type;
  }
  var d = element.content;
  var layout = this;

  if (elementProcessed.type == 'node') {
    var node_ = this.svg.selectAll('#node_'+ type).data([d])
      .attr('cx', function(d) { return d.x * layout.scale + layout.trans[0]; })
      .attr('cy', function(d) { return d.y * layout.scale + layout.trans[1]; })
      .attr('r', function(d) { return d.focus ? 6 : 5; })
      .attr('visibility', 'visible');
  }else if (elementProcessed.type == 'link') {
    var link_ = this.svg.selectAll('#link_'+ type).data([d])
      .attr('x1', function(d) { return layout.edgeCoordinate(d, 'x1') * layout.scale + layout.trans[0]; })
      .attr('y1', function(d) { return layout.edgeCoordinate(d, 'y1') * layout.scale + layout.trans[1]; })
      .attr('x2', function(d) { return layout.edgeCoordinate(d, 'x2') * layout.scale + layout.trans[0]; })
      .attr('y2', function(d) { return layout.edgeCoordinate(d, 'y2') * layout.scale + layout.trans[1]; })
      .attr('visibility', 'visible');
    var linkdir_ = this.svg.selectAll('#linkdir_'+ type).data([d])
      .attr('points', function(d) { return layout.edgeArrow(d); })
      .attr('visibility', 'visible');
  }

  // send selection to children view
  var msg = {'action': type, 'type': elementProcessed.type};
  if (elementProcessed.type == 'node') {
    msg.para = [d.name, this.parentView.loader.lastIdentifier.net];
    if (type == 'select' && this.edgeListing) this.parentView.loader.showEdges(this.parentView.loader.lastIdentifier.net, d.name);
  }else if (elementProcessed.type == 'link') {
    msg.para = [d.source.name, d.target.name];
  }
  this.parentView.postViewMessage(msg);
};

NetworkRenderer.prototype.edgeCoordinate = function(d, which) {
  var layout = this;
  if (this.data.bidir[d.source.index + '*'+ d.target.index] == true && this.data.bidir[d.target.index + '*'+ d.source.index] == true) { // bidirectional edges
    var dy = d.target.y - d.source.y, dx = d.target.x - d.source.x;
    var dl = Math.sqrt(dx * dx + dy * dy), th = -Math.acos(0.0);
    dx /= dl; dy /= dl;
    var ddx = Math.cos(th) * dx - Math.sin(th) * dy,
      ddy = Math.sin(th) * dx + Math.cos(th) * dy;
    switch (which) {
      case 'x1': return d.source.x + ddx * 2 / layout.scale;
      case 'y1': return d.source.y + ddy * 2 / layout.scale;
      case 'x2': return d.target.x + ddx * 2 / layout.scale;
      case 'y2': return d.target.y + ddy * 2 / layout.scale;
      default: console.error('edgeCoordinate: unidentified which bidir', which);
    }
  }else {
    switch (which) {
      case 'x1': return d.source.x;
      case 'y1': return d.source.y;
      case 'x2': return d.target.x;
      case 'y2': return d.target.y;
      default: console.error('edgeCoordinate: unidentified which', which);
    }
  }
};

NetworkRenderer.prototype.edgeArrow = function(d) {
  var layout = this;
  var g = 5.0, h = g + 10.0, w = 5.0;
  var dy = d.target.y - d.source.y, dx = d.target.x - d.source.x;
  var theta = Math.atan2(dy, dx),
  theta2 = Math.atan2(-dx, dy);
  var sint = Math.sin(theta), cost = Math.cos(theta),
  sint2 = Math.sin(theta2), cost2 = Math.cos(theta2);
  var x2 = this.edgeCoordinate(d, 'x2'), y2 = this.edgeCoordinate(d, 'y2');
  var arrowx = x2 * layout.scale - cost * h + layout.trans[0],
  arrowy = y2 * layout.scale - sint * h + layout.trans[1];
  return ''+ (x2 * layout.scale - g * cost + layout.trans[0]) + ','+ (y2 * layout.scale - g * sint + layout.trans[1]) + ' ' +
        (arrowx + w * cost2) + ','+ (arrowy + w * sint2) + ' ' +
        (arrowx - w * cost2) + ','+ (arrowy - w * sint2);
};

NetworkRenderer.prototype.graphZoomstart = function(d) {
  if (this.dragging) return;
  //if(d.zone == "foreground") this.zoom.center([this.width/2, this.height/2]);
  //else if(d.zone == "background") this.zoom.center(null);
  this.zooming = true;
  this.svg.selectAll('.node_highlight').attr('visibility', 'hidden');
  this.svg.selectAll('.link_highlight').attr('visibility', 'hidden');
  this.svg.selectAll('.linkdir_highlight').attr('visibility', 'hidden');
};

NetworkRenderer.prototype.graphZoom = function(d) {
  if (this.dragging) return;
  //if(manager.ctrlDown) return;
  var trans = d3.event.translate;
  var scale = d3.event.scale;
  this.trans = [trans[0], trans[1]];
  this.scale = scale;
  this.updateLayout();
};

NetworkRenderer.prototype.graphZoomend = function(d) {
  if (this.dragging) return;
  this.zooming = false;
};

NetworkRenderer.prototype.nodeDragStart = function(d) {
  //if(manager.ctrlDown) return;
  this.dragstartX = d3.event.sourceEvent.offsetX;
  this.dragstartY = d3.event.sourceEvent.offsetY;

  this.oldtrans = this.trans;
  //this.unhighlightNode(d);
  this.dragging = true;
};

NetworkRenderer.prototype.nodeDrag = function(d) {
  var layout = this;

  d.x = (d3.event.x - this.trans[0]) / this.scale;
  d.y = (d3.event.y - this.trans[1]) / this.scale;

  var x = d.x,
    y = d.y,
    nx = x * layout.scale + layout.trans[0],
    ny = y * layout.scale + layout.trans[1];


  for (var i = 0; i < this.links.length; i++) {
    if (this.links[i].source.id == d.id) {
      this.links[i].source.x = x;
      this.links[i].source.y = y;

      this.svg.select('#e'+ this.links[i].id)
        .attr('x1', layout.edgeCoordinate(this.links[i], 'x1') * layout.scale + layout.trans[0])
        .attr('y1', layout.edgeCoordinate(this.links[i], 'y1') * layout.scale + layout.trans[1])
        .attr('x2', layout.edgeCoordinate(this.links[i], 'x2') * layout.scale + layout.trans[0])
        .attr('y2', layout.edgeCoordinate(this.links[i], 'y2') * layout.scale + layout.trans[1]);
      this.svg.select('#iobj_e'+ this.links[i].id)
        .attr('x1', layout.edgeCoordinate(this.links[i], 'x1') * layout.scale + layout.trans[0])
        .attr('y1', layout.edgeCoordinate(this.links[i], 'y1') * layout.scale + layout.trans[1])
        .attr('x2', layout.edgeCoordinate(this.links[i], 'x2') * layout.scale + layout.trans[0])
        .attr('y2', layout.edgeCoordinate(this.links[i], 'y2') * layout.scale + layout.trans[1]);
      this.svg.select('#ed'+ this.links[i].id).attr('points', function(d) { return layout.edgeArrow(d); });
    }else if (this.links[i].target.id == d.id) {
      this.links[i].target.x = x;
      this.links[i].target.y = y;

      this.svg.select('#e'+ this.links[i].id)
        .attr('x1', layout.edgeCoordinate(this.links[i], 'x1') * layout.scale + layout.trans[0])
        .attr('y1', layout.edgeCoordinate(this.links[i], 'y1') * layout.scale + layout.trans[1])
        .attr('x2', layout.edgeCoordinate(this.links[i], 'x2') * layout.scale + layout.trans[0])
        .attr('y2', layout.edgeCoordinate(this.links[i], 'y2') * layout.scale + layout.trans[1]);
      this.svg.select('#iobj_e'+ this.links[i].id)
        .attr('x1', layout.edgeCoordinate(this.links[i], 'x1') * layout.scale + layout.trans[0])
        .attr('y1', layout.edgeCoordinate(this.links[i], 'y1') * layout.scale + layout.trans[1])
        .attr('x2', layout.edgeCoordinate(this.links[i], 'x2') * layout.scale + layout.trans[0])
        .attr('y2', layout.edgeCoordinate(this.links[i], 'y2') * layout.scale + layout.trans[1]);
      this.svg.select('#ed'+ this.links[i].id).attr('points', function(d) { return layout.edgeArrow(d); });
    }
  }

  // update node(iobj) and label
  this.svg.select('#v'+ d.id).attr('cx', nx).attr('cy', ny);
  this.svg.select('#iobj_v'+ d.id).attr('cx', nx).attr('cy', ny);
  this.svg.select('#lbl_v'+ d.id).attr('x', nx).attr('y', ny - layout.labelGap);

  // update highlighted node
  this.svg.select('#node_highlight').attr('cx', nx).attr('cy', ny);

  if (this.selectedElement.content != null) {
    var sd = this.selectedElement.content;
    if (this.selectedElement.type == 'node' && d.id == sd.id) {
      this.svg.select('#node_select').attr('cx', nx).attr('cy', ny);
    }else if (this.selectedElement.type == 'link') {
      if (d.id == sd.source.id) {
        this.svg.select('#link_select').attr('x1', nx).attr('y1', ny);
        this.svg.select('#linkdir_select').attr('points', function(d) { return layout.edgeArrow(d); });
      }else if (d.id == sd.target.id) {
        this.svg.select('#link_select').attr('x2', nx).attr('y2', ny);
        this.svg.select('#linkdir_select').attr('points', function(d) { return layout.edgeArrow(d); });
      }
    }
  }
};

NetworkRenderer.prototype.nodeDragEnd = function(d) {
  this.dragendX = d3.event.sourceEvent.offsetX;
  this.dragendY = d3.event.sourceEvent.offsetY;

  var dx = this.dragendX - this.dragstartX,
    dy = this.dragendY - this.dragstartY;
  var move = Math.sqrt(dx * dx + dy * dy);

  this.zoom.translate(this.oldtrans);  // cancel the translation from the drag

  this.dragging = false;
  if (move <= 5.0) {
    // no move, treated as click
    this.visualizeElement({'content': d, 'type': 'node'}, 'select');
  }else {
    this.blockclick = true;
  }
};

NetworkRenderer.prototype.mouseDownNode = function(d) {
  if (d3.event.button == 2) // right click
  {
    delete this.data.visibleNodes[d.id];  // hide the node
    for (var i = 0; i < this.data.links.length; i++) {
      if (this.data.links[i].source.id == d.id || this.data.links[i].target.id == d.id) {  // hide incident edges
        delete this.data.visibleLinks[this.data.links[i].id];
      }
    }
    if (getView(this.parentView.viewname + '-list') != null) closeView(this.parentView.viewname + '-list');
    this.parentView.loader.reparseData(true); // remove only
  }
};

NetworkRenderer.prototype.mouseDownLink = function(d) {
  if (d3.event.button == 2) // right click
  {
    delete this.data.visibleLinks[d.id];  // hide the edge
    if (getView(this.parentView.viewname + '-list') != null) closeView(this.parentView.viewname + '-list');
    this.parentView.loader.reparseData(true); // remove only
  }
};

NetworkRenderer.prototype.highlightLink = function(d) {
  if (this.dragging || this.zooming) return;

  this.visualizeElement({'content': d, 'type': 'link'}, 'highlight');

  var info = 'source: ' + d.source.name +
    '       target: ' + d.target.name +
    '       weight: ' + d.weight +
    '       id: ' + d.id;
  this.svg.select('#graphinfo').text(info);
};

NetworkRenderer.prototype.unhighlightLink = function(d) {
    var layout = this;

  this.visualizeElement(null, 'highlight');
};

NetworkRenderer.prototype.highlightNode = function(d) {
  if (this.dragging || this.zooming) return;

  this.visualizeElement({'content': d, 'type': 'node'}, 'highlight');
  this.svg.select('#lbl_v'+ d.id).attr('visibility', 'visible');
  var info = 'name: ' + d.name +
  '       isTF: ' + d.isTF +
  '       id: ' + d.id;
  this.svg.select('#graphinfo').text(info);
  //this.svg.select("#v"+d.id).attr("class", "node_hl");
};

NetworkRenderer.prototype.unhighlightNode = function(d) {
  if (this.dragging) return;
  this.visualizeElement(null, 'highlight');
  this.svg.select('#lbl_v'+ d.id).attr('visibility', this.showLabel ? 'visible': 'hidden');
  //this.svg.select("#v"+d.id).attr("class", "node");
};

NetworkRenderer.prototype.selectNode = function(d) {
  if (this.dragging || this.zooming) return;
  if (this.blockclick) { this.blockclick = false; return; }

  this.visualizeElement({'content': d, 'type': 'node'}, 'select');
};

NetworkRenderer.prototype.selectLink = function(d) {
  if (this.dragging || this.zooming) return;
  if (this.blockclick) { this.blockclick = false; return; }

  this.visualizeElement({'content': d, 'type': 'link'}, 'select');
};

NetworkRenderer.prototype.toggleLabel = function() {
    this.showLabel = !this.showLabel;
  var label = this.svg.selectAll('.label').data(this.nodes)
    .attr('visibility', this.showLabel ? 'visible': 'hidden');
};

NetworkRenderer.prototype.toggleTF2TFEdge = function() {
  var layout = this;
    this.showTF2TFEdge = !this.showTF2TFEdge;
  this.toggleEdge();
};

NetworkRenderer.prototype.toggleTF2nTFEdge = function() {
    var layout = this;
    this.showTF2nTFEdge = !this.showTF2nTFEdge;
  this.toggleEdge();
};

NetworkRenderer.prototype.toggleEdge = function() {
  var layout = this;
  d3.selectAll('.link').data(this.data.links)
    .attr('visibility', function(d) { return layout.checkVisible(d); });
  d3.selectAll('.linkiobj').data(this.data.links)
    .attr('visibility', function(d) { return layout.checkVisible(d); });
  d3.selectAll('.linkdir').data(this.data.links)
    .attr('visibility', function(d) { return layout.checkVisible(d); });
};

NetworkRenderer.prototype.checkVisible = function(d) {
  var layout = this;
  if (d.source.isTF && d.target.isTF) return layout.showTF2TFEdge ? 'visible': 'hidden';
  else if (utils.xor(d.source.isTF, d.target.isTF)) return layout.showTF2nTFEdge ? 'visible': 'hidden';
  else return 'visible';
};

NetworkRenderer.prototype.toggleEdgeListing = function() {
  this.edgeListing = !this.edgeListing;
  $('#'+ this.htmlid + ' #edgelist').attr('checked', this.edgeListing);
};

NetworkRenderer.prototype.toggleForce = function() {
  if (this.forcing) this.force.stop();
  else this.force.resume();
  this.forcing = !this.forcing;
};


NetworkRenderer.prototype.showMsg = function(msg, ui) {
  this.removeLayout();
  if (ui == null) ui = false;
  $('#'+ this.htmlid).append("<div id='hint' class='hint'></div>");
  $('#'+ this.htmlid + ' #hint').text(msg).css({'width': this.width, 'height': this.rawheight - (ui && !this.compactLayou ? this.uiHeight : 0) });
};

NetworkRenderer.prototype.showError = function() {
  this.showMsg('Oops..this guy is dead. x_X', false);
  this.renderUI();
};

NetworkRenderer.prototype.updateGraphSize = function(newsize) {
  if (this.nodes == null) return;
  var oldwidth = this.width, oldheight = this.graphHeight;
  this.graphHeight = newsize[1] - (this.compactLayout ? 0 : this.uiHeight);
  var xratio = newsize[0] / oldwidth, yratio = this.graphHeight / oldheight;
  var dx = (newsize[0] - oldwidth) / 2, dy = (this.graphHeight - oldheight) / 2;
  if (xratio >= 1.0 && yratio >= 1.0) {
    var ratio = Math.max(xratio, yratio);
  }else if (xratio < 1.0 && yratio < 1.0) {
    var ratio = Math.min(xratio, yratio);
  }else {
    var ratio = 1.0;
  }
  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].x += dx;
    this.nodes[i].y += dy;
    //this.nodes[i].x += dx;
    //this.nodes[i].y += dy;
    }
  this.force.size([newsize[0], this.graphHeight]);
};

NetworkRenderer.prototype.resizeLayout = function(newsize) {
  if (this.parentView.showHeader == false) newsize[1] += manager.headerHeight;

  this.updateGraphSize(newsize);
  this.width = newsize[0];
    this.rawheight = newsize[1];
  this.removeLayout();
  if (!this.compactLayout) this.renderUI();

  if (this.nodes == null) return;
    this.renderLayout();
};

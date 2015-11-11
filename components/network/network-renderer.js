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

  /**
   * Filter settings.
   * @protected {!Object}
   */
  this.filter = {
    edgeWeight: [-Infinity, Infinity],
    showTFToTF: true,
    showTFToNonTF: true
  };

  // Color scale encoding edge weights.
  /** @private {!d3.scale} */
  this.colorScale_ = d3.scale.linear();

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

  // Navigation state.
  /** @private {!Array<number>} */
  this.zoomTranslate_ = [0, 0];
  /** @private {number} */
  this.zoomScale_ = 1.0;
  /** @private {NetworkRenderer.MouseState} */
  this.mouseState_ = this.MouseState.NONE;
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

/**
 * Scaling extent for D3 zoom.
 * @const {!Array<number>}
 */
NetworkRenderer.prototype.ZOOM_EXTENT = [.03125, 8];

/** @const {number} */
NetworkRenderer.prototype.NODE_LABEL_SIZE = 14;
/** @const {number} */
NetworkRenderer.prototype.NODE_LABEL_OFFSET_X = 10;
/** @const {number} */
NetworkRenderer.prototype.NODE_LABEL_OFFSET_Y =
    NetworkRenderer.prototype.NODE_LABEL_SIZE / 2;
/** @const {number} */
NetworkRenderer.prototype.NODE_SIZE = 5;
/** @const {number} */
NetworkRenderer.prototype.EDGE_ARROW_LENGTH = 10;
/**
 * Shifting percentage of curved edge.
 * @const {number}
 */
NetworkRenderer.prototype.EDGE_CURVE_SHIFT = 0.1;


/** @inheritDoc */
NetworkRenderer.prototype.init = function() {
  NetworkRenderer.base.init.call(this);

  /** @private {d3.zoom} */
  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(this.ZOOM_EXTENT)
    .on('zoom', this.zoomHandler_.bind(this));
  this.canvas.call(this.zoom_);
};

/** @inheritDoc */
NetworkRenderer.prototype.initLayout = function() {
  // Create group elements in the svg for nodes, edges, etc.
  // Groups shall be created in the reverse order of their appearing order.
  /**
   * SVG group for edges.
   * @private {!d3.selection}
   */
  this.svgEdges_ = this.canvas.append('g')
    .classed('edges render-group', true);
  /**
   * SVG group for nodes.
   * @private {!d3.selection}
   */
  this.svgNodes_ = this.canvas.append('g')
    .classed('nodes render-group', true);
  /**
   * SVG group for node labels.
   * @private {!d3.selection}
   */
  this.svgNodeLabels_ = this.canvas.append('g')
    .classed('node-labels render-group', true);
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
 * Updates the network without starting force.
 */
NetworkRenderer.prototype.update = function() {
  this.drawNetwork_();
};

/**
 * Updates the visibility of edges based on the properties of their connecting
 * nodes.
 * This must be called after the data is prepared (nodes in edge objects are
 * replaced by node references.
 */
NetworkRenderer.prototype.updateVisibility = function() {
  for (var id in this.edges_) {
    var edge = this.edges_[id];
    edge.visible = true;
    if (edge.source.isTF) {
      if (edge.target.isTF && !this.data.options.showTFToTF ||
          !edge.target.isTF && !this.data.options.showTFToNonTF) {
        edge.visible = false;
      }
    }
  }
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
 * Handles mouse zoom event.
 * @private
 */
NetworkRenderer.prototype.zoomHandler_ = function() {
  var translate = d3.event.translate;
  var scale = d3.event.scale;

  this.canvas.selectAll('.render-group')
    .attr('transform', Utils.getTransform(translate, scale));

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;

  this.drawNetwork_();
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
    .range(Data.redBlueScale);

  // Store which nodes exist in the new data.
  // The nodes belong to both old and new data shall not be assigned
  // a new position.
  var nodeIds = {};

  this.data.nodes.forEach(function(node) {
    if (!this.nodes_[node.id]) {
      this.nodes_[node.id] = _.extend({}, node);
    }
    nodeIds[node.id] = true;
  }, this);
  this.nodes_ = _(this.nodes_).pick(function(node, id) {
    return id in nodeIds;
  });

  // Edges do not have position data to keep. Simply reset.
  this.edges_ = {};
  this.data.edges.forEach(function(edge) {
    if (!this.nodes_[edge.source] || !this.nodes_[edge.target]) {
      Core.error('edge contains nodes that do not exist', JSON.stringify(edge));
      this.showFailure();
    }
    if (!this.edges_[edge.id]) {
      this.edges_[edge.id] = {
        id: edge.id,
        source: this.nodes_[edge.source],
        target: this.nodes_[edge.target],
        weight: edge.weight,
        visible: true
      };
    }
  }, this);

  // Stop potentially existing previous force.
  this.force_.stop();

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
  var genesRegular = [];
  var genesTF = [];
  $.each(this.nodes_, function(id, node) {
    if (node.isTF) {
      genesTF.push(node);
    } else {
      genesRegular.push(node);
    }
  });

  // Draw regular genes as circles.
  var nodesRegular = this.svgNodes_.selectAll('circle')
    .data(genesRegular, function(node) {
      return node.id;
    });
  nodesRegular.enter().append('circle')
    .attr('r', this.NODE_SIZE);
  nodesRegular.exit().remove();
  nodesRegular
    .attr('cx', function(node) {
      return node.x;
    })
    .attr('cy', function(node) {
      return node.y;
    });

  var nodesTF = this.svgNodes_.selectAll('rect')
    .data(genesTF, function(node) {
      return node.id;
    });
  nodesTF.enter().append('rect')
    .attr('width', this.NODE_SIZE * 2)
    .attr('height', this.NODE_SIZE * 2);
  nodesTF.exit().remove();
  nodesTF
    .attr('x', function(node) {
      return node.x - this.NODE_SIZE;
    }.bind(this))
    .attr('y', function(node) {
      return node.y - this.NODE_SIZE;
    }.bind(this));

  this.drawNodeLabels_();
};

/**
 * Renders the node labels. This is only called from drawNodes_
 * when options.showLabels is set.
 * @private
 */
NetworkRenderer.prototype.drawNodeLabels_ = function() {
  if (!this.data.options.showLabels) {
    this.svgNodeLabels_.selectAll('*').remove();
    return;
  }
  var labels = this.svgNodeLabels_.selectAll('text')
    .data(_.toArray(this.nodes_), function(node) {
      return node.id;
    });
  labels.enter().append('text')
    .text(function(node) {
      return node.name;
    })
  labels.exit().remove();
  var fontSize = this.NODE_LABEL_SIZE / this.zoomScale_;
  var yOffset = this.NODE_LABEL_OFFSET_Y / this.zoomScale_;
  labels
    .style('font-size', fontSize)
    .attr('x', function(node) {
      return node.x + this.NODE_LABEL_OFFSET_X;
    }.bind(this))
    .attr('y', function(node) {
      return node.y + yOffset;
    }.bind(this));
};


/**
 * Renders the network edges.
 * @private
 */
NetworkRenderer.prototype.drawEdges_ = function() {
  // Use color to encode edge weight.
  var getEdgeColor = function(edge) {
    return this.colorScale_(edge.weight);
  }.bind(this);

  // Create a shifted point around the middle of the edge to be the control
  // point of the edge's curve.
  var getShiftPoint = function(ps, pt) {
    var m = Utils.middlePoint(ps, pt);
    var d = Utils.subtractVector(ps, pt);
    d = Utils.perpendicularVector(d);
    d = Utils.normalizeVector(d);
    d = Utils.multiplyVector(d, Utils.vectorDistance(ps, pt) *
      this.EDGE_CURVE_SHIFT);
    return Utils.addVector(m, d);
  }.bind(this);

  var gs = this.svgEdges_.selectAll('g')
    .data(_.toArray(this.edges_), function(edge) {
      return edge.id;
    });
  var gsEnter = gs.enter().append('g')
    .style('stroke', getEdgeColor)
    .style('fill', getEdgeColor);
  gsEnter.append('path')
    .classed('edge', true);
  gsEnter.append('path')
    .classed('arrow', true);
  gs.exit().remove();

  // Update visibility
  gs.style('display', function(edge) {
    return edge.visible ? '' : 'none';
  });

  var curve = d3.svg.line().interpolate('basis');
  this.svgEdges_.selectAll('path.edge')
    .data(_.toArray(this.edges_), function(edge) {
      return edge.id;
    })
    .attr('d', function(edge) {
      var ps = [edge.source.x, edge.source.y];
      var pt = [edge.target.x, edge.target.y];
      var pm = getShiftPoint(ps, pt);
      return curve([ps, pm, pt]);
    });

  // Create a stroke that looks like an arrow.
  var getArrowPoints = function(ps, pt) {
    var pm = getShiftPoint(ps, pt);
    var ds = Utils.normalizeVector(Utils.subtractVector(ps, pt));
    var dm = Utils.normalizeVector(Utils.subtractVector(pm, pt));
    var p1 = Utils.addVector(pt, Utils.multiplyVector(dm, this.NODE_SIZE));
    var p2 = Utils.addVector(p1, Utils.multiplyVector(ds, this.EDGE_ARROW_LENGTH));
    var p3 = Utils.mirrorPoint(p2, p1, pm, 1);
    return [p1, p2, p3];
  }.bind(this);

  var line = d3.svg.line().interpolate('linear-closed');
  this.svgEdges_.selectAll('path.arrow')
    .data(_.toArray(this.edges_), function(edge) {
      return edge.id;
    })
    .attr('d', function(edge) {
      var ps = [edge.source.x, edge.source.y];
      var pt = [edge.target.x, edge.target.y];
      var points = getArrowPoints(ps, pt);
      return line(points);
    });
};


/*
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

NetworkRenderer.prototype.toggleForce = function() {
  if (this.forcing) this.force.stop();
  else this.force.resume();
  this.forcing = !this.forcing;
};
*/

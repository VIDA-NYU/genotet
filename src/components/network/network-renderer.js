/**
 * @fileoverview Renderer of the NetworkView.
 */

'use strict';

/**
 * NetworkRenderer renders the visualizations for the NetworkView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewRenderer}
 * @constructor
 */
genotet.NetworkRenderer = function(container, data) {
  genotet.NetworkRenderer.base.constructor.call(this, container, data);

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
   * @private {!d3.layout.force}
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
  /** @private {genotet.NetworkRenderer.MouseState} */
  this.mouseState_ = genotet.NetworkRenderer.MouseState.NONE;
};

genotet.utils.inherit(genotet.NetworkRenderer, genotet.ViewRenderer);

/**
 * State of mouse interaction.
 * @enum {number}
 */
genotet.NetworkRenderer.MouseState = {
  NONE: 0,
  SELECT: 1,
  ZOOM: 2
};

/**
 * Scaling extent for D3 zoom.
 * @const {!Array<number>}
 */
genotet.NetworkRenderer.ZOOM_EXTENT = [.03125, 8];

/** @const {number} */
genotet.NetworkRenderer.prototype.NODE_LABEL_SIZE = 14;
/** @const {number} */
genotet.NetworkRenderer.prototype.NODE_LABEL_OFFSET_X = 10;
/** @const {number} */
genotet.NetworkRenderer.prototype.NODE_LABEL_OFFSET_Y =
    genotet.NetworkRenderer.prototype.NODE_LABEL_SIZE / 2;
/** @const {number} */
genotet.NetworkRenderer.prototype.NODE_SIZE = 6;
/** @const {number} */
genotet.NetworkRenderer.prototype.EDGE_ARROW_LENGTH = 10;
/**
 * Shifting percentage of curved edge.
 * @const {number}
 */
genotet.NetworkRenderer.prototype.EDGE_CURVE_SHIFT = 0.1;


/** @inheritDoc */
genotet.NetworkRenderer.prototype.init = function() {
  genotet.NetworkRenderer.base.init.call(this);

  /** @private {d3.zoom} */
  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(genotet.NetworkRenderer.ZOOM_EXTENT)
    .on('zoom', this.zoomHandler_.bind(this));
  this.canvas.call(this.zoom_);
};

/** @inheritDoc */
genotet.NetworkRenderer.prototype.initLayout = function() {
  // Create group elements in the svg for nodes, edges, etc.
  // Groups shall be created in the reverse order of their appearing order.
  /**
   * SVG group for edges.
   * @private {!d3}
   */
  this.svgEdges_ = this.canvas.append('g')
    .classed('edges render-group', true);
  /**
   * SVG group for nodes.
   * @private {!d3}
   */
  this.svgNodes_ = this.canvas.append('g')
    .classed('nodes render-group', true);
  /**
   * SVG group for node labels.
   * @private {!d3}
   */
  this.svgNodeLabels_ = this.canvas.append('g')
    .classed('node-labels render-group', true);
};

/**
 * Renders the network onto the scene.
 * @override
 */
genotet.NetworkRenderer.prototype.render = function() {
  if (!this.dataReady()) {
    return;
  }
  this.force_
    .size([this.canvasWidth, this.canvasHeight])
    .start();
};

/**
 * Updates the network without starting force.
 */
genotet.NetworkRenderer.prototype.update = function() {
  this.drawNetwork_();
};

/**
 * Updates the visibility of edges based on the properties of their connecting
 * nodes.
 * This must be called after the data is prepared (nodes in edge objects are
 * replaced by node references.
 */
genotet.NetworkRenderer.prototype.updateVisibility = function() {
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
genotet.NetworkRenderer.prototype.dataLoaded = function() {
  this.prepareData_();
  this.render();
};

/**
 * Re-renders the scene upon resize.
 * @override
 */
genotet.NetworkRenderer.prototype.resize = function() {
  genotet.NetworkRenderer.base.resize.call(this);
  this.render();
};

/**
 * Handles mouse zoom event.
 * @private
 */
genotet.NetworkRenderer.prototype.zoomHandler_ = function() {
  var translate = d3.event.translate;
  var scale = d3.event.scale;

  this.canvas.selectAll('.render-group')
    .attr('transform', genotet.utils.getTransform(translate, scale));

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;

  this.drawNetwork_();
};

/** @inheritDoc */
genotet.NetworkRenderer.prototype.dataReady = function() {
  return this.data.network.nodes != null;
};


/**
 * Prepares necessary things for rendering the data, e.g. color scale.
 * @private
 */
genotet.NetworkRenderer.prototype.prepareData_ = function() {
  this.colorScale_ = d3.scale.linear()
    .domain([this.data.network.weightMin, this.data.network.weightMax])
    .range(genotet.data.redBlueScale);

  // Store which nodes exist in the new data.
  // The nodes belong to both old and new data shall not be assigned
  // a new position.
  var nodeIds = {};

  this.data.network.nodes.forEach(function(node) {
    if (!this.nodes_[node.id]) {
      this.nodes_[node.id] = _.extend({}, node);
    }
    nodeIds[node.id] = true;
  }, this);
  this.nodes_ = /** @type {!Object<!Object>}*/(_.pick(this.nodes_,
    function(node, id) {
      return id in nodeIds;
   })
  );

  // Edges do not have position data to keep. Simply reset.
  this.edges_ = {};
  this.data.network.edges.forEach(function(edge) {
    if (!this.nodes_[edge.source] || !this.nodes_[edge.target]) {
      genotet.error('edge contains nodes that do not exist',
          JSON.stringify(edge));
      // TODO(bowen): show failure after fixing.
      // this.showFailure();
      return;
    }
    if (!this.edges_[edge.id]) {
      this.edges_[edge.id] = {
        id: edge.id,
        source: this.nodes_[edge.source],
        target: this.nodes_[edge.target],
        weight: edge.weight[0],
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
genotet.NetworkRenderer.prototype.drawNetwork_ = function() {
  this.drawNodes_();
  this.drawEdges_();
};

/**
 * Renders the network nodes.
 * @private
 */
genotet.NetworkRenderer.prototype.drawNodes_ = function() {
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
    .attr('r', this.NODE_SIZE)
    .attr('id', function(node) {
      return node.id;
    })
    .on('click', function(node) {
      this.signal('nodeClick', node);
      this.selectNode(node);
    }.bind(this))
    .on('mouseenter', function(node) {
      this.signal('nodeHover', node);
    }.bind(this))
    .on('mouseleave', function(node) {
      this.signal('nodeUnhover', node);
    }.bind(this));
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
    .attr('id', function(node) {
      return node.id;
    })
    .attr('width', this.NODE_SIZE * 2)
    .attr('height', this.NODE_SIZE * 2)
    .on('click', function(node) {
      this.signal('nodeClick', node);
      this.selectNode(node);
    }.bind(this))
    .on('mouseenter', function(node) {
      this.signal('nodeHover', node);
    }.bind(this))
    .on('mouseleave', function(node) {
      this.signal('nodeUnhover', node);
    }.bind(this));
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
genotet.NetworkRenderer.prototype.drawNodeLabels_ = function() {
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
      return node.label;
    });
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
genotet.NetworkRenderer.prototype.drawEdges_ = function() {
  // Use color to encode edge weight.
  var getEdgeColor = function(edge) {
    return this.colorScale_(edge.weight);
  }.bind(this);

  // Create a shifted point around the middle of the edge to be the control
  // point of the edge's curve.
  var getShiftPoint = function(ps, pt) {
    var m = genotet.utils.middlePoint(ps, pt);
    var d = genotet.utils.subtractVector(ps, pt);
    d = genotet.utils.perpendicularVector(d);
    d = genotet.utils.normalizeVector(d);
    d = genotet.utils.multiplyVector(d, genotet.utils.vectorDistance(ps, pt) *
      this.EDGE_CURVE_SHIFT);
    return genotet.utils.addVector(m, d);
  }.bind(this);

  var gs = this.svgEdges_.selectAll('g')
    .data(_.toArray(this.edges_), function(edge) {
      return edge.id;
    });
  var gsEnter = gs.enter().append('g')
    .style('stroke', getEdgeColor)
    .style('fill', getEdgeColor)
    .on('click', function(edge) {
      this.signal('edgeClick', edge);
      this.selectEdge(edge);
    }.bind(this))
    .on('mouseenter', function(edge) {
      this.signal('edgeHover', edge);
    }.bind(this))
    .on('mouseleave', function(edge) {
      this.signal('edgeUnhover', edge);
    }.bind(this));
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
    var ds = genotet.utils.normalizeVector(
        genotet.utils.subtractVector(ps, pt));
    var dm = genotet.utils.normalizeVector(
        genotet.utils.subtractVector(pm, pt));
    var p1 = genotet.utils.addVector(pt,
        genotet.utils.multiplyVector(dm, this.NODE_SIZE));
    var p2 = genotet.utils.addVector(p1,
        genotet.utils.multiplyVector(ds, this.EDGE_ARROW_LENGTH));
    var p3 = genotet.utils.mirrorPoint(p2, p1, pm);
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

/**
 * Selects a node to highlight it.
 * @param {!Object} node Node selected.
 */
genotet.NetworkRenderer.prototype.selectNode = function(node) {
  this.data.nodeSelected = node;
  var idSelected = node.id;
  this.svgNodes_.selectAll('rect, circle')
    .classed('active', function(node) {
      return node.id == idSelected;
    }.bind(this));
};

/**
 * Selects an edge to highlight it.
 * @param {!Object} edge Edge selected.
 */
genotet.NetworkRenderer.prototype.selectEdge = function(edge) {
  this.data.edgeSelected = edge;
  var idSelected = edge.id;
  this.svgEdges_.selectAll('g')
    .classed('active', function(edge) {
      return edge.id == idSelected;
    }.bind(this));
};

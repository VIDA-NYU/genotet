
// Graph View

/*
 * Graph View renders a general graph, with basic functionality and interaction
 */

"use strict";

var extObject = {
  createHandlers: function() {
    this.loader = GraphLoader.new();
    this.controller = GraphController.new();
    this.renderer = GraphRenderer.new();
  },

  initGraph: function(selection) {
    var selectedNodes = {};
    this.renderData = {
      nodes: [],
      edges: []
    };
    var nodeIndex = 0;
    // find all nodes that match the selection criterion
    for (var i in this.data.nodes) {
      var node = this.data.nodes[i];
      if (node.name.match(selection)) {
        selectedNodes[node.id] = nodeIndex++;
        this.renderData.nodes.push(node);
      }
    }
    // find all edges with both source and target selected
    for (var i in this.data.edges) {
      var edge = this.data.edges[i];
      if (selectedNodes[edge.source] && selectedNodes[edge.target]) {
          // remap indexes for d3 force
          this.renderData.edges.push({
            source: selectedNodes[edge.source],
            target: selectedNodes[edge.target],
            weight: edge.weight
          });
        }
    }
    this.forceLayout();
  },

  forceLayout: function() {
    var view = this;

    // make a copy of data to use d3 layout
    this.forceData = {
      nodes: [],
      links: []
    };
    $.extend(true, this.forceData.nodes, this.renderData.nodes);
    $.extend(true, this.forceData.links, this.renderData.edges);

    this.forceData.force = d3.layout.force()
      .charge(-20000)
      .gravity(1.0)
      .linkDistance(20)
      .friction(0.6)
      .size([this.getCanvasWidth(), this.getCanvasHeight()])
      .on("tick", function(){
        view.updateGraphLayout();
      })
      .on("end", function(){
        view.endForce();
      });

    this.forceData.force
      .nodes(this.forceData.nodes)
      .links(this.forceData.links)
      .size([this.getCanvasWidth(), this.getCanvasHeight()]);

    console.log(this.forceData, this.getCanvasWidth(), this.getCanvasHeight());
    this.forceData.force.start();
  },

  updateGraphLayout: function() {
    var forceNodes = this.forceData.nodes,
        forceLinks = this.forceData.links;

    for (var i in forceNodes) {
      this.renderData.nodes[i].x = forceNodes[i].x;
      this.renderData.nodes[i].y = forceNodes[i].y;
    }
    //console.log(forceNodes[0], forceLinks[0])

    this.render();
  },

  endForce: function() {

  },

  onResize: function() {
    this.forceLayout();
    this.render();
  }
};

var GraphView = View.extend(extObject);

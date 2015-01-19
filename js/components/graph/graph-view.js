
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
    console.log(this.renderData);
  },

  onResize: function() {
    this.render();
  }
};

var GraphView = View.extend(extObject);

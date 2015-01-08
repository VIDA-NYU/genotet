
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

  onResize: function() {
    this.render();
  }
};

var GraphView = View.extend(extObject);

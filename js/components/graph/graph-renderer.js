
// Graph Renderer

"use strict";

var extObject = {
  createHandlers: function() {
    this.loader = GraphLoader.new();
    this.controller = GraphController.new();
    this.renderer = GraphRenderer.new();
  }
};

var GraphRenderer = Renderer.extend(extObject);

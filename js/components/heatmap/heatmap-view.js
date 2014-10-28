
// Heatmap View

"use strict";

var extObject = {
  createHandlers: function() {
    this.loader = HeatmapLoader.new();
    this.controller = HeatmapController.new();
    this.renderer = HeatmapRenderer.new();
  }
};

var HeatmapView = View.extend(extObject);

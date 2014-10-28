
// Expression Matrix View

"use strict";

var extObject = {
  createHandlers: function() {
    this.controller = ExpressionController.new();
    this.loader = ExpressionLoader.new();
    this.renderer = ExpressionRenderer.new();
  }
};

var ExpressionView = HeatmapView.extend(extObject);

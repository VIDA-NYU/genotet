
// Histogram View

"use strict";

var extObject = {
  createHandlers: function() {
    this.loader = Loader.new();
    this.controller = Controller.new();
    this.renderer = Renderer.new();
  }
};

var HistogramView = View.extend(extObject);

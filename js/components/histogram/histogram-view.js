
// Histogram View

"use strict";

var extObject = {
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = Loader.new();
    this.controller = Controller.new();
    this.renderer = Renderer.new();
  }
};

var HistogramView = View.extend(extObject);

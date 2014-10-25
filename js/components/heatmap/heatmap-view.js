
// Heatmap View

"use strict";

var extObject = {
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = new HeatmapLoader();
    this.controller = new HeatmapController();
    this.renderer = new HeatmapRenderer();
  }
};

var HeatmapView = View.extend(extObject);

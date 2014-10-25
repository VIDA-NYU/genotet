
// Histogram View

"use strict";

var extObject = {
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = new HistogramLoader();
    this.ui = UI.new();
    this.renderer = new HistogramRenderer();
  }
};

var HistogramView = View.extend(extObject);

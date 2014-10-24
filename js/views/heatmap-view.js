var HeatmapView = View.extend({
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = new HeatmapLoader();
    this.ui = new HeatmapUI();
    this.renderer = new HeatmapRenderer();
  }
});

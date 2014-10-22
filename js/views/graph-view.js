var GraphView = View.extend({
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = new GraphLoader();
    this.ui = new GraphUI();
    this.renderer = new GraphRenderer();
  }
});

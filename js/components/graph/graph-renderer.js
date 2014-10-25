var extObject = {
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  },
  createHandlers: function() {
    this.loader = GraphLoader.new();
    this.controller = GraphController.new();
    this.renderer = GraphRenderer.new();
  }
};
var GraphRenderer = Renderer.extend(extObject);

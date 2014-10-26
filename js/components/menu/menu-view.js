var MenuView = View.extend({
  createHandlers: function() {
    this.loader = Loader.new();
    this.controller = Controller.new();
    this.renderer = MenuRenderer.new(this);
  },
  prepareDiv: function() {
    this.jqnode
      .attr("id", "view" + this.viewid)
      .attr("class", "view-div");

    this.width = $(this.jqnode).width();
    this.height = $(this.jqnode).height();

    $("<h3></h3>").appendTo(this.jqnode)
      .attr("id", "viewheader" + this.viewid)
      .attr("class", "ui-widget-header")
      .text(this.viewname);
  }
});

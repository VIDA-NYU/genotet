var MenuView = View.extend({
  createDiv: function() {
    this.jqnode = $("<div></div>").appendTo(layoutManager.menuNode.centerPane);
  },
  createHandlers: function() {
    this.loader = new MenuLoader();
    this.ui = new MenuUI();
    this.renderer = new MenuRenderer();
  },
  prepareDiv: function() {
    this.jqnode
      .attr("id", "view" + this.viewid)
      .attr("class", "ui-widget-content view");

    this.width = $(this.jqnode).width();
    this.height = $(this.jqnode).height();

    $("<h3></h3>").appendTo(this.jqnode)
      .attr("id", "viewheader" + this.viewid)
      .attr("class", "ui-widget-header")
      .text(this.viewname);
  }
});

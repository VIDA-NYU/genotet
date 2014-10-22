var TableView = View.extend({
  createDiv: function() {
    this.jqnode = $("<div></div>").appendTo(layoutManager.infoNode.centerPane);
  },
  createHandlers: function() {
    this.loader = new TableLoader();
    this.ui = new TableUI();
    this.renderer = new TableRenderer();
  }
});

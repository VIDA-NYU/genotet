
// Table View

"use strict";

var extObject = {
  createDiv: function() {
    this.jqnode = $("<div></div>").appendTo(layoutManager.infoNode.centerPane);
  },
  createHandlers: function() {
    this.loader = new TableLoader();
    this.ui = new TableUI();
    this.renderer = new TableRenderer();
  }
};

var TableView = View.extend(extObject);

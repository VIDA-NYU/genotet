
// Graph View

"use strict";

var extObject = {
  createDiv: function() {
    this.layout = layoutManager.findSlot(this);
    this.jqnode = $("<div></div>").appendTo(this.layout.centerPane);
  }
};

var GraphView = View.extend(extObject);

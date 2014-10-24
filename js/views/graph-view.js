"use strict";

var extObject = {
  createDiv: function() {
    var node = layoutManager.findSlot(this.viewname);
    this.jqnode = $("<div></div>").appendTo(node);
  }
};

var GraphView = View.extend(extObject);

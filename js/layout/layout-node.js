
// Nodes in the layout tree

/*
 * The layout tree currently expands to the east or south in the viewNode
 */

"use strict";

function LayoutNode(jqnode, options) {
  if (options.useExistingNode) {
    this.centerPane = jqnode.children(".ui-layout-center");
    this.northPane = jqnode.children(".ui-layout-north");
    this.westPane = jqnode.children(".ui-layout-west");
    this.southPane = jqnode.children(".ui-layout-south");
    this.eastPane = jqnode.children(".ui-layout-east");
  } else {
    this.centerPane = $("<div class='ui-layout-center'></div>")
      .css("overflow", "auto")
      .appendTo(jqnode);
    this.eastPane = $("<div class='ui-layout-east'></div>")
      .appendTo(jqnode);
    this.westPane = $("<div class='ui-layout-west'></div>")
      .appendTo(jqnode);
    this.southPane = $("<div class='ui-layout-south'></div>")
      .appendTo(jqnode);
    this.northPane = $("<div class='ui-layout-north'></div>")
      .appendTo(jqnode);
  }

  if (options == null) console.error("layout options cannot be null");

  var exoptions = {};
  var node = this;
  _(exoptions).extend(options);
  exoptions.center__onresize = function() {
    var w = node.layout.state.center.innerWidth,
        h = node.layout.state.center.innerHeight;
    for (var i = 0; i < node.views.length; i++) {
      node.views[i].__onResize(w, h);
    }
  };
  this.layout = jqnode.layout(exoptions);
  this.jqnode = jqnode;
  this.views = [];
  this.children = {
    east: null,
    west: null,
    north: null,
    south: null
  };
  this.childrenSize = {
    east: "50%",
    south: "50%",
    west: "50%",
    north: "50%"
  };
  this.parent = null;
  this.parentDirection = null;
  this.allowEastSplit = true;
  this.allowSouthSplit = true;
  return this;
}

LayoutNode.prototype.directions = ["east", "south", "north", "west"];

LayoutNode.prototype.addView = function(view) {
  this.views.push(view);
  view.layout = this;
};

LayoutNode.prototype.setChild = function(direction, child, options) {
  if (child == null) console.error("setting empty child for LayoutPane");
  this.children[direction] = child;
  if (options == null) options = {};
  if (options.autoResizeChildren) {
    this.layout.sizePane(direction, this.childrenSize[direction]);
  }
  this.layout.show(direction, true, options.noAnimation);
  this.layout.resizeAll();
  child.parent = this;
  child.parentDirection = direction;
};

LayoutNode.prototype.removeChild = function(direction, options) {
  if (options == null) options = {};
  this.children[direction] = null;
  this.layout.hide(direction, options.noAnimation);
};

LayoutNode.prototype.relocate = function(jqnode) {
  // reset the jqnode (panes) to point to new div element
  this.jqnode = jqnode;
  this.centerPane = jqnode.children(".ui-layout-center");
  this.northPane = jqnode.children(".ui-layout-north");
  this.westPane = jqnode.children(".ui-layout-west");
  this.southPane = jqnode.children(".ui-layout-south");
  this.eastPane = jqnode.children(".ui-layout-east");
};


LayoutNode.prototype.graft = function(direction, node, options) {
  if (options == null) options = {};

  var pane = direction + "Pane";
  if (this.children[direction]) {
    console.error("graft to an existing branch");
  }

  $(node.jqnode.children()).appendTo(this[pane]);
  var exoptions = {};
  _(exoptions).extend(layoutManager.stdOptions);
  exoptions.useExistingNode = true;
  var child = new LayoutNode(this[pane], exoptions);

  child.views.push(node.views[0]);
  child.views[0].layout = child;
  child.allowEastSplit = node.allowEastSplit;
  child.allowSouthSplit = node.allowSouthSplit;

  node.parent.removeChild(node.parentDirection. options);
  node.layout.destroy();

  this.setChild(direction, child, {
    autoResizeChildren: true,
    noAnimation: true
  });
};


LayoutNode.prototype.remove = function(view, options) {
  if (options == null) options = {};
  for (var i = 0; i < this.views.length; i++) {
    if (this.views[i] === view) {
      this.views.splice(i, 1);
      break;
    }
  }
  if (this.children["east"] || this.children["south"]) {
    // grafting children to this node
    if (this.children["east"]) {
      var child = this.children["east"];
      $(child.centerPane.children()).appendTo(this.centerPane);

      child.layout.destroy();
      $(child.jqnode.children()).remove();

      this.addView(child.views[0]);

      this.removeChild("east", options);
    } else if (this.children["south"]) {
      var descendants = [];
      var now = this;
      while (true) {
        descendants.push(now);
        if (now.children["south"]) now = now.children["south"];
        else break;
      }
      for (var i = 0; i < descendants.length - 1; i++) {
        var now = descendants[i], child = descendants[i + 1];
        $(child.centerPane.children()).appendTo(now.centerPane);
        now.children["south"] = child;

        if (child.children["east"]) {
          var east = child.children["east"];
          now.graft("east", east, options);
        }
        now.addView(child.views[0]);
      }
      var last = descendants[descendants.length - 1];
      last.layout.destroy();
      $(last.jqnode.children()).remove();

      var secondlast = descendants[descendants.length - 2];
      secondlast.removeChild("south", options);
    }
  } else {
    if (this.parent != null) {
      this.layout.destroy(); // do not destroy viewNode
      $(this.jqnode.children()).remove();
      this.parent.removeChild(this.parentDirection, options);
    } else {
      this.allowEastSplit = true;
      this.allowSouthSplit = true;
    }
  }
};
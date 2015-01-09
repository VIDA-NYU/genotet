
// Layout Manager

/*
 * layoutManager object controls and manipulates the view structure
 * The view layout is stored as a tree.
 * Each tree node may have multiple views shown as tabs.
 * Currently, the tree grows always to the east or to the south in the viewNode.
 */

"use strict";

function LayoutManager() {

  var rootOptions = {
    applyDefaultStyles: false,
    spacing_closed: 5,
    spacing_open: 5,
    west__maxSize: 200,
    west__resizable: false,
    west__resizerCursor: "auto",
    west__resizerClass: "menu-layout-resizer",
    south__initHidden: true,
    north__initHidden: true
  };

  this.rootNode = new LayoutNode($("body"), rootOptions);

  this.viewNode = new LayoutNode($("body").children(".ui-layout-center"), this.stdOptions);

  this.menuNode = new LayoutNode($("body").children(".ui-layout-west"), this.stdOptions);

  this.auxNode = new LayoutNode($("body").children(".ui-layout-east"), this.stdOptions);

  var jqInfo = $("body").children(".ui-layout-east").children(".ui-layout-south");
  this.infoNode = new LayoutNode(jqInfo, this.stdOptions);
  var jqControl = $("body").children(".ui-layout-east").children(".ui-layout-center");
  this.controlNode = new LayoutNode(jqControl, this.stdOptions);

  // disable menu scrolling
  this.menuNode.centerPane.css("overflow", "hidden");

  // connect nodes on the tree
  this.rootNode.setChild("west", this.menuNode);
  this.rootNode.layout.sizePane("east", "15%");
  this.rootNode.setChild("east", this.auxNode);
  this.auxNode.layout.sizePane("south", "75%");
  this.auxNode.setChild("south", this.infoNode);

}

LayoutManager.prototype.stdOptions = {
  applyDefaultStyles: false,
  //fxName: "off",
  spacing_closed: 5,
  spacing_open: 5,
  west__initHidden: true,
  east__initHidden: true,
  south__initHidden: true,
  north__initHidden: true
};

LayoutManager.prototype.allocControl = function() {
  return this.controlNode;
};

LayoutManager.prototype.allocDiv = function(type, operator){
  var options = {
    noAnimation: operator === "user" ? false : true
    // TODO: operator system mode has a bug of not resizing initialized view
    // but with animation, test.js cannot create too many views
  };
  if (type === "menu") {
    return this.menuNode;
  } else if (type === "binding") {
    options.horizontalOnly = true;
    return this.findSlot(options);
  } else {
    return this.findSlot(options);
  }
};

// returns a jquery div ready to append
LayoutManager.prototype.findSlot = function(options, node){
  if (node == null)
    node = this.viewNode;
  if (options == null)
    options = {};

  if (node.views.length == 0){
    // current node is empty
    if (options.horizontalOnly)
      node.allowEastSplit = false;
    return node;
  }
  if (!options.horizontalOnly && node.allowEastSplit === true && node.children.east == null) {
    // east has a place
    var child = new LayoutNode(node.jqnode.children(".ui-layout-east"), this.stdOptions);
    node.setChild("east", child, {
      autoResizeChildren: true,
      noAnimation: options.noAnimation
    });
    return this.findSlot(options, child);
  }
  if (node.allowSouthSplit === true && node.children.south == null) {
    // south has a place
    var child = new LayoutNode(node.jqnode.children(".ui-layout-south"), this.stdOptions);
    node.setChild("south", child, {
      autoResizeChildren: true,
      noAnimation: options.noAnimation
    });
    return this.findSlot(options, child);
  }
  return this.findSlot(options, node.children.south);
};




// Layout Manager

/*
 * layoutManager object controls and manipulates the view structure
 * The view layout is stored as a tree.
 * Each tree node may have multiple views shown as tabs.
 * Currently, the tree grows always to the east or to the south in the viewNode.
 */

"use strict";

function LayoutManager() {

  this.rootNode = new LayoutNode($("body"), {
    applyDefaultStyles: false,
    spacing_closed: 5,
    spacing_open: 5,
    west__maxSize: 100,
    west__resizable: false,
    west__resizerCursor: "auto",
    west__resizerClass: "menu-layout-resizer",
    south__initHidden: true,
    north__initHidden: true,
    splitEnabled: {
      west: true,
      east: true
    }
  });

  this.viewNode = new LayoutNode($("body").children(".ui-layout-center"), this.defaultOptions);

  this.menuNode = new LayoutNode($("body").children(".ui-layout-west"),
    _(_.omit(this.defaultOptions)).extend({
      splitEnabled: null
    }));

  this.auxNode = new LayoutNode($("body").children(".ui-layout-east"), this.defaultOptions);

  var jqInfo = $("body").children(".ui-layout-east").children(".ui-layout-south");
  this.infoNode = new LayoutNode(jqInfo, this.defaultOptions);
  var jqControl = $("body").children(".ui-layout-east").children(".ui-layout-center");
  this.controlNode = new LayoutNode(jqControl, this.defaultOptions);

  // disable menu scrolling
  this.menuNode.centerPane.css("overflow", "hidden");

  // connect nodes on the tree
  /*
  this.rootNode.setChild("west", this.menuNode);
  this.rootNode.layout.sizePane("east", "15%");
  this.rootNode.setChild("east", this.auxNode);
  this.auxNode.layout.sizePane("south", "75%");
  this.auxNode.setChild("south", this.infoNode);
*/
}

LayoutManager.prototype.defaultOptions = {
  applyDefaultStyles: false,
  spacing_closed: 5,
  spacing_open: 5,
  west__initHidden: true,
  east__initHidden: true,
  south__initHidden: true,
  north__initHidden: true,
  splitEnabled: {
    east: true,
    south: true
  }
};

LayoutManager.prototype.allocNode = function(type, options){
  if (options == null)
    options = {};

  console.log(type, options);
  if (type === "menu") {
    return this.menuNode;
  } else if (type === "control") {
    return this.controlNode;
  } else {
    return this.findSlot(options, this.viewNode);
  }
};

// returns a jquery div ready to append
// the current findSlot simply creates a new branch at the bottom
LayoutManager.prototype.findSlot = function(options, node){ // options and node are non-null
  if (node.views.length <= 0){ // TODO extensible to tabs
    // current node is empty
    return node;
  }
  /*
  if (!options.horizontalOnly && node.allowEastSplit === true && node.children.east == null) {
    // east has a place
    var child = new LayoutNode(node.jqnode.children(".ui-layout-east"), this.defaultOptions);
    node.setChild("east", child, {
      autoResizeChildren: true,
      noAnimation: options.noAnimation
    });
    return this.findSlot(options, child);
  }
  */
  if (node.splitEnabled["south"] === true && node.children.south == null) {
    // south has a place
    var child = new LayoutNode(node.jqnode.children(".ui-layout-south"), this.defaultOptions);
    node.setChild("south", child, {
      autoResizeChildren: true,
      noAnimation: options.noAnimation
    });
    return child; // child is a newly created node (empty)
  }
  return this.findSlot(options, node.children.south);
};




// Layout Manager

/*
 * layoutManager object controls and manipulates the view structure
 * The view layout is stored as a tree.
 * Each tree node may have multiple views shown as tabs.
 * Currently, the tree grows always to the east or to the south in the viewNode.
 */

"use strict";

function LayoutManager() {

  this.availNodeId = 0;
}

LayoutManager.prototype.defaultOptions = {
  applyDefaultStyles: false,
  spacing_closed: 5,
  spacing_open: 5,
  west__initHidden: true,
  east__initHidden: true,
  south__initHidden: true,
  north__initHidden: true,
  closable: false,
  splitEnabled: {
    east: true,
    south: true,
    west: true,
    north: true
  }
};


LayoutManager.prototype.initLayout = function() {
  this.rootNode = new LayoutNode($("#main"), {
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
    },
    noExpansion: true
  });

  this.viewNode = new LayoutNode(this.rootNode.jqnode.children(".ui-layout-center"),
    this.defaultOptions
  );

  this.menuNode = new LayoutNode(this.rootNode.jqnode.children(".ui-layout-west"),
    _(_.omit(this.defaultOptions)).extend({
      splitEnabled: {},
      noExpansion: true
    }));

  this.auxNode = new LayoutNode(this.rootNode.jqnode.children(".ui-layout-east"),
    _(_.omit(this.defaultOptions)).extend({
      splitEnabled: {
        south: true
      },
      noExpansion: true
    }));

  var jqInfo = this.rootNode.jqnode.children(".ui-layout-east").children(".ui-layout-south");
  this.infoNode = new LayoutNode(jqInfo,
    _(_.omit(this.defaultOptions)).extend({
      splitEnabled: {},
      noExpansion: true
    }));

  var jqControl = this.rootNode.jqnode.children(".ui-layout-east").children(".ui-layout-center");
  this.controlNode = new LayoutNode(jqControl,
    _(_.omit(this.defaultOptions)).extend({
      splitEnabled: {},
      noExpansion: true
    }));

  // disable menu scrolling
  this.menuNode.centerPane.css("overflow", "hidden");

  // connect nodes on the tree
  // NOTE: no longer needed
  /*
  this.rootNode.setChild("west", this.menuNode);
  this.rootNode.layout.sizePane("east", "15%");
  this.rootNode.setChild("east", this.auxNode);
  this.auxNode.layout.sizePane("south", "75%");
  this.auxNode.setChild("south", this.infoNode);
  */
};

LayoutManager.prototype.acquireNodeId = function() {
  return this.availNodeId++;
};

LayoutManager.prototype.allocNode = function(type, options) {
  if (options == null)
    options = {};

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


LayoutManager.prototype.showDropzones = function() {
  if (this.viewNode.views.length === 0) {
    this.viewNode.showCenterDropzone();
  } else {
    this.viewNode.showDropzones();
  }
};
LayoutManager.prototype.hideDropzones = function() {
  $(".view-dropzone")
    .droppable("disable")
    .addClass("view-dropzone-inactive");
};

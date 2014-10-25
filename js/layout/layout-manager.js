
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
    west__resizerCursor: 'auto',
    west__resizerClass: 'menu-layout-resizer',
    south__initHidden: true,
    north__initHidden: true
  };

  this.rootNode = new LayoutNode($('body'), rootOptions);

  this.viewNode = new LayoutNode($('body').children('.ui-layout-center'), this.stdOptions);

  this.menuNode = new LayoutNode($('body').children('.ui-layout-west'), this.stdOptions);

  this.auxNode = new LayoutNode($('body').children('.ui-layout-east'), this.stdOptions);

  var jqInfo = $('body').children('.ui-layout-east').children('.ui-layout-south');
  this.infoNode = new LayoutNode(jqInfo, this.stdOptions);
  var jqControl = $('body').children('.ui-layout-east').children('.ui-layout-center');
  this.controlNode = new LayoutNode(jqControl, this.stdOptions);

  // disable menu scrolling
  this.menuNode.centerPane.css('overflow', 'hidden');

  // connect nodes on the tree
  this.rootNode.setChild('west', this.menuNode);
  this.rootNode.layout.sizePane('east', 350);
  this.rootNode.setChild('east', this.auxNode);
  this.auxNode.layout.sizePane('south', this.auxNode.layout.state.container.innerHeight * 0.75);
  this.auxNode.setChild('south', this.infoNode);

}

LayoutManager.prototype.stdOptions = {
  applyDefaultStyles: false,
  spacing_closed: 5,
  spacing_open: 5,
  west__initHidden: true,
  east__initHidden: true,
  south__initHidden: true,
  north__initHidden: true
};

function LayoutNode(jqnode, options) {
  this.centerPane = $("<div class='ui-layout-center'></div>")
    .appendTo(jqnode)
    .css('overflow', 'hidden');
  $("<div class='ui-layout-east'></div>")
    .appendTo(jqnode);
  $("<div class='ui-layout-west'></div>")
    .appendTo(jqnode);
  $("<div class='ui-layout-south'></div>")
    .appendTo(jqnode);
  $("<div class='ui-layout-north'></div>")
    .appendTo(jqnode);

  if (options == null) console.error('layout options cannot be null');

  this.layout = jqnode.layout(options);
  this.jqnode = jqnode;
  this.views = [];
  this.children = {
    east: null,
    west: null,
    north: null,
    south: null
  };
  this.parent = null;
  this.allowEastSplit = true;
  this.allowSouthSplit = true;

  return this;
}

LayoutNode.prototype.setChild = function(direction, child) {
  if (child == null) console.error('setting empty child for LayoutPane');
  this.children[direction] = child;
  this.layout.show(direction);
  child.parent = this;
};

LayoutManager.prototype.findSlot = function(viewname, horizontalOnly, node){
  if (node == null) node = this.viewNode;
  if (node.views.length == 0){
    // current node is empty
    node.views.push(viewname);
    if (horizontalOnly) node.allowEastSplit = false;
    return node.centerPane;
  }
  if (!horizontalOnly && node.allowEastSplit === true && node.children.east == null) {
    // east has a place
    var child = new LayoutNode(node.jqnode.children('.ui-layout-east'), this.stdOptions);
    node.layout.sizePane('east', node.layout.state.container.innerWidth/2);
    node.setChild('east', child);
    return this.findSlot(viewname, horizontalOnly, child);
  }
  if (node.allowSouthSplit === true && node.children.south == null) {
    // south has a place
    var child = new LayoutNode(node.jqnode.children('.ui-layout-south'), this.stdOptions);
    node.layout.sizePane('south', node.layout.state.container.innerHeight/2);
    node.setChild('south', child);
    return this.findSlot(viewname, horizontalOnly, child);
  }
  return this.findSlot(viewname, horizontalOnly, node.children.south);
};



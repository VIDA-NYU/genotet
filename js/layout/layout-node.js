
// Nodes in the layout tree

/*
 * The layout tree currently expands to the east or south in the viewNode
 */

"use strict";

function LayoutNode(jqnode, options) {

  if (options == null)
    console.error("layout options cannot be null");

  var node = this;

  // allow specification of splitting
  this.splitEnabled = {}; // 4 directions
  _(this.splitEnabled).extend(options.splitEnabled);

/*
  if (options.useExistingNode) {
    this.centerPane = jqnode.children(".ui-layout-center");
    this.northPane = jqnode.children(".ui-layout-north");
    this.westPane = jqnode.children(".ui-layout-west");
    this.southPane = jqnode.children(".ui-layout-south");
    this.eastPane = jqnode.children(".ui-layout-east");
    this.content = this.centerPane.children(".view-content");
  } else {
    */
    this.centerPane = $("<div class='ui-layout-center'></div>")
      .css("overflow", "auto")
      .appendTo(jqnode);
    this.content = $("<div class='view-content'></div>")
      .appendTo(jqnode);
    _.each(this.directions, function(element) {
      if (node.splitEnabled[element] === true) {
        node[element + "Pane"] = $("<div class='ui-layout-" + element + "'></div>")
          .appendTo(jqnode);
      }
    });
  //}

  this.layout = jqnode.layout(_(_.omit(options)).extend({
    center__onresize: function() {
      var w = node.layout.state.center.innerWidth,
          h = node.layout.state.center.innerHeight;
      for (var i = 0; i < node.views.length; i++) {
        node.views[i].__onResize(w, h);
      }
    }
  }));
  this.jqnode = jqnode;
  this.views = [];
  this.children = {}; // 4 directions
  this.childrenOrder = []; // used to determine the replacement when node is removed

  this.childrenSize = {
    east: "50%",
    south: "50%",
    west: "50%",
    north: "50%"
  };
  this.parent = null;
  this.parentDirection = null;
  return this;
}

LayoutNode.prototype.directions = ["east", "south", "north", "west"];

LayoutNode.prototype.addView = function(view) {
  this.views.push(view);
  view.layout = this;
};

LayoutNode.prototype.setChild = function(direction, child, options) {
  if (child == null)
    console.error("setting empty child for LayoutNode");
  this.children[direction] = child;
  this.childrenOrder.push(direction);
  if (options == null)
    options = {};
  if (options.autoResizeChildren) {
    this.layout.sizePane(direction, this.childrenSize[direction]);
  }
  this.layout.show(direction, true, options.noAnimation);
  this.layout.resizeAll();
  child.parent = this;
  child.parentDirection = direction;
};

LayoutNode.prototype.removeChild = function(direction, options) {
  if (options == null)
    options = {};
  this.children[direction] = null;
  this.childrenOrder.splice(this.childrenOrder.indexOf(direction), 1);
  this.layout.hide(direction, options.noAnimation);
  this.layout.resizeAll();
};

/*
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
  if (options == null)
    options = {};

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
*/

LayoutNode.prototype.pushupAllViews = function(options) {
  $(this.content).children().appendTo(this.parent.content);
  for (var i in this.views) {
    this.views[i].layout = this.parent; // redirect layout to parent node
  }
  this.parent.views = this.parent.views.concat(this.views);

  if (this.childrenOrder.length === 0) {
    // no more children
    this.parent.removeChild(this.parentDirection);
    this.destroy();
    return;
  }

  for (var i in this.childrenOrder) {
    var dir = this.childrenOrder[i];
    if (this.children[dir] == null)
      continue;

    var child = this.children[dir];
    child.pushupAllViews(options);

    break;
  }
};

LayoutNode.prototype.destroy = function() {
  if (this.parent != null)
    this.parent.removeChild(this.parentDirection);

  this.layout.destroy();
  $(this.jqnode.children()).remove();
};


LayoutNode.prototype.removeView = function(view, options) {
  if (options == null)
    options = {};
  this.views.splice(this.views.indexOf(view), 1);

  if (this.views.length > 0)  // TODO: this view still have other tabs
    return;

  for (var i in this.childrenOrder) {
    var dir = this.childrenOrder[i];
    if (this.children[dir] == null) {
      console.error("inconsistent children direction");
    }
    console.log(dir, "pushup");
    var child = this.children[dir];
    child.pushupAllViews(options);
    return;
  }

  // no children, this node is leaf and shall be removed
  if (this.parent) {
    this.parent.removeChild(this.parentDirection);
    this.destroy();
  }

  /*
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
  */
};
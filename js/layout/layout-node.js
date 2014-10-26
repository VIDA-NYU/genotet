function LayoutNode(jqnode, options) {
  this.centerPane = $("<div class='ui-layout-center'></div>")
    .appendTo(jqnode)
    .css("overflow", "hidden");
  this.eastPane = $("<div class='ui-layout-east'></div>")
    .appendTo(jqnode);
  this.westPane = $("<div class='ui-layout-west'></div>")
    .appendTo(jqnode);
  this.southPane = $("<div class='ui-layout-south'></div>")
    .appendTo(jqnode);
  this.northPane = $("<div class='ui-layout-north'></div>")
    .appendTo(jqnode);

  if (options == null) console.error("layout options cannot be null");

  var exoptions = {};
  var node = this;
  _(exoptions).extend(options);
  exoptions.onresize = function() {
    var w = node.layout.state.container.innerWidth,
        h = node.layout.state.container.innerHeight;
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
};

LayoutNode.prototype.setChild = function(direction, child, options) {
  if (child == null) console.error("setting empty child for LayoutPane");
  this.children[direction] = child;
  if (options == null) options = {};
  if (options.autoResizeChildren) {
    this.layout.sizePane(direction, this.childrenSize[direction]);
  }
  this.layout.show(direction, true, options.noAnimation);
  child.parent = this;
  child.parentDirection = direction;
};

LayoutNode.prototype.removeChild = function(direction) {
  this.children[direction] = null;
  this.layout.hide(direction);
};

LayoutNode.prototype.remove = function(view) {
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

      this.layout.hide("east");

      this.views.push(child.views[0]);
      child.views[0].layout = this;

      this.children["east"] = null;
    } else if (this.children["south"]) {
      var descendants = [];
      var now = this;
      while (true) {
        descendants.push(now);
        console.log(now.views[0] && now.views[0].viewname);
        if (now.children["south"]) now = now.children["south"];
        else break;
      }
      for (var i = 0; i < descendants.length - 1; i++) {
        var now = descendants[i], child = descendants[i + 1];
        $(child.centerPane.children()).appendTo(now.centerPane);
        now.children["south"] = child;

        /*
        $(child.eastPane.children()).appendTo(now.eastPane);
        if (child.children.east) {
          var eastchild = new LayoutNode(now.jqnode.children(".ui-layout-east"), this.stdOptions);
          now.setChild("east", eastchild, {
            autoResizeChildren: true,
            noAnimation: true
          });
        }
        */
        now.views = [];
        now.views.push(child.views[0]);
        child.views[0].layout = now;
      }
      var last = descendants[descendants.length - 1];
      last.layout.destroy();
      $(last.jqnode.children()).remove();

      var secondlast = descendants[descendants.length - 2];
      secondlast.layout.hide("south");
      secondlast.children["south"] = null;
    }
  } else {
    if (this.parent != null) {
      this.layout.destroy(); // do not destroy viewNode
      $(this.jqnode.children()).remove();
      this.parent.removeChild(this.parentDirection);
    }
  }
};
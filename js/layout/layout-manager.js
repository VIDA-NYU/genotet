// layoutManager object controls and manipulates the view structure
// it stores the views layout as a tree, each tree node may have multiple views shown as tabs

function LayoutManager() {

  var rootOptions = {
    applyDefaultStyles: false,
    spacing_closed: 3,
    spacing_open: 3,
    west__maxSize: 200,
    west__resizable: false,
    west__resizerCursor: "auto",
    west__resizerClass: "menu-layout-resizer"
  };
  var jqroot = $("body");
  this.root = new LayoutPane(jqroot, "root", rootOptions);

  // disable menu scrolling
  $("#root .ui-layout-west").css("overflow", "hidden");
}

function LayoutPane(jqnode, htmlid, options) {
  this.jqnode = jqnode;
  jqnode.attr("id", htmlid);
  if (options == null) {
    options = {
      applyDefaultStyles: false,
      spacing_closed: 3,
      spacing_open: 3
    };
  }
  jqnode.layout(options);
  this.htmlid = htmlid;
  this.views = [];
  this.east = null;
  this.south = null;
  this.west = null;
  this.north = null;
}



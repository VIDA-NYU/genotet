// layoutManager object controls and manipulates the view structure
// it stores the views layout as a tree, each tree node may have multiple views shown as tabs

function LayoutManager() {

  var rootOptions = {
    applyDefaultStyles: false,
    spacing_closed: 3,
    spacing_open: 3,
    west__maxSize: 200,
    west__resizable: false,
    west__resizerCursor: 'auto',
    west__resizerClass: 'menu-layout-resizer'
  };

  this.rootLayout = new LayoutPane($('body'), {
    htmlid: 'root',
    westid: 'menu',
    eastid: 'aux'
  }, rootOptions);

  this.menuLayout = new LayoutPane($('#menu'), {
    htmlid: 'menu'
  }, this.stdOptions);

  this.auxLayout = new LayoutPane($('#aux'), {
    htmlid: 'aux',
    southid: 'info'
  }, this.stdOptions);

  this.infoLayout = new LayoutPane($('#info'), {
    htmlid: 'info'
  }, this.stdOptions);
  // disable menu scrolling
  $('#menupane').css('overflow', 'hidden');

  // connect nodes on the tree
  this.rootLayout.eastLayout = this.auxLayout;
  this.rootLayout.westLayout = this.menuLayout;
  this.auxLayout.southLayout = this.infoLayout;
}

LayoutManager.prototype.stdOptions = {
  applyDefaultStyles: false,
  spacing_closed: 3,
  spacing_open: 3
};

function LayoutPane(jqnode, ids, options) {
  this.jqnode = jqnode;
  if (ids.htmlid == null) console.error('layout htmlid cannot be null');
  jqnode.attr('id', ids.htmlid);

  $("<div class='ui-layout-center'></div>")
    .attr('id', ids.htmlid + 'pane')
    .appendTo(jqnode);

  $("<div class='ui-layout-east'></div>")
    .attr('id', ids.eastid)
    .appendTo(jqnode);
  $("<div class='ui-layout-west'></div>")
    .attr('id', ids.westid)
    .appendTo(jqnode);
  $("<div class='ui-layout-south'></div>")
    .attr('id', ids.southid)
    .appendTo(jqnode);
  $("<div class='ui-layout-north'></div>")
    .attr('id', ids.northid)
    .appendTo(jqnode);

  if (options == null) console.error('layout options cannot be null');

  var exoptions = {};
  _(exoptions).extend(options);
  if (ids.westid == null) exoptions.west__initHidden = true;
  if (ids.eastid == null) exoptions.east__initHidden = true;
  if (ids.southid == null) exoptions.south__initHidden = true;
  if (ids.northid == null) exoptions.north__initHidden = true;

  var layout = jqnode.layout(exoptions);
  /*
  if (ids.westid == null) layout.hide('west');
  if (ids.eastid == null) layout.hide('east');
  if (ids.southid == null) layout.hide('south');
  if (ids.northid == null) layout.hide('north');
  */

  this.ids = ids;
  this.views = [];
  this.eastLayout = null;
  this.westLayout = null;
  this.northLayout = null;
  this.southLayout = null;

  return this;
}

LayoutManager.prototype.findSlot = function(viewname, layout){
  if (layout == null) {
    layout = this.rootLayout;
    jqnode = $("#root");
  }

  if (layout.views.length == 0){
    // current node is empty
    layout.views.push(viewname);
    return jqnode;
  }
  if (layout.ids.eastid == null) {
    // east has a place
    layout.ids.eastid = viewname;
    var jqeast = jqnode.find('.ui-layout-east');
    new LayoutPane(jqeast, {
      htmlid: viewname
    }, this.stdOptions);
    return jqeast;
  }
};
LayoutManager.prototype.findHorizontalSlot = function(){

};




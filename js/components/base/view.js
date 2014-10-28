
// View

/*
 * This is the base class of view.
 * A view shall inherit this class and support the following functions
 * createDiv: set this.jqnode to proper div
 * onLoadComplete: define the action once loader completes loading
 */

"use strict";

var extObject = {
  initialize: function(type, viewname, viewid, layout, ctrllayout) {
    this.type = type;
    this.viewname = viewname;
    this.viewid = viewid;
    this.groupid = viewid;

    this.showHeader = true;

    this.viewWidth = this.viewHeight = 0;
    this.canvasWidth = this.canvasHeight = 0;

    this.linkTargets = [];
    this.linkSources = [];

    this.layout = layout;
    this.ctrllayout = ctrllayout;

    this.prepareView();
    this.createHandlers(); // loader, control and renderer are created in this step

    // reverse references
    this.loader.view = this;
    this.controller.view = this;
    this.renderer.view = this;
  },
  load: function(para) {
    // call like createView(...).load(...)
    this.loader.load(para);
  },
  render: function() {
    this.renderer.render();
  },
  control: function() {
    this.controller.display();
  },
  onResize: function(width, height) {
  },
  prepareView: function() {
    this.jqview = $("<div></div>")
      .attr("class", "view-div")
      .appendTo(this.layout.centerPane);
    this.jqheader = $("<h3></h3>")
      .appendTo(this.jqview);
    this.jqcanvas = $("<div></div>")
      .attr("class", "view-canvas")
      .appendTo(this.jqview);
    this.jqctrl = this.ctrllayout.centerPane;

    this.prepareHeader();
    this.prepareCanvas();

    // and some interaction
    var view = this;
    this.jqview
      //.mousedown(function() { manager.setTopView(view.groupid, view.viewid); })
      .dblclick(function() { view.toggleViewheader(); })
      .click( function() { viewManager.activateView(view.viewname); });
  },
  prepareHeader: function() {
    this.jqheader
      .attr("id", "viewheader" + this.viewid)
      .attr("class", "ui-widget-header")
      .text(this.viewname);
    this.prepareHeaderButtons();
  },
  prepareHeaderButtons: function() {
    var view = this;
    $("<button id='closeBtn' class='view-closebtn'></button>")
      .button({
        icons : { primary : "ui-icon-close" },
        text : false
      })
      .click(function() { viewManager.closeView(view.viewname, "user"); })
      .appendTo(this.jqheader);
    $("<button id='miniBtn' class='view-minibtn'></button>")
      .button({
        icons : { primary : "ui-icon-minus" },
        text : false
      })
      .click(function() { view.toggleCompactLayout(); })
      .appendTo(this.jqheader);
    $("<button id='docBtn' class='view-helpbtn'></button>")
      .button({
        icons : { primary : "ui-icon-help" },
        text : false
      })
      .click(function() { view.showDocument(); })
      .appendTo(this.jqheader);
  },
  prepareCanvas: function() {
    this.jqcanvas
      .attr("id", "canvas" + this.viewid);
    //$(this.jqcanvas).addClass("viewshadow");
      // these functions shall be supported shortly
      //.append("<button id='postBtn' class='view-postbtn'></button>")
      //.append("<button id='getBtn' class='view-getbtn'></button>")
      //.append("<button id='groupBtn' class='view-groupbtn'></button>");

    var view = this;
    /*
    $(this.jqnode).find("#postBtn").button({
      icons: { primary: "ui-icon-signal-diag" },
      text: false
    })
      .mouseover(function() { view.highlightChildren(); })
      .mouseleave(function() { view.unhighlightChildren(); })
      .mousedown(function(e) { view.postEdit(e); });

    $(this.jqnode).find("#getBtn").button({
      icons: { primary: "ui-icon-signal" },
      text: false
    })
      .mouseover(function() { view.highlightParent(); })
      .mouseleave(function() { view.unhighlightParent(); })
      .mousedown(function(e) { view.getEdit(e); });

    $(this.jqnode).find("#groupBtn").button({
      icons: { primary: "ui-icon-newwin" },
      text: false
    })
      .mouseover(function() { view.highlightGroup(view.groupid); })
      .mouseleave(function() { view.unhighlightGroup(view.groupid); })
      .mousedown(function(e) { view.groupEdit(e); });
    */
    //$(this.jqnode)
    //  .css("min-width", 100)
    //  .css("z-index", manager.maxZindex);
    //manager.increaseZindex();
  },
  createHandlers: function() {
    // abstract, must be filled with real constructors
    throw "createHandlers() is not implemented";
  },

  // get functions for loader/controller/renderer
  getJqController: function() {
    return this.jqctrl;
  },
  getJqCanvas: function() {
    return this.jqcanvas;
  },
  getViewWidth: function() {
    return this.viewWidth;
  },
  getViewHeight: function() {
    return this.viewHeight;
  },
  getCanvasWidth: function() {
    return this.canvasWidth;
  },
  getCanvasHeight: function() {
    return this.canvasHeight;
  },

  // button actions
  showDocument: function() {
    window.open("document.html#" + this.type);
  },
  toggleCompactLayout: function() {
    console.log("TODO: compact layout not implemented");
  },
  close: function(options) {
    $(this.jqview).remove();
    this.layout.remove(this, options);
  },

  highlightTitle: function() {
    this.jqheader.addClass("ui-state-highlight");
  },
  unhighlightTitle: function() {
    this.jqheader.removeClass("ui-state-highlight");
  },

  // TODO: cross view communication will be implemented shortly
  /*
  getViewMessage: function(msg){
    if(this.type=="histogram"){
      if(msg.action=="select" && msg.type=="node"){
        var name = msg.para[0]; // get gene name
        this.updateData(null, name);
      }else if(msg.action=="select" && msg.type=="link"){
        var sourceName = msg.para[0];
        var targetName = msg.para[1]; // get target gene
        this.updateData(sourceName, targetName);
      }
    }else if(this.type=="graph"){
      if(msg.action=="show"){
        this.updateData(msg.action, msg.data);
      }else if(msg.action=="hide"){
        this.updateData(msg.action, msg.data);
      }else if(msg.action=="center"){
      }
    }else if(this.type=="heatmap"){
      if(msg.action=="select"){
        if ( msg.type=="node") {
          this.updateData("node", msg.para[0], msg.para[1]);  // gene, network
        }else if (msg.type=="link") {
          this.updateData("link", msg.para[0], msg.para[1]);  // source, target
        }
      }
    }
  },
  getGroupMessage: function(msg){
    if(this.type=="histogram"){
      if(msg.action=="focus"){
        this.loader.updateFocus(msg.chr, msg.xl, msg.xr);
      }else if(msg.action=="chr"){
        this.loader.updateChr(msg.chr);
      }
    }
  },
  postViewMessage: function(msg){
    for(var i=0; i<this.childrenView.length; i++) { // pass message to children
      this.childrenView[i].getViewMessage(msg);
    }
  },
  postGroupMessage: function(msg){
    manager.announceGroupMessage(msg, this.groupid, this.viewid);
  },
  highlightChildren: function(){
    for(var i=0; i<this.childrenView.length; i++) {
      $("#viewheader"+this.childrenView[i].viewid).addClass("ui-state-highlight");
    }
  },
  unhighlightChildren: function(){
    for(var i=0; i<this.childrenView.length; i++) {
      $("#viewheader"+this.childrenView[i].viewid).removeClass("ui-state-highlight");
    }
  },
  highlightParent: function(){
    if(this.parentView!=null)
      $("#viewheader"+this.parentView.viewid).addClass("ui-state-highlight");
  },
  unhighlightParent: function(){
    if(this.parentView!=null)
      $("#viewheader"+this.parentView.viewid).removeClass("ui-state-highlight");
  },
  postEdit: function(e){
    if(e.which==1){
      dialog.dialogLink(this.viewname);
    }else{
      this.unhighlightChildren();
      for(var i=0; i<this.childrenView.length; i++){
        unlinkView(this.viewname, this.childrenView[i].viewname);
      }
    }
  },
  getEdit: function(e){
    if(e.which==3){
      this.unhighlightParent();
      unlinkView(this.parentView.viewname, this.viewname);
    }
  },
  groupEdit: function(e){
    if(e.which==1){
      dialog.dialogGroup(this.viewname);
    }else if(e.which==3){
      // exit from group
      //console.log("quit group")
      manager.unhighlightGroup(this.groupid);
      manager.quitGroup(this.groupid, this.viewid);
    }
  },
  toggleCompactLayout: function(){
    this.compactLayout = !this.compactLayout;

    //$("#viewheader"+this.viewid).hide();
    if(this.compactLayout==true){
      var width = $("#view"+this.viewid).width(), height = $("#view"+this.viewid).height();
      this.lastWidth = width;
      this.lastHeight = height;
      //width = Math.min(manager.compactWidth[this.type], width);
      height = Math.min(manager.compactHeight[this.type], height);
      this.renderer.resizeLayout([width, height]);
      $("#view"+this.viewid).css({
        width: width,
        height: height
      });
    }else{
      var width = $("#view"+this.viewid).width(), height = $("#view"+this.viewid).height();
      this.layout.resizeLayout([this.width, this.lastHeight]);
      $("#view" + this.viewid).css({
        width: this.width,
        height: this.lastHeight
      });

    }
    this.layout.setCompact(this.compactLayout);
  },
  */

  __onResize: function(width, height) {
    // this onResize function shall not be called from view
    this.viewWidth = width;
    this.viewHeight = height;
    this.canvasWidth = width;
    this.canvasHeight = height - this.jqheader.outerHeight(true);
    this.jqcanvas
      .css("height", this.canvasHeight);
    this.onResize(width, height);
  },
  toggleViewheader: function(){
    var view = this;
    view.showHeader = !view.showHeader;
    if (!view.showHeader) {
      $("#viewheader"+view.viewid).hide();
      //view.layout.resizeLayout([view.layout.width, $("#view"+view.viewid).height()]);
    }else{
      $("#viewheader"+view.viewid).show();
      //view.layout.resizeLayout([view.layout.width, $("#view"+view.viewid).height()]);
    }
  }
};

var View = Base.extend(extObject);

/*
  loadData: function(para1, para2, para3, para4){
    var identifier;
    if(this.type=="graph"){
      identifier = {
        "net": para1,
        "exp": para2
      };
    }else if(this.type=="histogram"){
      identifier = {
        "name": para1,
        "chr": para2,
        "gene": para3
      };
    }else if(this.type=="heatmap"){
      identifier = {
        "mat": para1,
        "name": para2,
        "exprows": para3,
        "expcols": para4
      };
    }
    this.loader.loadData(identifier);
  },
*/
/*
  updateData: function(para1, para2, para3){
    var identifier;
    if(this.type=="graph"){ // show or hide edges
      identifier = {
        "action": para1,
        "data": para2
      };
    }else if(this.type=="histogram"){
      identifier = {
        "name": para1,
        "srch": para2
      };
    }else if(this.type=="heatmap"){
      if (para1=="node") {
        identifier = {
          "action": para1,
          "name": para2,
          "net": para3
        };
      }else if (para1=="link") {
        identifier = {
          "action": para1,
          "source": para2,
          "target": para3
        };
      }
    }
    this.loader.updateData(identifier);
  },
  */

/*
View.prototype.init = function(){
  if(this.type=="graph"){
    this.loader = new GraphLoader();
    this.renderer = new GraphRenderer("view"+this.viewid, this.width, this.height);  //-$("#viewheader"+this.viewid).outerHeight()
  }else if(this.type=="histogram"){
    this.loader = new HistogramLoader();
    this.renderer = new HistogramRenderer("view"+this.viewid, this.width, this.height);
  }else if(this.type=="scatterplot"){
    //this.initScatterplot();
  }else if(this.type=="chart"){
  //this.initPalette();
  }else if(this.type=="menu"){
    this.loader = new MenuLoader();
    this.renderer = new MenuRenderer("view"+this.viewid, this.width, this.height);
  }else if(this.type=="heatmap"){
    this.loader = new HeatmapLoader();
    this.renderer = new HeatmapRenderer("view"+this.viewid, this.width, this.height);
  }else if(this.type=="table"){
    this.loader = {}; // shall be containment later
    //this.loader = new LoaderTable();
    this.renderer = new TableRenderer("view"+this.viewid, this.width, this.height);
  }
};
*/


/*
View.prototype.legacy = function (type, viewname, viewid, width, height, left, top){
  if (this.type === "menu")
    this.view =
  else if (this.type === "table")
    this.view = $("<div></div>").appendTo(layoutManager.infoNode.centerPane);
  else if (this.type === "histogram") {
    var node = layoutManager.findSlot(viewname, true);  // horizontal only
    this.view = $("<div></div>").appendTo(node);
  }
  // initialize layout
  this.init();

  //var layout = this.layout;
	this.parentView = null;
	this.childrenView = new Array();
	this.renderer.parentView = this;
	this.loader.parentView = this;

  if (this.type !== "menu") {

    $("#view" + this.viewid).draggable({
      snap : true,
      handle : "h3.ui-widget-header",
      start : function(event, ui) {
        view.startPos = ui.position;
      },
      drag : function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        manager.groupMove(view.groupid, view.viewid, {
          top : top,
          left : left
        });
        view.startPos = ui.position;
      },
      stop : function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        manager.groupMove(view.groupid, view.viewid, {
          "top" : top,
          "left" : left
        });
      }
    });
    $("#view" + this.viewid).resizable({
      grid : 10,
      handles : " n, e, s, w, ne, se, sw, nw",
      resize : function(event, ui) {
        layout.resizeLayout([Math.ceil(ui.size.width), Math.ceil(ui.size.height)]);
      },
      stop : function(event, ui) {
        var wratio = ui.size.width / ui.originalSize.width, hratio = ui.size.height / ui.originalSize.height;
        manager.groupResize(view.groupid, view.viewid, wratio, hratio);
      }
    });

    $("#view"+this.viewid+" .ui-icon-gripsmall-diagonal-se")
      .removeClass("ui-icon-gripsmall-diagonal-se ui-icon"); // hide the handle!
}
*/



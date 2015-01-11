
// View

/*
 * This is the base class of view.
 * A view shall inherit this class and support the following functions
 * See comments below for detailed usage
 */

"use strict";

var extObject = {
  initialize: function(type, viewname, viewid, layout, ctrllayout) {
    // this is the constructor of any view
    // if you need your own constructor, you would have to call this first (similar to sth like super.init())

    // view attributes
    this.type = type;
    this.viewname = viewname;
    this.viewid = viewid;
    // TODO: supports needed for grouping
    this.groupid = viewid;

    // view states
    this.showHeader = true;
    this.viewWidth = this.viewHeight = 0;
    this.canvasWidth = this.canvasHeight = 0;
    this.isFloating = false;


    // TODO: supports needed for linking
    this.linkTargets = [];
    this.linkSources = [];

    // layout is the layout node for this view (see layout/layout-node.js)
    // you don't need to touch it usually
    this.layout = layout;
    // ctrllayout is the layout node for view's controller (at top-right corner of the system)
    // similar to the above layout
    this.ctrllayout = ctrllayout;

    // prepareView adds the header (and header buttons) to the view
    // see its implementation below for details
    this.prepareView();
    // loader, control and renderer are created in this step
    this.createHandlers();

    // reverse references
    // so that you can get the view object from its loader, controller and renderer
    this.loader.view = this;
    this.controller.view = this;
    this.renderer.view = this;
  },


  // this must be implemented by inheriting classes
  createHandlers: function() {
    // abstract, must be filled with real loader/controller/renderer constructors
    throw "createHandlers() is not implemented";
  },


  // the following three functions are view level
  // after a view is created, the system returns the view object, e.g.
  /*
   * var view = CreateView(...);
   */
  // then we can use this object to load data or render, e.g.
  /*
   * view.load({...});
   * view.render();
   */
  load: function(para) {
    // the load call is passed to loader
    this.loader.load(para);
  },
  control: function() {
    // the control call is passed to the controller
    this.controller.display();
  },
  uncontrol: function() {
    // remove the controller object
    this.controller.hide();
  },
  render: function() {
    // the render call is passed to the renderer
    this.renderer.render();
  },
  wait: function() {
    // display a waiting icon
    this.renderer.wait();
  },
  unwait: function() {
    // remove the waiting icon
    this.renderer.unwait();
  },


  // get functions for loader/controller/renderer
  getJqController: function() {
    // returns the jquery selected node for controller
    return this.jqctrl;
  },
  getJqHeader: function() {
    // returns the jquery selected node for header
    return this.jqheader;
  },
  getJqCanvas: function() {
    // returns the jquery selected node for canvas
    return this.jqcanvas;
  },
  getViewWidth: function() {
    // returns the view width
    return this.viewWidth;
  },
  getViewHeight: function() {
    // returns the view height, including header
    return this.viewHeight;
  },
  getCanvasWidth: function() {
    // returns the canvas width
    return this.canvasWidth;
  },
  getCanvasHeight: function() {
    // returns the canvas height, without view header
    return this.canvasHeight;
  },


  // callbacks
  onResize: function() {
    // this function is triggered once the view gets resized
    // you can implement it to support visualization resizing

    // the new view size is available via the GET functions
  },

  // prepares the view, including:
  // add a view header, set jquery nodes properly, add interaction listeners, etc
  prepareView: function() {
    this.jqview = $("<div></div>")
      .attr("class", "view-docked")
      .appendTo(this.layout.content);
    this.jqheader = $("<h3></h3>")
      .appendTo(this.jqview);
    this.jqcanvas = $("<div></div>")
      .attr("class", "view-canvas")
      .appendTo(this.jqview);
    this.jqctrl = this.ctrllayout.content;

    // fetch view sizes
    this.viewWidth = this.layout.centerPane.width();
    this.viewHeight = this.layout.centerPane.height();
    // prepares the header
    this.prepareHeader();

    // fetch canvas sizes
    // note: these must be done here
    // otherwise the very first render will not have correct size
    this.canvasWidth = this.viewWidth;
    this.canvasHeight = this.viewHeight - this.jqheader.outerHeight(true);
    // prepares the canvas
    this.prepareCanvas();

    // add interaction listener
    this.prepareInteractions();
  },

  // prepares the view header
  // you can override this to implement custom header
  prepareHeader: function() {
    this.jqheader
      .attr("id", "viewheader" + this.viewid)
      .attr("class", "ui-widget-header")
      .text(this.viewname);
    this.prepareHeaderButtons();
  },
  // prepares the buttons in the view header, and their interaction listener
  // you can override this to implement custom header buttons
  prepareHeaderButtons: function() {
    var view = this;
    $("<button id='closeBtn' class='view-closebtn'></button>")
      .button({
        icons : { primary : "ui-icon-close" },
        text : false
      })
      .click(function() { viewManager.closeView(view, "user"); })
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
  // prepares the canvas, currently not doing much
  prepareCanvas: function() {
    this.jqcanvas
      .attr("id", "canvas" + this.viewid)
      .css("height", this.canvasHeight);
  },
  // prepares the mouse interactions
  prepareInteractions: function() {
    var view = this;
    this.jqview
      //.mousedown(function() { viewManager.setTopView(view.groupid, view.viewid); })
      .dblclick( function(event) {
        event.preventDefault();
        view.toggleViewheader();
      })
      .mousedown( function() {
        viewManager.activateView(view);
      })
      .draggable({  // allow drag out as floating view, or dock
        handle: ".ui-widget-header",
        containment: "#dragarea",
        start: function(event, ui) {
          console.log("drag start");
          if (view.isFloating !== true) {
            // use margin to keep the global offset
            // because the view will be floated immediately in floatView function
            view.jqview
              .css("margin-left", ui.offset.left)
              .css("margin-top", ui.offset.top);
          }
          viewManager.floatView(view);
          viewManager.enableViewDrop();
        },
        stop: function(event, ui) {
          // remove the artifact margins and replace by true offset (left, top)
          viewManager.disableViewDrop();

          var left = parseInt(view.jqview.css("margin-left")),
              top = parseInt(view.jqview.css("margin-top"));
          left += parseInt(view.jqview.css("left"));
          top += parseInt(view.jqview.css("top"));
          view.jqview.css({
            "margin-left": "",
            "margin-top": "",
            "left": left,
            "top": top
          });
          view.jqview.css("position", "absolute");
          console.log("drag end");
        }
      });
  },


  // view header button actions
  showDocument: function() {
    window.open("document.html#" + this.type);
  },
  toggleCompactLayout: function() {
    // TODO
    console.log("TODO: compact layout not implemented");
  },
  close: function(options) {
    // close the view
    $(this.jqview).remove();  // remove view content + header
    $(this.jqctrl).remove(); // remove controller
    if (this.isFloating === false) {  // notify layout that this view has been closed
      if (this.layout == null) {
        console.error("null layout");
      }
      this.layout.removeView(this, options);
    }
  },
  // other actions
  toggleViewheader: function(){
    // triggered by double-clicking
    var view = this;
    view.showHeader = !view.showHeader;
    if (!view.showHeader) {
      $("#viewheader"+view.viewid).hide();
      this.canvasHeight = this.viewHeight;
    }else{
      $("#viewheader"+view.viewid).show();
      this.canvasHeight = this.viewHeight - this.jqheader.outerHeight(true);
    }
    this.jqcanvas
        .css("height", this.canvasHeight);
    this.onResize();
  },

  // view highlighting
  highlightHeader: function() {
    this.jqheader.addClass("ui-state-highlight");
  },
  unhighlightHeader: function() {
    this.jqheader.removeClass("ui-state-highlight");
  },


  // the following functions are considered "private"
  // shall not be called from outside this view's scope
  __onResize: function(width, height) {
    // update internally stored view sizes
    this.viewWidth = width;
    this.viewHeight = height;
    this.canvasWidth = width;
    this.canvasHeight = height - this.jqheader.outerHeight(true);
    this.jqcanvas
      .css("height", this.canvasHeight);
    this.onResize();
  },

};

var View = Base.extend(extObject);

// LEGACY CODE BELOW! DON'T READ :)

// TODO: cross view communication will be implemented shortly
  /*
    //$(this.jqcanvas).addClass("viewshadow");
      // these functions shall be supported shortly
      //.append("<button id='postBtn' class='view-postbtn'></button>")
      //.append("<button id='getBtn' class='view-getbtn'></button>")
      //.append("<button id='groupBtn' class='view-groupbtn'></button>");

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
    //$(this.jqnode)
    //  .css("min-width", 100)
    //  .css("z-index", manager.maxZindex);
    //manager.increaseZindex()
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



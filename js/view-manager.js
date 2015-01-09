
// View Manager

/*
 * viewManager dispatches view creation/deletion messages, as well as view communications.
 * Copied from old Genotet. Need to rewrite.
 */

"use strict";

/************************ WARNING *************************
 *                    MESSY CODE ZONE!                    *
 **********************************************************/

function ViewManager(){
  this.views = [];

  /*
	this.headerHeight = 19; // the height of a view's header
	this.borderWidth = 2;
	this.maxZindex = 0;
	this.menuMarginRight = 0;
*/
  //this.supportedTypes = ["menu", "graph", "histogram", "heatmap", "table", "network", "binding", "expression"];
  /*
  this.defaultWidth = {
    menu: "100%",
    graph: 600,
    histogram: 800,
    heatmap: 640,
    table: 530
  };
  this.defaultHeight = {
    menu: "100%",
    graph: 340,
    histogram: 250,
    heatmap: 340,
    table: 340
  };
  this.compactWidth = {
    histogram: 800,
    menu: 170,
    graph: 600,
    heatmap: 640,
    table: 300
  };
  this.compactHeight = {
    histogram: 160,
    menu: 20,
    graph: 290,
    heatmap: 290,
    table: 315
  };
  */

  /*
	this.bindingNames = ["BATF","IRF4","MAF","RORC","STAT3","Hif1a","Etv6","Jmjd3","BATF-Th0","BATF-Th17","cMaf-Th0","cMaf-Th17","Fosl2-Th0","Fosl2-Th17","IRF4-Th0","IRF4-Th17","p300-Th0","p300-Th17",
	"RORg-Th0","RORg-Th17","STAT3-Th0","STAT3-Th17","RNA-Seq-1h","RNA-Seq-3h","RNA-Seq-6h","RNA-Seq-9h","RNA-Seq-16h","RNA-Seq-24h","RNA-Seq-48h","FAIRE-Seq-IRF4+","FAIRE-Seq-IRF4-",
	"FAIRE-Seq-Batf+","FAIRE-Seq-Batf-"];
	*/
	this.bindingChrs = [];
	for(var i=0; i<19; i++) this.bindingChrs.push((i+1).toString());
	this.bindingChrs = this.bindingChrs.concat(["M","X","Y"]);

	//this.ctrlDown = false;
	//this.topIndex = null;
	/*
	var manager = this;
	$(document).keydown( function(e){
		if(e.which==17 && manager.ctrlDown==false){
			//manager.ctrlDown = true;
			//manager.enableViewInteraction();
		}
		//console.log(manager.ctrlDown);
	});
	$(document).keyup( function(e){
		if(e.which==17 && manager.ctrlDown==true){
			//manager.ctrlDown = false;
			//manager.disableViewInteraction();
		}
		//console.log(manager.ctrlDown);
	});
	*/
}

/*
ViewManager.prototype.supportBinding = function(name){
	name = name.toLowerCase();
	for(var i=0; i<this.bindingNames.length; i++){
		if (this.bindingNames[i].toLowerCase()==name) return true;
	}
	return false;
};
*/

ViewManager.prototype.availViewID = function(){
	var id = 0;
	while (1) {
		var ok = true;
		for(var i=0; i<this.views.length; i++){
			if (this.views[i].viewid == id) {
				ok = false;
				break;
			}
		}
		if (ok) return id;
		id ++;
	}
};

/*
ViewManager.prototype.setTopView = function(groupid, viewid){
	//if (this.topView == viewid) return;
	this.remapZindex();
	for(var i=0; i<this.views.length; i++){
		if (this.views[i].content.groupid == groupid) {
			$("#view"+this.views[i].viewid).css({"z-index": this.maxZindex});
			this.topView = this.views[i].viewid;
		}
	}
};
ViewManager.prototype.increaseZindex = function(){
	this.maxZindex ++;
	if(this.maxZindex >= 5){
		var index = 100;
		for(var i=0; i<this.views.length; i++){
			var idx = $("#view"+this.views[i].viewid).css("z-index");
			if(idx==="auto") idx = 0;
			index = Math.min(idx, index);
		}
		for(var i=0; i<this.views.length; i++){
			var idx = $("#view"+this.views[i].viewid).css("z-index");
			if(idx==="auto") idx = 0;
			idx -= index;
			$("#view"+this.views[i].viewid).css("z-index", idx);
		}
		this.maxZindex = 5;
	}
	this.maxZindex = prs.length;
};
ViewManager.prototype.embedSize = function(x){
	return x - 2*this.borderWidth;
};
*/

ViewManager.prototype.getViewNames = function(type, name){
	if(type=="togroup"){
		view = this.getView(name);
		var result = new Array();
		for(var i=0; i<this.views.length; i++){
			var content = this.views[i].content;
			if(content.groupid != view.groupid && content.type!="menu"){	// && content.type == view.type
				result.push(this.views[i].viewname);
			}
		}
		return result;
	}else{
		var result = new Array();
		for(var i=0; i<this.views.length; i++){
			if (this.views[i].viewtype!="menu") {
				result.push(this.views[i].viewname);
			}
		}
		return result;
	}
};

ViewManager.prototype.createMenu = function(){
	var menu = this.createView("GENOTET", "menu");
	menu.render();
	return menu;
};

ViewManager.prototype.createView = function(viewname, type, operator){ //, width, height, left, top
/*
  if(this.supportedTypes.indexOf(type)==-1){
		console.error("There is no view type named " + type);
		return null;
  }
  */
	if(viewname==""){
		options.alert("Cannot create view: Viewname cannot be empty");
		return null;
	}
  for (var i = 0; i < this.views.length; i++) {
    if (this.views[i].viewname == viewname) {
      options.alert("Cannot create view: viewname must unique");
      return null;
    }
  }
  var availableIds = new Array();
  for (var i = 0; i < this.views.length; i++) {
    availableIds[this.views[i].viewid] = true;
  }
  var viewid;
  for (var i = 0; ; i++) {
    if (availableIds[i] != true) {
      viewid = i;
      break;
    }
  }
  // switch the constructed view object
  var layout = layoutManager.allocDiv(type, operator);
  var ctrl = layoutManager.allocControl();
  var newview;
  if (type == "graph")
    newview = GraphView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "network"){
    newview = GraphView.new(type, viewname, viewid, layout, ctrl);
    console.log("awesome graph");
  }else if (type === "binding")
    newview = BindingView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "expression")
    newview = ExpressionView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "menu")
    newview = MenuView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "table")
    newview = TableView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "heatmap")
    newview = HeatmapView.new(type, viewname, viewid, layout, ctrl);
  else if (type === "chart")
    newview = ChartView.new(type, viewname, viewid, layout, ctrl);
  else {
    console.error("no supported view found");
  }
  layout.addView(newview);
  this.views.push( {'viewid':viewid, 'viewname':viewname, 'viewtype': type, 'content':newview} );

  return newview;

  /*
  if(width==null || height == null){
    var size = this.getViewSize(type);
    if(width==null) width = size.width;
    if(height==null) height = size.height;
  }
  if(left==null || top == null) {
    var place = this.getViewPlace(width, height, type);
    if(place.success == false) {
      user.alert("cannot auto placing view - not enough space for view " + viewname);
      place.left = place.top = 8;
    }
    left = place.left;
    top = place.top;
  }

  */
};

ViewManager.prototype.activateView = function(viewname) {
  for (var i = 1; i < this.views.length; i++) {
    if (this.views[i].viewname === viewname) {
      this.views[i].content.highlightHeader();
      this.views[i].content.control();
    } else {
      this.views[i].content.unhighlightHeader();
    }
  }
};

  /*
ViewManager.prototype.getViewSize = function(type){
	var width, height;

	if (type==="graph" || type==="heatmap") {
		width = (($('body').innerWidth() - $("#view"+getView("GENOTET").viewid).outerWidth())>>1) - 2;
	}else if (type==="histogram") {
		width = ($('body').innerWidth() - $("#view"+getView("GENOTET").viewid).outerWidth()) - 2;
	}else{
		width = this.defaultWidth[type];
	}
	if (type==="graph" || type==="heatmap") {
		height = $(document).height()/2;
	} else if (type=="histogram") {
		height = $(document).height()/3;
	} else {
		height = this.defaultHeight[type];
	}
	return {
    width: "100%",
    height: "100%"
  };
};
ViewManager.prototype.getViewPlace = function(width, height, type){	// find a place to put the view
	//if(type=="menu") {
    return {
      success: true,
      left: 0, //$('body').innerWidth() - width - this.menuMarginRight,
      top: 0
    };
	//}
	// brute force, NOT clever!!
	var bodywidth = $('body').innerWidth();
	for(var j=0; ; j++){	// j+height<=window.innerHeight
		for(var i=0; i+width<=bodywidth; i++){ // vertical first
			var ok = true;
			for(var k=0; k<this.views.length; k++){
				var view = $("#view"+this.views[k].viewid);
				var x = parseInt(view.css("left")),
					y = parseInt(view.css("top")),
					w = view.outerWidth();
					h = view.outerHeight();
					if( j>=-height+y && j<h+y && i>=-width+x && i<w+x) {
						ok = false;
						i = x+w;	// optimized brute-force
						break;
					}
			}
			if(ok) return {"success": true, "left": i, "top": j};
		}
	}
	return {"success": false};
};
*/
ViewManager.prototype.closeAllViews = function(){
	for (var i = 1; i < this.views.length; i++){
		this.views[i].content.close({
		  noAnimation: true
		});
	}
	this.views = this.views.splice(0, 1);  // only keep menu view
	//this.resetFlags();
};

ViewManager.prototype.closeView = function(viewname, operator){
	var found = -1;
	for (var i = 0; i < this.views.length; i++){
		if (this.views[i].viewname == viewname) {
			found = i;
			break;
		}
	}
	if (found === -1) {
		console.error("cannot close view", viewname, "view not found");
		return;
	}
	/*
	var content = this.views[found].content;
	for(var i=0; i<this.views.length; i++){
		if (this.views[i].content.groupid == content.groupid && this.views[i].viewid != content.viewid) {
			var closegroup = false;
			// hard coded directed graph
			if (content.type=="histogram" && this.views[i].viewtype==content.type) closegroup = true;
			else if (content.type=="graph" && this.views[i].viewtype=="table") closegroup = true;
			if (closegroup==false) continue;
			this.views[i].content.groupid = this.views[i].content.viewid;
			closeView(this.views[i].viewname);
			i--;	// otherwise cannot close all, because index are shifted in splice
		}
	}
	for(var i=0; i<content.childrenView.length; i++)
		content.childrenView[i].parentView = null;
	if(content.parentView!=null)
		this.unlinkView(content.parentView, content);	// remove link
	content.close();
	*/
	this.views[found].content.close({
	  noAnimation: operator === "user" ? false : true
	});
	this.views.splice(found, 1);
	//this.resetFlags();

};

/*
ViewManager.prototype.resetFlags = function(){
	this.topView = null;
};
*/

ViewManager.prototype.getView = function(viewname){
    for(var i=0; i<this.views.length; i++){
		if(this.views[i].viewname==viewname) return this.views[i].content;
    }
    return null;
};

ViewManager.prototype.setPlace = function(view, top, left){
	$("#view"+view.viewid).css({"left":left+"px", "top":top+"px"});
};

ViewManager.prototype.highlightGroup = function(groupid){
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content;
		if(content.groupid == groupid) $("#viewheader"+content.viewid).addClass("ui-state-highlight");
	}
};

ViewManager.prototype.unhighlightGroup = function(groupid){
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content;
		if(content.groupid == groupid) $("#viewheader"+content.viewid).removeClass("ui-state-highlight");
	}
};

ViewManager.prototype.getViewChildren = function(viewname){
	var view = this.getView(viewname);
	var result = new Array();
    for(var i=0; i<view.childrenView.length; i++){
		result.push(view.childrenView[i].viewname);
    }
    return result;
};

ViewManager.prototype.unlinkView = function(sourceView, targetView){
	if(sourceView==null){ console.error("Cannot unlink view: sourceView not exist"); return false; }
	if(targetView==null){ console.error("Cannot unlink view: targetView not exist"); return false; }
	sourceView.childrenView.splice(sourceView.childrenView.indexOf(targetView), 1);
	targetView.parentView = null;
	return true;
};

ViewManager.prototype.linkView = function(sourceView, targetView){
	if(sourceView==null){ console.error("Cannot link view: sourceView not exist"); return false; }
	if(targetView==null){ console.error("Cannot link view: targetView not exist"); return false; }
	if(targetView.parentView!=null){
		if(targetView.parentView == sourceView){
			console.error("Cannot link view: views are already linked");
			options.alert("Cannot link view: views are already linked");
		}else{
			console.error("Cannot link view: " + targetView.viewname + " is already listening to " + targetView.parentView.viewname);
			options.alert("Cannot link view: " + targetView.viewname + " is already listening to " + targetView.parentView.viewname);
		}
		return false;
	}
	sourceView.childrenView.push(targetView);
	targetView.parentView = sourceView;
	return true;
};

ViewManager.prototype.groupView = function(sourceView, targetView){
	if(sourceView==null){ console.error("Cannot group view: sourceView not exist"); return false; }
	if(targetView==null){ console.error("Cannot group view: targetView not exist"); return false; }
	var gid = targetView.groupid, srcgid = sourceView.groupid;
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content;
		if(content.groupid == srcgid) content.groupid = gid;
	}
	return true;
};

ViewManager.prototype.groupMove = function(groupid, viewid, delta){
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content, id = this.views[i].viewid;
		if(content.groupid == groupid &&  id != viewid){
			var top = parseInt($("#view"+id).css("top")),
				left = parseInt($("#view"+id).css("left"));
			top += delta.top; left += delta.left;
			this.setPlace(content, top, left);
		}
	}
};

ViewManager.prototype.groupResize = function(groupid, viewid, wratio, hratio){
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content, id = this.views[i].viewid;
		if(content.groupid == groupid &&  id != viewid){
			var width = parseInt($("#view"+id).css("width")),
				height = parseInt($("#view"+id).css("height"));
			width *= wratio; height *= hratio;
			content.layout.resizeLayout([width, height]);
			$("#view"+id).css({"width":width, "height":height});
		}
	}
};

ViewManager.prototype.quitGroup = function(groupid, viewid){
	var ngid = -1, view;
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content;
		if(content.viewid == viewid) view = content;
		if(content.groupid == groupid && content.viewid != viewid) ngid = content.viewid;
	}
	if(ngid!=-1){
		for(var i=0; i<this.views.length; i++){
			var content = this.views[i].content;
			if(content.groupid == groupid) content.groupid = ngid;
		}
	}
	view.groupid = view.viewid;
};

ViewManager.prototype.announceGroupMessage = function(msg, groupid, viewid){
	for(var i=0; i<this.views.length; i++){
		var content = this.views[i].content;
		if(content.groupid == groupid && content.viewid != viewid){
			content.getGroupMessage(msg);
		}
	}
};

ViewManager.prototype.snapView = function(sourceView, targetView){
	var target = $("#view"+targetView.viewid);
	var top = parseInt(target.css("top")) + target.innerHeight(),
		left = parseInt(target.css("left"));
	this.setPlace(sourceView, top, left);
};

ViewManager.prototype.resizeView = function(view, width, height){
	var viewobj = $("#view"+view.viewid);
	var viewwidth = viewobj.width(), viewheight = viewobj.height();
	if (width == null) width = viewwidth;
	if (height == null) height = viewheight;
	viewobj.css({"width":width, "height":height});
	view.layout.resizeLayout([width, height]);
};

ViewManager.prototype.loadPreset = function(type){
	//closeAllViews();
	//createMenu();
	if (type === "test") {
    // testing views
    createTestViews();
	} else if (type === "default") {
		createView("Network", "graph").loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$");
		createView("Expression", "heatmap").loadData("RNA-Seq", "BATF");
		createView("Genome Browser", "histogram").loadData("BATF");
	} else if (type=="casedemo") {
	  var net = createView("Network", "graph", null, 400);
	  net.loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$");
    net.layout.toggleEdgeListing();
    createView("Expression", "heatmap", null, 400).loadData("RNA-Seq", "BATF",
     "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$", "SL");

	  createView("Genome Browser", "histogram").loadData("FOSL2-Th17");
    createView("Genome Browser 2", "histogram").loadData("BATF");
    createView("Genome Browser 3", "histogram").loadData("IRF4");

    groupView("Genome Browser", "Genome Browser 2");
    groupView("Genome Browser 2", "Genome Browser 3");

    getView("Genome Browser").layout.toggleExons();
    getView("Genome Browser 2").layout.toggleExons();

    getView("Genome Browser 2").layout.toggleOverview();
    getView("Genome Browser 3").layout.toggleOverview();

    getView("Genome Browser 2").toggleCompactLayout();
    getView("Genome Browser 3").toggleCompactLayout();

    this.resizeView(getView("Genome Browser"), null, 140 + 26 + this.headerHeight);
    this.resizeView(getView("Genome Browser 2"), null, 100 + this.headerHeight);
    this.resizeView(getView("Genome Browser 3"), null, 135 + this.headerHeight);

    getView("Genome Browser 2").toggleViewheader();
    getView("Genome Browser 3").toggleViewheader();

    this.snapView(getView("Genome Browser 2"), getView("Genome Browser"));
    this.snapView(getView("Genome Browser 3"), getView("Genome Browser 2"));


    linkView("Network", "Expression");
    linkView("Network", "Genome Browser");
	} else if(type=="binding_3"){
		createView("Genome Browser", "histogram").loadData("FOSL2-Th17");
		createView("Binding B", "histogram").loadData("BATF");
		createView("Binding C", "histogram").loadData("IRF4");

		groupView("Genome Browser", "Binding B");
		groupView("Binding B", "Binding C");

		getView("Genome Browser").layout.toggleExons();
		getView("Binding B").layout.toggleExons();

		getView("Binding B").layout.toggleOverview();
		getView("Binding C").layout.toggleOverview();

		getView("Binding B").toggleCompactLayout();
		getView("Binding C").toggleCompactLayout();

		this.resizeView(getView("Genome Browser"), null, 140 + 26 + this.headerHeight);
		this.resizeView(getView("Binding B"), null, 100 + this.headerHeight);
		this.resizeView(getView("Binding C"), null, 135 + this.headerHeight);

		getView("Binding B").toggleViewheader();
		getView("Binding C").toggleViewheader();

		this.snapView(getView("Binding B"), getView("Genome Browser"));
		this.snapView(getView("Binding C"), getView("Binding B"));
	} else if(type=="binding_4"){
		createView("Genome Browser", "histogram").loadData("RORC");
		createView("Binding B", "histogram").loadData("STAT3");
		createView("Binding C", "histogram").loadData("FOSL2-Th17");
		createView("Binding D", "histogram").loadData("Hif1a");

		groupView("Genome Browser", "Binding B");
		groupView("Binding B", "Binding C");
		groupView("Binding C", "Binding D");

		getView("Genome Browser").layout.toggleExons();
		getView("Binding B").layout.toggleExons();
		getView("Binding C").layout.toggleExons();

		getView("Binding B").layout.toggleOverview();
		getView("Binding C").layout.toggleOverview();
		getView("Binding D").layout.toggleOverview();

		getView("Binding B").toggleCompactLayout();
		getView("Binding C").toggleCompactLayout();
		getView("Binding D").toggleCompactLayout();

		this.resizeView(getView("Genome Browser"), null, 140 + 26 + this.headerHeight);
		this.resizeView(getView("Binding B"), null, 100 + this.headerHeight);
		this.resizeView(getView("Binding C"), null, 100 + this.headerHeight);
		this.resizeView(getView("Binding D"), null, 135 + this.headerHeight);

		getView("Binding B").toggleViewheader();
		getView("Binding C").toggleViewheader();
		getView("Binding D").toggleViewheader();

		this.snapView(getView("Binding B"), getView("Genome Browser"));
		this.snapView(getView("Binding C"), getView("Binding B"));
		this.snapView(getView("Binding D"), getView("Binding C"));
	} else if (type=="binding_6") {
		//createView("Network", "graph").loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$");
		createView("Genome Browser", "histogram").loadData("RNA-Seq-1h");
		createView("Binding B", "histogram").loadData("RNA-Seq-6h");
		createView("Binding C", "histogram").loadData("RNA-Seq-9h");
		createView("Binding D", "histogram").loadData("RNA-Seq-16h");
		createView("Binding E", "histogram").loadData("RNA-Seq-24h");
		createView("Binding F", "histogram").loadData("RNA-Seq-48h");

		groupView("Genome Browser", "Binding B");
		groupView("Binding B", "Binding C");
		groupView("Binding C", "Binding D");
		groupView("Binding D", "Binding E");
		groupView("Binding E", "Binding F");

		getView("Genome Browser").layout.toggleExons();
		getView("Binding B").layout.toggleExons();
		getView("Binding C").layout.toggleExons();
		getView("Binding D").layout.toggleExons();
		getView("Binding E").layout.toggleExons();

		getView("Binding B").layout.toggleOverview();
		getView("Binding C").layout.toggleOverview();
		getView("Binding D").layout.toggleOverview();
		getView("Binding E").layout.toggleOverview();
		getView("Binding F").layout.toggleOverview();

		getView("Binding B").toggleCompactLayout();
		getView("Binding C").toggleCompactLayout();
		getView("Binding D").toggleCompactLayout();
		getView("Binding E").toggleCompactLayout();
		getView("Binding F").toggleCompactLayout();

		this.resizeView(getView("Genome Browser"), null, 90 + 26 + this.headerHeight);
		this.resizeView(getView("Binding B"), null, 50 + this.headerHeight);
		this.resizeView(getView("Binding C"), null, 50 + this.headerHeight);
		this.resizeView(getView("Binding D"), null, 50 + this.headerHeight);
		this.resizeView(getView("Binding E"), null, 50 + this.headerHeight);
		this.resizeView(getView("Binding F"), null, 85 + this.headerHeight);

		getView("Binding B").toggleViewheader();
		getView("Binding C").toggleViewheader();
		getView("Binding D").toggleViewheader();
		getView("Binding E").toggleViewheader();
		getView("Binding F").toggleViewheader();

		this.snapView(getView("Binding B"), getView("Genome Browser"));
		this.snapView(getView("Binding C"), getView("Binding B"));
		this.snapView(getView("Binding D"), getView("Binding C"));
		this.snapView(getView("Binding E"), getView("Binding D"));
		this.snapView(getView("Binding F"), getView("Binding E"));

	} else if (type=="expmat") {
		createView("Network", "graph").loadData("prediction", "SpoVT");
		createView("Expression", "heatmap").loadData("B-Subtilis", "SpoVT", "spoVT|fabl|yizc", "spo");
		linkView("Network", "Expression");
	} else if (type=="network") {
		createView("Network", "graph").loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$");
		createView("Network B", "graph").loadData("confidence", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$");
	} else {
		options.alert("Unknown layout preset");
	}
};

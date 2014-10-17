function LayoutTable(htmlid, width, height){
    this.htmlid = htmlid;
    this.width = width;
    this.rawheight = height;
	this.height = height;
	this.uiHeight = 26;
	this.tableHeight = this.height-this.uiHeight;

	this.compactLayout = false;
	//this.svg = d3.select("#"+this.htmlid).append("svg").attr("height", this.rawheight);
}

LayoutTable.prototype.reloadData = function(){
	this.data = this.parentView.viewdata;
	this.selection = {};
	this.rowOrder = {"column": 3, "order": -1};  // default, sort by loaded
	this.initLayout();
};

LayoutTable.prototype.removeLayout = function(){
	this.removeUI();
	this.removeTable();
};

LayoutTable.prototype.removeTable = function(){
  $("#"+this.htmlid+" > div[name='data']").remove();
};

LayoutTable.prototype.removeUI = function(){
  $("#"+this.htmlid+" div[name='ui']").remove();
};

LayoutTable.prototype.initLayout = function(){
	this.removeLayout();
	var layout = this;
	var col = this.rowOrder.column<0? "selected":this.data.columns[this.rowOrder.column].toLowerCase();
	utils.stableSort(this.data.rows, col, this.rowOrder.order);
	this.renderLayout();
};

LayoutTable.prototype.renderUI = function(){
	$("#"+this.htmlid).append("<div name='ui' style='margin-left: 5px;'>" +
	"<input type='text' id='filter' size='15'>" +
	"<input type='button' id='sel' value='Sel'><input type='button' id='desel' value='Desel'>" +
	"<input type='button' id='show' value='Show'><input type='button' id='hide' value='Hide'>" +
	"<input type='button' id='topsel' value='Top Selection'>" +
	"</div>");
	var layout = this;
	$("#"+this.htmlid+" div[name='ui'] #sel").button().click( function(){
			layout.uiFilterSelect($("#"+layout.htmlid+" div[name='ui'] #filter").val(), "sel");
		});
	$("#"+this.htmlid+" div[name='ui'] #desel").button().click( function(){
			layout.uiFilterSelect($("#"+layout.htmlid+" div[name='ui'] #filter").val(), "desel");
		});
	$("#"+this.htmlid+" div[name='ui'] #show").button().click( function(){ layout.uiAction("show"); } );
	$("#"+this.htmlid+" div[name='ui'] #hide").button().click( function(){ layout.uiAction("hide"); } );
	$("#"+this.htmlid+" div[name='ui'] #topsel").button().click( function(){ layout.uiAction("topsel"); } );
};

LayoutTable.prototype.renderLayout = function(){
	if(this.compactLayout==false) this.renderUI();
	var layout = this;
	$("#"+this.htmlid).append("<div name='data' class='tablescroll'></div>");
	var contents = $("#"+this.htmlid+" > div[name='data']");
	var columns = this.data.columns,
		rows = this.data.rows;
	var str = "", strd = "";
	str += "<col width='25%'><col width='25%'><col width='40%'><col width='10%'>";
	for(var i=0; i<columns.length; i++) {
		strd += utils.tagString(columns[i], "th");
	}
	str += utils.tagString(strd, "tr");

	for(var i=0; i<rows.length; i++){
		var cls = null;
		if(this.selection[rows[i].id]==true) cls = "table_highlight";
		strd = "";
		strd += utils.tagString(rows[i].source, "td", null, cls);
		strd += utils.tagString(rows[i].target, "td", null, cls);
		strd += utils.tagString(rows[i].weight, "td", null, cls);
		strd += utils.tagString(rows[i].loaded, "td", null, cls);
		str += utils.tagString(strd, "tr");
	}
	str = utils.tagString(str, "table");
	contents.append(str);

	this.uiHeight = $("#"+this.htmlid+" div[name='ui']").height();
	this.tableHeight = this.height - this.uiHeight;	// recompute height

	$("#"+this.htmlid+" div[name='data'] table")
		.attr("width", "100%"); // height does not need to stretch to full height
	contents.css({'font-size':'12px', 'width':this.width, 'height':this.tableHeight, 'table-layout':'fixed', 'text-align':'center'});

	$("#"+this.htmlid+" th").addClass("ui-state-default");
	$("#"+this.htmlid+" td").addClass("ui-widget-content");
	$("#"+this.htmlid+" tr")
		.hover( function(){ $(this).children("td").addClass("table_hover"); },
				function(){ $(this).children("td").removeClass("table_hover"); } )
		.click( function(){
			$(this).children("td").toggleClass("table_hover");
			$(this).children("td").toggleClass("table_highlight");
		});
	d3.selectAll("#"+this.htmlid).selectAll("tr").data([{}].concat(rows))	// prepend an empty row data
		.on("click", function(d){ return layout.toggleRow(d); });	// row selection interaction
	d3.selectAll("#"+this.htmlid+" th")
		.on("click", function(d, i){ return layout.sortColumn(i); });
};

LayoutTable.prototype.sortColumn = function(i){
	if(i<0){	// sort by selection
		this.rowOrder.order = 1;
		this.rowOrder.column = -1;
	}else{
		if(this.rowOrder.column!=i) {	// sort by column
			this.rowOrder.column = i;
			this.rowOrder.order = 1;
		}else{
			this.rowOrder.order *= -1;
		}
	}
	this.initLayout();
};

LayoutTable.prototype.uiFilterSelect = function(cmd, type){
	// evaluate cmd here to form selection list ( this.selection )
	// currently: nasty implementation of three term expression
	var ops = ["<", ">", "=", "<=", ">=", "*"];
	var cmds = cmd.split(RegExp(/" + s+/));
	if(cmds.length > 3){ user.alert("unrecognized command"); }
	else if(cmds.length==1 && (cmds[0]=="all" || cmds[0]=="")){
		var rows = this.data.rows;
		if(type=="desel"){
			$("#"+this.htmlid+" td").removeClass("table_highlight");
			this.selection = {};
		}else if(type=="sel"){
			for(var i=0; i<rows.length; i++) this.selection[rows[i].id] = true;
			$("#"+this.htmlid+" td").addClass("table_highlight");
		}
	}else{
		var idx = -1;
		for(var i=0; i<this.data.columns.length; i++) if(this.data.columns[i].toLowerCase()==cmds[0].toLowerCase()) { idx=i; break; }
		if(idx==-1){ user.alert("attribute not found"); }
		else{
			var col = cmds[0].toLowerCase();
			var opidx = ops.indexOf(cmds[1]);
			if(opidx==-1){ user.alert("invalid operator"); }
			else{
				var val = cmds[2], rows = this.data.rows;
				var tr = $("#"+this.htmlid+" tr:first").next();
				for(var i=0; i<rows.length; i++){
					var sel = false, x = rows[i][col];
					switch(opidx){
						case 0: sel = x<val; break;
						case 1: sel = x>val; break;
						case 2: sel = x==val; break;
						case 3: sel = x<=val; break;
						case 4: sel = x>=val; break;
					}
					if(sel==true){
						if(type=="sel"){
							this.selection[rows[i].id] = true;
							tr.children("td").addClass("table_highlight");
						}else if(type=="desel"){
							if(this.selection[rows[i].id]==true){
								delete this.selection[rows[i].id];
								tr.children("td").removeClass("table_highlight");
							}
						}
					}
					tr = tr.next();
				}
			}
		}
	}
	this.initLayout();
};

LayoutTable.prototype.uiAction = function(type){
	var rows = this.data.rows;
	var msg = {}, edges = new Array();
	if(type=="show"){
		msg.action = "show";
		for(var i=0; i<rows.length; i++){
			if(rows[i].loaded=="Yes") continue;
			else if(this.selection[rows[i].id]==true){
				edges.push(rows[i]); // source and target are names
				rows[i].loaded = "Yes";
			}
		}
	}else if(type=="hide"){
		msg.action = "hide";
		for(var i=0; i<rows.length; i++){
			if(rows[i].loaded=="") continue;
			else if(this.selection[rows[i].id]==true){
				edges.push(rows[i]); // source and target are names
				rows[i].loaded = "";
			}
		}
	}else if(type=="topsel"){
		for(var i=0; i<rows.length; i++){
			if(this.selection[rows[i].id]!=null) rows[i].selected = 0;
			else rows[i].selected = 1;
		}
		this.sortColumn(-1);
		return;
	}
	msg.data = edges;
	this.parentView.postViewMessage(msg);
	this.selection = {};
	$("#"+this.htmlid+" td").removeClass("table_highlight"); // clear selection
	this.initLayout();
};

LayoutTable.prototype.toggleRow = function(d){
	if(d.id==null) return;	// skip the header row
	if(this.selection[d.id] == null){
		this.selection[d.id] = true;
	}else{
		delete this.selection[d.id];
	}
};

LayoutTable.prototype.reloadTable = function(){	// called from global
	timerView.layout.initLayout();
};

LayoutTable.prototype.resizeLayout = function(newsize){
    this.width = newsize[0];
    this.rawheight = newsize[1];
	this.height = this.rawheight;
	this.tableHeight = this.height-this.uiHeight;

	this.removeTable();

	timerView = this.parentView;
	clearTimeout(this.timer);
	this.timer = setTimeout(this.reloadTable, 500);
};

LayoutTable.prototype.setCompact = function(compact){
	this.compactLayout = compact;
	this.removeLayout();
	this.renderLayout();
};

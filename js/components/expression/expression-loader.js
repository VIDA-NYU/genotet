"use strict";
var extObject = {
  initialize: function() {
    this.lastExprows = ".*";
    this.lastExpcols = ".*";
    this.lastResol = 5;
    this.flagHeatmap = false;
  },
  updateData: function(identifier){
    if (identifier.action == "node") {
      this.loadLine(this.lastIdentifier.mat, identifier.name);
      if(identifier.net!=null){
        this.loadHeatmapTargets(identifier.net, identifier.name);
      }
    }else if (identifier.action == "link") {
      this.clearLines();
      this.loadLine(this.lastIdentifier.mat, identifier.source);
      this.loadLine(this.lastIdentifier.mat, identifier.target);
    }
  },
  loadData: function(identifier){
    this.parentView.layout.showMsg("Loading...");
    this.parentView.viewdata = {};
    this.parentView.viewdata.lineData = new Array();
    this.lastIdentifier = identifier;
    if(identifier.name!=null && identifier.name!=""){
      this.loadLine(identifier.mat, identifier.name);
    }
    this.loadHeatmap(identifier.mat, identifier.exprows, identifier.expcols);
  },
  loadComplete: function(){
    var data = this.parentView.viewdata;
    if(data.heatmapData == null) return;
    if (this.flagHeatmap) {
      this.flagHeatmap = false;
      this.loadHeatmap();
      return;
    }
    this.parentView.layout.reloadData();
  },
  loadCompleteLine: function(){
    if(this.parentView.viewdata.heatmapData == null) return;  // prevent racing
    if (this.parentView.layout.showPlot==true) {
      this.parentView.layout.prepareLine();
    }else{
      this.parentView.layout.showPlot = true;
      this.parentView.layout.initLayout();
      this.flagHeatmap = true;
    }
    this.parentView.layout.updateLine();
  },
  loadHeatmap: function(mat, exprows, expcols, resol){
    var loader = this, layout = loader.parentView.layout;
    var args ={"type": "expmat", "width": layout.heatmapWidth, "height": layout.heatmapHeight};
    if(mat==null) mat = this.lastIdentifier.mat;
    if(exprows==null) exprows = this.lastExprows;
    if(expcols==null) expcols = this.lastExpcols;
      if(resol==null) resol = this.lastResol;
    args["mat"] = mat;
    args["exprows"] = exprows;
    args["expcols"] = expcols;
      args["resol"] = resol;
    this.lastExprows = exprows;
    this.lastExpcols = expcols;
      this.lastResol = resol;
    this.lastIdentifier.mat = mat;

    this.parentView.layout.showMsg("Loading...");
    $.ajax({
        type: 'POST', url: addr, dataType: 'jsonp',
        data: { "args": args },
      error: function(xhr, status, err){ loader.error("cannot load heatmap\n" + status + "\n" + err); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0) { loader.error("cannot load heatmap\n return is empty"); return; }
        for(var i=0;i<data.data.length;i++) data.data[i].rx = data.data[i].x;
        loader.parentView.viewdata.heatmapData = data;
        loader.loadComplete();
        }
    });
  },
  loadHeatmapTargets: function(net, name){
    var loader = this;
    $.ajax({
        type: 'GET', url: addr, dataType: 'jsonp',
        data: { "args": "type=targets&net="+net+"&name="+name },
      error: function(xhr, status, err){ loader.error("cannot load targets for heatmap\n" + status + "\n" + err); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0) { loader.error("cannot load targets for heatmap\n return is empty"); return; }
        loader.loadHeatmap(loader.lastIdentifier.mat, data.exp);
        }
    });
  },
  clearLines: function(){
    var loader = this;
    loader.parentView.viewdata.lineData = [];
    loader.loadCompleteLine();
  },
  loadLine: function(mat, name){
    var loader = this;
    if (mat==null) mat = this.lastIdentifier.mat;
    var args = "type=expmatline&mat="+mat+"&name="+name;
    $.ajax({
        type: 'GET', url: addr, dataType: 'jsonp',
        data: { "args": args },
      error: function(){ loader.error("cannot load heatmap line"); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0) {
          loader.error("cannot load heatmap line\ngene not found in expression matrix", "line");
          return;
        }

        for(var i=0; i<loader.parentView.viewdata.lineData.length; i++){
          if(loader.parentView.viewdata.lineData[i].name == data.name) return;  // ignore loaded lines
        }
        data.visible = true;
        data.color = "black";
        loader.parentView.viewdata.lineData.push(data);
        //console.log(loader.parentView.viewdata.lineData);
        if(loader.parentView.viewdata.lineData.length > 8){
          if(!user.silent) alert("exceeding maximum line limit, discarding the first line");
          loader.parentView.viewdata.lineData = loader.parentView.viewdata.lineData.slice(1);
        }
        loader.loadCompleteLine();
        }
    });
  },
  error: function(msg, type){
    msg = this.parentView.viewname + ": " + msg;
    console.error(msg);
    user.alert(msg);
    if(type!="line")  // if cannot add line, it is ok
      this.parentView.layout.showError();
  }
};

var ExpressionLoader = HeatmapLoader.extend(extObject);




// Histogram Loader

"use strict";

var extObject = {
  loadData: function(identifier){
    var name = identifier.name,
      chr = identifier.chr,
      range = identifier.range,
      change = identifier.change;

    this.toLocate = range;
    this.trackChanged = change;
    if(identifier.chr==null) {
      chr = "1";
      identifier.chr = "1"; // by default load chr1
    }
    if(this.trackChanged==null) this.trackChanged = true;

    this.lastIdentifier = {"name": name, "chr": chr};
    this.parentView.layout.showMsg("Loading...");

    if (this.trackChanged) {
      this.parentView.viewdata = {};
      this.loadBindingsmp(name, chr);
      this.loadExons(name, chr);
    }
    if(range==null) this.loadBinding(name, chr);
    else this.loadBinding(name, chr, range.xl, range.xr);
  },

  updateData: function(identifier){
    if (identifier.name == null) {
      identifier.name = this.lastIdentifier.name;
    }
    this.lastIdentifier.name = identifier.name;
    this.lastIdentifier.chr = "1";
    this.locateGene(identifier.srch);
  },

  loadComplete: function(){
    var data = this.parentView.viewdata;
    // do nothing when data is not completely loaded
    if(data.overviewData==null || data.histogramData==null || data.exonsData==null) return;
    if(this.trackChanged==true) {
      this.parentView.layout.prepareData();
      this.trackChanged = null;
    }
    if(this.toLocate!=null) {
      this.parentView.layout.initFocus(this.toLocate.xl, this.toLocate.xr);
      this.toLocate = null;
    }
    this.parentView.layout.reloadData();
  },

  loadBindingsmp: function(name, chr){
    var loader = this;
    name = utils.encodeSpecialChar(name);
    this.parentView.viewdata.overviewData = null;
    $.ajax({
        type: 'GET', url: addr, dataType: 'jsonp',
        data: {
        args: 'type=bindingsmp&name='+name+'&chr='+chr
        },
      error: function(xhr, status, err){ loader.error("cannot load binding overview\n" + status + "\n" + err); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0){
          loader.error("cannot load binding overview, check name and chr (or data not exists)");
          return;
        }
        data.values.sort(function(a,b){ return a.x - b.x; });

        //oader.parentView.viewdata.name = data.name;
        //oader.parentView.viewdata.chr = chr;
        loader.parentView.viewdata.overviewData = data;

        loader.loadComplete();
        }
    });
  },

  loadBindingFromLayout: function(acrossChr, name, chr, xl, xr){
    this.trackChanged = acrossChr;
    this.loadBinding(name, chr, xl, xr);
  },

  updateFocus: function(chr, xl, xr){
    this.parentView.layout.showMsg("Loading...");
    this.loadBinding(this.lastIdentifier.name, chr, xl, xr);
    if (this.lastIdentifier.chr != chr) {
      this.lastIdentifier.chr = chr;
      //console.log(this.parentView.viewname, this.lastIdentifier.name, chr);
      this.loadExons(this.lastIdentifier.name, chr);
    }
  },
  updateChr: function(chr){
    this.parentView.layout.showMsg("Loading...");
    this.loadBinding(this.lastIdentifier.name, chr);
  },
  // load high resolution binding data of 1000 samples
  loadBinding: function(name, chr, xl, xr){
    var loader = this, layout = this.parentView.layout;
    name = utils.encodeSpecialChar(name);
    this.parentView.viewdata.histogramData = null;
    var args = 'type=binding&name='+name+'&chr='+chr;
    if(xl!=null && xr!=null)  {
      args += '&xl='+xl+'&xr='+xr;
      this.toLocate = {"xl":xl, "xr": xr};    // set toLocate here for the layout range selection, a bit chaos
    }
    $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp', data: { "args": args },
      error: function(xhr, status, err){ loader.error("cannot load binding data\n" + status + "\n" + err); },
      success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0){
          loader.error("cannot load binding sampling");
          return;
        }
        data.values.sort(function(a,b){ return a.x - b.x; });

        loader.parentView.viewdata.name = data.name;
        loader.parentView.viewdata.chr = data.chr;
        loader.parentView.viewdata.histogramData = data;
        loader.loadComplete();
      }
    });
  },

  loadExons: function(name, chr){
    var loader = this;
    this.parentView.viewdata.exonsData = null;
    $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: {
        args: 'type=exons&name='+name+'&chr='+chr
      },
      error: function(xhr, status, err){ loader.error("cannot load exons\n" + status + "\n" + err); },
      success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || data.length==0){
          loader.error("cannot load exons\ncheck name and chr (or data not exists)");
          return;
        }
        data.sort(function(a,b){ return a.txStart==b.txStart? (a.txEnd-b.txEnd) : (a.txStart-b.txStart); }); // sort as intervals

        loader.parentView.viewdata.exonsData = data;
        loader.loadComplete();
      }
    });
  },

  locateGene: function(name){
    var loader = this, layout = this.parentView.layout;
    $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: {
        args: 'type=srchexon&name='+name
      },
      success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data.success == false){
          loader.error("gene not found");
          return;
        }
        var exonspan = data.txEnd - data.txStart;
        var xl = Math.round(data.txStart - exonspan * 0.1),
          xr = Math.round(data.txEnd + exonspan * 0.1);
        var identifier = {"name": loader.lastIdentifier.name, "chr": data.chr,
        "range": {"xl":xl, "xr":xr}, "change": data.chr!=loader.lastIdentifier.chr};
        loader.loadData(identifier);
        loader.parentView.postGroupMessage({"action":"focus", "chr":data.chr, "xl":xl, "xr":xr});
      }
    });
  },

  error: function(msg){
    this.parentView.viewdata = null;
    msg = this.parentView.viewname + ": " + msg;
    this.parentView.layout.showError();
    user.alert(msg);
    console.error(msg);
  }
};

var HistogramLoader = Loader.extend(extObject);


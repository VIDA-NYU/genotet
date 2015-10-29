/**
 * @fileoverview Renderer of the NetworkView.
 */

'use strict';

/**
 * BindingRenderer renders the visualizations for the BindingView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {ViewRenderer}
 * @constructor
 */
function BindingRenderer(container, data) {
  BindingRenderer.base.constructor.call(this, container, data);
}

BindingRenderer.prototype = Object.create(ViewRenderer.prototype);
BindingRenderer.prototype.constructor = BindingRenderer;
BindingRenderer.base = ViewRenderer.prototype;

/**
 * Initializes the BindingRenderer properties.
 */
BindingRenderer.init = function() {
  // margin of main bars
  this.mainbarTop = 8;
  this.overviewHeight = 40;

  // exons
  //this.exonsMargin = 20;
  this.exonsSize = 20;
  this.exonsHeight = 35;
  this.exonLabelSize = 6;

  // focus range
  this.focusleft = 0.0;
  this.focusright = 0.0;

  // target range
  this.targetleft = 0.0;
  this.targetright = 0.0;

  this.targetname = '';

  this.focusiborder = 10.0;

  // cursor line position (by data x)
  this.cursorX = 0.0;
  this.cursorPercent = -1.0;

  // translation (by data x)
  this.transX = 0.0;

  // when zooming/dragging, render sample
  this.zooming = false;
  this.dragging = false;
  this.loading = false;

  // zoom bar
  this.zoombarHeight = 10;

  // auto-adjusted y-scale
  this.autoScale = true;

  this.showExons = true;
  this.showOverview = true;

  this.bottomMargin = 5;
  // ui
  this.uiHeight = 26;
};

/*
LayoutHistogram.prototype.formatExons = function() {
  // now do the adjustment at the db
  var data = this.data;

  for (var i = 0; i < data.exonsData.length; i++) {
    // adjust exon1Start to cdsStart, exonNEnd to cdsEnd
    var exon = data.exonsData[i];
    exon.txRanges = new Array();  // half height
    exon.exRanges = new Array();  // actual exons to be drawn (full height)
    for (var j = 0; j < exon.exonCount; j++) {
      var start = exon.exonRanges[j].start, end = exon.exonRanges[j].end;
      if (start < exon.cdsStart) {
        if (end > exon.cdsStart) {
          if (end > exon.cdsEnd) {
            exon.txRanges.push({'start': start, 'end': exon.cdsStart});
            exon.txRanges.push({'start': exon.cdsEnd, 'end': end});
            exon.exRanges.push({'start': exon.cdsStart, 'end': exon.cdsEnd});
          }else if (end <= exon.cdsEnd) {
            exon.txRanges.push({'start': start, 'end': exon.cdsStart});
            exon.exRanges.push({'start': exon.cdsStart, 'end': end});
          }
        }else if (end <= exon.cdsStart) {
          exon.txRanges.push({'start': start, 'end': end});
        }
      }else if (start >= exon.cdsStart && start <= exon.cdsEnd) {
        if (end <= exon.cdsEnd) {
          exon.exRanges.push({'start': start, 'end': end});
        }else if (end > exon.cdsEnd) {
          exon.exRanges.push({'start': start, 'end': exon.cdsEnd});
          exon.txRanges.push({'start': exon.cdsEnd, 'end': end});
        }
      }else if (start > exon.cdsEnd) {
        exon.txRanges.push({'start': start, 'end': end});
      }
    }
  }
  for (var i = 0; i < exon.exRanges.length; i++) if (exon.exRanges[i].start > exon.exRanges[i].end) console.log(exon.exRanges[i]);
  for (var i = 0; i < exon.txRanges.length; i++) if (exon.txRanges[i].start > exon.txRanges[i].end) console.log(exon.txRanges[i]);
};

LayoutHistogram.prototype.prepareData = function() {  // get xmin, xmax, etc. called when binding data (gene,chr) changed
  // default focus region is all
  this.data = this.parentView.viewdata;

  var hdata = this.data.overviewData;  // must use overview data as it contains the correct xmin, xmax and maxval
  this.focusleft = hdata.values[0].x;
  this.focusright = hdata.values[hdata.values.length - 1].x;

  // x range
  this.xmin = hdata.xMin;
  this.xmax = hdata.xMax;
  this.xspan = this.xmax - this.xmin;

  // y range
  this.omaxval = 0;
  for (var i = 0; i < hdata.values.length; i++) this.omaxval = Math.max(this.omaxval, hdata.values[i].value);

  // find min and max of data value
  var valsall = hdata.values;
  var maxval = valsall[0].value,
    minval = valsall[0].value;
  for (var i = 1; i < valsall.length; i++) {
    maxval = Math.max(maxval, valsall[i].value);
    minval = Math.min(minval, valsall[i].value);
  }
  this.maxval = Math.max(maxval, 10.0);
  this.minval = minval;
  this.maxvalGlobal = this.maxval;
  this.minvalGlobal = this.minval;
};

LayoutHistogram.prototype.updateBarSize = function() {
  // height depends on current view size
  this.layoutHeight = this.rawheight - (this.compactLayout ? 0 : this.uiHeight);
  this.mainHeight = this.rawheight - (this.showOverview ? this.overviewHeight : 0) - (this.compactLayout ? 0 : this.uiHeight) - this.bottomMargin;
  this.mainbarY = this.mainbarTop;
  this.mainbarHeight = this.mainHeight - this.mainbarTop - (this.showExons ? this.exonsHeight : 0) - this.zoombarHeight;
  this.mainbarWidth = this.width;
  // number of coordinate lines
  this.numCoords = 5;
  // overview position
  this.overviewWidth = this.width - 10;
  this.overviewX = this.width - this.overviewWidth - 5.0;
  this.overviewY = 0.0;
  // exons position
  this.exonsY = this.mainHeight - this.exonsHeight * 0.65;
};

LayoutHistogram.prototype.reloadData = function() {
  var data = this.data;
  //if(data.histogramData==null) data.histogramData = data.overviewData; // if high resolution not ready, display normal data

  this.loading = false;

  this.formatExons();
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.initFocus = function(xl, xr) {  // only called by the loader
  this.focusleft = xl;
  this.focusright = xr;
};

LayoutHistogram.prototype.initLayout = function() {
  if (this.data == null || this.data.histogramData == null) return;

  this.updateBarSize();

  if (this.autoScale == true) {
    var valsall = this.data.histogramData.values;
    var maxval = valsall[0].value,
      minval = valsall[0].value;
    for (var i = 1; i < valsall.length; i++) {
      maxval = Math.max(maxval, valsall[i].value);
      minval = Math.min(minval, valsall[i].value);
    }
    this.maxval = maxval;
    this.minval = minval;
  }else {
    this.maxval = this.maxvalGlobal;
    this.minval = this.minvalGlobal;
  }
  this.barHeightFactor = this.mainbarHeight / (this.maxval == 0 ? 1E-6 : this.maxval);  // avoid Infinity
  this.obarWidth = this.overviewWidth / this.data.overviewData.values.length;
  this.obarHeightFactor = (this.overviewHeight - 5 - 5) / this.omaxval;  // 5 for bottom/top margin each

  this.zoombarLeft = this.zoombarRight = 0;
};

LayoutHistogram.prototype.removeLayout = function() {
  $('#' + this.htmlid + " div[name='ui']").remove();
  $('#' + this.htmlid + ' svg').remove();
  $('#' + this.htmlid + ' #hint').remove();
  $('#' + this.htmlid + ' #layoutwrapper').remove();
};

LayoutHistogram.prototype.renderLayout = function() {
  if (this.data == null || this.data.histogramData == null) return;
  var layout = this;
  this.renderUI(); // selection for chromosome
  $('#' + this.htmlid).append("<div id='layoutwrapper' class='renderdiv'></div>");
  $('#' + this.htmlid + ' #layoutwrapper')
    .css('width', manager.embedSize(this.width))
    .css('height', manager.embedSize(this.layoutHeight));

  if (this.showOverview == true) this.renderOverview();
  this.renderMain();
  if (this.showExons == true) this.updateExons();
};

LayoutHistogram.prototype.renderUI = function() {
  if (this.compactLayout) return;

  var data = this.data;
  var layout = this;

  $('#' + this.htmlid + ' .ui-widget-header').after("<div name='ui'>" +
  "<span style='margin-left: 5px; font-weight:900'>BINDING DATA</span>" +
  "<input id='gene' type='text' size='6' title='Change gene data and press ENTER to take effect'>" +
  "<span style='margin-left: 5px; font-weight:900'>CHROMOSOME</span>" +
  "<select name='chr' title='Switch chromosome'></select>" +
  "Start <input type='text' id='xl' size='8' title='Edit start coordinate'>" +
  "End <input type='text' id='xr' size='8' title='Edit end coordinate'>" +
  "Locate Gene <input type='text' id='search' size='8' title='Search for a specific gene among all chromosomes. Usage: regexp.'> " +
  "<input type='checkbox' id='autoscale' title='Auto adjust the maximum height to the maximum data value'>AutoScale" +
  "<input type='checkbox' id='overview' title='Show/hide overview'>Overview" +
  "<input type='checkbox' id='exons' title='Show/hide exons'>Exons" +
  '</div>');

  $('#' + this.htmlid + ' #gene').val(data.name).keydown(function(e) { if (e.which == 13) return layout.uiUpdate('gene');})
  .autocomplete({ source: manager.bindingNames, appendTo: 'body'});

  var chrs = manager.bindingChrs;
  for (var i = 0; i < chrs.length; i++) {
    $('#' + this.htmlid + ' div select').append('<option value=' + chrs[i] + '>' + chrs[i] + '</option>');
    if (chrs[i] == data.chr) $('#' + this.htmlid + " div select option[value='" + chrs[i] + "']").attr('selected', 'selected');
  }
  var htmlid = this.htmlid;
  $('#' + this.htmlid + ' div select').change(function() {
    //console.log(data.name, $("#"+htmlid+" div select option:selected").text(), this.loading);
    if (layout.loading == false) {
      var chr = $('#' + htmlid + ' div select option:selected').text();
      layout.parentView.loadData(data.name, chr);
      layout.parentView.postGroupMessage({'action': 'chr', 'chr': chr});
    }
  });
  $('#' + this.htmlid + ' #xl').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('range'); });
  $('#' + this.htmlid + ' #xr').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('range'); });
  $('#' + this.htmlid + ' #search').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('search'); });
  $('#' + this.htmlid + ' #autoscale').attr('checked', this.autoScale)
    .change(function() { return layout.toggleAutoScale(); });
  $('#' + this.htmlid + ' #overview').attr('checked', this.showOverview)
    .change(function() { return layout.toggleOverview(); });
  $('#' + this.htmlid + ' #exons').attr('checked', this.showExons)
    .change(function() { return layout.toggleExons(); });

  this.uiHeight = $('#' + this.htmlid + " div[name='ui']").height();
};

LayoutHistogram.prototype.uiUpdate = function(type) {
  var layout = this;
  if (layout.loading == true) return;
  if (type == 'range') {
    var xl = parseInt($('#' + layout.htmlid + ' #xl').val()),
      xr = parseInt($('#' + layout.htmlid + ' #xr').val());
    if (isNaN(xl)) xl = this.focusleft;
    if (isNaN(xr)) xr = this.focusright;
    if (xr < xl) {
      options.alert('xl, xr value incorrect');
      return;
    }
    layout.focusleft = xl;
    layout.focusright = xr;
    layout.loadBindingLayout();
  }else if (type == 'search') {
    srch = $('#' + layout.htmlid + ' #search').val();
    if (srch != '') {
      this.removeLayout();
      this.parentView.loader.locateGene(srch);
    }
  }else if (type == 'gene') {
    var name = $('#' + this.htmlid + ' #gene').val();
    if (manager.supportBinding(name) == false) {
      options.alert('Please type in a supported binding track');
      return;
    }
    this.removeLayout();
    this.parentView.loader.loadData({'name': name});
  }
};

LayoutHistogram.prototype.renderMain = function() {
  var layout = this;
  this.svg = d3.select('#' + this.htmlid + ' #layoutwrapper').append('svg')
    .style('height', this.mainHeight)
    .style('width', manager.embedSize(this.width));

  var name = this.data.name,
    chr = this.data.chr,
    valsall = this.data.histogramData.values;
    vals = new Array();

  for (var i = 0; i < valsall.length; i++) {
      if (valsall[i].x >= this.focusleft && valsall[i].x <= this.focusright)
      vals.push(valsall[i]);
  }
  if (vals.length == 0) vals.push({'x': Math.round(this.focusleft), 'value': 0}); // focusleft = focusright

  var barWidth = this.width / vals.length;

  // the xmin, xmax label
  var sidelabel = this.svg.selectAll('.label').data([this.focusleft, this.focusright]).enter().append('text')
    .attr('class', 'xlabel')
    .attr('text-anchor', function(d, i) { return !i ? 'start' : 'end'; })
    .attr('x', function(d, i) { return !i ? 0 : layout.width - 5; })
    .attr('y', layout.mainbarY + layout.mainbarHeight + this.zoombarHeight - 2)
    .text(function(d) { return Math.floor(d).toString(); });
  this.mainbar = this.svg.selectAll('.bar').data(vals).enter().append('rect')
    .attr('class', 'bar')
    .attr('x', function(d, i) { return i * barWidth; })
    .attr('y', function(d) { return layout.mainbarY + layout.mainbarHeight - d.value * layout.barHeightFactor; })
    .attr('width', barWidth)
    .attr('height', function(d) { return Math.max(d.value * layout.barHeightFactor, 0.1); });
  // calculate coordinate lines
  var coords = new Array();
  for (var i = 0; i <= this.numCoords; i++) {  // has actually numCoords+1 lines
    var curval = i * this.maxval / this.numCoords; //i*(this.maxval-this.minval)/this.numCoords + this.minval;
    curval = Math.round(curval * 10) / 10;
      coords.push(curval);
  }
  var coordline = this.svg.selectAll('.coordline').data(coords).enter().append('line')
    .attr('class', 'coordline')
    .attr('x1', 0)
    .attr('y1', function(d, i) { return layout.mainbarY + i * layout.mainbarHeight / layout.numCoords; })
    .attr('x2', this.width)
    .attr('y2', function(d, i) { return layout.mainbarY + i * layout.mainbarHeight / layout.numCoords; });
  var coordlabel = this.svg.selectAll('.coordlabel').data(coords).enter().append('text')
    .attr('class', 'coordlabel')
    .attr('x', this.width - 5)
    .attr('y', function(d, i) { return layout.mainbarTop + (layout.numCoords - i) * layout.mainbarHeight / layout.numCoords; })
    .text(function(d) { return d.toString(); });
  //if(this.compactLayout){
    var genename = this.svg.selectAll('#trackhint').data([{}]).enter().append('text')
    .attr('class', 'trackhint')
    .attr('id', 'trackhint')
    .attr('x', 0).attr('y', this.mainbarTop + 5)
    .text(this.data.name + ' Chr' + this.data.chr);
  //}

  this.zoom = d3.behavior.zoom();
  this.mainbariobj = this.svg.selectAll('#mainbariobj').data([{}]).enter().append('rect')
    .attr('class', 'iobj')
    .attr('id', 'mainbariobj').attr('x', 0).attr('y', layout.mainbarY)
    .attr('width', this.width)
    .attr('height', this.mainbarHeight)
    .call(this.zoom
      .on('zoomstart', function(d) { return layout.mainbarZoomstart(d); })
      .on('zoom', function(d) { return layout.mainbarZoom(d); })
      .on('zoomend', function(d) { return layout.mainbarZoomend(d); })
    );

  this.zbzoom = d3.behavior.zoom();
  this.zoombar = this.svg.selectAll('#zoombar').data([{}]).enter().append('rect')
    .attr('class', 'zoombar')
    .attr('id', 'zoombar')
    .attr('x', 0)
    .attr('y', this.mainbarHeight + this.mainbarTop)
    .attr('width', this.width)
    .attr('height', this.zoombarHeight)
    .call(this.zbzoom
      .on('zoomstart', function(d) { return layout.zoombarZoomstart(d); })
      .on('zoom', function(d) { return layout.zoombarZoom(d); })
      .on('zoomend', function(d) { return layout.zoombarZoomend(d); })
    );
  var zoombarSel = this.svg.selectAll('#zoombarSel').data([{}]).enter().append('rect')
    .attr('class', 'zoombar_sel')
    .attr('id', 'zoombarSel')
    .attr('x', this.zoombarLeft)
    .attr('y', this.mainbarHeight + this.mainbarTop)
    .attr('width', this.zoombarRight - this.zoombarLeft)
    .attr('height', this.zoombarHeight)
    .call(this.zbzoom
      .on('zoomstart', function(d) { return layout.zoombarZoomstart(d); })
      .on('zoom', function(d) { return layout.zoombarZoom(d); })
      .on('zoomend', function(d) { return layout.zoombarZoomend(d); })
    );
    //.call(d3.behavior.drag()
    //  .on("dragstart", function(d) { return layout.mainbarDragstart(d); })
    //  .on("drag", function(d) { return layout.mainbarDrag(d); })
    //  .on("dragend", function(d) { return layout.mainbarDragend(d); })
    //)
};


LayoutHistogram.prototype.renderOverview = function() {
  var layout = this;
  var valsall = this.data.overviewData.values;

  $('#' + this.htmlid + ' #layoutwrapper #svgov').remove();

  this.svgov = d3.select('#' + this.htmlid + ' #layoutwrapper').append('svg')
    .attr('id', 'svgov')
    .style('height', this.overviewHeight)
    .style('width', this.width);

  var overviewbar = this.svgov.selectAll('.obar').data(valsall).enter().append('rect')
    .attr('id', 'obar')
    .attr('class', 'obar')
    .attr('x', function(d, i) { return layout.overviewX + i * layout.obarWidth; })
    .attr('y', function(d) { return layout.overviewY + layout.overviewHeight - d.value * layout.obarHeightFactor - 5; })
    .attr('width', layout.obarWidth)
    .attr('height', function(d) { return Math.max(d.value * layout.obarHeightFactor, 0.1); });

  // focus board
  var focusrange = this.svgov.selectAll('#focusrange').data([{}]).enter().append('rect')
    .attr('id', 'focusrange')
    .attr('class', 'focusrange')
    .attr('x', this.overviewX + (this.focusleft - this.xmin) / this.xspan * this.overviewWidth)
    .attr('y', this.overviewY)
    .attr('width', Math.max(1, (this.focusright - this.focusleft) / this.xspan * this.overviewWidth))
    .attr('height', this.overviewHeight);

  var overviewFrame = this.svgov.selectAll('#obarframe').data([{}]).enter().append('rect')
    .attr('class', 'frame')
    .attr('x', this.overviewX)
    .attr('y', this.overviewY)
    .attr('width', this.overviewWidth)
    .attr('height', this.overviewHeight);

  this.obariobj = this.svgov.selectAll('#obariobj').data([{}]).enter().append('rect')
    .attr('id', 'obariobj')
    .attr('class', 'iobj')
    .attr('x', this.overviewX)
    .attr('y', this.overviewY)
    .attr('width', this.overviewWidth)
    .attr('height', this.overviewHeight)
    .call(d3.behavior.drag()
      //.origin(function(d) {  d.x = layout.overviewX-layout.focusiborder; d.y = layout.overviewY-layout.focusiborder; return d; } )
      .on('dragstart', function(d) { return layout.selectOverviewStart(d); })
      .on('drag', function(d) { return layout.selectOverview(d); })
      .on('dragend', function(d) { return layout.selectOverviewEnd(d); })
    );
};

LayoutHistogram.prototype.updateMainbar = function(d) {
  this.updateFocusrange();
  var layout = this;
  var vals = new Array(),
    valsall = this.data.histogramData.values;

  for (var i = 0; i < valsall.length; i++) {
      if (valsall[i].x >= this.focusleft && valsall[i].x <= this.focusright) vals.push(valsall[i]);
  }
  if (vals.length == 0) vals.push({'x': Math.round(this.focusleft), 'value': 0}); // focusleft = focusright

  var focusspan = this.focusright - this.focusleft;
  var barWidth = (vals[vals.length - 1].x - vals[0].x) / focusspan * this.mainbarWidth / vals.length;

  var mainbar = this.svg.selectAll('.bar').data(vals);

  mainbar.exit().remove();
  mainbar.enter().append('rect');
  mainbar.attr('class', 'bar')
    .attr('x', function(d, i) { return (vals[0].x - layout.focusleft) / focusspan * layout.mainbarWidth + i * barWidth; })
    .attr('y', function(d) { return layout.mainbarTop + layout.mainbarHeight - d.value * layout.barHeightFactor; })
    .attr('width', barWidth)
    .attr('height', function(d) { return Math.max(d.value * layout.barHeightFactor, 0.1); });

  // xlabel
  var sidelabel = this.svg.selectAll('.xlabel').data([this.focusleft, this.focusright])
    .text(function(d) { return Math.floor(d).toString(); });

  if (this.showExons) this.updateExons();
};

LayoutHistogram.prototype.updateExons = function() {
  var layout = this;
  var exons = new Array(), exonsall = this.data.exonsData;
  // first binary search the first exon
  var ll = 0, rr = exonsall.length - 1;
  while (ll <= rr) {
    var m = Math.floor((ll + rr) / 2);
    if (exonsall[m].txEnd < this.focusleft) ll = m + 1;
    else rr = m - 1;
  }
  for (var i = ll; i < exonsall.length && exonsall[i].txStart <= this.focusright; i++) exons.push(exonsall[i]);

  this.svg.selectAll('.txbox').remove();
  this.svg.selectAll('.exonbox').remove();
  this.svg.selectAll('.exonline').remove();
  this.svg.selectAll('.exonstrand').remove();
  this.svg.selectAll('.exonname').remove();

  var focusspan = layout.focusright - layout.focusleft;
  for (var i = 0; i < exons.length; i++) {
    if (exons.length < 100) {
      // base line
      var line = this.svg.selectAll('#exline' + i).data([exons[i]]).enter().append('line')
      .attr('id', '#exline' + i)
      .attr('class', 'exonline')
      .attr('x1', function(d) { return (d.txStart - layout.focusleft) / focusspan * layout.mainbarWidth; })
      .attr('x2', function(d) { return (d.txEnd - layout.focusleft) / focusspan * layout.mainbarWidth; })
      .attr('y1', layout.exonsY)
      .attr('y2', layout.exonsY);
      // outside cds range
      var txed = this.svg.selectAll('#txseg' + i).data(exons[i].txRanges).enter().append('rect')
      .attr('id', '#txseg' + i)
      .attr('class', 'txbox')
      .attr('x', function(d) { return (d.start - layout.focusleft) / focusspan * layout.mainbarWidth; })
      .attr('y', layout.exonsY - layout.exonsSize / 4.0)
      .attr('width', function(d) { return (d.end - d.start) / focusspan * layout.mainbarWidth; })
      .attr('height', layout.exonsSize / 2.0);
      // full-size exons
      var ex = this.svg.selectAll('#exseg' + i).data(exons[i].exRanges).enter().append('rect')
      .attr('id', '#exseg' + i)
      .attr('class', 'exonbox')
      .attr('x', function(d) { return (d.start - layout.focusleft) / focusspan * layout.mainbarWidth; })
      .attr('y', layout.exonsY - layout.exonsSize / 2.0)
      .attr('width', function(d, j) { return (d.end - d.start) / focusspan * layout.mainbarWidth; })
      .attr('height', layout.exonsSize);
      // strand
      var strands = [];
      for (var j = 0.25; j <= 0.75; j += 0.25) {
        strands.push({'x': exons[i].txStart * (1.0 - j) + exons[i].txEnd * j, 'strand': exons[i].strand });
      }
      var strand = this.svg.selectAll('#exstrand' + i).data(strands).enter().append('polygon')
      .attr('class', 'exonstrand')
      .attr('points', function(d) {
        var x = (d.x - layout.focusleft) / focusspan * layout.mainbarWidth, y = layout.exonsY;
        var dx = d.strand == '+' ? 5 : -5;
        return (x + dx) + ',' + y + ' ' + x + ',' + (y + 3) + ' ' + x + ',' + (y - 3);
      });
    }else {
      // abstract version
      for (var i = 0; i < exons.length; i++) {
        // base line
        var tx = this.svg.selectAll('#exonbox' + i).data([exons[i]]).enter().append('rect')
        .attr('id', '#exonbox' + i)
        .attr('class', 'exonbox')
        .attr('x', function(d) { return (d.txStart - layout.focusleft) / focusspan * layout.mainbarWidth; })
        .attr('y', layout.exonsY - layout.exonsSize / 4.0)
        .attr('width', function(d) { return (d.txEnd - d.txStart) / focusspan * layout.mainbarWidth; })
        .attr('height', layout.exonsSize / 2.0);
      }
    }
  }
  // name, reduced overlap
  if (exons.length <= 100) {
    var name = this.svg.selectAll('#exonname' + i).data(exons).enter().append('text')
    .attr('id', '#exonname' + i)
    .attr('class', 'exonname')
    .text(function(d, j) { {
      var lj = d.name2.length;
      var jMiddle = ((d.txEnd + d.txStart) / 2.0 - layout.focusleft) / focusspan * layout.mainbarWidth;
      for (var i = j + 1; i < exons.length; i++) {
        if (i == j) continue;  // skip itself
        var iMiddle = ((exons[i].txEnd + exons[i].txStart) / 2.0 - layout.focusleft) / focusspan * layout.mainbarWidth;
        var diff = Math.abs(iMiddle - jMiddle);
        if ((exons[i].name2.length + lj) * layout.exonLabelSize / 2.0 > diff) return '';
      }
      return d.name2;
    }})
    .attr("x", function(d){ return ((d.txEnd+d.txStart)/2.0-layout.focusleft)/focusspan*layout.mainbarWidth; })
    .attr("y", layout.exonsY + layout.exonsSize*0.95);
  }
};

LayoutHistogram.prototype.updateFocusrange = function(){
  if(this.showOverview==false) return;
  this.svgov.selectAll("#focusrange").data([{}])
    .attr("x", this.overviewX + (this.focusleft-this.xmin)/this.xspan*this.overviewWidth)
    .attr("y", this.overviewY)
    .attr("width", (this.focusright-this.focusleft)/this.xspan*this.overviewWidth)
    .attr("height", this.overviewHeight);
  //this.updateTargetrange();
};

LayoutHistogram.prototype.selectOverviewStart = function(d){
  if(this.loading == true) return;
  this.zooming = true;
  var rect = this.obariobj[0][0];
  var x = d3.mouse(rect)[0]; // get mouse x
  this.focusx1 = x;
  this.focusx2 = this.focusx1;
  this.updateFocusrange();
};

LayoutHistogram.prototype.selectOverview = function(d){
  if(this.loading == true) return;
  var rect = this.obariobj[0][0];
  var x = d3.mouse(rect)[0]; // get mouse x
  x = Math.max(x, 0); x = Math.min(x, this.overviewWidth);
  this.focusx2 = x;

  var xl = Math.min(this.focusx1, this.focusx2),
    xr = Math.max(this.focusx1, this.focusx2);
  this.focusleft = xl/this.overviewWidth*this.xspan + this.xmin;
  this.focusright = xr/this.overviewWidth*this.xspan + this.xmin;
  this.focusright = Math.max(this.focusleft+0.1, this.focusright);  // avoid zero span
  this.updateFocusrange();
  this.updateMainbar();
};

LayoutHistogram.prototype.selectOverviewEnd = function(d){
  if(this.loading == true) return;
  this.zooming = false;
  //this.updateMainbar();
  this.loadBindingLayout();
};

LayoutHistogram.prototype.updateCursorline = function(layoutX, valueX){
  this.svg.select("#cursorlabel").data([{}])
    .attr("visibility", this.cursorPercent<0?"hidden":"visible")
    .attr("x", layoutX)
    .text(Math.round(valueX).toString());
  this.svg.select("#cursorline").data([{}])
    .attr("visibility", this.cursorPercent<0?"hidden":"visible")
    .attr("x1", layoutX)
    .attr("x2", layoutX);
};

LayoutHistogram.prototype.mainbarZoomstart = function(d){
  if(this.loading == true) return;
  this.zooming = true;
  this.lastdx = 0;
  this.lastscale = 1.0;
};

LayoutHistogram.prototype.mainbarZoom = function(d){
  if(this.loading == true) return;
  var d3trans = d3.event.translate, d3scale = d3.event.scale;
  var dx = d3trans[0] - this.lastdx, dscale = d3scale/this.lastscale;
  var width = this.mainbarWidth;
  this.lastdx = d3trans[0];
  this.lastscale = d3scale;

  //console.log(d3trans, d3scale, dx, dscale);
  clearTimeout(this.timer);
  if(dscale == 1.0){ // translate, no scale
    var trans = -dx/this.width*(this.focusright-this.focusleft);
    this.focusleft += trans;
    this.focusright += trans;
    this.focusleft = Math.max(this.xmin, this.focusleft);
    this.focusright = Math.min(this.xmax, this.focusright);
  }else{ // mouse wheel, scale
    this.wheeled = true;
    var rect = this.mainbariobj[0][0];
    var mx = d3.mouse(rect)[0]; // get mouse x
    var fm = this.focusleft + 1.0*mx/width*(this.focusright-this.focusleft);
    this.focusleft += (dscale-1.0)*(this.focusleft-fm);
    this.focusright += (dscale-1.0)*(this.focusright-fm);
    this.focusleft = Math.max(this.xmin, this.focusleft);
    this.focusright = Math.min(this.xmax, this.focusright);
  }
  this.updateFocusrange();
  this.updateMainbar();
  //this.mainbar.attr("transform", "translate(" + d3trans + ")scale(" + d3scale + ")");
};

LayoutHistogram.prototype.mainbarZoomend = function(d){
  if(this.loading == true) return;
  this.zoom.scale(1.0);
  this.zoom.translate([0,0]);
  this.zooming = false;

  timerLayout = this;
  clearTimeout(this.timer); // reset timer to wait for more wheel
  this.timer = setTimeout ( this.zoomTimer, 500 );
  //this.loadBinding();
};

LayoutHistogram.prototype.zoombarZoomstart = function(d){
  if(this.loading == true) return;
  this.zooming = true;
  this.lastzbx = 0;
  var rect = this.zoombar[0][0];
  var mx = d3.mouse(rect)[0]; // get mouse x
  this.zoombarLeft = this.zoombarRight = mx;
  this.svg.select("#zoombarSel").attr("x", mx).attr("width",0);
};

LayoutHistogram.prototype.zoombarZoom = function(d){
  if(this.loading == true) return;
  var rect = this.zoombar[0][0];
  var mx = d3.mouse(rect)[0]; // get mouse x
  this.zoombarRight = mx;
  if(this.zoombarRight < this.zoombarLeft){
    this.svg.select("#zoombarSel")
      .attr("x", this.zoombarRight)
      .attr("width", this.zoombarLeft - this.zoombarRight);
  }else{
    this.svg.select("#zoombarSel")
      .attr("width", this.zoombarRight - this.zoombarLeft);
  }
};

LayoutHistogram.prototype.zoombarZoomend = function(d){
  if(this.loading == true) return;
  this.zbzoom.translate([0,0]);
  var xl = Math.min(this.zoombarLeft, this.zoombarRight),
    xr = Math.max(this.zoombarLeft, this.zoombarRight),
  xl = Math.max(xl, 0); xr = Math.min(xr, this.width);
  var focusspan = this.focusright - this.focusleft, fb = this.focusleft;
  this.focusleft = 1.0*xl/this.width*focusspan + fb;
  this.focusright = 1.0*xr/this.width*focusspan + fb;
  this.loadBindingLayout();
};

LayoutHistogram.prototype.zoomTimer = function(){
  timerLayout.loadBindingLayout();
};

LayoutHistogram.prototype.loadBindingLayout = function(acrossChr){
  if(acrossChr==null) acrossChr = false;
  this.loading = true;
  var xl = Math.round(this.focusleft), xr = Math.round(this.focusright);
  this.parentView.loader.loadBindingFromLayout(acrossChr, this.data.name, this.data.chr, xl, xr);
  var msg = {"action":"focus", "chr":this.data.chr, "xl":xl, "xr": xr};
  this.parentView.postGroupMessage(msg);
};

LayoutHistogram.prototype.showMsg = function(msg, ui){
  this.removeLayout();
  //$("#"+this.htmlid+" #hint").remove();
  if (ui==null) ui = false;
  $("#"+this.htmlid).append("<div id='hint' class='hint'></div>");
  $("#"+this.htmlid+" #hint").text(msg).css({"width": this.width, "height":this.rawheight-(ui && !this.compactLayou?this.uiHeight:0) });
};

LayoutHistogram.prototype.showError = function(){
  this.showMsg("Oops..this guy is dead. x_X", true);
  this.renderUI();
};

LayoutHistogram.prototype.resizeLayout = function(newsize){
  if (this.parentView.showHeader==false) newsize[1] += manager.headerHeight;

  this.width = newsize[0];
  this.rawheight = newsize[1];
  this.height = newsize[1]-manager.headerHeight;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.toggleAutoScale = function(){
  this.autoScale = !this.autoScale;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.toggleOverview = function(){
  this.showOverview = !this.showOverview;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.toggleExons = function(){
  this.showExons = !this.showExons;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.setCompact = function(compact){
  this.compactLayout = compact;
  //this.showOverview = !compact;
  //this.showExons = !compact;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};
*/

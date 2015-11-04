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

/** @const {number} */
BindingRenderer.prototype.EXON_HEIGHT = 35;
/** @const {number} */
BindingRenderer.prototype.EXON_SIZE = 10;
/** @const {number} */
BindingRenderer.prototype.OVERVIEW_HEIGHT = 30;

/**
 * When there are more than this limit number of exons, we draw exons as
 * abstract rectangles.
 * @type {number}
 */
BindingRenderer.prototype.EXON_ABSTRACT_LIMIT = 100;

/** @const {number} */
BindingRenderer.prototype.STRAND_HORIZONTAL_SIZE = 5;
/** @const {number} */
BindingRenderer.prototype.STRAND_VERTICAL_SIZE = 3;
/** @const {number} */
BindingRenderer.prototype.EXON_LABEL_SIZE = 6;

/**
 * Initializes the BindingRenderer properties.
 */
BindingRenderer.prototype.init = function() {
  BindingRenderer.base.init.call(this);

  /**
   * Height of a single binding track, including the overview track.
   * This is computed by default for a single track, and will be re-computed
   * upon resize event.
   * @private {number}
   */
  this.trackHeight_ = this.canvasHeight_ - this.EXON_HEIGHT;

  // LOD range.
  /** @private {number} */
  this.detailXMin_ = Infinity;
  /** @private {numebr} */
  this.detailXMax_ = -Infinity;

  // Navigation state.
  /** @private {!Array<number>} */
  this.zoomTranslate_ = [0, 0];
  /** @private {number} */
  this.zoomScale_ = 1.0;
  /**
   * Zooming state of the binding data tracks. 
   * @private {d3.zoom}
   */
  this.zoom_;

  /*
  // target range
  this.targetleft = 0.0;
  this.targetright = 0.0;
  this.targetname = '';
  this.focusiborder = 10.0;

  // cursor line position (by data x)
  this.cursorX = 0.0;
  this.cursorPercent = -1.0;
  */
};

/** @inheritDoc */
BindingRenderer.prototype.dataLoaded = function() {
  if (this.detailXMin_ == Infinity) {
    // Detail range has never been set.
    this.data.tracks.forEach(function(track) {
      this.detailXMin_ = Math.min(this.detailXMin_, track.xMin);
      this.detailXMax_ = Math.max(this.detailXMax_, track.xMax);
    }, this);
  }
  this.render();
};

/** @inheritDoc */
BindingRenderer.prototype.initLayout = function() {
  // Create groups for the (multiple) binding tracks, and exons.
  /**
   * SVG group for the binding tracks.
   * @private {!d3.selection}
   */
  this.svgBinding_ = this.canvas.append('g')
    .classed('tracks', true);
  /**
   * SVG group for the exons.
   * @private {!d3.selection}
   */
  this.svgExons_ = this.canvas.append('g')
    .classed('exons', true);
};

/**
 * Arranges the binding tracks so that they are stacked vertically.
 * This function also layouts the exon group.
 */
BindingRenderer.prototype.layout = function() {
  var numTracks = this.data.tracks.length;
  var tracks = this.svgBinding_.selectAll('g.track')
    .data(this.data.tracks, function(track) {
      return track.gene;
    });
  tracks.enter().append('g')
    .attr('id', function(track) {
      return track.gene;
    })
    .classed('track', true)
    .attr('transform', function(track, index) {
      return Utils.getTransform([0, this.trackHeight_ * index]);
    }.bind(this));
  tracks.exit().remove();
  tracks.attr('height', this.trackHeight_);

  this.svgExons_.attr('transform',
      Utils.getTransform([0, this.canvasHeight_ - this.EXON_HEIGHT]));

  this.zoom_ = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', this.zoomHandler_.bind(this))
    .on('zoomend', this.zoomHandler_.bind(this, true));

  this.svgBinding_.call(this.zoom_);
};

/** @inheritDoc */
BindingRenderer.prototype.render = function() {
  // Call layout to adjust the binding track positions so as to adapt to
  // multiple binding tracks.
  this.layout();

  this.drawBinding_();
  this.drawExons_();
};

/**
 * Renders the binding data as histograms.
 * The function iterate the binding tracks and renders each of them.
 * @private
 */
BindingRenderer.prototype.drawBinding_ = function() {
  this.data.tracks.forEach(function(track) {
    this.drawBindingTrack_(track);
  }.bind(this));
};

/**
 * Renders a single binding track, including the binding histogram and
 * the overview.
 * @param {!Object} track Binding track data.
 * @private
 */
BindingRenderer.prototype.drawBindingTrack_ = function(track) {
  var svg = this.canvas.select('#' + track.gene);
  if (svg.select('.overview').empty()) {
    svg.append('g')
      .classed('overview', true)
      .attr('height', this.OVERVIEW_HEIGHT);
  }
  if (svg.select('.detail').empty()) {
    svg.append('g')
      .classed('detail', true)
      .attr('transform', Utils.getTransform([0, this.OVERVIEW_HEIGHT]));
  }
  var overview = svg.select('.overview');
  this.drawHistogram_(overview, track);
  var histogram = svg.select('.detail')
    .attr('height', this.trackHeight_ - this.OVERVIEW_HEIGHT);
  this.drawHistogram_(histogram, track);
};

/**
 * Renders the binding data as a histogram.
 * @param {!d3.selection} svg SVG group for the overview.
 * @param {!Object} track Track data.
 * @private
 */
BindingRenderer.prototype.drawHistogram_ = function(svg, track) {
  var bars = svg.selectAll('rect').data(track.values);
  bars.enter().append('rect');
  bars.exit().remove();
  if (!track.values.length) {
    // Avoid rendering empty data.
    return;
  }
  var height = svg.attr('height');
  var xScale = d3.scale.linear()
    .domain([track.xMin, track.xMax])
    .range([0, this.canvasWidth_]);
  var yScale = d3.scale.linear()
    .domain([0, track.maxValue])
    .range([0, height]);

  var barWidth = this.canvasWidth_ / track.values.length;
  bars
    .attr('transform', function(bar) {
      return Utils.getTransform([xScale(bar.x), height - yScale(bar.value)]);
    }.bind(this))
    .attr('width', barWidth)
    .attr('height', function(bar) {
      return yScale(bar.value);
    });
};

/**
 * Renders the exons below the binding tracks.
 */
BindingRenderer.prototype.drawExons_ = function() {
  var exons = [];
  var detailRange = [this.detailXMin_, this.detailXMax_];
  this.data.exons.forEach(function(exon) {
    if (Utils.rangeIntersect([exon.txStart, exon.txEnd], detailRange)) {
      exons.push(exon);
    }
  }, this);

  var xScale = d3.scale.linear()
    .domain(detailRange)
    .range([0, this.canvasWidth_]);

  var exonCenterY = this.EXON_HEIGHT / 2;
  var exonHalfY = exonCenterY - this.EXON_SIZE / 4;
  var exonY = exonCenterY - this.EXON_SIZE / 2;

  if (exons.length > this.EXON_ABSTRACT_LIMIT) {
    // Render the exons in abstract shapes.
    var tx = this.svgExons_.selectAll('.abstract').data(exons);
    tx.enter().append('rect')
      .classed('abstract', true)
      .attr('y', exonY);
    tx.exit().remove();
    tx.attr('x', function(exon) {
        return xScale(exon.txStart);
      })
      .attr('width', function(exon) {
        return xScale(exon.txEnd) - xScale(exon.txStart);
      })
      .attr('height', this.EXON_SIZE);

    this.svgExons_.selectAll('g.exon').remove();
  } else {
    // Render detailed exons.
    var gs = this.svgExons_.selectAll('g.exon').data(exons);
    var gsEnter = gs.enter().append('g')
      .classed('exon', true);
    gsEnter.append('text'); // For label
    gsEnter.append('line'); // For base line
    gs.exit().remove();

    // Base lines
    gs.select('line')
      .attr('y1', exonCenterY)
      .attr('y2', exonCenterY)
      .attr('x1', function(exon) {
        return xScale(exon.txStart);
      })
      .attr('x2', function(exon) {
        return xScale(exon.txEnd);
      });

    // Outside cds range, half size
    var txs = gs.selectAll('.txbox').data(function(exon) {
      return exon.txRanges;
    });
    txs.enter().append('rect')
      .classed('txbox', true)
      .attr('y', exonHalfY)
      .attr('height', this.EXON_SIZE / 2);
    txs.exit().remove();
    txs
      .attr('x', function(range) {
        return xScale(range.start);
      })
      .attr('width', function(range) {
        return xScale(range.end) - xScale(range.start);
      });

    // Full size
    var exs = gs.selectAll('.box').data(function(exon) {
      return exon.exRanges;
    });
    exs.enter().append('rect')
      .classed('box', true)
      .attr('y', exonY)
      .attr('height', this.EXON_SIZE);
    exs.exit().remove();
    exs
      .attr('x', function(range) {
        return xScale(range.start);
      })
      .attr('width', function(range) {
        return xScale(range.end) - xScale(range.start);
      });

    // Strands
    var strands = gs.selectAll('.strand').data(function(exon) {
      var data = [];
      for (var i = 0.25; i <= 0.75; i += 0.25) {
        data.push({
          x: exon.txStart * (1.0 - i) + exon.txEnd * i,
          direction: exon.strand
        });
      }
      return data;
    });
    var line = d3.svg.line();
    strands.enter().append('path')
      .classed('strand', true);
    strands.exit().remove();
    strands.attr('d', function(strand) {
      var x = xScale(strand.x);
      var dx = strand.direction == '+' ?
          this.STRAND_HORIZONTAL_SIZE : -this.STRAND_HORIZONTAL_SIZE;
      return line([
        [x + dx, exonCenterY],
        [x, exonCenterY + this.STRAND_VERTICAL_SIZE],
        [x, exonCenterY - this.STRAND_VERTICAL_SIZE]
      ]);
    }.bind(this));

    // Labels
    gs.select('text')
      .attr('y', exonY)
      .attr('x', function(exon) {
        return xScale((exon.txStart + exon.txEnd) / 2);
      })
      .text(function(exon, index) {
        if (index) {
          // Prevent overlap with the label on the left.
          var prevExon = exons[index - 1];
          var dist = Math.abs(xScale((prevExon.txStart + prevExon.txEnd) / 2 -
              (exon.txStart + exon.txEnd) / 2));
          var nameWidth = (exon.name2.length + prevExon.name2.length) / 2 *
              this.EXON_LABEL_SIZE;
          if (nameWidth > dist) {
            return '';
          }
        }
        return exon.name2;
      });
  }
};

/**
 * Re-computes the track height.
 */
BindingRenderer.prototype.resize = function() {
  BindingRenderer.base.resize.call(this);
  var totalHeight = this.canvasHeight_ - this.EXON_HEIGHT;
  var numTracks = this.data.tracks.length;
  this.trackHeight_ = totalHeight / (numTracks ? numTracks : 1);
};

/**
 * Handles mouse zoom event.
 * @private
 */
BindingRenderer.prototype.zoomHandler_ = function() {
  var translate = d3.event.translate;
  var scale = d3.event.scale;

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;
  
  this.svgBinding_.attr('transform', Utils.getTransform(translate, scale));
};
/*
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

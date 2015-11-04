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

  /**
   * Height of a single detail binding track. This is re-computed upon
   * resize event.
   * @private {number}
   */
  this.detailHeight_ = 0;

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
   * @private {!d3.zoom}
   */
  this.zoom_ = d3.behavior.zoom();

  /**
   * Vertical translate value of the detail SVG group.
   * @private {number}
   */
  this.detailTranslateY_;
  /**
   * Vertical translate value of the exons SVG group.
   * @private {number}
   */
  this.exonsTranslateY_;
}

BindingRenderer.prototype = Object.create(ViewRenderer.prototype);
BindingRenderer.prototype.constructor = BindingRenderer;
BindingRenderer.base = ViewRenderer.prototype;

/** @const {number} */
BindingRenderer.prototype.EXON_HEIGHT = 35;
/** @const {number} */
BindingRenderer.prototype.EXON_SIZE = 10;
/** @const {number} */
BindingRenderer.prototype.OVERVIEW_HEIGHT = 25;

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

/** @const {!Array<number>} */
BindingRenderer.prototype.ZOOM_EXTENT = [1, 1000];

/**
 * Initializes the BindingRenderer properties.
 */
BindingRenderer.prototype.init = function() {
  BindingRenderer.base.init.call(this);

  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(this.ZOOM_EXTENT)
    .on('zoom', this.zoomHandler_.bind(this))
    .on('zoomend', this.zoomEndHandler_.bind(this));
  this.detailHandle_.call(this.zoom_);
  this.exonsHandle_.call(this.zoom_);
};

/** @inheritDoc */
BindingRenderer.prototype.dataLoaded = function() {
  if (this.detailXMin_ == Infinity) {
    // Detail range has never been set.
    this.data.tracks.forEach(function(track) {
      this.detailXMin_ = Math.min(this.detailXMin_, track.detail.xMin);
      this.detailXMax_ = Math.max(this.detailXMax_, track.detail.xMax);
    }, this);
  }
  this.render();
};

/** @inheritDoc */
BindingRenderer.prototype.initLayout = function() {
  // Create groups for the overviews, binding tracks, and exons.
  /**
   * SVG group for the binding overviews.
   * @private {!d3.selection}
   */
  this.svgOverview_ = this.canvas.append('g')
    .classed('overviews', true)
  /**
   * SVG group for the detailed binding tracks.
   * @private {!d3.selection}
   */
  this.svgDetail_ = this.canvas.append('g')
    .classed('details', true);
  /**
   * SVG group for the binding overviews.
   * @private {!d3.selection}
   */
  this.svgExons_ = this.canvas.append('g')
    .classed('exons', true);

  /**
   * SVG group for the overview content.
   */
  this.overviewContent_ = this.svgOverview_.append('g')
    .classed('content', true);
  /**
   * SVG group for the detailed binding tracks content.
   * @private {!d3.selection}
   */
  this.detailContent_ = this.svgDetail_.append('g')
    .classed('content', true);
  /**
   * SVG group for the exons content.
   * @private {!d3.selection}
   */
  this.exonsContent_ = this.svgExons_.append('g')
    .classed('content', true);

  // Add invisible handles for zooming. Handles shall be created after
  // the contents so that the handles appear on top of the rendered
  // elements.
  /**
   * Handle for the overview group.
   * @private {!d3.selection}
   */
  this.overviewHandle_ = this.svgOverview_.append('rect')
    .classed('zoom-handle', true);
  /**
   * Handle for the detail group.
   * @private {!d3.selection}
   */
  this.detailHandle_ = this.svgDetail_.append('rect')
    .classed('zoom-handle', true);
  /**
   * Handle for the exons group.
   * @private {!d3.selection}
   */
  this.exonsHandle_ = this.svgExons_.append('rect')
    .classed('zoom-handle', true);
};

/**
 * Arranges the binding tracks so that they are stacked vertically.
 * This function also layouts the exon group.
 */
BindingRenderer.prototype.layout = function() {
  // Must update first, as data may have been reloaded.
  this.updateDetailHeight_();
  // Update zoom handle sizes based on track height.
  this.updateZoomHandles_();

  var numTracks = this.data.tracks.length;

  // Compute translate values.
  this.detailTranslateY_ = numTracks * this.OVERVIEW_HEIGHT;
  this.exonsTranslateY_ = this.canvasHeight_ - this.EXON_HEIGHT;

  // Translate SVG groups to place.
  this.svgDetail_.attr('transform',
    Utils.getTransform([0, this.detailTranslateY_]));
  this.svgExons_.attr('transform',
    Utils.getTransform([0, this.exonsTranslateY_]));

  var getGene = function(track) {
    return track.gene;
  };

  // Set up overview tracks.
  var overviews = this.overviewContent_.selectAll('g')
    .data(this.data.tracks, getGene);
  overviews.enter().append('g')
    .attr('id', getGene);
  overviews.exit().remove();
  overviews
    .attr('height', this.OVERVIEW_HEIGHT)
    .attr('transform', function(track, index) {
      return Utils.getTransform([0, this.OVERVIEW_HEIGHT * index]);
    }.bind(this));

  // Set up detail tracks.
  var details = this.detailContent_.selectAll('g')
    .data(this.data.tracks, getGene);
  details.enter().append('g')
    .attr('id', getGene);
  details.exit().remove();
  details
    .attr('height', this.detailHeight_)
    .attr('transform', function(track, index) {
      return Utils.getTransform([0, this.detailHeight_ * index]);
    }.bind(this));
};

/** @inheritDoc */
BindingRenderer.prototype.render = function() {
  // Call layout to adjust the binding track positions so as to adapt to
  // multiple binding tracks.
  this.layout();

  this.drawOverviews_();
  this.drawDetails_();
  this.drawExons_();
};

/**
 * Renders the binding overview tracks.
 * @private
 */
BindingRenderer.prototype.drawOverviews_ = function() {
  this.data.tracks.forEach(function(track) {
    var svg = this.overviewContent_.select('#' + track.gene);
    this.drawHistogram_(svg, track.overview);
  }, this);
};

/**
 * Renders the binding detail tracks.
 * @private
 */
BindingRenderer.prototype.drawDetails_ = function() {
  this.data.tracks.forEach(function(track) {
    var svg = this.detailContent_.select('#' + track.gene);
    this.drawHistogram_(svg, track.detail);
  }, this);
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
    var tx = this.exonsContent_.selectAll('.abstract').data(exons);
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

    this.exonsContent_.selectAll('g.exon').remove();
  } else {
    // Render detailed exons.
    var gs = this.exonsContent_.selectAll('g.exon').data(exons);
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
 * Re-computes the detail track height.
 */
BindingRenderer.prototype.updateDetailHeight_ = function() {
  var numTracks = this.data.tracks.length;
  var totalDetailHeight = this.canvasHeight_ - this.EXON_HEIGHT -
    this.OVERVIEW_HEIGHT * numTracks;
  this.detailHeight_ = totalDetailHeight / (numTracks ? numTracks : 1);
};

/**
 * Handles resize event.
 */
BindingRenderer.prototype.resize = function() {
  BindingRenderer.base.resize.call(this);
  this.updateZoomHandles_();
  this.render();
};

/**
 * Updates background sizes.
 * @private
 */
BindingRenderer.prototype.updateZoomHandles_ = function() {
  var numTracks = this.data.tracks.length;
  var heights = [
    this.OVERVIEW_HEIGHT * numTracks,
    this.detailHeight_ * numTracks,
    this.EXON_HEIGHT
  ];
  this.canvas.selectAll('.zoom-handle').data(heights)
    .attr('height', _.identity);
};

/**
 * Handles mouse zoom event.
 * @private
 */
BindingRenderer.prototype.zoomHandler_ = function() {
  var translate = d3.event.translate;
  var scale = d3.event.scale;

  // Prevent horizontal panning out of range.
  translate[0] = Math.max(this.canvasWidth_ * (1 - scale), translate[0]);
  translate[0] = Math.min(0, translate[0]);
  // Prevent vertical panning.
  translate[1] = 0;

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;

  var transform = Utils.getTransform(translate, [scale, 1]);
  this.detailContent_.attr('transform', transform);
  this.exonsContent_.attr('transform', transform);
  this.drawDetails_();
};

/**
 * Handles mouse zoom end event.
 * @private
 */
BindingRenderer.prototype.zoomEndHandler_ = function() {

};

/*
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


*/

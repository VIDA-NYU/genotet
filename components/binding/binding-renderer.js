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
   * X scale that maps bars to full width of the view.
   * @private {!d3.zoom}
   */
  this.xScaleOverview_ = d3.scale.linear();
  /**
   * X scale for the detail zooming.
   * @private {!d3.zoom}
   */
  this.xScaleZoom_ = d3.scale.linear();

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

  /**
   * Timer handle for the zoom interval.
   * @private {number}
   */
  this.zoomTimer_;
}

BindingRenderer.prototype = Object.create(ViewRenderer.prototype);
BindingRenderer.prototype.constructor = BindingRenderer;
BindingRenderer.base = ViewRenderer.prototype;

/** @const {number} */
BindingRenderer.prototype.EXON_HEIGHT = 35;
/** @const {number} */
BindingRenderer.prototype.EXON_SIZE = 10;
/** @const {number} */
BindingRenderer.prototype.EXON_CENTER_Y = 20;
/** @const {number} */
BindingRenderer.prototype.EXON_LABEL_OFFSET = 3;
/** @const {number} */
BindingRenderer.prototype.OVERVIEW_HEIGHT = 25;

/**
 * When there are more than this limit number of exons, we draw exons as
 * abstract rectangles.
 * @type {number}
 */
BindingRenderer.prototype.EXON_ABSTRACT_LIMIT = 200;

/** @const {number} */
BindingRenderer.prototype.STRAND_HORIZONTAL_SIZE = 5;
/** @const {number} */
BindingRenderer.prototype.STRAND_VERTICAL_SIZE = 3;
/** @const {number} */
BindingRenderer.prototype.EXON_LABEL_SIZE = 6;

/** @const {!Array<number>} */
BindingRenderer.prototype.ZOOM_EXTENT = [1, 65536];
/** @const {number} */
BindingRenderer.prototype.ZOOM_INTERVAL = 500;

/**
 * Initializes the BindingRenderer properties.
 */
BindingRenderer.prototype.init = function() {
  BindingRenderer.base.init.call(this);

  // Set up the detailed histogram zoom.
  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(this.ZOOM_EXTENT)
    .on('zoom', this.zoomHandler_.bind(this))
    .on('zoomend', this.zoomEndHandler_.bind(this));
  this.detailHandle_.call(this.zoom_);
  this.exonsHandle_.call(this.zoom_);

  // Set up the overview drag range selection.
  var dragRange = [];
  this.drag_ = d3.behavior.drag()
    .on('drag', function() {
      var x = d3.event.x;
      if (dragRange[0] == null) {
        dragRange[0] = x;
      } else {
        dragRange[1] = x;
        this.drawOverviewRange_([
          this.xScaleOverview_.invert(Math.min(dragRange[0], dragRange[1])),
          this.xScaleOverview_.invert(Math.max(dragRange[0], dragRange[1]))
        ]);
      }
    }.bind(this))
    .on('dragend', function() {
      if (dragRange[0] == null || dragRange[1] == null) {
        // Mouse doesn't move. Skip the event.
        return;
      }
      this.zoomDetail_([
        this.xScaleOverview_.invert(Math.min(dragRange[0], dragRange[1])),
        this.xScaleOverview_.invert(Math.max(dragRange[0], dragRange[1]))
      ]);
      // Reset dragging range.
      dragRange = [];
    }.bind(this));
  this.overviewHandle_.call(this.drag_);
};

/**
 * Updates the binding data overview and detail ranges.
 * @private
 */
BindingRenderer.prototype.getBindingRanges_ = function() {
  if (this.data.overviewRangeChanged) {
    this.xScaleZoom_
      .domain([this.data.overviewXMin, this.data.overviewXMax])
      .range([0, this.canvasWidth_]);
    this.zoom_.x(this.xScaleZoom_);
    this.zoomTranslate_ = [0, 0];
    this.zoomScale_ = 1;

    this.xScaleOverview_
      .domain([this.data.overviewXMin, this.data.overviewXMax])
      .range([0, this.canvasWidth_]);

    this.detailContent_.attr('transform', '');
  }
};

/** @inheritDoc */
BindingRenderer.prototype.dataLoaded = function() {
  this.getBindingRanges_();
  this.render();

  // Initialize coordinates in the panel.
  // Send the coordinates to the panel.
  this.signal('coordinates', {
    start: this.data.detailXMin,
    end: this.data.detailXMax
  });
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

  /**
   * SVG rect for overview range.
   * @private {!d3.selection}
   */
  this.overviewRange_ = this.overviewContent_.append('rect')
    .classed('range', true);

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
  this.detailTranslateY_ = this.data.options.showOverview ?
    numTracks * this.OVERVIEW_HEIGHT : 0;
  this.exonsTranslateY_ = this.canvasHeight_ - this.EXON_HEIGHT;

  // Translate SVG groups to place.
  this.svgDetail_.attr('transform',
    Utils.getTransform([0, this.detailTranslateY_]));
  this.svgExons_.attr('transform',
    Utils.getTransform([0, this.exonsTranslateY_]));

  var trackID = function(track, index) {
    return 'track-' + index;
  };

  // Set up overview tracks.
  var overviews = this.overviewContent_.selectAll('g')
    .data(this.data.tracks);
  overviews.enter().append('g')
    .attr('id', trackID);
  overviews.exit().remove();
  overviews
    .attr('height', this.OVERVIEW_HEIGHT)
    .attr('transform', function(track, index) {
      return Utils.getTransform([0, this.OVERVIEW_HEIGHT * index]);
    }.bind(this));

  // Set up detail tracks.
  var details = this.detailContent_.selectAll('g')
    .data(this.data.tracks);
  details.enter().append('g')
    .attr('id', trackID);
  details.exit().remove();
  details
    .attr('height', this.detailHeight_)
    .attr('transform', function(track, index) {
      return Utils.getTransform([0, this.detailHeight_ * index]);
    }.bind(this));
};

/** @inheritDoc */
BindingRenderer.prototype.render = function() {
  if (!this.dataReady_()) {
    return;
  }
  // Call layout to adjust the binding track positions so as to adapt to
  // multiple binding tracks.
  this.layout();

  this.zoomTransform([this.data.detailXMin, this.data.detailXMax]);

  this.drawOverviews_();
  this.drawDetails_();
  this.drawBed_();
  this.drawExons_();
};

/**
 * Renders the binding overview tracks.
 * @private
 */
BindingRenderer.prototype.drawOverviews_ = function() {
  if (!this.data.options.showOverview) {
    this.overviewContent_.style('display', 'none');
    return;
  }
  this.overviewContent_.style('display', '');

  var xScale = d3.scale.linear()
    .domain([this.data.overviewXMin, this.data.overviewXMax])
    .range([0, this.canvasWidth_]);
  this.data.tracks.forEach(function(track, index) {
    var svg = this.overviewContent_.select('#track-' + index);
    this.drawHistogram_(svg, track.overview, xScale);
  }, this);
  this.drawOverviewRange_();
};

/**
 * Renders the binding detail tracks.
 * @private
 */
BindingRenderer.prototype.drawDetails_ = function() {
  this.data.tracks.forEach(function(track, index) {
    var svg = this.detailContent_.select('#track-' + index);
    // We use overviewScale because histogram zooming is handled by applying
    // the translate and scale of xScaleZoom_ to the SVG group.
    this.drawHistogram_(svg, track.detail, this.xScaleOverview_);
  }, this);
};

/**
 * Renders the binding data as a histogram.
 * @param {!d3.selection} svg SVG group for the overview.
 * @param {!Object} track Track data.
 * @param {!d3.scale} xScale xScale applied for the histogram.
 * @private
 */
BindingRenderer.prototype.drawHistogram_ = function(svg, track, xScale) {
  var bars = svg.selectAll('rect').data(track.values);
  bars.enter().append('rect');
  bars.exit().remove();
  if (!track.values.length) {
    // Avoid rendering empty data.
    return;
  }
  var height = svg.attr('height');
  var yScale = d3.scale.linear()
    .domain([0, this.data.options.autoScale ?
        track.valueMax : track.allValueMax])
    .range([0, height]);

  var barWidth = (xScale(track.xMax) - xScale(track.xMin)) /
      (track.values.length - 1);
  bars
    .attr('transform', function(bar) {
      return Utils.getTransform([xScale(bar.x), height - yScale(bar.value)]);
    }.bind(this))
    .attr('width', function(bar, index) {
      if (index == track.values.length - 1) {
        return 0;
      }
      return xScale(track.values[index + 1].x) - xScale(bar.x);
    })
    .attr('height', function(bar) {
      return yScale(bar.value);
    });

  if (svg.select('.baseline').empty()) {
    svg.append('line')
      .classed('baseline', true);
  }
  svg.select('.baseline')
    .attr('transform', Utils.getTransform([0, height]))
    .attr('x1', 0)
    .attr('x2', this.canvasWidth_);
};

/**
 * Renders the highlighted range in the overview.
 * If the range is explicitly given, then render the given range.
 * @param {Array<number>=} opt_range Range to be drawn, in screen coordinate.
 * @private
 */
BindingRenderer.prototype.drawOverviewRange_ = function(opt_range) {
  var range = opt_range ? opt_range :
      [this.data.detailXMin, this.data.detailXMax];
  var numTracks = this.data.tracks.length;
  var xScale = this.xScaleOverview_;
  this.overviewRange_
    .attr('height', this.OVERVIEW_HEIGHT * numTracks)
    .attr('x', xScale(range[0]))
    .attr('width', xScale(range[1]) - xScale(range[0]));
};

/**
 * Renders the exons below the binding tracks.
 */
BindingRenderer.prototype.drawExons_ = function() {
  if (!this.data.options.showExons) {
    this.exonsContent_.style('display', 'none');
    return;
  }
  this.exonsContent_.style('display', '');

  var exons = [];
  var detailRange = [this.data.detailXMin, this.data.detailXMax];
  this.data.exons.forEach(function(exon) {
    if (Utils.rangeIntersect([exon.txStart, exon.txEnd], detailRange)) {
      exons.push(exon);
    }
  }, this);

  var xScale = this.xScaleZoom_;

  var getLabelRange = function(exon) {
    var mid = xScale((exon.txStart + exon.txEnd) / 2);
    var span = exon.name2.length / 2 * this.EXON_LABEL_SIZE;
    return [mid - span, mid + span];
  }.bind(this);
  exons.sort(function(exon1, exon2) {
    var range1 = getLabelRange(exon1);
    var range2 = getLabelRange(exon2);
    return range1[0] - range2[0] || range1[1] - range2[1];
  });

  var exonCenterY = this.EXON_CENTER_Y;
  var exonHalfY = exonCenterY - this.EXON_SIZE / 4;
  var exonY = exonCenterY - this.EXON_SIZE / 2;

  if (exons.length > this.EXON_ABSTRACT_LIMIT) {
    // Render the exons in abstract shapes.

    // First remove detailed exons.
    this.exonsContent_.selectAll('g.exon').remove();

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
  } else {
    // Render detailed exons.

    // First remove abstract exons.
    this.exonsContent_.selectAll('.abstract').remove();

    var gs = this.exonsContent_.selectAll('g.exon')
      .data(exons, function(exon) {
        return exon.name2;
      });
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
    }, function(exon) {
      return exon.name2;
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
    // Greedily layout the labels so that they are not overlapping.
    // Labels are sorted by their left & right endpoints. We add the label only
    // when it does not overlap with the previous label.
    var labelY = exonY - this.EXON_LABEL_OFFSET;
    var lastLabelRight = -Infinity;
    gs.select('text')
      .attr('y', labelY)
      .attr('x', function(exon) {
        return xScale((exon.txStart + exon.txEnd) / 2);
      })
      .text(function(exon) {
        var range = getLabelRange(exon);
        if (range[0] < lastLabelRight) {
          // Overlap skip.
          return '';
        }
        lastLabelRight = Math.max(lastLabelRight, range[1]);
        return exon.name2;
      }.bind(this));
  }
};

/**
 * Renders the bed tracks.
 * @private
 */
BindingRenderer.prototype.drawBed_ = function() {
  if (!this.data.options.showBed) {
    // this.bedContent_.style('display', 'none');
  }
  // this.bedContent_.style('display', '');
  // TODO(bowen): Check bed visual encoding and implement this.
};

/**
 * Re-computes the detail track height.
 */
BindingRenderer.prototype.updateDetailHeight_ = function() {
  var numTracks = this.data.tracks.length;
  var overviewHeight = this.data.options.showOverview ?
    this.OVERVIEW_HEIGHT * numTracks : 0;
  var exonsHeight = this.data.options.showExons ?
    this.EXON_HEIGHT : 0;
  var totalDetailHeight = this.canvasHeight_ - exonsHeight - overviewHeight;
  this.detailHeight_ = totalDetailHeight / (numTracks ? numTracks : 1);
};

/**
 * Handles resize event.
 */
BindingRenderer.prototype.resize = function() {
  BindingRenderer.base.resize.call(this);
  this.updateZoomHandles_();
  if (!this.dataReady_()) {
    return;
  }

  // Update scales to the new view size.
  this.xScaleOverview_
    .range([0, this.canvasWidth_]);
  this.xScaleZoom_
    .domain([this.data.overviewXMin, this.data.overviewXMax])
    .range([0, this.canvasWidth_]);
  this.zoom_.x(this.xScaleZoom_);

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
  clearTimeout(this.zoomTimer_);

  var translate = d3.event.translate;
  var scale = d3.event.scale;

  // Prevent horizontal panning out of range.
  translate[0] = Math.max(this.canvasWidth_ * (1 - scale), translate[0]);
  translate[0] = Math.min(0, translate[0]);
  // Prevent vertical panning.
  translate[1] = 0;

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;
  this.zoom_.translate(translate);

  var transform = Utils.getTransform(translate, [scale, 1]);
  this.detailContent_.attr('transform', transform);

  // Update the detail range visually immediately so that the user can get a
  // hint of the zoom effect.
  var coordinates = this.screenRangeToBindingCoordinates_();
  this.drawOverviewRange_(coordinates);

  // Send the coordinates to the panel.
  this.signal('coordinates', {
    start: coordinates[0],
    end: coordinates[1]
  });

  this.drawDetails_();
  this.drawExons_()
};

/**
 * Handles mouse zoom end event.
 * @private
 */
BindingRenderer.prototype.zoomEndHandler_ = function() {
  clearTimeout(this.zoomTimer_);
  this.zoomTimer_ = setTimeout(this.zoomDetail_.bind(this), this.ZOOM_INTERVAL);
};

/**
 * Maps a screen range to the data domain binding coordinates.
 * @param {Array<number>=} opt_range Screen range. If not given, the function
 *     uses the full view width [0, width].
 * @return {!Array<number>} The detail range.
 * @private
 */
BindingRenderer.prototype.screenRangeToBindingCoordinates_ = function(opt_range) {
  var range = opt_range ? opt_range : [0, this.canvasWidth_];
  var invert = this.xScaleZoom_.invert;
  return [invert(range[0]), invert(range[1])];
};

/**
 * Fires an event to zoom the histogram details.
 * @param {Array<number>=} opt_range The detail range to zoom into.
 * @private
 */
BindingRenderer.prototype.zoomDetail_ = function(opt_range) {
  var range = opt_range ? opt_range : this.screenRangeToBindingCoordinates_();
  this.signal('zoom', {
    xl: range[0],
    xr: range[1]
  });
};

/**
 * Sets the zoom transform to make the given binding range appear zoomed into.
 * @param {!Array<number>} range The range to zoom into, in binding coordinates.
 */
BindingRenderer.prototype.zoomTransform = function(range) {
  var overviewSpan = this.data.overviewXMax - this.data.overviewXMin;
  var scale = overviewSpan / (range[1] - range[0]);
  var translate = [-this.xScaleOverview_(range[0]) * scale, 0];
  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;
  this.xScaleZoom_.domain(range);
  this.zoom_
    .scale(scale)
    .translate(translate);
  this.detailContent_.attr('transform', Utils.getTransform(translate, [scale, 1]));
};

/**
 * Checks whether the data has been loaded.
 * @private
 */
BindingRenderer.prototype.dataReady_ = function() {
  return this.data.tracks.length;
};

/**
 * @fileoverview Renderer of the NetworkView.
 */

'use strict';

/**
 * BindingRenderer renders the visualizations for the BindingView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewRenderer}
 * @constructor
 */
genotet.BindingRenderer = function(container, data) {
  genotet.BindingRenderer.base.constructor.call(this, container, data);

  /**
   * Height of a single detail binding track. This is re-computed upon
   * resize event.
   * @private {number}
   */
  this.detailHeight_ = 0;

  /**
   * Height of a single bed track. This is re-computed upon
   * resize event.
   * @private {number}
   */
  this.bedHeight_ = 0;

  /**
   * Height of a single bed rect. This is re-computed upon resize event.
   * @private {number}
   */
  this.bedRectHeight_ = 0;

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
   * Vertical translate value of the bed SVG group.
   * @private {number}
   */
  this.bedTranslateY_;
  /**
   * Vertical translate value of the exons SVG group.
   * @private {number}
   */
  this.exonsTranslateY_;

  /**
   * Positions for the bed rects.
   * @private {!Array<!Array<number>>}
   */
  this.bedPositions_ = [];

  /**
   * Timer handle for the zoom interval.
   * @private {number}
   */
  this.zoomTimer_;

  /**
   * Margins of the bed binding track.
   * @private @const {!Object<number>}
   */
  this.BED_MARGINS_ = {
    TOP: 5,
    BOTTOM: 5
  };
};

genotet.utils.inherit(genotet.BindingRenderer, genotet.ViewRenderer);

/** @const {number} */
genotet.BindingRenderer.prototype.EXON_HEIGHT = 35;
/** @const {number} */
genotet.BindingRenderer.prototype.EXON_SIZE = 10;
/** @const {number} */
genotet.BindingRenderer.prototype.EXON_CENTER_Y = 20;
/** @const {number} */
genotet.BindingRenderer.prototype.EXON_LABEL_OFFSET = 3;
/** @const {number} */
genotet.BindingRenderer.prototype.OVERVIEW_HEIGHT = 25;

/**
 * When there are more than this limit number of exons, we draw exons as
 * abstract rectangles.
 * @type {number}
 */
genotet.BindingRenderer.prototype.EXON_ABSTRACT_LIMIT = 200;

/** @const {number} */
genotet.BindingRenderer.prototype.STRAND_HORIZONTAL_SIZE = 5;
/** @const {number} */
genotet.BindingRenderer.prototype.STRAND_VERTICAL_SIZE = 3;
/** @const {number} */
genotet.BindingRenderer.prototype.EXON_LABEL_SIZE = 6;
/** @const {number} */
genotet.BindingRenderer.prototype.BED_LABEL_SIZE = 13;
/** @const {number} */
genotet.BindingRenderer.prototype.BED_MIN_WIDTH = 3;

/** @const {!Array<number>} */
genotet.BindingRenderer.ZOOM_EXTENT = [1, 65536];
/** @const {number} */
genotet.BindingRenderer.ZOOM_INTERVAL = 500;

/**
 * Initializes the BindingRenderer properties.
 */
genotet.BindingRenderer.prototype.init = function() {
  genotet.BindingRenderer.base.init.call(this);

  // Set up the detailed histogram zoom.
  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(genotet.BindingRenderer.ZOOM_EXTENT)
    .on('zoom', this.zoomHandler_.bind(this))
    .on('zoomend', this.zoomEndHandler_.bind(this));
  this.detailHandle_.call(this.zoom_);
  this.bedHandle_.call(this.zoom_);
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
genotet.BindingRenderer.prototype.getBindingRanges_ = function() {
  if (this.data.overviewRangeChanged) {
    this.xScaleZoom_
      .domain([this.data.overviewXMin, this.data.overviewXMax])
      .range([0, this.canvasWidth]);
    this.zoom_.x(this.xScaleZoom_);
    this.zoomTranslate_ = [0, 0];
    this.zoomScale_ = 1;

    this.xScaleOverview_
      .domain([this.data.overviewXMin, this.data.overviewXMax])
      .range([0, this.canvasWidth]);

    this.detailContent_.attr('transform', '');
  }
};

/**
 * Arranges the binding data bed rect positions.
 * @private
 */
genotet.BindingRenderer.prototype.arrangeBedRectPositions_ = function() {
  var lineCount = 0;
  var rightCoordinates = [];
  var minRight = Infinity;
  this.bedPositions_ = [];
  var bedData = this.data.bed.motifs;
  bedData.forEach(function(data) {
    if (this.bedPositions_.length == 0 || minRight >= data.chrStart) {
      var newLine = [data];
      this.bedPositions_.push(newLine);
      rightCoordinates.push(data.chrEnd);
      minRight = Math.min(minRight, data.chrEnd);
      lineCount++;
    } else {
      var i = lineCount;
      while (i > 0) {
        if (rightCoordinates[i - 1] < data.chrStart) {
          this.bedPositions_[i - 1].push(data);
          rightCoordinates[i - 1] = data.chrEnd;
          minRight = Math.min.apply(null, rightCoordinates);
          break;
        }
        i--;
      }
    }
  }, this);
};

/** @inheritDoc */
genotet.BindingRenderer.prototype.dataLoaded = function() {
  this.getBindingRanges_();
  this.arrangeBedRectPositions_();
  this.render();

  // Initialize coordinates in the panel.
  // Send the coordinates to the panel.
  this.signal('coordinates', {
    start: this.data.detailXMin,
    end: this.data.detailXMax
  });
};

/** @inheritDoc */
genotet.BindingRenderer.prototype.initLayout = function() {
  // Create groups for the overviews, binding tracks, and exons.
  /**
   * SVG group for the binding overviews.
   * @private {!d3}
   */
  this.svgOverview_ = this.canvas.append('g')
    .classed('overviews', true);
  /**
   * SVG group for the detailed binding tracks.
   * @private {!d3}
   */
  this.svgDetail_ = this.canvas.append('g')
    .classed('details', true);
  /**
   * SVG group for the bed tracks.
   * @private {!d3}
   */
  this.svgBed_ = this.canvas.append('g')
    .classed('bed', true);
  /**
   * SVG group for the binding overviews.
   * @private {!d3}
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
   * @private {!d3}
   */
  this.detailContent_ = this.svgDetail_.append('g')
    .classed('content', true);
  /**
   * SVG group for the bed tracks content.
   * @private {!d3}
   */
  this.bedContent_ = this.svgBed_.append('g')
    .classed('content', true);
  /**
   * SVG group for the exons content.
   * @private {!d3}
   */
  this.exonsContent_ = this.svgExons_.append('g')
    .classed('content', true);

  /**
   * SVG rect for overview range.
   * @private {!d3}
   */
  this.overviewRange_ = this.overviewContent_.append('rect')
    .classed('range', true);

  // Add invisible handles for zooming. Handles shall be created after
  // the contents so that the handles appear on top of the rendered
  // elements.
  /**
   * Handle for the overview group.
   * @private {!d3}
   */
  this.overviewHandle_ = this.svgOverview_.append('rect')
    .classed('zoom-handle', true);
  /**
   * Handle for the detail group.
   * @private {!d3}
   */
  this.detailHandle_ = this.svgDetail_.append('rect')
    .classed('zoom-handle', true);
  /**
   * Handle for the bed group.
   * @private {!d3}
   */
  this.bedHandle_ = this.svgBed_.append('rect')
    .classed('zoom-handle', true);
  /**
   * Handle for the exons group.
   * @private {!d3}
   */
  this.exonsHandle_ = this.svgExons_.append('rect')
    .classed('zoom-handle', true);
};

/**
 * Arranges the binding tracks so that they are stacked vertically.
 * This function also layouts the exon group.
 */
genotet.BindingRenderer.prototype.layout = function() {
  // Must update first, as data may have been reloaded.
  this.updateDetailHeight_();
  // Update zoom handle sizes based on track height.
  this.updateZoomHandles_();

  var numTracks = this.data.tracks.length;

  // Compute translate values.
  this.detailTranslateY_ = this.data.options.showOverview ?
    numTracks * this.OVERVIEW_HEIGHT : 0;
  this.exonsTranslateY_ = this.canvasHeight - this.EXON_HEIGHT;
  this.bedTranslateY_ = this.data.options.showOverview ?
    this.OVERVIEW_HEIGHT + this.detailHeight_ : this.detailHeight_;

  // Translate SVG groups to place.
  this.svgDetail_.attr('transform',
    genotet.utils.getTransform([0, this.detailTranslateY_]));
  this.svgBed_.attr('transform',
    genotet.utils.getTransform([0, this.bedTranslateY_]));
  this.svgExons_.attr('transform',
    genotet.utils.getTransform([0, this.exonsTranslateY_]));

  this.bedContent_.attr('transform',
    genotet.utils.getTransform([0, this.BED_MARGINS_.TOP]));

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
      return genotet.utils.getTransform([0, this.OVERVIEW_HEIGHT * index]);
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
      return genotet.utils.getTransform([0, this.detailHeight_ * index]);
    }.bind(this));
};

/** @inheritDoc */
genotet.BindingRenderer.prototype.render = function() {
  if (!this.dataReady()) {
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
genotet.BindingRenderer.prototype.drawOverviews_ = function() {
  if (!this.data.options.showOverview) {
    this.overviewContent_.style('display', 'none');
    return;
  }
  this.overviewContent_.style('display', '');

  var xScale = d3.scale.linear()
    .domain([this.data.overviewXMin, this.data.overviewXMax])
    .range([0, this.canvasWidth]);
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
genotet.BindingRenderer.prototype.drawDetails_ = function() {
  this.data.tracks.forEach(function(track, index) {
    var svg = this.detailContent_.select('#track-' + index);
    // We use overviewScale because histogram zooming is handled by applying
    // the translate and scale of xScaleZoom_ to the SVG group.
    this.drawHistogram_(svg, track.detail, this.xScaleOverview_);
  }, this);
};

/**
 * Renders the binding data as a histogram.
 * @param {!d3} svg SVG group for the overview.
 * @param {!Object} track Track data.
 * @param {!d3.scale} xScale xScale applied for the histogram.
 * @private
 */
genotet.BindingRenderer.prototype.drawHistogram_ = function(svg, track,
                                                            xScale) {
  if (!track.values.length) {
    // Avoid rendering empty data.
    svg.select('.histogram').remove();
    return;
  }
  var height = svg.attr('height');
  var yScale = d3.scale.linear()
    .domain([0, this.data.options.autoScale ?
        track.valueMax : track.allValueMax])
    .range([0, height]);

  var barWidth = (xScale(track.xMax) - xScale(track.xMin)) /
      (track.values.length - 1);

  var histogram = svg.select('.histogram');
  if (histogram.empty()) {
    histogram = svg.append('path')
      .classed('histogram', true);
  }
  var line = d3.svg.line().interpolate('linear-closed');
  var lastX = 0;
  var points = track.values.map(function(bar) {
    lastX = xScale(bar.x);
    return [lastX, height - yScale(bar.value)];
  });
  points.push([lastX, height]);
  points.push([xScale(track.values[0].x), height]);

  histogram.attr('d', line(points));

  if (svg.select('.baseline').empty()) {
    svg.append('line')
      .classed('baseline', true);
  }
  svg.select('.baseline')
    .attr('transform', genotet.utils.getTransform([0, height]))
    .attr('x1', 0)
    .attr('x2', this.canvasWidth);
};

/**
 * Renders the highlighted range in the overview.
 * If the range is explicitly given, then render the given range.
 * @param {Array<number>=} opt_range Range to be drawn, in screen coordinate.
 * @private
 */
genotet.BindingRenderer.prototype.drawOverviewRange_ = function(opt_range) {
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
 * @private
 */
genotet.BindingRenderer.prototype.drawExons_ = function() {
  if (!this.data.options.showExons) {
    this.exonsContent_.style('display', 'none');
    return;
  }
  this.exonsContent_.style('display', '');

  var exons = [];
  var detailRange = [this.data.detailXMin, this.data.detailXMax];
  this.data.exons.forEach(function(exon) {
    if (genotet.utils.rangeIntersect([exon.txStart, exon.txEnd], detailRange)) {
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
genotet.BindingRenderer.prototype.drawBed_ = function() {
  if (!this.data.options.showBed) {
    this.bedContent_.style('display', 'none');
  } else {
    this.bedContent_.style('display', 'inline');
  }
  var bedData = this.bedPositions_;
  this.bedRectHeight_ = (this.bedHeight_ - this.BED_MARGINS_.TOP -
    this.BED_MARGINS_.BOTTOM) / bedData.length;
  var unitHeight = this.bedRectHeight_;
  if (!this.data.bed.aggregated && this.data.options.showBedLabels) {
    this.bedRectHeight_ -= this.BED_LABEL_SIZE;
  }
  var opt_range = [];
  var bedRows = this.bedContent_.selectAll('g').data(bedData);
  bedRows.enter().append('g');
  bedRows.exit().remove();
  var bedRects = bedRows.selectAll('rect').data(_.identity);
  bedRects.enter().append('rect');
  bedRects
    .attr('width', function(data) {
      var range = [data.chrStart, data.chrEnd];
      opt_range = this.bindingCoordinatesToScreenRange_(range);
      var rectWidth = opt_range[1] - opt_range[0];
      return rectWidth < this.BED_MIN_WIDTH ? this.BED_MIN_WIDTH :
        rectWidth;
    }.bind(this))
    .attr('height', this.bedRectHeight_ > 0 ? this.bedRectHeight_ : 0)
    .attr('x', function(data) {
      var range = [data.chrStart, data.chrEnd];
      opt_range = this.bindingCoordinatesToScreenRange_(range);
      return opt_range[0];
    }.bind(this))
    .attr('y', function(data, i, j) {
      return j * unitHeight;
    }.bind(this));
  bedRects.exit().remove();

  if (!this.data.bed.aggregated && this.data.options.showBedLabels) {
    this.bedContent_.selectAll('text').style('display', 'inline');
    var labels = bedRows.selectAll('text').data(_.identity);
    labels.enter().append('text');
    labels
      .text(function(data) {
        return data.label;
      })
      .attr('x', function(data) {
        var range = [data.chrStart, data.chrEnd];
        opt_range = this.bindingCoordinatesToScreenRange_(range);
        return opt_range[0];
      }.bind(this))
      .attr('y', function(data, i, j) {
        return j * unitHeight + this.bedRectHeight_ + this.BED_LABEL_SIZE / 2;
      }.bind(this))
      .attr('transform',
        genotet.utils.getTransform([0, this.BED_MARGINS_.TOP]));
    labels.exit().remove();
  } else {
    this.bedContent_.selectAll('text').remove();
  }
};

/**
 * Re-computes the detail track height.
 * @private
 */
genotet.BindingRenderer.prototype.updateDetailHeight_ = function() {
  var numTracks = this.data.tracks.length;
  var overviewHeight = this.data.options.showOverview ?
    this.OVERVIEW_HEIGHT * numTracks : 0;
  var exonsHeight = this.data.options.showExons ?
    this.EXON_HEIGHT : 0;
  this.bedHeight_ = this.data.options.showBed ?
    (this.canvasHeight - exonsHeight - overviewHeight) / 2 : 0;
  var totalDetailHeight = this.canvasHeight - this.bedHeight_ - exonsHeight -
    overviewHeight;
  this.detailHeight_ = totalDetailHeight / (numTracks ? numTracks : 1);
};

/**
 * Handles resize event.
 */
genotet.BindingRenderer.prototype.resize = function() {
  genotet.BindingRenderer.base.resize.call(this);
  this.updateZoomHandles_();
  if (!this.dataReady()) {
    return;
  }

  // Update scales to the new view size.
  this.xScaleOverview_
    .range([0, this.canvasWidth]);
  this.xScaleZoom_
    .domain([this.data.overviewXMin, this.data.overviewXMax])
    .range([0, this.canvasWidth]);
  this.zoom_.x(this.xScaleZoom_);

  this.render();
};

/**
 * Updates background sizes.
 * @private
 */
genotet.BindingRenderer.prototype.updateZoomHandles_ = function() {
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
genotet.BindingRenderer.prototype.zoomHandler_ = function() {
  clearTimeout(this.zoomTimer_);

  var translate = d3.event.translate;
  var scale = d3.event.scale;

  // Prevent horizontal panning out of range.
  translate[0] = Math.max(this.canvasWidth * (1 - scale), translate[0]);
  translate[0] = Math.min(0, translate[0]);
  // Prevent vertical panning.
  translate[1] = 0;

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;
  this.zoom_.translate(translate);

  var transform = genotet.utils.getTransform(translate, [scale, 1]);
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
  this.drawBed_();
  this.drawExons_();
};

/**
 * Handles mouse zoom end event.
 * @private
 */
genotet.BindingRenderer.prototype.zoomEndHandler_ = function() {
  clearTimeout(this.zoomTimer_);
  this.zoomTimer_ = setTimeout(this.zoomDetail_.bind(this),
    genotet.BindingRenderer.ZOOM_INTERVAL);
};

/**
 * Maps a screen range to the data domain binding coordinates.
 * @param {Array<number>=} opt_range Screen range. If not given, the function
 *     uses the full view width [0, width].
 * @return {!Array<number>} The detail range.
 * @private
 */
genotet.BindingRenderer.prototype.screenRangeToBindingCoordinates_ = function(
  opt_range) {
  var range = opt_range ? opt_range : [0, this.canvasWidth];
  var invert = this.xScaleZoom_.invert;
  return [invert(range[0]), invert(range[1])];
};

/**
 * Maps a data domain binding coordinates to the screen range.
 * @param {Array<number>=} range The detail range. If not given, the function
 *     uses the full view width [this.data.detailXMin, this.data.detailXMax].
 * @return {!Array<number>} The screen range.
 * @private
 */
genotet.BindingRenderer.prototype.bindingCoordinatesToScreenRange_ = function(
  range) {
  var opt_range = range ? range : [this.data.detailXMin, this.data.detailXMax];
  var invert = this.xScaleZoom_;
  return [invert(opt_range[0]), invert(opt_range[1])];
};

/**
 * Fires an event to zoom the histogram details.
 * @param {Array<number>=} opt_range The detail range to zoom into.
 * @private
 */
genotet.BindingRenderer.prototype.zoomDetail_ = function(opt_range) {
  var range = opt_range ? opt_range : this.screenRangeToBindingCoordinates_();
  this.signal('zoom', {
    bedName: this.data.bedName,
    chr: this.data.chr,
    xl: range[0],
    xr: range[1]
  });
};

/**
 * Sets the zoom transform to make the given binding range appear zoomed into.
 * @param {!Array<number>} range The range to zoom into, in binding coordinates.
 */
genotet.BindingRenderer.prototype.zoomTransform = function(range) {
  var overviewSpan = this.data.overviewXMax - this.data.overviewXMin;
  var scale = overviewSpan / (range[1] - range[0]);
  var translate = [-this.xScaleOverview_(range[0]) * scale, 0];
  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;
  this.xScaleZoom_.domain(range);
  this.zoom_
    .scale(scale)
    .translate(translate);
  this.detailContent_.attr('transform', genotet.utils.getTransform(translate,
    [scale, 1]));
};

/** @inheritDoc */
genotet.BindingRenderer.prototype.dataReady = function() {
  return this.data.tracks.length > 0;
};

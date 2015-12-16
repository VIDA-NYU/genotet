/**
 * @fileoverview Renderer of the ExpressionView.
 */

'use strict';

/**
 * ExpressionRenderer renders the visualizations for the ExpressionView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {ViewRenderer}
 * @constructor
 */
genotet.ExpressionRenderer = function(container, data) {
  this.base.constructor.call(this, container, data);

  /**
   * Gene profile data. Each element corresponds to one gene profile line.
   * @protected {!Array<!{
   *   container_: d3.selection,
   *   geneName: string,
   *   row: number,
   *   color: string
   * }>}
   */
  this.data.profiles;

  /**
   * Cell object storing the rendering properties of expression cell.
   * @private {!Object}
   */
  this.cell_ = {
    container_: null,
    geneName: null,
    conditionName: null,
    row: 0,
    column: 0,
    value: 0,
    colorscaleValue: null
  };

  /**
   * Profile object storing the rendering properties of expression cell.
   * @private {!Object}
   */
  this.profile_ = {
    container_: null,
    geneName: null,
    row: 0,
    hoverColumn: 0,
    hoverConditionName: null,
    hoverValue: 0,
    color: null,
    clicked: false
  };

  /**
   * The maximum width of the horizontal gene labels.
   * This value will be zero when gene labels are not shown.
   * @private {number}
   */
  this.geneLabelWidth_ = 0;

  /**
   * The factor of the maximum width of the horizontal gene labels.
   * @private {number}
   */
  this.GENE_LABEL_WIDTH_FACTOR_ = 8.725;

  /**
   * The maximum height of the vertical experiment condition labels.
   * This value will be zero when condition labels are not shown.
   * @private {number}
   */
  this.conditionLabelHeight_ = 0;

  /**
   * The factor of the maximum height of the vertical experiment condition
   * labels.
   * @private {number}
   */
  this.CONDITION_LABEL_HEIGHT_FACTOR_ = 6.501175;

  /**
   * The margin between the labels and the heatmap.
   * @private {number}
   */
  this.LABEL_MARGIN_ = 10;

  /**
   * The difference between the labels and the heatmap.
   * @private {number}
   */
  this.LABEL_DIFFERENCE_ = 10;

  /**
   * The height of the label text.
   * @private {number}
   */
  this.TEXT_HEIGHT_ = 14.5;

  /**
   * The size of the gene profile color category.
   * @private {number}
   */
  this.COLOR_CATEGORY_SIZE_ = 60;

  /**
   * The default gene profile color category.
   * @private {array}
   */
  this.COLOR_CATEGORY_ = d3.scale.category20()
    .range()
    .concat(d3.scale.category20b().range())
    .concat(d3.scale.category20c().range());

  /**
   * Margins of the gene profile plot.
   * @private {!Object}
   */
  this.PROFILE_MARGINS_ = {
    TOP: 10,
    RIGHT: 0,
    BOTTOM: 10,
    LEFT: 40
  };

  /**
   * Margins of the heatmap gradient.
   * @private {!Object}
   */
  this.HEATMAP_GRADIENT_MARGINS_ = {
    TOP: 5,
    RIGHT: 40,
    BOTTOM: 5,
    LEFT: 40
  };

  /**
   * Height of the gene profile plot.
   * This value will be zero when profiles are not shown.
   * @private {number}
   */
  this.profileHeight_ = this.DEFAULT_PROFILE_HEIGHT;

  /**
   * Width of the heatmap.
   * @private {number}
   */
    this.heatmapWidth_ = 0;
  /**
   * Height of the heatmap.
   * @private {number}
   */
  this.heatmapHeight_ = 0;

  /**
   * Margin of the gene profile.
   * @private {number}
   */
  this.geneProfileMargin_ = 0;
};

genotet.utils.inherit(genotet.ExpressionRenderer, genotet.ViewRenderer);

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_HEIGHT = 150;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_HEIGHT = 25;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_MARGIN = 10;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_MARGIN = 40;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_HEATMAP_GRADIENT_HEIGHT = 30;

/*
 // gene profile properties
 this.legendHeight = 20;
 this.legendMarginDown = 5;
 this.legendMarginLeft = 10;
 this.legendMarginTop = 10;
 this.legendBoxSize = 10;
 this.legendFontSize = 7;
 this.legendBoxTextGap = 5;

 // heatmap properties
 this.heatmapMargin = 3;
 this.heatmapFontSize = 8.5;
 this.heatmapFontHSize = 8.5;
 */


/** @inheritDoc */
genotet.ExpressionRenderer.prototype.init = function() {
  this.base.init.call(this);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.initLayout = function() {
  /**
   * SVG group for profile plot (line charts).
   * @private {!d3.selection}
   */
  this.svgProfile_ = this.canvas.append('g')
    .classed('profiles', true)
    .classed('height', this.DEFAULT_PROFILE_HEIGHT);

  /**
   * SVG group for the heatmap plot.
   * @private {!d3.selection}
   */
  this.svgHeatmap_ = this.canvas.append('g')
    .classed('heatmap', true);

  /**
   * SVG group for the heatmap itself.
   * @private {!d3.selection}
   */
  this.svgHeatmapContent_ = this.svgHeatmap_.append('g')
    .classed('content', true);

  /**
   * SVG group for the heatmap gene (row) labels.
   * @private {!d3.selection}
   */
  this.svgGeneLabels_ = this.svgHeatmap_.append('g')
    .classed('gene-labels', true);

  /**
   * SVG group for the heatmap condition (column) labels.
   * @private {!d3.selection}
   */
  this.svgConditionLabels_ = this.svgHeatmap_.append('g')
    .classed('condition-labels', true);

  /**
   * SVG group for the heatmap gradient.
   * @private {!d3.selection}
   */
  this.svgHeatmapGradient_ = this.svgHeatmap_.append('g')
    .classed('heatmap-gradient', true);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.layout = function() {
  // Gets the label sizes so as to set the offset of heatmap SVG.
  this.getHeatmapLabelSizes_();
  // Compute the shifting sizes.
  this.profileHeight_ = this.data.options.showProfiles ?
    this.DEFAULT_PROFILE_HEIGHT : 0;

  this.svgHeatmap_
    .attr('transform', genotet.utils.getTransform([0, 0]));

  this.heatmapWidth_ = this.canvasWidth_;
  if (this.data.options.showGeneLabels) {
    this.heatmapWidth_ -= this.LABEL_MARGIN_ + this.geneLabelWidth_;
  }
  else if (this.data.options.showProfiles) {
    this.heatmapWidth_ -= this.DEFAULT_PROFILE_MARGIN;
  }
  this.heatmapHeight_ = this.canvasHeight_ -
    this.profileHeight_ - this.DEFAULT_HEATMAP_GRADIENT_HEIGHT;
  if (this.data.options.showConditionLabels) {
    this.heatmapHeight_ -= this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }

  this.svgHeatmapContent_
    .attr('transform', genotet.utils.getTransform([
      this.geneLabelWidth_,
      0
    ]));
  this.svgConditionLabels_
    .attr('transform', genotet.utils.getTransform([
      this.geneLabelWidth_,
      0
    ]));
  this.svgHeatmapGradient_
    .attr('transform', genotet.utils.getTransform([0, 0]));
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataLoaded = function() {
  this.render();
};

/**
 * Checks whether the data is ready.
 * @return {boolean}
 * @private
 */
genotet.ExpressionRenderer.prototype.dataReady_ = function() {
  return this.data.matrix;
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.render = function() {
  if (!this.dataReady_()) {
    return;
  }
  // First layout out the SVG groups based on the current visibility
  // of heatmap and gene profiles.
  this.layout();

  this.drawExpressionMatrix_();
  this.drawGeneProfiles_();
};

/**
 * Renders the expression matrix onto the scene.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawExpressionMatrix_ = function() {
  this.drawMatrixCells_();
  this.drawMatrixGeneLabels_();
  this.drawMatrixConditionLabels_();
  this.drawHeatmapGradient_();
};

/**
 * Renders the expression matrix cells.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixCells_ = function() {
  var heatmapData = this.data.matrix;
  var cellWidth = this.heatmapWidth_ / heatmapData.conditionNames.length;
  var cellHeight = this.heatmapHeight_ / heatmapData.geneNames.length;
  var colorScale = d3.scale.linear();
  if (this.data.options.autoScaleGradient) {
    colorScale
      .domain([
        heatmapData.valueMin,
        (heatmapData.valueMin + heatmapData.valueMax) / 2,
        heatmapData.valueMax
      ])
      .range(genotet.data.redYellowScale);
  }
  else {
    colorScale
      .domain([
        heatmapData.allValueMin,
        (heatmapData.allValueMin + heatmapData.allValueMax) / 2,
        heatmapData.allValueMax
      ])
      .range(genotet.data.redYellowScale);
  }
  var transformLeft = 0;
  var transformTop = this.profileHeight_;
  if (this.data.options.showGeneLabels) {
    transformLeft += this.LABEL_MARGIN_;
  }
  else if (this.data.options.showProfiles) {
    transformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  if (this.data.options.showConditionLabels) {
    transformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }

  if (this.data.clickedCell) {
    this.data.clickedCell.row = heatmapData.geneNames.indexOf(
      this.data.clickedCell.geneName
    );
    this.data.clickedCell.column = heatmapData.conditionNames.indexOf(
      this.data.clickedCell.conditionName
    );
    if (
      this.data.clickedCell.row == -1 || this.data.clickedCell.column == -1
    ) {
      this.unhighlightLabelsForClickedCell_();
      this.signal('cellUnclick');
    }
    else if (
      this.data.clickedCell.row != -1 && this.data.clickedCell.column != -1
    ) {
      this.highlightLabelsForClickedCell_(this.data.clickedCell);
    }
  }

  var heatmapRows = this.svgHeatmapContent_.selectAll('g')
    .data(heatmapData.values);
  heatmapRows.enter().append('g');
  heatmapRows.attr('transform',
    genotet.utils.getTransform([transformLeft, transformTop]));
  heatmapRows.exit().remove();
  var heatmapRects = heatmapRows.selectAll('rect').data(_.identity);
  heatmapRects.enter().append('rect');
  heatmapRects
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('x', function(value, i) {
      return i * cellWidth;
    })
    .attr('y', function(value, i, j) {
      return j * cellHeight;
    })
    .style('stroke', colorScale)
    .style('fill', colorScale)
    .on('mouseover', function(value, i, j) {
      var hoverCell = d3.event.target;
      var cell = this.cell_ = {
        container_: hoverCell,
        geneName: heatmapData.geneNames[j],
        conditionName: heatmapData.conditionNames[i],
        row: j,
        column: i,
        value: value
      };
      this.signal('cellHover', cell);
    }.bind(this))
    .on('mouseout', function(value) {
      var hoverCell = d3.event.target;
      var cell = this.cell_ = {
        container_: hoverCell,
        colorscaleValue: colorScale(value)
      };
      this.signal('cellUnhover', cell);
    }.bind(this))
    .on('click', function(value, i, j) {
      var hoverCell = d3.event.target;
      this.data.clickedCell = this.cell_ = {
        container_: hoverCell,
        geneName: heatmapData.geneNames[j],
        conditionName: heatmapData.conditionNames[i],
        row: j,
        column: i,
        value: value
      };
      this.signal('cellClick', this.data.clickedCell);
    }.bind(this));
  heatmapRects.exit().remove();
};

/**
 * Renders the expression matrix gene (row) labels.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixGeneLabels_ = function() {
  if (!this.data.options.showGeneLabels) {
    this.svgGeneLabels_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgGeneLabels_.selectAll('*').attr('display', 'inline');
  }
  var heatmapData = this.data.matrix;
  var geneLabelsData = heatmapData.geneNames;
  var cellHeight = this.heatmapHeight_ / geneLabelsData.length;
  var transformTop = this.profileHeight_ + this.TEXT_HEIGHT_ / 3 +
    cellHeight / 2;
  if (this.data.options.showConditionLabels) {
    transformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }

  var labels = this.svgGeneLabels_.selectAll('text').data(geneLabelsData);
  labels.enter().append('text')
    .classed('gene-label', true);
  labels.exit().remove();
  labels
    .attr('transform', genotet.utils.getTransform([
      this.geneLabelWidth_,
      transformTop
    ]))
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(geneName, i) {
      return i * cellHeight;
    });
};

/**
 * Renders the expression matrix condition (column) labels.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixConditionLabels_ = function() {
  if (!this.data.options.showConditionLabels) {
    this.svgConditionLabels_.selectAll('*').attr('display', 'none');
    return;
  }
  else {
    this.svgConditionLabels_.selectAll('*').attr('display', 'inline');
  }
  var heatmapData = this.data.matrix;
  var conditionLabelsData = heatmapData.conditionNames;
  var cellWidth = this.heatmapWidth_ / conditionLabelsData.length;
  var transformLeft = this.TEXT_HEIGHT_ / 3 + cellWidth / 2;
  if (this.data.options.showGeneLabels) {
    transformLeft += this.LABEL_MARGIN_;
  }
  else if (this.data.options.showProfiles) {
    transformLeft += this.DEFAULT_PROFILE_MARGIN;
  }

  var labels = this.svgConditionLabels_.selectAll('text')
    .data(conditionLabelsData);
  labels.enter().append('text')
    .classed('condition-label', true);
  labels.exit().remove();
  labels
    .attr('transform', genotet.utils.getTransform([
      transformLeft,
      this.conditionLabelHeight_ + this.profileHeight_ + this.LABEL_MARGIN_
    ], 1, -90))
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(conditionName, i) {
      return i * cellWidth;
    });
};

/**
 * Renders the expression heatmap gradient.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawHeatmapGradient_ = function() {
  this.svgHeatmapGradient_.selectAll('*').remove();
  var heatmapData = this.data.matrix;
  var scaleMin = 0;
  var scaleMax = 0;
  if (this.data.options.autoScaleGradient) {
    scaleMin = heatmapData.valueMin;
    scaleMax = heatmapData.valueMax;
  }
  else {
    scaleMin = heatmapData.allValueMin;
    scaleMax = heatmapData.allValueMax;
  }
  scaleMin = scaleMin.toFixed(2);
  scaleMax = scaleMax.toFixed(2);
  var marginLeft = scaleMin.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR_;
  var marginRight = scaleMax.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR_;

  var transformLeft = 0;
  var transformTop = this.heatmapHeight_;
  if (this.data.options.showProfiles) {
    transformTop += this.profileHeight_;
  }
  if (this.data.options.showGeneLabels) {
    transformLeft += this.geneLabelWidth_ + this.LABEL_MARGIN_;
  }
  else if (this.data.options.showProfiles) {
    transformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  if (this.data.options.showConditionLabels) {
    transformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }
  this.svgHeatmapGradient_
    .attr(
      'transform',
      genotet.utils.getTransform([transformLeft, transformTop])
    );
  var gradientHeight = this.DEFAULT_HEATMAP_GRADIENT_HEIGHT -
    this.HEATMAP_GRADIENT_MARGINS_.TOP -
    this.HEATMAP_GRADIENT_MARGINS_.BOTTOM;
  var gradientWidth = this.heatmapWidth_ - marginLeft - marginRight;
  var gradientContent = this.svgHeatmapGradient_.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-content')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')
    .attr('spreadMethod', 'pad');
  gradientContent.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', genotet.data.redYellowScale[0])
    .attr('stop-opacity', 1);
  gradientContent.append('stop')
    .attr('offset', '50%')
    .attr('stop-color', genotet.data.redYellowScale[1])
    .attr('stop-opacity', 1);
  gradientContent.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', genotet.data.redYellowScale[2])
    .attr('stop-opacity', 1);
  this.svgHeatmapGradient_.append('rect')
    .classed('gradient-rect', true)
    .attr('transform', genotet.utils.getTransform([
      marginLeft,
      this.HEATMAP_GRADIENT_MARGINS_.TOP
      ]))
    .attr('width', gradientWidth)
    .attr('height', gradientHeight)
    .style('fill', 'url(#gradient-content)');
  this.svgHeatmapGradient_.append('text')
    .attr('x', marginLeft - 1)
    .attr('y',
      this.HEATMAP_GRADIENT_MARGINS_.TOP +
      gradientHeight / 2 + this.TEXT_HEIGHT_ / 3)
    .text(scaleMin)
    .style('text-anchor', 'end');
  this.svgHeatmapGradient_.append('text')
    .attr('x', marginLeft + gradientWidth + 1)
    .attr(
      'y',
      this.HEATMAP_GRADIENT_MARGINS_.TOP +
      gradientHeight / 2 + this.TEXT_HEIGHT_ / 3)
    .text(scaleMax);
};

/**
 * Renders the expression profiles for the selected genes as line charts.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawGeneProfiles_ = function() {
  if (!this.data.options.showProfiles) {
    this.svgProfile_.selectAll('*').attr('display', 'none');
    return;
  }
  else {
    if (!this.data.options.showGeneLabels) {
      this.PROFILE_MARGINS_.LEFT = this.DEFAULT_PROFILE_MARGIN;
    }
    else {
      this.PROFILE_MARGINS_.LEFT = this.geneLabelWidth_ + this.LABEL_MARGIN_;
    }
    this.svgProfile_.selectAll('*').attr('display', 'inline');
  }

  var heatmapData = this.data.matrix;
  this.svgProfile_.selectAll('g').remove();
  this.svgProfile_.attr('width', this.canvasWidth_);

  var legend = this.svgProfile_.append('g')
    .classed('legend', true)
    .attr('transform', genotet.utils.getTransform([
      this.PROFILE_MARGINS_.LEFT,
      this.DEFAULT_PROFILE_LEGEND_MARGIN]));
  var legendHeight = this.DEFAULT_PROFILE_LEGEND_HEIGHT -
    this.DEFAULT_PROFILE_LEGEND_MARGIN;

  var i = 0;
  var profileCount = this.data.profiles.length;
  while (i < profileCount) {
    var geneIndex = heatmapData.geneNames
      .indexOf(this.data.profiles[i].geneName);
    if (geneIndex == -1) {
      this.data.profiles.splice(i, 1);
      profileCount--;
    }
    else {
      this.data.profiles[i].row = geneIndex;
      i++;
    }
  }

  var xScale = d3.scale.linear().range([
    this.PROFILE_MARGINS_.LEFT,
    this.canvasWidth_ - this.PROFILE_MARGINS_.RIGHT
  ]).domain([0, heatmapData.conditionNames.length]);
  var yScaleTop = this.PROFILE_MARGINS_.TOP +
    this.DEFAULT_PROFILE_LEGEND_HEIGHT;
  if (this.data.profiles.length == 0) {
    yScaleTop -= this.DEFAULT_PROFILE_LEGEND_HEIGHT;
  }
  var yScale = d3.scale.linear().range([
    this.profileHeight_ - this.PROFILE_MARGINS_.BOTTOM,
    yScaleTop
  ]).domain([heatmapData.valueMin, heatmapData.valueMax]);
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left');
  this.svgProfile_
    .append('svg:g').call(xAxis)
    .classed('axis', true)
    .classed('x', true)
    .attr('transform', genotet.utils.getTransform([
      0,
      this.profileHeight_ - this.PROFILE_MARGINS_.BOTTOM
    ]));
  this.svgProfile_
    .append('svg:g').call(yAxis)
    .classed('axis', true)
    .attr('transform', genotet.utils.getTransform([
      this.PROFILE_MARGINS_.LEFT,
      0
    ]));

  var profileContent = this.svgProfile_.append('g')
    .attr(
      'width',
      this.canvasWidth_ - this.PROFILE_MARGINS_.LEFT -
        this.PROFILE_MARGINS_.RIGHT
    )
    .attr(
      'height',
      this.profileHeight_ - this.PROFILE_MARGINS_.TOP -
        this.PROFILE_MARGINS_.BOTTOM
    );

  var line = d3.svg.line()
    .x(function(data, i) {
      return xScale(i);
    })
    .y(yScale)
    .interpolate('linear');

  this.data.profiles.forEach(function(profile, i) {
    var pathColor = this.COLOR_CATEGORY_[genotet.utils.hashString(
      heatmapData.geneNames[profile.row]
    ) % this.COLOR_CATEGORY_SIZE_];
    this.data.profiles[i].color = pathColor;
    var legendWidth = i * (legendHeight +
      profile.geneName.length * this.GENE_LABEL_WIDTH_FACTOR_);
    legend.append('rect')
      .attr('height', legendHeight)
      .attr('width', legendHeight)
      .attr('x', legendWidth)
      .style('fill', pathColor);
    legend.append('text')
      .text(profile.geneName)
      .attr('transform', genotet.utils.getTransform([
        legendHeight + 1,
        legendHeight / 2 + this.TEXT_HEIGHT_ / 3
      ]))
      .attr('x', legendWidth);
    profileContent.append('path')
      .classed('profile', true)
      .attr('d', line(heatmapData.values[profile.row]))
      .attr('transform', genotet.utils.getTransform([
        this.heatmapWidth_ / (heatmapData.conditionNames.length * 2),
        0
      ]))
      .attr('stroke', pathColor)
      .attr('fill', 'none')
      .on('mousemove', function() {
        var conditionIndex = Math.floor(
          xScale.invert(d3.mouse(d3.event.target)[0]) + 0.5
        );
        var value = heatmapData.values[profile.row][conditionIndex];
        this.data.profiles[i].container_ = d3.event.target;
        this.data.profiles[i].hoverColumn = conditionIndex;
        this.data.profiles[i].hoverConditionName =
          heatmapData.conditionNames[conditionIndex];
        this.data.profiles[i].hoverValue = value;
        this.signal('pathHover', this.data.profiles[i]);
      }.bind(this))
      .on('mouseout', function() {
        this.data.profiles[i].container_ = d3.event.target;
        this.signal('pathUnhover', this.data.profiles[i]);
      }.bind(this))
      .on('click', function() {
        var conditionIndex = Math.floor(
          xScale.invert(d3.mouse(d3.event.target)[0]) + 0.5
        );
        var value = heatmapData.values[profile.row][conditionIndex];
        this.data.profiles[i].container_ = d3.event.target;
        this.data.profiles[i].hoverColumn = conditionIndex;
        this.data.profiles[i].hoverConditionName =
          heatmapData.conditionNames[conditionIndex];
        this.data.profiles[i].hoverValue = value;
        this.data.profiles[i].clicked = true;
        this.signal('pathClick', this.data.profiles[i]);
      }.bind(this));
    if (this.data.profiles[i].clicked) {
      this.highlightLabelsForClickedProfile_(this.data.profiles[i]);
    }
    else {
      this.unhighlightLabelsForClickedProfile_();
      this.signal('pathUnclick');
    }
  }, this);
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 * @private
 */
genotet.ExpressionRenderer.prototype.addGeneProfile_ = function(geneIndex) {
  var profile = this.profile_ = {
    geneName: this.data.matrix.geneNames[geneIndex],
    row: geneIndex
  };
  this.data.profiles.push(profile);
  this.drawGeneProfiles_();
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 * @private
 */
genotet.ExpressionRenderer.prototype.removeGeneProfile_ = function(geneIndex) {
  var index = -1;
  for (var i = 0; i < this.data.profiles.length; i++) {
    if (this.data.profiles[i].row == geneIndex) {
      index = i;
      break;
    }
  }
  this.data.profiles.splice(index, 1);
  this.drawGeneProfiles_();
};

/**
 * Highlights the hover cell for the heatmap.
 * @param {*} cell TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightHoverCell_ = function(cell) {
  var cellSelection = d3.select(cell.container_);
  cellSelection.style('stroke', 'white');
  this.svgGeneLabels_.selectAll('text').classed('highlighted', function(d, i) {
    return cell.row == i;
  });
  this.svgConditionLabels_.selectAll('text').classed('highlighted',
    function(d, i) {
      return cell.column == i;
    });
};

/**
 * Unhighlights the hover cell for the heatmap.
 * @param {*} cell TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverCell_ = function(cell) {
  var cellSelection = d3.select(cell.container_);
  cellSelection.style('stroke', cell.colorscaleValue);
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Highlights the hover profile for the gene profile.
 * @param {*} profile TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightHoverPath_ = function(profile) {
  var pathSelection = d3.select(profile.container_);
  pathSelection.classed('highlighted', true);
  this.svgGeneLabels_.selectAll('text').classed('highlighted', function(d, i) {
    return profile.row == i;
  });
  this.svgConditionLabels_.selectAll('text').classed('highlighted',
    function(d, i) {
      return profile.hoverColumn == i;
    });
};

/**
 * Unhover profile for the gene profile.
 * @param {*} profile TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverPath_ = function(profile) {
  var pathSelection = d3.select(profile.container_);
  pathSelection.classed('highlighted', false);
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Highlights the labels of clicked cell for the heatmap.
 * @param {*} cell TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedCell_ = function(
    cell) {
  this.svgGeneLabels_.selectAll('text').classed('click-highlighted',
    function(d, i) {
      return cell.row == i;
    });
  this.svgConditionLabels_.selectAll('text').classed('click-highlighted',
    function(d, i) {
      return cell.column == i;
    });
};

/**
 * Unhighlights the label of the clicked cells for the heatmap.
 * @param {object} cell
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedCell_ =
  function(cell) {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return cell.row == i;
      });
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return cell.column == i;
      });
  };

/**
 * Unhighlights all the labels of cells for the heatmap.
 * @private
 */
genotet.ExpressionRenderer.prototype.unhighlightLabelsForClickedCell_ =
  function() {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
  };

/**
 * Highlights the labels of clicked profile.
 * @param {*} profile TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedProfile_ =
  function(profile) {
    this.unhighlightLabelsForClickedProfile_();
    this.svgGeneLabels_.select('text:nth-child(' + (profile.row + 1) + ')')
      .attr('fill', profile.color);
    this.svgConditionLabels_.select('text:nth-child(' +
        (profile.hoverColumn + 1) + ')')
      .attr('fill', profile.color);
  };

/**
 * Unhighlights all the labels of profiles.
 * @private
 */
genotet.ExpressionRenderer.prototype.unhighlightLabelsForClickedProfile_ =
  function() {
    this.svgGeneLabels_.selectAll('text').attr('fill', 'black');
    this.svgConditionLabels_.selectAll('text').attr('fill', 'black');
  };

/**
 * Computes the horizontal and vertical label sizes for the heatmap.
 * The results are stored into:
 *     this.geneLabelWidth,
 *     this.conditionLabelHeight
 * @private
 */
genotet.ExpressionRenderer.prototype.getHeatmapLabelSizes_ = function() {
  var heatmapData = this.data.matrix;
  var geneLabelsData = heatmapData.geneNames;
  var conditionLabelsData = heatmapData.conditionNames;
  this.geneLabelWidth_ = 0;
  this.conditionLabelHeight_ = 0;

  if (this.data.options.showGeneLabels) {
    this.geneLabelWidth_ = d3.max(geneLabelsData.map(function(s) {
      return s.length;
    }));
    this.geneLabelWidth_ *= this.GENE_LABEL_WIDTH_FACTOR_;
  }
  if (this.data.options.showConditionLabels) {
    this.conditionLabelHeight_ = d3.max(conditionLabelsData.map(function(s) {
      return s.length;
    }));
    this.conditionLabelHeight_ *= this.CONDITION_LABEL_HEIGHT_FACTOR_;
  }
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.resize = function() {
  this.base.resize.call(this);
  this.render();
};

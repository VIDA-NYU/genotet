/**
 * @fileoverview Renderer of the ExpressionView.
 */

'use strict';

/**
 * ExpressionRenderer renders the visualizations for the ExpressionView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewRenderer}
 * @constructor
 */
genotet.ExpressionRenderer = function(container, data) {
  genotet.ExpressionRenderer.base.constructor.call(this, container, data);

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
    color: null
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
    BOTTOM: 20,
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
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_MARGIN = 40;

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
  genotet.ExpressionRenderer.base.init.call(this);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.initLayout = function() {
  /**
   * SVG group for profile plot (line charts).
   * @private {!d3}
   */
  this.svgProfile_ = this.canvas.append('g')
    .classed('profiles', true)
    .classed('height', this.DEFAULT_PROFILE_HEIGHT);

  /**
   * SVG group for the heatmap plot.
   * @private {!d3}
   */
  this.svgHeatmap_ = this.canvas.append('g')
    .classed('heatmap', true);

  /**
   * SVG group for the heatmap itself.
   * @private {!d3}
   */
  this.svgHeatmapContent_ = this.svgHeatmap_.append('g')
    .classed('content', true);

  /**
   * SVG group for the heatmap gene (row) labels.
   * @private {!d3}
   */
  this.svgGeneLabels_ = this.svgHeatmap_.append('g')
    .classed('gene-labels', true);

  /**
   * SVG group for the heatmap condition (column) labels.
   * @private {!d3}
   */
  this.svgConditionLabels_ = this.svgHeatmap_.append('g')
    .classed('condition-labels', true);
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

  this.heatmapWidth_ = this.canvasWidth - this.geneLabelWidth_;
  if (this.data.options.showGeneLabels) {
    this.heatmapWidth_ -= this.LABEL_MARGIN_;
  }
  this.heatmapHeight_ = this.canvasHeight - this.profileHeight_ -
    this.conditionLabelHeight_;
  if (this.data.options.showConditionLabels) {
    this.heatmapHeight_ -= this.LABEL_MARGIN_;
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
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataLoaded = function() {
  this.render();
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataReady = function() {
  return this.data.matrix;
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.render = function() {
  if (!this.dataReady()) {
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
  var transformTop = this.conditionLabelHeight_ + this.profileHeight_;
  if (this.data.options.showGeneLabels) {
    transformLeft += this.LABEL_MARGIN_;
  }
  else if (this.data.options.showProfiles) {
    transformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  if (this.data.options.showConditionLabels) {
    transformTop += this.LABEL_MARGIN_;
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
      var cell = this.cell_ = {
        container_: hoverCell,
        geneName: heatmapData.geneNames[j],
        conditionName: heatmapData.conditionNames[i],
        row: j,
        column: i,
        value: value
      };
      this.signal('cellClick', cell);
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
  var transformTop = this.profileHeight_ + this.TEXT_HEIGHT_ / 2 +
    cellHeight / 2;
  if (this.data.options.showConditionLabels) {
    transformTop += this.conditionLabelHeight_ + this.LABEL_MARGIN_;
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
  var transformLeft = this.TEXT_HEIGHT_ / 2 + cellWidth / 2;
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
      this.conditionLabelHeight_ + this.profileHeight_
    ], 1, -90))
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(conditionName, i) {
      return i * cellWidth;
    });
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
  this.svgProfile_.attr('width', this.canvasWidth);

  var xScale = d3.scale.linear().range([
    this.PROFILE_MARGINS_.LEFT,
    this.canvasWidth - this.PROFILE_MARGINS_.RIGHT
  ]).domain([0, heatmapData.conditionNames.length]);
  var yScale = d3.scale.linear().range([
    this.profileHeight_ - this.PROFILE_MARGINS_.BOTTOM,
    this.PROFILE_MARGINS_.TOP
  ]).domain([heatmapData.valueMin, heatmapData.valueMax]);
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left');
  this.svgProfile_
    .append('svg:g').call(xAxis)
    .classed('axis', true)
    .classed('x', true)
    .attr(
      'transform',
      'translate(0, ' + (this.profileHeight_ - this.PROFILE_MARGINS_.BOTTOM) +
        ')'
    );
  this.svgProfile_
    .append('svg:g').call(yAxis)
    .classed('axis', true)
    .attr('transform', 'translate(' + this.PROFILE_MARGINS_.LEFT + ', 0)');

  var profileContent = this.svgProfile_.append('g')
    .attr(
      'width',
      this.canvasWidth - this.PROFILE_MARGINS_.LEFT -
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
    var geneIndex = this.data.profiles[i].row;
    var pathColor = this.COLOR_CATEGORY_[
    genotet.utils.hashString(
      heatmapData.geneNames[geneIndex]
    ) % this.COLOR_CATEGORY_SIZE_];
    this.data.profiles[i] = {
      geneName: heatmapData.geneNames[geneIndex],
      row: geneIndex,
      color: pathColor
    };
    profileContent.append('path')
      .classed('profile', true)
      .attr('d', line(heatmapData.values[geneIndex]))
      .attr('transform', 'translate(' + this.heatmapWidth_ /
        (heatmapData.conditionNames.length * 2) + ', 0)')
      .attr('stroke', pathColor)
      .attr('fill', 'none')
      .on('mousemove', function() {
        var conditionIndex = Math.floor(
          xScale.invert(d3.mouse(d3.event.target)[0]) + 0.5);
        var value = heatmapData.values[geneIndex][conditionIndex];
        _(this.data.profiles[i]).extend({
          container_: d3.event.target,
          hoverColumn: conditionIndex,
          hoverConditionName: heatmapData.conditionNames[conditionIndex],
          hoverValue: value
        });
        this.signal('pathHover', this.data.profiles[i]);
      }.bind(this))
      .on('mouseout', function() {
        this.data.profiles[i].container_ = d3.event.target;
        this.signal('pathUnhover', this.data.profiles[i]);
      }.bind(this))
      .on('click', function() {
        var conditionIndex = Math.floor(xScale.invert(
            d3.mouse(d3.event.target)[0]) + 0.5);
        var value = heatmapData.values[geneIndex][conditionIndex];
        _(this.data.profiles[i]).extend({
          container_: d3.event.target,
          hoverColumn: conditionIndex,
          hoverConditionName: heatmapData.conditionNames[conditionIndex],
          hoverValue: value
        });
        this.signal('pathClick', this.data.profiles[i]);
      }.bind(this));
  }, this);
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 * @private
 */
genotet.ExpressionRenderer.prototype.addGeneProfile_ = function(geneIndex) {
  var profile = this.profile_ = {
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
 * Highlights the labels of clicked profile.
 * @param {*} profile TODO(liana): fill the type.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedProfile_ =
    function(profile) {
  this.svgGeneLabels_.selectAll('text')
    .attr('fill', 'black');
  this.svgConditionLabels_.selectAll('text')
    .attr('fill', 'black');
  this.svgGeneLabels_.select('text:nth-child(' +
      (profile.row + 1) + ')')
    .attr('fill', profile.color);
  this.svgConditionLabels_.select('text:nth-child(' +
      (profile.hoverColumn + 1) + ')')
    .attr('fill', profile.color);
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
  genotet.ExpressionRenderer.base.resize.call(this);
  this.render();
};

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

  /** @protected {genotet.ExpressionMatrix} */
  this.data.matrix;

  /**
   * TFA data. Each element corresponds to one gene profile line.
   * @protected {genotet.ExpressionTfa}
   */
  this.data.tfa;

  /**
   * Gene profile data. Each element corresponds to one gene profile line.
   * @protected {!Array<!genotet.ExpressionRenderer.Profile>}
   */
  this.data.profiles;

  /**
   * TFA profile data. Each element corresponds to one gene profile line.
   * @protected {!Array<!genotet.ExpressionRenderer.Profile>}
   */
  this.data.tfaProfiles;

  /**
   * The maximum width of the horizontal gene labels.
   * This value will be zero when gene labels are not shown.
   * @private {number}
   */
  this.geneLabelWidth_ = 0;

  /**
   * The maximum height of the vertical experiment condition labels.
   * This value will be zero when condition labels are not shown.
   * @private {number}
   */
  this.conditionLabelHeight_ = 0;

  /**
   * Height of the gene profile plot.
   * This value will be zero when profiles are not shown.
   * @private {number}
   */
  this.profileHeight_ = 0;

  /**
   * Height of the TFA profile plot.
   * This value will be zero when profiles are not shown.
   * @private {number}
   */
  this.tfaProfileHeight_ = 0;

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
   * Clicked object for heatmap cells and gene profiles.
   * @private {!genotet.ExpressionRenderer.Cell|!Object}
   */
  this.clickedObject_ = {};

  /**
   * Margins of the gene profile.
   * @private {!Object<number>}
   */
  this.profileMargins_ = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 40
  };

  /**
   * Margins of the heatmap gradient.
   * @private @const {!Object<number>}
   */
  this.HEATMAP_GRADIENT_MARGINS_ = {
    TOP: 5,
    RIGHT: 5,
    BOTTOM: 5,
    LEFT: 5
  };
};

genotet.utils.inherit(genotet.ExpressionRenderer, genotet.ViewRenderer);

/**
 * Cell object storing the rendering properties of expression cell.
 * @param {{
 *   container: (?Element|undefined),
 *   geneName: (?string|undefined),
 *   conditionName: (?string|undefined),
 *   row: (?number|undefined),
 *   column: (?number|undefined),
 *   value: (?number|undefined),
 *   colorscaleValue: (?string|undefined)
 * }} params
 *     container: Container of the selected expression cell.
 *     geneName: Gene Name of the selected expression cell.
 *     conditionName: Condition Name of the selected expression cell.
 *     row: Row index of the selected expression cell.
 *     column: Column index of the selected expression cell.
 *     value: Value of the selected expression cell.
 *     colorscaleValue: Color of the selected expression cell.
 * @struct
 * @constructor
 */
genotet.ExpressionRenderer.Cell = function(params) {
  /** @type {?Element} */
  this.container = params.container != null ? params.container : null;

  /** @type {?string} */
  this.geneName = params.geneName != null ? params.geneName : null;

  /** @type {?string} */
  this.conditionName = params.conditionName != null ?
    params.conditionName : null;

  /** @type {number} */
  this.row = params.row != null ? params.row : -1;

  /** @type {number} */
  this.column = params.column != null ? params.column : -1;

  /** @type {number} */
  this.value = params.value != null ? params.value : 0;

  /** @type {?string} */
  this.colorscaleValue = params.colorscaleValue != null ?
    params.colorscaleValue : null;
};

/**
 * Profile object storing the rendering properties of expression cell.
 * @param {{
 *   container: (?Element|undefined),
 *   geneName: (?string|undefined),
 *   row: (?number|undefined),
 *   hoverColumn: (?number|undefined),
 *   hoverConditionName: (?string|undefined),
 *   hoverValue: (number|string|null|undefined),
 *   color: (?string|undefined)
 * }} params
 *      container: Container of the selected gene profile.
 *      geneName: Gene Name of the selected gene profile.
 *      row: Row index of the selected gene profile.
 *      hoverColumn: Column index of the hover gene profile.
 *      hoverConditionName: Condition Name of the hover gene profile.
 *      hoverValue: Value of the hover gene profile.
 *      color: Color of the selected gene profile.
 * @struct
 * @constructor
 */
genotet.ExpressionRenderer.Profile = function(params) {
  /** @type {?Element} */
  this.container = params.container != null ? params.container : null;

  /** @type {?string} */
  this.geneName = params.geneName != null ? params.geneName : null;

  /** @type {number} */
  this.row = params.row != null ? params.row : -1;

  /** @type {number} */
  this.hoverColumn = params.hoverColumn != null ? params.hoverColumn : -1;

  /** @type {?string} */
  this.hoverConditionName = params.hoverConditionName != null ?
    params.hoverConditionName : null;

  /** @type {number|string|null} */
  this.hoverValue = params.hoverValue != null ? params.hoverValue : 0;

  /** @type {?string} */
  this.color = params.color != null ? params.color : null;
};

/**
 * Zoom status object storing the status of expression matrix.
 * @param {{
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>
 * }} params
 *     geneNames: Names for gene selection.
 *     conditionNames: Names for experiment condition selection.
 * @struct
 * @constructor
 */
genotet.ExpressionRenderer.ZoomStatus = function(params) {
  /** @type {!Array<string>} */
  this.geneNames = params.geneNames != null ? params.geneNames : [];

  /** @type {!Array<string>} */
  this.conditionNames = params.conditionNames != null ?
    params.conditionNames : [];
};

/** @private @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_HEIGHT_PERCENTAGE_ = 0.32;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_TFA_PROFILE_HEIGHT_PERCENTAGE_ =
  0.32;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.PROFILE_LEGEND_HEIGHT_ = 20;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_MARGIN_ = 5;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.PROFILE_LEGEND_CORNER_RADIUS_ = 7;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.LEGEND_TEXT_MARGIN_ = 1;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_MARGIN_ = 40;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.LEGEND_HEIGHT_ =
  genotet.ExpressionRenderer.prototype.PROFILE_LEGEND_HEIGHT_ -
  genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_MARGIN_;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.PROFILE_CIRCLE_SIZE_ = 1;

/** @private @const {number} */
genotet.ExpressionRenderer.prototype.HEATMAP_GRADIENT_HEIGHT_ = 20;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.HEATMAP_GRADIENT_CORNER_RADIUS_ = 10;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.GENE_LABEL_WIDTH_FACTOR_ = 8.725;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.CONDITION_LABEL_HEIGHT_FACTOR_ = 6.501175;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.LABEL_MARGIN_ = 10;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.LABEL_DIFFERENCE_ = 10;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.HEATMAP_GRADIENT_MARGIN_ = 5;
/** @private @const {number} */
genotet.ExpressionRenderer.prototype.TEXT_HEIGHT_ = 9.66;

/** @private @const {number} */
genotet.ExpressionRenderer.prototype.COLOR_CATEGORY_SIZE_ = 60;
/** @private @const {!Array<string>} */
genotet.ExpressionRenderer.prototype.COLOR_CATEGORY_ = d3.scale.category20()
  .range()
  .concat(d3.scale.category20b().range())
  .concat(d3.scale.category20c().range());

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
    .classed('profiles', true);

  /**
   * SVG group for profile legend.
   * @private {!d3}
   */
  this.svgLegend_ = this.canvas.append('g')
    .classed('legend', true);

  /**
   * SVG group for profile x axis.
   * @private {!d3}
   */
  this.svgProfileXAxis_ = this.svgProfile_.append('g')
    .classed('x axis', true);

  /**
   * SVG group for profile y axis.
   * @private {!d3}
   */
  this.svgProfileYAxis_ = this.svgProfile_.append('g')
    .classed('axis', true);

  /**
   * SVG group for profile content.
   * @private {!d3}
   */
  this.profileContent_ = this.svgProfile_.append('g')
    .classed('profile-content', true);

  /**
   * SVG group for TFA profile plot (line charts).
   * @private {!d3}
   */
  this.svgTfaProfile_ = this.canvas.append('g')
    .classed('profiles', true);

  /**
   * SVG group for TFA profile x axis.
   * @private {!d3}
   */
  this.svgTfaProfileXAxis_ = this.svgTfaProfile_.append('g')
    .classed('x axis', true);

  /**
   * SVG group for TFA profile y axis.
   * @private {!d3}
   */
  this.svgTfaProfileYAxis_ = this.svgTfaProfile_.append('g')
    .classed('axis', true);

  /**
   * SVG group for TFA profile content.
   * @private {!d3}
   */
  this.tfaProfileContent_ = this.svgTfaProfile_.append('g')
    .classed('profile-content', true);

  /**
   * SVG group for the heatmap plot.
   * @private {!d3}
   */
  this.svgHeatmap_ = this.canvas.append('g')
    .classed('heatmap', true);

  /**
   * Div for the heatmap itself.
   * @private {!d3}
   */
  this.divHeatmapContent_ = this.viewBody.append('div')
    .classed('content', true);

  /**
   * Canvas for the heatmap itself.
   * @private {!d3}
   */
  this.svgHeatmapCanvas_ = this.divHeatmapContent_.append('canvas')
    .classed('heatmap-canvas', true);

  /**
   * SVG for the heatmap hover cell.
   * @private {!d3}
   */
  this.svgHeatmapHoverCell_ = this.divHeatmapContent_.append('div')
    .classed('hover-cell', true);

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

  /**
   * SVG group for the heatmap gradient.
   * @private {!d3}
   */
  this.svgHeatmapGradient_ = this.svgHeatmap_.append('g')
    .classed('heatmap-gradient', true);

  /**
   * SVG defs for the heatmap gradient.
   * @private {!d3}
   */
  this.gradientContent_ = this.svgHeatmapGradient_.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-content')
    .attr('x2', '100%')
    .attr('spreadMethod', 'pad');
  this.gradientContent_.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', genotet.data.redYellowScale[0])
    .attr('stop-opacity', 1);
  this.gradientContent_.append('stop')
    .attr('offset', '50%')
    .attr('stop-color', genotet.data.redYellowScale[1])
    .attr('stop-opacity', 1);
  this.gradientContent_.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', genotet.data.redYellowScale[2])
    .attr('stop-opacity', 1);

  /**
   * SVG rect for the heatmap gradient.
   * @private {!d3}
   */
  this.gradientRect_ = this.svgHeatmapGradient_.append('rect')
    .classed('gradient-rect', true)
    .style('fill', 'url(#gradient-content)');

  /**
   * SVG text for the heatmap gradient.
   */
  this.svgHeatmapGradient_.append('text')
    .classed('gradient-text-left', true);
  this.svgHeatmapGradient_.append('text')
    .classed('gradient-text-right', true);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.layout = function() {
  // Gets the label sizes so as to set the offset of heatmap SVG.
  this.getHeatmapLabelSizes_();
  // Compute the shifting sizes.
  this.profileHeight_ = this.data.options.showProfiles ?
  this.canvasHeight * this.DEFAULT_PROFILE_HEIGHT_PERCENTAGE_ : 0;
  this.tfaProfileHeight_ = this.data.options.showTfaProfiles ?
  this.canvasHeight * this.DEFAULT_TFA_PROFILE_HEIGHT_PERCENTAGE_ : 0;

  this.heatmapLayout_();
  this.profileLayout_();
};

/**
 * Layout of the expression heatmap.
 * @private
 */
genotet.ExpressionRenderer.prototype.heatmapLayout_ = function() {
  this.heatmapWidth_ = this.canvasWidth;
  if (this.data.options.showGeneLabels) {
    this.heatmapWidth_ -= this.LABEL_MARGIN_ + this.geneLabelWidth_;
  } else if (this.data.options.showProfiles ||
    this.data.options.tfaProfiles) {
    this.heatmapWidth_ -= this.DEFAULT_PROFILE_MARGIN_;
  }
  this.heatmapHeight_ = this.canvasHeight -
    this.HEATMAP_GRADIENT_HEIGHT_;

  if (this.data.options.showProfiles) {
    this.heatmapHeight_ -= this.profileHeight_;
  }
  if (this.data.options.showTfaProfiles) {
    this.heatmapHeight_ -= this.tfaProfileHeight_;
  }
  if (this.data.options.showConditionLabels) {
    this.heatmapHeight_ -= this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }

  var heatmapData = this.data.matrix;
  this.cellWidth = this.heatmapWidth_ / heatmapData.conditionNames.length;
  this.cellHeight = this.heatmapHeight_ / heatmapData.geneNames.length;

  var heatmapTransformLeft = this.geneLabelWidth_;
  var heatmapTransformTop = 0;
  if (this.data.options.showProfiles) {
    heatmapTransformTop += this.profileHeight_;
  }
  if (this.data.options.showTfaProfiles) {
    heatmapTransformTop += this.tfaProfileHeight_;
  }
  if (this.data.options.showGeneLabels) {
    heatmapTransformLeft += this.LABEL_MARGIN_;
  } else if (this.data.options.showProfiles ||
    this.data.options.showTfaProfiles) {
    heatmapTransformLeft += this.DEFAULT_PROFILE_MARGIN_;
  }
  if (this.data.options.showConditionLabels) {
    heatmapTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }

  this.divHeatmapContent_
    .style('top', heatmapTransformTop + 'px')
    .style('left', heatmapTransformLeft + 'px');

  var geneLabelTransformTop = this.TEXT_HEIGHT_ / 2 + this.cellHeight / 2;
  if (this.data.options.showProfiles) {
    geneLabelTransformTop += this.profileHeight_;
  }
  if (this.data.options.showTfaProfiles) {
    geneLabelTransformTop += this.tfaProfileHeight_;
  }
  if (this.data.options.showConditionLabels) {
    geneLabelTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }
  this.svgGeneLabels_
    .attr('transform', genotet.utils.getTransform([
      this.geneLabelWidth_,
      geneLabelTransformTop
    ]));

  var conditionLabelTransformLeft = this.geneLabelWidth_ +
    this.TEXT_HEIGHT_ / 2 + this.cellWidth / 2;
  var conditionLabelTransformTop = this.conditionLabelHeight_ +
    this.LABEL_MARGIN_;
  if (this.data.options.showProfiles) {
    conditionLabelTransformTop += this.profileHeight_;
  }
  if (this.data.options.showTfaProfiles) {
    conditionLabelTransformTop += this.tfaProfileHeight_;
  }
  if (this.data.options.showGeneLabels) {
    conditionLabelTransformLeft += this.LABEL_MARGIN_;
  } else if (this.data.options.showProfiles ||
    this.data.options.showTfaProfiles) {
    conditionLabelTransformLeft += this.DEFAULT_PROFILE_MARGIN_;
  }
  this.svgConditionLabels_
    .attr('transform', genotet.utils.getTransform([
      conditionLabelTransformLeft,
      conditionLabelTransformTop
    ]));

  var heatmapGradientTransformLeft = 0;
  var heatmapGradientTransformTop = this.heatmapHeight_;
  if (this.data.options.showProfiles) {
    heatmapGradientTransformTop += this.profileHeight_;
  }
  if (this.data.options.showTfaProfiles) {
    heatmapGradientTransformTop += this.tfaProfileHeight_;
  }
  if (this.data.options.showGeneLabels) {
    heatmapGradientTransformLeft += this.geneLabelWidth_ + this.LABEL_MARGIN_;
  } else if (this.data.options.showProfiles ||
    this.data.options.showTfaProfiles) {
    heatmapGradientTransformLeft += this.DEFAULT_PROFILE_MARGIN_;
  }
  if (this.data.options.showConditionLabels) {
    heatmapGradientTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN_ + this.LABEL_DIFFERENCE_;
  }
  this.svgHeatmapGradient_.attr('transform', genotet.utils.getTransform([
    heatmapGradientTransformLeft,
    heatmapGradientTransformTop
  ]));
};

/**
 * Layout of the gene profile.
 * @private
 */
genotet.ExpressionRenderer.prototype.profileLayout_ = function() {
  this.svgProfile_.attr('height', this.profileHeight_);
  this.svgTfaProfile_.attr('height', this.tfaProfileHeight_);
  this.profileContent_
    .attr('width', this.canvasWidth - this.profileMargins_.left -
      this.profileMargins_.right)
    .attr('height', this.profileHeight_ - this.profileMargins_.top -
      this.profileMargins_.bottom);
  this.tfaProfileContent_
    .attr('width', this.canvasWidth - this.profileMargins_.left -
      this.profileMargins_.right)
    .attr('height', this.tfaProfileHeight_ - this.profileMargins_.top -
      this.profileMargins_.bottom);

  if (this.data.options.showProfiles || this.data.options.showTfaProfiles) {
    if (!this.data.options.showGeneLabels) {
      this.profileMargins_.left = this.DEFAULT_PROFILE_MARGIN_;
    } else {
      this.profileMargins_.left = this.geneLabelWidth_ + this.LABEL_MARGIN_;
    }
  }
  this.svgLegend_
    .attr('transform', genotet.utils.getTransform([
      this.profileMargins_.left,
      this.DEFAULT_PROFILE_LEGEND_MARGIN_
    ]));
  this.svgProfileXAxis_
    .attr('transform', genotet.utils.getTransform([
      0,
      this.profileHeight_ - this.profileMargins_.bottom
    ]));
  this.svgProfileYAxis_
    .attr('transform', genotet.utils.getTransform([
      this.profileMargins_.left,
      0
    ]));

  this.svgTfaProfileXAxis_
    .attr('transform', genotet.utils.getTransform([
      0,
      this.profileHeight_ + this.tfaProfileHeight_ - this.profileMargins_.bottom
    ]));
  this.svgTfaProfileYAxis_
    .attr('transform', genotet.utils.getTransform([
      this.profileMargins_.left,
      this.profileHeight_
    ]));
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataLoaded = function() {
  this.render();
  this.highlightLabelsAfterUpdateData_();
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataReady = function() {
  return this.data.matrix != null;
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
  this.drawProfiles_();
};

/**
 * Renders the expression profiles onto the scene.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawProfiles_ = function() {
  this.drawGeneProfiles();
  this.drawTfaProfiles();
};

/**
 * Renders the expression matrix onto the scene.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawExpressionMatrix_ = function() {
  this.drawMatrixGeneLabels_();
  this.drawMatrixConditionLabels_();
  this.drawHeatmapGradient_();
  this.drawMatrixCells_();
};

/**
 * Renders the expression matrix cells.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixCells_ = function() {
  var heatmapData = this.data.matrix;
  var colorScale = d3.scale.linear();
  if (this.data.options.autoScaleGradient) {
    colorScale
      .domain([
        heatmapData.valueMin,
        (heatmapData.valueMin + heatmapData.valueMax) / 2,
        heatmapData.valueMax
      ])
      .range(genotet.data.redYellowScale);
  } else {
    colorScale
      .domain([
        heatmapData.allValueMin, (this.data.matrixInfo.allValueMin +
        this.data.matrixInfo.allValueMax) / 2, this.data.matrixInfo.allValueMax
      ])
      .range(genotet.data.redYellowScale);
  }
  var zoomSelected = false;

  var heatmapCanvas = this.svgHeatmapCanvas_
    .attr('width', this.heatmapWidth_)
    .attr('height', this.heatmapHeight_);
  var context = heatmapCanvas.node().getContext('2d');

  var cellWidth = this.cellWidth;
  var cellHeight = this.cellHeight;

  heatmapData.values.forEach(function(row, i) {
    row.forEach(function(value, j) {
      context.beginPath();
      context.fillStyle = colorScale(value);
      context.rect(
        j * cellWidth,
        i * cellHeight,
        cellWidth,
        cellHeight
      );
      context.fill();
      context.closePath();
    })
  });

  var currentMousePosition = [];

  // Zoom selection.
  var columnStart, columnEnd, rowStart, rowEnd;
  var zoomStartPosition = {
    x: 0,
    y: 0
  };
  var zoomOutButtonSelection = d3.select('#zoom-out button');
  zoomOutButtonSelection.classed('disabled', this.data.zoomStack.length == 0);

  heatmapCanvas
    .on('mousemove', function() {
      if (!zoomSelected) {
        currentMousePosition = d3.mouse(d3.event.target);
        var row = Math.floor(currentMousePosition[1] / cellHeight);
        var column = Math.floor(currentMousePosition[0] / cellWidth);
        if (row < 0 || column < 0) {
          return;
        }
        var hoverCell = this.svgHeatmapHoverCell_
          .style('width', cellWidth + 'px')
          .style('height', cellHeight + 'px')
          .style('left', column * cellWidth + 'px')
          .style('top', row * cellHeight + 'px');
        var cell = new genotet.ExpressionRenderer.Cell({
          container: hoverCell.node(),
          geneName: heatmapData.geneNames[row],
          conditionName: heatmapData.conditionNames[column],
          row: row,
          column: column,
          value: heatmapData.values[row][column]
        });
        this.signal('cellHover', cell);
      } else {
        var rectSelection = this.svgHeatmapHoverCell_;
        genotet.tooltip.hideAll();
        currentMousePosition = d3.mouse(d3.event.target);
        var selectedRange = {
          height: parseInt(rectSelection.style('height'), 10),
          width: parseInt(rectSelection.style('width'), 10),
          x: parseInt(rectSelection.style('x'), 10),
          y: parseInt(rectSelection.style('y'), 10)
        };
        var selectedBorderWeight = {
          x: currentMousePosition[0] - selectedRange.x,
          y: currentMousePosition[1] - selectedRange.y
        };
        if (selectedBorderWeight.x < 1 ||
          (selectedBorderWeight.x * 2 < selectedRange.width)) {
          selectedRange.x = currentMousePosition[0];
        } else {
          selectedRange.x = zoomStartPosition.x;
        }
        selectedRange.width = Math.abs(zoomStartPosition.x -
          currentMousePosition[0]);
        if (selectedBorderWeight.y < 1 ||
          (selectedBorderWeight.y * 2 < selectedRange.height)) {
          selectedRange.y = currentMousePosition[1];
        } else {
          selectedRange.y = zoomStartPosition.y;
        }
        selectedRange.height = Math.abs(zoomStartPosition.y -
          currentMousePosition[1]);
        //Object.keys(selectedRange).forEach(function(attr) {
        //  rectSelection.style(attr, selectedRange[attr] + 'px');
        //});
        //rectSelection.style(selectedRange);
        rectSelection.style({
          width: selectedRange.width + 'px',
          height: selectedRange.height + 'px',
          left: selectedRange.x + 'px',
          top: selectedRange.y + 'px'
        });

        this.svgHeatmap_.selectAll('.label-selected')
          .classed('label-selected', false);
        this.divHeatmapContent_.selectAll('.zoom-highlighted')
          .classed('zoom-highlighted', false);

        rowStart = Math.floor(selectedRange.y / cellHeight);
        rowEnd = Math.floor((selectedRange.y + selectedRange.height) /
          cellHeight);
        columnStart = Math.floor(selectedRange.x / cellWidth);
        columnEnd = Math.floor((selectedRange.x + selectedRange.width) /
          cellWidth);
        this.svgGeneLabels_.selectAll('.gene-label')
          .classed('label-selected', function(label, i) {
            return i >= rowStart && i <= rowEnd;
          });
        this.svgConditionLabels_.selectAll('.condition-label')
          .classed('label-selected', function(label, i) {
            return i >= columnStart && i <= columnEnd;
          });
      }
      this.svgHeatmapHoverCell_.style('display', 'inline');
    }.bind(this))
    .on('mouseup', function() {
      console.log('up');

      this.svgGeneLabels_.selectAll('.gene-label')
        .classed('label-selected', false);
      this.svgConditionLabels_.selectAll('.condition-label')
        .classed('label-selected', false);
      this.svgHeatmapHoverCell_.style('display', 'none');

      if (!zoomSelected || Number(this.svgHeatmapHoverCell_.style('width').slice(0, -2)) <= 1) {
        zoomSelected = false;
        genotet.tooltip.hideAll();
        return;
      }

      zoomSelected = false;
      if (rowEnd - rowStart == heatmapData.geneNames.length - 1 &&
        columnEnd - columnStart == heatmapData.conditionNames.length - 1) {
        return;
      }
      var zoomParams = {
        rowStart: rowStart,
        rowEnd: rowEnd,
        columnStart: columnStart,
        columnEnd: columnEnd
      };
      var zoomStatus = this.zoomDataLoaded_(zoomParams);
      var currentStatus = new genotet.ExpressionRenderer.ZoomStatus({
        geneNames: heatmapData.geneNames,
        conditionNames: heatmapData.conditionNames
      });
      this.data.zoomStack.push(currentStatus);
      this.signal('expressionZoomIn', zoomStatus);

    }.bind(this));

  this.divHeatmapContent_
    .on('mouseleave', function() {
      console.log('leave');
      zoomSelected = false;
      this.svgGeneLabels_.selectAll('.gene-label')
        .classed('label-selected', false);
      this.svgConditionLabels_.selectAll('.condition-label')
        .classed('label-selected', false);
      this.svgHeatmapHoverCell_.style('display', 'none');

      var hoverCell = this.svgHeatmapHoverCell_;
      var cell = new genotet.ExpressionRenderer.Cell({
        container: hoverCell.node()
      });
      this.signal('cellUnhover', cell);
    }.bind(this));

  this.svgHeatmapHoverCell_
    .on('click', function() {
      console.log('click');
      zoomSelected = false;
      var row = Math.floor(currentMousePosition[1] / cellHeight);
      var column = Math.floor(currentMousePosition[0] / cellWidth);
      if (row < 0 || column < 0) {
        return;
      }
      var hoverCell = this.svgHeatmapHoverCell_
        .style('width', cellWidth + 'px')
        .style('height', cellHeight + 'px')
        .style('left', column * cellWidth + 'px')
        .style('top', row * cellHeight + 'px');
      _.extend(this.clickedObject_, {
        container: hoverCell.node(),
        geneName: heatmapData.geneNames[row],
        conditionName: heatmapData.conditionNames[column],
        row: row,
        column: column,
        value: heatmapData.values[row][column]
      });
      this.signal('expressionClick', this.clickedObject_);
    }.bind(this))
    .on('mousedown', function(event) {
      this.svgHeatmapHoverCell_.style('display', 'inline');
      console.log('down');

      zoomSelected = true;

      rowStart = Math.floor(currentMousePosition[1] / cellHeight);
      columnStart = Math.floor(currentMousePosition[0] / cellWidth);
      zoomStartPosition = {
        x: currentMousePosition[0],
        y: currentMousePosition[1]
      };
      var zoomSelection = this.svgHeatmapHoverCell_
        .style('width', 1 + 'px')
        .style('height', 1 + 'px')
        .style('x', currentMousePosition[0] + 'px')
        .style('y', currentMousePosition[1] + 'px');
    }.bind(this));
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

  var labels = this.svgGeneLabels_.selectAll('text').data(geneLabelsData);
  labels.enter().append('text')
    .classed('gene-label', true);
  labels.exit().remove();
  labels
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(geneName, i) {
      return i * this.cellHeight;
    }.bind(this));
};

/**
 * Renders the expression matrix condition (column) labels.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixConditionLabels_ = function() {
  if (!this.data.options.showConditionLabels) {
    this.svgConditionLabels_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgConditionLabels_.selectAll('*').attr('display', 'inline');
  }
  var heatmapData = this.data.matrix;
  var conditionLabelsData = heatmapData.conditionNames;

  var labels = this.svgConditionLabels_.selectAll('text')
    .data(conditionLabelsData);
  labels.enter().append('text')
    .classed('condition-label', true);
  labels.exit().remove();
  labels
    .attr('transform', genotet.utils.getTransform([0, 0], 1, -90))
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(conditionName, i) {
      return i * this.cellWidth;
    }.bind(this));
};

/**
 * Renders the expression heatmap gradient.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawHeatmapGradient_ = function() {
  var heatmapData = this.data.matrix;
  var scaleMin = 0;
  var scaleMax = 0;
  if (this.data.options.autoScaleGradient) {
    scaleMin = heatmapData.valueMin;
    scaleMax = heatmapData.valueMax;
  } else {
    scaleMin = this.data.matrixInfo.allValueMin;
    scaleMax = this.data.matrixInfo.allValueMax;
  }
  scaleMin = scaleMin.toFixed(2);
  scaleMax = scaleMax.toFixed(2);
  var marginLeft = scaleMin.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR_;
  var marginRight = scaleMax.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR_;

  var gradientHeight = this.HEATMAP_GRADIENT_HEIGHT_ -
    this.HEATMAP_GRADIENT_MARGINS_.TOP -
    this.HEATMAP_GRADIENT_MARGINS_.BOTTOM;
  var gradientWidth = this.heatmapWidth_ - marginLeft - marginRight -
    this.HEATMAP_GRADIENT_MARGINS_.LEFT - this.HEATMAP_GRADIENT_MARGINS_.RIGHT -
    this.HEATMAP_GRADIENT_MARGIN_ * 2;
  this.gradientRect_
    .attr('transform', genotet.utils.getTransform([
      marginLeft + this.HEATMAP_GRADIENT_MARGIN_ +
      this.HEATMAP_GRADIENT_MARGINS_.LEFT,
      this.HEATMAP_GRADIENT_MARGINS_.TOP
    ]))
    .attr('width', gradientWidth)
    .attr('height', gradientHeight)
    .attr('rx', this.HEATMAP_GRADIENT_CORNER_RADIUS_)
    .attr('ry', this.HEATMAP_GRADIENT_CORNER_RADIUS_);
  this.svgHeatmapGradient_.select('.gradient-text-left')
    .attr('x', this.HEATMAP_GRADIENT_MARGINS_.LEFT)
    .attr('y', this.HEATMAP_GRADIENT_MARGINS_.TOP + gradientHeight / 2 +
      this.TEXT_HEIGHT_ / 2)
    .text(scaleMin);
  this.svgHeatmapGradient_.select('.gradient-text-right')
    .attr('x', this.heatmapWidth_ - marginRight -
      this.HEATMAP_GRADIENT_MARGINS_.RIGHT)
    .attr('y', this.HEATMAP_GRADIENT_MARGINS_.TOP + gradientHeight / 2 +
      this.TEXT_HEIGHT_ / 2)
    .text(scaleMax);
};

/**
 * Renders the gene profiles for the selected genes as line charts.
 */
genotet.ExpressionRenderer.prototype.drawGeneProfiles = function() {
  this.drawProfileLegend_(this.data.profiles);
  if (!this.data.options.showProfiles) {
    this.svgProfile_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgProfile_.selectAll('*').attr('display', 'inline');
  }

  var profileData = this.data.profile;
  this.svgProfile_.attr('width', this.canvasWidth);

  var xScale = d3.scale.linear().range([
    this.profileMargins_.left,
    this.canvasWidth - this.profileMargins_.right
  ]).domain([0, profileData.conditionNames.length]);
  var yScaleTop = this.profileMargins_.top +
    this.PROFILE_LEGEND_HEIGHT_;
  if (!this.data.profiles.length) {
    yScaleTop -= this.PROFILE_LEGEND_HEIGHT_;
  }
  var yScale = d3.scale.linear().range([
    this.profileHeight_ - this.profileMargins_.bottom,
    yScaleTop
  ]).domain([profileData.valueMin, profileData.valueMax]);
  var yAxisLength = this.profileHeight_ - this.profileMargins_.bottom -
    yScaleTop;
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left')
    .ticks(Math.floor(yAxisLength / this.TEXT_HEIGHT_));
  this.svgProfileXAxis_.call(xAxis);
  this.svgProfileYAxis_.call(yAxis);

  var line = d3.svg.line()
    .x(function(data, i) {
      return xScale(i);
    })
    .y(yScale)
    .interpolate('linear');

  // TODO(Liana): refactoring this function to multiple "smaller" functions
  // (e.g. drawProfilePaths_, drawProfilePoints_).
  var profileGroup = this.profileContent_.selectAll('g')
    .data(this.data.profiles);
  profileGroup.enter().append('g');
  profileGroup
    .attr('transform', genotet.utils.getTransform([
      this.heatmapWidth_ / (profileData.conditionNames.length * 2),
      0
    ]))
    .style('fill', 'none')
    .style('stroke', function(profile, i) {
      var pathColor = this.COLOR_CATEGORY_[genotet.utils.hashString(
        profile.geneName) % this.COLOR_CATEGORY_SIZE_];
      this.data.profiles[i].color = pathColor;
      return pathColor;
    }.bind(this));
  profileGroup.exit().remove();

  var profilePath = profileGroup.selectAll('path')
    .data(function(profile) {
      return [profile];
    });
  profilePath.enter().append('path');
  profilePath
    .classed('profile', true)
    .attr('d', function(profile) {
      return line(profileData.values[profile.row]);
    })
    .style('stroke', function(profile) {
      return profile.color;
    }.bind(this))
    .on('mousemove', function(profile, i) {
      var pathContainer = d3.event.target;
      this.data.profiles[i].container = pathContainer;
      d3.select(pathContainer).classed('path-highlighted', true);
      this.signal('pathHover', profile);
    }.bind(this))
    .on('mouseout', function() {
      var pathContainer = d3.event.target;
      d3.select(pathContainer).classed('path-highlighted', false);
      this.signal('profileUnhover');
    }.bind(this));
  profilePath.exit().remove();

  var profilePoint = profileGroup.selectAll('circle')
    .data(function(profile, i) {
      return profileData.values[i];
    });
  profilePoint.enter().append('circle');
  profilePoint
    .attr('r', this.PROFILE_CIRCLE_SIZE_)
    .attr('cx', function(value, i) {
      return xScale(i);
    })
    .attr('cy', function(value) {
      return yScale(value);
    })
    .on('mouseover', function(value, i) {
      var pathContainer = d3.event.target;
      var geneName = d3.select(pathContainer.parentNode).datum().geneName;
      d3.select(pathContainer).classed('circle-highlighted', true);
      var profile = new genotet.ExpressionRenderer.Profile({
        geneName: geneName,
        row: this.data.matrixInfo.allGeneNames[geneName.toLowerCase()].index,
        hoverColumn: i,
        hoverConditionName: profileData.conditionNames[i],
        hoverValue: value
      });
      this.highlightHoverPath_(profile);
      this.signal('profileHover', profile);
    }.bind(this))
    .on('mouseout', function() {
      var pathContainer = d3.event.target;
      d3.select(pathContainer).classed('circle-highlighted', false);
      this.unhighlightHoverPath_();
      this.signal('profileUnhover');
    }.bind(this))
    .on('click', function(value, i) {
      var pathContainer = d3.event.target;
      var geneName = d3.select(pathContainer.parentNode).datum().geneName;
      d3.select(pathContainer).classed('circle-highlighted', true);
      _.extend(this.clickedObject_, {
        container: pathContainer,
        geneName: geneName,
        conditionName: profileData.conditionNames[i],
        row: this.data.matrixInfo.allGeneNames[geneName.toLowerCase()].index,
        column: i,
        value: value
      });
      this.signal('expressionClick', this.clickedObject_);
    }.bind(this));
  profilePoint.exit().remove();
};

/**
 * Renders the TFA profiles for the selected genes as line charts.
 */
genotet.ExpressionRenderer.prototype.drawTfaProfiles = function() {
  if (!this.data.options.showTfaProfiles) {
    this.svgTfaProfile_.selectAll('*').attr('display', 'none');
    return;
  } else {
    if (!this.data.options.showProfiles) {
      this.drawProfileLegend_(this.data.tfaProfiles);
    }
    this.svgTfaProfile_.selectAll('*').attr('display', 'inline');
  }

  var tfaData = this.data.tfa;
  this.svgTfaProfile_.attr('width', this.canvasWidth);

  var xScale = d3.scale.linear().range([
    this.profileMargins_.left,
    this.canvasWidth - this.profileMargins_.right
  ]).domain([0, tfaData.conditionNames.length]);
  var yScaleTop = this.profileMargins_.top +
    this.PROFILE_LEGEND_HEIGHT_;
  if (!this.data.tfaProfiles.length ||
    this.data.options.showProfiles) {
    yScaleTop -= this.PROFILE_LEGEND_HEIGHT_;
  }
  var yScale = d3.scale.linear().range([
    this.tfaProfileHeight_ - this.profileMargins_.bottom,
    yScaleTop
  ]).domain([tfaData.valueMin, tfaData.valueMax]);
  var yAxisLength = this.tfaProfileHeight_ - this.profileMargins_.bottom -
    yScaleTop;
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left')
    .ticks(Math.floor(yAxisLength / this.TEXT_HEIGHT_));
  this.svgTfaProfileXAxis_.call(xAxis);
  this.svgTfaProfileYAxis_.call(yAxis);

  var line = d3.svg.line()
    .x(function(data) {
      return xScale(data.index);
    })
    .y(function(data) {
      return yScale(data.value);
    })
    .interpolate('linear');

  // TODO(Liana): refactoring this function to multiple "smaller" functions
  // (e.g. drawProfilePaths_, drawProfilePoints_).
  var profileGroup = this.tfaProfileContent_.selectAll('g')
    .data(this.data.tfaProfiles);
  profileGroup.enter().append('g');
  profileGroup
    .attr('transform', genotet.utils.getTransform([
      this.heatmapWidth_ / (tfaData.conditionNames.length * 2),
      this.profileHeight_
    ]))
    .style('fill', 'none')
    .style('stroke', function(tfaProfile, i) {
      var pathColor = this.COLOR_CATEGORY_[genotet.utils.hashString(
        tfaProfile.geneName) % this.COLOR_CATEGORY_SIZE_];
      this.data.tfaProfiles[i].color = pathColor;
      return pathColor;
    }.bind(this));
  profileGroup.exit().remove();

  var profilePath = profileGroup.selectAll('path')
    .data(function(tfaProfile) {
      return [tfaProfile];
    });
  profilePath.enter().append('path');
  profilePath
    .classed('profile', true)
    .attr('d', function(tfaProfile) {
      return line(tfaData.tfaValues[tfaProfile.row]);
    })
    .style('stroke', function(tfaProfile) {
      return tfaProfile.color;
    }.bind(this))
    .on('mousemove', function(tfaProfile, i) {
      var pathContainer = d3.event.target;
      this.data.profiles[i].container = pathContainer;
      d3.select(pathContainer).classed('path-highlighted', true);
      this.signal('pathHover', tfaProfile);
    }.bind(this))
    .on('mouseout', function() {
      var pathContainer = d3.event.target;
      d3.select(pathContainer).classed('path-highlighted', false);
      this.signal('profileUnhover');
    }.bind(this));
  profilePath.exit().remove();

  var profilePoint = profileGroup.selectAll('circle')
    .data(function(tfaProfile, i) {
      return tfaData.tfaValues[tfaProfile.row];
    });
  profilePoint.enter().append('circle');
  profilePoint
    .attr('r', this.PROFILE_CIRCLE_SIZE_)
    .attr('cx', function(object) {
      return xScale(object.index);
    })
    .attr('cy', function(object) {
      return yScale(object.value);
    })
    .on('mouseover', function(object) {
      var pathContainer = d3.event.target;
      var geneName = d3.select(pathContainer.parentNode).datum().geneName;
      d3.select(pathContainer).classed('circle-highlighted', true);
      var tfaProfile = new genotet.ExpressionRenderer.Profile({
        geneName: geneName,
        row: this.data.matrixInfo.allGeneNames[geneName.toLowerCase()].index,
        hoverColumn: object.index,
        hoverConditionName: tfaData.conditionNames[object.index],
        hoverValue: object.value
      });
      this.highlightHoverPath_(tfaProfile);
      this.signal('profileHover', tfaProfile);
    }.bind(this))
    .on('mouseout', function() {
      var pathContainer = d3.event.target;
      d3.select(pathContainer).classed('circle-highlighted', false);
      this.unhighlightHoverPath_();
      this.signal('profileUnhover');
    }.bind(this))
    .on('click', function(object) {
      var pathContainer = d3.event.target;
      var geneName = d3.select(pathContainer.parentNode).datum().geneName;
      d3.select(pathContainer).classed('circle-highlighted', true);
      _.extend(this.clickedObject_, {
        container: pathContainer,
        geneName: geneName,
        conditionName: tfaData.conditionNames[object.index],
        row: this.data.matrixInfo.allGeneNames[geneName.toLowerCase()].index,
        column: object.index,
        value: object.value
      });
      this.signal('expressionClick', this.clickedObject_);
    }.bind(this));
  profilePoint.exit().remove();
};

/**
 * Renders legend for gene profiles and TFA profiles.
 * @param {!Array<genotet.ExpressionRenderer.Profile>} profiles
 * @private
 */
genotet.ExpressionRenderer.prototype.drawProfileLegend_ = function(profiles) {
  if (!this.data.options.showProfiles &&
    !this.data.options.showTfaProfiles) {
    this.svgLegend_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgLegend_.selectAll('*').attr('display', 'inline');
  }

  var legendOffset = [0];
  var legendRect = this.svgLegend_.selectAll('rect')
    .data(profiles);
  legendRect.enter().append('rect');
  legendRect
    .attr('height', this.LEGEND_HEIGHT_)
    .attr('width', this.LEGEND_HEIGHT_)
    .attr('x', function(profile, i) {
      var previousOffset = legendOffset[i];
      legendOffset.push(previousOffset + this.PROFILE_LEGEND_HEIGHT_ +
        profile.geneName.length * this.GENE_LABEL_WIDTH_FACTOR_);
      return previousOffset;
    }.bind(this))
    .attr('rx', this.PROFILE_LEGEND_CORNER_RADIUS_)
    .attr('ry', this.PROFILE_LEGEND_CORNER_RADIUS_)
    .style('fill', function(profile) {
      return this.COLOR_CATEGORY_[genotet.utils.hashString(profile.geneName) %
      this.COLOR_CATEGORY_SIZE_];
    }.bind(this));
  legendRect.exit().remove();

  var legendText = this.svgLegend_.selectAll('text')
    .data(profiles);
  legendText.enter().append('text');
  legendText
    .text(function(profile) {
      return profile.geneName;
    }.bind(this))
    .attr('transform', genotet.utils.getTransform([
      this.LEGEND_HEIGHT_ + this.LEGEND_TEXT_MARGIN_,
      this.LEGEND_HEIGHT_ / 2 + this.TEXT_HEIGHT_ / 2
    ]))
    .attr('x', function(profile, i) {
      return legendOffset[i];
    }.bind(this));
  legendText.exit().remove();
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 * @param {string} geneName
 * @param {boolean} isAddedInPanel Whether gene selection is added in panel.
 */
genotet.ExpressionRenderer.prototype.addGeneProfile =
  function(geneIndex, geneName, isAddedInPanel) {
    var profile = new genotet.ExpressionRenderer.Profile({
      geneName: geneName,
      row: geneIndex
    });
    this.data.profiles.push(profile);
    this.drawGeneProfiles();
    if (!isAddedInPanel) {
      this.signal('updateProfileInPanel');
    }
  };

/**
 * Removes the expression profiles for the selected genes as line charts.
 * @param {string} geneName
 */
genotet.ExpressionRenderer.prototype.removeGeneProfile = function(geneName) {
  var index = -1;
  for (var i = 0; i < this.data.profiles.length; i++) {
    if (this.data.profiles[i].geneName == geneName) {
      index = i;
      break;
    }
  }
  if (index == -1) {
    return;
  }
  this.data.profiles.splice(index, 1);
  this.data.profiles.forEach(function(profile, i) {
    profile.row = i;
  }, this);

  this.data.profile.geneNames.splice(index, 1);
  this.data.profile.values.splice(index, 1);
  this.data.profile.valueMin = Infinity;
  this.data.profile.valueMax = -Infinity;
  if (this.data.profile.values.length) {
    this.data.profile.values.forEach(function(values) {
      values.forEach(function(value) {
        this.data.profile.valueMin = Math.min(this.data.profile.valueMin,
          value);
        this.data.profile.valueMax = Math.max(this.data.profile.valueMax,
          value);
      }, this);
    }, this);
  }
  this.drawGeneProfiles();
};

/**
 * Adds the TFA profiles for the selected genes as line charts.
 * @param {number} geneIndex
 * @param {string} geneName
 */
genotet.ExpressionRenderer.prototype.addTfaProfile = function(geneIndex,
                                                              geneName) {
  var tfaProfile = new genotet.ExpressionRenderer.Profile({
    geneName: geneName,
    row: geneIndex
  });
  this.data.tfaProfiles.push(tfaProfile);
  this.drawTfaProfiles();
};

/**
 * Removes the TFA profiles for the selected genes as line charts.
 * @param {string} geneName
 */
genotet.ExpressionRenderer.prototype.removeTfaProfile = function(geneName) {
  var index = -1;
  for (var i = 0; i < this.data.tfaProfiles.length; i++) {
    if (this.data.tfaProfiles[i].geneName == geneName) {
      index = i;
      break;
    }
  }
  if (index == -1) {
    return;
  }
  this.data.tfaProfiles.splice(index, 1);
  this.data.tfaProfiles.forEach(function(tfaProfile, i) {
    tfaProfile.row = i;
  }, this);

  this.data.tfa.geneNames.splice(index, 1);
  this.data.tfa.tfaValues.splice(index, 1);
  this.data.tfa.valueMin = Infinity;
  this.data.tfa.valueMax = -Infinity;
  if (this.data.tfa.tfaValues.length) {
    this.data.tfa.tfaValues.forEach(function(tfaValues) {
      tfaValues.forEach(function(object) {
        this.data.tfa.valueMin = Math.min(this.data.tfa.valueMin, object.value);
        this.data.tfa.valueMax = Math.max(this.data.tfa.valueMax, object.value);
      }, this);
    }, this);
  }
  this.drawTfaProfiles();
};

/**
 * Removes all the expression profiles for the selected genes as line charts.
 */
genotet.ExpressionRenderer.prototype.removeAllProfiles = function() {
  this.data.profile = {
    values: [],
    geneNames: [],
    conditionNames: [],
    valueMin: Infinity,
    valueMax: -Infinity
  };

  // Use _.extend because we want to preserve this.data.tfa.fileName,
  // while resetting the other attributes under this.data.tfa.
  _.extend(this.data.tfa, {
    tfaValues: [],
    geneNames: [],
    conditionNames: [],
    valueMin: Infinity,
    valueMax: -Infinity
  });
  this.data.profiles = [];
  this.data.tfaProfiles = [];
  this.drawProfiles_();
};

/**
 * Highlights the hover cell for the heatmap.
 * @param {!genotet.ExpressionRenderer.Cell} cell
 */
genotet.ExpressionRenderer.prototype.highlightHoverCell = function(cell) {
  if (cell.container) {
    var cellSelection = d3.select(cell.container);
    cellSelection.classed('highlighted', true);
  }
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
 * @param {!genotet.ExpressionRenderer.Cell} cell
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverCell = function(cell) {
  if (cell.container) {
    var cellSelection = d3.select(cell.container);
    cellSelection.classed('highlighted', false);
  }
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Highlights the hover profile for the gene profile.
 * @param {!genotet.ExpressionRenderer.Profile} profile
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightHoverPath_ = function(profile) {
  this.svgGeneLabels_.selectAll('text').classed('highlighted', function(d, i) {
    return profile.geneName == this.data.matrix.geneNames[i];
  }.bind(this));
  this.svgConditionLabels_.selectAll('text').classed('highlighted',
    function(d, i) {
      return profile.hoverColumn == i;
    });
};

/**
 * Unhover profile for the gene profile.
 * @private
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverPath_ = function() {
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Unhighlights the label of the clicked cells for the heatmap.
 * @param {!genotet.ExpressionRenderer.Cell} object
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedObject =
  function(object) {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return object.row == i;
      });
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return object.column == i;
      });
  };

/**
 * Unhighlights all the labels of cells for the heatmap.
 */
genotet.ExpressionRenderer.prototype.unhighlightLabelsForClickedObject =
  function() {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
  };

/**
 * Highlights the label of the clicked cell or profile.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsAfterUpdateData_ =
  function() {
    var geneName = this.clickedObject_.geneName;
    var conditionName = this.clickedObject_.conditionName;
    if (geneName && geneName.toLowerCase() in this.data.matrixGeneNameDict &&
      conditionName && conditionName.toLowerCase() in
      this.data.matrixConditionNameDict) {
      this.clickedObject_.row = this.data.matrixGeneNameDict[
        geneName.toLowerCase()].index;
      this.clickedObject_.column = this.data.matrixConditionNameDict[
        conditionName.toLowerCase()].index;
      this.signal('expressionClick', this.clickedObject_);
    } else {
      this.signal('expressionUnclick');
    }
  };

/**
 * Load expression matrix data after zoom in and out the heatmap.
 * @param {{
 *   rowStart: (?number|undefined),
 *   rowEnd: (?number|undefined),
 *   columnStart: (?number|undefined),
 *   columnEnd: (?number|undefined)
 * }} params
 *      rowStart: Start row of the selected cells.
 *      rowEnd: End row of the selected cells.
 *      columnStart: Start column of the selected cells.
 *      columnEnd: End column of the selected cells.
 * @return {!genotet.ExpressionRenderer.ZoomStatus} zoomStatus
 * @private
 */
genotet.ExpressionRenderer.prototype.zoomDataLoaded_ = function(params) {
  var heatmapData = this.data.matrix;
  var zoomStatus = new genotet.ExpressionRenderer.ZoomStatus({
    geneNames: heatmapData.geneNames.slice(params.rowStart, params.rowEnd + 1),
    conditionNames: heatmapData.conditionNames.slice(params.columnStart,
      params.columnEnd + 1)
  });
  return zoomStatus;
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

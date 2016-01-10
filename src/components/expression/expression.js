/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

/**
 * @typedef {{
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   allGeneNames: !Array<string>,
 *   allConditionNames: !Array<string>,
 *   allValueMax: number,
 *   allValueMin: number,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
genotet.ExpressionMatrix;

/**
 * @typedef {{
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   tfaValues: !Array<!Object>,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
genotet.ExpressionTfaData;

/**
 * View extends the base View class, and renders the expression matrix
 * associated with the regulatory Expression.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {genotet.View}
 * @constructor
 */
genotet.ExpressionView = function(viewName, params) {
  genotet.ExpressionView.base.constructor.call(this, viewName);

  /**
   * @protected {genotet.ExpressionMatrix}
   */
  this.data.matrix;

  this.container.addClass('expression');

  /** @protected {!genotet.ExpressionLoader} */
  this.loader = new genotet.ExpressionLoader(this.data);

  /** @protected {!genotet.ExpressionPanel} */
  this.panel = new genotet.ExpressionPanel(this.data);

  /** @protected {!genotet.ExpressionRenderer} */
  this.renderer = new genotet.ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.loadExpressionMatrixAll(params.matrixName, params.dataName);
  }.bind(this));

  // Format gene and condition input to list.
  $(this.loader).on('genotet.allMatrixDataLoaded', function() {
    var geneNames = this.loader.formatGeneInput(params.isGeneRegex,
      params.geneInput);
    var conditionNames = this.loader.formatConditionInput(
      params.isConditionRegex, params.conditionInput);
    this.loader.load(params.matrixName, params.dataName, geneNames,
      conditionNames);
  }.bind(this));

  // Set up rendering update.
  $(this.panel)
    .on('genotet.update', function(event, data) {
      switch (data.type) {
        case 'label':
          this.renderer.render();
          break;
        case 'visibility':
          this.renderer.render();
          break;
        case 'gene':
          this.loader.update(data.method, params.matrixName, data.names);
          break;
        case 'condition':
          this.loader.update(data.method, params.matrixName, data.names);
          break;
        case 'auto-scale':
          this.renderer.render();
          break;
        default:
          genotet.error('unknown update type', data.type);
      }
    }.bind(this))
    .on('genotet.addGeneProfile', function(event, geneIndex) {
      this.renderer.addGeneProfile(geneIndex);
    }.bind(this))
    .on('genotet.addTfaProfile', function(event, geneName) {
      this.renderer.addTfaProfile(geneName);
    }.bind(this))
    .on('genotet.removeGeneProfile', function(event, geneIndex) {
      this.renderer.removeGeneProfile(geneIndex);
    }.bind(this))
    .on('genotet.removeTfaProfile', function(event, geneName) {
      this.renderer.removeTfaProfile(geneName);
    }.bind(this));

  // Cell hover in expression.
  $(this.renderer)
    .on('genotet.cellHover', function(event, cell) {
      this.renderer.highlightHoverCell(cell);
      this.panel.tooltipHeatmap(cell.geneName, cell.conditionName, cell.value);
    }.bind(this))
    .on('genotet.cellUnhover', function(event, cell) {
      this.renderer.unhighlightHoverCell(cell);
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.expressionClick', function(event, object) {
      this.renderer.highlightLabelsForClickedObject(object);
      this.panel.displayCellInfo(object.geneName, object.conditionName,
        object.value);
    }.bind(this))
    .on('genotet.expressionUnclick', function(event) {
      this.panel.hideCellInfo();
      this.renderer.unhighlightLabelsForClickedObject();
    }.bind(this));

  // Path hover in expression.
  $(this.renderer)
    .on('genotet.pathHover', function(event, profile) {
      this.renderer.highlightHoverPath(profile);
      this.panel.tooltipHeatmap(profile.geneName,
        profile.hoverConditionName, profile.hoverValue);
    }.bind(this))
    .on('genotet.pathUnhover', function(event, profile) {
      this.renderer.unhighlightHoverPath(profile);
      genotet.tooltip.hideAll();
    }.bind(this));

  // Zoom in and out in expression.
  $(this.renderer)
    .on('genotet.expressionZoomIn', function(event, zoomStatus) {
      this.loader.load(zoomStatus.matrixName, zoomStatus.dataName,
        zoomStatus.geneNames, zoomStatus.conditionNames);
    }.bind(this));
  $(this.panel)
    .on('genotet.expressionZoomOut', function(event, zoomStatus) {
      this.loader.load(zoomStatus.matrixName, zoomStatus.dataName,
        zoomStatus.geneNames, zoomStatus.conditionNames);
    }.bind(this));

  // Update expression panel.
  $(this.loader)
    .on('genotet.updatePanel', function(event) {
      this.panel.dataLoaded();
    }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);

/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

/**
 * @typedef {{
 *   fileName: string,
 *   tfaFileName: string,
 *   isGeneRegex: boolean,
 *   isConditionRegex: boolean,
 *   geneInput: string,
 *   conditionInput: string
 * }}
 */
genotet.ExpressionViewParams;

/**
 * @typedef {{
 *   fileName: string,
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
 *   fileName: string,
 *   geneNames: !Array<string>,
 *   conditionNames: !Array<string>,
 *   tfaValues: !Array<!Object>,
 *   valueMin: number,
 *   valueMax: number
 * }}
 */
genotet.ExpressionTfa;

/**
 * @typedef {!Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>}
 */
genotet.ListedExpression;

/**
 * View extends the base View class, and renders the expression matrix
 * associated with the regulatory Expression.
 * @param {string} viewName Name of the view.
 * @param {genotet.ExpressionViewParams} params
 * @extends {genotet.View}
 * @constructor
 */
genotet.ExpressionView = function(viewName, params) {
  genotet.ExpressionView.base.constructor.call(this, viewName);

  /**
   * @protected {{
   *   matrix: genotet.ExpressionMatrix,
   *   tfa: genotet.ExpressionTfa
   * }}
   */
  this.data;

  /**
   * @protected {genotet.ExpressionMatrix}
   */
  this.data.matrix;

  /**
   * @protected {genotet.ExpressionTfa}
   */
  this.data.tfa;

  this.container.addClass('expression');

  /** @protected {!genotet.ExpressionLoader} */
  this.loader = new genotet.ExpressionLoader(this.data);

  /** @protected {!genotet.ExpressionPanel} */
  this.panel = new genotet.ExpressionPanel(this.data);

  /** @protected {!genotet.ExpressionRenderer} */
  this.renderer = new genotet.ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.data.tfa.fileName = params.tfaFileName;
    this.loader.loadExpressionMatrixInfo(params.fileName);
  }.bind(this));

  // Format gene and condition input to list.
  $(this.loader)
    .on('genotet.matrixInfoLoaded', function() {
    var geneNames = this.panel.formatGeneInput(params.isGeneRegex,
      params.geneInput);
    var conditionNames = this.panel.formatConditionInput(
      params.isConditionRegex, params.conditionInput);
    this.loader.load(params.fileName, geneNames, conditionNames);
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
          this.loader.update(data.method, params.fileName, data.names);
          break;
        case 'condition':
          this.loader.update(data.method, params.fileName, data.names);
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
      this.renderer.addTfaProfile(geneIndex);
    }.bind(this))
    .on('genotet.removeGeneProfile', function(event, geneIndex) {
      this.renderer.removeGeneProfile(geneIndex);
      this.renderer.removeTfaProfile(geneIndex);
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
    .on('genotet.expressionUnclick', function() {
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
      this.loader.load(this.data.matrix.fileName, zoomStatus.geneNames,
        zoomStatus.conditionNames);
    }.bind(this));
  $(this.panel)
    .on('genotet.expressionZoomOut', function(event, zoomStatus) {
      this.loader.load(this.data.matrix.fileName, zoomStatus.geneNames,
        zoomStatus.conditionNames);
    }.bind(this));

  // Update expression panel.
  $(this.loader)
    .on('genotet.updatePanel', function() {
      this.panel.dataLoaded();
    }.bind(this));

  // Set up link callbacks.
  $(this).on('genotet.link', function(event, linkData) {
    switch (linkData.response) {
      case 'addGeneProfile':
        var geneName = linkData.data;
        var geneIndex = this.data.matrix.geneNames.indexOf(geneName);
        if (geneIndex != -1) {
          this.panel.signal('addGeneProfile', geneIndex);
        }
        break;
    }
  }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);

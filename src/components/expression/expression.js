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

/** @const */
genotet.expression = {};

/** @enum {string} */
genotet.expression.QueryType = {
  EXPRESSION: 'expression',
  EXPRESSION_INFO: 'expression-info',
  PROFILE: 'profile',
  TFA_PROFILE: 'tfa-profile'
};

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
   *   tfa: genotet.ExpressionTfa,
   *   profiles: !Array<genotet.ExpressionRenderer.Profile>,
   *   tfaProfiles: !Array<genotet.ExpressionRenderer.Profile>,
   *   zoomStack: !Array<genotet.ExpressionRenderer.ZoomStatus>
   * }}
   */
  this.data;

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
    this.data.matrixInfo.fileName = params.fileName;
    this.loader.loadExpressionMatrixInfo(params.fileName);
  }.bind(this));

  // Format gene and condition input to list.
  $(this.loader)
    .on('genotet.matrixInfoLoaded', function() {
      var geneNames = this.panel.formatGeneInput(params.isGeneRegex,
        params.geneInput);
      var conditionNames = this.panel.formatConditionInput(
        params.isConditionRegex, params.conditionInput);
      this.loader.load(this.data.matrixInfo.fileName, geneNames,
        conditionNames);
      var allGeneNames = Object.keys(this.data.matrixInfo.allGeneNames)
        .map(function(geneName) {
          return this.data.matrixInfo.allGeneNames[geneName].rawName;
        }, this);
      this.panel.updateGenes(allGeneNames);
      this.renderer.removeAllProfiles();
    }.bind(this))
    .on('genotet.newProfileLoaded', function(event, data) {
      this.renderer.addGeneProfile(data.geneIndex, data.geneName);
    }.bind(this))
    .on('genotet.profileLoaded', function() {
      this.renderer.drawGeneProfiles();
    }.bind(this))
    .on('genotet.newTfaProfileLoaded', function(event, data) {
      this.renderer.addTfaProfile(data.geneIndex, data.geneName);
    }.bind(this))
    .on('genotet.tfaProfileLoaded', function() {
      this.renderer.drawTfaProfiles();
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
    .on('genotet.addGeneProfile', function(event, geneName) {
      this.loader.loadProfile(this.data.matrixInfo.fileName, [geneName],
        this.data.matrix.conditionNames, true);
      this.loader.loadTfaProfile(this.data.matrixInfo.fileName, [geneName],
        this.data.matrix.conditionNames, true);
    }.bind(this))
    .on('genotet.removeGeneProfile', function(event, geneName) {
      this.renderer.removeGeneProfile(geneName);
      this.renderer.removeTfaProfile(geneName);
    }.bind(this))
    .on('genotet.updateMatrix', function(event, data) {
      this.loader.loadExpressionMatrixInfo(data.fileName);
    }.bind(this))
    .on('genotet.loadExpressionList', function() {
      genotet.data.loadList(this, genotet.FileType.EXPRESSION);
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
      this.panel.tooltipProfile(profile.geneName);
    }.bind(this))
    .on('genotet.profileHover', function(event, profile) {
      this.panel.tooltipHeatmap(profile.geneName,
        profile.hoverConditionName, profile.hoverValue);
    }.bind(this))
    .on('genotet.profileUnhover', function() {
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

  // Update panel after loading file list.
  $(this)
    .on('genotet.updateFileListAfterLoading', function() {
      this.panel.updateFileListAfterLoading();
    }.bind(this));

  // Set up link callbacks.
  $(this)
    .on('genotet.addProfile', function(event, data) {
      /**
       * The genes array contains source and target genes of the clicked edge
       * or the gene of the clicked node.
       * @type {!Array<string>}
       */
      var genes = /** @type {!Array<string>} */(data);
      genes.forEach(function(gene) {
        if (!(gene in this.data.matrixInfo.allGeneNames)) {
          return;
        }
        var geneName = this.data.matrixInfo.allGeneNames[gene].rawName;
        var isExistent = this.data.profiles.filter(function(obj) {
            return obj.geneName == geneName;
          }).length;
        if (!isExistent) {
          this.loader.loadProfile(this.data.matrixInfo.fileName, [geneName],
            this.data.matrix.conditionNames, true);
          this.loader.loadTfaProfile(this.data.matrixInfo.fileName, [geneName],
            this.data.matrix.conditionNames, true);
          this.panel.dataLoaded();
        }
      }, this);
    }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);

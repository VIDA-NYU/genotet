/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

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

  this.container.addClass('expression');

  /** @protected {genotet.ExpressionLoader} */
  this.loader = new genotet.ExpressionLoader(this.data);

  /** @protected {genotet.ExpressionPanel} */
  this.panel = new genotet.ExpressionPanel(this.data);

  /** @protected {genotet.ExpressionRenderer} */
  this.renderer = new genotet.ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.matrixName, params.geneRegex, params.condRegex);
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
          this.loader.update(data.method, params.matrixName, data.regex);
          break;
        case 'condition':
          this.loader.update(data.method, params.matrixName, data.regex);
          break;
        case 'auto-scale':
          this.renderer.render();
          break;
        default:
          genotet.error('unknown update type', data.type);
      }
    }.bind(this))
    .on('genotet.addGeneProfile', function(event, geneIndex) {
      this.renderer.addGeneProfile_(geneIndex);
    }.bind(this))
    .on('genotet.removeGeneProfile', function(event, geneIndex) {
      this.renderer.removeGeneProfile_(geneIndex);
    }.bind(this));

  // Cell hover in expression.
  $(this.renderer)
    .on('genotet.cellHover', function(event, cell) {
      this.renderer.highlightHoverCell_(cell);
      this.panel.tooltipHeatmap_(cell.geneName, cell.conditionName, cell.value);
    }.bind(this))
    .on('genotet.cellUnhover', function(event, cell) {
      this.renderer.unhighlightHoverCell_(cell);
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.cellClick', function(event, cell) {
      this.renderer.highlightLabelsForClickedCell_(cell);
      this.panel.displayCellInfo_(cell.geneName, cell.conditionName,
        cell.value);
    }.bind(this));

  // Path hover in expression.
  $(this.renderer)
    .on('genotet.pathHover', function(event, profile) {
      this.renderer.highlightHoverPath_(profile);
      this.panel.tooltipGeneProfile_(profile.geneName,
        profile.hoverConditionName, profile.hoverValue);
    }.bind(this))
    .on('genotet.pathUnhover', function(event, profile) {
      this.renderer.unhighlightHoverPath_(profile);
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.pathClick', function(event, profile) {
      this.renderer.highlightLabelsForClickedProfile_(profile);
      this.panel.displayPathInfo_(profile.geneName, profile.hoverConditionName,
        profile.hoverValue);
    }.bind(this));

  // Update expression panel.
  $(this.loader)
    .on('genotet.updatePanel', function(event) {
      this.panel.dataLoaded();
    }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);

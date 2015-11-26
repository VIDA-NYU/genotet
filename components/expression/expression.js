/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

/**
 * View extends the base View class, and renders the expression matrix
 * associated with the regulatory Expression.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {View}
 * @constructor
 */
genotet.ExpressionView = function(viewName, params) {
  this.base.constructor.call(this, viewName);

  this.container.addClass('expression');

  /** @protected {ExpressionLoader} */
  this.loader = new genotet.ExpressionLoader(this.data);

  /** @protected {ExpressionPanel} */
  this.panel = new genotet.ExpressionPanel(this.data);

  /** @protected {ExpressionRenderer} */
  this.renderer = new genotet.ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.matrixName, params.geneRegex, params.condRegex);
  }.bind(this));

  // Set up rendering update.
  $(this.panel).on('genotet.update', function(event, data) {
    switch(data.type) {
      case 'label':
        this.renderer.renderExpressionMatrix_();
        break;
      case 'visibility':
        this.renderer.renderExpressionMatrix_();
        break;
      // TODO(Liana): Implement this...
      //case 'auto-scale':
      //  this.loader.updateGenes(data.method, data.regex);
      //  break;
      default:
        genotet.error('unknown update type', data.type);
    }
  }.bind(this));

  // Cell hover in expression.
  $(this.renderer)
    .on('genotet.cellHover', function(event, cell) {
      this.renderer.highlightHoverCell_(cell, true);
      this.panel.tooltipHeatmap(cell.geneName, cell.conditionName);
    }.bind(this))
    .on('genotet.cellUnhover', function(event, cell) {
      this.renderer.highlightHoverCell_(cell, false);
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.cellClick', function(event, cell) {
      this.panel.displayCellInfo(cell.geneName, cell.conditionName);
    }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);

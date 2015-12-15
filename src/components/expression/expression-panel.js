/**
 * @fileoverview Panel of the expression matrix component.
 */

'use strict';

/**
 * ExpressionPanel manages the UI control panel of the expression matrix.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
genotet.ExpressionPanel = function(data) {
  this.base.constructor.call(this, data);

  // Set the view options.
  _(this.data.options).extend({
    // TODO(bowen): Check how TFA data will be used.
    //showTFA: true,
    showGeneLabels: true,
    showConditionLabels: true,
    showProfiles: true,
    showGradient: false,
    autoScaleGradient: true
  });

  /**
   * Select2 for selecting genes to profile.
   * @private {select2}
   */
  this.selectProfiles_ = null;
};

genotet.utils.inherit(genotet.ExpressionPanel, genotet.ViewPanel);

/** @inheritDoc */
genotet.ExpressionPanel.prototype.template = 'dist/html/expression-panel.html';

/** @inheritDoc */
genotet.ExpressionPanel.prototype.panel = function(container) {
  this.base.panel.call(this, container);
};

/** @inheritDoc */
genotet.ExpressionPanel.prototype.dataLoaded = function() {
  this.updateGenes(this.data.matrix.geneNames);
};

/** @inheritDoc */
genotet.ExpressionPanel.prototype.initPanel = function() {
  // Data may have not been loaded. Use empty list.
  this.updateGenes([]);

  // Initialize switches.
  this.container_.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {
      selector: '#label-genes',
      type: 'label',
      attribute: 'showGeneLabels'
    },
    {
      selector: '#label-conditions',
      type: 'label',
      attribute: 'showConditionLabels'
    },
    {
      selector: '#show-profiles',
      type: 'visibility',
      attribute: 'showProfiles'
    },
    /*
    {
      selector: '#show-gradient',
      type: 'visibility',
      attribute: 'showGradient'
    },
    */
    {
      selector: '#auto-scale',
      type: 'auto-scale',
      attribute: 'autoScaleGradient'
    }
  ].forEach(function(bSwitch) {
    this.container_.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
      function(event, state) {
        this.data.options[bSwitch.attribute] = state;
        this.signal('update', {
          type: bSwitch.type
        });
      }.bind(this));
  }, this);

  // Add and remove gene profiles
  this.selectProfiles_
    .on('select2:select', function(event) {
      var geneIndex = event.params.data.element.index;
      this.signal('addGeneProfile', geneIndex);
    }.bind(this))
    .on('select2:unselect', function(event) {
      var geneIndex = event.params.data.element.index;
      this.signal('removeGeneProfile', geneIndex);
    }.bind(this));

  // Gene update
  ['setGene', 'addGene', 'removeGene'].forEach(function(method) {
    this.container_.find('#genes #' + method).click(function() {
      var input = this.container_.find('#genes input');
      var geneRegex = input.val();
      if (geneRegex == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');
      this.signal('update', {
        type: 'gene',
        regex: geneRegex,
        method: method
      });
    }.bind(this));
  }, this);

  // Condition update
  ['setCondition', 'addCondition', 'removeCondition'].forEach(function(method) {
    this.container_.find('#conditions #' + method).click(function() {
      var input = this.container_.find('#conditions input');
      var conditionRegex = input.val();
      if (conditionRegex == '') {
        genotet.warning('missing input condition selection');
        return;
      }
      input.val('');
      this.signal('update', {
        type: 'condition',
        regex: conditionRegex,
        method: method
      });
    }.bind(this));
  }, this);
};

/**
 * Updates the genes in the profile list.
 * Select2 will regenerate the selection list each time updated.
 * @param {!Array<string>} gene List of genes.
 */
genotet.ExpressionPanel.prototype.updateGenes = function(gene) {
  var genes = gene.map(function(gene) {
    return {
      id: gene,
      text: gene
    };
  });
  var geneProfiles = this.data.profiles.map(function(profile) {
    return profile.geneName;
  });
  this.selectProfiles_ = this.container_.find('#profile select').empty();
  this.selectProfiles_.select2({
      data: genes,
      multiple: true
    })
    .select2('val', geneProfiles);
  this.container_.find('#profile .select2-container').css({
    width: '100%'
  });
};

/**
 * Adds the cell info into a given container.
 * @param {!String} geneName Gene name of which info is to be displayed.
 * @param {!String} conditionName Condition name of which info is to be
 *     displayed.
 * @param {!Number} value Value of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.ExpressionPanel.prototype.setCellInfo_ = function(geneName,
    conditionName, value, container) {
  container.html(this.container_.find('#cell-info-template').html());
  container.children('#gene').children('span')
    .text(geneName);
  container.children('#condition').children('span')
    .text(conditionName);
  container.children('#value').children('span')
    .text(value);
};

/**
 * Hides all cell info boxes.
 * @private
 */
genotet.ExpressionPanel.prototype.hideCellInfo_ = function() {
  this.container_.find('#cell-info').slideUp();
};

/**
 * Displays a tooltip around cursor about a hovered cell.
 * @param {!String} geneName Gene Name being hovered.
 * @param {!String} conditionName Condition Name being hovered.
 * @param {!Number} value Value of which info is to be displayed.
 * @private
 */
genotet.ExpressionPanel.prototype.tooltipHeatmap_ = function(geneName,
    conditionName, value) {
  var tooltip = genotet.tooltip.create();
  this.setCellInfo_(geneName, conditionName, value, tooltip);
  tooltip.find('.close').remove();
};

/**
 * Displays the info box for expression cell.
 * @param {!String} geneName Gene Name of which the info is to be displayed.
 * @param {!String} conditionName Condition Name of which the info is to be
 *     displayed.
 * @param {!Number} value Value of which info is to be displayed.
 * @private
 */
genotet.ExpressionPanel.prototype.displayCellInfo_ = function(geneName,
    conditionName, value) {
  var info = this.container_.find('#cell-info').hide().slideDown();
  this.setCellInfo_(geneName, conditionName, value, info);
  info.find('.close').click(function() {
    this.hideCellInfo_();
  }.bind(this));
};

/**
 * Adds the profile info into a given container.
 * @param {!String} geneName Gene name of which info is to be displayed.
 * @param {!String} conditionName Condition name of which info is to be
 *     displayed.
 * @param {!Number} value Value of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.ExpressionPanel.prototype.setPathInfo_ = function(geneName,
    conditionName, value, container) {
  container.html(this.container_.find('#profile-info-template').html());
  container.children('#genePath').children('span')
    .text(geneName);
  container.children('#conditionPath').children('span')
    .text(conditionName);
  container.children('#profileValue').children('span')
    .text(value);
};

/**
 * Hides all profile info boxes.
 * @private
 */
genotet.ExpressionPanel.prototype.hidePathInfo_ = function() {
  this.container_.find('#profile-info').slideUp();
};

/**
 * Displays a tooltip around cursor about a hovered profile.
 * @param {!String} geneName Gene Name being hovered.
 * @param {!String} conditionName Condition name of which info is to be
 *     displayed.
 * @param {!Number} value Value of which info is to be displayed.
 * @private
 */
genotet.ExpressionPanel.prototype.tooltipGeneProfile_ = function(geneName,
    conditionName, value) {
  var tooltip = genotet.tooltip.create();
  this.setPathInfo_(geneName, conditionName, value, tooltip);
  tooltip.find('.close').remove();
};

/**
 * Displays the info box for expression profile.
 * @param {!String} geneName Gene Name of which the info is to be displayed.
 * @param {!String} conditionName Condition name of which info is to be
 *     displayed.
 * @param {!Number} value Value of which info is to be displayed.
 * @private
 */
genotet.ExpressionPanel.prototype.displayPathInfo_ = function(geneName,
    conditionName, value) {
  var info = this.container_.find('#profile-info').hide().slideDown();
  this.setPathInfo_(geneName, conditionName, value, info);
  info.find('.close').click(function() {
    this.hidePathInfo_();
  }.bind(this));
};

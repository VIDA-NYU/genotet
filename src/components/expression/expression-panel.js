/**
 * @fileoverview Panel of the expression matrix component.
 */

'use strict';

/**
 * ExpressionPanel manages the UI control panel of the expression matrix.
 * @param {!Object} data Data object of the view.
 * @extends {genotet.ViewPanel}
 * @constructor
 */
genotet.ExpressionPanel = function(data) {
  genotet.ExpressionPanel.base.constructor.call(this, data);

  // Set the view options.
  _.extend(this.data.options, {
    showTFA: true,
    showGeneLabels: true,
    showConditionLabels: true,
    showProfiles: true,
    showTfaProfiles: true,
    autoScaleGradient: true
  });

  /**
   * Selection of genes to profile.
   * @private {select2}
   */
  this.selectProfiles_ = null;

  /**
   * Input type for genes and conditions update..
   * @private {boolean}
   */
  this.isRegex_ = true;
};

genotet.utils.inherit(genotet.ExpressionPanel, genotet.ViewPanel);

/** @inheritDoc */
genotet.ExpressionPanel.prototype.template = 'dist/html/expression-panel.html';

/** @inheritDoc */
genotet.ExpressionPanel.prototype.dataLoaded = function() {
  this.updateGenes(this.data.matrix.geneNames);
};

/** @inheritDoc */
genotet.ExpressionPanel.prototype.initPanel = function() {
  // Data may have not been loaded. Use empty list.
  this.updateGenes([]);

  // Initialize switches.
  this.container.find('.switches input').bootstrapSwitch({
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
    {
      selector: '#show-tfa-profile',
      type: 'visibility',
      attribute: 'showTfaProfiles'
    },
    {
      selector: '#auto-scale',
      type: 'auto-scale',
      attribute: 'autoScaleGradient'
    }
  ].forEach(function(bSwitch) {
    this.container.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
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
      var geneName = event.params.data.text;
      this.signal('addGeneProfile', geneIndex);
      this.signal('addTfaProfile', geneName);
    }.bind(this))
    .on('select2:unselect', function(event) {
      var geneIndex = event.params.data.element.index;
      var geneName = event.params.data.text;
      this.signal('removeGeneProfile', geneIndex);
      this.signal('removeTfaProfile', geneName);
    }.bind(this));

  // Input type update
  this.container.find('#regex input').click(function() {
    this.isRegex_ = true;
  }.bind(this));
  this.container.find('#string input').click(function() {
    this.isRegex_ = false;
  }.bind(this));
  this.container.find('#regex input').trigger('click');

  // Gene update
  ['setGene', 'addGene', 'removeGene'].forEach(function(method) {
    this.container.find('#genes #' + method).click(function() {
      var input = this.container.find('#genes input');
      var geneInput = input.val();
      if (geneInput == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');

      var geneNames = [];
      if (this.isRegex_) {
        var geneRegex = RegExp(geneInput, 'i');
        this.data.matrix.allGeneNames.forEach(function(geneName) {
          if (geneName.match(geneRegex)) {
            geneNames.push(geneName);
          }
        });
      }
      else {
        var inputWords = geneInput.split(',');
        inputWords.forEach(function(word) {
          if (this.data.matrix.allGeneNames.indexOf(word) != -1) {
            geneNames.push(word);
          }
        }.bind(this));
      }
      if (geneNames.length == 0) {
        genotet.warning('invalid input gene selection');
        return;
      }
      this.signal('update', {
        type: 'gene',
        names: geneNames,
        method: method
      });
    }.bind(this));
  }, this);

  // Condition update
  ['setCondition', 'addCondition', 'removeCondition'].forEach(function(method) {
    this.container.find('#conditions #' + method).click(function() {
      var input = this.container.find('#conditions input');
      var conditionInput = input.val();
      if (conditionInput == '') {
        genotet.warning('missing input condition selection');
        return;
      }
      input.val('');

      var conditionNames = [];
      if (this.isRegex_) {
        var conditionRegex = RegExp(conditionInput, 'i');
        this.data.matrix.allConditionNames.forEach(function(conditionName) {
          if (conditionName.match(conditionRegex)) {
            conditionNames.push(conditionName);
          }
        });
      }
      else {
        var inputWords = conditionInput.split(',');
        inputWords.forEach(function(word) {
          if (this.data.matrix.allConditionNames.indexOf(word) != -1) {
            conditionNames.push(word);
          }
        }.bind(this));
      }
      if (conditionNames.length == 0) {
        genotet.warning('invalid input condition selection');
        return;
      }
      this.signal('update', {
        type: 'condition',
        names: conditionNames,
        method: method
      });
    }.bind(this));
  }, this);

  // Zoom out
  this.container.find('#out').click(function() {
    if (this.data.zoomStack.length > 0) {
      var zoomRegex = this.data.zoomStack.pop();
      this.signal('expressionZoomOut', zoomRegex);
    }
  }.bind(this));
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
  var profile = this.container.find('#profile select').empty();
  this.selectProfiles_ = profile.select2({
    data: genes,
    multiple: true
  });
  this.selectProfiles_.select2('val', geneProfiles);
  this.container.find('#profile .select2-container').css({
    width: '100%'
  });
};

/**
 * Adds the cell info into a given container.
 * @param {string} geneName Gene name of which info is to be displayed.
 * @param {string} conditionName Condition name of which info is to be
 *     displayed.
 * @param {number} value Value of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.ExpressionPanel.prototype.setCellInfo_ = function(geneName,
    conditionName, value, container) {
  container.html(/** @type {string} */
    (this.container.find('#cell-info-template').html()));
  container.children('#gene').children('span')
    .text(geneName);
  container.children('#condition').children('span')
    .text(conditionName);
  container.children('#value').children('span')
    .text(value + '');
};

/**
 * Hides all cell info boxes.
 */
genotet.ExpressionPanel.prototype.hideCellInfo = function() {
  this.container.find('#cell-info').slideUp();
};

/**
 * Displays a tooltip around cursor about a hovered cell.
 * @param {string} geneName Gene Name being hovered.
 * @param {string} conditionName Condition Name being hovered.
 * @param {number} value Value of which info is to be displayed.
 */
genotet.ExpressionPanel.prototype.tooltipHeatmap = function(geneName,
    conditionName, value) {
  var tooltip = genotet.tooltip.create();
  this.setCellInfo_(geneName, conditionName, value, tooltip);
  tooltip.find('.close').remove();
};

/**
 * Displays the info box for expression cell.
 * @param {string} geneName Gene Name of which the info is to be displayed.
 * @param {string} conditionName Condition Name of which the info is to be
 *     displayed.
 * @param {number} value Value of which info is to be displayed.
 */
genotet.ExpressionPanel.prototype.displayCellInfo = function(geneName,
    conditionName, value) {
  var info = this.container.find('#cell-info').hide().slideDown();
  this.setCellInfo_(geneName, conditionName, value, info);
  info.find('.close').click(function() {
    this.hideCellInfo();
  }.bind(this));
};

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
    showConditionLabels: false,
    showProfiles: true,
    showTfaProfiles: false,
    autoScaleGradient: true
  });

  /**
   * Selection of genes to profile.
   * @private {select2}
   */
  this.selectProfiles_ = null;

  /**
   * Input type for genes update.
   * @private {boolean}
   */
  this.isGeneRegex_ = false;

  /**
   * Input type for conditions update.
   * @private {boolean}
   */
  this.isConditionRegex_ = false;

  /**
   * Flag of matrix file select is open or not.
   * @private {boolean}
   */
  this.fileSelectIsOpen_ = false;
};

genotet.utils.inherit(genotet.ExpressionPanel, genotet.ViewPanel);

/** @inheritDoc */
genotet.ExpressionPanel.prototype.template = 'dist/html/expression-panel.html';

/** @inheritDoc */
genotet.ExpressionPanel.prototype.dataLoaded = function() {
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
      var geneName = event.params.data.text;
      this.signal('addGeneProfile', geneName);
    }.bind(this))
    .on('select2:unselect', function(event) {
      var geneName = event.params.data.text;
      this.signal('removeGeneProfile', geneName);
    }.bind(this));

  // Input type update
  // TODO(Liana): Get view name by view object directly.
  var viewName = this.container.attr('id').replace('panel-view-', '');
  this.container.find('#gene-input input')
    .attr('name', viewName + '-gene-optradio');
  this.container.find('#condition-input input')
    .attr('name', viewName + '-condition-optradio');

  this.container.find('#gene-input label[name=regex] input')
    .click(function() {
      this.isGeneRegex_ = true;
    }.bind(this));
  this.container.find('#gene-input label[name=string] input')
    .click(function() {
      this.isGeneRegex_ = false;
    }.bind(this));
  this.container.find('#condition-input label[name=regex] input')
    .click(function() {
      this.isConditionRegex_ = true;
    }.bind(this));
  this.container.find('#condition-input label[name=string] input')
    .click(function() {
      this.isConditionRegex_ = false;
    }.bind(this));

  // Gene update
  ['setGene', 'addGene', 'removeGene'].forEach(function(method) {
    this.container.find('#genes #' + method).click(function() {
      var input = this.container.find('#genes input');
      var geneInput = input.val().toString();
      if (geneInput == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');

      var geneNames = this.formatGeneInput(this.isGeneRegex_, geneInput);
      if (geneNames.length == 0) {
        genotet.warning('no genes found');
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
      var conditionInput = input.val().toString();
      if (conditionInput == '') {
        genotet.warning('missing input condition selection');
        return;
      }
      input.val('');

      var conditionNames = this.formatConditionInput(this.isConditionRegex_,
        conditionInput);
      if (conditionNames.length == 0) {
        genotet.warning('no conditions found');
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
      var zoomStatus = this.data.zoomStack.pop();
      this.signal('expressionZoomOut', zoomStatus);
    }
  }.bind(this));

  // Load expression list
  this.signal('loadExpressionList');
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
 * Updates the matrix list for panel after loading expression list.
 */
genotet.ExpressionPanel.prototype.updateFileListAfterLoading = function() {
  if (this.fileSelectIsOpen_) {
    return;
  }
  var fileNames = genotet.data.files.expressionFiles.map(function(dataInfo) {
    return {
      id: dataInfo.fileName,
      text: dataInfo.matrixName + ' (' + dataInfo.fileName + ')'
    };
  });
  var select = this.container.find('#matrix select').select2({
    data: fileNames,
    width: '100%'
  });
  select.val(this.data.matrixInfo.fileName).trigger('change');

  // Set matrix fileName
  select.on('select2:select', function(event) {
    this.fileSelectIsOpen_ = false;
    var fileName = event.params.data.id;
    this.data.matrixInfo.fileName = fileName;
    this.signal('updateMatrix', {
      fileName: fileName
    });
  }.bind(this));

  select.on('select2:open', function() {
    this.fileSelectIsOpen_ = true;
    this.signal('loadExpressionList');
  }.bind(this));
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
 * Adds the cell info into a given container.
 * @param {string} geneName Gene name of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.ExpressionPanel.prototype.setProfileInfo_ = function(geneName,
                                                          container) {
  container.html(/** @type {string} */
    (this.container.find('#profile-info-template').html()));
  container.children('#profile-gene').children('span')
    .text(geneName);
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
 * Displays a tooltip around cursor about a hovered profile.
 * @param {string} geneName Gene Name being hovered.
 */
genotet.ExpressionPanel.prototype.tooltipProfile = function(geneName) {
  var tooltip = genotet.tooltip.create();
  this.setProfileInfo_(geneName, tooltip);
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

/**
 * @param {boolean} isGeneRegex Gene input type that is regex or string.
 * @param {string} geneInput Gene input.
 * @return {!Array<string>} geneNames Names for gene selection.
 */
genotet.ExpressionPanel.prototype.formatGeneInput = function(isGeneRegex,
                                                              geneInput) {
  var geneNames = [];
  if (isGeneRegex) {
    var geneRegex = RegExp(geneInput, 'i');
    geneNames = Object.keys(this.data.matrixInfo.allGeneNames)
      .filter(function(geneName) {
        return geneName.match(geneRegex);
      });
  } else {
    var inputWords = geneInput.toLowerCase().split(/[,\s]+/g);
    geneNames = inputWords.reduce(function(result, name) {
      if (name !== '' && name in this.data.lowerGeneNames) {
        result.push(this.data.lowerGeneNames[name]);
      }
      return result;
    }.bind(this), []);
  }
  return geneNames;
};

/**
 * @param {boolean} isConditionRegex Gene input type that is regex or string.
 * @param {string} conditionInput Condition input.
 * @return {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 */
genotet.ExpressionPanel.prototype.formatConditionInput =
  function(isConditionRegex, conditionInput) {
    var conditionNames = [];
    if (isConditionRegex) {
      var conditionRegex = RegExp(conditionInput, 'i');
      conditionNames = Object.keys(this.data.matrixInfo.allConditionNames)
        .filter(function(conditionName) {
          return conditionName.match(conditionRegex);
        });
    } else {
      var inputWords = conditionInput.toLowerCase().split(/[,\s]+/g);
      conditionNames = inputWords.reduce(function(result, name) {
        if (name !== '' && name in this.data.lowerConditionNames) {
          result.push(this.data.lowerConditionNames[name]);
        }
        return result;
      }.bind(this), []);
    }
    return conditionNames;
  };

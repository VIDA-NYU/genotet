/**
 * @fileoverview Panel of the genome browser component.
 */

'use strict';

/**
 * BindingPanel manages the UI control panel of the genome browser.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function BindingPanel(data) {
  BindingPanel.base.constructor.call(this, data);

  // Set the view options.
  _(this.data.options).extend({
    autoScale: true,
    showOverview: true,
    showBed: true,
    showExons: true
  });

  /**
   * Select2 for gene.
   * @private {select2}
   */
  this.selectGene_;

  /**
   * Select2 for chromosome.
   */
  this.selectChr_;
}

BindingPanel.prototype = Object.create(ViewPanel.prototype);
BindingPanel.prototype.constructor = BindingPanel;
BindingPanel.base = ViewPanel.prototype;

/** @inheritDoc */
BindingPanel.prototype.template = 'components/binding/binding-panel.html';

/** @inheritDoc */
BindingPanel.prototype.panel = function(container) {
  BindingPanel.base.panel.call(this, container);
};

/** @inheritDoc */
BindingPanel.prototype.initPanel = function() {
  var chrs = Data.bindingChrs.map(function (chr, index) {
    return {
      id: chr,
      text: chr
    };
  });
  this.selectChr_ = this.container_.find('#chr select').select2({
    data: chrs
  });
  var genes = Data.bindingGenes.map(function (gene, index) {
    return {
      id: gene,
      text: gene
    };
  });
  this.selectGene_ = this.container_.find('#gene select').select2({
    data: genes
  });
  this.container_.find('.select2-container').css({
    width: '100%'
  });

  // Initialize switches.
  this.container_.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {selector: '#overview', type: 'overview', attribute: 'showOverview'},
    {selector: '#bed', type: 'bed', attribute: 'showBed'},
    {selector: '#exons', type: 'exons', attribute: 'showExons'},
    {selector: '#auto-scale', type: 'auto-scale', attribute: 'autoScale'}
  ].forEach(function(bSwitch) {
      this.container_.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
        function(event, state) {
          this.data.options[bSwitch.attribute] = state;
          this.signal('update', {
            type: bSwitch.type
          });
        }.bind(this));
    }, this);

  // Coordinates setting
  [
    {selector: '#start-coordinate', type: 'start'},
    {selector: '#end-coordinate', type: 'end'}
  ].forEach(function(ui) {
      var update = function() {
        var coordinate = +this.container_.find(ui.selector + ' input').val();
        this.signal('coordinate', {
          type: ui.type,
          coordinate: coordinate
        });
      }.bind(this);
      this.container_.find(ui.selector + ' button')
        .click(update);
      this.container_.find(ui.selector + ' input')
        .on('keypress', function(event) {
          if (event.which == Utils.keyCodes.ENTER) {
            update();
          }
        });
    }, this);

  // Set gene
  this.selectGene_.on('select2:select', function(event) {
    var gene = event.params.data.id;
    this.signal('gene', gene);
  }.bind(this));

  // Set chromosome
  this.selectChr_.on('select2:select', function(event) {
    var chr = event.params.data.id;
    this.signal('chr', chr);
  }.bind(this));

  // Locus search
  this.container_.find('#locus button').click(function() {
    var gene = this.container_.find('#locus input').val();
    this.signal('locus', gene);
  }.bind(this));
};

/**
 * Updates the binding coordinates upon zoom.
 * @param {number} start Start coordinate.
 * @param {number} end End coordinate.
 */
BindingPanel.prototype.updateCoordinates = function(start, end) {
  this.container_.find('#start-coordinate input').val(parseInt(start));
  this.container_.find('#end-coordinate input').val(parseInt(end));
};

/**
 * Updates the chromosome.
 * @param {string} chr Chromosome.
 */
BindingPanel.prototype.updateChr = function(chr) {
  this.selectChr_.val(chr).trigger('change', [{
    passive: true
  }]);
};

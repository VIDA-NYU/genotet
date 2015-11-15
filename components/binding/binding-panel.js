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
   * Select2 for genes.
   * @private {!Array<select2>}
   */
  this.selectGenes_ = [];

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
  this.initChrs_();

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

  // Set chromosome
  this.selectChr_.on('select2:select', function(event) {
    var chr = event.params.data.id;
    this.signal('chr', chr);
  }.bind(this));

  // Locus search
  var findLocus = function() {
    var gene = this.container_.find('#locus input').val();
    this.signal('locus', gene);
  }.bind(this);
  this.container_.find('#locus button')
    .click(function() {
      findLocus();
    });
  this.container_.find('#locus input')
    .on('keypress', function(event) {
      if (event.which == Utils.keyCodes.ENTER) {
        findLocus();
      }
    });

  // Add track
  this.container_.find('#genes #add').click(function() {
    this.signal('addTrack');
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

/**
 * Sets the chromosomes for selection.
 * @private
 */
BindingPanel.prototype.initChrs_ = function() {
  var chrs = Data.bindingChrs.map(function (chr, index) {
    return {
      id: chr,
      text: chr
    };
  });
  var section = this.container_.find('#chr');
  this.selectChr_ = section.children('select').select2({
    data: chrs
  });
  section.find('.select2-container').css({
    width: '100%'
  });
};

/**
 * Adds a select2 for a new track.
 * @private
 */
BindingPanel.prototype.addTrack_ = function() {
  var trackIndex = this.data.tracks.length - 1;
  var ui = this.container_.find('#genes #tracks');
  var uiTrack = ui.find('#track-template').clone()
    .appendTo(ui)
    .attr('id', 'track-' + trackIndex)
    .show();

  var genes = Data.bindingGenes.map(function (gene, index) {
    return {
      id: gene,
      text: gene
    };
  });
  var gene = this.data.tracks[trackIndex].gene;
  var select = uiTrack.children('select').select2({
    data: genes
  });
  select.val(gene).trigger('change');
  this.selectGenes_[trackIndex] = select;

  uiTrack.find('.select2-container').css({
    width: 'calc(100% - 30px)'
  });

  // Removal button
  uiTrack.find('#remove').click(
      this.signal.bind(this, 'removeTrack', trackIndex));

  // Set gene
  select.on('select2:select', function(event) {
    var gene = event.params.data.id;
    this.signal('gene', {
      trackIndex: trackIndex,
      gene: gene
    });
  }.bind(this));
};

/**
 * Updates the gene selected for each track.
 */
BindingPanel.prototype.updateTracks = function() {
  var numTracks = this.data.tracks.length;
  var uiTracks = this.container_.find('#genes .track-gene');
  if (uiTracks.length > numTracks) {
    // Track has been removed.
    for (var index = uiTracks.length - 1; index >= numTracks; index--) {
      this.container_.find('#genes #track-' + index).remove();
    }
  }

  this.data.tracks.forEach(function(track, index) {
    var ui = this.container_.find('#genes #track-' + index);
    if (!ui.length) {
      this.addTrack_();
      ui = $('#gene #track-' + index);
    }
    this.selectGenes_[index].val(track.gene).trigger('change');
  }, this);
  this.container_.find('#genes .glyphicon-remove')
    .css('display', this.data.tracks.length == 1 ? 'none' : '');
};

/**
 * @fileoverview Panel of the genome browser component.
 */

'use strict';

/**
 * BindingPanel manages the UI control panel of the genome browser.
 * @param {!Object} data Data object of the view.
 * @extends {genotet.ViewPanel}
 * @constructor
 */
genotet.BindingPanel = function(data) {
  genotet.BindingPanel.base.constructor.call(this, data);

  // Set the view options.
  _.extend(this.data.options, {
    autoScale: true,
    showOverview: true,
    showBed: true,
    showBedLabels: true,
    showExons: true
  });

  /**
   * Select2 for genes.
   * @private {!Array<!select2>}
   */
  this.selectGenes_ = [];

  /**
   * Select2 for chromosome.
   * @private {select2}
   */
  this.selectChr_;
};

genotet.utils.inherit(genotet.BindingPanel, genotet.ViewPanel);

/** @inheritDoc */
genotet.BindingPanel.prototype.template = 'dist/html/binding-panel.html';

/** @inheritDoc */
genotet.BindingPanel.prototype.initPanel = function() {
  this.initChrs_();

  // Initialize switches.
  this.container.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {selector: '#overview', type: 'overview', attribute: 'showOverview'},
    {selector: '#bed', type: 'bed', attribute: 'showBed'},
    {selector: '#bed-labels', type: 'bed-labels', attribute: 'showBedLabels'},
    {selector: '#exons', type: 'exons', attribute: 'showExons'},
    {selector: '#auto-scale', type: 'auto-scale', attribute: 'autoScale'}
  ].forEach(function(bSwitch) {
      this.container.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
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
        var coordinate = +this.container.find(ui.selector + ' input').val();
        this.signal('coordinate', {
          type: ui.type,
          bedName: this.data.bedName,
          chr: this.data.chr,
          coordinate: coordinate
        });
      }.bind(this);
      this.container.find(ui.selector + ' button')
        .click(update);
      this.container.find(ui.selector + ' input')
        .on('keypress', function(event) {
          if (event.which == genotet.utils.keyCodes.ENTER) {
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
    var gene = this.container.find('#locus input').val();
    this.signal('locus', gene);
  }.bind(this);
  this.container.find('#locus button')
    .click(function() {
      findLocus();
    });
  this.container.find('#locus input')
    .on('keypress', function(event) {
      if (event.which == genotet.utils.keyCodes.ENTER) {
        findLocus();
      }
    });

  // Add track
  this.container.find('#genes #add').click(function() {
    this.signal('addTrack');
  }.bind(this));
};

/**
 * Updates the binding coordinates upon zoom.
 * @param {number} start Start coordinate.
 * @param {number} end End coordinate.
 */
genotet.BindingPanel.prototype.updateCoordinates = function(start, end) {
  this.container.find('#start-coordinate input').val('' + parseInt(start, 10));
  this.container.find('#end-coordinate input').val('' + parseInt(end, 10));
};

/**
 * Updates the chromosome.
 * @param {string} chr Chromosome.
 */
genotet.BindingPanel.prototype.updateChr = function(chr) {
  this.selectChr_.val(chr).trigger('change', [{
    passive: true
  }]);
};

/**
 * Sets the chromosomes for selection.
 * @private
 */
genotet.BindingPanel.prototype.initChrs_ = function() {
  var chrs = genotet.data.bindingChrs.map(function(chr, index) {
    return {
      id: chr,
      text: chr
    };
  });
  var section = this.container.find('#chr');
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
genotet.BindingPanel.prototype.addTrack_ = function() {
  var ui = this.container.find('#genes #tracks');
  var trackIndex = ui.children().length - 1;
  var uiTrack = ui.find('#track-template').clone()
    .appendTo(ui)
    .attr('id', 'track-' + trackIndex)
    .show();

  // Removal button
  uiTrack.find('#remove').click(this.signal.bind(this, 'removeTrack',
    trackIndex));
};

/**
 * Updates the gene selected for each track.
 */
genotet.BindingPanel.prototype.updateTracks = function() {
  this.signal('loadBindingList');

  this.container.find('#genes .glyphicon-remove')
    .css('display', this.data.tracks.length == 1 ? 'none' : '');
};

/**
 * Updates the track list for panel.
 */
genotet.BindingPanel.prototype.updateTrackList = function() {
  var numTracks = this.data.tracks.length;
  var uiTracks = this.container.find('#genes .track-gene');
  if (uiTracks.length > numTracks) {
    // Track has been removed.
    for (var index = uiTracks.length - 1; index >= numTracks; index--) {
      this.container.find('#genes #track-' + index).remove();
    }
  }

  var fileNames = genotet.data.bindingFiles.map(function(dataInfo) {
    return {
      id: dataInfo.fileName,
      text: dataInfo.gene + ' (' + dataInfo.fileName + ')'
    };
  });
  this.data.tracks.forEach(function(track, index) {
    var ui = this.container.find('#genes #track-' + index);

    if (!ui.length) {
      this.addTrack_();
      ui = this.container.find('#genes #track-' + index);
    }
    var select = ui.children('select').select2({
      data: fileNames,
      width: 'calc(100% - 30px)'
    });
    this.selectGenes_[index] = select;
    select.val(track.fileName).trigger('change');

    // Set track fileName
    select.on('select2:select', function(event) {
      var fileName = event.params.data.id;
      this.signal('updateTrack', {
        trackIndex: index,
        fileName: fileName
      });
    }.bind(this));
  }, this);
};

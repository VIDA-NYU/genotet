/**
 * @fileoverview Binding data loader.
 */

'use strict';

/**
 * BindingLoader loads the binding data for the BindingView.
 * @param {!Object} data Data object to be written.
 * @extends {ViewLoader}
 * @constructor
 */
function BindingLoader(data) {
  BindingLoader.base.constructor.call(this, data);

  _(this.data).extend({
    tracks: [],
    exons: []
  });
}

BindingLoader.prototype = Object.create(ViewLoader.prototype);
BindingLoader.prototype.constructor = BindingLoader;
BindingLoader.base = ViewLoader.prototype;

/** @const {number} */
BindingLoader.prototype.LOCUS_MARGIN_RATIO = .1;

/**
 * Loads the binding data for a given gene and chromosome.
 * @param {string} gene Name of the gene.
 * @param {chr} chr ID of the chromosome.
 * @param {number=} opt_track Track # into which the data is loaded.
 * @override
 */
BindingLoader.prototype.load = function(gene, chr, opt_track) {
  var trackIndex = opt_track ? opt_track : this.data.tracks.length;
  this.data.chr = chr;
  this.loadFullTrack(trackIndex, gene, chr);
  this.loadExons_(chr);
};

/**
 * loads the full binding data for all tracks. This usually happens
 * when chromosome is changed.
 */
BindingLoader.prototype.loadFullTracks = function() {
  this.data.tracks.forEach(function(track) {
    var params = {
      type: 'binding',
      gene: track.gene,
      chr: this.data.chr
    };
    // First send query for the overview (without detail range).
    this.signal('loadStart');
    $.get(Data.serverURL, params, function(data) {
      track.overview = data;
      this.updateRanges_();
      this.signal('loadComplete');
    }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load binding overview', params));

    // Send send query for the details.
    _(params).extend({
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.signal('loadStart');
    $.get(Data.serverURL, params, function(data) {
      track.detail = data;
      this.signal('loadComplete');
    }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load binding detail', params));
  }, this);
};

/**
 * Loads the data of a single binding track.
 * @param {number} trackIndex Track index.
 * @param {string} gene Gene name.
 * @param {string} chr Chromosome.
 */
BindingLoader.prototype.loadFullTrack = function(trackIndex, gene, chr) {
  var params = {
    type: 'binding',
    gene: gene,
    chr: chr
  };
  this.signal('loadStart');
  $.get(Data.serverURL, params, function(data) {
    var track = {
      gene: gene,
      overview: data,
      detail: data
    };
    var addTrack = trackIndex == this.data.tracks.length;
    this.data.tracks[trackIndex] = track;
    this.updateRanges_();
    this.signal('loadComplete');
    if (addTrack) {
      // Add one more track.
      this.signal('track');
    }
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load binding overview', params));

  if (this.data.detailXMin) {
    // If we have a previously defined detail range, then keep the range.
    _(params).extend({
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.signal('loadStart');
    $.get(Data.serverURL, params, function(data) {
      // If a new track is created. This may be received before the track object
      // is created. Therefore create an empty object in that case.
      if (!this.data.tracks[trackIndex]) {
        this.data.tracks[trackIndex] = {};
      }

      this.data.tracks[trackIndex].detail = data;
      this.signal('loadComplete');
    }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load binding detail', params));
  }
};

/**
 * Loads the detail binding data for all tracks in a given range.
 * @param {number} xl Range's left coordinate.
 * @param {number} xr Range's right coordinate.
 */
BindingLoader.prototype.loadTrackDetail = function(xl ,xr) {
  this.data.detailXMin = xl;
  this.data.detailXMax = xr;
  this.data.tracks.forEach(function(track) {
    this.signal('loadStart');
    var params = {
      type: 'binding',
      gene: track.gene,
      chr: this.data.chr,
      xl: xl,
      xr: xr
    };
    $.get(Data.serverURL, params, function(data) {
      track.detail = data;
      this.signal('loadComplete');
    }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load binding detail', params));
  }, this);
};

/**
 * Loads the exons info.
 * @param {string} chr Chromosome.
 * @private
 */
BindingLoader.prototype.loadExons_ = function(chr) {
  this.signal('loadStart');
  var params = {
    type: 'exons',
    chr: chr
  };
  $.get(Data.serverURL, params, function(data) {
    this.data.exons = data;
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load binding data', params));
};


/**
 * Queries the locus of a given gene.
 * @param {string} gene Gene name to be searched for.
 */
BindingLoader.prototype.findLocus = function(gene) {
  this.signal('loadStart');
  var params = {
    type: 'locus',
    gene: gene
  };
  $.get(Data.serverURL, params, function(res) {
    if (!res.success) {
      Core.warning('gene locus not found');
    } else {
      var span = res.txEnd - res.txStart;
      this.data.detailXMin = res.txStart - span * this.LOCUS_MARGIN_RATIO;
      this.data.detailXMax = res.txEnd + span * this.LOCUS_MARGIN_RATIO;
      if (res.chr != this.data.chr) {
        this.data.chr = res.chr;
        this.signal('chr', res.chr);
        this.switchChr(res.chr);
      } else {
        this.loadTrackDetail(this.data.detailXMin, this.data.detailXMax);
      }
    }
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot search for gene locus', params));
};

/**
 * Changes the chromosome of the genome browser.
 * @param {string} chr Chromosome.
 */
BindingLoader.prototype.switchChr = function(chr) {
  this.data.chr = chr;
  this.loadExons_(chr);
  this.loadFullTracks();
};

/**
 * Updates the detail and overall ranges for the data.
 * @private
 */
BindingLoader.prototype.updateRanges_ = function() {
  // Computes the overview range across all tracks.
  var overviewXMin = Infinity, overviewXMax = -Infinity;
  this.data.tracks.forEach(function(track) {
    overviewXMin = Math.min(overviewXMin, track.overview.xMin);
    overviewXMax = Math.max(overviewXMax, track.overview.xMax);
  }, this);

  // Overview range may change, then need to reset zoom state.
  this.data.overviewRangeChanged = overviewXMin != this.data.overviewXMin ||
    overviewXMax != this.data.overviewXMax;

  _(this.data).extend({
    overviewXMin: overviewXMin,
    overviewXMax: overviewXMax
  });
  if (!this.data.detailXMin) {
    // If we do not have a detail range yet, then use the overview range.
    _(this.data).extend({
      detailXMin: overviewXMin,
      detailXMax: overviewXMax
    });
  }
};

/**
 * @fileoverview Binding data loader.
 */

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

/**
 * Loads the binding data for a given gene and chromosome.
 * @param {string} gene Name of the gene.
 * @param {chr} chr ID of the chromosome.
 * @param {number=} opt_track Track # into which the data is loaded.
 * @override
 */
BindingLoader.prototype.load = function(gene, chr, opt_track) {
  var trackIndex = opt_track ? opt_track : 0;
  this.loadFullTrack_(trackIndex, gene, chr);
  this.loadExons_(chr);
};

/**
 * Loads the data of a single binding track.
 * @param {number} trackIndex Track index.
 * @param {string} gene Gene name.
 * @param {string} chr Chromosome.
 * @private
 */
BindingLoader.prototype.loadFullTrack_ = function(trackIndex, gene, chr) {
  this.signal('loadStart');
  var params = {
    type: 'binding',
    gene: gene,
    chr: chr
  };
  $.get(Data.serverURL, params, function(data) {
    var track = {
      gene: gene,
      chr: chr,
      overview: data,
      detail: data
    };
    this.data.tracks[trackIndex] = track;
    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load full binding track', params));
};

/**
 * Loads the detail binding data for all tracks in a given range.
 * @param {number} xl Range's left coordinate.
 * @param {number} xr Range's right coordinate.
 */
BindingLoader.prototype.loadTrackDetail = function(xl ,xr) {
  this.data.tracks.forEach(function(track) {
    this.signal('loadStart');
    var params = {
      type: 'binding',
      gene: track.gene,
      chr: track.chr,
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
    .fail(function() {
      Core.error('cannot load binding data', JSON.stringify(params));
      this.signal('loadFail');
    }.bind(this));
};
/*
LoaderHistogram.prototype.loadData = function(identifier) {
  var name = identifier.name,
    chr = identifier.chr,
    range = identifier.range,
    change = identifier.change;

  this.toLocate = range;
  this.trackChanged = change;
  if (identifier.chr == null) {
    chr = '1';
    identifier.chr = '1'; // by default load chr1
  }
  if (this.trackChanged == null) this.trackChanged = true;

  this.lastIdentifier = {'name': name, 'chr': chr};
  this.parentView.layout.showMsg('Loading...');

  if (this.trackChanged) {
    this.parentView.viewdata = {};
    this.loadBindingsmp(name, chr);
    this.loadExons(name, chr);
  }
  if (range == null) this.loadBinding(name, chr);
  else this.loadBinding(name, chr, range.xl, range.xr);

};

LoaderHistogram.prototype.updateData = function(identifier) {
  if (identifier.name == null) {
    identifier.name = this.lastIdentifier.name;
  }
  this.lastIdentifier.name = identifier.name;
  this.lastIdentifier.chr = '1';
  this.locateGene(identifier.srch);
};

LoaderHistogram.prototype.loadBindingsmp = function(name, chr) {
  var loader = this;
  name = utils.encodeSpecialChar(name);
  this.parentView.viewdata.overviewData = null;
  $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: {
      args: 'type=bindingsmp&name=' + name + '&chr=' + chr
      },
    error: function(xhr, status, err) { loader.error('cannot load binding overview\n' + status + '\n' + err); },
      success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data == null || data.length == 0) {
        loader.error('cannot load binding overview, check name and chr (or data not exists)');
        return;
      }
      data.values.sort(function(a, b) { return a.x - b.x; });

      //oader.parentView.viewdata.name = data.name;
      //oader.parentView.viewdata.chr = chr;
      loader.parentView.viewdata.overviewData = data;

      loader.loadComplete();
      }
  });
};

LoaderHistogram.prototype.loadBindingFromLayout = function(acrossChr, name, chr, xl, xr) {
  this.trackChanged = acrossChr;
  this.loadBinding(name, chr, xl, xr);
};

LoaderHistogram.prototype.updateFocus = function(chr, xl, xr) {
  this.parentView.layout.showMsg('Loading...');
  this.loadBinding(this.lastIdentifier.name, chr, xl, xr);
  if (this.lastIdentifier.chr != chr) {
    this.lastIdentifier.chr = chr;
    //console.log(this.parentView.viewname, this.lastIdentifier.name, chr);
    this.loadExons(this.lastIdentifier.name, chr);
  }
};
LoaderHistogram.prototype.updateChr = function(chr) {
  this.parentView.layout.showMsg('Loading...');
  this.loadBinding(this.lastIdentifier.name, chr);
};
// load high resolution binding data of 1000 samples
LoaderHistogram.prototype.loadBinding = function(name, chr, xl, xr) {
  var loader = this, layout = this.parentView.layout;
  name = utils.encodeSpecialChar(name);
  this.parentView.viewdata.histogramData = null;
  var args = 'type=binding&name=' + name + '&chr=' + chr;
  if (xl != null && xr != null) {
    args += '&xl=' + xl + '&xr=' + xr;
    this.toLocate = {'xl': xl, 'xr': xr};    // set toLocate here for the layout range selection, a bit chaos
  }
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp', data: { 'args': args },
    error: function(xhr, status, err) { loader.error('cannot load binding data\n' + status + '\n' + err); },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data == null || data.length == 0) {
        loader.error('cannot load binding sampling');
        return;
      }
      data.values.sort(function(a, b) { return a.x - b.x; });

      loader.parentView.viewdata.name = data.name;
      loader.parentView.viewdata.chr = data.chr;
      loader.parentView.viewdata.histogramData = data;
      loader.loadComplete();
    }
  });
};

LoaderHistogram.prototype.loadExons = function(name, chr) {
  var loader = this;
  this.parentView.viewdata.exonsData = null;
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp',
    data: {
      args: 'type=exons&name=' + name + '&chr=' + chr
    },
    error: function(xhr, status, err) { loader.error('cannot load exons\n' + status + '\n' + err); },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data == null || data.length == 0) {
        loader.error('cannot load exons\ncheck name and chr (or data not exists)');
        return;
      }
      data.sort(function(a, b) { return a.txStart == b.txStart ? (a.txEnd - b.txEnd) : (a.txStart - b.txStart); }); // sort as intervals

      loader.parentView.viewdata.exonsData = data;
      loader.loadComplete();
    }
  });
};

LoaderHistogram.prototype.locateGene = function(name) {
  var loader = this, layout = this.parentView.layout;
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp',
    data: {
      args: 'type=srchexon&name=' + name
    },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data.success == false) {
        loader.error('gene not found');
        return;
      }
      var exonspan = data.txEnd - data.txStart;
      var xl = Math.round(data.txStart - exonspan * 0.1),
        xr = Math.round(data.txEnd + exonspan * 0.1);
      var identifier = {'name': loader.lastIdentifier.name, 'chr': data.chr, 'range': {'xl': xl, 'xr': xr}, 'change': data.chr != loader.lastIdentifier.chr};
      loader.loadData(identifier);
      loader.parentView.postGroupMessage({'action': 'focus', 'chr': data.chr, 'xl': xl, 'xr': xr});
    }
  });
};

LoaderHistogram.prototype.error = function(msg) {
  this.parentView.viewdata = null;
  msg = this.parentView.viewname + ': ' + msg;
  this.parentView.layout.showError();
  options.alert(msg);
  console.error(msg);
};
*/

/**
 * @fileoverview Renderer of the ExpressionView.
 */

'use strict';

/**
 * ExpressionRenderer renders the visualizations for the ExpressionView.
 * @extends {ViewRenderer}
 * @constructor
 */
function ExpressionRenderer() {

}

ExpressionRenderer.prototype = Object.create(ViewRenderer.prototype);
ExpressionRenderer.prototype.constructor = ExpressionRenderer;
ExpressionRenderer.base = ViewRenderer.prototype;

/*
function LayoutHeatmap(htmlid, width, height) {
  this.htmlid = htmlid;
  this.width = width;
  this.rawheight = height;
  this.height = this.rawheight - manager.headerHeight;

  this.compactLayout = false;

  this.uiHeight = 26;

  // polyline properties
  this.lineWidth = this.width;
  this.lineHeight = Math.floor(this.height * 0.2);
  this.tfaHeight = Math.floor(this.height * 0.2);
  this.legendHeight = 20;
  this.legendMarginDown = 5;
  this.legendMarginLeft = 10;
  this.legendMarginTop = 10;
  this.legendBoxSize = 10;
  this.legendFontSize = 7;
  this.legendBoxTextGap = 5;
  this.showTFA = true;
  this.showPlot = false;
  this.showGradient = false;
  //this.condlabelY = this.uiHeight + this.lineHeight - 100;

  // heatmap properties
  this.heatmapMargin = 3;
  this.heatmapWidth = this.width;
  this.heatmapHeight = this.rawheight - this.heatmapMargin * 2 - this.uiHeight;
  // - this.lineHeight - this.tfaHeight;
  this.labelrows = true;
  this.labelcols = true;
  this.heatmapY = this.lineHeight + this.tafHeight;
  this.heatmapFontSize = 8.5;
  this.heatmapFontHSize = 8.5;
  this.heatmapResolution = 10;
  this.resolutionPercent = 50;
  this.heatmapWheeled = false;

  this.autoScale = true;

  this.lineColors = ['#4297d7', '#000080', '#800000', '#008000', '#CC6633', '#CC9933', '#6600FF', '#9999FF'];
  //this.svg = d3.select("#"+this.htmlid).append("svg").attr("height", this.rawheight);
}

LayoutHeatmap.prototype.updateHeatmapSize = function() {
	var hmdata = this.parentView.viewdata.heatmapData;
	if (hmdata == null) return;
	var maxstrlen = 0;
	for (var i = 0; i < hmdata.rownames.length; i++) {
		maxstrlen = Math.max(maxstrlen, hmdata.rownames[i].length);
	}
	this.maxlenRowname = maxstrlen;
	if (this.labelrows == false) this.heatmapLeft = 0;
	else this.heatmapLeft = this.maxlenRowname * this.heatmapFontHSize;

	var newWidth = Math.max(this.heatmapWidth - this.heatmapLeft, 1E-6);
	// rescale x
	var data = hmdata.data;
	for (var i = 0; i < data.length; i++) {
		data[i].x = data[i].rx / this.heatmapWidth * newWidth;
	}
	this.heatmapWidth = this.width - this.heatmapMargin;
	this.heatmapHeight = this.rawheight - this.heatmapMargin;
	this.heatmapY = 0;
	if (this.showPlot) {
		this.heatmapHeight -= this.lineHeight;
		this.heatmapY += this.lineHeight;
	}
	if (this.compactLayout == false) {
		this.heatmapHeight -= this.uiHeight;
	}
	if (this.showTFA && this.showPlot) {
		this.heatmapHeight -= this.tfaHeight;
		this.heatmapY += this.tfaHeight;
	}
	this.mainHeight = this.rawheight - (this.compactLayout ? 0 : this.uiHeight);
};

LayoutHeatmap.prototype.updateLineSize = function() {
	this.lineWidth = this.width;
	if (this.showTFA) {
		this.lineHeight = Math.floor(this.height * 0.2);
		this.tfaHeight = Math.floor(this.height * 0.2);
	}else {
		this.lineHeight = Math.floor(this.height * 0.35);
	}
};

LayoutHeatmap.prototype.reloadData = function() {
	this.removeLayout();
	this.initLayout();
	this.renderLayout();
};

LayoutHeatmap.prototype.initLayout = function() {
	this.data = this.parentView.viewdata;
	if (this.compactLayout == false) this.renderUI();
	this.prepareLine();
	this.updateLineSize();
	this.updateHeatmapSize();
};

LayoutHeatmap.prototype.removeLayout = function() {
	$('#'+ this.htmlid + " div[name='ui']").remove();
	$('#'+ this.htmlid + ' #hint').remove();
	$('#'+ this.htmlid + ' #layoutwrapper').remove();
	//$("#"+this.htmlid+" #heatmapwrapper").remove();
};

LayoutHeatmap.prototype.renderLayout = function() {
	$('#'+ this.htmlid).append("<div id='layoutwrapper' class='renderdiv'></div>");
	$('#'+ this.htmlid + ' #layoutwrapper').css({'width': manager.embedSize(this.width), 'height': manager.embedSize(this.mainHeight)});

	if (this.showPlot) this.updateLine();
	this.renderHeatmap();
};

LayoutHeatmap.prototype.prepareLine = function() {
	this.lines = this.parentView.viewdata.lineData;
	this.maxval = this.tfaMaxval = 0;
	this.minval = this.tfaMinval = 1E10;
	for (var i = 0; i < this.lines.length; i++) {
		this.maxval = Math.max(Math.max.apply(null, this.lines[i].values), this.maxval);
		this.minval = Math.min(Math.min.apply(null, this.lines[i].values), this.minval);
		for (var j = 0; j < this.lines[i].tfaValues.length; j++) {
			this.tfaMaxval = Math.max(this.tfaMaxval, this.lines[i].tfaValues[j].value);
			this.tfaMinval = Math.min(this.tfaMinval, this.lines[i].tfaValues[j].value);
		}
		this.lines[i].color = this.lineColors[i];
	}
	var valspan = this.maxval - this.minval, tfavalspan = this.tfaMaxval - this.tfaMinval;
	this.maxval += valspan * 0.1; this.minval -= valspan * 0.1;
	this.tfaMaxval += tfavalspan * 0.1; this.tfaMinval -= tfavalspan * 0.1;
	this.maxvalAll = this.maxval; this.minvalAll = this.minval;
	this.tfaMaxvalAll = this.tfaMaxval; this.tfaMinvalAll = this.tfaMinval;
};

LayoutHeatmap.prototype.updateLine = function() {
	$('#'+ this.htmlid + ' #layoutwrapper svg').remove();
	var layout = this;
	this.svg = d3.select('#'+ this.htmlid + ' #layoutwrapper').insert('svg', '#heatmap')
		.style('width', manager.embedSize(this.lineWidth))
		.style('height', this.lineHeight + (this.showTFA ? this.tfaHeight : 0));
	this.svg.selectAll('#condline').data([{}]).enter().append('line')	// condline
		.attr('id', 'condline').attr('class', 'condline');
	this.svg.selectAll('#condtext').data([{}]).enter().append('text')	// condtext
		.attr('id', 'condtext').attr('class', 'condtext');
	this.svg.selectAll('#tfacondtext').data([{}]).enter().append('text')	// tfacondtext
		.attr('id', 'tfacondtext').attr('class', 'condtext');

	var lines = new Array();
	var cntline = 0;
	var selcols = this.parentView.viewdata.heatmapData.selcols;
	var n = this.parentView.viewdata.heatmapData.numcols;
	var curmin = 1E10, curmax = -1E10;
	var curtfamin = 1E10, curtfamax = -1E10;
	for (var i = 0; i < this.lines.length; i++) {
		if (this.lines[i].visible == false) continue;
		// expmat data
		var shownVals = new Array(), vals = new Array(), dots = new Array();
		var colmap = {}, vj = 0; // mapping of visible cols
		for (var j = 0; j < this.lines[i].values.length; j++) {
			if (selcols[j] == null) continue;
			shownVals.push(this.lines[i].values[j]);
			colmap[j] = vj++;
			curmax = Math.max(curmax, this.lines[i].values[j]);
		    curmin = Math.min(curmin, this.lines[i].values[j]);
		}
		for (var j = 0; j < shownVals.length - 1; j++) vals.push([shownVals[j], shownVals[j + 1]]);
		vals.push([shownVals[shownVals.length - 1], shownVals[shownVals.length - 1]]);
		for (var j = 0; j < shownVals.length; j++) dots.push({'value': shownVals[j], 'lineid': cntline, 'index': j});

		// TFA data
		var shownTFAVals = new Array(), tfavals = new Array(), tfadots = new Array();
		if (this.showTFA) {
			for (var j = 0; j < this.lines[i].tfaValues.length; j++) {
				if (selcols[this.lines[i].tfaValues[j].index] == null) continue;	// skip not visible cols
				shownTFAVals.push({'value': this.lines[i].tfaValues[j].value, 'index': colmap[this.lines[i].tfaValues[j].index]});
				curtfamin = Math.min(curtfamin, this.lines[i].tfaValues[j].value);
				curtfamax = Math.max(curtfamax, this.lines[i].tfaValues[j].value);
			}
			if (shownTFAVals.length > 0) {
				var firstTFA = {'value': shownTFAVals[0].value, 'index': 0};
				var lastTFA = {'value': shownTFAVals[shownTFAVals.length - 1].value, 'index': n};
				tfavals.push([firstTFA, shownTFAVals[0]]);
				for (var j = 0; j < shownTFAVals.length - 1; j++) tfavals.push([shownTFAVals[j], shownTFAVals[j + 1]]);
				tfavals.push([shownTFAVals[shownTFAVals.length - 1], lastTFA]);
				for (var j = 0; j < shownTFAVals.length; j++) {
					tfadots.push({'tfaValue': shownTFAVals[j].value, 'value': shownVals[shownTFAVals[j].index], 'lineid': cntline, 'index': shownTFAVals[j].index});
					dots[shownTFAVals[j].index]['tfaValue'] = shownTFAVals[j].value;
				}
			}
		}
		lines.push({'name': this.lines[i].name, 'color': this.lines[i].color, 'values': vals, 'dots': dots, 'tfaValues': tfavals, 'tfaDots': tfadots});
		cntline++;
	}
	var left = this.heatmapLeft == null ? 0 : this.heatmapLeft;
	var actualWidth = this.labelrows ? this.lineWidth - left : this.lineWidth;
	var offsetLeft = this.labelrows ? left : 0;
	this.appliedMax = this.autoScale ? curmax : this.maxvalAll;
	this.appliedMin = this.autoScale ? curmin : this.minvalAll;
    this.appliedTfamax = this.autoScale ? curtfamax : this.tfaMaxval;
	this.appliedTfamin = this.autoScale ? curtfamin : this.tfaMinval;
	for (var i = 0; i < lines.length; i++) {
		this.svg.selectAll('#line'+ i).data(lines[i].values).enter().append('line')
			.attr('class', 'polyline')
			.attr('stroke', lines[i].color)
			.attr('x1', function(d, j) { return offsetLeft + j / n * actualWidth; })
			.attr('y1', function(d) { return (1.0 - (d[0] - layout.appliedMin) / (layout.appliedMax - layout.appliedMin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight;})//(layout.lineHeight-layout.legendMarginDown)+layout.legendMarginDown; })
			.attr('x2', function(d, j) { return offsetLeft + (j + 1) / n * actualWidth; })
			.attr('y2', function(d) { return (1.0 - (d[1] - layout.appliedMin) / (layout.appliedMax - layout.appliedMin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight;}); //(layout.lineHeight-layout.legendMarginDown)+layout.legendMarginDown; })
		this.svg.selectAll('#conddot'+ i).data(lines[i].dots).enter().append('circle')
			.attr('id', function(d) { return 'conddot'+ d.lineid + '_'+ d.index; })
			.attr('class', 'conddot')
			.attr('cx', function(d) { return offsetLeft + d.index / n * actualWidth; })
			.attr('cy', function(d) { return (1.0 - (d.value - layout.appliedMin) / (layout.appliedMax - layout.appliedMin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight;})
			.attr('r', 5)
			.on('mouseenter', function(d) { return layout.highlightCond(d, 'exp'); })
			.on('mouseleave', function(d) { return layout.unhighlightCond(d, 'exp'); });

		if (this.showTFA) {
			this.svg.selectAll('#tfaline'+ i).data(lines[i].tfaValues).enter().append('line')
			.attr('class', 'polyline')
			.attr('stroke', lines[i].color)
			.attr('x1', function(d) { return offsetLeft + d[0].index / n * actualWidth; })
			.attr('y1', function(d) { return layout.lineHeight + (1.0 - (d[0].value - layout.appliedTfamin) / (layout.appliedTfamax - layout.appliedTfamin)) * (layout.tfaHeight - layout.legendHeight) + layout.legendHeight;})//(layout.lineHeight-layout.legendMarginDown)+layout.legendMarginDown; })
			.attr('x2', function(d) { return offsetLeft + d[1].index / n * actualWidth; })
			.attr('y2', function(d) { return layout.lineHeight + (1.0 - (d[1].value - layout.appliedTfamin) / (layout.appliedTfamax - layout.appliedTfamin)) * (layout.tfaHeight - layout.legendHeight) + layout.legendHeight;});
			this.svg.selectAll('#tfaconddot'+ i).data(lines[i].tfaDots).enter().append('circle')
			.attr('id', function(d) { return 'tfaconddot'+ d.lineid + '_'+ d.index; })
			.attr('class', 'conddot')
			.attr('cx', function(d) { return offsetLeft + d.index / n * actualWidth; })
			.attr('cy', function(d) { return layout.lineHeight + (1.0 - (d.tfaValue - layout.appliedTfamin) / (layout.appliedTfamax - layout.appliedTfamin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight;})
			.attr('r', 5)
			.on('mouseenter', function(d) { return layout.highlightCond(d, 'tfa'); })
			.on('mouseleave', function(d) { return layout.unhighlightCond(d, 'tfa'); });
		}
	}

	// legend
	var offsetx = this.legendMarginLeft;
	for (var i = 0; i < lines.length; i++) {
		this.svg.selectAll('#legendbox'+ i).data([lines[i]]).enter().append('rect')
			.attr('class', 'box').attr('fill', lines[i].color)
			.attr('x', offsetx).attr('y', this.legendMarginTop)
			.attr('width', this.legendBoxSize).attr('height', this.legendBoxSize)
			.on('mousedown', function(d) { return layout.mouseDownLegend(d); });
		offsetx += this.legendBoxSize + this.legendBoxTextGap;
		this.svg.selectAll('#legend'+ i).data([{}]).enter().append('text')
			.attr('class', 'legend')
			.attr('x', offsetx).attr('y', this.legendMarginTop + this.legendBoxSize)
			.text(lines[i].name);
		offsetx += lines[i].name.length * this.legendFontSize + this.legendMarginLeft;
	}
};

LayoutHeatmap.prototype.renderHeatmap = function() {
	var layout = this;
	var actualWidth = this.heatmapWidth - this.heatmapLeft;
	var actualLeft = this.labelrows ? this.heatmapLeft : 0;


	$('#'+ this.htmlid + ' #layoutwrapper').append("<canvas id='heatmap'></canvas>");
	$('#'+ this.htmlid + ' #heatmap')
	  .css({'margin-top': this.heatmapMarginTop})
	  .attr('width', manager.embedSize(this.heatmapWidth))
	  .attr('height', manager.embedSize(this.heatmapHeight))
		.addClass('heatmap');

	var hmdata = this.data.heatmapData;
	//$("#"+this.htmlid+" #heatmap").append("<canvas></canvas>");
	//$("#"+this.htmlid+" #heatmap canvas").select("canvas").attr("width", actualWidth).attr("height", this.heatmapHeight);
	var heats = hmdata.data, n = hmdata.n, m = hmdata.m;
	var ctx = $('#'+ this.htmlid + ' #heatmap')[0].getContext('2d');

    if (this.autoScale) {
        var maxcount = Math.ceil(hmdata.max), mincount = Math.floor(hmdata.min);
    }else {
        var maxcount = Math.ceil(hmdata.maxAll), mincount = 0;
    }
    maxcount = Math.max(maxcount, mincount + 1);
    //console.log(hmdata);
	var ruler = [0.0, 0.7, 1.0];
	for (var i = 0; i < ruler.length; i++) {
        ruler[i] = mincount + ruler[i] * (maxcount - mincount);
    }
	var color = d3.scale.linear()
			.domain(ruler)
			.range(['black', 'red', 'yellow']);
	var t = heats.length;

	for (var i = 0; i < n; i++) {
		for (var j = 0; j < m; j++) {
			var c = d3.rgb(color(heats[i * m + j].count));
			var w = j == m - 1 ? actualWidth / m + 1 : heats[i * m + j + 1].x - heats[i * m + j].x;
			var h = i == n - 1 ? this.heatmapHeight / n + 1 : heats[i * m + m + 1].y - heats[i * m + 1].y;
			ctx.fillStyle = 'rgba('+ c.r + ','+ c.g + ','+ c.b + ',1.0)';
			ctx.fillRect(Math.floor(heats[i * m + j].x + actualLeft), Math.floor(heats[i * m + j].y), Math.ceil(w), Math.ceil(h));
			// actualWidth/m+1, this.heatmapHeight/n+1);
		}
	}
	ctx.fillStyle = '#d7d5da';
	ctx.fillRect(0, 0, this.heatmapLeft, this.heatmapHeight);


	ctx.font = '12px Arial';
	ctx.rotate(Math.PI / 2.0);
	if (this.labelcols == true) {
		var cnt = Math.floor(actualWidth / (this.heatmapFontSize));
		var si = Math.max(1, Math.ceil(hmdata.numcols / cnt));
		for (var i = 0; i < hmdata.numcols; i += si) {
			var text = hmdata.colnames[i];
			if (si > 1) text = '...';
			ctx.fillStyle = 'black';
			ctx.fillText(text, 2, -actualLeft - (i + 0.5) / hmdata.numcols * actualWidth + 4);
			ctx.fillStyle = 'black';
			ctx.fillText(text, 3, -actualLeft - (i + 0.5) / hmdata.numcols * actualWidth + 5);
			ctx.fillStyle = 'white';
			ctx.fillText(text, 2, -actualLeft - (i + 0.5) / hmdata.numcols * actualWidth + 5);
		}
	}
	if (this.showGradient) {
		ctx.rotate(-Math.PI / 2.0);
		var lingrad = ctx.createLinearGradient(this.heatmapWidth - 200, 0, this.heatmapWidth, 0);
		lingrad.addColorStop(0, 'black');
		lingrad.addColorStop(0.7, 'red');
		lingrad.addColorStop(1, 'yellow');
		//ctx.fillStyle = "white";
		//ctx.fillRect(actualWidth-201, this.heatmapHeight-21, 201, 16);
		ctx.fillStyle = lingrad;
		ctx.fillRect(this.heatmapWidth - 202, this.heatmapHeight - 27, 200, 25);
		ctx.fillStyle = 'white';
		ctx.fillText(mincount, this.heatmapWidth - 202, this.heatmapHeight - 12);
		ctx.fillStyle = 'black';
		ctx.fillText(maxcount, this.heatmapWidth - (maxcount + '').length * 9, this.heatmapHeight - 12);
		ctx.rotate(+Math.PI / 2.0);
	}
	ctx.fillStyle = 'black';
	ctx.rotate(-Math.PI / 2.0);	// reset rotation
	ctx = $('#'+ this.htmlid + ' #heatmap')[0].getContext('2d');
	ctx.font = '12px Arial';
	ctx.textAlign = 'right';
	if (this.labelrows == true) {
		var cnt = Math.floor(this.heatmapHeight / this.heatmapFontSize);
		var si = Math.max(1, Math.ceil(hmdata.numrows / cnt));
		for (var i = 0; i < hmdata.numrows; i += si) {
			var text = hmdata.rownames[i];
			if (si > 1) text = '...';
			ctx.fillText(text, this.heatmapLeft - 1, (i + 0.5) / hmdata.numrows * this.heatmapHeight + 6);
		}
	}

	this.heatmap = d3.select('#'+ this.htmlid + ' #heatmap');
	this.hmzoom = d3.behavior.zoom();
	this.heatmap.call(
		this.hmzoom
		.on('zoomstart', function(d) { return layout.heatmapZoomstart(); })
		.on('zoom', function(d) { return layout.heatmapZoom(); })
		.on('zoomend', function(d) { return layout.heatmapZoomend(); })
	);
};

LayoutHeatmap.prototype.renderUI = function() {
	var data = this.data;
	var layout = this;
	$('#'+ this.htmlid + ' .ui-widget-header').after("<div name='ui'>" +
	"<span class='uibar-text-bold'>DATA</span>" +
  "<select id='data'>" +
	"<option value='B-Subtilis'>B. Subtilis</option>" +
    "<option value='RNA-Seq'>RNA-seq</option>" +
	'</select>' +
	"<span class='uibar-text-bold'>PROFILE</span><input type='text' id='addline' size='5' title='Add gene to the polyline plot. Usage: regexp.'> " +
	"<span class='uibar-text-bold'>GENES</span><input type='text' id='exprow' size='7' title='Add/remove/select genes in the heatmap. Usage: [add/rm/sel] regexp | regexp. If no action is specified, default behavior is sel.'> " +
	"<span class='uibar-text-bold'>CONDITIONS</span><input type='text' id='expcol' size='7' title='Add/remove/select conditions in the heatmap. Usage: [add/rm/sel] regexp | regexp. If no action is specified, default behavior is sel.'> " +
	'<div>' +
	"<input type='checkbox' id='labelrow' title='Show/hide gene labels in the heatmap'><span>GeneLabel</span>" +
	"<input type='checkbox' id='labelcol' title='Show/hide condidtion labels in the heatmap'><span>CondLabel</span>" +
	"<input type='checkbox' id='showplot' title='Show/hide expression matrix polyline'><span>Plot</span>" +
	"<input type='checkbox' id='showtfa' title='Show/hide TFA data'><span>TFA</span>" +
	"<input type='checkbox' id='showgrad' title='Show/hide gradient in the heatmap'><span>Gradient</span>" +
    "<input type='checkbox' id='autoscale' title='Turn on/off auto gradient scale in the heatmap'><span>AutoScale</span>" +
    "<span style='margin-left:10px'>Resolution</span><span id='resol' style='margin:5px 10px; width:70px; position:absolute;'></span>" +
	'</div>' +
	'</div>');
	//<span style='margin-top:5px;float:right;' title='Adjust the resolution of the heatmap'>Resolution</span>" +


	$('#'+ this.htmlid + ' #resol').slider({'value': this.resolutionPercent})
	.on('slidechange', function(evt, ui) {
		$('#'+ layout.htmlid + ' #heatmap').remove();
		layout.resolutionPercent = ui.value;
		layout.parentView.loader.loadHeatmap(null, null, null, (1.0 - layout.resolutionPercent / 100) * layout.heatmapResolution);
	});
	$('#'+ this.htmlid + ' #labelrow').attr('checked', this.labelrows).change(function() { return layout.toggleLabelrows(); });
	$('#'+ this.htmlid + ' #labelcol').attr('checked', this.labelcols).change(function() { return layout.toggleLablecols(); });
	$('#'+ this.htmlid + ' #showplot').attr('checked', this.showPlot).change(function() { return layout.toggleShowPlot(); });
	$('#'+ this.htmlid + ' #showtfa').attr('checked', this.showTFA).change(function() { return layout.toggleShowTFA(); });
	$('#'+ this.htmlid + ' #showgrad').attr('checked', this.showGradient).change(function() { return layout.toggleShowGradient(); });
	$('#'+ this.htmlid + ' #autoscale').attr('checked', this.autoScale).change(function() { return layout.toggleAutoScale(); });
	$('#'+ this.htmlid + ' #addline').keydown(function(e) { if (e.which == 13) layout.uiUpdate('addline');});
	$('#'+ this.htmlid + ' #exprow').keydown(function(e) { if (e.which == 13) layout.uiUpdate('exprow');});
	$('#'+ this.htmlid + ' #expcol').keydown(function(e) { if (e.which == 13) layout.uiUpdate('expcol');});
	$('#'+ this.htmlid + " #data option[value='" + this.parentView.loader.lastIdentifier.mat + "']").attr('selected', true);
	$('#'+ this.htmlid + ' #data').change(function(e) { return layout.uiUpdate('data');});
	this.uiHeight = $('#'+ this.htmlid + " div[name='ui']").height();
	//$("#"+this.htmlid+" #autoscale").attr("checked", this.autoScale).change(function(){ return layout.toggleAutoScale(); });
};

LayoutHeatmap.prototype.uiUpdate = function(type) {
	var data = this.parentView.viewdata.heatmapData;
	if (type == 'data') {
		var mat = $('#'+ this.htmlid + ' #data option:selected').val();
		if (mat != this.parentView.loader.lastIdentifier.mat) {
				this.parentView.viewdata.lineData = [];
				this.parentView.loader.loadHeatmap(mat);
		}
	}else if (type == 'addline') {
		//this.showPlot = true;
		var srch = $('#'+ this.htmlid + ' #addline').val();
		if (srch == '') return;
		this.parentView.loader.loadLine(null, srch);
		$('#'+ this.htmlid + ' #addline').val('');
	}else if (type == 'exprow' || type == 'expcol') {
		var exprows = 'a^', expcols = 'a^';	// a^ matches nothing
		var rmexprows = 'a^', rmexpcols = 'a^';
		var addrows = false, addcols = false, rmrows = false, rmcols = false;
		if (type == 'exprow') {
			var cmd = $('#'+ this.htmlid + ' #exprow').val().split(' ');
			if (cmd.length == 1) {	// sel
				exprows += '|' + cmd[0];
			}else if (cmd.length != 2) {
				options.alert('invalid syntax, usage: add/rm/sel regexp | regexp');
				return;
			}else {
				if (cmd[0].toLowerCase() == 'add') {
					addrows = true;
					exprows += '|' + cmd[1];
				}else if (cmd[0].toLowerCase() == 'rm') {
					rmexprows = cmd[1];
					rmrows = true;
				}else {
					exprows += '|' + cmd[1];
				}
			}
			addcols = true;
		}
		if (type == 'expcol') {
			var cmd = $('#'+ this.htmlid + ' #expcol').val().split(' ');
			if (cmd.length == 1) {	// sel
				expcols += '|' + cmd[0];
			}else if (cmd.length != 2) {
				options.alert('invalid syntax, usage: add/sel/rm regexp');
				return;
			}else {
				if (cmd[0].toLowerCase() == 'add') {
					addcols = true;
					expcols += '|' + cmd[1];
				}else if (cmd[0].toLowerCase() == 'rm') {
					rmexpcols = cmd[1];
					rmcols = true;
				}else {
					expcols += '|' + cmd[1];
				}
			}
			addrows = true;
		}
		for (var i = 0; i < data.rownames.length; i++) {
			if (rmrows && data.rownames[i].match(RegExp(rmexprows, 'i'))) continue;
			if (rmrows || addrows) exprows += '|^'+ this.filterRegexp(data.rownames[i]) + '$';
		}
		for (var i = 0; i < data.colnames.length; i++) {
			if (rmcols && data.colnames[i].match(RegExp(rmexpcols, 'i'))) continue;
			if (rmcols || addcols) expcols += '|^'+ this.filterRegexp(data.colnames[i]) + '$';
		}
		this.parentView.loader.loadHeatmap(null, exprows, expcols);
	}
};

LayoutHeatmap.prototype.filterRegexp = function(exp) {
	return exp
	  .replace(/\+/g, '\\+')
	  .replace(/\./g, '\\.')
	  .replace(/\(/g, '\\(')
	  .replace(/\)/g, '\\)');	// replace special chars
};

LayoutHeatmap.prototype.toggleAutoScale = function() {
	this.autoScale = !this.autoScale;
	this.reloadData();
};

LayoutHeatmap.prototype.toggleLabelrows = function() {
	this.labelrows = !this.labelrows;
	this.reloadData();
};

LayoutHeatmap.prototype.toggleLablecols = function() {
	this.labelcols = !this.labelcols;
	this.reloadData();
};

LayoutHeatmap.prototype.toggleShowGradient = function() {
	this.showGradient = !this.showGradient;
	this.reloadData();
};

LayoutHeatmap.prototype.toggleAutoScale = function() {
    this.autoScale = !this.autoScale;
    this.reloadData();
};

LayoutHeatmap.prototype.toggleShowTFA = function() {
	this.showTFA = !this.showTFA;
	this.updateLineSize();
	this.updateHeatmapSize();
	this.parentView.loader.loadHeatmap();
};

LayoutHeatmap.prototype.toggleShowPlot = function() {
	this.showPlot = !this.showPlot;
	this.updateLineSize();
	this.updateHeatmapSize();
	this.parentView.loader.loadHeatmap();
};

LayoutHeatmap.prototype.mouseDownLegend = function(d) {
	if (d3.event.button == 2) {	// right click
		var data = this.parentView.viewdata.lineData;
		for (var i = 0; i < data.length; i++) {
			if (data[i].name == d.name) {
				data.splice(i, 1);
				this.updateLine();
				return;
			}
		}
	}
};

LayoutHeatmap.prototype.unhighlightCond = function(d) {
	$('#'+ this.htmlid + ' #condline').attr('visibility', 'hidden');
	$('#'+ this.htmlid + ' #condtext').attr('visibility', 'hidden');
	$('#'+ this.htmlid + ' #tfacondtext').attr('visibility', 'hidden');
	this.svg.selectAll('#conddot'+ d.lineid + '_'+ d.index).attr('class', 'conddot');
	this.svg.selectAll('#tfaconddot'+ d.lineid + '_'+ d.index).attr('class', 'conddot');
};

LayoutHeatmap.prototype.highlightCond = function(d, type) {
	//if(this.parentView.viewdata.heatmapData==null) return;	// prevent racing
	this.unhighlightCond(d);
	var layout = this;
	var n = this.parentView.viewdata.heatmapData.numcols;
	var actualWidth = this.labelrows ? this.lineWidth - this.heatmapLeft : this.lineWidth;
	var offsetLeft = this.labelrows ? this.heatmapLeft : 0;
	this.svg.selectAll('#conddot'+ d.lineid + '_'+ d.index)
		.attr('class', 'conddot_hl');
	this.svg.selectAll('#condline').data([{}])
		.attr('visibility', 'visible')
		.attr('id', 'condline')
		.attr('class', 'condline')
		.attr('x1', offsetLeft + d.index / n * actualWidth).attr('x2', offsetLeft + d.index / n * actualWidth)
		.attr('y1', 0).attr('y2', layout.lineHeight + (this.showTFA ? this.tfaHeight : 0));

	var condtext = this.data.heatmapData.colnames[d.index] + ' '+ d.value.toFixed(2);
	var condx = offsetLeft + d.index / n * actualWidth + 5;
	if (condx + condtext.length * this.legendFontSize >= this.lineWidth) {
		condx -= 10;
		this.svg.selectAll('#condtext').style('text-anchor', 'end');
		this.svg.selectAll('#tfacondtext').style('text-anchor', 'end');
	}else {
		this.svg.selectAll('#condtext').style('text-anchor', 'start');
		this.svg.selectAll('#tfacondtext').style('text-anchor', 'start');
	}
	this.svg.selectAll('#condtext').data([{}])
		.attr('visibility', 'visible')
		.text(condtext)
		.attr('x', condx)
		.attr('y', (1.0 - (d.value - layout.appliedMin) / (layout.appliedMax - layout.appliedMin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight);

	if (this.showTFA) {
		if (d.tfaValue != null) {
			this.svg.selectAll('#tfacondtext').data([{}])
				.attr('visibility', 'visible')
				.text(d.tfaValue.toFixed(2))
				.attr('x', condx)
				.attr('y', this.lineHeight + (1.0 - (d.tfaValue - layout.appliedTfamin) / (layout.appliedTfamax - layout.appliedTfamin)) * (layout.lineHeight - layout.legendHeight) + layout.legendHeight);
		}

		this.svg.selectAll('#tfaconddot'+ d.lineid + '_'+ d.index)
			.attr('class', 'conddot_hl');
	}
};

LayoutHeatmap.prototype.heatmapZoomstart = function() {
	var rect = d3.select('#heatmap')[0][0];
	var mx = d3.mouse(rect)[0], my = d3.mouse(rect)[1];
	this.dragboxTL = [mx, my];
};

LayoutHeatmap.prototype.heatmapZoom = function() {
	if (this.heatmapWheeled) return; // ignore wheel
	if (d3.event.scale != null && d3.event.scale != 1) {
		this.heatmapWheeled = true;
		return; // ignore wheel
	}
	var layout = this;
	var rect = d3.select('#heatmap')[0][0];
	var mx = d3.mouse(rect)[0], my = d3.mouse(rect)[1];
	this.dragboxBR = [mx, my];
	var tl = this.dragboxTL, br = this.dragboxBR;
	var xl = Math.min(tl[0], br[0]), xr = Math.max(tl[0], br[0]),
		yl = Math.min(tl[1], br[1]), yr = Math.max(tl[1], br[1]);
	$('#'+ this.htmlid + ' #layoutwrapper #selregion').remove();
	$('#'+ this.htmlid + ' #layoutwrapper').prepend("<div id='selregion' class='heatmapsel'></div>");
	$('#'+ this.htmlid + ' #layoutwrapper #selregion').css({
		'margin-left': xl + 'px', 'margin-top': (yl + layout.heatmapY) + 'px',
		'width': (xr - xl) + 'px', 'height': (yr - yl) + 'px',
	});
};

LayoutHeatmap.prototype.heatmapZoomend = function() {
	if (this.heatmapWheeled) {
		this.heatmapWheeled = false;
		this.hmzoom.scale(1);
		return; // ignore wheel
	}
	var rect = d3.select('#heatmap')[0][0];
	var mx = d3.mouse(rect)[0], my = d3.mouse(rect)[1];
	this.dragboxBR = [mx, my];
	var tl = this.dragboxTL, br = this.dragboxBR;
	var xl = Math.min(tl[0], br[0]), xr = Math.max(tl[0], br[0]),
		yl = Math.min(tl[1], br[1]), yr = Math.max(tl[1], br[1]);
	var data = this.data.heatmapData;
	var actualWidth = this.labelrows ? this.heatmapWidth - this.heatmapLeft : this.heatmapWidth;
	xr = Math.min(xr, actualWidth);
	yr = Math.min(yr, this.heatmapHeight);
	xl *= data.numcols / actualWidth;
	xr *= data.numcols / actualWidth;
	yl *= data.numrows / this.heatmapHeight;
	yr *= data.numrows / this.heatmapHeight;
	xl = Math.floor(xl); xr = Math.floor(xr); if (xr >= data.numcols) xr = data.numcols - 1;
	yl = Math.floor(yl); yr = Math.floor(yr); if (yr >= data.numrows) yr = data.numrows - 1;
	var exprows = 'a^', expcols = 'a^';
	for (var i = yl; i <= yr; i++) exprows += '|^'+ this.filterRegexp(data.rownames[i]) + '$';
	for (var i = xl; i <= xr; i++) expcols += '|^'+ this.filterRegexp(data.colnames[i]) + '$';
	this.parentView.loader.loadHeatmap(null, exprows, expcols);
	$('#'+ this.htmlid + ' #layoutwrapper #selregion').remove();
};

LayoutHeatmap.prototype.showMsg = function(msg, ui) {
	this.removeLayout();
	if (ui == null) ui = false;
	$('#'+ this.htmlid).append("<div id='hint' class='hint'></div>");
	$('#'+ this.htmlid + ' #hint').text(msg).css({'width': this.width, 'height': this.rawheight - (ui && !this.compactLayou ? this.uiHeight : 0) });
};

LayoutHeatmap.prototype.showError = function() {
	this.showMsg('Oops..this guy is dead. x_X', false);
	this.renderUI();
};

LayoutHeatmap.prototype.updateHeatmap = function() {
	$('#'+ this.htmlid + ' #heatmapwrapper').remove();
	this.renderHeatmap();
};

LayoutHeatmap.prototype.reloadHeatmap = function() {	// called from global
	if (timerView.layout.showPlot) timerView.layout.updateLine();
	timerView.loader.loadHeatmap();
};


LayoutHeatmap.prototype.resizeLayout = function(newsize) {
  if (this.parentView.showHeader == false)
    newsize[1] += manager.headerHeight;

  this.width = newsize[0];
  this.rawheight = newsize[1];
  this.height = this.rawheight - manager.headerHeight;

  $('#' + this.htmlid + ' #layoutwrapper').remove();
  this.updateLineSize();
  if (this.showPlot)
    this.updateLine();
  this.updateHeatmapSize();

  timerView = this.parentView;
  clearTimeout(this.timer);
  this.timer = setTimeout(this.reloadHeatmap, 500);
};


LayoutHeatmap.prototype.setCompact = function(compact) {
	this.compactLayout = compact;
	this.removeLayout();
	this.initLayout();
	this.renderLayout();
};
*/

function View(type, viewname, viewid, width, height, left, top) {
  var view = this;
  this.type = type;
  this.viewname = viewname;
  this.groupid = viewid;

  // html element id assigned by view manager
  this.viewid = viewid;

	this.compactLayout = false;
	this.showHeader = true;
	this.width = width;
	this.height = height;


  this.view = d3.select('body').append('div');

  this.view
  	.attr('id', 'view'+ viewid)
  	.attr('class', 'ui-widget-content view')
  	.style('width', width + 'px')
    .style('height', height + 'px')
  	.style('left', left == null ? '8px': left + 'px')
  	.style('top', top == null ? '8px': top + 'px');


  d3.select('#view'+ viewid).append('h3')
  	.attr('id', 'viewheader'+ viewid)
  	.attr('class', 'ui-widget-header')
  	.text(viewname);

  // initialize layout
  this.init();

  var layout = this.layout;
	this.parentView = null;
	this.childrenView = new Array();
	this.layout.parentView = this;
	if (this.loader) this.loader.parentView = this;

	$('#view'+ this.viewid + ' .ui-icon-gripsmall-diagonal-se')
	  .removeClass('ui-icon-gripsmall-diagonal-se ui-icon'); // hide the handle!

  if (this.type !== 'menu') {
    $('#view' + this.viewid).addClass('viewshadow');
    $('#view' + this.viewid).draggable({
      snap: true,
      handle: 'h3.ui-widget-header',
      start: function(event, ui) {
        view.startPos = ui.position;
      },
      drag: function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        manager.groupMove(view.groupid, view.viewid, {
          top: top,
          left: left
        });
        view.startPos = ui.position;
      },
      stop: function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        manager.groupMove(view.groupid, view.viewid, {
          'top' : top,
          'left' : left
        });
      }
    });
    $('#view' + this.viewid).resizable({
      grid: 10,
      handles: ' n, e, s, w, ne, se, sw, nw',
      resize: function(event, ui) {
        layout.resizeLayout([Math.ceil(ui.size.width), Math.ceil(ui.size.height)]);
      },
      stop: function(event, ui) {
        var wratio = ui.size.width / ui.originalSize.width, hratio = ui.size.height / ui.originalSize.height;
        manager.groupResize(view.groupid, view.viewid, wratio, hratio);
      }
    });
    $('#view' + this.viewid + ' h3:first').append("<button id='closeButton' style='float:right; height:16px; width:16px'></button>");
    $('#view' + this.viewid + ' h3:first').append("<button id='miniButton' style='margin-right:2px; float:right; height:16px; width:16px' title='Minimize view, show/hide UI bar'></button>");
    $('#view' + this.viewid + ' h3:first').append("<button id='helpButton' style='margin-right:2px; float:right; height:16px; width:16px' title='View the help document of this view'></button>");
    if (type != 'menu') {
      $('#view' + this.viewid + ' h3:first').append("<button id='postButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight listeners; Click: add listener; RightClick: remove all listeners'></button>");
      $('#view' + this.viewid + ' h3:first').append("<button id='getButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight listening view; Click: add listening view; RightClick: remove listening view'></button>");
      $('#view' + this.viewid + ' h3:first').append("<button id='groupButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight view group; Click: edit group; RightClick: quit the current group'></button>");
    }

    $('#view' + this.viewid + ' #postButton').button({
      icons: {
        primary: 'ui-icon-signal-diag'
      },
      text: false
    }).mouseover(function() {
      view.highlightChildren();
    }).mouseleave(function() {
      view.unhighlightChildren();
    }).mousedown(function(e) {
      view.postEdit(e);
    });
    $('#view' + this.viewid + ' #groupButton').button({
      icons: {
        primary: 'ui-icon-newwin'
      },
      text: false
    }).mouseover(function() {
      manager.highlightGroup(view.groupid);
    }).mouseleave(function() {
      manager.unhighlightGroup(view.groupid);
    }).mousedown(function(e) {
      view.groupEdit(e);
    });
    $('#view' + this.viewid + ' #getButton').button({
      icons: {
        primary: 'ui-icon-signal'
      },
      text: false
    }).mouseover(function() {
      view.highlightParent();
    }).mouseleave(function() {
      view.unhighlightParent();
    }).mousedown(function(e) {
      view.getEdit(e);
    });
    $('#view' + this.viewid + ' #helpButton').button({
      icons: {
        primary: 'ui-icon-help'
      },
      text: false
    }).click(function() {
      view.help(view.type);
    });
    $('#view' + this.viewid + ' #miniButton').button({
      icons: {
        primary: 'ui-icon-minus'
      },
      text: false
    }).click(function() {
      view.toggleCompactLayout();
    });
    $('#view' + this.viewid + ' #closeButton').button({
      icons: {
        primary: 'ui-icon-close'
      },
      text: false
    }).click(function() {
      closeView(view.viewname);
    });

    $('#view' + this.viewid).mousedown(function() {
      manager.setTopView(view.groupid, view.viewid);
    }).dblclick(function() {
      view.toggleViewheader();
    });
    $('#view' + this.viewid).css({
      'min-width' : 100
    });
    manager.setTopView(this.groupid, this.viewid);
  }
}

View.prototype.help = function(type) {
	window.open('help.html#' + type);
};

View.prototype.close = function() {
	//this.layout.removeLayout();
	d3.select('#view'+ this.viewid).remove();
};

View.prototype.loadData = function(para1, para2, para3, para4) {
	var identifier;
	if (this.type == 'graph') {
		identifier = {
			'net': para1,
			'exp': para2
		};
	}else if (this.type == 'histogram') {
		identifier = {
			'name': para1,
			'chr': para2,
			'gene': para3
		};
	}else if (this.type == 'heatmap') {
		identifier = {
			'mat': para1,
			'name': para2,
			'exprows': para3,
			'expcols': para4
		};
	}
	this.loader.loadData(identifier);
};

View.prototype.updateData = function(para1, para2, para3) {
	var identifier;
	if (this.type == 'graph') {	// show or hide edges
		identifier = {
			'action': para1,
			'data': para2
		};
	}else if (this.type == 'histogram') {
		identifier = {
			'name': para1,
			'srch': para2
		};
	}else if (this.type == 'heatmap') {
		if (para1 == 'node') {
			identifier = {
				'action': para1,
				'name': para2,
				'net': para3
			};
		}else if (para1 == 'link') {
			identifier = {
				'action': para1,
				'source': para2,
				'target': para3
			};
		}

	}
	this.loader.updateData(identifier);
};

View.prototype.getViewMessage = function(msg) {
	if (this.type == 'histogram') {
		if (msg.action == 'select' && msg.type == 'node') {
			var name = msg.para[0]; // get gene name
			this.updateData(null, name);
		}else if (msg.action == 'select' && msg.type == 'link') {
			var sourceName = msg.para[0];
			var targetName = msg.para[1]; // get target gene
			this.updateData(sourceName, targetName);
		}
	}else if (this.type == 'graph') {
		if (msg.action == 'show') {
			this.updateData(msg.action, msg.data);
		}else if (msg.action == 'hide') {
			this.updateData(msg.action, msg.data);
		}else if (msg.action == 'center') {
		}
	}else if (this.type == 'heatmap') {
		if (msg.action == 'select') {
			if (msg.type == 'node') {
				this.updateData('node', msg.para[0], msg.para[1]);	// gene, network
			}else if (msg.type == 'link') {
				this.updateData('link', msg.para[0], msg.para[1]);	// source, target
			}
		}
	}
};

View.prototype.getGroupMessage = function(msg) {
	if (this.type == 'histogram') {
		if (msg.action == 'focus') {
			this.loader.updateFocus(msg.chr, msg.xl, msg.xr);
		}else if (msg.action == 'chr') {
			this.loader.updateChr(msg.chr);
		}
	}
};

View.prototype.postViewMessage = function(msg) {
	for (var i = 0; i < this.childrenView.length; i++) { // pass message to children
		this.childrenView[i].getViewMessage(msg);
	}
};

View.prototype.postGroupMessage = function(msg) {
	manager.announceGroupMessage(msg, this.groupid, this.viewid);
};

View.prototype.highlightChildren = function() {
	for (var i = 0; i < this.childrenView.length; i++) {
		$('#viewheader'+ this.childrenView[i].viewid).addClass('ui-state-highlight');
	}
};

View.prototype.unhighlightChildren = function() {
	for (var i = 0; i < this.childrenView.length; i++) {
		$('#viewheader'+ this.childrenView[i].viewid).removeClass('ui-state-highlight');
	}
};

View.prototype.highlightParent = function() {
	if (this.parentView != null)
		$('#viewheader'+ this.parentView.viewid).addClass('ui-state-highlight');
};

View.prototype.unhighlightParent = function() {
	if (this.parentView != null)
		$('#viewheader'+ this.parentView.viewid).removeClass('ui-state-highlight');
};

View.prototype.postEdit = function(e) {
	if (e.which == 1) {
		Dialog.dialogLink(this.viewname);
	}else {
		this.unhighlightChildren();
		for (var i = 0; i < this.childrenView.length; i++) {
			unlinkView(this.viewname, this.childrenView[i].viewname);
		}
	}
};

View.prototype.getEdit = function(e) {
	if (e.which == 3) {
		this.unhighlightParent();
		unlinkView(this.parentView.viewname, this.viewname);
	}
};

View.prototype.groupEdit = function(e) {
	if (e.which == 1) {
		Dialog.dialogGroup(this.viewname);
	}else if (e.which == 3) {
		// exit from group
		//console.log("quit group")
		manager.unhighlightGroup(this.groupid);
		manager.quitGroup(this.groupid, this.viewid);
	}
};

View.prototype.toggleCompactLayout = function() {
	this.compactLayout = !this.compactLayout;

	//$("#viewheader"+this.viewid).hide();
	if (this.compactLayout == true) {
		var width = $('#view'+ this.viewid).width(), height = $('#view'+ this.viewid).height();
		this.lastWidth = width;
		this.lastHeight = height;
		//width = Math.min(manager.compactWidth[this.type], width);
		height = Math.min(manager.compactHeight[this.type], height);
		this.layout.resizeLayout([width, height]);
		$('#view'+ this.viewid).css({'width': width, 'height': height});
	}else {
		var width = $('#view'+ this.viewid).width(), height = $('#view'+ this.viewid).height();
		this.layout.resizeLayout([this.width, this.lastHeight]);
		$('#view'+ this.viewid).css({'width': this.width, 'height': this.lastHeight});
	}
	this.layout.setCompact(this.compactLayout);
};

View.prototype.toggleViewheader = function() {
	var view = this;
	view.showHeader = !view.showHeader;
	if (!view.showHeader) {
		$('#viewheader'+ view.viewid).hide();
		view.layout.resizeLayout([view.layout.width, $('#view'+ view.viewid).height()]);
	}else {
		$('#viewheader'+ view.viewid).show();
		view.layout.resizeLayout([view.layout.width, $('#view'+ view.viewid).height()]);
	}
};

View.prototype.init = function() {
    if (this.type == 'graph') {
		this.loader = new LoaderGraph();
    	this.layout = new LayoutGraph('view'+ this.viewid, this.width, this.height);  //-$("#viewheader"+this.viewid).outerHeight()
    }else if (this.type == 'histogram') {
		this.loader = new LoaderHistogram();
    	this.layout = new LayoutHistogram('view'+ this.viewid, this.width, this.height);
    }else if (this.type == 'scatterplot') {
    	//this.initScatterplot();
    }else if (this.type == 'palette') {
		//this.initPalette();
	}else if (this.type == 'heatmap') {
		this.loader = new LoaderHeatmap();
		this.layout = new LayoutHeatmap('view'+ this.viewid, this.width, this.height);
	}else if (this.type == 'table') {
		this.loader = {}; // shall be containment later
		//this.loader = new LoaderTable();
		this.layout = new LayoutTable('view'+ this.viewid, this.width, this.height);
	}
};


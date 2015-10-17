/**
 * @fileoverview Contains the definition of the View class.
 */

'use strict';

/**
 * The base View class. Each component view shall inherit this class.
 * @param viewName Name of the view.
 * @constructor
 */
function View(viewName) {
  var view = this;

  /** @private {string} **/
  this.viewName_ = viewName;

  /** @private {string} **/
  this.headerText_ = '';

  $('<div></div>')
    .addClass('view')
    .load('templates/view.html', function() {
      view.container = $(this).appendTo('#main');
      view.init();
    });
  /*
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
        ViewManager.groupMove(view.groupid, view.viewid, {
          top: top,
          left: left
        });
        view.startPos = ui.position;
      },
      stop: function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        ViewManager.groupMove(view.groupid, view.viewid, {
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
        ViewManager.groupResize(view.groupid, view.viewid, wratio, hratio);
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
      ViewManager.highlightGroup(view.groupid);
    }).mouseleave(function() {
      ViewManager.unhighlightGroup(view.groupid);
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
      ViewManager.setTopView(view.groupid, view.viewid);
    }).dblclick(function() {
      view.toggleViewheader();
    });
    $('#view' + this.viewid).css({
      'min-width' : 100
    });
    ViewManager.setTopView(this.groupid, this.viewid);
  }
  */
}

/**
 * Initializes the view: adds the mouse event listeners, sets the header.
 */
View.prototype.init = function() {
  this.container
    .draggable({
      handle: '.view-header',
      snap: true
    })
    .resizable({
      handles: 'all'
    })
    .css({ // TODO(bowen): use better size init mechanism
      width: 500,
      height: 300
    });

  this.headerText(this.viewName_);

  // Set up focus event hook.
  this.container.click(function(event) {
    this.focus();
    // Prevent event from hitting the background, which would blur the view.
    event.stopPropagation();
  }.bind(this));
};

/**
 * Sets the header text of the view. If null, return the current header.
 * @param {string} headerText View header text
 */
View.prototype.headerText = function(headerText) {
  if (!headerText) {
    return this.headerText_;
  }
  this.headerText_ = headerText;
  this.container.find('.view-header')
    .text(this.headerText_);
};

/**
 * Makes the view appear focused.
 */
View.prototype.focus = function() {
  this.container.addClass('focused');
};

/**
 * Removes the focused effect of the view.
 */
View.prototype.blur = function() {
  this.container.removeClass('focused');
};


/*
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
  if (this.type == 'graph') {  // show or hide edges
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
        this.updateData('node', msg.para[0], msg.para[1]);  // gene, network
      }else if (msg.type == 'link') {
        this.updateData('link', msg.para[0], msg.para[1]);  // source, target
      }
    }
  }
};

View.prototype.toggleCompactLayout = function() {
  this.compactLayout = !this.compactLayout;

  //$("#viewheader"+this.viewid).hide();
  if (this.compactLayout == true) {
    var width = $('#view'+ this.viewid).width(), height = $('#view'+ this.viewid).height();
    this.lastWidth = width;
    this.lastHeight = height;
    //width = Math.min(ViewManager.compactWidth[this.type], width);
    height = Math.min(ViewManager.compactHeight[this.type], height);
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
*/
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
  /** @protected {ViewRenderer} */
  this.renderer;
  /** @protected {ViewLoader} */
  this.loader;
  /** @protected {ViewPanel} */
  this.panel;

  /** @private {string} */
  this.viewName_ = viewName;

  /** @private {string} */
  this.headerText_ = '';

  /** @protected {!jQuery} */
  this.container = $('<div></div>')
    .addClass('view')
    .load(this.template, function() {
      this.container.appendTo('#main');
      this.init();
      this.loader.init();
      this.renderer.init();

      // Shall trigger 'ready' event after init.
      this.container.trigger('genotet.ready');
    }.bind(this));

  /** @protected {!Object} */
  this.data = {
    options: {}
  };

  /*
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
 * HTML template of the view.
 * @protected {string}
 */
View.prototype.template = 'components/base/view.html';

/** @const {number} */
View.prototype.MIN_WIDTH = 10;
/** @const {number} */
View.prototype.MIN_HEIGHT = 10;

/**
 * Initializes the view: adds the mouse event listeners, sets the header.
 */
View.prototype.init = function() {
  this.container
    .draggable({
      handle: '.view-header',
      snap: true,
      start: function(event) {
        ViewManager.blurAllViews();
        this.focus();
      }.bind(this)
    })
    .resizable({
      handles: 'all'
    })
    .css({
      width: this.defaultWidth(),
      height: this.defaultHeight()
    });

  var pos = ViewManager.findPosition(this);
  this.container.css(pos);

  this.headerText(this.viewName_);

  // Set up focus event hook.
  this.container.click(function(event) {
    ViewManager.blurAllViews();
    this.focus();
    // Prevent event from hitting the background, which would blur the view.
    event.stopPropagation();
  }.bind(this));

  // Set up close event hook.
  this.container.find('.close').click(function(event) {
    ViewManager.closeView(this);
    this.close();
  }.bind(this));

  // Block pointer click on view loading.
  this.container.find('.loading').click(function(event) {
    event.stopPropagation();
  });

  // Set up data loading callbacks.
  $(this.loader)
    .on('genotet.loading', function() {
      this.renderer.showLoading();
    }.bind(this))
    .on('genotet.loaded', function() {
      this.renderer.hideLoading();
    }.bind(this))
    .on('genotet.loadSuccess', function() {
      this.panel.dataLoaded();
      this.renderer.dataLoaded();
    }.bind(this))
    .on('genotet.loadFail', function() {
      this.renderer.showFailure();
    }.bind(this));
};

/**
 * Sets the view name. If null, return the current view name.
 * @param {?string} name View name.
 */
View.prototype.name = function(name) {
  if (!name) {
    return this.viewName_;
  }
  this.viewName_ = name;
};

/**
 * Sets the header text of the view. If null, return the current header.
 * @param {?string} headerText View header text.
 */
View.prototype.headerText = function(headerText) {
  if (!headerText) {
    return this.headerText_;
  }
  this.headerText_ = headerText;
  this.container.find('#header-text')
    .text(this.headerText_);
};

/**
 * Makes the view appear focused.
 */
View.prototype.focus = function() {
  this.container.addClass('focused');
  this.signal('focus');
  // Re-append to appear on top of other views.
  this.container.appendTo('#main');
};

/**
 * Removes the focused effect of the view.
 */
View.prototype.blur = function() {
  this.container.removeClass('focused');
};

/**
 * Closes the view and removes it from the screen.
 */
View.prototype.close = function() {
  this.container.remove();
};

/**
 * Gets the rectangle area the view occupies.
 * @return {{x: number, y: number, w: number, h: number}}
 */
View.prototype.rect = function() {
  return {
    x: this.container.position().left,
    y: this.container.position().top,
    w: this.container.outerWidth(),
    h: this.container.outerHeight()
  };
};

/**
 * Gets the default width of the view.
 * @return {number} Default view width.
 */
View.prototype.defaultWidth = function() {
  return 500;
};

/**
 * Gets the default height of the view.
 * @return {number} Default view height.
 */
View.prototype.defaultHeight = function() {
  return this.defaultWidth() / (16 / 10);
};

/**
 * Sets the panel container and creates the panel user interface.
 * @param {!jQuery} container jQuery container of the side panel.
 */
View.prototype.createPanel = function(container) {
  this.panel.create(container);
};

/**
 * Triggers a jQuery event on the view.
 * @param {string} eventType Type of event.
 * @param {Object} data Data object to be sent via the event.
 */
View.prototype.signal = function(eventType, data) {
  $(this).trigger('genotet.' + eventType, [data]);
};

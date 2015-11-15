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

  /** @private {boolean} */
  this.sendSignal_ = true;

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
      containment: '#main',
      start: function(event) {
        ViewManager.blurAllViews();
        this.focus(this.sendSignal_);
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
    this.focus(this.sendSignal_);
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
View.prototype.focus = function(sendSignal) {
  this.container.addClass('focused');
  // Re-append to appear on top of other views.
  this.container.appendTo('#main');
  if (sendSignal) {
    this.signal('focus');
  }
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

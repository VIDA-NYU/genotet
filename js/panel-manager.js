/**
 * @fileoverview Panel manager for controlling the side panel.
 */

/** @const */
genotet.panelManager = {};

/** @const {number} */
genotet.panelManager.COLLAPSED_WIDTH = 32;
/** @const {number} */
genotet.panelManager.TRANSITION_TIME = 300;

/**
 * Whether the panel is toggled on.
 * @private {boolean}
 */
genotet.panelManager.showPanel_ = true;

/**
 * Whether sends focused signal..
 * @private {boolean}
 */
genotet.panelManager.sendSignal_ = false;

/**
 * Side panel container.
 * @private {jQuery}
 */
genotet.panelManager.container_ = null;

/**
 * Initializes the side panel.
 */
genotet.panelManager.init = function(e) {
  this.container_ = $('#side-panel');
  this.container_.children('#btn-toggle').click(function() {
    this.togglePanel_();
  }.bind(this));
  $('.sideways').click(function() {
    if (!this.showPanel_) {
      this.togglePanel_();
    }
  }.bind(this));
};

/**
 * Gets the current width of the side panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
genotet.panelManager.getWidth_ = function() {
  return this.container_.find('.tab-content').outerWidth() +
      this.COLLAPSED_WIDTH;
};

/**
 * Toggles the side panel.
 * @private
 */
genotet.panelManager.togglePanel_ = function() {
  this.container_.toggleClass('active');
  this.showPanel_ = !this.showPanel_;
  var rightValue = this.showPanel_ ?
      0 : -(this.getWidth_() - this.COLLAPSED_WIDTH);
  this.container_.animate({
    right: rightValue + 'px'
  }, {
    duration: this.TRANSITION_TIME,
    complete: function() {
      $('#icon-button')
        .toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
    }.bind(this)
  });
};

/**
 * Activate the side panel.
 * @private
 */
genotet.panelManager.activatePanel_ = function(viewID) {
  var tabID = 'panel-tab-' + viewID;
  var tabContentID = 'panel-view-' + viewID;
  $('.sideways li.active').removeClass('active');
  $('#' + tabID).addClass('active');
  $('.tab-content div.active').removeClass('active');
  $('#' + tabContentID).addClass('active');
},

/**
 * Creates a panel with the given name.
 * @param {string} viewName Name of the view.
 */
genotet.panelManager.addPanel = function(view) {
  var viewID = view.name().replace(/\s/g, '-');
  var tabID = 'panel-tab-' + viewID;
  var tabContentID = 'panel-view-' + viewID;
  $('#panel-tab-init').clone()
    .attr('id', tabID)
    .appendTo('.sideways')
    .find('a')
    .attr('href', '#' + tabContentID)
    .append(view.name());
  $('#panel-view-init').clone()
    .attr('id', tabContentID)
    .appendTo('.tab-content');
  $(view).on('genotet.focus', function() {
    var clickedViewID = view.name().replace(/\s/g, '-');
    this.activatePanel_(clickedViewID);
  }.bind(this));
  $('.sideways li a').off().click(function(event) {
    if (!this.showPanel_) {
      this.togglePanel_();
    }
    event.stopPropagation();
    var clickedTabID = $(event.target).parent().attr('id');
    var clickedViewID = clickedTabID.replace('panel-tab-', '');
    var clickedViewName = clickedViewID.replace(/\-/g, ' ');
    var clickedView = genotet.viewManager.views[clickedViewName];
    $('#main div.focused').removeClass('focused');
    clickedView.focus(this.sendSignal_);
    this.activatePanel_(clickedViewID);
  }.bind(this));
  this.container_.show();
  if (!this.showPanel_) {
    this.togglePanel_();
  }
  this.activatePanel_(viewID);
  $('#main div.focused').removeClass('focused');
  view.focus(this.sendSignal_);

var container = $('#panel-view-' + viewID);
return container;
};

/**
 * Closes the given panel.
 * @param {string} viewName Name of the view.
 */
genotet.panelManager.removePanel = function(viewName) {
  var viewID = viewName.replace(/\s/g, '-');
  var tab = $('#panel-tab-' + viewID);
  var panel = $('#panel-view-' + viewID);
  var activated = tab.hasClass('active');
  tab.remove();
  panel.remove();
  if (activated) {
    $('.sideways li').last()
      .find('a')
      .tab('show');
  }
  if ($('.sideways').children().length == 1) {
    // One is the hidden template to be cloned.
    this.container_.hide();
  }
},

/**
 * Closes all panels.
 */
genotet.panelManager.closeAllPanels = function(e){
  var sideways = $('.sideways');
  sideways.empty();
  $('<li><a href="#view-init" data-toggle="tab"></a></li>')
    .attr('id', 'panel-tab-init')
    .appendTo(sideways);

  var tabContent = $('.tab-content');
  tabContent.empty();
  $('<div></div>')
    .addClass('tab-pane active')
    .attr('id', 'panel-view-init')
    .appendTo(tabContent);
  $('#side-panel').css('display', 'none');
};

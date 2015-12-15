/**
 * @fileoverview Panel manager for controlling the side panel.
 */

/** @const */
genotet.panelManager = {};

/** @const {number} */
genotet.panelManager.COLLAPSED_WIDTH = 32;
/** @const {number} */
genotet.panelManager.TRANSITION_TIME = 300;
/** @const {number} */
genotet.panelManager.TOGGLE_BTN_HEIGHT = 50;
/** @const {number} */
genotet.panelManager.TAB_MARGIN_BOTTOM_DIFFERENCE = 20;
/** @const {number} */
genotet.panelManager.TAB_MARGIN_TOP_DIFFERENCE = 73;
/** @const {number} */
genotet.panelManager.TAB_HEIGHT_DIFFERENCE = 2;

/**
 * Whether the panel is toggled on.
 * @private {boolean}
 */
genotet.panelManager.showPanel_ = true;

/**
 * Side panel container.
 * @private {jQuery}
 */
genotet.panelManager.container_ = null;

/**
 * Initializes the side panel.
 */
genotet.panelManager.init = function() {
  genotet.panelManager.container_ = $('#side-panel');
  genotet.panelManager.container_.children('#btn-toggle').click(function() {
    genotet.panelManager.togglePanel_();
  });
  $('.sideways').click(function() {
    if (!genotet.panelManager.showPanel_) {
      genotet.panelManager.togglePanel_();
    }
  });
};

/**
 * Gets the current width of the side panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
genotet.panelManager.getWidth_ = function() {
  return genotet.panelManager.container_.find('.tab-content').outerWidth() +
    genotet.panelManager.COLLAPSED_WIDTH;
};

/**
 * Toggles the side panel.
 * @private
 */
genotet.panelManager.togglePanel_ = function() {
  genotet.panelManager.container_.toggleClass('active');
  genotet.panelManager.showPanel_ = !genotet.panelManager.showPanel_;
  var rightValue = genotet.panelManager.showPanel_ ? 0 :
    -(genotet.panelManager.getWidth_() - genotet.panelManager.COLLAPSED_WIDTH);
  genotet.panelManager.container_.animate({
    right: rightValue + 'px'
  }, {
    duration: genotet.panelManager.TRANSITION_TIME,
    complete: function() {
      $('#icon-button')
        .toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
    }
  });
};

/**
 * Activate the side panel.
 * @param {string} viewID
 * @private
 */
genotet.panelManager.activatePanel_ = function(viewID) {
  var tabID = 'panel-tab-' + viewID;
  var tabContentID = 'panel-view-' + viewID;
  $('.sideways li.active').removeClass('active');
  $('#' + tabID).addClass('active');
  $('.tab-content div.active').removeClass('active');
  $('#' + tabContentID).addClass('active');
};

/**
 * Creates a panel with the given name.
 * @param {!genotet.View} view Name of the view.
 * @return {!jQuery}
 */
genotet.panelManager.addPanel = function(view) {
  var viewID = view.viewID_;
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
    var clickedViewID = view.viewID_;
    this.activatePanel_(clickedViewID);
  }.bind(this));
  this.adjustTabHeight();

  // Adjust tab height.
  $(window).resize(this.adjustTabHeight.bind(this));

  // Remove the click event handler to avoid multiple executions.
  $('.sideways li a').off().click(function(event) {
    event.stopPropagation();
    if (!genotet.panelManager.showPanel_) {
      genotet.panelManager.togglePanel_();
    }
    var clickedTabID = $(event.target).parent().attr('id');
    var clickedViewID = clickedTabID.replace('panel-tab-', '');
    var clickedViewName = clickedViewID.replace(/\-/g, ' ');
    var clickedView = genotet.viewManager.views[clickedViewName];
    genotet.viewManager.blurAllViews();
    clickedView.focus(false);
    genotet.panelManager.activatePanel_(clickedViewID);
  });
  genotet.panelManager.container_.show();
  if (!genotet.panelManager.showPanel_) {
    genotet.panelManager.togglePanel_();
  }
  genotet.panelManager.activatePanel_(viewID);
  genotet.viewManager.blurAllViews();
  view.focus(false);

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
  this.adjustTabHeight();
  if (activated) {
    $('.sideways li').last()
      .find('a')
      .tab('show');
  }
  if ($('.sideways').children().length == 1) {
    // One is the hidden template to be cloned.
    genotet.panelManager.container_.hide();
  }
};

/**
 * Closes all panels.
 */
genotet.panelManager.closeAllPanels = function() {
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

/**
 * Adjust tab height.
 */
genotet.panelManager.adjustTabHeight = function(e) {
  var tabSelector = $('.sideways');
  var tabCount = tabSelector.find('li').length - 1;
  var tabHeight =  tabSelector.find('li:nth-child(2) a').outerWidth();
  var tabContentHeight = $('.tab-content').outerHeight();
  var newTabHeight = Math.floor(
    (tabContentHeight -  this.TAB_HEIGHT_DIFFERENCE - this.TOGGLE_BTN_HEIGHT) / tabCount - 1
  );
  tabSelector
    .find('li')
    .css('margin-bottom', (
      newTabHeight - this.TAB_MARGIN_BOTTOM_DIFFERENCE) + 'px'
    );
  tabSelector
    .find('li:nth-child(2) a')
    .css('margin-top', (
      newTabHeight - this.TAB_MARGIN_TOP_DIFFERENCE) + 'px'
    );
  tabSelector
    .find('li a')
    .css('width', newTabHeight + 'px');
};

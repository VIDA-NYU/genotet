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
 * Side panel container.
 * @private {jQuery}
 */
genotet.panelManager.container_ = null;

/**
 * Initializes the side panel.
 */
genotet.panelManager.init = function() {
  genotet.panelManager.showPanel_ = true;

  genotet.panelManager.container_ = $('#side-panel');
  genotet.panelManager.container_.children('.btn-toggle').click(function() {
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
      $('.icon-button')
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
  var viewID = view.id();
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
    var clickedViewID = view.id();
    genotet.panelManager.activatePanel_(clickedViewID);
  });

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
  $('.sideways').children('li')
    .not('#panel-tab-init')
    .remove();

  $('.tab-content').children('div')
    .not('#panel-view-init')
    .remove();

  $('#side-panel').hide();
};

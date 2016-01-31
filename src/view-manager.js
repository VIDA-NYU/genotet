/**
 * @fileoverview View manager of Genotet.
 */

'use strict';

/** @const */
genotet.viewManager = {};

/**
 * Object that stores all the views. Keys are view names.
 */
genotet.viewManager.views = {};

/**
 * Initializes the view manager.
 */
genotet.viewManager.init = function() {
  genotet.viewManager.views = {};

  var resizeMain = function() {
    $('#main').css({
      width: $(window).width() - genotet.panelManager.COLLAPSED_WIDTH,
      height: $(window).height() - $('.navbar-fixed-top').outerHeight()
    });
  };
  $(window).resize(resizeMain);

  // Need to call once on init. Otherwise main size is not set.
  resizeMain();

  // Allow turning off an alert.
  $('.alert button').click(function() {
    $(this).parent().slideUp();
  });

  // Blur all the views upon clicking on the background.
  $('html').click(function() {
    genotet.viewManager.blurAllViews();
  });
};

/**
 * Creates a view with the given type and name.
 * @param {string} type Type of the view.
 * @param {string} viewName Name of the view.
 * @param {*} params Additional parameters passed to the view.
 */
genotet.viewManager.createView = function(type, viewName, params) {
  if (!viewName) {
    genotet.error('empty view name');
    return;
  }
  if (viewName in genotet.viewManager.views) {
    genotet.error('duplicate view name');
    return;
  }
  if (!params) {
    params = {};
  }

  var newView;
  switch (type) {
    case 'network':
      newView = new genotet.NetworkView(viewName,
        /** @type {genotet.NetworkViewParams} */(params));
      break;
    case 'expression':
      newView = new genotet.ExpressionView(viewName,
        /** @type {genotet.ExpressionViewParams} */(params));
      break;
    case 'binding':
      newView = new genotet.BindingView(viewName,
        /** @type {genotet.BindingViewParams} */(params));
      break;
    default:
      genotet.error('unknown view type');
      return;
  }
  genotet.viewManager.views[viewName] = newView;
  var panelContainer = genotet.panelManager.addPanel(newView);
  newView.createPanel(panelContainer);
};

/**
 * Closes the given view.
 * @param {!genotet.View} view
 */
genotet.viewManager.closeView = function(view) {
  if (!(view.name() in genotet.viewManager.views)) {
    genotet.error('view does not exist, cannot delete');
    return;
  }
  // Remove the view reference.
  delete genotet.viewManager.views[view.name()];
  genotet.panelManager.removePanel(view.name());
  console.log(genotet.linkManager.linkViews);
  for (var type in genotet.linkManager.linkViews) {
    var viewIndex = genotet.linkManager.linkViews[type].indexOf(view);
    if (viewIndex != -1) {
      genotet.linkManager.linkViews[type].splice(viewIndex, 1);
    }
  }
  console.log(genotet.linkManager.linkViews);
};

/**
 * Blurs all the views.
 */
genotet.viewManager.blurAllViews = function() {
  $.each(genotet.viewManager.views, function(name, view) {
    view.blur();
  });
};

/**
 * Closes all views.
 */
genotet.viewManager.closeAllViews = function() {
  $.each(genotet.viewManager.views, function(name, view) {
    view.close();
  });
  genotet.viewManager.views = {};
  genotet.panelManager.closeAllPanels();
  for (var type in genotet.linkManager.linkViews) {
    genotet.linkManager.linkViews[type] = [];
  }
};

/**
 * Finds a position for a newly created view.
 * The function attempts to put the new view to the right or bottom of some
 * existing view.
 * @param {genotet.View} newView The newly created view.
 * @return {{left: number, top: number}}
 */
genotet.viewManager.findPosition = function(newView) {
  var newRect = newView.rect();
  var hasOtherViews = false;
  var candidateRects = [];
  for (var name in genotet.viewManager.views) {
    var view = genotet.viewManager.views[name];
    if (view == newView) {
      // Skip the new view itself.
      continue;
    }
    // Another view has valid container.
    hasOtherViews = true;

    var rect = view.rect();
    // Add candidate rectangles.
    // Put on the right.
    candidateRects.push($.extend({}, newRect, {
      x: rect.x + rect.w,
      y: rect.y
    }));
    // Put at the bottom.
    candidateRects.push($.extend({}, newRect, {
      x: rect.x,
      y: rect.y + rect.h
    }));
  }
  candidateRects.sort(function(r1, r2) {
    return genotet.utils.sign(r1.y - r2.y) || genotet.utils.sign(r1.x - r2.x);
  });
  for (var i = 0; i < candidateRects.length; i++) {
    var rect = candidateRects[i];
    if (!genotet.utils.rectInsideWindow(rect)) {
      // Make sure that the rect is inside the screen window.
      continue;
    }
    var ok = true;
    for (var name2 in genotet.viewManager.views) {
      var view2 = genotet.viewManager.views[name2];
      if (view2 == newView) {
        // Skip the new view itself.
        continue;
      }
      if (genotet.utils.rectIntersect(view2.rect(), rect)) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return {
        left: rect.x,
        top: rect.y
      };
    }
  }
  if (!hasOtherViews) {
    // If no other views have containers, then put the new view at (0, 0).
    return {
      left: 0,
      top: 0
    };
  } else {
    // Other views fully occupy the screen. Put the new view at the center.
    return {
      left: $(window).width() / 2 - newRect.w / 2,
      top: $(window).height() / 2 - newRect.h / 2
    };
  }
};

/**
 * Gets the next available suffix number for the default name of a newly
 * created view. When the number is 1, the number is omitted. Otherwise,
 * the number is appended to the default name, e.g. 'Network 2'.
 * @param {string} defaultName Default name of the view.
 * @return {string} Available suffix.
 */
genotet.viewManager.nextSuffixName = function(defaultName) {
  for (var i = 1;; i++) {
    var name = i == 1 ? defaultName : defaultName + ' ' + i;
    if (!(name in genotet.viewManager.views)) {
      return name;
    }
  }
};

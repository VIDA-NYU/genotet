'use strict';

var ViewManager = {
  views: {},

  init: function () {
  },

  /**
   * Creates a view with the given type and name.
   * @param {stirng} type Type of the view.
   * @param {string} viewName Name of the view.
   * @param {Object} params Additional parameters passed to the view.
   */
  createView: function(type, viewName, params) {
    if (!viewName) {
      Core.error('empty view name');
      return;
    }
    if (viewName in this.views) {
      Core.error('duplicate view name');
      return;
    }
    if (!params) {
      params = {};
    }

    var newView;
    switch(type) {
      case 'network':
        newView = new NetworkView(viewName, params);
        break;
      case 'expression':
        newView = new ExpressionView(viewName, params);
        break;
      case 'binding':
        newView = new BindingView(viewName, params);
        break;
      default:
        Core.error('unknown view type');
        return;
    }
    this.views[viewName] = newView;
    var panelContainer = PanelManager.addPanel(viewName);
    console.log(panelContainer);
    newView.createPanel(panelContainer);
  },

  /**
   * Closes the given view.
   * @param {View} view
   */
  closeView: function(view) {
    if (!(view.name() in this.views)) {
      Core.error('view does not exist, cannot delete');
      return;
    }
    // Remove the view reference.
    delete this.views[view.name()];
    PanelManager.removePanel(view.name());
  },

  /**
   * Blurs all the views.
   */
  blurAllViews: function() {
    $.each(this.views, function(name, view) {
      view.blur();
    });
  },

  /**
   * Closes all views.
   */
  closeAllViews: function () {
    $.each(this.views, function(name, view) {
      view.close();
    });
    this.views = {};
    PanelManager.closeAllPanels();
  },

  /**
   * Finds a position for a newly created view.
   * The function attempts to put the new view to the right or bottom of some
   * existing view.
   * @param {View} newView The newly created view.
   * @return {{left: number, top: number}}
   */
  findPosition: function(newView) {
    var newRect = newView.rect();
    var hasOtherViews = false;
    var candidateRects = [];
    for (var name in this.views) {
      var view = this.views[name];
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
      return Utils.sign(r1.y - r2.y) || Utils.sign(r1.x - r2.x);
    });
    for(var i = 0; i < candidateRects.length; i++) {
      var rect = candidateRects[i];
      if (!Utils.rectInsideWindow(rect)) {
        // Make sure that the rect is inside the screen window.
        continue;
      }
      var ok = true;
      for (var name2 in this.views) {
        var view2 = this.views[name2]
        if (view2 == newView) {
          // Skip the new view itself.
          continue;
        }
        if (Utils.rectIntersect(view2.rect(), rect)) {
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
  },

  /**
   * Gets the next available suffix number for the default name of a newly
   * created view. When the number is 1, the number is omitted. Otherwise,
   * the number is appended to the default name, e.g. 'Network 2'.
   * @param {string} defaultName Default name of the view.
   * @return {number} Available suffix.
   */
  nextSuffixName: function(defaultName) {
    for (var i = 1;; i++) {
      var name = i == 1 ? defaultName : defaultName + ' ' + i;
      if (!(name in this.views)) {
        return name;
      }
    }
  },

  /*
  supportBinding: function (name) {
    name = name.toLowerCase();
    for (var i = 0; i < this.bindingNames.length; i++) {
      if (this.bindingNames[i].toLowerCase() == name) return true;
    }
    return false;
  },

  availViewID: function () {
    var id = 0;
    while (1) {
      var ok = true;
      for (var i = 0; i < this.views.length; i++) {
        if (this.views[i].viewid == id) {
          ok = false;
          break;
        }
      }
      if (ok) return id;
      id++;
    }
  },

  setTopView: function (groupid, viewid) {
    //if (this.topView == viewid) return;
    this.remapZindex();
    for (var i = 0; i < this.views.length; i++) {
      if (this.views[i].content.groupid == groupid) {
        $('#view' + this.views[i].viewid).css({'z-index': this.maxZindex});
        this.topView = this.views[i].viewid;
      }
    }
  },

  remapZindex: function () {
    var prs = [];
    for (var i = 0; i < this.views.length; i++) {
      var idx = $('#view' + this.views[i].viewid).css('z-index');
      if (idx === 'auto') {
        $('#view' + this.views[i].viewid).css('z-index', 0);
        idx = 0;
      }
      prs.push({'viewid': this.views[i].viewid, 'z': idx});
    }
    this.stableSort(prs, 'z');
    //console.log(prs);
    var remap = {}, cnt = 0;
    for (var i = 0; i < prs.length; i++) {
      var z = prs[i].z;
      if (remap[z] == null) {
        remap[z] = cnt++;
      }
      //console.log(prs[i].viewid, remap[z]);
      $('#view' + prs[i].viewid).css('z-index', remap[z]);
    }
    this.maxZindex = prs.length;
  },

  embedSize: function (x) {
    return x - 2 * this.borderWidth;
  },

  getViewNames: function (type, name) {
    if (type == 'togroup') {
      view = this.getView(name);
      var result = new Array();
      for (var i = 0; i < this.views.length; i++) {
        var content = this.views[i].content;
        if (content.groupid != view.groupid && content.type != 'menu') {	// && content.type == view.type
          result.push(this.views[i].viewname);
        }
      }
      return result;
    } else {
      var result = new Array();
      for (var i = 0; i < this.views.length; i++) {
        if (this.views[i].viewtype != 'menu') {
          result.push(this.views[i].viewname);
        }
      }
      return result;
    }
  },



  getViewSize: function (type) {
    var width, height;
    if (type == 'graph' || type == 'heatmap') {
      width = (($('body').innerWidth() - $('#view' + getView('GENOTET').viewid).outerWidth()) >> 1) - 2;
    } else if (type == 'histogram') {
      width = ($('body').innerWidth() - $('#view' + getView('GENOTET').viewid).outerWidth()) - 2;
    } else {
      width = this.defaultWidth[type];
    }
    if (type == 'graph' || type == 'heatmap') {
      height = $(document).height() / 2;
    } else if (type == 'histogram') {
      height = $(document).height() / 3;
    } else if (type == 'menu') {
      height = $(document).height();
    } else {
      height = this.defaultHeight[type];
    }
    return {'width': width, 'height': height};
  },

  getViewPlace: function (width, height, type) {	// find a place to put the view
    if (type == 'menu') {
      return {
        success: true,
        left: $('body').innerWidth() - width - this.menuMarginRight,
        top: 0
      };
    }
    // brute force, NOT clever!!
    var bodywidth = $('body').innerWidth();
    for (var j = 0; ; j++) {	// j+height<=window.innerHeight
      for (var i = 0; i + width <= bodywidth; i++) { // vertical first
        var ok = true;
        for (var k = 0; k < this.views.length; k++) {
          var view = $('#view' + this.views[k].viewid);
          var x = parseInt(view.css('left')),
            y = parseInt(view.css('top')),
            w = view.outerWidth();
          h = view.outerHeight();
          if (j >= -height + y && j < h + y && i >= -width + x && i < w + x) {
            ok = false;
            i = x + w;	// optimized brute-force
            break;
          }
        }
        if (ok) return {'success': true, 'left': i, 'top': j};
      }
    }
    return {'success': false};
  },



  closeView: function (viewname) {
    var found = -1;
    for (var i = 0; i < this.views.length; i++) {
      if (this.views[i].viewname == viewname) {
        found = i;
        break;
      }
    }
    if (found == -1) {
      console.error('cannot close view', viewname, 'view not found');
      return;
    }
    var content = this.views[found].content;
    for (var i = 0; i < this.views.length; i++) {
      if (this.views[i].content.groupid == content.groupid && this.views[i].viewid != content.viewid) {
        var closegroup = false;
        // hard coded directed graph
        if (content.type == 'histogram' && this.views[i].viewtype == content.type) closegroup = true;
        else if (content.type == 'graph' && this.views[i].viewtype == 'table') closegroup = true;
        if (closegroup == false) continue;
        this.views[i].content.groupid = this.views[i].content.viewid;
        closeView(this.views[i].viewname);
        i--;	// otherwise cannot close all, because index are shifted in splice
      }
    }
    for (var i = 0; i < content.childrenView.length; i++)
      content.childrenView[i].parentView = null;
    if (content.parentView != null)
      this.unlinkView(content.parentView, content);	// remove link
    content.close();
    this.views.splice(found, 1);
    this.resetFlags();
  },

  resetFlags: function () {
    this.topView = null;
  },

  getView: function (viewname) {
    for (var i = 0; i < this.views.length; i++) {
      if (this.views[i].viewname == viewname) return this.views[i].content;
    }
    return null;
  },

  setPlace: function (view, top, left) {
    $('#view' + view.viewid).css({'left': left + 'px', 'top': top + 'px'});
  },

  highlightGroup: function (groupid) {
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content;
      if (content.groupid == groupid) $('#viewheader' + content.viewid).addClass('ui-state-highlight');
    }
  },

  unhighlightGroup: function (groupid) {
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content;
      if (content.groupid == groupid) $('#viewheader' + content.viewid).removeClass('ui-state-highlight');
    }
  },

  getViewChildren: function (viewname) {
    var view = this.getView(viewname);
    var result = new Array();
    for (var i = 0; i < view.childrenView.length; i++) {
      result.push(view.childrenView[i].viewname);
    }
    return result;
  },

  unlinkView: function (sourceView, targetView) {
    if (sourceView == null) {
      console.error('Cannot unlink view: sourceView not exist');
      return false;
    }
    if (targetView == null) {
      console.error('Cannot unlink view: targetView not exist');
      return false;
    }
    sourceView.childrenView.splice(sourceView.childrenView.indexOf(targetView), 1);
    targetView.parentView = null;
    return true;
  },

  linkView: function (sourceView, targetView) {
    if (sourceView == null) {
      console.error('Cannot link view: sourceView not exist');
      return false;
    }
    if (targetView == null) {
      console.error('Cannot link view: targetView not exist');
      return false;
    }
    if (targetView.parentView != null) {
      if (targetView.parentView == sourceView) {
        console.error('Cannot link view: views are already linked');
        Options.alert('Cannot link view: views are already linked');
      } else {
        console.error('Cannot link view: ' + targetView.viewname + ' is already listening to ' + targetView.parentView.viewname);
        Options.alert('Cannot link view: ' + targetView.viewname + ' is already listening to ' + targetView.parentView.viewname);
      }
      return false;
    }
    sourceView.childrenView.push(targetView);
    targetView.parentView = sourceView;
    return true;
  },

  groupView: function (sourceView, targetView) {
    if (sourceView == null) {
      console.error('Cannot group view: sourceView not exist');
      return false;
    }
    if (targetView == null) {
      console.error('Cannot group view: targetView not exist');
      return false;
    }
    var gid = targetView.groupid, srcgid = sourceView.groupid;
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content;
      if (content.groupid == srcgid) content.groupid = gid;
    }
    return true;
  },

  groupMove: function (groupid, viewid, delta) {
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content, id = this.views[i].viewid;
      if (content.groupid == groupid && id != viewid) {
        var top = parseInt($('#view' + id).css('top')),
          left = parseInt($('#view' + id).css('left'));
        top += delta.top;
        left += delta.left;
        this.setPlace(content, top, left);
      }
    }
  },

  groupResize: function (groupid, viewid, wratio, hratio) {
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content, id = this.views[i].viewid;
      if (content.groupid == groupid && id != viewid) {
        var width = parseInt($('#view' + id).css('width')),
          height = parseInt($('#view' + id).css('height'));
        width *= wratio;
        height *= hratio;
        content.layout.resizeLayout([width, height]);
        $('#view' + id).css({'width': width, 'height': height});
      }
    }
  },

  quitGroup: function (groupid, viewid) {
    var ngid = -1, view;
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content;
      if (content.viewid == viewid) view = content;
      if (content.groupid == groupid && content.viewid != viewid) ngid = content.viewid;
    }
    if (ngid != -1) {
      for (var i = 0; i < this.views.length; i++) {
        var content = this.views[i].content;
        if (content.groupid == groupid) content.groupid = ngid;
      }
    }
    view.groupid = view.viewid;
  },

  announceGroupMessage: function (msg, groupid, viewid) {
    for (var i = 0; i < this.views.length; i++) {
      var content = this.views[i].content;
      if (content.groupid == groupid && content.viewid != viewid) {
        content.getGroupMessage(msg);
      }
    }
  },

  snapView: function (sourceView, targetView) {
    var target = $('#view' + targetView.viewid);
    var top = parseInt(target.css('top')) + target.innerHeight(),
      left = parseInt(target.css('left'));
    this.setPlace(sourceView, top, left);
  },

  resizeView: function (view, width, height) {
    var viewobj = $('#view' + view.viewid);
    var viewwidth = viewobj.width(), viewheight = viewobj.height();
    if (width == null) width = viewwidth;
    if (height == null) height = viewheight;
    viewobj.css({'width': width, 'height': height});
    view.layout.resizeLayout([width, height]);
  },

  loadPreset: function (type) {
    //closeAllViews();
    //createMenu();
    if (type == 'default') {
      createView('Network', 'graph').loadData('th17', '^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$');
      createView('Expression', 'heatmap').loadData('RNA-Seq', 'BATF');
      createView('Genome Browser', 'histogram').loadData('BATF');
    } else if (type == 'binding') {
      createView('Genome Browser', 'histogram').loadData('FOSL2-Th17');
      createView('Binding B', 'histogram').loadData('BATF');
      createView('Binding C', 'histogram').loadData('IRF4');

      groupView('Genome Browser', 'Binding B');
      groupView('Binding B', 'Binding C');

      getView('Genome Browser').layout.toggleExons();
      getView('Binding B').layout.toggleExons();

      getView('Binding B').layout.toggleOverview();
      getView('Binding C').layout.toggleOverview();

      getView('Binding B').toggleCompactLayout();
      getView('Binding C').toggleCompactLayout();

      this.resizeView(getView('Genome Browser'), null, 140 + 26 + this.headerHeight);
      this.resizeView(getView('Binding B'), null, 100 + this.headerHeight);
      this.resizeView(getView('Binding C'), null, 135 + this.headerHeight);

      getView('Binding B').toggleViewheader();
      getView('Binding C').toggleViewheader();

      this.snapView(getView('Binding B'), getView('Genome Browser'));
      this.snapView(getView('Binding C'), getView('Binding B'));
    } else if (type == 'expression') {
      createView('Network', 'graph').loadData('prediction', 'SpoVT');
      createView('Expression', 'heatmap').loadData('B-Subtilis', 'SpoVT', 'spoVT|fabl|yizc', 'spo');
      linkView('Network', 'Expression');
    } else if (type == 'network') {
      createView('Network', 'graph').loadData('th17', '^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$');
      createView('Network B', 'graph').loadData('confidence', '^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$');
    } else {
      Options.alert('Unknown layout preset');
    }
  }
  */
};

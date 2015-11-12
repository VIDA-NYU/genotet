/**
 * @fileoverview Panel manager for controlling the side panel.
 */


var PanelManager = {
  /** @const {number} */
  COLLAPSED_WIDTH: 32,
  /** @const {number} */
  TRANSITION_TIME: 300,

  /**
   * Whether the panel is toggled on.
   * @private {boolean}
   */
  showPanel_: true,

  /**
   * Side panel container.
   * @private {jQuery}
   */
  container_: null,

  init: function(e) {
    this.container_ = $('#side-panel');
    this.container_.children('#btn-toggle').click(function() {
      this.togglePanel_();
    }.bind(this));
    $('.sideways').click(function() {
      if (!this.showPanel_) {
        this.togglePanel_();
      }
    }.bind(this));
  },

  /**
   * Toggles the side panel.
   * @private
   */
  togglePanel_: function() {
    this.container_.toggleClass('active', !this.showPanel_, {
      duration: this.TRANSITION_TIME,
      complete: function() {
        this.showPanel_ = !this.showPanel_;
        $('#icon-button')
          .toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
      }.bind(this)
    });
  },

  /**
   * Creates a panel with the given name.
   * @param {string} viewName Name of the view.
   */
  addPanel: function(view) {
    var viewID = view.name().replace(/\s/g, '');
    var tabID = 'panel-tab-' + viewID;
    $('#panel-tab-init').clone()
      .attr('id', tabID)
      .appendTo('.sideways')
      .find('a')
      .attr('href', '#panel-view-' + viewID)
      .append(view.name());
    $('#panel-view-init').clone()
      .attr('id', 'panel-view-' + viewID)
      .appendTo('.tab-content');
    $('#' + tabID + ' a').trigger('click');

    this.container_.show();
    if (!this.showPanel_) {
      this.togglePanel_();
    }
    $(view).on('genotet.focus', function() {
      $('#' + tabID + ' a').trigger('click');
    });

    var container = $('#panel-view-' + viewID);
    return container;
  },

  /**
   * Closes the given panel.
   * @param {string} viewName Name of the view.
   */
  removePanel: function(viewName) {
    var viewID = viewName.replace(/\s/g, '');
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
  closeAllPanels: function(e){
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
    $('.side-panel').css('display', 'none');
  }
};

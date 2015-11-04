var PanelManager = {
  TRANSITION_TIME: 300,
  TOGGLE_DISTANCE: 218,

  init: function(e) {
    $('.side-panel').load('templates/side-panel.html', function(e) {
      $('#btnToggle').on('click', function(e) {
        $('#slider').animate({
          'right' : $('#slider').css('right') == '0px' ? - PanelManager.TOGGLE_DISTANCE + 'px': '0px'
        }, PanelManager.TRANSITION_TIME);
        $('#btnToggle').animate({
          'right' : $('#btnToggle').css('right') == '0px' ? PanelManager.TOGGLE_DISTANCE + 'px' : '0px'
        }, PanelManager.TRANSITION_TIME);
        setTimeout(function(e) {
          $('#icon-button').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
        }, PanelManager.TRANSITION_TIME);
      });
      $('.sideways').on('click', function(e) {
        if ($('#btnToggle').css('right') == '0px') {
          $('#btnToggle').trigger('click');
        }
      });
    });
  },

  /**
   * Creates a panel with the given name.
   * @param {string} viewName Name of the view.
   */
  addPanel: function(viewName) {
    var viewID = viewName.replace(/\s/g, '');
    $('#panel-tab-init')
        .clone()
        .attr('id', 'panel-tab-' + viewID)
        .appendTo('.sideways');
    $('#panel-tab-' + viewID + ' a')
        .attr('href', '#panel-view-' + viewID)
        .append(viewName);
    $('#panel-view-init')
        .clone()
        .attr('id', 'panel-view-' + viewID)
        .appendTo('.tab-content');
    $('#panel-tab-' + viewID + ' a[href="#panel-view-' + viewID + '"]').tab('show');
    $('.side-panel').css('display','inline');
    if ($('#btnToggle').css('right') == '0px') {
      $('#btnToggle').trigger('click');
    }
    var container = $('#panel-view-' + viewID);
    return container;
  },

  /**
   * Closes the given panel.
   * @param {string} viewName Name of the view.
   */
  removePanel: function(viewName) {
    var count = $('.sideways')
                    .children()
                        .length - 1;
    var activated = false;
    var viewID = viewName.replace(/\s/g, '');
    if ($('#panel-tab-' + viewID).hasClass('active')) {
      activated = true;
    }
    $('#panel-tab-' + viewID).remove();
    $('#panel-view-' + viewID).remove();
    count--;
    if (activated) {
      $('.sideways li')
          .last()
          .find('a')
          .tab('show');
    }
    $('.side-panel').css('display', count > 0 ? 'inline' : 'none');
  },

  /**
   * Closes all panels.
   */
  closeAllPanels: function(e){
    $('.sideways').empty();
    $('.sideways').append('<li id="panel-tab-init"><a href="#view-init" data-toggle="tab"></a></li>');
    $('.tab-content').empty();
    $('.tab-content').append('<div id="panel-view-init" class="tab-pane active"></div>');
    $('.side-panel').css('display', 'none');
  }
};

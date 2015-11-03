var PanelManager = {
  TRANSITION_TIME: 300,

  init: function(e) {
    $('.panel-manager').load('templates/panel-manager.html', function(e) {
      $('#btnToggle').on('click', function(e) {
        $('#slider').toggle('slide', { direction: 'right' }, PanelManager.TRANSITION_TIME);
        $('#btnToggle').animate({
          'right' : $('#btnToggle').css('right') == '0px' ? '249px' : '0px'
        }, PanelManager.TRANSITION_TIME);
        setTimeout(function(e) {
          $('#icon-button').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
        }, PanelManager.TRANSITION_TIME);
      });
    });
  },

  addPanel: function(viewName) {
    var viewID = viewName.replace(/\s/g, '');
    $('#li-init').clone().attr('id', 'li-' + viewID).appendTo('.sideways');
    $('#li-' + viewID + ' a').attr('href', '#view-' + viewID).append(viewName);
    $('#view-init').clone().attr('id', 'view-' + viewID).appendTo('.tab-content');
    $('#li-' + viewID + ' a[href="#view-' + viewID + '"]').tab('show');
    $('.panel-manager').css('display','inline');
    if ($('#btnToggle').css('right') == '0px') {
      $('#btnToggle').trigger('click');
    }
    var container = $('#view-' + viewID);
    return container;
  },

  removePanel: function(viewName) {
    var count = $('.sideways').children().length - 1;
    var activated = false;
    var viewID = viewName.replace(/\s/g, '');
    if ($('#li-' + viewID).hasClass('active')) {
      activated = true;
    }
    $('#li-' + viewID).remove();
    $('#view-' + viewID).remove();
    count--;
    if (activated) {
      var lastView = $('.sideways li').last().find('a').tab('show');
    }
    $('.panel-manager').css('display', count > -1 ? 'inline' : 'none');
  }

//  TODO(liana): Fixed closeAllPanels function.
//  closeAllPanels: function(e){
//    $('.sideways').empty();
//    $('.tab-content').empty();
//    $('.panel-manager').css('display', 'none');
//  },
};

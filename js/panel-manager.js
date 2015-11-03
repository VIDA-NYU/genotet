var PanelManager = {
  TRANSITION_TIME: 300,

  init: function(e) {
    $('.panel-manager').load('templates/panel-manager.html', function(e) {
      $('#slidebar').on('click', function(e) {
        $('#slider').toggle('slide', { direction: 'right' }, PanelManager.TRANSITION_TIME);
        $('#slidebar').animate({
          'right' : $('#slidebar').css('right') == '0px' ? '249px' : '0px'
        }, PanelManager.TRANSITION_TIME);
        setTimeout(function(e) {
          $('#icon-button').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
        }, PanelManager.TRANSITION_TIME);
      });
    });
  },

  addPanel: function(view) {
    var count = $('.sideways').children().length;
    var viewID = view.name().replace(/\s/g, '');
    $('.sideways').append('<li id="li' + viewID + '"><a href="#' + viewID + '" data-toggle="tab">' + view.name() + '</a></li>');
    $('.tab-content').append('<div class="tab-pane" id="' + viewID + '">property' + count + '</div>');
    $('#li' + viewID + ' a[href="#' + viewID + '"]').tab('show');
    $('.panel-manager').css('display','inline');
    if ($('#slidebar').css('right') == '0px') {
      $('#slidebar').trigger('click');
    }
  },

  removePanel: function(viewName) {
    var count = $('.sideways').children().length - 1;
    var actived = false;
    var viewID = viewName.replace(/\s/g, '');
    if ($('#li' + viewID).hasClass('active')) {
      actived = true;
    }
    $('#li' + viewID).remove();
    $('#' + viewID).remove();
    count--;
    if (actived) {
      $('#li' + viewID + ' a[href="#' + viewID + '"]').tab('show');
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

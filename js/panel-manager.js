// var count = 0;

var PanelManager = {
//$(document).ready(function(){
//  $('#btn-add').click(function(e){
  init: function(e){
    $('.panel-manager').load('templates/panel-manager.html', function(e){
      $('#slidebar').on('click', function(e){
        $('#slider').toggle('slide', { direction: 'right' }, 300);
        $('#slidebar').animate({
          'right' : $('#slidebar').css('right') == '0px' ? '249px' : '0px'
        }, 300);
        setTimeout(function(){
          $('#icon-button').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
        }, 300);
      });
    });
  },

  addPanel: function(view){
//     count++;
    var count = $('.sideways').children().length;
//    e.preventDefault();
//    $('.sideways').append('<li id="li'+count+'"><a href="#view'+count+'" data-toggle="tab">view'+count+'</a></li>');
//    $('.sideways').append('<li id="li'+count+'"><a href="#view'+count+'" data-toggle="tab">'+viewName+'</a></li>');
    var viewID = view.name().replace(/\s/g, '');
    $('.sideways').append('<li id="li'+viewID+'"><a href="#'+viewID+'" data-toggle="tab">'+view.name()+'</a></li>');
    $('.tab-content').append('<div class="tab-pane" id="'+viewID+'">property'+count+'</div>');
    $('#li'+viewID+' a[href="#'+viewID+'"]').tab('show');
    $('.panel-manager').css('display','inline');
    if ($('#slidebar').css('right') == '0px'){ $('#slidebar').trigger('click'); }
  },
//  $('#btn-remove').click(function(e){
//  $.when($.ajax(ViewManager.closeView())).done(function(e){
  removePanel: function(viewName){
    var count = $('.sideways').children().length - 1;
    var actived = false;
//    if ($('#li'+count).hasClass('active') == true){ actived = true; }
    var viewID = viewName.replace(/\s/g, '');
    if ($('#li'+viewID).hasClass('active') == true){ actived = true; }
//    $('#li'+count).remove();
    $('#li'+viewID).remove();
    $('#'+viewID).remove();
    count--;
    if (actived == true){ $('#li'+viewID+' a[href="#'+viewID+'"]').tab('show'); }
    $('.panel-manager').css('display', count > -1 ? 'inline' : 'none');
//  });
  }
//  $('#btn-closeAll').click(function(e){
//  closeAllPanels: function(e){
//  $.when(ViewManager.closeAllViews()).done(function(e){
//    $('.sideways').empty();
//    $('.tab-content').empty();
//    $('.panel-manager').css('display', 'none');
//  };
//});
};

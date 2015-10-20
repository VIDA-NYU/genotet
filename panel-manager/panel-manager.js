$('#tabs').tabs().addClass('ui-tabs-vertical ui-helper-clearfix');
$('#tabs li').removeClass('ui-corner-top').addClass('ui-corner-left');

$('#triangle-button').button({
  icons: {primary: 'ui-icon-triangle-1-e'}
});
var icons = $('#triangle-button').button('option', 'icons');
$('#triangle-button').button('option', 'icons', { primary: 'ui-icon-triangle-1-e' });

$(function(){
  $('#triangle-button').on('click', function(){
    $('.panel-manager').toggle('slide', { direction: 'right' }, 1000);
    $('#triangle-button').animate({
      'margin-right' : $('#triangle-button').css('margin-right') == '0px' ? '195px' : '0px'
    }, 1000);
  });
});

var count = 0;

$(document).ready(function(){
    $('#btn-add').click(function(){
    	count++;
        $('#tabs ul').append("<li id='li"+count+"'><a href='#tabs-"+count+"'>view"+count+"</a></li>");
    	$('#tabs').append("<div id='tabs-"+count+"'>");
        $('#tabs-'+count).append("<h2>view"+count+"</h2>");
        $('#tabs-'+count).append('<p>properties</p>');
        $('#tabs').tabs('refresh');
        $('#tabs').tabs({ active: -1 });
        $('#triangle-button').css('display', count > 0 ? 'inline' : 'none');
        $('.panel-manager').css('display', count > 0 ? 'inline' : 'none');
    });
    $('#btn-remove').click(function(){
        $('#li'+count).remove();
        $('#tabs-'+count).remove();
        $('#tabs').tabs("option", "active", $("#tabs").tabs('option', 'active') > 0 ? $("#tabs").tabs('option', 'active') - 1 : 0);
        count--;
        $('#triangle-button').css('display', count > 0 ? 'inline' : 'none');
        $('.panel-manager').css('display', count > 0 ? 'inline' : 'none');
    });
});

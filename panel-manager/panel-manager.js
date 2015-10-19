/*$(document).ready(function(){
    $('#triangle-button').click(function(){
        $('.panel-manager').animate({
        	width: 'toggle'
        });
    });
    $('#triangle-button').hover(function(){
    	$(this).css('border-left-color', 'gray');
    	}, function(){
    	$(this).css('border-left-color', 'black');
    });
});*/

$('#triangle-button').button({
  icons: {primary: 'ui-icon-triangle-1-e'}
});
var icons = $('#triangle-button').button('option', 'icons');
$('#triangle-button').button('option', 'icons', {primary: 'ui-icon-triangle-1-e'});

$(function(){
    $('#triangle-button').on('click', function(){
        $('.panel-manager').toggle('slide', {direction: 'right'}, 1000);
        $('#triangle-button').animate({
            'margin-right' : $('#triangle-button').css('margin-right') == '0px' ? '195px' : '0px'
        }, 1000);
    });
});

var count = 0;

$(document).ready(function(){
    $('#btn-add').click(function(){
    	count++;
        $('#accordion').append("<div id='panel"+count+"'></div>");
    	$('#panel'+count).append("<h3 id='panel-title"+count+"'><a href='#'>view"+count+"</a></h3>");
        $('#panel'+count).append("<div id='panel-content"+count+"'>properties</div>");
        $('#triangle-button').css('display', count > 0 ? 'inline' : 'none');
        $('.panel-manager').css('display', count > 0 ? 'inline' : 'none');

        (function($) {
            $(function() {
                $('#accordion > div').accordion({header: 'h3', collapsible: true});
            })
        })(jQuery);
    });
    $('#btn-remove').click(function(){
        $('#panel'+count).remove();
        count--;
        $('#triangle-button').css('display', count > 0 ? 'inline' : 'none');
        $('.panel-manager').css('display', count > 0 ? 'inline' : 'none');
    });
});

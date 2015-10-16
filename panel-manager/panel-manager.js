$(document).ready(function(){
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
});

var count = 0;

$(document).ready(function(){
    $('#btn-add').click(function(){
    	count++;
        $('#accordion').append("<div id='panel"+count+"'></div>");
    	$('#panel'+count).append("<h3 id='panel-title"+count+"'><a href='#'>view"+count+"</a></h3>");
        $('#panel'+count).append("<div id='panel-content"+count+"'>properties</div>");
        (function($) {
            $(function() {
                $("#accordion > div").accordion({ header: "h3", collapsible: true });
            })
        })(jQuery);
    });
    $('#btn-remove').click(function(){
        $('#panel'+count).remove();
        count--;
    });
});

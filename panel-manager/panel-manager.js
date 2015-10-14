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
        $('.panel-group').append("<div class='panel panel-default' id='panel"+count+"'></div>");
    	$('#panel'+count).append("<div class='panel-heading' id='panel-heading"+count+"'></div>");
    	$('#panel-heading'+count).append("<h4 class='panel-title' id='panel-title"+count+"'></h4>");
    	$('#panel-title'+count).append("<a data-toggle='collapse' data-target='#collapse"+count+"' href='#collapse"+count+"'>view"+count+"</a>");
    	$('#panel'+count).append("<div id='collapse"+count+"' class='panel-collapse collapse in'>");
    	$('#collapse'+count).append("<div class='panel-body'>properties</div>");
    });
    $('#btn-remove').click(function(){
        $('#panel'+count).remove();
        count--;
    });
});

$('#accordion').on('shown.bs.collapse', function (e) {
   var id = $(e.target).prev().find("[id]")[0].id;
   navigateToElement(id);
})

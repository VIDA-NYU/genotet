$(function(){
  $('#slidebar').on('click', function(){
    $('#slider').toggle('slide', { direction: 'right' }, 300);
    $('#slidebar').animate({
      'right' : $('#slidebar').css('right') == '0px' ? '249px' : '0px'
    }, 300);
    setTimeout(function(){
        $('#icon-button').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
    }, 300);
  });
});

// var count = 0;

$(document).ready(function(){
    $('#btn-add').click(function(e){
        // count++;
        var count = $('.sideways').children().length;
        e.preventDefault();
        $('.sideways').append('<li id="li'+count+'"><a href="#view'+count+'" data-toggle="tab">view'+count+'</a></li>');
        $('.tab-content').append('<div class="tab-pane" id="view'+count+'">property'+count+'</div>');
        $('#li'+count+' a[href="#view'+count+'"]').tab('show');
        $('.panel-manager').css('display', count > -1 ? 'inline' : 'none');
    });
    $('#btn-remove').click(function(){
        var count = $('.sideways').children().length - 1;
        var actived = false;
        if ($('#li'+count).hasClass('active') == true){ actived = true; }
        $('#li'+count).remove();
        $('#view'+count).remove();
        count--;
        if (actived == true){ $('#li'+count+' a[href="#view'+count+'"]').tab('show'); }
        $('.panel-manager').css('display', count > -1 ? 'inline' : 'none');
    });
});

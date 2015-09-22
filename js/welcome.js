var Welcome  = {

  init: function() {
    var wc = this;
    $('body').append('<div id="block" class="block"></div>');
    $('#block').css({
      width: screen.width,
      height: screen.height,
    });
    $('body').append('<div id="welcome" title="Welcome to GENOTET"></div>');

    $('#welcome').append('<p>You may read the help document, load the preset layout, or start a new session.</p>');
    $('#welcome').dialog({
      close: function(){
        $('#block').remove();
      },
      buttons: {
        'Help': function() {
          wc.close();
          window.open('help.html');
        },
        'Default': function(){
          wc.close();
          manager.loadPreset('default');
        },
        'New': function(){
          wc.close();
          Dialog.dialogCreate();
        }
      }
    });
    $('#welcome').addClass('viewshadow');
  },

  close: function() {
    $('#welcome').remove();
    $('#block').remove();
  }

};
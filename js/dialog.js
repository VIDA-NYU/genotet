'use strict';

var Dialog = {

  create: function(params) {
    if (params == null) {
      console.error('undefined params in create');
      return;
    }
    var type = params;
    switch (type) {
      case 'create-view':
        this.createView();
        break;
      case 'create-network':
        this.createNetwork();
        break;
      case 'create-binding':
        this.createBinding();
        break;
    }
  },

  createView: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-view.html', function() {
      modal.modal();
      modal.find('#btnDone').click(function() {
        switch (modal.find('#type').val()) {
          case 'network':
            Dialog.create('create-network');
            break;
          case 'binding':
            Dialog.create('create-binding');
            break;
          default:
            break;
        }
      });
    });
  },

  createNetwork: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-network.html', function() {
      modal.modal();
      modal.find('#btnDone').click(function() {
      });
    });
  },

  createBinding: function() {
    console.log('hi');
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-binding.html', function() {
      modal.modal();
      modal.find('#btnDone').click(function() {
      });
      var chrSelect = modal.find('#chr');
      ViewManager.bindingChrs.forEach(function (chr){
        $('<option></option>')
          .val(chr)
          .text(chr)
          .appendTo(chrSelect);
      });
      modal.find('#data').autocomplete({
        source: ViewManager.bindingNames,
        appendTo: '#modal'
      });
    });
  },
  /*
  dialogLayout = function(type) {
    switch(type){
      case 'create_graph':
        $('#dialog #datadiv').append('' +

        break;
      case 'create_histogram':

        break;
      case 'create_heatmap':
        $('#dialog #datadiv').append('<div id='data'>' +
          '<div> Matrix' +
          '<select id="data">' +
          '<option value="B-Subtilis">B-Subtilis</option>' +
          '<option value="RNA-Seq">RNA-Seq</option>' +
          '</select> </div>' +
          '<div>Profile <input id="plot" size="15" title="Name of gene to be plotted as polyline"></div>' +
          '<div>Genes <input id="gene" size="8" title="Regexp for genes to be shown in the heatmap">' +
          'Conditions <input id="cond" size="8" title="Regexp for conditions to be shown in the heatmap"></div>' +
          '</div>');
        break;
      case 'link_change':
        var names = manager.getViewNames();
        var name = $('#dialog #source').val();
        var children = manager.getViewChildren(name);
        $('#dialog').append('<div id="targetdiv">Target view <select id="target" title="View as a listener"></select></div>');
        for(var i=0; i<names.length; i++){
          if(children.indexOf(names[i])!=-1 || names[i]==name) continue;
          $('#dialog #target').append('<option value="'+names[i]+'">'+names[i]+'</option>');
        }
        break;
      case 'unlink_change':
        var names = manager.getViewNames();
        var name = $('#dialog #source').val();
        var children = manager.getViewChildren(name);
        $('#dialog').append('<div id="targetdiv">Target view <select id="target" title="View as a listener"></select></div>');
        for(var i=0; i<children.length; i++){
          $('#dialog #target').append('<option value="'+children[i]+'">'+children[i]+'</option>');
        }
        break;
      case 'group':
        var name = $('#dialog #source').val();
        var names = manager.getViewNames('togroup', name);
        $('#dialog').append('<div id="targetdiv">Target view<select id="target" title="View that is in the group to be joined"></select></div>');
        for(var i=0; i<names.length; i++){
          $('#dialog #target').append('<option value="'+names[i]+'">'+names[i]+'</option>');
        }
        break;
      default:
        options.alert('undefined behavior for dialog layout '+type);
    }
  },

  dialogCreate = function() {
    var layout = this;
    $('#dialog').remove();
    $('body').append();
    $('#dialog #viewname').val('View' + manager.availViewID());
    $('#dialog').addClass('viewshadow');
    this.dialogLayout('create_graph');

    $('#dialog #type').change(function(){
      var type = $('#dialog #type option:selected').val();
      $('#dialog #datadiv').remove();
      $('#dialog').append('<div id="datadiv"></div>');
      layout.dialogLayout('create_'+type);
    });
    $('#dialog').dialog({
      buttons: {
        'OK': function() {
          var name = $('#dialog #viewname').val();
          var type = $('#dialog #type option:selected').val();
          if(type=='graph'){
            var data = $('#dialog #data').val();
            var exp = $('#dialog #datadiv #exp').val();
            if(exp=='') exp='a^';
            var view = createView(name, type);
            if(view) view.loadData(data, exp);
          }else if(type=='histogram'){
            var data = $('#dialog #data').val();
            if (manager.supportBinding(data)==false){
              options.alert('Please type in a supported binding track');
              return;
            }
            var chr = $('#dialog #datadiv #chr').val();
            if(chr=='') chr = '1';
            var view = createView(name, type);
            if(view) view.loadData(data, chr);
          }else if(type=='heatmap'){
            var mat = $('#dialog #data option:selected').val();
            var plot = $('#dialog #datadiv #plot').val();
            var exprows = $('#dialog #datadiv #gene').val();
            var expcols = $('#dialog #datadiv #cond').val();
            if(exprows=='') exprows='.*';
            if(expcols=='') expcols='.*';
            var view = createView(name, type);
            if(view) view.loadData(mat, plot, exprows, expcols);
          }
          if(view) $('#dialog').remove();
        },
        'Cancel': function(){ $('#dialog').remove(); }
      }
    });
  },

  dialogLink = function(src) {
    var layout = this;
    $('#dialog').remove();
    $('body').append('<div id='dialog' title='Link Views'>' +
      '<div>Source view <select id='source' title='View to be listened to'></select></div>' +
      '</div>');
    var names = manager.getViewNames();
    for(var i=0; i<names.length; i++){
      $('#dialog #source').append('<option value=''+names[i]+''>'+names[i]+'</option>');
    }
    if(src!=null) $('#dialog #source option[value=''+src+'']').attr('selected', true);

    this.dialogLayout('link_change');
    $('#dialog #source').change(function(){
      $('#dialog #targetdiv').remove();
      return layout.dialogLayout('link_change');
    });
    $('#dialog').dialog({
      buttons: {
        'OK': function(){
          var source = $('#dialog #source').val(),
            target = $('#dialog #target').val();
          if(target==null || target==''){
            console.error('Cannot link an empty view');
            options.alert('Cannot link an empty view');
            return;
          }
          var success =linkView(source, target);
          if(success) $('#dialog').remove();
        },
        'Cancel': function(){ $('#dialog').remove(); }
      }});
  },

  dialogUnlink = function(src) {
    var layout = this;
    $('#dialog').remove();
    $('body').append('<div id='dialog' title='Unlink Views'>' +
      '<div>Source view <select id='source' title='View to be listened to'></select></div>' +
      '</div>');
    var names = manager.getViewNames();
    for(var i=0; i<names.length; i++){
      $('#dialog #source').append('<option value=''+names[i]+''>'+names[i]+'</option>');
    }
    if(src!=null) $('#dialog #source option[value=''+src+'']').attr('selected', true);
    this.dialogLayout('unlink_change');
    $('#dialog #source').change(function(){
      $('#dialog #targetdiv').remove();
      return layout.dialogLayout('unlink_change');
    });
    $('#dialog').dialog({
      buttons: {
        'OK': function(){
          var source = $('#dialog #source').val(),
            target = $('#dialog #target').val();
          if(target==null || target==''){
            console.error('Cannot unlink an empty view');
            options.alert('Cannot unlink an empty view');
            return;
          }
          var success = unlinkView(source, target);
          if(success) $('#dialog').remove();
        },
        'Cancel': function(){ $('#dialog').remove(); }
      }});
  },

  dialogGroup: function() {
    var layout = this;
    $('#dialog').remove();
    $('body').append('<div id='dialog' title='Group Views'>' +
      '<div>Source view <select id='source' title='View to join the group'></select></div>' +
      '</div>');
    var names = manager.getViewNames();
    for(var i=0; i<names.length; i++){
      $('#dialog #source').append('<option value=''+names[i]+''>'+names[i]+'</option>');
    }
    if(src!=null) $('#dialog #source option[value=''+src+'']').attr('selected', true);
    this.dialogLayout('group');
    $('#dialog #source').change(function(){
      $('#dialog #targetdiv').remove();
      return layout.dialogLayout('group');
    });
    $('#dialog').dialog({
      buttons: {
        'OK': function(){
          var source = $('#dialog #source').val(),
            target = $('#dialog #target').val();
          if(target==null || target==''){
            console.error('Cannot group an empty view');
            options.alert('Cannot group an empty view');
            return;
          }
          var success = groupView(source, target);
          if(success) $('#dialog').remove();
        },
        'Cancel': function(){ $('#dialog').remove(); }
      }});
  }
*/
};

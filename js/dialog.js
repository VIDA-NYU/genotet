/**
 * @fileoverview Genotet dialog (modal) specification.
 */

'use strict';


var Dialog = {
  /**
   * Creates a dialog with the given parameter.
   * @param {string} type Type of the dialog.
   */
  create: function(type) {
    if (type == null) {
      console.error('undefined dialog type in create');
      return;
    }
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
    case 'create-expression':
      this.createExpression();
      break;
    case 'organism':
      this.organism();
      break;
    default:
      Core.error('unknown view type in Dialog.create:', type);
      break;
    }
  },

  /**
   * Creates a organism selection dialog.
   */
  organism: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/organism.html', function() {
      modal.modal();
      modal.find('.btn-organism').removeClass('active')
        .click(function() {
          Data.organism = $(this).attr('id');
          modal.find('.btn-organism').removeClass('active')
          $(this).addClass('active');
        })
      modal.find('#' + Data.organism).addClass('active');
    });
  },

  /**
   * Creates a dialog for view creation.
   */
  createView: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-view.html', function() {
      modal.modal();
      modal.find('.selectpicker').selectpicker();
      modal.find('#btn-next').click(function() {
        var type = modal.find('#type').val();
        switch (type) {
        case 'network':
          Dialog.create('create-network');
          break;
        case 'binding':
          Dialog.create('create-binding');
          break;
        case 'expression':
          Dialog.create('create-expression');
          break;
        default:
          Core.error('unknown view type in Dialog.createView:', type);
          break;
        }
      });
    });
  },

  /**
   * Creates a dialog for network creation.
   */
  createNetwork: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-network.html', function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(ViewManager.nextSuffixName(viewName.val()));
      modal.find('.selectpicker').selectpicker();

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = modal.find('#view-name').val();
        ViewManager.createView('network', viewName, {
          networkName: modal.find('#network').val(),
          geneRegex: modal.find('#geneRegex').val()
        });
      });
    });
  },

  /**
   * Creates a dialog for genome browser creation.
   */
  createBinding: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-binding.html', function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(ViewManager.nextSuffixName(viewName.val()));

      var chrs = Data.bindingChrs.map(function(chr, index) {
        return {
          id: chr,
          text: chr
        };
      });
      modal.find('#chr').select2({
        data: chrs
      });
      var genes = Data.bindingGenes.map(function(gene, index) {
        return {
          id: gene,
          text: gene
        };
      });
      modal.find('#gene').select2({
        data: genes
      });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = modal.find('#view-name').val();
        ViewManager.createView('binding', viewName, {
          gene: modal.find('#gene').val(),
          chr: modal.find('#chr').val()
        });
      });
    });
  },

  /**
   * Creates a dialog for expression matrix creation.
   */
  createExpression: function() {
    var modal = $('#modal');
    modal.find('.modal-content').load('templates/create-expression.html', function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(ViewManager.nextSuffixName(viewName.val()));
      modal.find('.selectpicker').selectpicker();

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = modal.find('#view-name').val();
        ViewManager.createView('expression', viewName, {
          matrixName: modal.find('#matrix').val(),
          geneRegex: modal.find('#gene-regex').val(),
          condRegex: modal.find('#cond-regex').val()
        });
      });
    });
  }
};

/*
// TODO(bowen): View linking and grouping are obsolete.
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

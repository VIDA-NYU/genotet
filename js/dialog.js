/**
 * @fileoverview Genotet dialog (modal) specification.
 */

'use strict';

/** @const */
genotet.dialog = {};

/**
 * Creates a dialog with the given parameter.
 * @param {string} type Type of the dialog.
 */
genotet.dialog.create = function(type) {
  if (type == null) {
    console.error('undefined dialog type in create');
    return;
  }
  switch (type) {
    case 'create-view':
      genotet.dialog.createView_();
      break;
    case 'create-network':
      genotet.dialog.createNetwork_();
      break;
    case 'create-binding':
      genotet.dialog.createBinding_();
      break;
    case 'create-expression':
      genotet.dialog.createExpression_();
      break;
    case 'organism':
      genotet.dialog.organism_();
      break;
    case 'upload':
      genotet.dialog.upload_();
      break;
    default:
      genotet.error('unknown view type in Dialog.create:', type);
      break;
  }
};

/**
 * Creates a organism selection dialog.
 * @private
 */
genotet.dialog.organism_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/organism.html', function() {
    modal.modal();
    modal.find('.btn-organism').removeClass('active')
      .click(function() {
        genotet.data.organism = $(this).attr('id');
        modal.find('.btn-organism').removeClass('active')
        $(this).addClass('active');
      });
    modal.find('#' + genotet.data.organism).addClass('active');
  });
};

/**
 * Creates a dialog for view creation.
 * @private
 */
genotet.dialog.createView_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/create-view.html', function() {
    modal.modal();
    modal.find('.selectpicker').selectpicker();
    modal.find('#btn-next').click(function() {
      var type = modal.find('#type').val();
      switch (type) {
      case 'network':
        genotet.dialog.create('create-network');
        break;
      case 'binding':
        genotet.dialog.create('create-binding');
        break;
      case 'expression':
        genotet.dialog.create('create-expression');
        break;
      default:
        genotet.error('unknown view type in Dialog.createView:', type);
        break;
      }
    });
  });
};

/**
 * Creates a dialog for network creation.
 * @private
 */
genotet.dialog.createNetwork_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/create-network.html', function() {
    modal.modal();
    var viewName = modal.find('#view-name');
    viewName.val(genotet.viewManager.nextSuffixName(viewName.val()));
    //modal.find('.selectpicker').selectpicker();
    var params = {
      type: 'list-network'
    };
    var networks = [];
    $.get(genotet.data.serverURL, params, function(data) {
      data.forEach(function(network) {
        networks.push({
          id: network.networkName,
          text: network.networkName
        });
      });
      modal.find('#network').select2({
        data: networks
      });
    }.bind(this), 'jsonp')
      .fail(function() {
        genotet.error('failed to get network list');
      });

    // Create
    modal.find('#btn-create').click(function() {
      var viewName = modal.find('#view-name').val();
      genotet.viewManager.createView('network', viewName, {
        networkName: modal.find('#network').val(),
        geneRegex: modal.find('#geneRegex').val()
      });
    });
  });
};

/**
 * Creates a dialog for genome browser creation.
 * @private
 */
genotet.dialog.createBinding_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/create-binding.html', function() {
    modal.modal();
    var viewName = modal.find('#view-name');
    viewName.val(genotet.viewManager.nextSuffixName(viewName.val()));

    var chrs = genotet.data.bindingChrs.map(function(chr, index) {
      return {
        id: chr,
        text: chr
      };
    });
    modal.find('#chr').select2({
      data: chrs
    });
    /*
    var genes = genotet.data.bindingGenes.map(function(gene, index) {
      return {
        id: gene,
        text: gene
      };
    });
    */
    var genes = [];
    var params = {
      type: 'list-binding'
    };
    $.get(genotet.data.serverURL, params, function(data) {
      data.forEach(function(bindingFile) {
        genes.push({
          id: bindingFile.bindingName,
          text: bindingFile.bindingName
        });
      });
      modal.find('#gene').select2({
        data: genes
      });
    }.bind(this), 'jsonp')
      .fail(function() {
        genotet.error('failed to get binding list');
      });

    // Create
    modal.find('#btn-create').click(function() {
      var viewName = modal.find('#view-name').val();
      genotet.viewManager.createView('binding', viewName, {
        gene: modal.find('#gene').val(),
        chr: modal.find('#chr').val()
      });
    });
  });
};

/**
 * Creates a dialog for expression matrix creation.
 * @private
 */
genotet.dialog.createExpression_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/create-expression.html', function() {
    modal.modal();
    var viewName = modal.find('#view-name');
    viewName.val(genotet.viewManager.nextSuffixName(viewName.val()));
    //modal.find('.selectpicker').selectpicker();
    var params = {
      type: 'list-matrix'
    };
    var matrices = [];
    $.get(genotet.data.serverURL, params, function(data) {
        data.forEach(function(matrix) {
          matrices.push({
            id: matrix.matrixName,
            text: matrix.matrixName
          });
        });
        modal.find('#matrix').select2({
          data: matrices
        });
      }.bind(this), 'jsonp')
      .fail(function() {
        genotet.error('failed to get expression list');
      });
    // Create
    modal.find('#btn-create').click(function() {
      var viewName = modal.find('#view-name').val();
      genotet.viewManager.createView('expression', viewName, {
        matrixName: modal.find('#matrix').val(),
        geneRegex: modal.find('#gene-regex').val(),
        condRegex: modal.find('#cond-regex').val()
      });
    });
  });
};

/**
 * Creates a dialog for uploading data.
 * @private
 */
genotet.dialog.upload_ = function() {
  var modal = $('#modal');
  modal.find('.modal-content').load('templates/upload.html', function() {
    modal.modal();
    modal.find('.selectpicker').selectpicker();

    var file = modal.find('#file');
    var fileName = modal.find('#data-name');

    var btnUpload = modal.find('#btn-upload').prop('disabled', true);
    var btnFile = modal.find('#btn-file');
    var fileDisplay = modal.find('#file-display');
    btnFile.click(function() {
      file.trigger('click');
    });
    fileDisplay.click(function() {
      file.trigger('click');
    });

    // Checks if all required fields are filled.
    var uploadReady = function() {
      return fileName.val() && file.val();
    };

    file.change(function(event) {
      var fileName = event.target.files[0].name;
      fileDisplay.text(fileName);
      btnUpload.prop('disabled', !uploadReady());
    });
    fileName.keyup(function() {
      btnUpload.prop('disabled', !uploadReady());
    });

    btnUpload.click(function() {
      var formData = new FormData();
      formData.append('type', modal.find('#type').val());
      formData.append('name', fileName.val());
      formData.append('description', modal.find('#description').val());
      formData.append('file', file[0].files[0]);

      $.ajax({
        url: genotet.data.uploadURL,
        type: 'POST',
        data: formData,
        enctype: 'multipart/form-data',
        processData: false,
        contentType: false
      }).done(function(data) {
          if (!data.success) {
            genotet.error('failed to upload data', data.message);
          } else {
            genotet.success('data uploaded');
          }
        })
        .fail(function(res) {
          genotet.error('failed to upload data');
        });
    });
  });
};

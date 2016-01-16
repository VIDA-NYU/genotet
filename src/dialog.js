/**
 * @fileoverview Genotet dialog (modal) specification.
 */

'use strict';

/** @const */
genotet.dialog = {};

/**
 * Gene input type that is regex or string.
 * @private {boolean}
 */
genotet.dialog.isGeneRegex_ = true;

/**
 * Condition input type that is regex or string.
 * @private {boolean}
 */
genotet.dialog.isConditionRegex_ = true;

/**
 * Template paths.
 * @private {!Object<string>}
 */
genotet.dialog.TEMPLATES_ = {
  organism: 'dist/html/organism.html',
  view: 'dist/html/create-view.html',
  network: 'templates/create-network.html',
  binding: 'templates/create-binding.html',
  expression: 'templates/create-expression.html',
  upload: 'templates/upload.html'
};

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
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.organism,
    function() {
      modal.modal();
      modal.find('.btn-organism').removeClass('active')
        .click(function() {
          genotet.data.organism = /** @type {string} */($(this).attr('id'));
          modal.find('.btn-organism').removeClass('active');
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
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.view, function() {
    modal.modal();
    modal.find('.selectpicker').selectpicker();
    modal.find('#btn-next').click(function() {
      var type = /** @type {string} */(modal.find('#type').val());
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
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.network,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));
      modal.find('.selectpicker').selectpicker();
      var params = {
        type: 'list-network'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          var selectpicker = modal.find('.selectpicker');
          data.forEach(function(network) {
            $('<option></option>')
              .text(network.networkName)
              .appendTo(selectpicker);
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get network list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
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
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.binding,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));

      var chrs = genotet.data.bindingChrs.map(function(chr, index) {
        return {
          id: chr,
          text: chr
        };
      });
      modal.find('#chr').select2({
        data: chrs
      });
      var genes = [];
      var params = {
        type: 'list-binding'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(bindingFile) {
            genes.push({
              id: bindingFile.gene,
              text: bindingFile.gene
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
        var viewName = /** @type {string} */(modal.find('#view-name').val());
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
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.expression,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));
      modal.find('.selectpicker').selectpicker();
      var params = {
        type: 'list-matrix'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          var matrices = /** @type {genotet.ListedExpression} */(data);
          var selectpicker = modal.find('.selectpicker');
          matrices.forEach(function(matrix) {
            $('<option></option>')
              .text(matrix.matrixName)
              .appendTo(selectpicker);
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get expression list');
        });

      // Choose input type of gene and condition.
      modal.find('#gene-input-regex input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = true;
        })
        .trigger('click');
      modal.find('#gene-input-string input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = false;
        });
      modal.find('#condition-input-regex input')
        .on('click', function() {
          genotet.dialog.isCondtionRegex_ = true;
        })
        .trigger('click');
      modal.find('#condition-input-string input')
        .on('click', function() {
          genotet.dialog.isCondtionRegex_ = false;
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        var geneInput = modal.find('#gene-regex').val();
        var conditionInput = modal.find('#cond-regex').val();
        genotet.viewManager.createView('expression', viewName, {
          fileName: modal.find('#matrix').val(),
          isGeneRegex: genotet.dialog.isGeneRegex_,
          isConditionRegex: genotet.dialog.isConditionRegex_,
          geneInput: geneInput,
          conditionInput: conditionInput
        });
      });
    });
};

/**
 * Creates a dialog for uploading data.
 * @private
 */
genotet.dialog.upload_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.upload,
    function() {
      modal.modal();
      modal.find('.selectpicker').selectpicker();

      var file = modal.find('#file');
      var fileName = modal.find('#file-name');
      var dataName = modal.find('#data-name');

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
        return fileName.val() && file.val() && dataName.val();
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
        formData.append('type',
          /** @type {string} */(modal.find('#type').val()));
        formData.append('name',
          /** @type {string} */(dataName.val()));
        formData.append('description',
          /** @type {string} */(modal.find('#description').val()));
        formData.append('fileName',
          /** @type {string} */(fileName.val()));
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

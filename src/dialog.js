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
genotet.dialog.isGeneRegex_ = false;

/**
 * Condition input type that is regex or string.
 * @private {boolean}
 */
genotet.dialog.isConditionRegex_ = false;

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
  mapping: 'templates/mapping.html',
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
    case 'mapping':
      genotet.dialog.mapping_();
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
    modal.find('#type').select2();
    modal.find('#btn-next').click(function() {
      var type = /** @type {string} */(modal.find('#type').val());
      switch (type) {
      case genotet.ViewType.NETWORK:
        genotet.dialog.create('create-network');
        break;
      case genotet.ViewType.BINDING:
        genotet.dialog.create('create-binding');
        break;
      case genotet.ViewType.EXPRESSION:
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

      // Load network list.
      var fileNames = [];
      var params = {
        type: 'list-network'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(networkFile) {
              fileNames.push({
                id: networkFile.fileName,
                text: networkFile.networkName + ' (' +
                networkFile.fileName + ')'
              });
          });
          modal.find('#network').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get network list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        var isRegex = modal.find('#gene-input-type')
          .children('label[name=regex]').children('input').prop('checked');
        genotet.viewManager.createView(genotet.ViewType.NETWORK, viewName, {
          fileName: modal.find('#network').val(),
          inputGenes: modal.find('#geneRegex').val(),
          isRegex: isRegex
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

      // Load binding list.
      var fileNames = [];
      var params = {
        type: 'list-binding'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(bindingFile) {
            fileNames.push({
              id: bindingFile.fileName,
              text: bindingFile.gene + ' (' + bindingFile.fileName + ')'
            });
          });
          modal.find('#gene').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get binding list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        genotet.viewManager.createView(genotet.ViewType.BINDING, viewName, {
          fileNames: modal.find('#gene').val(),
          bedName: genotet.data.bedName,
          chr: modal.find('#chr').val(),
          multipleTracks: false
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

      // Choose input type of gene and condition.
      modal.find('#gene-input-type label[name=regex] input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = true;
        });
      modal.find('#gene-input-type label[name=string] input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = false;
        });
      modal.find('#condition-input-type label[name=regex] input')
        .on('click', function() {
          genotet.dialog.isConditionRegex_ = true;
        });
      modal.find('#condition-input-type label[name=string] input')
        .on('click', function() {
          genotet.dialog.isConditionRegex_ = false;
        });

      // Load expression list.
      var fileNames = [];
      var params = {
        type: 'list-expression'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(expressionFile) {
              fileNames.push({
                id: expressionFile.fileName,
                text: expressionFile.matrixName + ' (' +
                expressionFile.fileName + ')'
              });
          });
          modal.find('#matrix').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get expression list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        var geneInput = modal.find('#gene-input').val();
        var conditionInput = modal.find('#cond-input').val();
        genotet.viewManager.createView(genotet.ViewType.EXPRESSION, viewName, {
          fileName: modal.find('#matrix').val(),
          tfaFileName: genotet.data.tfaFileName,
          isGeneRegex: genotet.dialog.isGeneRegex_,
          isConditionRegex: genotet.dialog.isConditionRegex_,
          geneInput: geneInput,
          conditionInput: conditionInput
        });
      });
    });
};

/**
 * Shows a dialog for the user to choose mapping files for linked queries.
 * @private
 */
genotet.dialog.mapping_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.mapping,
    function() {
      modal.modal();

      // Load mapping list.
      var fileNames = [];
      var params = {
        type: 'list-mapping'
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(fileName) {
            fileNames.push({
              id: fileName,
              text: fileName
            });
          });
          fileNames.push('Direct Mapping');
          modal.find('#mapping-file').select2({
            data: fileNames
          })
            .val(genotet.data.mappingFiles['gene-binding'])
            .trigger('change');
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get mapping list');
        });

      // Create
      modal.find('#btn-choose').click(function() {
        var fileName = modal.find('#mapping-file').val();
        genotet.data.mappingFiles['gene-binding'] =
        /** @type {string} */(fileName);
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
      var typeSelection = modal.find('#type');
      typeSelection.select2();

      var file = modal.find('#file');
      var dataName = modal.find('#data-name');

      var btnUpload = modal.find('#btn-upload').prop('disabled', true);
      var btnFile = modal.find('#btn-file');
      var fileDisplay = modal.find('#file-display');

      typeSelection.on('change', function() {
        var isMapping = /** @type {string} */(typeSelection.val()) ==
          genotet.FileType.MAPPING;
        if (isMapping) {
          modal.find('#data-name').closest('tr').css('display', 'none');
          modal.find('#description').closest('tr').css('display', 'none');
        } else {
          modal.find('#data-name').closest('tr').css('display', '');
          modal.find('#description').closest('tr').css('display', '');
        }
      });

      btnFile.click(function() {
        file.trigger('click');
      });
      fileDisplay.click(function() {
        file.trigger('click');
      });

      // Checks if all required fields are filled.
      var uploadReady = function() {
        return file.val() && (dataName.val() ||
          typeSelection.val() == genotet.FileType.MAPPING);
      };

      file.change(function(event) {
        var fileName = event.target.files[0].name;
        fileDisplay.text(fileName);
        btnUpload.prop('disabled', !uploadReady());
      });

      btnUpload.click(function() {
        var formData = new FormData();
        formData.append('type',
          /** @type {string} */(typeSelection.val()));
        formData.append('name',
          /** @type {string} */(dataName.val()));
        formData.append('description',
          /** @type {string} */(modal.find('#description').val()));
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

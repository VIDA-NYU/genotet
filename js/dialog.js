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
        this.createView_();
        break;
      case 'create-network':
        this.createNetwork_();
        break;
      case 'create-binding':
        this.createBinding_();
        break;
      case 'create-expression':
        this.createExpression_();
        break;
      case 'organism':
        this.organism_();
        break;
      case 'upload':
        this.upload_();
        break;
      default:
        Core.error('unknown view type in Dialog.create:', type);
        break;
    }
  },

  /**
   * Creates a organism selection dialog.
   * @private
   */
  organism_: function() {
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
   * @private
   */
  createView_: function() {
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
   * @private
   */
  createNetwork_: function() {
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
   * @private
   */
  createBinding_: function() {
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
   * @private
   */
  createExpression_: function() {
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
  },

  /**
   * Creates a dialog for uploading data.
   * @private
   */
  upload_: function() {
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
          url: Data.uploadURL,
          type: 'POST',
          data: formData,
          enctype: 'multipart/form-data',
          processData: false,
          contentType: false
        }).done(function(data) {
            if (!data.success) {
              Core.error('failed to upload data', data.message);
            } else {
              Core.success('data uploaded');
            }
          })
          .fail(function(res) {
            Core.error('failed to upload data');
          });
      });
    });
  }
};

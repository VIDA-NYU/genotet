/**
 * @fileoverview Table used for showing incident edges of selected
 * node in the regulatory network.
 */

'use strict';

/**
 * NetworkTable renders given multi-dimensional data as a table.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
genotet.NetworkTable = function(data) {
  this.data = data;
};

/**
 * Triggers a jQuery event on the table.
 * @param {string} eventType Type of event.
 * @param {*=} opt_data Data to be sent via the event.
 */
genotet.NetworkTable.prototype.signal = function(eventType, opt_data) {
  $(this).trigger('genotet.' + eventType, [opt_data]);
};

/**
 * Creates an incident edge table with the given data, inside a given
 * container.
 * @param {!jQuery} table Table element as container.
 * @param {!Array<{
 *   id: string,
 *   source: string,
 *   target: string,
 *   weight: !Array<number>,
 *   added: boolean
 * }>} edges List of edges.
 *   added: Whether the edge has been added to the network.
 */
genotet.NetworkTable.prototype.create = function(table, edges) {
  var edgeIds = {};
  this.data.network.edges.forEach(function(edge) {
    edgeIds[edge.id] = true;
  });
  edges.forEach(function(edge) {
    edge.added = edge.id in edgeIds;
  });
  var edgesForTable = [];
  edges.forEach(function(edge) {
    edgesForTable.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      added: edge.added,
      weight: edge.weight[0],
      originalWeight: edge.weight
    });
  });
  var dataTable = table.DataTable({
    data: edgesForTable,
    columnDefs: [
      {
        render: function(added) {
          return added ? '&#10004;' : '';
        },
        targets: 3
      }
    ],
    columns: [
      {title: 'Source', data: 'source'},
      {title: 'Target', data: 'target'},
      {title: 'Weight', data: 'weight'},
      {title: '', data: 'added'}
    ],
    select: true,
    dom: '<"row"<"col-sm-12"B>>' +
      '<"row"<"col-sm-5"l><"col-sm-7"f>>' +
      '<"row"<"col-sm-12"tr>>' +
      '<"row"<"col-sm-5"i><"col-sm-7"p>>',
    buttons: [
      {
        text: 'Add',
        action: function(e, dt, node, config) {
          var selectedEdge = dt.rows({selected: true}).data()[0];
          this.signal('addEdge', {
            source: selectedEdge.source,
            target: selectedEdge.target,
            weight: selectedEdge.originalWeight
          });
          edgesForTable.forEach(function(edge) {
            if (edge.id == selectedEdge.id) {
              edge.added = true;
            }
          });
          // refresh the row
          dt.row({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(false);
          dt.buttons(1).enable(true);
        }.bind(this),
        enabled: false
      },
      {
        text: 'Remove',
        action: function(e, dt, node, config) {
          var selectedEdge = dt.rows({selected: true}).data()[0];
          this.signal('removeEdge', {
            id: selectedEdge.id,
            source: selectedEdge.source,
            target: selectedEdge.target,
            weight: selectedEdge.originalWeight
          });
          edgesForTable.forEach(function(edge) {
            if (edge.id == selectedEdge.id) {
              edge.added = false;
            }
          });
          // refresh the row
          dt.row({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(true);
          dt.buttons(1).enable(false);
        }.bind(this),
        enabled: false
      }
    ],
    lengthMenu: [5, 10, 20, 50],
    pageLength: 5,
    pagingType: 'full'
  });

  table.on('click', function() {
    var data = dataTable.rows({selected: true}).data();
    if (data.length == 1) {
      dataTable.button(0).enable(!data[0].added);
      dataTable.button(1).enable(data[0].added);
      this.signal('highlightEdge', {
        edgeId: data[0].id
      });
    }
  }.bind(this));

  table.closest('#edge-list').css('width',
    /** @type {number} */(table.width()));
};

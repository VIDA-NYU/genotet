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
    select: {
      style: 'os',
      info: false
    },
    dom: '<"row"<"col-sm-12"B>>' +
      '<"row">' +
      '<"row"<"col-sm-5"l><"col-sm-7"f>>' +
      '<"row"<"col-sm-12"tr>>' +
      '<"row"<"col-sm-5"i><"col-sm-7"p>>',
    buttons: [
      {
        text: 'Add',
        action: function(e, dt, node, config) {
          var selectedEdges = dt.rows({selected: true}).data();
          var additionEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            additionEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source,
              target: selectedEdges[i].target,
              weight: selectedEdges[i].originalWeight
            });
            edgesForTable.forEach(function(edge) {
              if (selectedEdges[i].id == edge.id) {
                edge.added = true;
              }
            });
          }
          this.signal('addEdges', {
            edges: additionEdges
          });

          // refresh the row
          dt.rows({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(false);  // the addition button
          dt.buttons(1).enable(true);   // the removal button
        }.bind(this),
        enabled: false
      },
      {
        text: 'Remove',
        action: function(e, dt, node, config) {
          var selectedEdges = dt.rows({selected: true}).data();
          var removalEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            removalEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source,
              target: selectedEdges[i].target,
              weight: selectedEdges[i].originalWeight
            });
            edgesForTable.forEach(function(edge) {
              if (selectedEdges[i].id == edge.id) {
                edge.added = false;
              }
            });
          }
          this.signal('removeEdges', {
            edges: removalEdges
          });
          this.signal('hideEdge', {
            edges: removalEdges
          });
          // refresh the row
          dt.rows({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(true);   // the addition button
          dt.buttons(1).enable(false);  // the removal button
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
    if (data.length > 0) {
      var allSame = true;
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          if (data[i].added != data[i - 1].added) {
            allSame = false;
            break;
          }
        }
      }
      if (allSame) {
        dataTable.button(0).enable(!data[0].added); // the addition button
        dataTable.button(1).enable(data[0].added);  // the removal button
      }
      for (var i = 0; i < data.length; i++) {
        this.signal('highlightEdge', {
          edgeId: data[i].id
        });
      }
    }
  }.bind(this));

  table.closest('#edge-list').css('width',
    /** @type {number} */(table.width()));
};

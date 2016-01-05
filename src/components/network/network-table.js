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
 * Creates an incident edge table with the given data, inside a given
 * container.
 * @param {!jQuery} table Table element as container.
 * @param {!Array<{
 *   source: string,
 *   target: string,
 *   weight: number,
 *   added: boolean
 * }>} edges List of edges.
 *   added: Whether the edge has been added to the network
 */
genotet.NetworkTable.prototype.create = function(table, edges) {
  var edgeIds = {};
  this.data.edges.forEach(function(edge) {
    edgeIds[edge.id] = true;
  });
  edges.forEach(function(edge) {
    edge.added = edge.id in edgeIds;
  });
  table.DataTable({
    data: edges,
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
    lengthMenu: [5, 10, 20, 50],
    pageLength: 5,
    pagingType: 'full'
  });
  table.closest('#edge-list').css('width',
    /** @type {number} */(table.width()));
};

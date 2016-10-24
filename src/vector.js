/**
 * @fileoverview Vector utility functions shared within the Genotet.
 */

'use strict';

/** @const */
genotet.vector = {};

/**
 * Calculates whether the point is in the polygon.
 * @param {!Array<number>} point The point.
 * @param {!Array<Array<number>>} vertices The vertices of the polygon.
 * @return {boolean}
 */
genotet.vector.pointInPolygon = function(point, vertices) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  var x = point[0], y = point[1];
  var isInside = false;
  for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    var xi = vertices[i][0];
    var yi = vertices[i][1];
    var xj = vertices[j][0];
    var yj = vertices[j][1];
    var intersect = ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

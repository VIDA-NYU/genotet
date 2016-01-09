/**
 * @fileoverview Server segment tree for on-the-fly sampling of histogram.
 */

var fs = require('fs');

/** @type {segtree} */
module.exports = segtree;

/**
 * @constructor
 */
function segtree() {}

/**
 * Constructs the segment tree.
 * @param {!Array<number>} nodes Maximum values in the segment tree nodes.
 * @param {!Array<{x: number, value: number}>} vals Values of the data array.
 */
segtree.buildSegmentTree = function(nodes, vals) {
  var n = vals.length;
  segtree.buildSegmentTreeExec(nodes, 0, n - 1, vals);
};

/**
 * Builds the segment tree recursively.
 * @param {!Array<number>} nodes Maximum values in the segment tree nodes.
 * @param {number} xl Left endpoint of the range.
 * @param {number} xr Right endpoint of the range.
 * @param {!Array<{x: number, value: number}>} vals Values of the data array.
 */
segtree.buildSegmentTreeExec = function(nodes, xl, xr, vals) {
  if (xr == xl) {
    nodes.push(vals[xl].value);
    return;
  }
  nodes.push(0);
  var index = nodes.length - 1;
  var xm = (xr + xl) >> 1;
  segtree.buildSegmentTreeExec(nodes, xl, xm, vals);
  segtree.buildSegmentTreeExec(nodes, xm + 1, xr, vals);
  nodes[index] = Math.max(nodes[index + 1], nodes[index + (xm - xl + 1) * 2]);
};

/**
 * Queries the segment tree for the maximum value between [xl, xr].
 * @param {!Array<number>} nodes Maximum values in the segment tree nodes.
 * @param {number} index Current index of the tree node.
 * @param {number} xl Left endpoint of the range.
 * @param {number} xr Right endpoint of the range.
 * @param {number} nodexl Left endpoint of the node's subtree.
 * @param {number} nodexr Right endpoint of the node's subtree.
 * @return {number} Maximum value of the range involved.
 */
segtree.querySegmentTree = function(nodes, index, xl, xr, nodexl, nodexr) {
  if (xr < xl) return 0;
  if (xl <= nodexl && xr >= nodexr) return nodes[index];
  var xm = (nodexl + nodexr) >> 1;
  var resl = segtree.querySegmentTree(nodes, index + 1, xl, Math.min(xr, xm),
      nodexl, xm);
  var resr = segtree.querySegmentTree(nodes, index + (xm - nodexl + 1) * 2,
      Math.max(xm + 1, xl), xr, xm + 1, nodexr);
  return Math.max(resl, resr);
};

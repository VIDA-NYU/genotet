
// server segment tree for on-the-fly sampling on histogram

'use strict';

module.exports = {

  buildSegmentTree: function(nodes, vals) { // vals shall be {x:.., value:..}
    var n = vals.length;
    return this.buildSegmentTreeExec(nodes, 0, n - 1, vals);
  },

  buildSegmentTreeExec: function(nodes, xl, xr, vals) {
    if (xr == xl) {
      nodes.push(vals[xl].value);
      return;
    }
    nodes.push(0);
    var index = nodes.length - 1;
    var xm = (xr + xl) >> 1;
    this.buildSegmentTreeExec(nodes, xl, xm, vals);
    this.buildSegmentTreeExec(nodes, xm + 1, xr, vals);
    //var cntleft = xm-xl+1, cntright = xr-xm;
    //console.log(index, left, index+1, right, index+cntleft*2);
    nodes[index] = Math.max(nodes[index + 1], nodes[index + (xm - xl + 1) * 2]);
  },

  querySegmentTree: function(nodes, index, xl, xr, nodexl, nodexr) {
    if (xr < xl) return 0;
    if (xl <= nodexl && xr >= nodexr) return nodes[index];
    var xm = (nodexl + nodexr) >> 1;
    var resl = this.querySegmentTree(nodes, index + 1, xl, Math.min(xr, xm), nodexl, xm),
        resr = this.querySegmentTree(nodes, index + (xm - nodexl + 1) * 2, Math.max(xm + 1, xl), xr, xm + 1, nodexr);
    return Math.max(resl, resr);
  }

};

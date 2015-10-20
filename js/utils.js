/**
 * @fileoverview Contains some utility functions shared within the Genotet
 * codebase.
 */

'use strict';

var Utils = {
  /**
   * Checks whether two 2D rectangles intersect.
   * @param {{x: number, y: number, w: number, h: number}} rect1
   *     Definition of the first rectangle.
   * @param {{x: number, y: number, w: number, h: number}} rect2
   *     Definition of the second rectangle.
   * @return {boolean} Whether the two rectangles intersect.
   */
  rectIntersect: function(rect1, rect2) {
    var xMin = Math.max(rect1.x, rect2.x);
    var xMax = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
    var yMin = Math.max(rect1.y, rect2.y);
    var yMax = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);
    return xMin < xMax && yMin < yMax;
  },

  /**
   * Checks whether a rectangle is inside the screen window.
   * @param {{x: number, y: number, w: number, h: number}} rect
   *     Definition of the rectangle.
   * @return {boolean} Whether the rectangle is inside the screen window.
   */
  rectInsideWindow: function(rect) {
    return rect.x >= 0 && rect.x + rect.w < $(window).width() &&
        rect.y >= 0 && rect.y + rect.h < $(window).height();
  },

  /*
  parse: function(key, value) {
    var type;
    if (value && typeof value === 'object') {
      type = value.type;
      if (typeof type === 'string' && typeof window[type] === 'function') {
        return new (window[type])(value);
      }
    }
    return value;
  },

  tagString: function(str, tag, style, cls) {
    if (style == null) style = '';
    else style = ' style="' + style + '" ';
    if (cls == null) cls = '';
    else cls = ' class="' + cls + '" ';
    return '<'+ tag + cls + style + '>'+ str + '</'+ tag + '>';
  },

  xor: function(a, b) {
    return a ? !b : b;
  },

  compare: function(a, b) {
    var va = a[this.attr], vb = b[this.attr];
    if (va < vb) return -1 * this.order;
    else if (va == vb) return 0;
    else return 1 * this.order;
  },

  stableSort: function(a, attr, order) {
    if (order == null) this.order = 1;
    else this.order = order;
    this.attr = attr;
    this.stableSortExec(a, 0, a.length - 1);
  },

  stableSortExec: function(a, l, r) { // a must be an array
    if (r <= l) return;
    var m = Math.floor((l + r) / 2);
    this.stableSortExec(a, l, m);
    this.stableSortExec(a, m + 1, r);
    var b = new Array(), i = l, j = m + 1;
    while (i <= m && j <= r) {
      if (this.compare(a[i], a[j]) <= 0) { b.push(a[i]); i++; }
      else { b.push(a[j]); j++; }
    }
    while (i <= m) { b.push(a[i]); i++; }
    while (j <= r) { b.push(a[j]); j++; }
    for (var i = l; i <= r; i++) a[i] = b[i - l];
  },

  intersectRanges: function(a1, b1, a2, b2) {
    return a2 < b1 && b2 > a1;
  },

  encodeSpecialChar: function(exp) {
    exp = exp.replace(/\+/g, '%2B');
    exp = exp.replace(/\?/g, '%3F');
    return exp;
  }
  */
};

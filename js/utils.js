
'use strict';

var Utils = {
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
};

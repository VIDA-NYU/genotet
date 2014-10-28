
// system utility functions

/*
 * need to rewrite
 */

"use strict";

/************************ WARNING *************************
 *                    MESSY CODE ZONE!                    *
 **********************************************************/

function Utils(){
}

Utils.prototype.parse = function(key, value){	// parse objects for JSON
    var type;
    if (value && typeof value === 'object') {
  		type = value.type;
  		if (typeof type === 'string' && typeof window[type] === 'function'){
  			return new (window[type])(value);
  		}
    }
    return value;
};

Utils.prototype.tagString = function(str, tag, style, cls){
	if(style==null) style = "";
	else style = ' style="' + style + '" ';
	if(cls==null) cls = "";
	else cls = ' class="' + cls + '" ';
	return "<"+tag+cls+style+">"+str+"</"+tag+">";
};

Utils.prototype.xor = function(a,b){
	return a? !b:b;
};

Utils.prototype.compare = function(a,b){
	var va = a[this.attr], vb = b[this.attr];
	if(va<vb) return -1*this.order;
	else if(va==vb) return 0;
	else return 1*this.order;
};

Utils.prototype.stableSort = function(a, attr, order){
	if(order==null) this.order = 1;
	else this.order = order;
	this.attr = attr;
	this.stableSortExec(a, 0, a.length-1);
};

Utils.prototype.stableSortExec = function(a, l, r){ // a must be an array
	if(r<=l) return;
	var m = Math.floor((l+r)/2);
	this.stableSortExec(a, l, m);
	this.stableSortExec(a, m+1, r);
	var b = new Array(), i=l, j=m+1;
	while(i<=m && j<=r){
		if(this.compare(a[i], a[j])<=0) { b.push(a[i]); i++; }
		else{ b.push(a[j]); j++; }
	}
	while(i<=m){ b.push(a[i]); i++; }
	while(j<=r){ b.push(a[j]); j++; }
	for(var i=l; i<=r; i++) a[i] = b[i-l];
};

Utils.prototype.intersectRanges = function(a1, b1, a2, b2){
	return a2 < b1 && b2 > a1;
};

Utils.prototype.buildSegmentTree = function(vals){	// vals shall be {x:.., value:..}
	var n = vals.length;
	return buildSegmentTreeExec(0, n-1, vals);
};

Utils.prototype.buildSegmentTreeExec = function(xl, xr, vals){
	if(xr==xl) return {"xl":xl, "xr":xr, "left":null, "right": null, "value":vals[l].value};
	var xm = Math.floor((xr+xl)/2);
	var left = buildSegmentTreeExec(xl, xm);
	var right = buildSegmentTreeExec(xm+1, xr);
	var val = Math.max(left.value, right.value);
	return {"xl":xl, "xr":xr, "left":left, "right": right, "value":val};
};

Utils.prototype.querySegmentTree = function(node, xl, xr){
	if(xr < xl) return 0;
	if(xl <= node.xl && xr >= node.xr) return node.value;
	var xm = Math.floor((node.xl+node.xr)/2);
	return Math.max(querySegmentTree(node.left, xl, Math.min(xr, xm)), querySegmentTree(node.right, Math.max(xm+1, xl), xr));
};

Utils.prototype.encodeSpecialChar = function(exp){
	exp = exp.replace(/\+/g, "%2B");
	exp = exp.replace(/\?/g, "%3F");
	return exp;
};

Utils.prototype.scrollbarWidth = function() {
    if( $('body').height() > $(window).height()) {
        /* Modified from: http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php */
        var calculation_content = jQuery('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
        jQuery('body').append( calculation_content );
        var width_one = jQuery('div', calculation_content).innerWidth();
        calculation_content.css('overflow-y', 'scroll');
        var width_two = jQuery('div', calculation_content).innerWidth();
        jQuery(calculation_content).remove();
        return ( width_one - width_two );
    }
    return 0;
};
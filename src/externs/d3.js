/**
 * @fileoverview d3 library extern.
 */

/**
 * @constructor
 * @return {!d3}
 */
function d3() {}

/**
 * @param {!d3|string|Element|null} arg
 * @return {!d3}
 */
d3.select = function(arg) {};

/**
 * @param {!d3|string|!Array<Element>|null} arg
 * @return {!d3}
 */
d3.selectAll = function(arg) {};

/**
 * @param {!Array<T>} arg
 * @return <T>
 * @template T
 */
d3.max = function(arg) {};

/**
 * @param {!Array<T>} arg
 * @return <T>
 * @template T
 */
d3.min = function(arg) {};

/**
 * @param {!d3|string|Element|null} arg
 * @return {!d3}
 */
d3.prototype.select = function(arg) {};

/**
 * @param {!d3|string|!Array<Element>|null} arg
 * @return {!d3}
 */
d3.prototype.selectAll = function(arg) {};

/** @return {!d3} */
d3.prototype.exit = function() {};

/** @return {!d3} */
d3.prototype.enter = function() {};

/** @return {!d3} */
d3.prototype.remove = function() {};

/** @return {!d3} */
d3.prototype.empty = function() {};

/**
 * @param {!Array<*>} arg
 * @param {Function=} opt_mapping
 */
d3.prototype.data = function(arg, opt_mapping) {};

/**
 * @param {string} classes
 * @param {function(!d3, number): boolean|boolean} val
 * @return {boolean}
 */
d3.prototype.classed = function(classes, val) {};

/**
 * @param {string} prop
 * @param {(string|number)=} opt_val
 * @return {!d3|string|number|null}
 */
d3.prototype.style = function(prop, opt_val) {};

/**
 * @param {string|!Object} prop
 * @param {(string|number)=} opt_val
 * @return {!d3|string|number|null}
 */
d3.prototype.attr = function(prop, opt_val) {};

/**
 * @param {string} event
 * @param {Function} handler
 * @return {!d3}
 */
d3.prototype.on = function(event, handler) {};

/**
 * @param {string} text
 */
d3.prototype.text = function(text) {};

/**
 * @param {string} tag
 */
d3.prototype.append = function(tag) {};

/**
 * @param {!d3.zoom} arg
 */
d3.prototype.call = function(arg) {};

/** @const */
d3.svg = {};

/**
 * @constructor
 * @return {!d3.axis}
 */
d3.axis = function() {};

/** @return {!d3.axis} */
d3.svg.axis = function() {};

/**
 * @param {string} dir
 */
d3.axis.prototype.orient = function(dir) {};

/**
 * @param {!d3.scale} scale
 */
d3.axis.prototype.scale = function(scale) {};


/** @typedef {Function} */
d3.line;

/** @return {!d3.line} */
d3.svg.line = function() {};

/**
 * @param {string} arg
 */
d3.line.prototype.interpolate = function(arg) {};

/**
 * @param {Function|number} arg
 */
d3.line.prototype.x = function(arg) {};

/**
 * @param {Function|number} arg
 */
d3.line.prototype.y = function(arg) {};


/** @typedef {Function} */
d3.scale;

/**
 * @param {Array<number|string>=} opt_range
 * @return {!Array<number|string>}
 */
d3.scale.prototype.range = function(opt_range) {};

/**
 * @param {Array<number|string>=} opt_range
 * @return {!Array<number|string>}
 */
d3.scale.prototype.domain = function(opt_range) {};

/** @return {!d3.scale} */
d3.scale.category20 = function() {};

/** @return {!d3.scale} */
d3.scale.linear = function() {};


/** @typedef {Function} */
d3.zoom;

/**
 * @param {Array<number>=} opt_arg
 * @return {!Array<number>}
 */
d3.zoom.prototype.scaleExtent = function(opt_arg) {};

/**
 * @param {Function} callback
 */
d3.zoom.prototype.x = function(callback) {};

/**
 * @param {Function} callback
 */
d3.zoom.prototype.y = function(callback) {};

/**
 * @param {string} event
 * @param {Function} handler
 */
d3.zoom.prototype.on = function(event, handler) {};

/** @typedef {Function} */
d3.drag;

/**
 * @param {string} event
 * @param {Function} handler
 */
d3.drag.prototype.on = function(event, handler) {};

/** @const */
d3.behavior = {};

/** @return {!d3.zoom} */
d3.behavior.zoom = function() {};

/** @return {!d3.drag} */
d3.behavior.drag = function() {};

/**
 * @constructor
 * @return {!d3.event}
 */
d3.event = function() {};

/** @type {number} */
d3.event.scale;

/** @type {!Array<number>} */
d3.event.translate;

/** @type {Element} */
d3.event.target;

/**
 * @param {Element} arg
 * @return {!Array<number>}
 */
d3.mouse = function(arg) {};


/** @const */
d3.layout = {};

/**
 * @constructor
 * @return {!d3.layout.force}
 */
d3.layout.force = function() {};

d3.layout.force.prototype.start = function() {};

d3.layout.force.prototype.stop = function() {};

/**
 * @param {!Array<number>} arg
 */
d3.layout.force.prototype.size = function(arg) {};

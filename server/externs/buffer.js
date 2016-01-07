/**
 * @fileoverview Node.js Buffer externs.
 */

/**
 * @param {...*} var_args
 * @constructor
 * @nosideeffects
 */
var Buffer = function (var_args) {};

/**
 * @param {string} encoding
 * @return {boolean}
 */
Buffer.isEncoding;

/**
 * @param {*} obj
 * @return {boolean}
 * @nosideeffects
 */
Buffer.isBuffer;

/**
 * @param {string} string
 * @param {string=} encoding
 * @return {number}
 * @nosideeffects
 */
Buffer.byteLength;

/**
 * @param {Array.<Buffer>} list
 * @param {number=} totalLength
 * @return {Buffer}
 * @nosideeffects
 */
Buffer.concat;

/**
 * @param {number} offset
 * @return {*}
 */
Buffer.prototype.get;

/**
 * @param {number} offset
 * @param {*} v
 */
Buffer.prototype.set;

/**
 * @param {string} string
 * @param {number|string=} offset
 * @param {number|string=} length
 * @param {number|string=} encoding
 * @return {*}
 */
Buffer.prototype.write;

/**
 * @return {Array}
 */
Buffer.prototype.toJSON;

/**
 * @type {number}
 */
Buffer.prototype.length;

/**
 * @param {Buffer} targetBuffer
 * @param {number=} targetStart
 * @param {number=} sourceStart
 * @param {number=} sourceEnd
 * @return {Buffer}
 */
Buffer.prototype.copy;

/**
 * @param {number=} start
 * @param {number=} end
 * @return {Buffer}
 * @nosideeffects
 */
Buffer.prototype.slice;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt8;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt16LE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt16BE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt32LE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt32BE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readInt8;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readInt16LE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readInt16BE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readInt32LE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readInt32BE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readFloatLE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readFloatBE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readDoubleLE;

/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readDoubleBE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeUInt8;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeUInt16LE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeUInt16BE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeUInt32LE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeUInt32BE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeInt8;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeInt16LE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeInt16BE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeInt32LE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeInt32BE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeFloatLE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeFloatBE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeDoubleLE;

/**
 * @param {number} value
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.writeDoubleBE;

/**
 * @param {*} value
 * @param {number=} offset
 * @param {number=} end
 * @return {void}
 */
Buffer.prototype.fill;

/**
 * @param {string=} encoding
 * @param {number=} start
 * @param {number=} end
 * @return {string}
 * @nosideeffects
 */
Buffer.prototype.toString;

/**
 * @type {number}
 */
Buffer.INSPECT_MAX_BYTES = 50;

//
// Legacy
//

/**
 * @param {number=} start
 * @param {number=} end
 * @return {Buffer}
 */
Buffer.prototype.utf8Slice;

/**
 * @param {number=} start
 * @param {number=} end
 * @return {Buffer}
 */
Buffer.prototype.binarySlice;

/**
 * @param {number=} start
 * @param {number=} end
 * @return {Buffer}
 */
Buffer.prototype.asciiSlice;

/**
 * @param {string} string
 * @param {number=} offset
 * @return {Buffer}
 */
Buffer.prototype.utf8Write;

/**
 * @param {string} string
 * @param {number=} offset
 * @return {Buffer}
 */
Buffer.prototype.binaryWrite;

/**
 * @param {string} string
 * @param {number=} offset
 * @return {Buffer}
 */
Buffer.prototype.asciiWrite;

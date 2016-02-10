/**
 * @fileoverview Node.js multer externs.
 */

/**
 * @constructor
 * @param {Object=} params
 * @return {!multer}
 */
function multer(params) {}

/**
 * @param {string} arg
 */
multer.prototype.single = function(arg) {};

/**
 * @typedef {{
 *   filedname: string,
 *   originalname: string,
 *   encoding: string,
 *   mimetype: string,
 *   destination: string,
 *   path: string,
 *   filename: string,
 *   size: number
 * }}
 */
multer.prototype.file;
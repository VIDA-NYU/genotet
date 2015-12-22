/**
 * @fileoverview Server info.
 */

var querystring = require('querystring');

/** @const */
module.exports = {
  /** @const {string} */
  url: 'http://localhost:3000/genotet',
  /** @const {string} */
  uploadURL: 'http://localhost:3000/genotet/upload',

  /**
   * Gets a query string.
   * @param {!Object} params
   * @return {string}
   * @this {server}
   */
  queryURL: function(params) {
    return this.url + '?' + querystring.stringify(params);
  }
};

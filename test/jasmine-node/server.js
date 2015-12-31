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
  },

  /**
   * Posts a file via multi-part form to the server.
   * @param {!Frisby} frisby
   * @param {!FormData} form
   * @return {!Frisby}
   * @this {server}
   */
  postForm: function(frisby, form) {
    frisby.post(this.uploadURL, form, {
      headers: {
        'content-type': 'multipart/form-data; boundary=' +
        form.getBoundary(),
        'content-length': form.getLengthSync()
      }
    });
    return frisby;
  }
};

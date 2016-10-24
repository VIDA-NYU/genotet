/**
 * @fileoverview Genotet URLs.
 */

/** @const */
genotet.url = {};

/**
 * Data queries are sent to this address via HTTP.
 * @type {string}
 */
genotet.url.server = '';

/**
 * Data are uploaded to this Url by posting multipart form data.
 * @type {string}
 */
genotet.url.upload = '';

/**
 * Log queries are sent to this address.
 * @type {string}
 */
genotet.url.log = '';

/**
 * User queries are sent to this address.
 * @type {string}
 */
genotet.url.user = '';

/**
 * URL for checking upload progress.
 * @type {string}
 */
genotet.url.progress = '';

/**
 * URL for checking server status.
 * @type {string}
 */
genotet.url.check = '';

/**
 * URL for queries for monitoring data processing.
 * @type {string}
 */
genotet.url.uploadProgress = '';

/**
 * Initializes URLs.
 */
genotet.url.init = function() {
  if (window.location.protocol == 'file:') {
    // Testing environment
    genotet.url.server = 'https://localhost:3000/genotet';
    genotet.url.progress = 'https://localhost/genotet/progress.php';
  } else {
    genotet.url.server = window.location.protocol + '//' +
      window.location.hostname + ':3000/genotet';
    genotet.url.uploadProgress = window.location.protocol + '//' +
      window.location.hostname + '/genotet/progress.php';
  }
  genotet.url.upload = genotet.url.server + '/upload';
  genotet.url.log = genotet.url.server + '/log';
  genotet.url.user = genotet.url.server + '/user';
  genotet.url.check = genotet.url.server + '/check';
};

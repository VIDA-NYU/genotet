/**
 * @fileoverview Server info.
 */

var fs = require('fs');
var querystring = require('querystring');

/** @type {server} */
module.exports = server;

/**
 * @constructor
 */
function server() {}

/** @const {string} */
server.url = 'https://localhost:3000/genotet';

/** @const {string} */
server.uploadUrl = server.url + '/upload';

/** @const {string} */
server.userUrl = server.url + '/user';

/** @typedef {!Array<string>} */
server.Cookie;

/** @type {server.Cookie} */
server.cookie = [];

/**
 * @typedef {{
 *   error: {type: string, message: string}
 * }}
 */
server.UploadResponse;

/**
 * Retrieves the session cookie from dist/session file.
 * @private
 */
server.getCookie_ = function() {
  var sessionFile = 'dist/session';
  if (!fs.existsSync(sessionFile)) {
    return;
  }
  server.cookie = /** @type {server.Cookie} */(
    JSON.parse(/** @type {string} */(fs.readFileSync(sessionFile))));
};

// Read cookie file to perform queries as testuser.
server.getCookie_();

/**
 * Removes the cookie expiration time.
 * @param {server.Cookie} cookie
 * @return {server.Cookie}
 */
server.getCookieSessionId = function(cookie) {
  var result = [];
  cookie.forEach(function(cookie) {
    result.push(cookie.match(/%3(.*)\./)[1]);
  });
  return result;
};

/**
 * Generates a query data object with stringified JSON.
 * @param {!Object} params
 * @return {{data: string}}
 */
server.queryData = function(params) {
  return {data: JSON.stringify(params)};
};

/**
 * Gets a query string.
 * @param {!Object} params
 * @return {string}
 */
server.queryUrl = function(params) {
  return server.url + '?' + querystring.stringify(server.queryData(params));
};

/**
 * Sends a POST request with multipart form to the server.
 * @param {!frisby} frisby
 * @param {!formData} form
 * @return {!frisby}
 */
server.postForm = function(frisby, form) {
  frisby.post(server.uploadUrl, form, {
    headers: {
      'content-type': 'multipart/form-data; boundary=' +
      form.getBoundary(),
      'content-length': form.getLengthSync(),
      'cookie': server.cookie
    }
  });
  return frisby;
};

/**
 * Sends a GET request to the server.
 * @param {!frisby} frisby
 * @param {!Object} params
 * @return {!frisby}
 */
server.get = function(frisby, params) {
  frisby.get(server.queryUrl(params), {
    headers: {
      cookie: server.cookie
    }
  });
  return frisby;
};

/**
 * Sends a GET request to the server.
 * @param {!frisby} frisby
 * @param {string} url
 * @param {!Object} params
 * @return {!frisby}
 */
server.post = function(frisby, url, params) {
  frisby.post(url, server.queryData(params), {
    headers: {
      cookie: server.cookie
    }
  });
  return frisby;
};

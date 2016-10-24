/**
 * @fileoverview Server logger.
 */

var dateFormat = require('dateformat');
var fs = require('fs');

/** @type {log} */
module.exports = log;

/**
 * @constructor
 */
function log() {}

/** @const */
log.query = {};

/**
 * @typedef {{
 *   timestamp: number,
 *   content: string
 * }}
 */
log.UserLog;

/**
 * @typedef {{
 *   error: string
 * }}
 */
log.Error;

/**
 * Prints logs with timestamps.
 * @param {...*} var_args Content to be logged.
 */
log.serverLog = function(var_args) {
  if (!arguments.length) {
    return;
  }
  var date = new Date();
  var content = '[' + dateFormat(date, 'yyyy-mm-dd_HH:MM:ss') + '_' +
    date.getTime() + '] ';
  for (var i = 0; i < arguments.length; i++) {
    content += ' ' + arguments[i];
  }
  console.log(content);
};

/**
 * Prints user activity logs.
 * @param {string} logPath Path to the user log folder.
 * @param {*|{
 *   username: string,
 *   logs: !Array<!log.UserLog>
 * }} query Query parameters.
 * @return {log.Error}
 */
log.query.userLog = function(logPath, query) {
  if (query.username === undefined) {
    return {error: 'username is undefined'};
  }
  if (query.logs == undefined) {
    return {error: 'logs is undefined'};
  }
  var logs = query.logs;
  var username = query.username;
  var folder = logPath + username + '/';
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  var date = new Date();
  var logFile = folder + 'log_' + dateFormat(date, 'yyyy-mm-dd_HH') + '.log';
  var fd = fs.openSync(logFile, 'a');
  logs.forEach(function(log) {
    var logString = '';
    date.setMilliseconds(log.timestamp);
    logString += '[' + dateFormat(date, 'yyyy-mm-dd_HH:MM:ss') + '_' +
      log.timestamp + '] ';
    logString += log.content;
    fs.writeSync(fd, logString + '\n');
  });
  fs.closeSync(fd);
};

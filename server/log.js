/**
 * @fileoverview Server logger.
 */

var dateFormat = require('dateformat');

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
 *   type: string,
 *   action: string
 * }}
 */
log.UserLog;

/**
 * @typedef {{
 *   userName: string,
 *   logs: !Array<!log.UserLog>
 * }}
 */
log.query.UserLogList;

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
  content += arguments.slice(1).join('_');
  console.log(content);
};

/**
 * Prints user activity logs.
 * @param {string} userPath Path to the user folder.
 * @param {!log.query.UserLogList} query Query parameters.
 */
log.userLog = function(userPath, query) {
  var logs = query.logs;
  var userName = query.userName;
  if (!logs.length) {
    return;
  }
  var folder = userPath + userName + '/';
  var date = new Date();
  var logFile = folder + 'log_' + dateFormat(date, 'yyyy-mm-dd_HH') + '.log';
  var fd = fs.openSync(logFile, 'w+');
  logs.forEach(function(log) {
    var logString = '';
    var date = new Date(log.timestamp);
    logString += '[' + dateFormat(date, 'yyyy-mm-dd_HH:MM:ss') + ']\t';
    logString += log.type + ' ' + log.action;
    fs.writeSync(fd, logString + '\n');
  });
  fs.closeSync(fd);
};

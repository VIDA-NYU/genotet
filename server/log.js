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
    content += arguments[i];
  }
  console.log(content);
};

/**
 * Prints user activity logs.
 * @param {string} userPath Path to the user folder.
 * @param {string} userName User name to be logged.
 * @param {!Array<{
 *   timestamp: number,
 *   type: string,
 *   action: string
 * }>} logs Log information.
 */
log.userLog = function(userPath, userName, logs) {
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

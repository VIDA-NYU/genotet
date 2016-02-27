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
  var timestamp = '[' + dateFormat(date, 'yyyy-mm-dd_HH:MM:ss') + '_' +
    date.getTime() + ']';
  var content = timestamp + ' ' + var_args.join(' ');
  console.log(content);
};

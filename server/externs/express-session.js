/**
 * @fileoverview express-session externs.
 */

/**
 * @constructor
 */
var MemoryStore = function() {};

/**
 * @constructor
 */
var FileStore = function() {};

/**
 * @param {{
 *   name: string,
 *   secret: string,
 *   cookie: {
 *     maxAge: (number|undefined)
 *   },
 *   saveUninitialized: (boolean|undefined),
 *   resave: (boolean|undefined),
 *   store: (FileStore|MemoryStore|undefined)
 * }} params
 * @return {express.Callback}
 */
var session = function(params) {};


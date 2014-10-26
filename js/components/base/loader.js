
// Loader

/*
 * Loader is the class to communicate with server and obtain data.
 * Each view type has its own loader to parse its supported data.
 */

"use strict";

var extObject = {
  load: function(onComplete) {
    // default behavior is to render directly without fetching data
    if(onComplete == null) console.log("No callback for load?");
    if(onComplete != null) onComplete();
  }
};
var Loader = Base.extend(extObject);

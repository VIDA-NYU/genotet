"use strict";
var extObject = {
  load: function(onComplete) {
    // default behavior is to render directly without fetching data
    onComplete();
  }
};
var Loader = Base.extend(extObject);

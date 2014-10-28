
// Chart Loader

"use strict";

var extObject = {
  // implement load function here
  load: function(para) {
    // this load function is synchronous for testing

    // but in practice you can write a load function that is async with a callback function
    // usually, the callback function fires a render call
    this.view.data = {
      points: [
        {x:10, y:30},
        {x:20, y:60},
        {x:50, y:50},
        {x:70, y:150},
        {x:100, y:20}
      ],
      color: "red"
    };
    // here we are sync, so we directly fire the render call
    this.view.render();
  }
};

var ChartLoader = Loader.extend(extObject);

'use strict';

function NetworkView(viewName) {
  NetworkView.base.constructor.call(this, viewName);
}

NetworkView.prototype = Object.create(View.prototype);
NetworkView.prototype.constructor = NetworkView;
NetworkView.base = View.prototype;

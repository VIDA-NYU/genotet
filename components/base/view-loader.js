/**
 * @fileoverview The base Loader class definition. Each component shall have
 * a loader class inheriting this class.
 */

'use strict';

/**
 * ViewLoader class is the base class for all components' data loaders.
 * @param {!Object} data Data object to be written.
 * @constructor
 */
function ViewLoader(data) {
  if (!data) {
    Core.error('null data passed to ViewLoader');
    return;
  }
  /** @protected {!Object} */
  this.data = data;

  /**
   * Count of pending loads.
   * Loading screen is only displayed when this value is positive.
   * @protected {number}
   */
  this.loadCounter = 0;
}


/**
 * Initializes the view loader.
 */
ViewLoader.prototype.init = function() {
};


/**
 * Loads the data for the view.
 */
ViewLoader.prototype.load = function() {
};


/**
 * Updates the data for the view.
 */
ViewLoader.prototype.update = function() {
};


/**
 * Triggers a jQuery event to the data loader.
 * @param {string} eventType Type of event.
 * @param {Object} data Data object to be sent via the event.
 */
ViewLoader.prototype.signal = function(eventType, data) {
  switch(eventType) {
    case 'loadStart':
      this.loadCounter++;
      this.signal('loading');
      break;
    case 'loadComplete':
    case 'loadFail':
      this.loadCounter--;
      if (this.loadCounter == 0) {
        this.signal('loaded');
        if (eventType == 'loadComplete') {
          this.signal('loadSuccess');
        }
      }
      break;
  }
  $(this).trigger('genotet.' + eventType, [data]);
};

/**
 * Triggers a fail event and pushes the error.
 * @param {string} msg Error message.
 * @param {Object} params Query parameter object.
 */
ViewLoader.prototype.fail = function(msg, params) {
  Core.error(msg, params == null ? '' : JSON.stringify(params));
  this.signal('loadFail');
};

/*
View.prototype.loadData = function(para1, para2, para3, para4) {
  var identifier;
  if (this.type == 'graph') {
    identifier = {
      'net': para1,
      'exp': para2
    };
  }else if (this.type == 'histogram') {
    identifier = {
      'name': para1,
      'chr': para2,
      'gene': para3
    };
  }else if (this.type == 'heatmap') {
    identifier = {
      'mat': para1,
      'name': para2,
      'exprows': para3,
      'expcols': para4
    };
  }
  this.loader.loadData(identifier);
};

View.prototype.updateData = function(para1, para2, para3) {
  var identifier;
  if (this.type == 'graph') {  // show or hide edges
    identifier = {
      'action': para1,
      'data': para2
    };
  }else if (this.type == 'histogram') {
    identifier = {
      'name': para1,
      'srch': para2
    };
  }else if (this.type == 'heatmap') {
    if (para1 == 'node') {
      identifier = {
        'action': para1,
        'name': para2,
        'net': para3
      };
    }else if (para1 == 'link') {
      identifier = {
        'action': para1,
        'source': para2,
        'target': para3
      };
    }

  }
  this.loader.updateData(identifier);
};
*/

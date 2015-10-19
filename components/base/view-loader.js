/**
 * @fileoverview The base Loader class definition. Each component shall have
 * a loader class inheriting this class.
 */

'use strict';

/**
 * ViewLoader class is the base class for all components' data loaders.
 * @constructor
 */
function ViewLoader() {

}

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
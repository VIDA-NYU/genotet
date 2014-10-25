var NetworkController = GraphController.extend({
  load: function(para, onComplete) {
    this.base.load(para, function() {
      onComplete();
    });
  }
});

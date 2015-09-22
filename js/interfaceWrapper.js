function getView(viewname) {
  return ViewManager.getView(viewname);
}

function createView(viewname, viewtype, width, height, left, top) {
  return ViewManager.createView(viewname, viewtype, width, height, left, top);
}

function closeView(viewname) {
  return ViewManager.closeView(viewname);
}

function closeAllViews() {
  return ViewManager.closeAllViews();
}

function loadData(viewname, viewdata) {
  return ViewManager.getView(viewname).loadData(viewdata);
}

function linkView(sourceViewname, targetViewname) {
  return ViewManager.linkView(getView(sourceViewname), getView(targetViewname));
}

function unlinkView(sourceViewname, targetViewname) {
  return ViewManager.unlinkView(getView(sourceViewname), getView(targetViewname));
}

function groupView(sourceViewname, targetViewname) {
  return ViewManager.groupView(getView(sourceViewname), getView(targetViewname));
}

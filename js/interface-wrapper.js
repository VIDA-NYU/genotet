
// interface-wrapper will finally be obsolete

function getView(viewname){
	return viewManager.getView(viewname);
}

function createMenu(){
	return viewManager.createMenu().render();
}

function createView(viewname, viewtype, operator){ //, width, height, left, top
	return viewManager.createView(viewname, viewtype, operator);
}

function closeView(viewname){
	return viewManager.closeView(viewname);
}

function closeAllViews(){
	return viewManager.closeAllViews();
}

function loadData(viewname, viewdata){
	return viewManager.getView(viewname).loadData(viewdata);
}

function linkView(sourceViewname, targetViewname){
	return viewManager.linkView(getView(sourceViewname), getView(targetViewname));
}

function unlinkView(sourceViewname, targetViewname){
	return viewManager.unlinkView(getView(sourceViewname), getView(targetViewname));
}

function groupView(sourceViewname, targetViewname){
	return viewManager.groupView(getView(sourceViewname), getView(targetViewname));
}

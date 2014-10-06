function getView(viewname){
	return manager.getView(viewname);
}

function createMenu(){
	return manager.createMenu();
}

function createView(viewname, viewtype, width, height, left, top){
	return manager.createView(viewname, viewtype, width, height, left, top);
}

function closeView(viewname){
	return manager.closeView(viewname);
}

function closeAllViews(){
	return manager.closeAllViews();
}

function loadData(viewname, viewdata){
	return manager.getView(viewname).loadData(viewdata);
}

function linkView(sourceViewname, targetViewname){
	return manager.linkView(getView(sourceViewname), getView(targetViewname));
}

function unlinkView(sourceViewname, targetViewname){
	return manager.unlinkView(getView(sourceViewname), getView(targetViewname));
}

function groupView(sourceViewname, targetViewname){
	return manager.groupView(getView(sourceViewname), getView(targetViewname));
}

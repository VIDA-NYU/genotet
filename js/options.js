
// system options

/*
 * will soon be obsolete
 */

"use strict";

function Options(){
	this.silent = false;
	this.hint = false;
	this.debug = true;
}

Options.prototype.alert = function(msg){
  console.error(msg);
	if(this.silent == false)
	 alert(msg);
};
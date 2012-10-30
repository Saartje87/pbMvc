(function ( name, context, definition ) {
	
	if( typeof module !== 'undefined' && typeof module.exports === 'object' ) {
		
		module.exports = definition(context);
	} else if ( typeof define === 'function' && typeof define.amd === 'object' ) {
		
		define( function () { return definition(context) } ) ;
	} else {
		
		this[name] = definition(context);
	}
})('pbMvc', this, function ( context, undefined ) {

"use strict";

var $ = context.PB,
	routeStrip = /(:?)(\!?)(\*?)([a-z0-9_-]+)(\[.*?\])*([\/\.|]*)/ig,
	// Browser support pushState?
	pushState = !!window.history.pushState,
	Histry,
	pbMvc = {};


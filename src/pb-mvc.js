//= compat
/*!
 * pbMvc JavaScript Lib v<%= PB_VERSION %>
 * https://github.com/Saartje87/pbMvc
 *
 * copyright 1012, Pluxbox
 * MIT License
 */
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
	pbMvc = {};

//= require "./request"
//= require "./route"
//= require "./model"
//= require "./view"
//= require "./controller"

/**
 * Init MVC when all files are loaded
 */
$(window).once('load', function () {
	
	(new PB.App.Request())
		.execute();
});

return $.App = pbMvc;
});


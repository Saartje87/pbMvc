//= compat
/*!
 * pbMvc JavaScript Lib v<%= PB_VERSION %>
 * https://github.com/Saartje87/pbMvc
 *
 * copyright 1012, Pluxbox
 * MIT License
 */
 /*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            white:    false */
  /*global  window, jQuery, $, MyApp */
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
	pushState = false, //!!window.history.pushState,
	pbMvc = {};

//= require "./request"
//= require "./route"
//= require "./model"
//= require "./collection"
//= require "./view"
//= require "./controller"

return $.App = pbMvc;
});


/*!
 * pbMvc JavaScript Lib v0.0.1
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
	pbMvc = {};

pbMvc.Request = PB.Class({

	prefix: 'http_',

	cache: {},

	construct: function () {

		if( 'onhashchange' in window ) {

			PB(window).on('hashchange', this.execute.bind(this));
		} else {

			alert('hashchange event not implemented');
		}
	},

	/**
	 *
	 */
	execute: function ( url, params ) {

		var route = this.matchRoute( url );

		if( !route ) {

			alert('Request did not match any route');
			return;
		}

		if( params ) {

			route = PB.extend(route, params);
		}

		var controllerName = route.controller,
			action = this.prefix+route.action,
			controller;

		if( !pbMvc.Controller[controllerName] ) {

			throw Error( '`'+controllerName+'` not found' );
			return;
		}

		if( !pbMvc.Controller[controllerName].prototype[action] ) {

			throw Error( '`'+action+'` not found in `'+controller+'`' );
			return;
		}

		controller = this.cache[controllerName];

		if( !controller ) {

			this.cache[controllerName] = controller = new pbMvc.Controller[controllerName];
		}

		controller[action]( route );

		this.controller = controllerName;
		this.action = action;

		return this;
	},

	matchRoute: function ( url ) {

		var routes = pbMvc.Route.all(),
			route,
			uri = PB.is('String', url)
			 	? url
				: window.location.hash;

		uri = uri.trimLeft('#');
		uri = uri.trim('/');
		uri = uri.replace(/\/\/+/, '/');

		for( route in routes ) {

			if( routes.hasOwnProperty(route) && (route = routes[route].matches( uri )) ) {

				break;
			}
		}

		return route;
	}
});
/**
 *
 */
pbMvc.Route = PB.Class({

	construct: function ( name, regex, extract ) {

		this._name = name;
		this._regex = regex;
		this._extract = extract;

		this._defaults = null;
	},

	defaults: function ( defaults ) {

		this._defaults = PB.overwrite({}, defaults);
	},

	matches: function ( uri ) {

		var match = uri.match( this._regex ),
			params = PB.overwrite({}, this._defaults || {});	// Clone defaults

		if( !match ) {

			return false;
		}

		match.shift();

		for( var i = 0; i < match.length; i++ ) {

			if( match[i] ) {

				params[this._extract[i]] = match[i];
			}
		}

		return params;
	}
});

PB.extend(pbMvc.Route, {

	routes: {},

	/**
	 * Return all set routes
	 */
	all: function () {

		return pbMvc.Route.routes;
	},

	/**
	 * @param string
	 * @param regexp
	 * @param array
	 */
	set: function ( name, route ) {

		if( pbMvc.Route.routes[name] ) {

			throw Error('Already declared route::'+name);
		}

		var vars = route.split('/'),
			properties = [],
			property,
			i = 0,
			regexp = '^';

		for( i = 0; i < vars.length; i++ ) {

			var property = vars[i],
				group = null,
				modifier = '+',
				match = null;

			if( property.charAt(0) === ':' ) {

				group = '\\w';
				property = vars[i].substr( 1 );
			}

			if( /[\*\+]/.test( property.charAt(property.length - 1) ) ) {

				modifier = property.substr( property.length - 1 );
				property = property.substr( 0, property.length - 1 );
			}

			if( /\[.*?\]$/.test( property ) ) {

				match = property.substr( property.lastIndexOf('['), property.length );
				property = property.substr( 0, property.lastIndexOf('[') );
			}

			if( !group ) {

				group = property;
			} else {

				properties.push( property );
			}


			regexp += '('+(match || group)+modifier+')\\/'+(modifier === '*' ? '?' : '');

		}

		regexp = new RegExp( regexp.replace(/\\\/\??$/, '') );

		console.log( regexp );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});
/**
 * Abstract controller is based on Pluxbox, rewrite for own purpose
 */
pbMvc.Controller = PB.Class({});

return $.pbMvc = pbMvc;
});


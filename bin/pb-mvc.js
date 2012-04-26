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
	pbMvc = {}

pbMvc.Request = PB.Class({

	prefix: 'http_',

	cache: {},

	hash: null,

	scroll: null,

	/**
	 *
	 */
	construct: function () {

		this.scroll = PB(document).getScroll();

		PB(document).on('scroll', function () {

			this.scroll = PB(document).getScroll();
		}.bind(this));

		if( 'onhashchange' in window ) {

			PB(window).on('hashchange', this.execute.bind(this));
		} else {

			setInterval( this.hashCheck.bind(this), 250 );
		}
	},

	/**
	 *
	 */
	execute: function ( url, params ) {

		if( !PB.is('String', url) ) {

			url = window.location.hash;
		}

		params = PB.extend( this.matchRoute( url ), params );

		if( !params ) {

			alert('Request did not match any route');
			return;
		}

		var controllerName = params.controller,
			action = this.prefix+params.action,
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

			controller = this.cache[controllerName] = new pbMvc.Controller[controllerName];
		}

		controller[action]( params );



		return this;
	},

	/**
	 * Return te matches route or null if none matched
	 *
	 * @param string
	 * @param object route parts
	 */
	matchRoute: function ( url ) {

		var parts;

		url = url.trimLeft('#');
		url = url.trim('/');
		url = url.replace(/\/\/+/, '/');

		PB.each(pbMvc.Route.all(), function ( key, _route ) {

			if( parts = _route.matches( url ) ) {

				return true;
			}

			parts = null;
		});

		return parts;
	},

	/**
	 * Fallback 'event' for older browsers
	 */
	hashCheck: function () {

		if( window.location.hash !== this.hash ) {

			this.hash = window.location.hash;

			this.execute();
		}
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
				modifier = '',
				match = null;

			if( property.charAt(0) === ':' ) {

				group = '\\w';
				modifier = '+';
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
				regexp += (match || group)+modifier+'\\/'+(modifier === '*' ? '?' : '');
			} else {

				properties.push( property );
				regexp += '('+(match || group)+modifier+')\\/'+(modifier === '*' ? '?' : '');
			}

			if( vars[i+1] && /[\*\+]/.test( vars[i+1] ) && !/[\*\+]$/.test( vars[i] ) ) {

				regexp += '?';
			}
		}

		regexp = new RegExp( regexp.replace(/\\\/\??$/, ''), 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});



PB.extend(pbMvc.Route, {


	history: function( check ){

		if( check ) {

			this.journey = [];

			PB(document).find('a').forEach(function ( el ) {

				el.on('click', function ( e ) {

					e.stop();

					current = window.location.hash;

					this.journey.push( [ current, el ] );

					window.location = el.attr('href');

				}.bind(this));

			}.bind(this));
		}

		return ( function() {

				return this.journey;

		}.bind(this)());
	}

});
pbMvc.Model = PB.Class({

	url: '/{name}/rest/{id}.json?recursive=1',

	construct: function ( id ) {

		this.data = {};

		this.loaded = false;

		if( id !== undefined ) {

			this.set('id', id)
				.read( id );
		}
	},

	set: function ( key, value ) {

		this.data[key] = value;

		return this;
	},

	unset: function ( key ) {

		delete this.data[key];

		return this;
	},

	get: function ( key ) {

		return this.data[key];
	},

	isValid: function () {


	},

	error: function () {


	},

	/**
	 * Process the.data into a nice object, right for storing it on the server
	 */
	process: function () {

	},

	read: function () {

		if( this.loaded ) {

			return;
		}

		var url = this.url.replace('{name}', this.name).replace('{id}', this.get('id'));

		(new PB.Request({

			url: url,
			async: false
		})).on('end', function ( t, code ){

			switch ( code ) {

				case 200:
					if( !t.responseJSON ) {

						throw new Exception('No valid JSON response');
					}

					this.set( t.responseJSON );
					break;

				default:
					throw new Exception('Error in reading `Model '+this.name+'`');
					break;
			}
		}.bind(this)).send();

		return this;
	},

	save: function () {


	},

	remove: function () {


	}
});

/**
 *
 */
pbMvc.View = PB.Class({

	/**
	 *
	 */
	construct: function ( filename ) {

		this.filename = filename;
	},

	/**
	 *
	 */
	toString: function () {

		return this.render();
	},

	/**
	 *
	 */
	render: function () {

		var capture = PB.App.View.cache[this.filename];

		if( !capture ) {

			PB.App.View.cache[this.filename] = capture = PB.App.View.load( this.filename );
		}

		return capture;
	}
});

PB.overwrite(pbMvc.View, {

	version: '.VERSION'

	cache: {},

	/**
	 *
	 */
	load: function ( url ) {

		var response,
			request = new PB.Request({

				url: url,
				async: false,
				data: {

					ac: pbMvc.View.version
				}
			});

		request.on('end', function ( t, code ) {

			switch( code ) {

				case 404:
					throw new Error('View file `'+url+'` not found');
					break;

				default:
					response = t.responseText;
			}
		}).send();

		return response;
	}
});
/**
 * Abstract controller is based on Pluxbox, rewrite for own purpose
 */
pbMvc.Controller = PB.Class({});

return $.App = pbMvc;
});


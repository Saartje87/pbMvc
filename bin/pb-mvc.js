/*!
 * pbMvc JavaScript Lib v0.0.1
 * https://github.com/Saartje87/pbMvc
 *
 * copyright 2012, Pluxbox
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

	hash: null,

	/**
	 *
	 */
	construct: function () {

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

			console.log('Request did not match any route');
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

		var parts = route.split('/'),
			properties = [],
			property,
			i = 0,
			regexp = '^';

		for( i = 0; i < parts.length; i++ ) {

			if( property = parts[i].match(/^:([a-z0-9_-]+)/i) ) {

				properties.push( property[1] );
			}

			regexp += parseStringPart( parts[i], parts[i+1] );
		}

		regexp = new RegExp( regexp.replace(/\\\/\??$/, ''), 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});

function parseStringPart ( part, nextPart ) {

	var regexp = '';

	if( part.charAt(0) === ':' ) {

		var match;

		regexp += '(';

		if( match = part.match(/\[(.*?)\]/) ) {

			regexp += match[0];
		} else {

			regexp += '[a-zA-Z0-9_-]';
		}

		regexp += /\*$/.test( part ) ? '*' : '+';

		regexp += ')';
	} else {

		regexp += part;
	}

	if( nextPart ) {

		regexp += '/'+(/\*$/.test( nextPart ) ? '?' : '+');
	}

	return regexp;
}


PB.extend(pbMvc.Route, {


	history: function( check ){

		if( check ) {

			this.journey = [];

			PB(document).on('click', function ( e ) {

				var el = $(e.target);

				if ( el.nodeName === 'A' ) {

					e.stop();

					this.journey.push( [ window.location.hash, el ] );

					window.location = el.attr('href');

				}

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

	isset: function ( key ) {

		return this.data[key] !== undefined;
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
	construct: function ( filename, expire ) {

		this.filename = filename;
		this.expire = expire;
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

		return PB.App.View.fetch( this.filename, this.expire );
	}
});

PB.overwrite(pbMvc.View, {

	version: 'VERSION',

	cache: {},

	expire: 3600,

	/**
	 * Loads the given view synchrone
	 *
	 * @param string
	 * @return string
	 */
	fetch: function ( url, expire ) {

		if( pbMvc.View.cache[url] && pbMvc.View.cache[url].expire > Date.now() ) {

			return pbMvc.View.cache[url].text;
		}

		var request = new PB.Request({

				url: url,
				async: false,
				data: {

					ac: pbMvc.View.version
				}
			});

		pbMvc.View.cache[url] = {

			expire: Date.now() + (expire === undefined ? pbMvc.View.expire*1000 : expire)
		};

		request.on('end', function ( t, code ) {

			switch( code ) {

				case 404:
					throw new Error('View file `'+url+'` not found');
					break;

				case 200:
					pbMvc.View.cache[url].text = t.responseText;
					break;

				default:
					throw new Error('Response didn`t return a valid code, returned '+code);
			}
		}).send();

		if( !pbMvc.View.collecting ) {

			setInterval(pbMvc.View.collectGarbage, 30000);
		}

		return pbMvc.View.cache[url].text;
	},

	/**
	 * Checks whether entry is expired and removes the entry
	 * This method should only be called internally
	 */
	collectGarbage: function () {

		var now = Date.now();

		PB.each(pbMvc.View.cache, function ( url, data ) {

			if( data.expire > now ) {

				delete pbMvc.View.cache[url];
			}
		});
	}
});
/**
 * Abstract controller is based on Pluxbox, rewrite for own purpose
 */
pbMvc.Controller = PB.Class({});

/**
 * Init MVC when all files are loaded
 */
$(window).once('load', function () {

	(new PB.App.Request())
		.execute();
});

return $.App = pbMvc;
});


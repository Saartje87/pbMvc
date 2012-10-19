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
	routeStrip = /(:?)(\!?)(\*?)([a-z0-9_-]+)(\[.*?\])*([\/\.|]*)/ig,
	pushState = !!window.history.pushState,
	pbMvc = {};

pbMvc.Request = PB.Class({

	prefix: 'http_',

	cache: {},

	history: [],
	historyLimit: 10,

	hash: null,

	basePath: '/',

	pushstate: false,

	/**
	 *
	 */
	construct: function ( config ) {

		PB.overwrite(this, config);

		if( this.pushstate && pushState ) {

			PB(window).on('popstate', this.execute.bind(this));
		} else if( 'onhashchange' in window ) {

			PB(window).on('hashchange', this.execute.bind(this));
		} else {

			setInterval( this.hashCheck.bind(this), 250 );
		}

		this.execute();
	},

	/**
	 * Should change hash, if not silent
	 * Options only used when using silent
	 *
	 * For silent execution, no changing uri, use options -> { silent: true }
	 *
	 * @param {String} url
	 * @param {object} (optional)
	 */
	navigate: function ( url, options ) {

		url = url.replace('http://'+window.location.hostname, '');

		if( options && options.silent ) {

			options.silent = void 0;

			return this.execute( url, options );
		}

		if( this.pushstate && pushState ) {

			history.pushState('', '', url);
			this.execute( url );
		}
		else {

			window.location.hash = '!'+url;
		}

		return this;
	},

	/**
	 *
	 */
	execute: function ( url, params ) {


		if( !PB.is('String', url) ) {

			url = this.pushstate && pushState
				? window.location.pathname	// -> Strip baseUrl
				: window.location.hash;
		}

		url = url.trimLeft('#');
		url = url.trimLeft('!');
		url = url.trimLeft(this.basePath);

		params = PB.extend( this.matchRoute( url ), params );

		if( !params ) {

			console.log('Request did not match any route');
			return;
		}

		var action = this.prefix+params.action,
			controllerName = params.controller,
			controller,
			proto;

		if( !pbMvc.Controller[controllerName] ) {

			console.exception( '`'+controllerName+'` not found' );
			return;
		}

		proto = pbMvc.Controller[controllerName].prototype;

		if( !proto[action] ) {

			console.exception( '`'+action+'` not found in `'+controller+'`' );
			return;
		}

		controller = this.cache[controllerName];

		if( !controller ) {

			controller = this.cache[controllerName] = new pbMvc.Controller[controllerName];
		}

		if( this.history.length && controllerName !== this.history[this.history.length-1].controller ) {

			prevController = this.cache[this.history[this.history.length-1].controller];

			if( PB.is('Function', prevController.change) ) {

				prevController.change( params );
			}
		}

		if( PB.is('Function', proto.before) ) {

			controller.before( params );
		}

		controller[action]( params );

		if( PB.is('Function', proto.after) ) {

			controller.after( params );
		}

		this.history.push( params );

		if( this.history.length > this.historyLimit ) {

			this.history.shift();
		}

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
	},

	getHistory: function ( index ) {

		return index < 0
			? this.history[index + this.history.length]
			: this.history[index];
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

			if( match[i] && this._extract[i] ) {

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

			console.exception('Already declared route::'+name);
			return;
		}

		var parsed = parseString(route);


		parsed.regexp = new RegExp( parsed.regexp, 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, parsed.regexp, parsed.properties );
	}
});

function parseString ( route ) {

	var properties = [],
		regexp = '^';

	route.replace(routeStrip, function ( match, isGroup, isRequired, isWildcard, name, customMatching, seperator ) {

		regexp += '(';

		if( isGroup ) {

			properties.push( name );

			if( isWildcard && !customMatching ) {

				regexp += '.*';
			} else {

				regexp += customMatching ? customMatching : '[a-z0-9_-]';
				regexp += isRequired ? '+' : '*';
			}

		} else {

			properties.push( false );

			regexp += name;
		}

		regexp += ')';

		if( !isGroup ) {

			regexp += '+';
		}

		if( seperator ) {

			regexp += seperator;
			regexp += isRequired ? '+' : '*';
		}
	});

	return {

		regexp: regexp,
		properties: properties
	};
}


/*
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

});*/

pbMvc.Model = PB.Class(PB.Observer, {

	name: null,

	url: '/{name}/rest/{id}.json?recursive=1',

	data: null,

	previousData: null,

	_settingData: false,

	construct: function ( id ) {

		if( !this.name ) {

			return this.error('Model.name required');
		}

		this.parent();

		this.data = {};
		this.previousData = {};

		if( id !== undefined ) {

			this.set('id', id)
				.fetch();
		}
	},

	set: function ( key, value ) {

		var previousValue = this.data[key];

		if( previousValue === value ) {

			return this;
		}

	/*	if( this.properties && this.properties[key] && this.properties[key].set ) {

			value = this.properties[key].set.call( this, value, this.data[key] );
		}*/

		this._dataChanged = true;

		this.data[key] = value;

		if( !this._settingData ) {

			this.emit('change', this);

			this.emit('change:'+key, this, key);
		}

		return this;
	},

	setData: function ( data ) {

		this._settingData = true;
		this._dataChanged = false;

		PB.each(data, this.set, this);

		this._settingData = false;

		if( this._dataChanged ) {

			this.emit('change', this);
		}

		return this;
	},

	/**
	 * Retrieve entry or all data
	 *
	 * @param string
	 * @return mixed
	 */
	get: function ( key ) {

		var value = this.data[key];

		if( value === undefined || value === null ) {

			return null;
		}

/*		if( this.properties && this.properties[key] && this.properties[key].get ) {

			value = this.properties[key].get.call( this, value );
		}*/

		return value;
	},

	getData: function () {

		return PB.overwrite({}, this.data);
	},

	isset: function ( key ) {

		return this.data[key] !== undefined;
	},

	unset: function ( key ) {

		this.data[key] = void 0;

		return this;
	},

	isValid: function () {


	},

	error: function ( message ) {

		console.log('Silent fail :) -> ', message);

		return this;
	},

	getUrl: function () {

		return this.url
			.replace('{name}', this.name)
			.replace('{id}', this.get('id') || '');
	},

	/**
	 * Depricated -> removing explecite model declaration
	 */
/*	getRESTData: function () {

		var data = {};

		PB.each(this.data, function ( key, value ) {

			if( key in this.model ) {

				switch ( this.model[key].type ) {

					case 'date':
						break;
				}

				data[key] = value;
			}
		}, this);

		return data;
	},*/

	fetch: function () {

		if( !this.get('id') ) {

			return this.error('Failed to fetch `'+this.name+'`, no id set!');
		}

		(new PB.Request({

			url: this.getUrl(),
			async: false
		})).on('end', function ( t, status ){

			switch ( status ) {

				case 200:
					if( !t.responseJSON ) {

						this.error('No valid JSON response');
					}

					this.setData( t.responseJSON );
					break;

				default:
					this.error('Error in fetching `Model '+this.name+'`');
					break;
			}
		}, this).send();

		return this;
	},

	save: function () {

		(new PB.Request({

			url: this.getUrl(),
			method: this.get('id') ? 'PUT' : 'POST',
			data: {

				__data: JSON.stringify(this.data)
			}
		})).on('end', this.crudCallback, this).send();
	},

	remove: function () {

		if( !this.get('id') ) {

			return this.error('Already removed? No id');
		}

		(new PB.Request({

			url: this.getUrl(),
			method: 'DELETE'
		})).on('end', this.crudCallback, this).send();
	},


	crudCallback: function ( t, status ) {

		switch ( status ) {

			case 200:
			case 201:
				if( !t.responseJSON ) {

					return this.error('No valid JSON response');
				}

				this.setData( t.responseJSON );
				break;

			case 401:
				return this.error('Unauthorized');
				break;

			case 405:
				return this.error('Method Not Allowed');
				break;

			default:
				return this.error('CRUD error: `'+status+'`');
				break;
		}
	}
});





pbMvc.Collection = PB.Class(PB.Observer, {

	url: '/{model}/search.json',

	data: null,

	params: null,

	allowedParams: {

		'page-index': true,
		'max-results': true,
		'order': true,
		'q': true,
		'total-pages': false,
		'total-results': false
	},

	previousData: null,

	model: null,


	construct: function ( config ) {

		this.data = [];
		this.params = {};

		this.parent();

		PB.overwrite(this, config);

		if( !this.model || !pbMvc.Model[this.model] ) {

			return this.error('Model `'+this.model+'` not found');
		}
	},

	error: function ( message ) {

		console.log('Silent fail :) -> ', message);

		return this;
	},

	getUrl: function () {

		return this.url
			.replace('{model}', this.model);
	},

	save: function () {


	},

	remove: function () {


	},

	add: function ( mixed ) {

		if( PB.type(mixed) === 'object' ) {

			this.data.push( mixed );
		} else {
		}

		return this;
	},

	clear: function () {

		this.data.length = 0;

		return this;
	},

	setData: function ( data ) {

		data.forEach(this.add, this);
	},

	setParam: function ( key, value ) {

		if( key in this.allowedParams ) {

			this.params[key] = value;
		}

		return this;
	},

	getParam: function ( key ) {

		return this.params[key] || undefined;
	},

	setParams: function ( data ) {

		PB.each(data, this.setParam, this);

		return this;
	},

	getParams: function () {

		return PB.overwrite({}, this.params);
	},

	/**
	 * Find specific model
	 */
	find: function () {


	},

	/**
	 * Find multiple models `collection`
	 */
	findAll: function ( q ) {

		var data = PB.overwrite({}, this.params);

		if( q ) {

			data.q = q;
		}

		PB.each(data, function ( key, value ) {

			if( !this.allowedParams[key] ) {

				delete data[key];
			}
		}, this);



		(new PB.Request({

			url: this.getUrl(),
			data: data
		})).on('end', this.searchCallback, this).send();
	},

	searchCallback: function ( t, status ) {

		switch ( status ) {

			case 200:
			case 201:
				if( !t.responseJSON ) {

					return this.error('No valid JSON response');
				}

				PB.each(t.responseJSON, function ( key, value ) {

					if( key in this.allowedParams ) {

						this.setParam(key, value);
					}
				}, this);

				this.setData( t.responseJSON.results );

				this.emit('load', this);
				break;

			case 401:
				return this.error('Unauthorized');
				break;

			case 405:
				return this.error('Method Not Allowed');
				break;

			default:
				return this.error('CRUD error: `'+status+'`');
				break;
		}
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

		this.filename = filename || this.filename;
		this.expire = (expire === undefined) ? pbMvc.View.expire : expire;
	},

	/**
	 * @param {String} view
	 */
	setView: function ( view ) {

		this.view = view;
	},

	/**
	 * Fetch file from server
	 *
	 * @param {Function} callback
	 * @todo -> asynchrone
	 */
	fetch: function ( fn ) {

		this.view = PB.App.View.fetch( this.filename, this.expire );

		return this;
	},

	/**
	 * @param {Object} (optional)
	 */
	render: function ( data ) {

		return this.view;
	}
});

PB.overwrite(pbMvc.View, {

	version: 'VERSION',

	cache: {},

	expire: 3600,

	collecting: false,

	/**
	 * Loads the given view synchrone
	 *
	 * @param string
	 * @return string
	 */
	fetch: function ( url, expire ) {

		if( pbMvc.View.cache[url] && Date.now() < pbMvc.View.cache[url].expire ) {

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

			expire: Date.now() + (expire * 1000)
		};

		request.on('end', function ( t, code ) {

			switch( code ) {

				case 404:
					console.exception('View file `'+url+'` not found');
					break;

				case 200:
					pbMvc.View.cache[url].text = t.responseText;
					break;

				default:
					console.exception('Response didn`t return a valid code, returned '+code);
			}
		}).send();

		if( !pbMvc.View.collecting ) {

			setInterval(pbMvc.View.collectGarbage, 10000);

			pbMvc.View.collecting = true;
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

			if( Date.now() > data.expire ) {

				delete pbMvc.View.cache[url];
			}
		});
	}
});
/**
 * Abstract controller is based on Pluxbox, rewrite for own purpose
 */
pbMvc.Controller = PB.Class({});

return $.App = pbMvc;
});


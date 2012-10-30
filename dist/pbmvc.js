/*!
 * pbMvc JavaScript MVC v0.1.0
 * https://github.com/Saartje87/pbMvc
 *
 * Copyright 2012 Niek Saarberg
 * Licensed MIT
 *
 * Build date 2012-10-30 09:10
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
	// Browser support pushState?
	pushState = !!window.history.pushState,
	Histry,
	pbMvc = {};


pbMvc.Request = PB.Class({

	// Only methods with this prefix can be called
	prefix: 'http_',

	// Controller cache
	cache: {},
	
	// Store hash, older browser fallback
	hash: null,
	
	// In wich folder the mvc gets executed
	base: '/',
	
	// Use pushstate
	pushstate: false,

	/**
	 *
	 */
	construct: function ( config ) {
		
		PB.overwrite(this, config);
		
		this.history = new Histry(this);
		this._execute = this.execute.bind(this);
		
		if( this.pushstate && pushState ) {
			
			PB(window).on('popstate', this._execute);
		} else if( 'onhashchange' in window ) {
			
			PB(window).on('hashchange', this._execute);
		} else {
			
			setInterval( this.hashCheck.bind(this), 250 );
		}
		
		// Handle execution asynchronously so the instance is avaible 
		// when the controller and action are called
		setTimeout(this._execute, 1);
	},
	
	/**
	 * Navigate to given uri
	 *
	 * options param could be used to add additional arguments to the called controller/action
	 * or to execute the request silently (so the address bar won't be modified) user { silent: true }
	 *
	 * @param {String} url
	 * @param {Object} (optional)
	 */
	navigate: function ( url, options ) {
		
		// Strip the host from the given url (could be the case in .href in IE7)
		url = url.replace(window.location.protocol+'//'+window.location.hostname, '');
		
		// Execute request silently
		if( options && options.silent ) {
			
			return this.execute( url, options );
		}
		
		// For pushState we got to change the url and execute the given url
		if( this.pushstate && pushState ) {
			
			window.history.pushState('', '', url);
			this.execute( url );
		}
		// Set the new hashbang
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
			
			// Use pathname for pushstate applications
			url = this.pushstate && pushState
				? window.location.pathname	// -> Strip baseUrl
				: window.location.hash;
		}
		
		// Trim
		url = url.replace(/^[#!\/\s]+/g, '')
			.replace(/\/\/+/g, '/')
			.replace(/^\/|\/$/g, '');
		
		// Get matches and extend with params
		params = PB.extend( this.matchRoute( url ), params );
		
		// No routing matched
		if( !params ) {

			console.log('Request did not match any route');
			return;
		}

		var action = this.prefix+params.action,
			controllerName = params.controller,
			controller,
			proto;

		// Does the given controller exists?
		if( !pbMvc.Controller[controllerName] ) {

			console.exception( '`'+controllerName+'` not found' );
			return;
		}
		
		// Ref to prototype
		proto = pbMvc.Controller[controllerName].prototype;

		// Does the given controller has the called action?
		if( !proto[action] ) {

			console.exception( '`'+action+'` not found in `'+controller+'`' );
			return;
		}

		// read cache
		controller = this.cache[controllerName];
		
		if( !controller ) {
			
			// Create new instance
			controller = this.cache[controllerName] = new pbMvc.Controller[controllerName];
		}
		
		/*if( this._history.length && controllerName !== this._history[this._history.length-1].controller ) {
			
			// Previous called controller will always be in cache
			prevController = this.cache[this._history[this._history.length-1].controller];

			if( PB.is('Function', prevController.change) ) {

				prevController.change( params );
			}
		}*/
		
		// Execute before method
		if( PB.type(proto.before) === 'function' ) {
			
			controller.before( params );
		}
		
		// Execute the requested action
		controller[action]( params );
		
		// Execute after method
		if( PB.type(proto.after) === 'function' ) {
			
			controller.after( params );
		}
		
		// Add request to history
		this.history.push(url, params);

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

		PB.each(pbMvc.Route.all(), function ( key, _route ) {

			if( parts = _route.matches( url ) ) {

				return true; // Stop iteration
			}
			
			parts = null;
		});

		return parts;
	},
	
	/**
	 * Fallback 'event' for older browsers
	 */
	hashCheck: function () {
		
		// Hash changed?
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

		// Remove first from matched set
		match.shift();

		// Fill params with given uri
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
		
//		console.log( parsed.regexp );
		
		parsed.regexp = new RegExp( parsed.regexp, 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, parsed.regexp, parsed.properties );
	}
});

function parseString ( route ) {
	
	var properties = [],
		// Always start at beginning of string
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


// History of the address + trigger
/*
PB.extend(pbMvc.Route, {


	// by default disabled
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
// Add this.error -> to trigger this.emit('error', message || {message: '', code: 0})

pbMvc.Model = PB.Class(PB.Observer, {
	
	// 
	name: null,
	
	// Url template, default Core5.1
	url: '/{name}/rest/{id}.json?recursive=1',
	
	// 
	data: null,
	
	//
	previousData: null,
	
	// Prevent trigger of change event when settings
	// data trough setData method
	_settingData: false,
	
	construct: function ( id ) {
		
		if( !this.name ) {
			
			return this.error('Model.name required');
		}
		
		this.parent();
		
		// Model data
		this.data = {};
		this.previousData = {};
		
		// Fetch if id given
		if( id !== undefined ) {
			
			this.set('id', id)
				.fetch();
		}
	},
	
	// Handles key=>value or object
	set: function ( key, value ) {
		
		// Store previous value
		var previousValue = this.data[key];
		
		// Do nothing when value is not changed
		if( previousValue === value ) {
			
			return this;
		}
		
		// Execute data 'set-binding'
	/*	if( this.properties && this.properties[key] && this.properties[key].set ) {
			
			value = this.properties[key].set.call( this, value, this.data[key] );
		}*/
		
		// Data has changed, used for setData method
		this._dataChanged = true;
		
		this.data[key] = value;
		
		// Only trigger for single change of property
		if( !this._settingData ) {
			
			// Emit any change
			this.emit('change', this);
			
			// Emit specific event listening
			// will trigger like change:name
			this.emit('change:'+key, this, key);
		}
		
		return this;
	},
	
	setData: function ( data ) {
		
		this._settingData = true;
		this._dataChanged = false;
		
		PB.each(data, this.set, this);
		
		this._settingData = false;
		
		// Emit change
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
		
		// Return a clone, should be a deep clone?
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
	
	// Return REST url
	// private
	getUrl: function () {
		
		return this.url
			// Set controller name
			.replace('{name}', this.name)
			// Set id
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
					//	value = PB.is('Date', value) ? value.format() : value;
						break;
				}
				
				data[key] = value;
			}
		}, this);
		
		return data;
	},*/
	
	fetch: function () {
		
		// Nothing to delete
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
		
		// Nothing to delete
		if( !this.get('id') ) {
			
			return this.error('Already removed? No id');
		}
		
		(new PB.Request({
			
			url: this.getUrl(),
			method: 'DELETE'
		})).on('end', this.crudCallback, this).send();
	},
	
	// add sync -> one request handler
	
	// todo: track status (fetch, create, update, delete)
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


//Collection.findAll('Person');

// page-index
// max-results

// total-pages
// total-results

// collection.find("id:'1' OR id:'2'")
// collection.findAll("startdatetime>NOW")
// collection.findAll("startdatetime>''")
// Need vars in q?

pbMvc.Collection = PB.Class(PB.Observer, {
	
	// Url template, default Core5.1
	url: '/{model}/search.json',
	
	// 
	data: null,
	
	// 
	params: null,
	
	// Existing params, boolean indicates wether or not to send it
	// to the search api
	allowedParams: {
		
		'page-index': true,
		'max-results': true,
		'order': true,
		'q': true,
		'total-pages': false,
		'total-results': false
	},
	
	//
	previousData: null,
	
	// Using model xxx..
	model: null,
	
	// Consider
	// - page-index
	// - max-results
	// - total-results
	// - order
	
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
			// Set controller name
			.replace('{model}', this.model);
	},
	
	save: function () {
		
		
	},
	
	remove: function () {
		
		
	},
	
	// @param {mixed} id/object
	add: function ( mixed ) {
		
		if( PB.type(mixed) === 'object' ) {
			
			this.data.push( mixed );
		} else {
			// Properly an id, so load model and add to instance? We gotta do something
			// to remain the order..			
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
		
		// Only allow keys in allowedParams
		PB.each(data, function ( key, value ) {

			if( !this.allowedParams[key] ) {
				
				delete data[key];
			}
		}, this);
		
		// map -> entries to pbMvc.Model['blep']
		
		// emit('load') -> all results loaded
		
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
		
		// Fetch view from server
		this.view = PB.App.View.fetch( this.filename, this.expire );
		
		return this;
	},
	
	/**
	 * @param {Object} (optional)
	 */
	render: function ( data ) {
		
		// @todo -> parse view
		return this.view;
	}
});

PB.overwrite(pbMvc.View, {
	
	// Anti cache mechanism for ajax requests
	version: 'VERSION',
	
	// Stores the request result
	cache: {},
	
	// Default cache time in seconds
	expire: 3600,
	
	// Garbage collecter running?
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
		
		// Start garbage collecting
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

				// console.log( 'gone', data, url );
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
 *
 */
Histry = PB.Class({
	
	// Entries to keep in memory
	limit: 20,
	
	construct: function () {
		
		this.entries = [];
		this.length = 0;
	},
	
	push: function ( url, params ) {
		
		// Handle limit
		if( this.length >= this.limit ) {
			
			this.entries.shift();
		}
		
		// Add entry
		this.entries.push({
			
			url: url,
			params: params
		});
		
		this.length = this.entries.length;
	},
	
	current: function () {
		
		return this.entries[this.length-1];
	},
	
	item: function ( index ) {
		
		return index <= 0
			? this.entries[index + this.length - 1]
			: this.entries[index];
	}
	
	/*back: function () {
		
		this.go( -1 );
	},
	
	go: function ( index ) {
		
		this.app.navigate( this.item(index).url, this.item(index).params );
	}*/
});

return $.App = pbMvc;
});

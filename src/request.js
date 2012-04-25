pbMvc.Request = PB.Class({

	// Only methods with this prefix can be called
	prefix: 'http_',

	// Cache already created controllers
	cache: {},
	
	// 
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

			alert('Request did not match any route');
			return;
		}

		//
		var controllerName = params.controller,
			action = this.prefix+params.action,
			controller;

		// Does the given controller exists?
		if( !pbMvc.Controller[controllerName] ) {

			throw Error( '`'+controllerName+'` not found' );
			return;
		}

		// Does the given controller has the required action?
		if( !pbMvc.Controller[controllerName].prototype[action] ) {

			throw Error( '`'+action+'` not found in `'+controller+'`' );
			return;
		}

		// read cache
		controller = this.cache[controllerName];

		// Create new instance
		if( !controller ) {

			controller = this.cache[controllerName] = new pbMvc.Controller[controllerName];
		}

		// Exec requested method
		controller[action]( params );

		return this;
	},

	matchRoute: function ( url ) {

		var route;

		// Trim #
		url = url.trimLeft('#');
		url = url.trim('/');
		url = url.replace(/\/\/+/, '/');

		PB.each(pbMvc.Route.all(), function ( key, _route ) {

			if( route = _route.matches( url ) ) {

				// Stop loop
				return true;
			}
		});

		return route;
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
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

			console.log('Request did not match any route');
			return;
		}

		//
		var action = this.prefix+params.action,
			controllerName = params.controller,
			controller,
			proto;

		// Does the given controller exists?
		if( !pbMvc.Controller[controllerName] ) {

			throw Error( '`'+controllerName+'` not found' );
			return;
		}
		
		proto = pbMvc.Controller[controllerName].prototype;

		// Does the given controller has the required action?
		if( !proto[action] ) {

			throw Error( '`'+action+'` not found in `'+controller+'`' );
			return;
		}

		// read cache
		controller = this.cache[controllerName];

		if( !controller ) {
			
			// Create new instance
			controller = this.cache[controllerName] = new pbMvc.Controller[controllerName];
		}
		
		if( PB.is('Function', proto.before) ) {
			
			controller.before( params );
		}
		
		// Execute the requested method
		controller[action]( params );
		
		if( PB.is('Function', proto.after) ) {
			
			controller.after( params );
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

		// Trim #
		url = url.trimLeft('#');
		url = url.trim('/');
		url = url.replace(/\/\/+/, '/');

		PB.each(pbMvc.Route.all(), function ( key, _route ) {

			if( parts = _route.matches( url ) ) {

				// Stop loop
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
		
		// Hash changed?
		if( window.location.hash !== this.hash ) {
			
			this.hash = window.location.hash;

			this.execute();
		}
	}
});
pbMvc.Request = PB.Class({

	// Only methods with this prefix can be called
	prefix: 'http_',

	// Cache already created controllers
	cache: {},
	
	//
	history: [],
	historyLimit: 10, 
	
	// 
	hash: null,
	
	//
	basePath: '/',
	
	// Use pushstate
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
		
		// Execute request silently
		if( options && options.silent ) {
			
			options.silent = void 0;
			
			return this.execute( url, options );
		}
		
		// With pushState, handle url delegation automatically
		if( this.pushstate && pushState ) {
			
			history.pushState('', '', url);
			this.execute( url );
		}
		// Hashbang
		else {
			
			window.location.hash = '!'+url;
		}
		
		return this;
	},

	/**
	 *
	 */
	execute: function ( url, params ) {
		
//		console.log( arguments[0], PB.type(arguments[0]) === 'popstateevent' );
		
		if( !PB.is('String', url) ) {
			
			url = this.pushstate && pushState
				? window.location.pathname	// -> Strip baseUrl
				: window.location.hash;
		}
		
		// Remove basePath
		url = url.trimLeft('#');
		url = url.trimLeft('!');
		url = url.trimLeft(this.basePath);
		
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

			console.exception( '`'+controllerName+'` not found' );
			return;
		}
		
		proto = pbMvc.Controller[controllerName].prototype;

		// Does the given controller has the required action?
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
		
		if( this.history.length && controllerName !== this.history[this.history.length-1].controller ) {
			
			// Previous called controller will always be in cache
			prevController = this.cache[this.history[this.history.length-1].controller];

			if( PB.is('Function', prevController.change) ) {

				prevController.change( params );
			}
		}
		
		// Execute before methods if existing
		if( PB.is('Function', proto.before) ) {
			
			controller.before( params );
		}
		
		// Execute the requested method
		controller[action]( params );
		
		// Execute after methods if existing
		if( PB.is('Function', proto.after) ) {
			
			controller.after( params );
		}
		
		// Add to history
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

		// Trim #
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
	},
	
	getHistory: function ( index ) {
		
		return index < 0
			? this.history[index + this.history.length]
			: this.history[index];
	}
});
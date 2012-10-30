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
		
		// Do not trigger same request twice
		if( url === this.history.current().url ) {
			
			return;
		}
		
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
		
		// Add request to history, before execution of action and after the before method
		this.history.push(url, params);
		
		// Execute the requested action
		controller[action]( params );
		
		// Execute after method
		if( PB.type(proto.after) === 'function' ) {
			
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
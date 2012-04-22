pbMvc.Request = PB.Class({

	// Only methods with this prefix can be called
	prefix: 'http_',

	// Cache already created controllers
	cache: {},

	/**
	 *
	 */
	construct: function () {

		if( 'onhashchange' in window ) {

			PB(window).on('hashchange', this.execute.bind(this));
		} else {

			var old = window.location.hash,
				current;

			setInterval( function() {

				current = window.location.hash;

				if( old !== current ){

					this.execute().bind(this);
				}

				old = current;

			}.bind(this), 1);

		}
	},

	/**
	 *
	 */
	execute: function ( url, params ) {

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

		var route,
			uri = PB.is('String', url)
			 	? url
				: window.location.hash;

		// Trim #
		uri = uri.trimLeft('#');
		uri = uri.trim('/');
		uri = uri.replace(/\/\/+/, '/');

		PB.each(pbMvc.Route.all(), function ( key, _route ) {

			if( route = _route.matches( uri ) ) {

				// Stop loop
				return true;
			}
		});

		return route;
	}
});
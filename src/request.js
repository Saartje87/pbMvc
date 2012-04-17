pbMvc.Request = PB.Class({

	prefix: 'http_',

	cache: {},

	construct: function () {

		if( 'onhashchange' in window ) {

			PB(window).on('hashchange', this.execute.bind(this));
		} else {

			// Timer based...
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

		// Guess we dont want to overwrite route vars
		if( params ) {

			route = PB.extend(route, params);
		}

		//
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

		// read cache
		controller = this.cache[controllerName];

		// Create new instance if not cached
		if( !controller ) {

			this.cache[controllerName] = controller = new pbMvc.Controller[controllerName];
		}

		// Exec requested method
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

		// Trim #
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
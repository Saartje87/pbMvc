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

		// Transform string into regexp
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

			// Word boundry?
			if( property.charAt(0) === ':' ) {

				group = '\\w';
				// modifier required for group
				modifier = '+';
				property = vars[i].substr( 1 );
			}

			// Modifier?
			if( /[\*\+]/.test( property.charAt(property.length - 1) ) ) {

				modifier = property.substr( property.length - 1 );
				property = property.substr( 0, property.length - 1 );
			}

			// Specified rexexp?
			if( /\[.*?\]$/.test( property ) ) {

				// Escape 'match'
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
			
			// Next is optional? remove slash
			if( vars[i+1] && /[\*\+]/.test( vars[i+1] ) && !/[\*\+]$/.test( vars[i] ) ) {
				
				regexp += '?';
			}
		}

		regexp = new RegExp( regexp.replace(/\\\/\??$/, ''), 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});



// History of the address + trigger
PB.extend(pbMvc.Route, {


	// by default disabled
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

				// pbMvc.Route.history = this.history;
			}.bind(this));
		}

		return ( function() {

				return this.journey;

		}.bind(this)());
	}

});
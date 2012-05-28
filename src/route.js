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

			throw Error('Already declared route::'+name);
		}
		
		var parsed = parseString(route);
		
		console.log( parsed.regexp );
		
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

});
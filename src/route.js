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
		var parts = route.split('/'),
			properties = [],
			property,
			i = 0,
			regexp = '^';

		for( i = 0; i < parts.length; i++ ) {
			
			if( property = parts[i].match(/^:([a-z0-9_-]+)/i) ) {
				
				properties.push( property[1] );
			}
			
			regexp += parseStringPart( parts[i], parts[i+1] );
		}

		regexp = new RegExp( regexp.replace(/\\\/\??$/, ''), 'i' );

		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});

function parseStringPart ( part, nextPart ) {
	
	var regexp = '';
	
	if( part.charAt(0) === ':' ) {
		
		var match;
		
		regexp += '(';
		
		if( match = part.match(/\[(.*?)\]/) ) {
			
			regexp += match[0];
		} else {
			
			// Default
			regexp += '[a-zA-Z0-9_-]';
		}
		
		regexp += /\*$/.test( part ) ? '*' : '+';
		
		regexp += ')';
	} else {
		
		regexp += part;
	}
	
	if( nextPart ) {
		
		regexp += '/'+(/\*$/.test( nextPart ) ? '?' : '+');
	}
	
	return regexp;
}


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
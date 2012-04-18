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
		}
		
		regexp = new RegExp( regexp.replace(/\\\/\??$/, ''), 'i' );
		
		console.log( regexp );
		
		return pbMvc.Route.routes[name] = new pbMvc.Route( name, regexp, properties );
	}
});

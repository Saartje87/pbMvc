/**
 * 
 */
pbMvc.View = PB.Class({
	
	/**
	 *
	 */
	construct: function ( filename ) {
		
		this.filename = filename;
	},
	
	/**
	 *
	 */
	toString: function () {
		
		return this.render();
	},
	
	/**
	 *
	 */
	render: function () {
		
		var capture = PB.App.View.cache[this.filename];
		
		if( !capture ) {
			
			PB.App.View.cache[this.filename] = capture = PB.App.View.load( this.filename );
		}
		
		return capture;
	}
});

PB.overwrite(pbMvc.View, {
	
	// Anti cache mechanism for ajax requests
	version: '.VERSION'
	
	// Stores the request result
	cache: {},
	
	/**
	 * 
	 */
	load: function ( url ) {
		
		var response,
			request = new PB.Request({
			
				url: url,
				async: false,
				data: {

					ac: pbMvc.View.version
				}
			});
		
		request.on('end', function ( t, code ) {
			
			switch( code ) {
				
				case 404:
					throw new Error('View file `'+url+'` not found');
					break;
				
				default:
					response = t.responseText;
			}
		}).send();
		
		return response;
	}
});
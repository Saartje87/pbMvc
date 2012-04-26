pbMvc.View = PB.Class({
	
	construct: function ( filename ) {
		
		this.filename = filename;
	},
	
	toString: function () {
		
		return this.render();
	},
	
	render: function () {
		
		var capture = PB.App.View.cache[this.filename];
		
		if( !capture ) {
			
			PB.App.View.cache[this.filename] = capture = PB.App.View.load( this.filename );
		}
		
		return capture;
	}
});

PB.overwrite(pbMvc.View, {
	
	cache: {},
	
	load: function ( url ) {
		
		var request = new PB.Request({
			
				url: url,
				async: false,
				data: {

					ac: '.VERSION'
				}
			}),
			response;
		
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
pbMvc.Model = PB.Class({
	
	// Url template, default Core5.1
	url: '/{name}/rest/{id}.json?recursive=1',
	
	construct: function ( id ) {
		
		this.data = {};
		
		this.loaded = false;
		
		if( id !== undefined ) {
			
			this.set('id', id)
				.read( id );
		}
	},
	
	// Handles key=>value or object
	set: function ( key, value ) {
		
		this.data[key] = value;
		
		return this;
	},
	
	isset: function ( key ) {
		
		return this.data[key] !== undefined;
	},
	
	unset: function ( key ) {
		
		delete this.data[key];
		
		return this;
	},
	
	// Retrieves the data[key] or whole object
	get: function ( key ) {
		
		return this.data[key];
	},
	
	isValid: function () {
		
		
	},
	
	error: function () {
		
		
	},
	
	/**
	 * Process the.data into a nice object, right for storing it on the server
	 */
	process: function () {
		
		// User this.set / this.get / this.unset
	},
	
	read: function () {
		
		if( this.loaded ) {
			
			return;
		}
		
		var url = this.url.replace('{name}', this.name).replace('{id}', this.get('id'));
		
		(new PB.Request({

			url: url,
			async: false
		})).on('end', function ( t, code ){

			switch ( code ) {

				case 200:
					if( !t.responseJSON ) {
						
						throw new Exception('No valid JSON response');
					}
				
					this.set( t.responseJSON );
					break;

				default:
					throw new Exception('Error in reading `Model '+this.name+'`');
					break;
			}
		}.bind(this)).send();

		return this;
	},
	
	save: function () {
		
		
	},
	
	remove: function () {
		
		
	}
});


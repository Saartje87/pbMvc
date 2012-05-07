pbMvc.Model = PB.Class({
	
	// 
	model: null,
	
	// 
	name: null,
	
	// Url template, default Core5.1
	url: '/{name}/rest/{id}.json?recursive=1',
	
	construct: function ( id ) {
		
		if( !this.name ) {
			
			throw new Error('Name required');
		}
		
		if( !this.model ) {
			
			throw new Error('Model required for '+this.name);
		}
		
		this.model.id = { type: 'number' };
		
		this.data = {};
		
		this.loaded = false;
		
		if( id !== undefined ) {
			
			this.set('id', id)
				.read( id );
		}
	},
	
	// Handles key=>value or object
	set: function ( key, value ) {
		
		// Handle object
		if( PB.is('Object', key) ) {
			
			PB.each(key, this.set, this);
		} else {
			
			this.data[key] = value;
		}
		
		return this;
	},
	
	isset: function ( key ) {
		
		return this.data[key] !== undefined;
	},
	
	unset: function ( key ) {
		
		delete this.data[key];
		
		return this;
	},
	
	/**
	 * Retrieve entry or all data
	 *
	 * @param string
	 * @return mixed
	 */
	get: function ( key ) {
		
		return key ? this.data[key] : this.data;
	},
	
	isValid: function () {
		
		
	},
	
	error: function () {
		
		
	},
	
	/**
	 * Process the.data into a nice object, right for storing it on the server
	 */
	preprocess: function () {
		
		// User this.set / this.get / this.unset
	},
	
	// Return REST url
	getUrl: function () {
		
		return this.url.replace('{name}', this.name).replace('{id}', this.get('id') || '');
	},
	
	//
	getPostData: function () {
		
		var data = {};
		
		PB.each(this.data, function ( key, value ) {
			
			if( key in this.model ) {
				
				switch ( this.model[key].type ) {
					
					case 'date':
					//	value = PB.is('Date', value) ? value.format() : value;
						break;
				}
				
				data[key] = value;
			}
		}, this);
		
		return data;
	},
	
	read: function () {
		
		if( this.loaded ) {
			
			return;
		}
		
		(new PB.Request({

			url: this.getUrl(),
			async: false
		})).on('end', function ( t, code ){

			switch ( code ) {

				case 200:
					if( !t.responseJSON ) {
						
						throw new Error('No valid JSON response');
					}
				
					this.set( t.responseJSON );
					break;

				default:
					throw new Error('Error in reading `Model '+this.name+'`');
					break;
			}
		}.bind(this)).send();

		return this;
	},
	
	save: function () {
		
		(new PB.Request({
			
			url: this.getUrl(),
			async: false,
			method: this.get('id') ? 'PUT' : 'POST',
			data: {
				__data: JSON.stringify(this.getPostData())
			}
		})).send();
	},
	
	remove: function () {
		
		// Nothing to delete
		if( !this.get('id') ) {
			
			return;
		}
		
		(new PB.Request({
			
			url: this.getUrl(),
			async: false,
			method: 'DELETE'
		})).send();
	}
});


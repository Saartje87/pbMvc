pbMvc.Model = PB.Class({
	
	// 
	model: null,
	
	// 
	name: null,
	
	// Url template, default Core5.1
	url: '/{name}/rest/{id}.json?recursive=1',
	
	construct: function ( id ) {
		
		if( !this.name ) {
			
			throw new Error('Model.name required');
		}
		
		if( !this.model ) {
			
			throw new Error('Model.model required for '+this.name);
		}
		
		// For internal use
		this.model.id = { type: 'number' };
		
		// Model data
		this.data = {};
		
		this.loaded = false;
		
		// Read if id given
		if( id !== undefined ) {
			
			this.set('id', id)
				.read( id );
		}
	},
	
	// Handles key=>value or object
	set: function ( key, value ) {
		
		if( key === 'id' ) {
			
			// Asume an existing object, so set loaded to true
			this.loaded = true;
		}
		
		if( this.properties && this.properties[key] && this.properties[key].set ) {
			
			value = this.properties[key].set( value, this.data[key] );
		}
		
		this.data[key] = value;
		
		return this;
	},
	
	setData: function ( data ) {
		
		PB.each(data, this.set, this);
		
		return this;
	},
	
	/**
	 * Retrieve entry or all data
	 *
	 * @param string
	 * @return mixed
	 */
	get: function ( key ) {
		
		var value = this.data[key];
		
		if( value === undefined ) {
			
			return null;
		}
		
		if( this.properties && this.properties[key] && this.properties[key].get ) {
			
			value = this.properties[key].get( value );
		}
		
		return value;
	},
	
	getData: function () {
		
		return this.data;
	},
	
	isset: function ( key ) {
		
		return this.data[key] !== undefined;
	},
	
	unset: function ( key ) {
		
		delete this.data[key];
		
		return this;
	},
	
	isValid: function () {
		
		
	},
	
	error: function () {
		
		
	},
	
	// Return REST url
	getUrl: function () {
		
		return this.url
			// Set controller name
			.replace('{name}', this.name)
			// Set id
			.replace('{id}', this.get('id') || '');
	},
	
	/**
	 * 
	 */
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
		
		// Nothing to delete
		if( !this.get('id') ) {
			
			throw new Error('Failed to read `'+this.name+'`, no id set!');
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


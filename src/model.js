// Add this.error -> to trigger this.emit('error', message || {message: '', code: 0})

pbMvc.Model = PB.Class(PB.Observer, {
	
	// 
	name: null,
	
	// Url template, default Core5.1
	url: '/{name}/rest/{id}.json?recursive=1',
	
	// 
	data: null,
	
	//
	previousData: null,
	
	// Prevent trigger of change event when settings
	// data trough setData method
	_settingData: false,
	
	construct: function ( id ) {
		
		if( !this.name ) {
			
			return this.error('Model.name required');
		}
		
		this.parent();
		
		// Model data
		this.data = {};
		this.previousData = {};
		
		// Fetch if id given
		if( id !== undefined ) {
			
			this.set('id', id)
				.fetch();
		}
	},
	
	// Handles key=>value or object
	set: function ( key, value ) {
		
		// Store previous value
		var previousValue = this.data[key];
		
		// Do nothing when value is not changed
		if( previousValue === value ) {
			
			return this;
		}
		
		// Execute data 'set-binding'
	/*	if( this.properties && this.properties[key] && this.properties[key].set ) {
			
			value = this.properties[key].set.call( this, value, this.data[key] );
		}*/
		
		// Data has changed, used for setData method
		this._dataChanged = true;
		
		this.data[key] = value;
		
		// Only trigger for single change of property
		if( !this._settingData ) {
			
			// Emit any change
			this.emit('change', this);
			
			// Emit specific event listening
			// will trigger like change:name
			this.emit('change:'+key, this, key);
		}
		
		return this;
	},
	
	setData: function ( data ) {
		
		this._settingData = true;
		this._dataChanged = false;
		
		PB.each(data, this.set, this);
		
		this._settingData = false;
		
		// Emit change
		if( this._dataChanged ) {
			
			this.emit('change', this);
		}
		
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
		
		if( value === undefined || value === null ) {
			
			return null;
		}
		
/*		if( this.properties && this.properties[key] && this.properties[key].get ) {
			
			value = this.properties[key].get.call( this, value );
		}*/
		
		return value;
	},
	
	getData: function () {
		
		return PB.overwrite({}, this.data);
	},
	
	isset: function ( key ) {
		
		return this.data[key] !== undefined;
	},
	
	unset: function ( key ) {
		
		this.data[key] = void 0;
		
		return this;
	},
	
	isValid: function () {
		
		
	},
	
	error: function ( message ) {
		
		console.log('Silent fail :) -> ', message);
		
		return this;
	},
	
	// Return REST url
	// private
	getUrl: function () {
		
		return this.url
			// Set controller name
			.replace('{name}', this.name)
			// Set id
			.replace('{id}', this.get('id') || '');
	},
	
	/**
	 * Depricated -> removing explecite model declaration
	 */
/*	getRESTData: function () {
		
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
	},*/
	
	fetch: function () {
		
		// Nothing to delete
		if( !this.get('id') ) {
			
			return this.error('Failed to fetch `'+this.name+'`, no id set!');
		}
		
		(new PB.Request({

			url: this.getUrl(),
			async: false
		})).on('end', function ( t, status ){

			switch ( status ) {

				case 200:
					if( !t.responseJSON ) {
						
						this.error('No valid JSON response');
					}
				
					this.setData( t.responseJSON );
					break;

				default:
					this.error('Error in fetching `Model '+this.name+'`');
					break;
			}
		}, this).send();

		return this;
	},
	
	save: function () {
		
		(new PB.Request({
			
			url: this.getUrl(),
			method: this.get('id') ? 'PUT' : 'POST',
			data: {
				
				__data: JSON.stringify(this.data)
			}
		})).on('end', this.crudCallback, this).send();
	},
	
	remove: function () {
		
		// Nothing to delete
		if( !this.get('id') ) {
			
			return this.error('Already removed? No id');
		}
		
		(new PB.Request({
			
			url: this.getUrl(),
			method: 'DELETE'
		})).on('end', this.crudCallback, this).send();
	},
	
	// add sync -> one request handler
	
	// todo: track status (fetch, create, update, delete)
	crudCallback: function ( t, status ) {
		
		switch ( status ) {

			case 200:
			case 201:
				if( !t.responseJSON ) {
					
					return this.error('No valid JSON response');
				}
			
				this.setData( t.responseJSON );
				break;
			
			case 401:
				return this.error('Unauthorized');
				break;
			
			case 405:
				return this.error('Method Not Allowed');
				break;
			
			default:
				return this.error('CRUD error: `'+status+'`');
				break;
		}
	}
});


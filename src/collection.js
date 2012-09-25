//Collection.findAll('Person');

// page-index
// max-results

// total-pages
// total-results

// collection.find("id:'1' OR id:'2'")
// collection.findAll("startdatetime>NOW")
// collection.findAll("startdatetime>''")
// Need vars in q?

pbMvc.Collection = PB.Class(PB.Observer, {
	
	// Url template, default Core5.1
	url: '/{model}/search.json',
	
	// 
	data: null,
	
	// 
	params: null,
	
	// Existing params, boolean indicates wether or not to send it
	// to the search api
	allowedParams: {
		
		'page-index': true,
		'max-results': true,
		'order': true,
		'q': true,
		'total-pages': false,
		'total-results': false
	},
	
	//
	previousData: null,
	
	// Using model xxx..
	model: null,
	
	// Consider
	// - page-index
	// - max-results
	// - total-results
	// - order
	
	construct: function ( config ) {
		
		this.data = [];
		this.params = {};
		
		this.parent();
		
		PB.overwrite(this, config);
		
		if( !this.model || !pbMvc.Model[this.model] ) {
			
			return this.error('Model `'+this.model+'` not found');
		}
	},
	
	error: function ( message ) {
		
		console.log('Silent fail :) -> ', message);
		
		return this;
	},
	
	getUrl: function () {
		
		return this.url
			// Set controller name
			.replace('{model}', this.model);
	},
	
	save: function () {
		
		
	},
	
	remove: function () {
		
		
	},
	
	// @param {mixed} id/object
	add: function ( mixed ) {
		
		if( PB.type(mixed) === 'object' ) {
			
			this.data.push( mixed );
		} else {
			// Properly an id, so load model and add to instance? We gotta do something
			// to remain the order..			
		}
		
		return this;
	},
	
	clear: function () {
		
		this.data.length = 0;
		
		return this;
	},
	
	setData: function ( data ) {
		
		data.forEach(this.add, this);
	},
	
	setParam: function ( key, value ) {
		
		if( key in this.allowedParams ) {
			
			this.params[key] = value;
		}
		
		return this;
	},
	
	getParam: function ( key ) {
		
		return this.params[key] || undefined;
	},
	
	setParams: function ( data ) {
		
		PB.each(data, this.setParam, this);
		
		return this;
	},
	
	getParams: function () {
		
		return PB.overwrite({}, this.params);
	},
	
	/**
	 * Find specific model
	 */
	find: function () {
		
		
	},
	
	/**
	 * Find multiple models `collection`
	 */
	findAll: function ( q ) {
		
		var data = PB.overwrite({}, this.params);
		
		if( q ) {
			
			data.q = q;
		}
		
		// map -> entries to pbMvc.Model['blep']
		
		// emit('load') -> all results loaded
		
		(new PB.Request({
			
			url: this.getUrl(),
			data: data
		})).on('end', this.searchCallback, this).send();
	},
	
	searchCallback: function ( t, status ) {
		
		switch ( status ) {

			case 200:
			case 201:
				if( !t.responseJSON ) {
					
					return this.error('No valid JSON response');
				}
				
				PB.each(t.responseJSON, function ( key, value ) {
					
					if( key in this.allowedParams ) {
						
						this.setParam(key, value);
					}
				}, this);
				
				this.setData( t.responseJSON.results );
				
				this.emit('load', this);
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


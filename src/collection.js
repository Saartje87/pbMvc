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
	
	// Core 5.1 specific
/*	buidlQuery: function ( data ) {
		
		var dataClone = PB.overwrite({}, data);
		
		PB.extend(dataClone, this.data);
		
		PB.each(dataClone, function () {
			
			
		});
	}*/
	
	// save
	
	create: function () {
		
		
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
	
	remove: function () {
		
		
	},
	
	setData: function () {
		
		PB.each(data, this.add, this);
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
		
		// map -> entries to pbMvc.Model['blep']
		
		// emit('load') -> all results loaded
		
		(new PB.Request({
			
			url: this.getUrl(),
			data: {
				
				q: q
				// 'max-results': 
			}
		})).on('end', this.searchCallback, this).send();
	},
	
	searchCallback: function ( t, status ) {
		
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


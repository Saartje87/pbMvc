/**
 * 
 */
pbMvc.View = PB.Class({
	
	/**
	 *
	 */
	construct: function ( filename, expire ) {
		
		this.filename = filename || this.filename;
		this.expire = (expire === undefined) ? pbMvc.View.expire : expire;
	},
	
	/**
	 * @param {String} view
	 */
	setView: function ( view ) {
		
		this.view = view;
	},
	
	/**
	 * Fetch file from server
	 *
	 * @param {Function} callback
	 * @todo -> asynchrone
	 */
	fetch: function ( fn ) {
		
		// Fetch view from server
		this.view = PB.App.View.fetch( this.filename, this.expire );
		
		return this;
	},
	
	/**
	 * @param {Object} (optional)
	 */
	render: function ( data ) {
		
		// @todo -> parse view
		return this.view;
	}
});

PB.overwrite(pbMvc.View, {
	
	// Anti cache mechanism for ajax requests
	version: 'VERSION',
	
	// Stores the request result
	cache: {},
	
	// Default cache time in seconds
	expire: 3600,
	
	// Garbage collecter running?
	collecting: false,
	
	/**
	 * Loads the given view synchrone
	 *
	 * @param string
	 * @return string
	 */
	fetch: function ( url, expire ) {
		
		if( pbMvc.View.cache[url] && Date.now() < pbMvc.View.cache[url].expire ) {
			
			return pbMvc.View.cache[url].text;
		}
		
		var request = new PB.Request({
			
				url: url,
				async: false,
				data: {

					ac: pbMvc.View.version
				}
			});
		
		pbMvc.View.cache[url] = {
			
			expire: Date.now() + (expire * 1000)
		};
		
		request.on('end', function ( t, code ) {
			
			switch( code ) {
				
				case 404:
					console.exception('View file `'+url+'` not found');
					break;
				
				case 200:
					pbMvc.View.cache[url].text = t.responseText;
					break;
				
				default:
					console.exception('Response didn`t return a valid code, returned '+code);
			}
		}).send();
		
		// Start garbage collecting
		if( !pbMvc.View.collecting ) {
			
			setInterval(pbMvc.View.collectGarbage, 10000);
			
			pbMvc.View.collecting = true;
		}
		
		return pbMvc.View.cache[url].text;
	},
	
	/**
	 * Checks whether entry is expired and removes the entry
	 * This method should only be called internally
	 */
	collectGarbage: function () {
		
		var now = Date.now();
	
		PB.each(pbMvc.View.cache, function ( url, data ) {
			
			if( Date.now() > data.expire ) {

				// console.log( 'gone', data, url );
				delete pbMvc.View.cache[url];
			}
		});
	}
});
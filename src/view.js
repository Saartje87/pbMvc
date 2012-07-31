/**
 * 
 */
pbMvc.View = PB.Class({
	
	/**
	 *
	 */
	construct: function ( filename, expire ) {
		
		this.filename = filename;
		this.expire = expire;
	},
	
	/**
	 *
	 */
	render: function () {
		
		return PB.App.View.fetch( this.filename, this.expire );
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
		
		if( pbMvc.View.cache[url] && pbMvc.View.cache[url].expire > Date.now() ) {
			
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
			
			expire: Date.now() + (expire === undefined ? pbMvc.View.expire*1000 : expire)
		};
		
		request.on('end', function ( t, code ) {
			
			switch( code ) {
				
				case 404:
					throw new Error('View file `'+url+'` not found');
					break;
				
				case 200:
					pbMvc.View.cache[url].text = t.responseText;
					break;
				
				default:
					throw new Error('Response didn`t return a valid code, returned '+code);
			}
		}).send();
		
		// Start garbage collecting
		if( !pbMvc.View.collecting ) {
			
			setInterval(pbMvc.View.collectGarbage, 30000);
			
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
			
			if( data.expire > now ) {

				delete pbMvc.View.cache[url];
			}
		});
	}
});
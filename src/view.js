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
	toString: function () {
		
		return this.render();
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
		
		if( !pbMvc.View.collecting ) {
			
			setInterval(function () {
				
				pbMvc.View.collectGarbage();
			}, 30000);
		}
		
		return pbMvc.View.cache[url].text;
	},
	
	collectGarbage: function () {
		
		var now = Date.now();
	
		PB.each(pbMvc.View.cache, function ( url, data ) {
			
			if( data.expire > now ) {

				delete pbMvc.View.cache[url];
			}
		});
	}
});
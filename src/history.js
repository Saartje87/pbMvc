/**
 *
 */
Histry = PB.Class({
	
	// Entries to keep in memory
	limit: 20,
	
	construct: function () {
		
		this.entries = [];
		this.length = 0;
	},
	
	push: function ( url, params ) {
		
		// Handle limit
		if( this.length >= this.limit ) {
			
			this.entries.shift();
		}
		
		// Add entry
		this.entries.push({
			
			url: url,
			params: params
		});
		
		this.length = this.entries.length;
	},
	
	current: function () {
		
		return this.entries[this.length-1];
	},
	
	item: function ( index ) {
		
		return index <= 0
			? this.entries[index + this.length - 1]
			: this.entries[index];
	}
	
	/*back: function () {
		
		this.go( -1 );
	},
	
	go: function ( index ) {
		
		this.app.navigate( this.item(index).url, this.item(index).params );
	}*/
});

pbMVC
=====

About
-----

*pbMVC* is a javascript browser MVC(Model View Controller) build upon [pbjs](https://github.com/Saartje87/pbjs) and inspired by the PHP framework of [Pluxbox](http://www.pluxbox.com) *Core5* and [Kohana](http://kohanaframework.org/)


Routes
------

	Signs
	: -> set match name, :controller
	! -> is required?, :!controller, controller now required
	* -> wildcard, :*q, will match all begining from this point
	
	// Examples
	:controller/:action
	
	// controller and action are now both optional, so it will fall to the defaults
	
	:!controller/:action
	// Controller is now required
	
	

Usage
-----

### Routes

!Note, operators are now after : and for now they need a specific order, :!* -> :*, :!. ***:*! will fail***

	PB.App.Route.set(
		// Route name
		'default',
		':controller/:action/:id[0-9a-z]'
	).defaults({

		controller: 'Home',
		action: 'index'
	});
	
	// q matches all after Search/
	PB.App.Route.set(
		// Route name
		'search',
		'Search/:*q'
	).defaults({

		controller: 'Home',
		action: 'index'
	});

### Controllers

	PB.App.Controller.Home = PB.Class({
		
		http_index: function () {
			
			console.log('Hello World!');
		}
	});

### Models

	PB.App.Model.User = PB.Class({
		
		name: 'User',
		
		model: {
			
			name: { type: 'text', required: true },
			email: { type: 'text' }
		}
	})


### Views
	
	var accountHTML = new PB.App.View('/user/account.html');
	
	div.innerHTML = accountHTML.render();


License
-------
This project is under the MIT License.

*Copyright 2011-1012, Pluxbox*
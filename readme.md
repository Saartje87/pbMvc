pbMVC
=====

About
-----

*pbMVC* is a javascript browser MVC(Model View Controller) build upon [pbjs](https://github.com/Saartje87/pbjs) and inspired by the PHP framework of [Pluxbox](http://www.pluxbox.com) *Core5* and [Kohana](http://kohanaframework.org/)


Usage
-----

### Routes

	PB.App.Route.set(
		// Route name
		'default',
		':controller*/:action*/:id[0-9a-z]*'
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
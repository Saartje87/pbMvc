#Model properties

* name, model name should match server rest api /***name***/rest/
* model, define model properties { name: { type: 'text' }, age: { type: 'number', required: true } }

---todo---
* id

#Model methods

* construct -> if id given, fetches model from server
* set
* setData
* get
* getData
* isset
* unset
* getRESTData, returns value in object which are defined in model
* fetch
* save
* remove
* isValid
* on
* off
* emit
* url -> should be string or function

---todo---
* clear -> clear all properties
* parse -> response handler
* clone
* toJSON
* previous/prev -> retrieve previous attribute state

#Collection definition
	
	var Users = PB.Class(PB.App.Collection, {
		
		model: User
	});

#Collection properties

* length
* model

#Collection methods

* add
* remove
* get -> model.id
* sort
* parse
* fetch
* url -> should be string or function

#route

#request

* navigate


#Bootstrap..

Init your project
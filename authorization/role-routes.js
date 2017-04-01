var	Role 		= require('./role-model');
var	Bookshelf 	= require('../config/database');

var Roles 		= Bookshelf.Collection.extend({
	model: Role
});

// on routes that end in /Roles
// ---------------------------------------------------------------------
function getAll(req, res) {
	Roles.forge().fetch()
		.then(models => res.json(models))
		.catch(err => res.send(err));
}


// on routes that end in /Roles/:id to get an Role
// ---------------------------------------------------------------------
function get(req, res) {
	if(req.params.id === '0') { // respond with a new Role model
		res.json(new Role());
	} else { // respond with fetched Role model
		Role.forge( {id: req.params.id} ).fetch()
			.then(model => res.json(model))
			.catch(err => res.send(err));
	}
}

// on routes that end in /Roles/myPermissions/:id to get an Role
// ---------------------------------------------------------------------
function getPermissions(req, res) {
	Role.forge( {id: req.params.id} ).fetch({withRelated: ['permissions']})
		.then(model => {
			let modelJson = model.toJSON();
			res.json(modelJson.permissions);
		})
		.catch(err => res.send(err));
}

// on routes that end in /Roles/:id to update an existing Role
// ---------------------------------------------------------------------
function put(req, res) {
	Role.forge({id: req.params.id}).fetch({require: true})
		.then(doUpdate)
		.catch(notifyError);

	function doUpdate(model){
		model.save({
			name: req.body.name || model.get('name')
		})
		.then(function(){
			res.json({error: false, data:{message: 'Role Details Updated'}});
		})
		.catch(function(err){
			res.status(500).json({error: true, data: {message: err.message}});
		});
	}
	function notifyError(err){
		res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /roles/mypermissions/:id to update an existing Role with mypermissions
// --------------------------------------------------------------------------------------------
function putPermissions(req, res) {
	let roleModel;
console.log('Inside role-routes >> putPermissions(req,res)...'); console.log('req params id: '+req.params.id);
	Role.forge({id: req.params.id}).fetch({require: true, withRelated:['permissions']})
		.then(detachExistingPermissions)
		.then(attachNewPermissions)
		.then(sendResponse)
		.catch(errorToNotify);

	function detachExistingPermissions(model){ // remove existing permissions first
		roleModel = model;
console.log('Inside role-routes >> detachExistingPermissions(model)...');console.log(model.toJSON());
		return model.permissions().detach();
	}
/*	function doUpdate(model){
		model.permissions().detach().then( // remove the existing permissions first
			() => model.permissions().attach(req.body.mypermissionsIds)); // attach new permissions
		res.json({error:false, data:{ message: 'My Permissions are attached to Role'}});
	}  */
	function attachNewPermissions(){
console.log('inside role-routes >> attachNewPermissions(model)...'); console.log(roleModel.toJSON());
		return roleModel.permissions().attach(req.body.mypermissionsIds); // attach new permissions
		//res.json({error:false, data:{ message: 'My Permissions are attached to Role' }});
	}

	function sendResponse(aColl) {
		res.json({error:false, data:{ message: 'My Permissions are attached to Role' }});
	}

	function errorToNotify(err){
		res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /Roles to post (to add) a new Role
// ---------------------------------------------------------------------
function post(req, res) {
	Role.forge({
		name: req.body.name,
	})
	.save()
	.then( model => res.json({error: false, data:{model}}))
	.catch( err => res.status(500).json({error: true, data:{message: err.message}}));
}

// on routes that end in /Roles/:id to delete an Role
// ---------------------------------------------------------------------
function del(req, res) {
	Role.forge({id: req.params.id}).fetch({require: true})
		.then(doDelete)
		.catch(notifyError);

	function doDelete(model){
		model.destroy()
			.then( () => res.json({error: true, data: {message: 'Role model successfully deleted'} }))
			.catch( (err) => res.status(500).json({error: true, data: {message: err.message}}));
	}
	function notifyError(err){
		res.status(500).json({error: true, data: {message: err.message}});
	}
}

module.exports = { getAll, post, get, put, del, getPermissions, putPermissions };

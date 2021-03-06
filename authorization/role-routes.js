var	Role 				= require('./role-model');
var	Bookshelf 	= require('../config/database');
var constants 	= require('../config/constants.json');
var auth 				= require('./authorization');

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

// on routes that end in /Roles/myPermissions/:id to get permissions role id
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
	let model;

	Role.forge({id: req.params.id}).fetch({require: true})
		.then(doAuth)
		.then(doUpdate)
		.catch(errorToNotify);

	function doAuth(model) {
		this.model = model;
		return auth.allowsEdit(req.decoded.id, 'roles', model); // check whether logged user is allowed to Edit this role model
	}

	function doUpdate(granted){
		let model = this.model
		model.save({
			name: req.body.name || model.get('name'),
			description: req.body.description || model.get('description'),
			inherits: req.body.inherits // optional field; it can be empty;
		})
		.then(function(){
			return res.json({error: false, data:{message: 'Role Details Updated'}});
		})
		.catch(function(err){
			return res.status(500).json({error: true, data: {message: err.message}});
		});
	}
	function errorToNotify(err){
		logger.error(err);
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /roles/mypermissions/:id to update an existing Role with mypermissions
// --------------------------------------------------------------------------------------------
function putPermissions(req, res) {
	let roleModel;
	logger.debug('Inside role-routes >> putPermissions(req,res)...');
	logger.debug('req params id: '+req.params.id);
	//Role.forge({id: req.params.id}).fetch({require: true, withRelated:['permissions']})
	retrieveModelWithPermissions()
		.then(doAuth)
		.then(detachExistingPermissions)
		.then(attachNewPermissions)
		.then(retrieveModelWithPermissions) // re-retrieve the model so as to get new permissions
		.then(sendResponse)
		.catch(errorToNotify);

	function retrieveModelWithPermissions() {
		logger.debug('retrieving role with permissions');
		return Role.forge({id: req.params.id}).fetch({require: true, withRelated:['permissions']})
	}
	function doAuth(model) {
		this.roleModel = model;
		return auth.allowsEdit(req.decoded.id, 'roles-permissions', model); // check whether logged user is allowed to Edit this role model
	}
	function detachExistingPermissions(granted){ // remove existing permissions first
		let model = this.roleModel;
		logger.debug('Inside role-routes >> detachExistingPermissions(model)...');
		logger.debug(model.toJSON());
		return model.permissions().detach();
	}

	function attachNewPermissions(){
		logger.debug('inside role-routes >> attachNewPermissions(model)...');
		logger.debug(this.roleModel.toJSON());
		return this.roleModel.permissions().attach(req.body.mypermissionsIds); // attach new permissions
	}

/*	function sendResponse(aColl) {
		logger.debug('exploring aColl after putPermissions')
		logger.debug(aColl.toJSON())
		res.json({error:false, data:{ message: 'My Permissions are attached to Role' }});
	} */

	function sendResponse(model) {
		let modelJson = model.toJSON();
		logger.debug('inside role-routes >> sendResponse(model)')
		logger.debug(modelJson)
		res.json(modelJson.permissions);
	}

	function errorToNotify(err){
		logger.error(err);
		res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /Roles to post (to add) a new Role
// ---------------------------------------------------------------------
function post(req, res) {

	auth.allowsAdd(req.decoded.id, 'roles') // check whether logged user is allowed to add a Role
		.then(getTotalForMaxCheck)
		.then(doSave)
		.then(sendResponse)
		.catch(errorToNotify);

	function getTotalForMaxCheck() {
		let tableName = Role.prototype.tableName;
		if(constants.maxRecordsDisabled) {
			logger.debug('Max Records DISABLED!');
			return new Promise((resolve) => resolve(''));
		}
		logger.debug('Max Records ENABLED');
		return Bookshelf.knex(tableName).count('id as CNT');
	}

	function doSave(total){
		logger.debug('doSave(...)!!');
		if(total && total[0].CNT >= constants.maxRecords.roles) {
			let msg = 'Maximum Limit Reached! Cannot Save Role details!';
			logger.log('error', msg);
			throw new Error(msg);
		}
		return Role.forge({
			name: req.body.name,
			description: req.body.description,
			inherits: req.body.inherits
		}).save();
	}

	function sendResponse(model){
		return res.json({error: false, data:{model}});
	}

	function errorToNotify(err) {
		logger.error(err);
		return res.status(500).json({error: true, data:{message: err.message}});
	}

}

// on routes that end in /Roles/:id to delete an Role
// ---------------------------------------------------------------------
function del(req, res) {

	let model;

	Role.forge({id: req.params.id}).fetch({require: true})
		.then(doAuth)
		.then(doDelete)
		.catch(errorToNotify);

	function doAuth(model) {
		this.model = model;
		return auth.allowsDelete(req.decoded.id, 'roles', model); // check whether logged user is allowed to Delete role model
	}

	function doDelete(granted){
		let model = this.model
		model.destroy()
			.then( () => res.json({error: true, data: {message: 'Role model successfully deleted'} }))
			.catch( (err) => res.status(500).json({error: true, data: {message: err.message}}));
	}
	function errorToNotify(err){
		logger.error(err);
		res.status(500).json({error: true, data: {message: err.message}});
	}
}

module.exports = { getAll, post, get, put, del, getPermissions, putPermissions };

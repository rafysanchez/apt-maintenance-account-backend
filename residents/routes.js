var	Bookshelf = require('../config/database');
var	Resident  = require('./model');
var auth 			= require('../authorization/authorization');
var constants	= require('../config/constants.json');

var Residents = Bookshelf.Collection.extend({
	model: Resident
});


// more routes for the API will happen here

// on routes that end in /residents
// ---------------------------------------------------------------------
function getAll(req, res) {
	Residents
		.forge()
		.fetch()
		.then(doAuth)
		.then(sendResponse)
		.catch(errorToNotify);

	function doAuth(models) {
		logger.debug('/api/residents >> getAll()...');
		return auth.allowedList(req.decoded.id, 'residents', models);
	}
	function sendResponse(models) {
		logger.debug('models being sent are: '); logger.debug(models.toJSON());
		res.json(models);
	}
	function errorToNotify(err) {
		logger.error(err);
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /residents/:id to get a resident
// ---------------------------------------------------------------------
function get(req, res) {
	if(req.params.id === '0') { // respond with a new resident model
		auth.allowsAdd(req.decoded.id, 'residents') // is authorized to add ?
			.then(granted => res.json(new Resident()))
			.catch(errorToNotify);
	} else { // respond with fetched re model
		Resident
			.forge( {id: req.params.id} )
			.fetch()
			.then(doAuth) // is authorized to view?
			.then(model => res.json(model))
			.catch(errorToNotify);
	}
	function doAuth(model) {
		logger.debug('/api/residents >> get()...');
		return auth.allowsView(req.decoded.id, 'residents', model);
	}
	function errorToNotify(err) {
		logger.error(err)
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}


// on routes that end in /residents/myflats/:id to get flats for resident id
// ---------------------------------------------------------------------
function getFlats(req, res) {
	Resident.forge( {id: req.params.id} ).fetch({withRelated: ['flats']})
		.then(model => {
			let modelJson = model.toJSON();
			res.json(modelJson.flats);
		})
		.catch(err => res.send(err));
}


// on routes that end in /residents/:id to update an existing resident
// ---------------------------------------------------------------------
function put(req, res) {

	let firstName = req.body.first_name;
	let lastName = req.body.last_name;
	let isA = req.body.is_a;
	let ownerId = req.body.owner_id;
	let occupiedOn = req.body.occupied_on;
	let vacatedOn = req.body.vacated_on;
	let model;

	Resident
		.forge({id: req.params.id})
		.fetch({require: true})
		.then(doAuth)
		.then(checkForDuplicate)
		.then(doUpdate)
		.then(sendResponse)
		.catch(errorToNotify);

	function doAuth(model) {
		this.model = model;
		return auth.allowsEdit(req.decoded.id, 'residents', model);
	}
	function checkForDuplicate(granted){ // implementing inner function1
		logger.debug('checkForDuplicate(...)!');
		logger.debug('granted...'+granted);
		let jModel = this.model.toJSON();
		if(jModel.first_name === firstName
			&& jModel.last_name === lastName){
				return Promise.resolve(0); // if no change in names, return count as zero
		}
		return Resident
			.where({first_name: firstName,
						  last_name: lastName,
						 	is_a: isA,
						 	owner_id: ownerId})
		  .count('id'); // returns Promise containing count
	}
	function doUpdate(count){
		logger.debug('count is: '+count);
		if(count) {
		 throw new Error('Duplicate Error!');
	 	}
		logger.debug('/api/residents >> put()...updating resident details');
		return this.model.save({
			first_name: firstName || this.model.get('first_name'),
			last_name: lastName, // empty string is allowed here
			is_a: isA || this.model.get('is_a'),
			occupied_on: occupiedOn, // null or blank allowed
			vacated_on: vacatedOn, // null allowed
			owner_id: ownerId || this.model.get('owner_id')
		});
	}
	function sendResponse() {
		return res.json({error: false, data:{message: 'Resident Details Updated'}});
	}
	function errorToNotify(err) {
		logger.error(err);
		//res.statusMessage = err.message;
		//res.status(500).send();
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /residents to post (to add) a new resident
// ---------------------------------------------------------------------
function post(req, res) {

	let firstName = req.body.first_name;
	let lastName = req.body.last_name;
	let isA = req.body.is_a;
	let ownerId = req.body.owner_id;
	let occupiedOn = req.body.occupied_on;
	let vacatedOn = req.body.vacated_on;

	auth.allowsAdd(req.decoded.id, 'residents')
		.then(getTotalForMaxCheck)
		.then(getCountForDupCheck)
		.then(doSave)
		.then(sendResponse)
		.catch(errorToNotify);

	function getTotalForMaxCheck(granted) {
		let tableName = Resident.prototype.tableName;
		if(constants.maxRecordsDisabled) {
			logger.debug('Max Records DISABLED!');
			return new Promise((resolve) => resolve(''));
		}
		logger.debug('Max Records ENABLED');
		return Bookshelf.knex(tableName).count('id as CNT');
	}

	function getCountForDupCheck(total){ // implementing inner function1
		logger.debug('getCountForDupCheck(...)!!');
		if(total && total[0].CNT >= constants.maxRecords.residents) {
			let msg = 'Maximum Limit Reached! Cannot Save Resident details!';
			logger.error(msg);
			throw new Error(msg);
		}
		return Resident
			.where({first_name: firstName,
						  last_name: lastName,
						 	is_a: isA,
						 	owner_id: ownerId})
		  .count('id'); // returns Promise containing count
	}

	function doSave(count) {
		if(count) {
			throw new Error('Duplicate Error!!');
		}
		logger.debug('/api/residents >> post()...saving new resident details');

		return Resident.forge({
			first_name: firstName,
			last_name: lastName,
			is_a: isA,
			occupied_on: occupiedOn,
			vacated_on: vacatedOn,
			owner_id: ownerId
		}).save();
	}
	function sendResponse(model) {
		return res.json({error: false, data:{model}});
	}
	function errorToNotify(err) {
		logger.error(err);
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /residents/:id to delete a resident
// ---------------------------------------------------------------------
function del(req, res) {
	Resident
		.forge({id: req.params.id})
		.fetch({require: true})
		.then(doAuth)
		.then(doDelete)
		.then(sendResponse)
		.catch(errorToNotify);

	function doAuth(model) {
		return auth.allowsDelete(req.decoded.id, 'residents', model);
	}
	function doDelete(model){
		logger.debug('/api/residents >> del()...');
		return model.destroy();
	}
	function sendResponse() {
		return res.json({error: false, data:{message: 'Resident Details Successfully Deleted'}});
	}
	function errorToNotify(err) {
		logger.error(err)
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

module.exports = { getAll, post, get, put, del, getFlats };

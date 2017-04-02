var	Bookshelf 			= require('../config/database');
var	Flat 	= require('./flat-model');
var auth 				= require('../authorization/authorization');

var Flats = Bookshelf.Collection.extend({
	model: Flat
});


// more routes for the API will happen here

// on routes that end in /flats
// ---------------------------------------------------------------------
function getAll(req, res) {
	Flats
		.forge()
		.fetch()
		.then(doAuth)
		//.then(models => res.json(models))
		.then(sendResponse)
		.catch(error);

	function doAuth(models) {
		logger.log('info', '/api/flats >> getAll()...');
		return auth.allowedList(req.decoded.id, 'flats', models);
	}
	function sendResponse(models) {
		logger.log('info', 'models being sent are: '); logger.log('info', models.toJSON());
		res.json(models);
	}
	function error(err) {
		logger.log('error', err.message);
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /flats/:id to get a flat
// ---------------------------------------------------------------------
function get(req, res) {
	if(req.params.id === '0') { // respond with a new flat model
		auth.allowsAdd(req.decoded.id, 'flats') // is authorized to add ?
			.then(granted => res.json(new Flat()))
			.catch(error);
	} else { // respond with fetched flat model
		Flat
			.forge( {id: req.params.id} )
			.fetch()
			.then(doAuth) // is authorized to view?
			.then(model => res.json(model))
			.catch(error);
	}
	function doAuth(model) {
		logger.log('info', '/api/flats >> get()...');
		return auth.allowsView(req.decoded.id, 'flats', model);
	}
	function error(err) {
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}
// on routes that end in /flats/:id to update an existing flat
// ---------------------------------------------------------------------
function put(req, res) {
	Flat
		.forge({id: req.params.id})
		.fetch({require: true})
		.then(doAuth)
		.then(doUpdate)
		.then(sendResponse)
		.catch(error);

	function doAuth(model) {
		return auth.allowsEdit(req.decoded.id, 'flats', model);
	}
	function doUpdate(model){
		logger.log('info', '/api/flats >> put()...');
		return model.save({
			block_number: req.body.block_number || model.get('block_number'),
			flat_number: req.body.flat_number || model.get('flat_number')
		});
	}
	function sendResponse() {
		return res.json({error: false, data:{message: 'Flat Details Updated'}});
	}
	function error(err) {
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /flats to post (to add) a new flat
// ---------------------------------------------------------------------
function post(req, res) {
	auth.allowsAdd(req.decoded.id, 'flats')
		.then(doSave)
		.then(sendResponse)
		.catch(error);

	function doSave(granted) {
		logger.log('info', '/api/flats >> post()...');
		return Flat.forge({
			block_number: req.body.block_number,
			flat_number: req.body.flat_number
		}).save()
	}
	function sendResponse(model) {
		return res.json({error: false, data:{model}});
	}
	function error(err) {
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

// on routes that end in /flats/:id to delete a flat
// ---------------------------------------------------------------------
function del(req, res) {
	Flat
		.forge({id: req.params.id})
		.fetch({require: true})
		.then(doAuth)
		.then(doDelete)
		.then(sendResponse)
		.catch(error);

	function doAuth(model) {
		return auth.allowsDelete(req.decoded.id, 'flats', model);
	}
	function doDelete(model){
		logger.log('info', '/api/flats >> del()...');
		return model.destroy();
	}
	function sendResponse() {
		return res.json({error: false, data:{message: 'Flat Details Successfully Deleted'}});
	}
	function error(err) {
		return res.status(500).json({error: true, data: {message: err.message}});
	}
}

module.exports = { getAll, post, get, put, del };

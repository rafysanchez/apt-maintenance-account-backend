var Bookshelf 	= require('../config/database');

var User 		= Bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	softDelete: true,
	roles: function() {
		return this.belongsToMany(Role);
	},
	infos: function() {
		return this.hasMany(Info);
	},
	hello: function(){
		logger.log('info', 'Hello, this is User Model');
	}
});

var Role = Bookshelf.Model.extend({
	tableName: 'roles'
});

var Info = Bookshelf.Model.extend({
	tableName: 'infos'
});

module.exports = Bookshelf.model('User', User);

var Bookshelf 	= require('../config/database');
//require('./info-model');
//require('../authorization/role-model');

var User 		= Bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	softDelete: true,
	roles: function() {
		return this.belongsToMany(Role);
	},
	infos: function() {
		return this.hasMany(Info);
	}
});

var Role = Bookshelf.Model.extend({
	tableName: 'roles'
});

var Info = Bookshelf.Model.extend({
	tableName: 'infos'
});




// module.exports = Bookshelf.model('User', User);
module.exports = Bookshelf.model('User', User);

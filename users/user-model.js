var Bookshelf 	= require('../config/database');

var User 		= Bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	softDelete: true,
	roles: function() {
		//return this.belongsToMany(Role).through(RoleUser);
		return this.belongsToMany(Role);
	},

	hello: function(){
		console.log('Hello, this is User Model');
	}
});

var Role = Bookshelf.Model.extend({
	tableName: 'roles'
})

module.exports = Bookshelf.model('User', User);
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('ReactionRoles', {
		reactionRolesId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		headerId: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		emoji: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};
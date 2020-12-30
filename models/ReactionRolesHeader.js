module.exports = (sequelize, DataTypes) => {
	return sequelize.define('ReactionRolesHeader', {
		reactionHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			primaryKey: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionTitle: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};
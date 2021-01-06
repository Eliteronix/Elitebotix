module.exports = (sequelize, DataTypes) => {
	return sequelize.define('ReactionRolesHeader', {
		reactionRolesHeaderId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionTitle: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};
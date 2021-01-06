module.exports = (sequelize, DataTypes) => {
	return sequelize.define('ReactionRolesHeader', {
		reactionRolesHeaderId: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			primaryKey: true,
		},
		reactionTitle: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};
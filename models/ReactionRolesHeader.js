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
		reactionChannelHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionTitle: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionColor: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		reactionDescription: {
			type: DataTypes.STRING,
		},
		reactionImage: {
			type: DataTypes.STRING,
		},
	});
};
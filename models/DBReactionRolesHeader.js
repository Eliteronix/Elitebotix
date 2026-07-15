module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBReactionRolesHeader', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'guildid',
		},
		reactionHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'reactionheaderid',
		},
		reactionChannelHeaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'reactionchannelheaderid',
		},
		reactionTitle: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'reactiontitle',
		},
		reactionColor: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'reactioncolor',
		},
		reactionDescription: {
			type: DataTypes.STRING,
			field: 'reactiondescription',
		},
		reactionImage: {
			type: DataTypes.STRING,
			field: 'reactionimage',
		},
	}, {
		tableName: 'dbreactionrolesheader',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
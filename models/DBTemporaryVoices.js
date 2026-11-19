module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBTemporaryVoices', {
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
		channelId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'channelid',
		},
		textChannelId: {
			type: DataTypes.STRING,
			field: 'textchannelid',
		},
		creatorId: {
			type: DataTypes.STRING,
			field: 'creatorid',
		},
	}, {
		tableName: 'dbtemporaryvoices',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};

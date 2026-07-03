module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBTickets', {
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
		creatorId: {
			type: DataTypes.STRING,
			field: 'creatorid',
		},
		statusId: {
			type: DataTypes.INTEGER,
			field: 'statusid',
		},
		statusName: {
			type: DataTypes.STRING,
			field: 'statusname',
		},
		additionalParties: {
			type: DataTypes.STRING,
			field: 'additionalparties',
		},
	}, {
		tableName: 'dbtickets',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
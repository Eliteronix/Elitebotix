module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBStarBoardMessages', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		originalChannelId: {
			type: DataTypes.STRING,
			field: 'originalchannelid',
		},
		originalMessageId: {
			type: DataTypes.STRING,
			field: 'originalmessageid',
		},
		starBoardChannelId: {
			type: DataTypes.STRING,
			field: 'starboardchannelid',
		},
		starBoardMessageId: {
			type: DataTypes.STRING,
			field: 'starboardmessageid',
		},
		starBoardMessageStarsQuantityMax: {
			type: DataTypes.INTEGER,
			field: 'starboardmessagestarsquantitymax',
		},
	}, {
		tableName: 'dbstarboardmessages',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
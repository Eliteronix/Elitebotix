module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBStarBoardMessages', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		originalChannelId: DataTypes.STRING,
		originalMessageId: DataTypes.STRING,
		starBoardChannelId: DataTypes.STRING,
		starBoardMessageId: DataTypes.STRING,
		paranoid: true,
	});
};
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
		},
		channelId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		creatorId: DataTypes.STRING,
		statusId: DataTypes.INTEGER,
		statusName: DataTypes.STRING,
		paranoid: true,
	});
};
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBGuildWhiteListed', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
		},
		whiteListedChannelId: DataTypes.STRING,
		paranoid: true,
	});
};
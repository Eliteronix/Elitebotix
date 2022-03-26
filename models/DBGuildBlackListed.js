module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBGuildBlackListed', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
		},
		blackListedChannelId: DataTypes.STRING,
		paranoid: true,
	});
};
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuGuildTrackers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		guildId: {
			type: DataTypes.STRING,
		},
		channelId: {
			type: DataTypes.STRING,
		},
		osuLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		taikoLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		taikoTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		taikoAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		catchLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		catchTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		catchAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		maniaLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		maniaTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		maniaAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		showAmeobeaUpdates: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		medals: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		duelRating: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		matchActivity: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		matchActivityAutoTrack: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		paranoid: true,
	});
};

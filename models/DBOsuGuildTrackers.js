module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuGuildTrackers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		guildId: {
			type: DataTypes.STRING,
			field: 'guildid',
		},
		channelId: {
			type: DataTypes.STRING,
			field: 'channelid',
		},
		acronym: {
			type: DataTypes.STRING,
			field: 'acronym',
		},
		osuLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuleaderboard',
		},
		osuTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osutopplays',
		},
		osuAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuameobea',
		},
		taikoLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'taikoleaderboard',
		},
		taikoTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'taikotopplays',
		},
		taikoAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'taikoameobea',
		},
		catchLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'catchleaderboard',
		},
		catchTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'catchtopplays',
		},
		catchAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'catchameobea',
		},
		maniaLeaderboard: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'manialeaderboard',
		},
		maniaTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'maniatopplays',
		},
		maniaAmeobea: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'maniaameobea',
		},
		tournamentTopPlays: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'tournamenttopplays',
		},
		showAmeobeaUpdates: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'showameobeaupdates',
		},
		medals: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'medals',
		},
		duelRating: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'duelrating',
		},
		matchActivity: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'matchactivity',
		},
		matchActivityAutoTrack: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'matchactivityautotrack',
		},
	}, {
		tableName: 'dbosuguildtrackers',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};

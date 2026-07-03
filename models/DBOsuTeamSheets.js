module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTeamSheets', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			field: 'guildid',
		},
		channelId: {
			type: DataTypes.STRING,
			field: 'channelid',
		},
		messageId: {
			type: DataTypes.STRING,
			field: 'messageid',
		},
		updateUntil: {
			type: DataTypes.DATE,
			field: 'updateuntil',
		},
		players: {
			type: DataTypes.STRING,
			field: 'players',
		},
		poolName: {
			type: DataTypes.STRING,
			field: 'poolname',
		},
		poolCreatorId: {
			type: DataTypes.STRING,
			field: 'poolcreatorid',
		},
		teamsize: {
			type: DataTypes.INTEGER,
			field: 'teamsize',
		},
		duelRatingEstimate: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'duelratingestimate',
		},
		EZMultiplier: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 1.75,
			field: 'ezmultiplier',
		},
		FLMultiplier: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 1.5,
			field: 'flmultiplier',
		},
	}, {
		tableName: 'dbosuteamsheets',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
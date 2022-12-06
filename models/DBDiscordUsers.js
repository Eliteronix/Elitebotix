module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBDiscordUsers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuVerificationCode: {
			type: DataTypes.STRING,
		},
		osuVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuName: {
			type: DataTypes.STRING,
		},
		osuBadges: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		osuPP: {
			type: DataTypes.STRING,
		},
		lastOsuPPChange: {
			type: DataTypes.DATE,
		},
		nextOsuPPUpdate: {
			type: DataTypes.DATE,
		},
		osuDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuNoModDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHiddenDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuDuelProvisional: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuDuelOutdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		lastDuelRatingUpdate: {
			type: DataTypes.DATE,
		},
		osuDuelRatingUpdates: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuRank: {
			type: DataTypes.STRING,
		},
		taikoPP: {
			type: DataTypes.STRING,
		},
		lastTaikoPPChange: {
			type: DataTypes.DATE,
		},
		nextTaikoPPUpdate: {
			type: DataTypes.DATE,
		},
		taikoRank: {
			type: DataTypes.STRING,
		},
		catchPP: {
			type: DataTypes.STRING,
		},
		lastCatchPPChange: {
			type: DataTypes.DATE,
		},
		nextCatchPPUpdate: {
			type: DataTypes.DATE,
		},
		catchRank: {
			type: DataTypes.STRING,
		},
		maniaPP: {
			type: DataTypes.STRING,
		},
		lastManiaPPChange: {
			type: DataTypes.DATE,
		},
		nextManiaPPUpdate: {
			type: DataTypes.DATE,
		},
		maniaRank: {
			type: DataTypes.STRING,
		},
		osuMainServer: {
			type: DataTypes.STRING,
			defaultValue: 'bancho',
		},
		osuMainMode: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		osuMOTDRegistered: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuMOTDMuted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuMOTDlastRoundPlayed: {
			type: DataTypes.DATE,
		},
		osuMOTDerrorFirstOccurence: {
			type: DataTypes.DATE,
		},
		osuMOTDmutedUntil: {
			type: DataTypes.DATE,
		},
		osuNotFoundFirstOccurence: {
			type: DataTypes.DATE,
		},
		twitchName: {
			type: DataTypes.STRING,
		},
		twitchId: {
			type: DataTypes.STRING,
		},
		twitchOsuMapSync: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		patreon: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		birthday: {
			type: DataTypes.DATE,
		},
		weatherLocation: {
			type: DataTypes.STRING,
		},
		weatherDegreeType: {
			type: DataTypes.STRING,
		},
		tournamentPings: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		tournamentPingsBadged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		tournamentPingsMode: {
			type: DataTypes.STRING,
		},
		paranoid: true,
	});
};

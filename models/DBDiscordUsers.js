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
		country: {
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
		osuNoModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuHiddenDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHiddenDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHardRockDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuDoubleTimeDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuFreeModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
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
			type: DataTypes.INTEGER,
		},
		oldOsuRank: {
			type: DataTypes.INTEGER,
		},
		osuDerankRank: {
			type: DataTypes.INTEGER,
		},
		osuPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastOsuPlayCountChange: {
			type: DataTypes.DATE,
		},
		osuRankedScore: {
			type: DataTypes.STRING,
		},
		osuTotalScore: {
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
			type: DataTypes.INTEGER,
		},
		taikoPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastTaikoPlayCountChange: {
			type: DataTypes.DATE,
		},
		taikoRankedScore: {
			type: DataTypes.STRING,
		},
		taikoTotalScore: {
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
			type: DataTypes.INTEGER,
		},
		catchPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastCatchPlayCountChange: {
			type: DataTypes.DATE,
		},
		catchRankedScore: {
			type: DataTypes.STRING,
		},
		catchTotalScore: {
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
			type: DataTypes.INTEGER,
		},
		maniaPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastManiaPlayCountChange: {
			type: DataTypes.DATE,
		},
		maniaRankedScore: {
			type: DataTypes.STRING,
		},
		maniaTotalScore: {
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
		twitchVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		twitchOsuMapSync: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		twitchOsuMatchCommand: {
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
		tournamentPingsStartingFrom: {
			type: DataTypes.STRING,
		},
		tournamentBannedUntil: {
			type: DataTypes.DATE,
		},
		tournamentBannedReason: {
			type: DataTypes.STRING,
		},
		disableFollows: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		paranoid: true,
	});
};

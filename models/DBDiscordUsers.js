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
			field: 'userid',
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		country: {
			type: DataTypes.STRING,
			field: 'country',
		},
		osuVerificationCode: {
			type: DataTypes.STRING,
			field: 'osuverificationcode',
		},
		osuVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuverified',
		},
		osuName: {
			type: DataTypes.STRING,
			field: 'osuname',
		},
		osuBadges: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'osubadges',
		},
		osuPP: {
			type: DataTypes.DOUBLE,
			field: 'osupp',
		},
		lastOsuPPChange: {
			type: DataTypes.DATE,
			field: 'lastosuppchange',
		},
		nextOsuPPUpdate: {
			type: DataTypes.DATE,
			field: 'nextosuppupdate',
		},
		osuDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osuduelstarrating',
		},
		osuNoModDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osunomodduelstarrating',
		},
		osuNoModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osunomodduelstarratinglimited',
		},
		osuHiddenDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osuhiddenduelstarrating',
		},
		osuHiddenDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuhiddenduelstarratinglimited',
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osuhardrockduelstarrating',
		},
		osuHardRockDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuhardrockduelstarratinglimited',
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osudoubletimeduelstarrating',
		},
		osuDoubleTimeDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osudoubletimeduelstarratinglimited',
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.DOUBLE,
			field: 'osufreemodduelstarrating',
		},
		osuFreeModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osufreemodduelstarratinglimited',
		},
		osuDuelProvisional: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuduelprovisional',
		},
		osuDuelOutdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osudueloutdated',
		},
		lastDuelRatingUpdate: {
			type: DataTypes.DATE,
			field: 'lastduelratingupdate',
		},
		osuDuelRatingUpdates: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuduelratingupdates',
		},
		osuRank: {
			type: DataTypes.INTEGER,
			field: 'osurank',
		},
		oldOsuRank: {
			type: DataTypes.INTEGER,
			field: 'oldosurank',
		},
		osuDerankRank: {
			type: DataTypes.INTEGER,
			field: 'osuderankrank',
		},
		osuPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'osuplaycount',
		},
		lastOsuPlayCountChange: {
			type: DataTypes.DATE,
			field: 'lastosuplaycountchange',
		},
		osuRankedScore: {
			type: DataTypes.STRING,
			field: 'osurankedscore',
		},
		osuTotalScore: {
			type: DataTypes.STRING,
			field: 'osutotalscore',
		},
		taikoPP: {
			type: DataTypes.STRING,
			field: 'taikopp',
		},
		lastTaikoPPChange: {
			type: DataTypes.DATE,
			field: 'lasttaikoppchange',
		},
		nextTaikoPPUpdate: {
			type: DataTypes.DATE,
			field: 'nexttaikoppupdate',
		},
		taikoRank: {
			type: DataTypes.INTEGER,
			field: 'taikorank',
		},
		taikoPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'taikoplaycount',
		},
		lastTaikoPlayCountChange: {
			type: DataTypes.DATE,
			field: 'lasttaikoplaycountchange',
		},
		taikoRankedScore: {
			type: DataTypes.STRING,
			field: 'taikorankedscore',
		},
		taikoTotalScore: {
			type: DataTypes.STRING,
			field: 'taikototalscore',
		},
		catchPP: {
			type: DataTypes.STRING,
			field: 'catchpp',
		},
		lastCatchPPChange: {
			type: DataTypes.DATE,
			field: 'lastcatchppchange',
		},
		nextCatchPPUpdate: {
			type: DataTypes.DATE,
			field: 'nextcatchppupdate',
		},
		catchRank: {
			type: DataTypes.INTEGER,
			field: 'catchrank',
		},
		catchPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'catchplaycount',
		},
		lastCatchPlayCountChange: {
			type: DataTypes.DATE,
			field: 'lastcatchplaycountchange',
		},
		catchRankedScore: {
			type: DataTypes.STRING,
			field: 'catchrankedscore',
		},
		catchTotalScore: {
			type: DataTypes.STRING,
			field: 'catchtotalscore',
		},
		maniaPP: {
			type: DataTypes.STRING,
			field: 'maniapp',
		},
		lastManiaPPChange: {
			type: DataTypes.DATE,
			field: 'lastmaniappchange',
		},
		nextManiaPPUpdate: {
			type: DataTypes.DATE,
			field: 'nextmaniappupdate',
		},
		maniaRank: {
			type: DataTypes.INTEGER,
			field: 'maniarank',
		},
		maniaPlayCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'maniaplaycount',
		},
		lastManiaPlayCountChange: {
			type: DataTypes.DATE,
			field: 'lastmaniaplaycountchange',
		},
		maniaRankedScore: {
			type: DataTypes.STRING,
			field: 'maniarankedscore',
		},
		maniaTotalScore: {
			type: DataTypes.STRING,
			field: 'maniatotalscore',
		},
		osuMainServer: {
			type: DataTypes.STRING,
			defaultValue: 'bancho',
			field: 'osumainserver',
		},
		osuMainMode: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'osumainmode',
		},
		osuMOTDRegistered: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osumotdregistered',
		},
		osuMOTDMuted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osumotdmuted',
		},
		osuMOTDLastRoundPlayed: {
			type: DataTypes.DATE,
			field: 'osumotdlastroundplayed',
		},
		osuMOTDerrorFirstOccurence: {
			type: DataTypes.DATE,
			field: 'osumotderrorfirstoccurence',
		},
		osuMOTDmutedUntil: {
			type: DataTypes.DATE,
			field: 'osumotdmuteduntil',
		},
		osuNotFoundFirstOccurence: {
			type: DataTypes.DATE,
			field: 'osunotfoundfirstoccurence',
		},
		twitchName: {
			type: DataTypes.STRING,
			field: 'twitchname',
		},
		twitchId: {
			type: DataTypes.STRING,
			field: 'twitchid',
		},
		twitchVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'twitchverified',
		},
		twitchOsuMapSync: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'twitchosumapsync',
		},
		twitchOsuMatchCommand: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'twitchosumatchcommand',
		},
		patreon: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'patreon',
		},
		birthday: {
			type: DataTypes.DATE,
			field: 'birthday',
		},
		weatherLocation: {
			type: DataTypes.STRING,
			field: 'weatherlocation',
		},
		weatherDegreeType: {
			type: DataTypes.STRING,
			field: 'weatherdegreetype',
		},
		tournamentPings: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'tournamentpings',
		},
		tournamentPingsBadged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'tournamentpingsbadged',
		},
		tournamentPingsMode: {
			type: DataTypes.STRING,
			field: 'tournamentpingsmode',
		},
		tournamentPingsStartingFrom: {
			type: DataTypes.STRING,
			field: 'tournamentpingsstartingfrom',
		},
		tournamentBannedUntil: {
			type: DataTypes.DATE,
			field: 'tournamentbanneduntil',
		},
		tournamentBannedReason: {
			type: DataTypes.STRING,
			field: 'tournamentbannedreason',
		},
		disableFollows: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'disablefollows',
		},
	}, {
		tableName: 'dbdiscordusers',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};

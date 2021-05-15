const { DBDiscordUsers } = require('../dbObjects');
const { getOsuBadgeNumberById } = require('../utils.js');
const osu = require('node-osu');

module.exports = {
	async execute(client, processQueueEntry) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		const discordUserId = processQueueEntry.additions;

		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: discordUserId }
		});

		const osuUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 0 });

		discordUser.osuName = osuUser.name;
		discordUser.osuPP = osuUser.pp.raw;
		discordUser.osuRank = osuUser.pp.rank;

		const taikoUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 1 });

		discordUser.taikoPP = taikoUser.pp.raw;
		discordUser.taikoRank = taikoUser.pp.rank;

		const catchUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 2 });

		discordUser.catchPP = catchUser.pp.raw;
		discordUser.catchRank = catchUser.pp.rank;

		const maniaUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 3 });

		discordUser.maniaPP = maniaUser.pp.raw;
		discordUser.maniaRank = maniaUser.pp.rank;

		discordUser.osuBadges = await getOsuBadgeNumberById(discordUser.osuUserId);

		await discordUser.save();
	},
};
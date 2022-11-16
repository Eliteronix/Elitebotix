const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('tourneyFollow');
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (user) {
			let players = args[2].split(',');

			for (let i = 0; i < players.length; i++) {
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: players[i]
					}
				});

				if (!discordUser) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					const osuUser = await osuApi.getUser({ u: players[i], m: 0 });

					discordUser = await DBDiscordUsers.create({ osuUserId: osuUser.id, osuName: osuUser.name });
				}

				players[i] = discordUser.osuName;
			}

			await user.send(`Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\nhttps://osu.ppy.sh/community/matches/${args[1]}`);
		}
		processQueueEntry.destroy();
	},
};
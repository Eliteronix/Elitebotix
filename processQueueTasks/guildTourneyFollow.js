const { DBDiscordUsers, DBOsuGuildTrackers } = require('../dbObjects');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('tourneyFollow');
		let args = processQueueEntry.additions.split(';');

		try {
			const guild = await client.guilds.fetch(args[0]);
			const channel = await guild.channels.fetch(args[1]);

			let players = args[3].split(',');

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

					const osuUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 0 });

					discordUser = await DBDiscordUsers.create({ osuUserId: osuUser.id, osuName: osuUser.name });
				}

				players[i] = discordUser.osuName;
			}

			await channel.send(`Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\nhttps://osu.ppy.sh/community/matches/${args[2]}`);

			processQueueEntry.destroy();
		} catch (err) {
			if (err.message === 'Missing Access') {
				let guildTracker = await DBOsuGuildTrackers.findAll({
					where: {
						id: args[4]
					}
				});
				await guildTracker.destroy();
			} else {
				console.log(err);
			}
		}
	},
};
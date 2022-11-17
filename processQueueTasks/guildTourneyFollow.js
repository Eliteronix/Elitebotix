const { DBDiscordUsers, DBOsuGuildTrackers } = require('../dbObjects');
const osu = require('node-osu');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('tourneyFollow');
		let args = processQueueEntry.additions.split(';');

		try {
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

					const osuUser = await osuApi.getUser({ u: players[i], m: 0 });

					discordUser = await DBDiscordUsers.create({ osuUserId: osuUser.id, osuName: osuUser.name });
				}

				players[i] = discordUser.osuName;
			}

			client.shard.broadcastEval(async (c, { channelId, message, autoTrack, matchId }) => {
				const channel = await c.channels.fetch(channelId);

				if (channel) {
					await channel.send(message);

					if (autoTrack === 'true') {
						let trackCommand = require('../commands/osu-matchtrack.js');
						trackCommand.execute({ id: 1, channel: channel, author: { id: 1 } }, [matchId, '--tracking']);
					}
				}
			}, {
				context: {
					channelId: args[1],
					message: `Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\nhttps://osu.ppy.sh/community/matches/${args[2]}`,
					autoTrack: args[4],
					matchId: args[2]
				}
			});
			processQueueEntry.destroy();
		} catch (err) {
			if (err.message === 'Missing Access') {
				let guildTrackers = await DBOsuGuildTrackers.findAll({
					where: {
						channelId: args[1]
					}
				});

				for (let i = 0; i < guildTrackers.length; i++) {
					guildTrackers[i].destroy();
				}
			} else {
				console.log(err);
			}
		}
	},
};
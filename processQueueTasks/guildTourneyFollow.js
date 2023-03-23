const { DBOsuGuildTrackers } = require('../dbObjects');
const { logDatabaseQueries, getOsuPlayerName } = require('../utils');
const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('guildTourneyFollow', client.shardId);
		let args = processQueueEntry.additions.split(';');

		try {
			let players = args[3].split(',');

			for (let i = 0; i < players.length; i++) {
				players[i] = await getOsuPlayerName(players[i]);
			}

			let message = `Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\nhttps://osu.ppy.sh/community/matches/${args[2]}`;

			if (args[5].toLowerCase().includes('qualifier')) {
				message = `Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\n${args[5]}\n(Qualifier MP Links are hidden)`;
			}

			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting processQueueTasks/guildTourneyFollow.js to shards...');
			}

			client.shard.broadcastEval(async (c, { guildId, channelId, message, autoTrack, matchId }) => {
				const guild = await c.guilds.cache.get(guildId);

				if (!guild || guild.shardId !== c.shardId) {
					return;
				}

				const channel = await guild.channels.cache.get(channelId);

				if (!channel) {
					return;
				}

				await channel.send(message);

				if (autoTrack === 'true') {
					// eslint-disable-next-line no-undef
					let trackCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-matchtrack.js`);

					// eslint-disable-next-line no-undef
					process.send(`command ${trackCommand.name}`);

					trackCommand.execute({ id: 1, channel: channel, author: { id: 1 }, client: c }, [matchId, '--tracking']);
				}
			}, {
				context: {
					guildId: args[0],
					channelId: args[1],
					message: message,
					autoTrack: args[4],
					matchId: args[2]
				}
			});
			processQueueEntry.destroy();
		} catch (err) {
			if (err.message === 'Missing Access') {
				logDatabaseQueries(2, 'processQueueTasks/guildTourneyFollow.js DBOsuGuildTrackers');
				await DBOsuGuildTrackers.destroy({
					where: {
						channelId: args[1]
					}
				});
			} else {
				console.error(err);
			}
		}
	},
};
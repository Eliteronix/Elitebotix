const { DBOsuGuildTrackers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('tourneyFollow', client.shardId);
		let args = processQueueEntry.additions.split(';');

		try {
			let message = `Follow Notification:\nA match under the \`${args[3].replace(/`/g, '')}\` acronym has been played.\nhttps://osu.ppy.sh/community/matches/${args[2]}`;

			if (args[5].toLowerCase().includes('qualifier')) {
				message = `Follow Notification:\nA match under the \`${args[3].replace(/`/g, '')}\` acronym has been played.\n${args[5]}\n(Qualifier MP Links are hidden)`;
			}

			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting processQueueTasks/guildTourneyAcronymFollow.js to shards...');
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
					let trackCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-matchtrack.js`);

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
				logDatabaseQueries(2, 'processQueueTasks/guildTourneyAcronymFollow.js DBOsuGuildTrackers');
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
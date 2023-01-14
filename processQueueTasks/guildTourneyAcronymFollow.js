const { DBOsuGuildTrackers } = require('../dbObjects');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('tourneyFollow', client.shardId);
		let args = processQueueEntry.additions.split(';');

		try {
			client.shard.broadcastEval(async (c, { guildId, channelId, message, autoTrack, matchId }) => {
				const guild = await c.guilds.cache.get(guildId);

				if (!guild) {
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
					trackCommand.execute({ id: 1, channel: channel, author: { id: 1 }, client: c }, [matchId, '--tracking']);
				}
			}, {
				context: {
					guildId: args[0],
					channelId: args[1],
					message: `Follow Notification:\nA match under the \`${args[3].replace(/`/g, '')}\` acronym has been played.\nhttps://osu.ppy.sh/community/matches/${args[2]}`,
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
				console.error(err);
			}
		}
	},
};
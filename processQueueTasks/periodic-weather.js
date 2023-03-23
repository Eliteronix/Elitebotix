const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('periodic-weather');
		let args = processQueueEntry.additions.split(';');

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting processQueueTasks/periodic-weather.js to shards...');
		}

		let channelFound = await client.shard.broadcastEval(async (c, { channelId, processQueueEntryId }) => {
			const channel = await c.channels.cache.get(channelId);

			if (channel) {
				// eslint-disable-next-line no-undef
				const { DBProcessQueue } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				// eslint-disable-next-line no-undef
				const { getGuildPrefix, pause, logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);
				// eslint-disable-next-line no-undef
				let command = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\weather.js`);

				logDatabaseQueries(2, 'processQueueTasks/periodic-weather.js DBProcessQueue');
				let processQueueEntry = await DBProcessQueue.findOne({
					attributes: ['id', 'additions', 'date', 'beingExecuted'],
					where: {
						id: processQueueEntryId
					}
				});
				let args = processQueueEntry.additions.split(';');

				await channel.messages.fetch({ limit: 100 }).then(async (messages) => {
					const messagesArray = [];
					messages.filter(m => m.content === `Weather for ${args[3]}`).each(message => messagesArray.push(message));

					if (messagesArray.length === 0) {
						const placeHolderMessage = await channel.send('Placeholder message for weather tracking.');
						messagesArray.push(placeHolderMessage);
					}

					const guildPrefix = getGuildPrefix(messagesArray[messagesArray.length - 1]);

					let degreeType = 'C';
					if (args[2] === 'F') {
						degreeType = 'F ';
					}

					messagesArray[messagesArray.length - 1].content = `${guildPrefix}weather ${degreeType}${args[3]}`;

					let locationArguments = args[3].split(' ');
					let newArgs = [degreeType];

					for (let i = 0; i < locationArguments.length; i++) {
						newArgs.push(locationArguments[i]);
					}

					// eslint-disable-next-line no-undef
					process.send(`command ${command.name}`);

					command.execute(messagesArray[messagesArray.length - 1], newArgs, null, [c, null]);

					await pause(60000);

					try {
						await messagesArray[messagesArray.length - 1].delete();
					} catch (err) {
						//Nothing
						//Probably no permissions
					}

					let date = new Date();

					date.setUTCMinutes(0);
					date.setUTCSeconds(0);
					date.setUTCMilliseconds(0);
					date.setUTCHours(date.getUTCHours() + 1);

					if (args[1] === 'daily') {
						date.setUTCHours(0);
						date.setUTCDate(date.getUTCDate() + 1);
					}

					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					await processQueueEntry.save();
				});
				return true;
			}
			return false;
		}, { context: { channelId: args[0], processQueueEntryId: processQueueEntry.id } });

		channelFound = channelFound.some(channel => channel);

		if (!channelFound) {
			processQueueEntry.destroy();
		}
	},
};
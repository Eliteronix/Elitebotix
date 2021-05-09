const { DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const channel = await client.channels.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (channel) {
			let command = require('../commands/weather.js');

			channel.messages.fetch({ limit: 100 }).then(async (messages) => {
				const messagesArray = messages.filter(m => m.content === `Weather for ${args[3]}`).array();

				if (messagesArray.length === 0) {
					const placeHolderMessage = await channel.send('Placeholder message for weather tracking.');
					messagesArray.push(placeHolderMessage);
				}

				const guildPrefix = getGuildPrefix(messagesArray[messagesArray.length - 1]);

				let degreeType = '';
				if (args[2] === 'F') {
					degreeType = 'F ';
				}

				messagesArray[messagesArray.length - 1].content = `${guildPrefix}weather ${degreeType}${args[3]}`;

				command.execute(messagesArray[messagesArray.length - 1], args, true);

				messagesArray[messagesArray.length - 1].delete();

				let date = new Date();

				date.setUTCMinutes(0);
				date.setUTCSeconds(0);
				date.setUTCMilliseconds(0);
				date.setUTCHours(date.getUTCHours() + 1);

				if (args[1] === 'daily') {
					date.setUTCHours(0);
					date.setUTCDate(date.getUTCDate() + 1);
				}

				DBProcessQueue.create({ guildId: 'None', task: 'periodic-weather', priority: 9, additions: processQueueEntry.additions, date: date });
			});
		}

	},
};
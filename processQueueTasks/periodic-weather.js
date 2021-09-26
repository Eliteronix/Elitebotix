const { DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const channel = await client.channels.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (channel) {
			let command = require('../commands/weather.js');

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

				command.execute(messagesArray[messagesArray.length - 1], newArgs, null, [client, null]);

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

				processQueueEntry.destroy();
				await DBProcessQueue.create({ guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${args[0]};${args[1]};${args[2]};${args[3]}`, date: date });
			});
		} else {
			processQueueEntry.destroy();
		}
	},
};
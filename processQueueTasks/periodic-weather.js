const { getGuildPrefix, pause } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('periodic-weather');
		let args = processQueueEntry.additions.split(';');

		// TODO: Change to broadcast
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
		} else {
			processQueueEntry.destroy();
		}
	},
};
const config = require('../../config.json');

module.exports = {
	name: 'config',
	usage: '<show|field <new value>>',
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused(true);

		const options = [{ name: 'show', value: 'show' }, { name: `traceOsuAPICalls ${!config.traceOsuAPICalls}`, value: `traceOsuAPICalls ${!config.traceOsuAPICalls}` }, { name: `logBroadcastEval ${!config.logBroadcastEval}`, value: `logBroadcastEval ${!config.logBroadcastEval}` }];



		let filtered = options.filter(choice => choice.name.toLowerCase().includes(focusedValue.value.toLowerCase()));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.value })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && config.showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	async execute(interaction) {
		let argument = interaction.options.getString('argument');

		if (argument === 'show') {
			const config = require('../../config.json');
			let configString = JSON.stringify(config, null, 4);

			// Split the string into 2000 character chunks
			let configStringChunks = configString.match(/[\s\S]{1,1988}/g);

			for (let i = 0; i < configStringChunks.length; i++) {
				await interaction.followUp('```json\n' + configStringChunks[i] + '```');
			}
		} else {
			if (argument.startsWith('traceOsuAPICalls ')) {
				let newValue = argument.split(' ')[1] === 'true' ? true : false;
				config.traceOsuAPICalls = newValue;

				// Save the new config to the config.json file
				const fs = require('fs');
				fs.writeFile('./config.json', JSON.stringify(config, null, 4), (err) => {
					if (err) {
						console.error(err);
						return;
					}
				});

				await interaction.followUp('Set `traceOsuAPICalls` to `' + newValue + '`');
			} else if (argument.startsWith('logBroadcastEval ')) {
				let newValue = argument.split(' ')[1] === 'true' ? true : false;
				config.logBroadcastEval = newValue;

				// Save the new config to the config.json file
				const fs = require('fs');
				fs.writeFile('./config.json', JSON.stringify(config, null, 4), (err) => {
					if (err) {
						console.error(err);
						return;
					}
				});

				await interaction.followUp('Set `logBroadcastEval` to `' + newValue + '`');
			}
		}
	},
};
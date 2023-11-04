module.exports = {
	name: 'config',
	usage: '<show>',
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
		}
	},
};
const { showUnknownInteractionError } = require('../../config.json');
const fs = require('node:fs');

module.exports = {
	name: 'wal',
	usage: '<table>',
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused(true);

		const tableNames = fs.readdirSync('./models').map(file => file.replace('.js', ''));

		let filtered = tableNames.filter(choice => choice.toLowerCase().includes(focusedValue.value.toLowerCase()));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	async execute(interaction) {
		let dbTableName = interaction.options.getString('argument').split(' ')[0];
		let wal = interaction.options.getString('argument').split(' ')[1];

		if (!dbTableName || !wal) {
			return await interaction.editReply('Please provide a valid table name and WAL option.');
		}

		if (!['enable', 'disable'].includes(wal)) {
			return await interaction.editReply('WAL option must be either "enable" or "disable".');
		}

		try {
			if (wal === 'enable') {
				eval(`const { ${dbTableName} } = require('../../dbObjects');  ${dbTableName}.sequelize.query('PRAGMA journal_mode = WAL;');`);
				return await interaction.editReply(`WAL mode enabled for table ${dbTableName}`);
			} else if (wal === 'disable') {
				eval(`const { ${dbTableName} } = require('../../dbObjects');  ${dbTableName}.sequelize.query('PRAGMA journal_mode = DELETE;');`);
				return await interaction.editReply(`WAL mode disabled for table ${dbTableName}`);
			}
		} catch (error) {
			console.error(error);
			return await interaction.editReply(`Failed to set WAL mode for table ${dbTableName}: ${error.message}`);
		}
	},
};
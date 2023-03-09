const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');
const { logDatabaseQueries } = require('../../utils');
const { showUnknownInteractionError } = require('../../config.json');
const fs = require('node:fs');

module.exports = {
	name: 'database',
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
		let data = [];

		let dbTableName = interaction.options.getString('argument');
		let dbList = null;

		try {
			logDatabaseQueries(4, `commands/db.js ${dbTableName}`);
			dbList = eval(`const { ${dbTableName} } = require('../../dbObjects'); ${dbTableName}.findAll()`);
		} catch (error) {
			return await interaction.editReply(`Table ${dbTableName} not found`);
		}

		if (dbList.length === 0) {
			return await interaction.editReply(`No entries found in ${dbTableName}`);
		}

		for (let i = 0; i < dbList.length; i++) {
			data.push(dbList[i].dataValues);

			if (i % 10000 === 0 && i > 0 || dbList.length - 1 === i) {
				const developerUser = await interaction.client.users.cache.find(user => user.id === interaction.user.id);
				let csv = new ObjectsToCsv(data);
				csv = await csv.toString();
				// eslint-disable-next-line no-undef
				const buffer = Buffer.from(csv);
				//Create as an attachment
				// eslint-disable-next-line no-undef
				const attachment = new Discord.AttachmentBuilder(buffer, { name: `${dbTableName}-${process.env.SERVER}-${process.env.PROVIDER}.csv` });
				// eslint-disable-next-line no-undef
				await developerUser.send({ content: `${dbTableName} - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, files: [attachment] });
				data = [];
			}
		}

		return await interaction.editReply(`Sent ${dbTableName} to your DMs`);
	},
};
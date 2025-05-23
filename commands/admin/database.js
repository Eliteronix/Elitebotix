const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');
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
		let dbTableName = interaction.options.getString('argument');
		let dbListPromise = null;

		let notDone = true;
		let noData = true;
		let newIdLimit = 0;
		while (notDone) {
			try {
				dbListPromise = eval(`const { ${dbTableName} } = require('../../dbObjects'); const { Op } = require('sequelize'); ${dbTableName}.findAll({ where: { id: {[Op.gt]: ${newIdLimit}} }, limit: 10000 })`);
			} catch (error) {
				console.error(error);
				return await interaction.editReply(`Table ${dbTableName} not found`);
			}

			let dbList = await dbListPromise;

			if (dbList.length === 0) {
				notDone = false;

				if (noData) {
					return await interaction.editReply(`No entries found in ${dbTableName}`);
				} else {
					break;
				}
			}

			noData = false;

			const developerUser = await interaction.client.users.cache.find(user => user.id === interaction.user.id);
			let csv = new ObjectsToCsv(dbList.map(entry => entry.dataValues));
			csv = await csv.toString();
			const buffer = Buffer.from(csv);
			//Create as an attachment
			const attachment = new Discord.AttachmentBuilder(buffer, { name: `${dbTableName}-${process.env.SERVER}-${process.env.PROVIDER}.csv` });
			await developerUser.send({ content: `${dbTableName} - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, files: [attachment] });

			newIdLimit = dbList[dbList.length - 1].id;
		}

		return await interaction.editReply(`Sent ${dbTableName} to your DMs`);
	},
};
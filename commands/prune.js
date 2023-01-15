const { Permissions } = require('discord.js');
const { populateMsgFromInteraction } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'prune',
	description: 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
	permissions: Permissions.FLAGS.MANAGE_MESSAGES,
	permissionsTranslated: 'Manage Messages',
	botPermissions: Permissions.FLAGS.MANAGE_MESSAGES,
	botPermissionsTranslated: 'Manage Messages',
	cooldown: 15,
	tags: 'server-admin',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._hoistedOptions[0].value];

			interaction.followUp({ content: 'Deleted messages', ephemeral: true });
		}
		//Set amount by argument + 1
		const amount = parseInt(args[0]) + 1;

		//Check if it is a number
		if (isNaN(amount)) {
			return msg.reply('that doesn\'t seem to be a valid number.');
			//Check if the number is between 1 and 100
		} else if (amount <= 1 || amount > 100) {
			return msg.reply('you need to input a number between 1 and 99.');
		}

		//Delete messages which are less than 2 weeks old
		msg.channel.bulkDelete(amount, true).catch(err => {
			console.error(err);
			if (msg.id) {
				return msg.reply('there was an error trying to prune messages in this channel!');
			}
			return interaction.followUp({ content: 'There was an error trying to prune messages in this channel', ephemeral: true });
		});
	},
};
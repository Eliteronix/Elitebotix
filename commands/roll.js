const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'roll',
	description: 'Rolls a number between 1 and 100 or 1 and the number specified',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('roll')
		.setNameLocalizations({
			'de': 'würfeln',
			'en-GB': 'roll',
			'en-US': 'roll',
		})
		.setDescription('Rolls a number between 1 and 100 or 1 and the number specified')
		.setDescriptionLocalizations({
			'de': 'Würfelt eine Zahl zwischen 1 und 100 oder 1 und der angegebenen Zahl',
			'en-GB': 'Rolls a number between 1 and 100 or 1 and the number specified',
			'en-US': 'Rolls a number between 1 and 100 or 1 and the number specified',
		})
		.setDMPermission(true)
		.addIntegerOption(option =>
			option.setName('maximum')
				.setNameLocalizations({
					'de': 'maximum',
					'en-GB': 'maximum',
					'en-US': 'maximum',
				})
				.setDescription('The maximum number you can roll')
				.setDescriptionLocalizations({
					'de': 'Die maximale Zahl, die du würfeln kannst',
					'en-GB': 'The maximum number you can roll',
					'en-US': 'The maximum number you can roll',
				})
				.setRequired(false)
				.setMinValue(2)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let max = 100;

		if (interaction.options.getInteger('maximum')) {
			max = interaction.options.getInteger('maximum');
		}

		const result = Math.floor(Math.random() * max) + 1;

		return await interaction.editReply(`<@${interaction.user.id}> rolled ${result}!`);
	},
};
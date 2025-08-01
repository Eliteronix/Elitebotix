const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'avatar',
	description: 'Sends the avatar of the selected user',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setNameLocalizations({
			'de': 'avatar',
			'en-GB': 'avatar',
			'en-US': 'avatar',
		})
		.setDescription('Sends the avatar of the selected user')
		.setDescriptionLocalizations({
			'de': 'Sendet den Avatar des ausgewählten Benutzers',
			'en-GB': 'Sends the avatar of the selected user',
			'en-US': 'Sends the avatar of the selected user',
		})
		.setDMPermission(true)
		.addUserOption(option =>
			option.setName('user')
				.setNameLocalizations({
					'de': 'benutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user you want to get the avatar of')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, dessen Avatar du haben möchtest',
					'en-GB': 'The user you want to get the avatar of',
					'en-US': 'The user you want to get the avatar of',
				})
				.setRequired(false)
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let user = interaction.options.getUser('user');

		if (!user) {
			user = interaction.user;
		}

		const avatar = user.displayAvatarURL({ dynamic: true, size: 4096 });

		const embed = {
			color: 0x0099ff,
			title: `${user.username}'s avatar`,
			image: {
				url: avatar,
			},
		};

		return await interaction.editReply({ embeds: [embed] });
	},
};
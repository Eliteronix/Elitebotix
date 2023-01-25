const { Permissions } = require('discord.js');
const { DBGuilds } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'birthday-admin',
	description: 'Manage birthday logging on your server',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'server-admin',
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

		let guild = await DBGuilds.findOne({
			where: {
				guildId: interaction.guild.id,
			},
		});

		if (interaction.options._subcommand === 'enable') {
			if (!guild) {
				guild = await DBGuilds.create({
					guildId: interaction.guild.id,
					guildName: interaction.guild.name,
				});
			}

			if (guild.birthdayEnabled) {
				return interaction.editReply({ content: 'Birthday announcements are already enabled.', ephemeral: true });
			}

			guild.birthdayEnabled = true;
			guild.save();
			return interaction.editReply({ content: 'Birthday announcements have been enabled.', ephemeral: true });
		} else if (interaction.options._subcommand === 'disable') {
			if (!guild) {
				guild = await DBGuilds.create({
					guildId: interaction.guild.id,
					guildName: interaction.guild.name,
				});
			}

			if (!guild.birthdayEnabled) {
				return interaction.editReply({ content: 'Birthday announcements are already disabled.', ephemeral: true });
			}

			guild.birthdayEnabled = false;
			guild.save();
			return interaction.editReply({ content: 'Birthday announcements have been disabled.', ephemeral: true });
		} else if (interaction.options._subcommand === 'channel') {
			//There is only one argument so we can set the channelId to the first argument
			let channel = interaction.options._hoistedOptions[0].value;

			if (!guild) {
				guild = await DBGuilds.create({
					guildId: interaction.guild.id,
					guildName: interaction.guild.name,
				});
			}

			guild.birthdayMessageChannel = channel;
			guild.save();
			return interaction.editReply({ content: `Birthday announcements channel has been set to <#${channel}>`, ephemeral: true });
		}
	}
};
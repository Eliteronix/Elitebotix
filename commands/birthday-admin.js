const { Permissions } = require('discord.js');
const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'birthday-admin',
	// aliases: ['dice', 'ouo'],
	description: 'Manage birthday logging on your server',
	usage: '<set>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	// args: true,
	cooldown: 10,
	// noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: deferReply
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
				return interaction.reply({ content: 'Birthday announcements are already enabled.', ephemeral: true });
			}

			guild.birthdayEnabled = true;
			guild.save();
			return interaction.reply({ content: 'Birthday announcements have been enabled.', ephemeral: true });
		} else if (interaction.options._subcommand === 'disable') {
			if (!guild) {
				guild = await DBGuilds.create({
					guildId: interaction.guild.id,
					guildName: interaction.guild.name,
				});
			}

			if (!guild.birthdayEnabled) {
				return interaction.reply({ content: 'Birthday announcements are already disabled.', ephemeral: true });
			}

			guild.birthdayEnabled = false;
			guild.save();
			return interaction.reply({ content: 'Birthday announcements have been disabled.', ephemeral: true });
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
			return interaction.reply({ content: `Birthday announcements channel has been set to <#${channel}>`, ephemeral: true });
		}
	}
};
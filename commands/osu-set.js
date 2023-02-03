const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-set',
	description: 'Allows you to set your main mode and server',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'osu',
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.user.id
			},
		});

		if (interaction.options.getSubcommand() === 'mode') {
			let mode = interaction.options.getString('mode');

			if (mode === 'standard') {
				if (discordUser) {
					discordUser.osuMainMode = 0;
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 0
					});
				}

				return interaction.editReply('Standard has been set as your main mode.');
			} else if (mode === 'taiko') {
				if (discordUser) {
					discordUser.osuMainMode = 1;
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 1
					});
				}

				return interaction.editReply('Taiko has been set as your main mode.');
			} else if (mode === 'catch') {
				if (discordUser) {
					discordUser.osuMainMode = 2;
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 2
					});
				}

				return interaction.editReply('Catch has been set as your main mode.');
			} else if (mode === 'mania') {
				if (discordUser) {
					discordUser.osuMainMode = 3;
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 3
					});
				}

				return interaction.editReply('Mania has been set as your main mode.');
			}
		} else if (interaction.options.getSubcommand() === 'server') {
			let server = interaction.options.getString('server');

			if (server === 'bancho') {
				if (discordUser) {
					discordUser.osuMainServer = 'bancho';
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainServer: 'bancho'
					});
				}

				return interaction.editReply('Bancho has been set as your main server.');
			} else if (server === 'ripple') {
				if (discordUser) {
					discordUser.osuMainServer = 'ripple';
					await discordUser.save();
				} else {
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainServer: 'ripple'
					});
				}

				return interaction.editReply('Ripple has been set as your main server.');
			}
		}
	},
};
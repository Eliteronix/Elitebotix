const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-set',
	description: 'Allows you to set your main mode and server',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-set')
		.setNameLocalizations({
			'de': 'osu-setzen',
			'en-GB': 'osu-set',
			'en-US': 'osu-set',
		})
		.setDescription('Allows you to set your main mode and server')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, deinen Hauptmodus und Server festzulegen',
			'en-GB': 'Allows you to set your main mode and server',
			'en-US': 'Allows you to set your main mode and server',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('mode')
				.setNameLocalizations({
					'de': 'modus',
					'en-GB': 'mode',
					'en-US': 'mode',
				})
				.setDescription('Change the main mode when handling the bot')
				.setDescriptionLocalizations({
					'de': 'Ändert den Hauptmodus, mit dem der Bot umgeht',
					'en-GB': 'Change the main mode when handling the bot',
					'en-US': 'Change the main mode when handling the bot',
				})
				.addStringOption(option =>
					option
						.setName('mode')
						.setNameLocalizations({
							'de': 'modus',
							'en-GB': 'mode',
							'en-US': 'mode',
						})
						.setDescription('The main mode when handling the bot')
						.setDescriptionLocalizations({
							'de': 'Der Hauptmodus, mit dem der Bot umgeht',
							'en-GB': 'The main mode when handling the bot',
							'en-US': 'The main mode when handling the bot',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Standard', value: 'standard' },
							{ name: 'Taiko', value: 'taiko' },
							{ name: 'Catch the Beat', value: 'catch' },
							{ name: 'Mania', value: 'mania' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('server')
				.setNameLocalizations({
					'de': 'server',
					'en-GB': 'server',
					'en-US': 'server',
				})
				.setDescription('Change the main server when handling the bot')
				.setDescriptionLocalizations({
					'de': 'Ändert den Hauptserver, mit dem der Bot umgeht',
					'en-GB': 'Change the main server when handling the bot',
					'en-US': 'Change the main server when handling the bot',
				})
				.addStringOption(option =>
					option
						.setName('server')
						.setNameLocalizations({
							'de': 'server',
							'en-GB': 'server',
							'en-US': 'server',
						})
						.setDescription('The main server when handling the bot')
						.setDescriptionLocalizations({
							'de': 'Der Hauptserver, mit dem der Bot umgeht',
							'en-GB': 'The main server when handling the bot',
							'en-US': 'The main server when handling the bot',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Bancho', value: 'bancho' },
							{ name: 'Ripple', value: 'ripple' },
						)
				)
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'osuMainMode', 'osuMainServer'],
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
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 1');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 0
					});
				}

				return await interaction.editReply('Standard has been set as your main mode.');
			} else if (mode === 'taiko') {
				if (discordUser) {
					discordUser.osuMainMode = 1;
					await discordUser.save();
				} else {
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 2');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 1
					});
				}

				return await interaction.editReply('Taiko has been set as your main mode.');
			} else if (mode === 'catch') {
				if (discordUser) {
					discordUser.osuMainMode = 2;
					await discordUser.save();
				} else {
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 3');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 2
					});
				}

				return await interaction.editReply('Catch has been set as your main mode.');
			} else if (mode === 'mania') {
				if (discordUser) {
					discordUser.osuMainMode = 3;
					await discordUser.save();
				} else {
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 4');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainMode: 3
					});
				}

				return await interaction.editReply('Mania has been set as your main mode.');
			}
		} else if (interaction.options.getSubcommand() === 'server') {
			let server = interaction.options.getString('server');

			if (server === 'bancho') {
				if (discordUser) {
					discordUser.osuMainServer = 'bancho';
					await discordUser.save();
				} else {
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 5');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainServer: 'bancho'
					});
				}

				return await interaction.editReply('Bancho has been set as your main server.');
			} else if (server === 'ripple') {
				if (discordUser) {
					discordUser.osuMainServer = 'ripple';
					await discordUser.save();
				} else {
					logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers create 6');
					await DBDiscordUsers.create({
						userId: interaction.user.id,
						osuMainServer: 'ripple'
					});
				}

				return await interaction.editReply('Ripple has been set as your main server.');
			}
		}
	},
};
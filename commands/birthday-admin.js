const { PermissionsBitField } = require('discord.js');
const { DBGuilds, DBBirthdayGuilds } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const { logDatabaseQueries } = require('../utils');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'birthday-admin',
	description: 'Manage birthday logging on your server',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('birthday-admin')
		.setNameLocalizations({
			'de': 'geburtstag-admin',
			'en-GB': 'birthday-admin',
			'en-US': 'birthday-admin',
		})
		.setDescription('Manage birthday announcements on your server')
		.setDescriptionLocalizations({
			'de': 'Verwalte Geburtstagsankündigungen auf deinem Server',
			'en-GB': 'Manage birthday announcements on your server',
			'en-US': 'Manage birthday announcements on your server',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand.setName('enable')
				.setNameLocalizations({
					'de': 'aktivieren',
					'en-GB': 'enable',
					'en-US': 'enable',
				})
				.setDescription('Enables birthday announcements on the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert Geburtstagsankündigungen auf dem Server',
					'en-GB': 'Enables birthday announcements on the server',
					'en-US': 'Enables birthday announcements on the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('disable')
				.setNameLocalizations({
					'de': 'deaktivieren',
					'en-GB': 'disable',
					'en-US': 'disable',
				})
				.setDescription('Disables birthday announcements on the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert Geburtstagsankündigungen auf dem Server',
					'en-GB': 'Disables birthday announcements on the server',
					'en-US': 'Disables birthday announcements on the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Returns a list of all birthdays shared with the server')
				.setDescriptionLocalizations({
					'de': 'Gibt eine Liste aller Geburtstage zurück, die mit dem Server geteilt werden',
					'en-GB': 'Returns a list of all birthdays shared with the server',
					'en-US': 'Returns a list of all birthdays shared with the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('channel')
				.setNameLocalizations({
					'de': 'kanal',
					'en-GB': 'channel',
					'en-US': 'channel',
				})
				.setDescription('Sets the channel for birthday announcements')
				.setDescriptionLocalizations({
					'de': 'Setzt den Kanal für Geburtstagsankündigungen',
					'en-GB': 'Sets the channel for birthday announcements',
					'en-US': 'Sets the channel for birthday announcements',
				})
				.addChannelOption(option =>
					option.setName('set')
						.setNameLocalizations({
							'de': 'setzen',
							'en-GB': 'set',
							'en-US': 'set',
						})
						.setDescription('Sets the channel for birthday announcements')
						.setDescriptionLocalizations({
							'de': 'Setzt den Kanal für Geburtstagsankündigungen',
							'en-GB': 'Sets the channel for birthday announcements',
							'en-US': 'Sets the channel for birthday announcements',
						})
						.setRequired(true)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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

		logDatabaseQueries(4, 'commands/birthday-admin.js DBGuilds');
		let guild = await DBGuilds.findOne({
			attributes: ['id', 'birthdayEnabled', 'birthdayMessageChannel'],
			where: {
				guildId: interaction.guild.id,
			},
		});

		if (interaction.options.getSubcommand() === 'enable') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/birthday-admin.js DBGuilds enable create');
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
		} else if (interaction.options.getSubcommand() === 'disable') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/birthday-admin.js DBGuilds disable create');
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
		} else if (interaction.options.getSubcommand() === 'list') {
			logDatabaseQueries(2, 'birthday-admin.js DBBirthdayGuilds list');
			let birthdayAnnouncements = await DBBirthdayGuilds.findAll({
				attributes: ['userId', 'birthdayTime'],
				where: {
					guildId: interaction.guild.id,
				},
				order: [['birthdayTime', 'ASC']],
			});

			if (birthdayAnnouncements.length === 0) {
				return interaction.editReply({ content: 'There are no birthdays shared for this server.', ephemeral: true });
			}

			let birthdays = birthdayAnnouncements.map(birthday => {
				return `<@${birthday.userId}>: <t:${Math.round(birthday.birthdayTime.getTime() / 1000)}:f>`;
			});

			return interaction.editReply({ content: `Shared birthdays for this server:\n${birthdays.join('\n')}`, ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'channel') {
			//There is only one argument so we can set the channelId to the first argument
			let channel = interaction.options.getChannel('set', true);

			if (channel.type !== 0) {
				return interaction.editReply({ content: 'The channel has to be a text channel.', ephemeral: true });
			}

			if (!guild) {
				logDatabaseQueries(4, 'commands/birthday-admin.js DBGuilds channel create');
				guild = await DBGuilds.create({
					guildId: interaction.guild.id,
					guildName: interaction.guild.name,
				});
			}

			guild.birthdayMessageChannel = channel.id;
			guild.save();
			return interaction.editReply({ content: `Birthday announcements channel has been set to ${channel}`, ephemeral: true });
		}
	}
};
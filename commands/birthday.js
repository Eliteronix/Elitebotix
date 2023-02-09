const { PermissionsBitField } = require('discord.js');
const { DBDiscordUsers, DBBirthdayGuilds } = require('../dbObjects');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'birthday',
	description: 'Set your birthday',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('birthday')
		.setNameLocalizations({
			'de': 'geburtstag',
			'en-GB': 'birthday',
			'en-US': 'birthday',
		})
		.setDescription('Lets you set your birthday')
		.setDescriptionLocalizations({
			'de': 'Lässt dich deinen Geburtstag festlegen',
			'en-GB': 'Lets you set your birthday',
			'en-US': 'Lets you set your birthday',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('set')
				.setNameLocalizations({
					'de': 'festlegen',
					'en-GB': 'set',
					'en-US': 'set',
				})
				.setDescription('Sets your birthday')
				.setDescriptionLocalizations({
					'de': 'Lässt dich deinen Geburtstag festlegen',
					'en-GB': 'Lets you set your birthday',
					'en-US': 'Lets you set your birthday',
				})
				.addIntegerOption(option =>
					option
						.setName('date')
						.setNameLocalizations({
							'de': 'datum',
							'en-GB': 'date',
							'en-US': 'date',
						})
						.setDescription('The date of the month in UTC (i.e. 29)')
						.setDescriptionLocalizations({
							'de': 'Das Datum des Monats in UTC (z.B. 29)',
							'en-GB': 'The date of the month in UTC (i.e. 29)',
							'en-US': 'The date of the month in UTC (i.e. 29)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(31)
				)
				.addIntegerOption(option =>
					option
						.setName('month')
						.setNameLocalizations({
							'de': 'monat',
							'en-GB': 'month',
							'en-US': 'month',
						})
						.setDescription('The month in UTC (i.e. 11)')
						.setDescriptionLocalizations({
							'de': 'Der Monat in UTC (z.B. 11)',
							'en-GB': 'The month in UTC (i.e. 11)',
							'en-US': 'The month in UTC (i.e. 11)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(12)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enable')
				.setNameLocalizations({
					'de': 'aktivieren',
					'en-GB': 'enable',
					'en-US': 'enable',
				})
				.setDescription('Enables your birthday announcement on this server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert deine Geburtstagsankündigung auf diesem Server',
					'en-GB': 'Enables your birthday announcement on this server',
					'en-US': 'Enables your birthday announcement on this server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disable')
				.setNameLocalizations({
					'de': 'deaktivieren',
					'en-GB': 'disable',
					'en-US': 'disable',
				})
				.setDescription('Disables your birthday announcement on this server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert deine Geburtstagsankündigung auf diesem Server',
					'en-GB': 'Disables your birthday announcement on this server',
					'en-US': 'Disables your birthday announcement on this server',
				})
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

		if (interaction.options.getSubcommand() === 'set') {
			let date = new Date();
			date.setUTCSeconds(0);
			date.setUTCHours(0);
			date.setUTCMinutes(0);
			date.setUTCMilliseconds(0);
			date.setUTCFullYear(0);

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'date') {
					date.setUTCDate(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'month') {
					date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
				}
			}

			logDatabaseQueries(4, 'commands/birthday.js DBDiscordUsers set');
			let user = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
				},
			});

			if (!user) {
				logDatabaseQueries(4, 'commands/birthday.js DBDiscordUsers set create');
				user = await DBDiscordUsers.create({
					userId: interaction.member.user.id,
				});
			}

			user.birthday = date;
			user.save();

			logDatabaseQueries(4, 'commands/birthday.js DBBirthdayGuilds set');
			let guilds = await DBBirthdayGuilds.findAll({
				where: {
					userId: interaction.member.user.id,
				}
			});

			let now = new Date();

			while (date < now) {
				date.setUTCFullYear(date.getUTCFullYear() + 1);
			}

			for (let i = 0; i < guilds.length; i++) {
				guilds[i].birthdayTime = date;
				await guilds[i].save();
			}

			// date string in the following format "Full Month Name, Day"
			let dateString = date.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
			});
			return await interaction.editReply({ content: `Your birthday has been set for \`${dateString}\``, ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'enable') {
			logDatabaseQueries(4, 'commands/birthday.js DBBirthdayGuilds enable');
			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			if (currentGuild) {
				return await interaction.editReply({ content: `You are already sharing your birthday on ${interaction.guild.name}`, ephemeral: true });
			}

			logDatabaseQueries(4, 'commands/birthday.js DBDiscordUsers enable');
			let dbDiscordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
					birthday: {
						[Op.ne]: null,
					}
				},
			});

			if (!dbDiscordUser || dbDiscordUser && !dbDiscordUser.birthday) {
				return await interaction.editReply({ content: 'You currently don\'t have your birthday set. Please set your birthday first by using </birthday set:1064501937875202091>', ephemeral: true });
			}

			let now = new Date();
			let nextBirthday = dbDiscordUser.birthday;

			while (nextBirthday < now) {
				nextBirthday.setUTCFullYear(nextBirthday.getUTCFullYear() + 1);
			}

			logDatabaseQueries(4, 'commands/birthday.js DBBirthdayGuilds enable create');
			await DBBirthdayGuilds.create({
				guildId: interaction.guild.id,
				userId: interaction.member.user.id,
				birthdayTime: nextBirthday,
			});

			return await interaction.editReply({ content: `Your birthday will now be shared on ${interaction.guild.name}`, ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'disable') {
			logDatabaseQueries(4, 'commands/birthday.js DBBirthdayGuilds disable');
			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			//No guild found
			if (!currentGuild) {
				return await interaction.editReply({ content: 'You were not sharing your birthday on this server.', ephemeral: true });
			}

			//Delete guild
			await currentGuild.destroy();
			return await interaction.editReply({ content: `Your birthday will no longer be shared on ${interaction.guild.name}`, ephemeral: true });
		}
	}
};
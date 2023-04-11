const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries, getIDFromPotentialOsuLink } = require('../utils');
const { DBDiscordUsers, DBOsuPoolAccess } = require('../dbObjects');
const { Op } = require('sequelize');
const osu = require('node-osu');

module.exports = {
	name: 'osu-scoreaccess',
	description: 'Grants access to the local scores for pools (of a spreadsheet)',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-scoreaccess')
		.setNameLocalizations({
			'de': 'osu-scorezugriff',
			'en-GB': 'osu-scoreaccess',
			'en-US': 'osu-scoreaccess',
		})
		.setDescription('Grant access to the local scores for pools of a spreadsheet')
		.setDescriptionLocalizations({
			'de': 'Gibt Zugriff auf die lokalen Scores für Pools eines Spreadsheets',
			'en-GB': 'Grant access to the local scores for pools of a spreadsheet',
			'en-US': 'Grant access to the local scores for pools of a spreadsheet',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('grantspreadsheetaccess')
				.setNameLocalizations({
					'de': 'spreadsheetzugrifferteilen',
					'en-GB': 'grantspreadsheetaccess',
					'en-US': 'grantspreadsheetaccess',
				})
				.setDescription('Grant access to the local scores for pools of a spreadsheet')
				.setDescriptionLocalizations({
					'de': 'Gibt Zugriff auf die lokalen Scores für Pools eines Spreadsheets',
					'en-GB': 'Grant access to the local scores for pools of a spreadsheet',
					'en-US': 'Grant access to the local scores for pools of a spreadsheet',
				})
				.addStringOption(option =>
					option
						.setName('captain')
						.setNameLocalizations({
							'de': 'captain',
							'en-GB': 'captain',
							'en-US': 'captain',
						})
						.setDescription('The username, id or link of the player to grant access to')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers, dem du Zugriff erteilen willst',
							'en-GB': 'The username, id or link of the player to grant access to',
							'en-US': 'The username, id or link of the player to grant access to',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('spreadsheet')
						.setNameLocalizations({
							'de': 'spreadsheet',
							'en-GB': 'spreadsheet',
							'en-US': 'spreadsheet',
						})
						.setDescription('The link to the spreadsheet')
						.setDescriptionLocalizations({
							'de': 'Der Link zum Spreadsheet',
							'en-GB': 'The link to the spreadsheet',
							'en-US': 'The link to the spreadsheet',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('revokespreadsheetaccess')
				.setNameLocalizations({
					'de': 'spreadsheetzugriffentziehen',
					'en-GB': 'revokespreadsheetaccess',
					'en-US': 'revokespreadsheetaccess',
				})
				.setDescription('Revoke access to the local scores for pools of a spreadsheet')
				.setDescriptionLocalizations({
					'de': 'Entzieht Zugriff auf die lokalen Scores für Pools eines Spreadsheets',
					'en-GB': 'Revoke access to the local scores for pools of a spreadsheet',
					'en-US': 'Revoke access to the local scores for pools of a spreadsheet',
				})
				.addStringOption(option =>
					option
						.setName('captain')
						.setNameLocalizations({
							'de': 'captain',
							'en-GB': 'captain',
							'en-US': 'captain',
						})
						.setDescription('The username, id or link of the player to revoke access from')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers, dem du Zugriff entziehen willst',
							'en-GB': 'The username, id or link of the player to revoke access from',
							'en-US': 'The username, id or link of the player to revoke access from',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('spreadsheet')
						.setNameLocalizations({
							'de': 'spreadsheet',
							'en-GB': 'spreadsheet',
							'en-US': 'spreadsheet',
						})
						.setDescription('The link to the spreadsheet')
						.setDescriptionLocalizations({
							'de': 'Der Link zum Spreadsheet',
							'en-GB': 'The link to the spreadsheet',
							'en-US': 'The link to the spreadsheet',
						})
						.setRequired(true)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
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

		if (interaction.options.getSubcommand() === 'grantspreadsheetaccess') {
			logDatabaseQueries(4, 'commands/osu-mappool.js DBDiscordUsers 1');
			let commandUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				}
			});

			if (!commandUser) {
				return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
			}

			const captain = interaction.options.getString('captain');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBDiscordUsers 2');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
				where: {
					[Op.or]: {
						osuUserId: getIDFromPotentialOsuLink(captain),
						osuName: captain,
						userId: captain.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});

			if (!discordUser) {
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const osuUser = await osuApi.getUser({ u: captain, m: 0 })
					.then(osuUser => {
						return osuUser;
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${captain.replace(/`/g, '')}\`.`);
						} else {
							await interaction.followUp('The API ran into an error. Please try again later.');
							console.error(err);
						}
						return null;
					});

				if (!osuUser) {
					return;
				}

				discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId', 'osuName'],
					where: {
						osuUserId: osuUser.id,
					}
				});

				if (!discordUser) {
					discordUser = await DBDiscordUsers.create({
						osuUserId: osuUser.id,
						osuName: osuUser.name,
					});
				}
			}

			let sheetId = interaction.options.getString('spreadsheet').replace('https://docs.google.com/spreadsheets/d/', '').replace(/\/.*/g, '');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 1');
			let existingPoolAccess = await DBOsuPoolAccess.count({
				where: {
					accessGiverId: commandUser.osuUserId,
					spreadsheetId: sheetId,
					accessTakerId: discordUser.osuUserId,
				}
			});

			if (existingPoolAccess) {
				return await interaction.editReply('You already granted access to this spreadsheet to this user.');
			}

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 2');
			await DBOsuPoolAccess.create({
				accessGiverId: commandUser.osuUserId,
				spreadsheetId: sheetId,
				accessTakerId: discordUser.osuUserId,
			});

			return await interaction.editReply(`Successfully granted access for the spreadsheet's scores to ${discordUser.osuName}.`);
		} else if (interaction.options.getSubcommand() === 'revokespreadsheetaccess') {
			logDatabaseQueries(4, 'commands/osu-mappool.js DBDiscordUsers 3');
			let commandUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				}
			});

			if (!commandUser) {
				return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
			}

			const captain = interaction.options.getString('captain');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBDiscordUsers 4');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
				where: {
					[Op.or]: {
						osuUserId: getIDFromPotentialOsuLink(captain),
						osuName: captain,
						userId: captain.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});

			if (!discordUser) {
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const osuUser = await osuApi.getUser({ u: captain, m: 0 })
					.then(osuUser => {
						return osuUser;
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${captain.replace(/`/g, '')}\`.`);
						} else {
							await interaction.followUp('The API ran into an error. Please try again later.');
							console.error(err);
						}
						return null;
					});

				if (!osuUser) {
					return;
				}

				discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId', 'osuName'],
					where: {
						osuUserId: osuUser.id,
					}
				});

				if (!discordUser) {
					discordUser = await DBDiscordUsers.create({
						osuUserId: osuUser.id,
						osuName: osuUser.name,
					});
				}
			}

			let sheetId = interaction.options.getString('spreadsheet').replace('https://docs.google.com/spreadsheets/d/', '').replace(/\/.*/g, '');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 2');
			let existingPoolAccess = await DBOsuPoolAccess.findOne({
				attributes: ['id'],
				where: {
					accessGiverId: commandUser.osuUserId,
					spreadsheetId: sheetId,
					accessTakerId: discordUser.osuUserId,
				}
			});

			if (existingPoolAccess) {
				await existingPoolAccess.destroy();
				return await interaction.editReply(`Successfully revoked access for the spreadsheet's scores from ${discordUser.osuName}.`);
			}

			return await interaction.editReply('You didn\'t grant access to this spreadsheet to this user.');
		}
	},
};
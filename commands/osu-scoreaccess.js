const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries, getIDFromPotentialOsuLink, getOsuPlayerName, logOsuAPICalls } = require('../utils');
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
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('grantpoolaccess')
				.setNameLocalizations({
					'de': 'poolzugrifferteilen',
					'en-GB': 'grantpoolaccess',
					'en-US': 'grantpoolaccess',
				})
				.setDescription('Grant access to the local scores for a pool')
				.setDescriptionLocalizations({
					'de': 'Gibt Zugriff auf die lokalen Scores für einen Pool',
					'en-GB': 'Grant access to the local scores for a pool',
					'en-US': 'Grant access to the local scores for a pool',
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
						.setName('poolname')
						.setNameLocalizations({
							'de': 'poolname',
							'en-GB': 'poolname',
							'en-US': 'poolname',
						})
						.setDescription('The name of the pool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Pools',
							'en-GB': 'The name of the pool',
							'en-US': 'The name of the pool',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('revokepoolaccess')
				.setNameLocalizations({
					'de': 'poolzugriffentziehen',
					'en-GB': 'revokepoolaccess',
					'en-US': 'revokepoolaccess',
				})
				.setDescription('Revoke access to the local scores for a pool')
				.setDescriptionLocalizations({
					'de': 'Entzieht Zugriff auf die lokalen Scores für einen Pool',
					'en-GB': 'Revoke access to the local scores for a pool',
					'en-US': 'Revoke access to the local scores for a pool',
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
						.setName('poolname')
						.setNameLocalizations({
							'de': 'poolname',
							'en-GB': 'poolname',
							'en-US': 'poolname',
						})
						.setDescription('The name of the pool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Pools',
							'en-GB': 'The name of the pool',
							'en-US': 'The name of the pool',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('listaccess')
				.setNameLocalizations({
					'de': 'zugriffsliste',
					'en-GB': 'listaccess',
					'en-US': 'listaccess',
				})
				.setDescription('List all players with access to the local scores for a pool')
				.setDescriptionLocalizations({
					'de': 'Listet alle Spieler auf, die Zugriff auf die lokalen Scores für einen Pool haben',
					'en-GB': 'List all players with access to the local scores for a pool',
					'en-US': 'List all players with access to the local scores for a pool',
				})
		),
	// eslint-disable-next-line no-unused-vars
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
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
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
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('commands/osu-scoreaccess.js grantspreadsheetaccess getUser');
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
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
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
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('commands/osu-scoreaccess.js revokespreadsheetaccess getUser');
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
		} else if (interaction.options.getSubcommand() === 'grantpoolaccess') {
			logDatabaseQueries(4, 'commands/osu-mappool.js DBDiscordUsers 5');
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
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			const captain = interaction.options.getString('captain');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBDiscordUsers 6');
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
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('commands/osu-scoreaccess.js grantpoolaccess getUser');
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

			let poolname = interaction.options.getString('poolname');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 3');
			let existingPoolAccess = await DBOsuPoolAccess.count({
				where: {
					accessGiverId: commandUser.osuUserId,
					spreadsheetId: null,
					mappoolName: poolname.toLowerCase(),
					accessTakerId: discordUser.osuUserId,
				}
			});

			if (existingPoolAccess) {
				return await interaction.editReply('You already granted access to this pool to this user.');
			}

			await DBOsuPoolAccess.create({
				accessGiverId: commandUser.osuUserId,
				spreadsheetId: null,
				mappoolName: poolname.toLowerCase(),
				accessTakerId: discordUser.osuUserId,
			});

			return await interaction.editReply(`Successfully granted access to the pool \`${poolname.replace(/`/g, '')}\` to ${discordUser.osuName}.`);
		} else if (interaction.options.getSubcommand() === 'revokepoolaccess') {
			logDatabaseQueries(4, 'commands/osu-mappool.js DBDiscordUsers 7');
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
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			const captain = interaction.options.getString('captain');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBDiscordUsers 8');
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
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('commands/osu-scoreaccess.js revokepoolaccess getUser');
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

			let poolname = interaction.options.getString('poolname');

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 4');
			let existingPoolAccess = await DBOsuPoolAccess.findOne({
				attributes: ['id'],
				where: {
					accessGiverId: commandUser.osuUserId,
					spreadsheetId: null,
					mappoolName: poolname.toLowerCase(),
					accessTakerId: discordUser.osuUserId,
				}
			});

			if (existingPoolAccess) {
				await existingPoolAccess.destroy();
				return await interaction.editReply(`Successfully revoked access to the pool \`${poolname.replace(/`/g, '')}\` from ${discordUser.osuName}.`);
			}

			return await interaction.editReply('You did not grant access to this pool to this user.');
		} else if (interaction.options.getSubcommand() === 'listaccess') {
			logDatabaseQueries(4, 'commands/osu-mappool.js DBDiscordUsers 9');
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
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			logDatabaseQueries(4, 'commands/osu-scoreaccess.js DBOsuPoolAccess 5');
			let poolAccess = await DBOsuPoolAccess.findAll({
				attributes: ['accessTakerId', 'spreadsheetId', 'mappoolName'],
				where: {
					accessGiverId: commandUser.osuUserId,
				}
			});

			if (poolAccess.length === 0) {
				return await interaction.editReply('You did not grant access to any pools.');
			}

			for (let i = 0; i < poolAccess.length; i++) {
				if (poolAccess[i].spreadsheetId) {
					await interaction.followUp({ content: `You granted access to the spreadsheet <https://docs.google.com/spreadsheets/d/${poolAccess[i].spreadsheetId}> to ${await getOsuPlayerName(poolAccess[i].accessTakerId)}.`, ephemeral: true });
				} else {
					await interaction.followUp({ content: `You granted access to the pool \`${poolAccess[i].mappoolName.replace(/`/g, '')}\` to ${await getOsuPlayerName(poolAccess[i].accessTakerId)}.`, ephemeral: true });
				}
			}
		}
	},
};
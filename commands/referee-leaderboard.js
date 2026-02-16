const { DBOsuMultiMatches, DBDiscordUsers } = require('../dbObjects');
const { humanReadable, createLeaderboard, getOsuPlayerName } = require('../utils');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const { PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { leaderboardEntriesPerPage, showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'referee-leaderboard',
	description: 'Sends a leaderboard of all the referees',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('referee-leaderboard')
		.setNameLocalizations({
			'de': 'referee-rangliste',
			'en-GB': 'referee-leaderboard',
			'en-US': 'referee-leaderboard',
		})
		.setDescription('Sends a leaderboard of all the players in the guild that have their account connected')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Rangliste aller Spieler in dem Server, die ihr Konto verbunden haben',
			'en-GB': 'Sends a leaderboard of all the players in the guild that have their account connected',
			'en-US': 'Sends a leaderboard of all the players in the guild that have their account connected',
		})
		.setDMPermission(true)
		.addIntegerOption(option =>
			option.setName('page')
				.setNameLocalizations({
					'de': 'seite',
					'en-GB': 'page',
					'en-US': 'page',
				})
				.setDescription('The page of the leaderboard to display')
				.setDescriptionLocalizations({
					'de': 'Die Seite der Rangliste, die angezeigt werden soll',
					'en-GB': 'The page of the leaderboard to display',
					'en-US': 'The page of the leaderboard to display',
				})
				.setRequired(false)
				.setMinValue(1)
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

		const refereesToBeDetermined = await DBOsuMultiMatches.count({
			where: {
				tourneyMatch: true,
				referee: null,
			},
		});

		let additionalInfo = '';

		if (refereesToBeDetermined > 0) {
			const oldestMissingMatch = await DBOsuMultiMatches.findOne({
				attributes: [
					'matchStartDate',
				],
				where: {
					tourneyMatch: true,
					referee: null,
				},
				order: [
					['matchId', 'ASC'],
				],
			});

			const youngestMissingMatch = await DBOsuMultiMatches.findOne({
				attributes: [
					'matchStartDate',
				],
				where: {
					tourneyMatch: true,
					referee: null,
				},
				order: [
					['matchId', 'DESC'],
				],
			});

			additionalInfo = `There are ${humanReadable(refereesToBeDetermined)} matches from <t:${Date.parse(oldestMissingMatch.matchStartDate) / 1000}:f> till <t:${Date.parse(youngestMissingMatch.matchStartDate) / 1000}:f> that are still missing referee info.\n`;
		}

		const refereesPerMatch = await DBOsuMultiMatches.findAll({
			attributes: [
				'referee',
				[Sequelize.fn('COUNT', Sequelize.col('referee')), 'matchesReffed'],
			],
			where: {
				tourneyMatch: true,
				referee: {
					[Op.gt]: 0,
				},
			},
			order: [
				[Sequelize.fn('COUNT', Sequelize.col('referee')), 'DESC'],
			],
			group: ['referee'],
		});

		let leaderboardData = refereesPerMatch.map(entry => ({
			name: entry.referee,
			value: entry.dataValues.matchesReffed,
		}));

		const commandUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId'],
			where: {
				userId: interaction.user.id
			},
		});

		let authorPlacement = null;

		if (commandUser && commandUser.osuUserId) {
			authorPlacement = leaderboardData.findIndex(entry => entry.referee === commandUser.osuUserId) + 1;

			if (authorPlacement > 0) {
				page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
			}
		}

		if (authorPlacement > 0) {
			additionalInfo += `You are ranked #${humanReadable(authorPlacement)} on the referee leaderboard with ${humanReadable(leaderboardData[authorPlacement - 1].value)} matches reffed.\n\n`;
		}

		let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

		let page = interaction.options.getInteger('page');

		if (!page && leaderboardData.length > 150) {
			page = 1;

			if (authorPlacement > 0) {
				page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
			}
		}

		if (totalPages === 1) {
			page = null;
		}

		// Add the osu! names
		let start = 0;
		let end = leaderboardData.length;

		if (page) {
			start = (page - 1) * leaderboardEntriesPerPage;
			end = start + leaderboardEntriesPerPage;
		}

		for (let i = start; i < end; i++) {
			leaderboardData[i].name = await getOsuPlayerName(leaderboardData[i].name) || leaderboardData[i].name;
			leaderboardData[i].value = `${humanReadable(leaderboardData[i].value)} matches reffed`;
		}

		let filename = `referee-leaderboard-${interaction.user.id}.png`;

		if (page) {
			filename = `referee-leaderboard-${interaction.user.id}-page${page}.png`;
		}

		const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', 'Referee leaderboard', filename, page);

		const components = [];

		if (totalPages > 1) {
			const row = new ActionRowBuilder();

			if (page && page > 1) {
				const firstPage = new ButtonBuilder().setCustomId('referee-leaderboard||{"page": 1}').setLabel('First page').setStyle(ButtonStyle.Primary);
				row.addComponents(firstPage);
			}

			//Show previous page button if page is higher than 2, because if page is 2, there is only one previous page which is the first page and there is already a button for it
			if (page && page > 2) {
				const previousPage = new ButtonBuilder().setCustomId(`referee-leaderboard||{"page": ${page - 1}}`).setLabel('Previous page').setStyle(ButtonStyle.Primary);
				row.addComponents(previousPage);
			}

			//Show next page button if page is lower than totalPages - 1, because if page is totalPages - 1, there is only one next page which is the last page and there is already a button for it
			if (page && page < totalPages - 1) {
				const nextPage = new ButtonBuilder().setCustomId(`referee-leaderboard||{"page": ${page + 1}}`).setLabel('Next page').setStyle(ButtonStyle.Primary);
				row.addComponents(nextPage);
			}

			if (page && page < totalPages) {
				const lastPage = new ButtonBuilder().setCustomId(`referee-leaderboard||{"page": ${totalPages}}`).setLabel('Last page').setStyle(ButtonStyle.Primary);
				row.addComponents(lastPage);
			}

			if (row.components.length > 0) {
				components.push(row);
			}
		}

		await interaction.editReply({
			content: `${additionalInfo}`,
			files: [attachment],
			components: components,
		});
	},
};
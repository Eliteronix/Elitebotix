const { DBDiscordUsers } = require('../dbObjects');
const { humanReadable, createLeaderboard, getGameModeName } = require('../utils');
const { leaderboardEntriesPerPage } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-leaderboard',
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-leaderboard')
		.setNameLocalizations({
			'de': 'osu-rangliste',
			'en-GB': 'osu-leaderboard',
			'en-US': 'osu-leaderboard',
		})
		.setDescription('Sends a leaderboard of all the players in the guild that have their account connected')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Rangliste aller Spieler in dem Server, die ihr Konto verbunden haben',
			'en-GB': 'Sends a leaderboard of all the players in the guild that have their account connected',
			'en-US': 'Sends a leaderboard of all the players in the guild that have their account connected',
		})
		.setDMPermission(false)
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
		)
		.addIntegerOption(option =>
			option.setName('mode')
				.setNameLocalizations({
					'de': 'modus',
					'en-GB': 'mode',
					'en-US': 'mode',
				})
				.setDescription('The osu! mode')
				.setDescriptionLocalizations({
					'de': 'Der osu! Modus',
					'en-GB': 'The osu! mode',
					'en-US': 'The osu! mode',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'standard', value: 0 },
					{ name: 'taiko', value: 1 },
					{ name: 'catch', value: 2 },
					{ name: 'mania', value: 3 },
				)
		),
	async execute(interaction) {
		await interaction.deferReply();

		let mode = interaction.options.getInteger('mode');

		if (mode === null) {
			mode = 0;

			const discordUser = await DBDiscordUsers.findOne({
				attributes: [
					'id',
					'userId',
					'osuName',
					'osuUserId',
					'osuRank',
					'osuPP',
					'osuVerified',
					'osuMainServer',
					'osuMainMode',
					'tournamentPings',
					'tournamentPingsMode',
					'tournamentPingsBadged',
					'tournamentPingsStartingFrom',
					'osuDuelStarRating',
					'osuNoModDuelStarRating',
					'osuHiddenDuelStarRating',
					'osuHardRockDuelStarRating',
					'osuDoubleTimeDuelStarRating',
					'osuFreeModDuelStarRating',
				],
				where: {
					userId: interaction.user.id
				},
			});

			if (discordUser && discordUser.osuMainMode) {
				mode = discordUser.osuMainMode;
			}
		}

		let discordUsers = [];

		try {
			let members = await interaction.guild.members.fetch({ time: 300000 });

			members = members.map(member => member.id);

			discordUsers = await DBDiscordUsers.findAll({
				attributes: [
					'userId',
					'osuUserId',
					'osuName',
					'osuVerified',
					'osuRank',
					'osuPP',
					'taikoRank',
					'taikoPP',
					'catchRank',
					'catchPP',
					'maniaRank',
					'maniaPP'
				],
				where: {
					userId: {
						[Op.in]: members,
					}
				},
			});
		} catch (e) {
			if (e.message !== 'Members didn\'t arrive in time.') {
				console.error('commands/osu-leaderboard.js | Get members', e);
				return;
			}
		}

		let osuAccounts = [];
		for (let i = 0; i < discordUsers.length; i++) {
			if (discordUsers[i].osuUserId) {
				if (mode === 0 && parseInt(discordUsers[i].osuPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].osuRank,
						pp: discordUsers[i].osuPP,
					});
				} else if (mode === 1 && parseInt(discordUsers[i].taikoPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].taikoRank,
						pp: discordUsers[i].taikoPP,
					});
				} else if (mode === 2 && parseInt(discordUsers[i].catchPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].catchRank,
						pp: discordUsers[i].catchPP,
					});
				} else if (mode === 3 && parseInt(discordUsers[i].maniaPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].maniaRank,
						pp: discordUsers[i].maniaPP,
					});
				}
			}
		}

		osuAccounts.sort((a, b) => {
			return parseFloat(b.pp) - parseFloat(a.pp);
		});

		let leaderboardData = [];

		let messageToAuthor = '';
		let authorPlacement = 0;

		for (let i = 0; i < osuAccounts.length; i++) {
			if (interaction.user.id === osuAccounts[i].userId) {
				messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
				authorPlacement = i + 1;
			}

			let member = await interaction.guild.members.cache.get(osuAccounts[i].userId);

			let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

			if (member.nickname) {
				userDisplayName = `${member.nickname} / ${userDisplayName}`;
			}

			let verified = 'x';

			if (osuAccounts[i].osuVerified) {
				verified = '✔';
			}

			let dataset = {
				name: userDisplayName
			};

			dataset.value = `#${humanReadable(osuAccounts[i].rank)} | ${humanReadable(Math.floor(osuAccounts[i].pp).toString())}pp | ${verified} ${osuAccounts[i].osuName}`;

			leaderboardData.push(dataset);
		}

		let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

		let page = interaction.options.getInteger('page');

		if (!page && leaderboardData.length > 150) {
			page = 1;
			if (authorPlacement) {
				page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
			}
		}

		if (totalPages === 1) {
			page = null;
		}

		let filename = `osu-leaderboard-${interaction.user.id}-mode-${getGameModeName(mode)}-${interaction.guild.name}.png`;

		if (page) {
			filename = `osu-leaderboard-${interaction.user.id}-mode-${getGameModeName(mode)}-${interaction.guild.name}-page${page}.png`;
		}

		const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${interaction.guild.name}'s osu! ${getGameModeName(mode)} leaderboard`, filename, page);

		const components = [];

		if (totalPages > 1) {
			const row = new ActionRowBuilder();

			if (page && page > 1) {
				const firstPage = new ButtonBuilder().setCustomId('osu-leaderboard||{"page": 1}').setLabel('First page').setStyle(ButtonStyle.Primary);
				row.addComponents(firstPage);
			}

			//Show previous page button if page is higher than 2, because if page is 2, there is only one previous page which is the first page and there is already a button for it
			if (page && page > 2) {
				const previousPage = new ButtonBuilder().setCustomId(`osu-leaderboard||{"page": ${page - 1}}`).setLabel('Previous page').setStyle(ButtonStyle.Primary);
				row.addComponents(previousPage);
			}

			//Show next page button if page is lower than totalPages - 1, because if page is totalPages - 1, there is only one next page which is the last page and there is already a button for it
			if (page && page < totalPages - 1) {
				const nextPage = new ButtonBuilder().setCustomId(`osu-leaderboard||{"page": ${page + 1}}`).setLabel('Next page').setStyle(ButtonStyle.Primary);
				row.addComponents(nextPage);
			}

			if (page && page < totalPages) {
				const lastPage = new ButtonBuilder().setCustomId(`osu-leaderboard||{"page": ${totalPages}}`).setLabel('Last page').setStyle(ButtonStyle.Primary);
				row.addComponents(lastPage);
			}

			if (row.components.length > 0) {
				components.push(row);
			}
		}

		//Send attachment
		await interaction.followUp({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> to connect your osu! account.\nData is being updated once a day or when </osu-profile:${interaction.client.slashCommandData.find(command => command.name === 'osu-profile').id}> is being used.`, files: [attachment], components: components });
	},
};
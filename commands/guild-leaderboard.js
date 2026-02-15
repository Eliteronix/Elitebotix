const { DBServerUserActivity } = require('../dbObjects');
const { createLeaderboard, humanReadable } = require('../utils.js');
const { leaderboardEntriesPerPage, showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'guild-leaderboard',
	description: 'Sends a leaderboard of the top users in the guild',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('guild-leaderboard')
		.setNameLocalizations({
			'de': 'server-rangliste',
			'en-GB': 'guild-leaderboard',
			'en-US': 'guild-leaderboard',
		})
		.setDescription('Sends a leaderboard of the top users in the guild')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Rangliste der Top-Nutzer im Server',
			'en-GB': 'Sends a leaderboard of the top users in the guild',
			'en-US': 'Sends a leaderboard of the top users in the guild',
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
		),
	async execute(interaction) {
		if (interaction) {
			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				if (timestamps) {
					timestamps.delete(interaction.user.id);
				}
				return;
			}
		}

		let discordUsers = [];

		try {
			let members = await interaction.guild.members.fetch({ time: 300000 });

			members = members.map(member => member);

			discordUsers = await DBServerUserActivity.findAll({
				attributes: ['userId', 'points'],
				where: {
					userId: {
						[Op.in]: members.map(member => member.id),
					},
					guildId: interaction.guildId,
				},
			});

			for (let i = 0; i < discordUsers.length; i++) {
				let member = members.find(member => member.id === discordUsers[i].userId);

				discordUsers[i].displayColor = member.displayHexColor;
			}
		} catch (e) {
			if (e.message !== 'Members didn\'t arrive in time.') {
				console.error('commands/guild-leaderboard.js | Get members', e);
				return;
			}
		}

		discordUsers.sort((a, b) => parseInt(b.points) - parseInt(a.points));

		let leaderboardData = [];

		let messageToAuthor = '';
		let authorPlacement = 0;

		for (let i = 0; i < discordUsers.length; i++) {
			if (interaction.user.id === discordUsers[i].userId) {
				messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
				authorPlacement = i + 1;
			}

			let member = await interaction.guild.members.cache.get(discordUsers[i].userId);

			let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

			if (member.nickname) {
				userDisplayName = `${member.nickname} / ${userDisplayName}`;
			}

			let dataset = {
				name: userDisplayName,
				value: `${humanReadable(discordUsers[i].points)} point(s)`,
				color: discordUsers[i].displayColor
			};

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

		let filename = `guild-leaderboard-${interaction.user.id}-${interaction.guild.name}.png`;
		if (page) {
			filename = `guild-leaderboard-${interaction.user.id}-${interaction.guild.name}-page${page}.png`;
		}

		//Remove trailing s if guild name stops with s or x
		let title = `${interaction.guild.name}'s activity leaderboard`;
		if (interaction.guild.name.endsWith('s') || interaction.guild.name.endsWith('x')) {
			title = `${interaction.guild.name}' activity leaderboard`;
		}

		const attachment = await createLeaderboard(leaderboardData, 'discord-background.png', title, filename, page);

		const components = [];

		if (totalPages > 1) {
			const row = new ActionRowBuilder();

			if (page && page > 1) {
				const firstPage = new ButtonBuilder().setCustomId('guild-leaderboard||{"page": 1}').setLabel('First page').setStyle(ButtonStyle.Primary);
				row.addComponents(firstPage);
			}

			//Show previous page button if page is higher than 2, because if page is 2, there is only one previous page which is the first page and there is already a button for it
			if (page && page > 2) {
				const previousPage = new ButtonBuilder().setCustomId(`guild-leaderboard||{"page": ${page - 1}}`).setLabel('Previous page').setStyle(ButtonStyle.Primary);
				row.addComponents(previousPage);
			}

			//Show next page button if page is lower than totalPages - 1, because if page is totalPages - 1, there is only one next page which is the last page and there is already a button for it
			if (page && page < totalPages - 1) {
				const nextPage = new ButtonBuilder().setCustomId(`guild-leaderboard||{"page": ${page + 1}}`).setLabel('Next page').setStyle(ButtonStyle.Primary);
				row.addComponents(nextPage);
			}

			if (page && page < totalPages) {
				const lastPage = new ButtonBuilder().setCustomId(`guild-leaderboard||{"page": ${totalPages}}`).setLabel('Last page').setStyle(ButtonStyle.Primary);
				row.addComponents(lastPage);
			}

			if (row.components.length > 0) {
				components.push(row);
			}
		}

		//Send attachment
		await interaction.followUp({ content: `The leaderboard shows the most active users of the server.${messageToAuthor}`, files: [attachment], components: components });
	},
};
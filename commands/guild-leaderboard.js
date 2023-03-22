const { DBServerUserActivity } = require('../dbObjects');
const { createLeaderboard, humanReadable, populateMsgFromInteraction, logDatabaseQueries } = require('../utils.js');
const { leaderboardEntriesPerPage, showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
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
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				//TODO: deferReply
				await interaction.reply('Processing guild leaderboard...');
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			if (interaction.options._hoistedOptions[1]) {
				args = [interaction.options._hoistedOptions[1].value];
			} else if (interaction.options._hoistedOptions[0]) {
				args = [interaction.options._hoistedOptions[0].value];
			} else {
				args = [];
			}
		}

		let processingMessage;
		if (msg.id) {
			processingMessage = await msg.reply('Processing guild leaderboard...');
		}

		let discordUsers = [];

		try {
			let members = await msg.guild.members.fetch({ time: 300000 });

			members = members.map(member => member);

			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-leaderboard.js DBDiscordUsers');
			discordUsers = await DBServerUserActivity.findAll({
				where: {
					userId: {
						[Op.in]: members.map(member => member.id),
					},
					guildId: msg.guildId,
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
			if (msg.author.id === discordUsers[i].userId) {
				messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
				authorPlacement = i + 1;
			}

			let member = await msg.guild.members.cache.get(discordUsers[i].userId);

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

		let page;

		if (args[0] && !isNaN(args[0])) {
			page = Math.abs(parseInt(args[0]));
		}

		if (!page && leaderboardData.length > 150) {
			page = 1;
			if (authorPlacement) {
				page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
			}
		}

		if (totalPages === 1) {
			page = null;
		}

		let filename = `guild-leaderboard-${msg.author.id}-${msg.guild.name}.png`;

		if (page) {
			filename = `guild-leaderboard-${msg.author.id}-${msg.guild.name}-page${page}.png`;
		}

		//Remove trailing s if guild name stops with s or x
		let title = `${msg.guild.name}'s activity leaderboard`;
		if (msg.guild.name.endsWith('s') || msg.guild.name.endsWith('x')) {
			title = `${msg.guild.name}' activity leaderboard`;
		}

		const attachment = await createLeaderboard(leaderboardData, 'discord-background.png', title, filename, page);

		//Send attachment
		let leaderboardMessage;
		if (msg.id) {
			leaderboardMessage = await msg.reply({ content: `The leaderboard shows the most active users of the server.${messageToAuthor}`, files: [attachment] });
		} else if (interaction) {
			leaderboardMessage = await interaction.followUp({ content: `The leaderboard shows the most active users of the server.${messageToAuthor}`, files: [attachment] });
		} else {
			leaderboardMessage = await msg.channel.send({ content: `The leaderboard shows the most active users of the server.${messageToAuthor}`, files: [attachment] });
		}

		if (page) {
			if (page > 1) {
				await leaderboardMessage.react('◀️');
			}

			if (page < totalPages) {
				await leaderboardMessage.react('▶️');
			}
		}

		if (processingMessage) {
			processingMessage.delete();
		}
	},
};
const { DBServerUserActivity } = require('../dbObjects');
const { createLeaderboard, humanReadable, populateMsgFromInteraction, logDatabaseQueries } = require('../utils.js');
const { leaderboardEntriesPerPage } = require('../config.json');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'server-leaderboard',
	aliases: ['guild-leaderboard', 'guild-ranking'],
	description: 'Sends a leaderboard of the top users in the guild',
	usage: '<page>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 30,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Processing guild leaderboard...');

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

		msg.guild.members.fetch()
			.then(async (guildMembers) => {
				const members = [];
				guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));
				let discordUsers = [];
				for (let i = 0; i < members.length; i++) {
					logDatabaseQueries(4, 'commands/guild-leaderboard.js DBServerUserActivity');
					const serverUserActivity = await DBServerUserActivity.findOne({
						where: { userId: members[i].id, guildId: msg.guildId },
					});

					if (serverUserActivity) {
						serverUserActivity.displayColor = members[i].displayHexColor;
						discordUsers.push(serverUserActivity);
					}
				}

				quicksort(discordUsers);

				let leaderboardData = [];

				let messageToAuthor = '';
				let authorPlacement = 0;

				for (let i = 0; i < discordUsers.length; i++) {
					if (msg.author.id === discordUsers[i].userId) {
						messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
						authorPlacement = i + 1;
					}
					const member = await msg.guild.members.fetch(discordUsers[i].userId);

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

				if (!page && leaderboardData.length > 300) {
					page = 1;
					if (authorPlacement) {
						page = Math.floor(authorPlacement / leaderboardEntriesPerPage);
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
			})
			.catch(err => {
				if (processingMessage) {
					processingMessage.edit('Error');
				}
				console.log(err);
			});
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].points) >= parseFloat(pivot.points)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}
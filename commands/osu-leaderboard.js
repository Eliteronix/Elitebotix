const { DBDiscordUsers } = require('../dbObjects');
const { humanReadable, createLeaderboard, populateMsgFromInteraction, logDatabaseQueries, getOsuUserServerMode, getGameModeName } = require('../utils');
const { leaderboardEntriesPerPage } = require('../config.json');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-leaderboard',
	aliases: ['osu-guild-leaderboard', 'osu-ranking', 'osu-guild-ranking', 'osu-lb'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '[page]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 30,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('osu! leaderboard will be created');

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}

		let processingMessage;
		if (msg.id) {
			processingMessage = await msg.reply('Processing osu! leaderboard...');
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const mode = commandConfig[2];
		msg.guild.members.fetch()
			.then(async (guildMembers) => {
				const members = [];
				guildMembers.each(member => members.push(member));
				let osuAccounts = [];
				for (let i = 0; i < members.length; i++) {
					logDatabaseQueries(4, 'commands/osu-leaderboard.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: members[i].id },
					});

					if (discordUser && discordUser.osuUserId) {
						if (mode === 0 && parseInt(discordUser.osuPP) > 0) {
							osuAccounts.push({
								userId: discordUser.userId,
								osuUserId: discordUser.osuUserId,
								osuName: discordUser.osuName,
								osuVerified: discordUser.osuVerified,
								rank: discordUser.osuRank,
								pp: discordUser.osuPP,
							});
						} else if (mode === 1 && parseInt(discordUser.taikoPP) > 0) {
							osuAccounts.push({
								userId: discordUser.userId,
								osuUserId: discordUser.osuUserId,
								osuName: discordUser.osuName,
								osuVerified: discordUser.osuVerified,
								rank: discordUser.taikoRank,
								pp: discordUser.taikoPP,
							});
						} else if (mode === 2 && parseInt(discordUser.catchPP) > 0) {
							osuAccounts.push({
								userId: discordUser.userId,
								osuUserId: discordUser.osuUserId,
								osuName: discordUser.osuName,
								osuVerified: discordUser.osuVerified,
								rank: discordUser.catchRank,
								pp: discordUser.catchPP,
							});
						} else if (mode === 3 && parseInt(discordUser.maniaPP) > 0) {
							osuAccounts.push({
								userId: discordUser.userId,
								osuUserId: discordUser.osuUserId,
								osuName: discordUser.osuName,
								osuVerified: discordUser.osuVerified,
								rank: discordUser.maniaRank,
								pp: discordUser.maniaPP,
							});
						}
					}
				}

				quicksort(osuAccounts);

				let leaderboardData = [];

				let messageToAuthor = '';
				let authorPlacement = 0;

				for (let i = 0; i < osuAccounts.length; i++) {
					if (msg.author.id === osuAccounts[i].userId) {
						messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
						authorPlacement = i + 1;
					}
					const member = await msg.guild.members.fetch(osuAccounts[i].userId);

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

				let page;

				if (args[0] && !isNaN(args[0])) {
					page = Math.abs(parseInt(args[0]));
				}

				if (!page && leaderboardData.length > 300) {
					page = 1;
					if (authorPlacement) {
						page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
					}
				}

				if (totalPages === 1) {
					page = null;
				}

				let filename = `osu-leaderboard-${msg.author.id}-mode-${getGameModeName(mode)}-${msg.guild.name}.png`;

				if (page) {
					filename = `osu-leaderboard-${msg.author.id}-mode-${getGameModeName(mode)}-${msg.guild.name}-page${page}.png`;
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${msg.guild.name}'s osu! ${getGameModeName(mode)} leaderboard`, filename, page);

				//Send attachment
				let leaderboardMessage;
				if (msg.id) {
					leaderboardMessage = await msg.reply({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`/osu-link connect:<username>\` to connect your osu! account.\nData is being updated once a day or when \`/osu-profile username:<username>\` is being used.`, files: [attachment] });
				} else if (interaction) {
					leaderboardMessage = await interaction.followUp({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`/osu-link connect:<username>\` to connect your osu! account.\nData is being updated once a day or when \`/osu-profile username:<username>\` is being used.`, files: [attachment] });
				} else {
					leaderboardMessage = await msg.channel.send({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`/osu-link connect:<username>\` to connect your osu! account.\nData is being updated once a day or when \`/osu-profile username:<username>\` is being used.`, files: [attachment] });
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
		if (parseFloat(list[j].pp) >= parseFloat(pivot.pp)) {
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
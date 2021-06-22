const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getGuildPrefix, humanReadable, createLeaderboard } = require('../utils');

module.exports = {
	name: 'osu-leaderboard',
	aliases: ['osu-guild-leaderboard', 'osu-ranking', 'osu-guild-ranking'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '<page>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 30,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let processingMessage = await msg.channel.send('Processing osu! leaderboard...');

		msg.guild.members.fetch()
			.then(async (guildMembers) => {
				const members = guildMembers.array();
				let osuAccounts = [];
				for (let i = 0; i < members.length; i++) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: members[i].id },
					});

					if (discordUser && discordUser.osuUserId) {
						const today = new Date();
						const dd = String(today.getDate());
						const mm = String(today.getMonth() + 1);
						const yyyy = today.getFullYear();

						let osuUser;

						if (discordUser.updatedAt.getFullYear() < yyyy) {
							osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
						} else if (discordUser.updatedAt.getMonth() + 1 < mm) {
							osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
						} else if (discordUser.updatedAt.getDate() < dd) {
							osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
						} else if (discordUser.osuPP === null || discordUser.osuRank === null || discordUser.osuName === null) {
							osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
						}

						if (osuUser) {
							discordUser.osuName = osuUser.name;
							discordUser.osuPP = osuUser.pp.raw;
							discordUser.osuRank = osuUser.pp.rank;
							await discordUser.save();
						}

						osuAccounts.push(discordUser);
					}
				}

				quicksort(osuAccounts);

				let leaderboardData = [];

				let messageToAuthor = '';

				for (let i = 0; i < osuAccounts.length; i++) {
					if (msg.author.id === osuAccounts[i].userId) {
						messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
					}
					const member = await msg.guild.members.fetch(osuAccounts[i].userId);

					let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

					if (member.nickname) {
						userDisplayName = `${member.nickname} / ${userDisplayName}`;
					}

					let verified = '⨯';

					if (osuAccounts[i].osuVerified) {
						verified = '✔';
					}

					let dataset = {
						name: userDisplayName,
						value: `#${humanReadable(osuAccounts[i].osuRank)} | ${humanReadable(Math.floor(osuAccounts[i].osuPP).toString())}pp | ${verified} ${osuAccounts[i].osuName}`,
					};

					leaderboardData.push(dataset);
				}

				let totalPages = Math.floor(leaderboardData.length / 100) + 1;

				let page;

				if (args[0] && !isNaN(args[0])) {
					page = parseInt(args[0]);
				}

				if (totalPages === 1) {
					page = null;
				}

				let filename = `osu-leaderboard-${msg.author.id}-${msg.guild.name}.png`;

				if (page) {
					filename = `osu-leaderboard-${msg.author.id}-${msg.guild.name}-page${page}.png`;
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${msg.guild.name}'s osu! leaderboard`, filename, page);

				const guildPrefix = await getGuildPrefix(msg);

				//Send attachment
				const leaderboardMessage = await msg.channel.send(`The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`${guildPrefix}osu-link <username>\` to connect your osu! account.\nData is being updated once a day or when \`${guildPrefix}osu-profile <username>\` is being used.`, attachment);

				if (page) {
					if (page > 1) {
						await leaderboardMessage.react('◀️');
					}

					if (page < totalPages) {
						await leaderboardMessage.react('▶️');
					}
				}

				processingMessage.delete();
			})
			.catch(err => {
				processingMessage.edit('Error');
				console.log(err);
			});
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].osuPP) >= parseFloat(pivot.osuPP)) {
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
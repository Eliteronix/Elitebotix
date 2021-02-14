const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');

module.exports = {
	name: 'leaderboard',
	aliases: ['guild-leaderboard', 'ranking', 'guild-ranking'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '<osu> (the only supported game at the moment)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	guildOnly: true,
	args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		if (args[0] === 'osu') {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});
			let processingMessage = await msg.channel.send('Processing guild members...');
			msg.guild.members.fetch()
				.then(async (guildMembers) => {
					const members = guildMembers.array();
					processingMessage.edit('Grabbing osu! accounts...');
					let osuAccounts = [];
					for (let i = 0; i < members.length; i++) {
						if(i%100 === 0){
							processingMessage.edit(`Grabbing osu! accounts...\nLooked at ${i} out of ${members.length} server members so far.`);
						}
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

					processingMessage.edit('Sorting accounts...');

					quicksort(osuAccounts);

					processingMessage.edit('Creating leaderboard...');

					//Send embed
					const leaderBoardEmbed = new Discord.MessageEmbed()
						.setColor('#FF66AB')
						.setTitle(`${msg.guild.name}'s osu! leaderboard`)
						.setDescription('Leaderboard consists of all players that have their osu! account connected to the bot.\nData is being updated once a day or when `osu-profile <username>` is being used.`')
						.setTimestamp();

					if (msg.guild.iconURL()) {
						leaderBoardEmbed.setThumbnail(`${msg.guild.iconURL()}`);
					}

					for (let i = 0; i < osuAccounts.length; i++) {
						const member = await msg.guild.members.fetch(osuAccounts[i].userId);

						let userDisplayName = member.user.username;

						if (member.nickname) {
							userDisplayName = member.nickname;
						}

						let verified = '❌';

						if (osuAccounts[i].osuVerified) {
							verified = '☑️';
						}

						leaderBoardEmbed.addField(`${i + 1}. ${userDisplayName} / ${member.user.username}#${member.user.discriminator}`, `#${humanReadable(osuAccounts[i].osuRank)} | ${humanReadable(Math.floor(osuAccounts[i].osuPP).toString())}pp | Account: ${osuAccounts[i].osuName} ${verified}`);
					}

					processingMessage.delete();
					msg.channel.send(leaderBoardEmbed);
				})
				.catch(err => {
					processingMessage.edit('Error');
					console.log(err);
				});
		}
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

function humanReadable(input) {
	let output = '';
	for (let i = 0; i < input.length; i++) {
		if (i > 0 && (input.length - i) % 3 === 0) {
			output = output + '.';
		}
		output = output + input.charAt(i);
	}

	return output;
}
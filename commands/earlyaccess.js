const { DBDiscordUsers, DBOsuTourneyFollows } = require('../dbObjects');
const { getUserDuelStarRating } = require('../utils');
const osu = require('node-osu');
const { developers } = require('../config.json');
const { Op } = require('sequelize');

module.exports = {
	name: 'earlyaccess',
	aliases: ['early', 'ea'],
	description: 'Has some early access features for patreons if possible',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: msg.author.id,
				patreon: true
			}
		});

		if (!developers.includes(msg.author.id) && !discordUser) {
			return msg.reply('Earlyaccess commands are reserved for developers and patreons. As soon as they are up to standard for release you will be able to use them.');
		}

		if (args[0] === 'derank') {
			if (!args[1]) {
				return msg.reply('You didn\'t give a player to compare');
			}

			let discordUser = await DBDiscordUsers.findOne({
				where: {
					[Op.or]: {
						osuUserId: args[1],
						osuName: args[1]
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

				let user = await osuApi.getUser({ u: args[1], m: 0 });

				let duelRating = await getUserDuelStarRating({ osuUserId: user.id, client: msg.client });

				discordUser = {
					osuName: user.name,
					osuUserId: user.id,
					osuPP: user.pp.raw,
					osuRank: user.pp.rank,
					osuDuelStarRating: duelRating.total,
				};
			}

			let ppDiscordUsers = await DBDiscordUsers.findAll({
				where: {
					osuUserId: {
						[Op.gt]: 0
					},
					osuPP: {
						[Op.gt]: 0
					}
				},
				order: [
					['osuPP', 'DESC']
				]
			});

			quicksort(ppDiscordUsers);

			let duelDiscordUsers = await DBDiscordUsers.findAll({
				where: {
					osuUserId: {
						[Op.gt]: 0
					},
					osuDuelStarRating: {
						[Op.gt]: 0
					}
				},
				order: [
					['osuDuelStarRating', 'DESC']
				]
			});

			let ppRank = null;

			for (let i = 0; i < ppDiscordUsers.length && !ppRank; i++) {
				if (parseFloat(discordUser.osuPP) >= parseFloat(ppDiscordUsers[i].osuPP)) {
					ppRank = i + 1;
				}
			}

			if (!ppRank) {
				ppRank = ppDiscordUsers.length + 1;
			}

			let duelRank = null;

			for (let i = 0; i < duelDiscordUsers.length && !duelRank; i++) {
				if (parseFloat(discordUser.osuDuelStarRating) >= parseFloat(duelDiscordUsers[i].osuDuelStarRating)) {
					duelRank = i + 1;
				}
			}

			if (!duelRank) {
				duelRank = duelDiscordUsers.length + 1;
			}

			if (!discordUser.userId) {
				ppDiscordUsers.length = ppDiscordUsers.length + 1;
				duelDiscordUsers.length = duelDiscordUsers.length + 1;
			}

			let expectedPpRank = Math.round(duelRank / duelDiscordUsers.length * ppDiscordUsers.length);


			let rankOffset = 0;

			if (!discordUser.userId && expectedPpRank > 1) {
				rankOffset = 1;
			}

			let expectedPpRankPercentageDifference = Math.round((100 / ppDiscordUsers.length * ppRank - 100 / ppDiscordUsers.length * expectedPpRank) * 100) / 100;
			msg.reply(`${discordUser.osuName} is:\n\`\`\`PP-Rank ${ppRank} out of ${ppDiscordUsers.length}\nDuel-Rating-Rank ${duelRank} out of ${duelDiscordUsers.length}\n\nExpected osu! pp rank for that duel rating would be:\n${expectedPpRank} (Difference: ${ppRank - expectedPpRank} | ${expectedPpRankPercentageDifference}%)\n\nThat is in rank numbers:\n#${discordUser.osuRank} -> ~#${ppDiscordUsers[expectedPpRank - 1 - rankOffset].osuRank} (Difference: ${discordUser.osuRank - ppDiscordUsers[expectedPpRank - 1 - rankOffset].osuRank} ranks)\`\`\``);
		} if (args[0] === 'follow') {
			if (!args[1]) {
				return msg.reply('You did not give a user to follow');
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: args[1], m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: msg.author.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						return msg.reply(`You are already following ${osuUser.name}`);
					}

					await DBOsuTourneyFollows.create({
						userId: msg.author.id,
						osuUserId: osuUser.id
					});

					return msg.reply(`You are now following ${osuUser.name}`);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${args[1].replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.log(err);
					}
				});
		} else if (args[0] === 'unfollow') {
			if (!args[1]) {
				return msg.reply('You did not give a user to follow');
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: args[1], m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: msg.author.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						await existingFollow.destroy();
						return msg.reply(`You are no longer following ${osuUser.name}`);
					}

					return msg.reply(`You were not following ${osuUser.name}`);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${args[1].replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.log(err);
					}
				});
		} else {
			msg.reply('Invalid command');
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
const { DBDiscordUsers, DBOsuTourneyFollows } = require('../dbObjects');
const osu = require('node-osu');
const { developers } = require('../config.json');

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

		if (args[0] === 'follow') {
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
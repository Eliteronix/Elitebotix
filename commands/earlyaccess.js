const { DBDiscordUsers, DBOsuTourneyFollows } = require('../dbObjects');
const osu = require('node-osu');
const { developers } = require('../config.json');

module.exports = {
	name: 'earlyaccess',
	aliases: ['early', 'ea'],
	description: 'Has some early access features for patreons if possible',
	usage: 'follow / unfollow / followlist / followers',
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
		} else if (args[0] === 'followlist') {
			//Get all follows for the user
			let follows = await DBOsuTourneyFollows.findAll({
				where: {
					userId: msg.author.id
				}
			});

			if (!follows.length) {
				return msg.reply('You are not following anyone');
			}

			let followList = [];
			for (let i = 0; i < follows.length; i++) {
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: follows[i].osuUserId
					}
				});

				if (discordUser) {
					followList.push(discordUser.osuName);
				} else {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					await osuApi.getUser({ u: follows[i].osuUserId, m: 0 })
						.then(async (osuUser) => {
							followList.push(osuUser.name);
						})
						.catch(err => {
							console.log(err);
						});
				}
			}

			msg.reply(`You are following: \`${followList.join('`, `')}\``);
		} else if (args[0] === 'followers') {
			//Check if the user has a connected osu! account
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return msg.reply('You have not connected your osu! account');
			}

			let followers = await DBOsuTourneyFollows.findAll({
				where: {
					osuUserId: discordUser.osuUserId
				}
			});

			if (!followers.length) {
				return msg.reply('You have no followers');
			}

			let followerList = [];
			for (let i = 0; i < followers.length; i++) {
				let follower = '';
				let discordName = null;
				try {
					discordName = await msg.client.users.fetch(followers[i].userId);
				} catch (e) {
					//Nothing
				}

				if (discordName) {
					follower = `${discordName.username}#${discordName.discriminator}`;
				}

				let followerUser = await DBDiscordUsers.findOne({
					where: {
						userId: followers[i].userId
					}
				});

				if (followerUser) {
					followers[i].osuName = followerUser.osuName;
				}

				if (!follower && followers[i].osuName) {
					follower = followers[i].osuName;
				} else if (follower && followers[i].osuName) {
					follower = `${follower} (${followers[i].osuName})`;
				}

				followerList.push(follower);
			}

			return msg.reply(`You have ${followers.length} followers: \`${followerList.join('`, `')}\``);

		} else {
			msg.reply('Invalid command');
		}
	},
};
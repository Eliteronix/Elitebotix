const { DBDiscordUsers, DBOsuTourneyFollows } = require('../dbObjects');
const osu = require('node-osu');
const { showUnknownInteractionError } = require('../config.json');
const { Permissions } = require('discord.js');
const { getOsuPlayerName } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-follow',
	description: 'Allows following osu! users',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'follow') {
			let username = interaction.options.getString('username');

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: username, m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: interaction.user.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						return await interaction.editReply(`You are already following ${osuUser.name}`);
					}

					let disabledFollows = await DBDiscordUsers.findOne({
						where: {
							osuUserId: osuUser.id,
							disableFollows: true
						},
					});

					if (disabledFollows) {
						return await interaction.editReply('This user doesn\'t allow others to follow them.');
					}

					await DBOsuTourneyFollows.create({
						userId: interaction.user.id,
						osuUserId: osuUser.id
					});

					return await interaction.editReply(`You are now following ${osuUser.name}`);
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.error(err);
					}
				});
		} else if (interaction.options._subcommand === 'unfollow') {
			let username = interaction.options.getString('username');

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: username, m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: interaction.user.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						await existingFollow.destroy();
						return await interaction.editReply(`You are no longer following ${osuUser.name}`);
					}

					return await interaction.editReply(`You were not following ${osuUser.name}`);
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.error(err);
					}
				});
		} else if (interaction.options._subcommand === 'followlist') {
			//Get all follows for the user
			let follows = await DBOsuTourneyFollows.findAll({
				where: {
					userId: interaction.user.id
				}
			});

			if (!follows.length) {
				return await interaction.editReply('You are not following anyone');
			}

			let followList = [];
			for (let i = 0; i < follows.length; i++) {
				followList.push(await getOsuPlayerName(follows[i].osuUserId));
			}

			return await interaction.editReply(`You are following: \`${followList.join('`, `')}\``);
		} else if (interaction.options._subcommand === 'followers') {
			//Check if the user has a connected osu! account
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply('You have not connected your osu! account. Use </osu-link connect:1064502370710605836> to connect your account');
			}

			let followers = await DBOsuTourneyFollows.findAll({
				where: {
					osuUserId: discordUser.osuUserId
				}
			});

			if (!followers.length) {
				return await interaction.editReply('You have no followers');
			}

			let followerList = [];
			for (let i = 0; i < followers.length; i++) {
				let follower = '';
				let discordName = null;
				try {
					discordName = await interaction.client.users.fetch(followers[i].userId);
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

			return await interaction.editReply(`You have ${followers.length} followers: \`${followerList.join('`, `')}\``);
		} else if (interaction.options._subcommand === 'allowfollowing') {
			let allowFollowing = interaction.options.getBoolean('allow');

			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null
					},
					osuVerified: true
				}
			});

			if (!discordUser) {
				return await interaction.editReply('You have not connected and verified your osu! account. Use </osu-link connect:1064502370710605836> to connect your account');
			}

			if (!allowFollowing) {
				await DBOsuTourneyFollows.destroy({
					where: {
						osuUserId: discordUser.osuUserId
					}
				});
			}

			discordUser.disableFollows = !allowFollowing;
			await discordUser.save();

			return await interaction.editReply(`You are now ${allowFollowing ? 'allowing' : 'disallowing'} people to follow you`);
		}
	},
};
const { DBDiscordUsers, DBOsuTourneyFollows } = require('../dbObjects');
const osu = require('node-osu');
const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getOsuPlayerName, logOsuAPICalls } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-follow',
	description: 'Allows following osu! users',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-follow')
		.setNameLocalizations({
			'de': 'osu-folgen',
			'en-GB': 'osu-follow',
			'en-US': 'osu-follow',
		})
		.setDescription('Allows following osu! users')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es osu! Spielern zu folgen',
			'en-GB': 'Allows following osu! users',
			'en-US': 'Allows following osu! users',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('follow')
				.setNameLocalizations({
					'de': 'folgen',
					'en-GB': 'follow',
					'en-US': 'follow',
				})
				.setDescription('Get notified when a user plays a new match')
				.setDescriptionLocalizations({
					'de': 'Benachrichtigt dich, wenn ein Spieler eine neues match spielt',
					'en-GB': 'Get notified when a user plays a new match',
					'en-US': 'Get notified when a user plays a new match',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The username, id or link of the player to follow')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers, dem du folgen willst',
							'en-GB': 'The username, id or link of the player to follow',
							'en-US': 'The username, id or link of the player to follow',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('unfollow')
				.setNameLocalizations({
					'de': 'entfolgen',
					'en-GB': 'unfollow',
					'en-US': 'unfollow',
				})
				.setDescription('Stop getting notified when a user plays a new match')
				.setDescriptionLocalizations({
					'de': 'Stoppt die Benachrichtigung, wenn ein Spieler eine neues match spielt',
					'en-GB': 'Stop getting notified when a user plays a new match',
					'en-US': 'Stop getting notified when a user plays a new match',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The username, id or link of the player to unfollow')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers, dem du entfolgen willst',
							'en-GB': 'The username, id or link of the player to unfollow',
							'en-US': 'The username, id or link of the player to unfollow',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('followlist')
				.setNameLocalizations({
					'de': 'followliste',
					'en-GB': 'followlist',
					'en-US': 'followlist',
				})
				.setDescription('Get a list of all followed users')
				.setDescriptionLocalizations({
					'de': 'Zeigt eine Liste aller Spieler, denen du folgst',
					'en-GB': 'Get a list of all followed users',
					'en-US': 'Get a list of all followed users',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('followers')
				.setNameLocalizations({
					'de': 'follower',
					'en-GB': 'followers',
					'en-US': 'followers',
				})
				.setDescription('Get a list of all users following you')
				.setDescriptionLocalizations({
					'de': 'Zeigt eine Liste aller Spieler, die dir folgen',
					'en-GB': 'Get a list of all users following you',
					'en-US': 'Get a list of all users following you',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('allowfollowing')
				.setNameLocalizations({
					'de': 'erlaubefolgen',
					'en-GB': 'allowfollowing',
					'en-US': 'allowfollowing',
				})
				.setDescription('Allow others to follow you or not')
				.setDescriptionLocalizations({
					'de': 'Erlaubt es anderen, dir zu folgen oder nicht',
					'en-GB': 'Allow others to follow you or not',
					'en-US': 'Allow others to follow you or not',
				})
				.addBooleanOption(option =>
					option
						.setName('allow')
						.setNameLocalizations({
							'de': 'erlauben',
							'en-GB': 'allow',
							'en-US': 'allow',
						})
						.setDescription('Change if others can follow you or not')
						.setDescriptionLocalizations({
							'de': 'Ändert, ob andere dir folgen können oder nicht',
							'en-GB': 'Change if others can follow you or not',
							'en-US': 'Change if others can follow you or not',
						})
						.setRequired(true)
				)
		),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		if (interaction.options.getSubcommand() === 'follow') {
			let username = interaction.options.getString('username');

			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			logOsuAPICalls('commands/osu-follow.js follow');
			await osuApi.getUser({ u: username, m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						attributes: ['id'],
						where: {
							userId: interaction.user.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						return await interaction.editReply(`You are already following ${osuUser.name}`);
					}

					let disabledFollows = await DBDiscordUsers.findOne({
						attributes: ['id'],
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
						await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
					} else {
						console.error(err);
					}
				});
		} else if (interaction.options.getSubcommand() === 'unfollow') {
			let username = interaction.options.getString('username');

			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			logOsuAPICalls('commands/osu-follow.js unfollow');
			await osuApi.getUser({ u: username, m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						attributes: ['id'],
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
						await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
					} else {
						console.error(err);
					}
				});
		} else if (interaction.options.getSubcommand() === 'followlist') {
			//Get all follows for the user
			let follows = await DBOsuTourneyFollows.findAll({
				attributes: ['osuUserId'],
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
		} else if (interaction.options.getSubcommand() === 'followers') {
			//Check if the user has a connected osu! account
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply(`You have not connected your osu! account. Use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> to connect your account`);
			}

			let followers = await DBOsuTourneyFollows.findAll({
				attributes: ['userId'],
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
					attributes: ['osuName'],
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
		} else if (interaction.options.getSubcommand() === 'allowfollowing') {
			let allowFollowing = interaction.options.getBoolean('allow');

			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'osuUserId', 'disableFollows'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null
					},
					osuVerified: true
				}
			});

			if (!discordUser) {
				return await interaction.editReply(`You have not connected and verified your osu! account. Use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> to connect your account`);
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
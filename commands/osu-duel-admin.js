const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const { logDatabaseQueries, populateMsgFromInteraction, getUserDuelStarRating, createDuelMatch, updateQueueChannels } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-duel-admin',
	// aliases: ['osu-quickmatch'],
	description: 'Admin commands for osu-duel',
	// usage: '[username] [username] ... (Use `_` instead of spaces; Use `--b` for bancho / `--r` for ripple; Use `--s`/`--t`/`--c`/`--m` for modes)',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	//args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			if (interaction.options._subcommand === 'createduel1v1' || interaction.options._subcommand === 'createduel2v2') {
				try {
					await interaction.deferReply();
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					return;
				}

				msg = await populateMsgFromInteraction(interaction);

				// Get the best of
				let bestOf = 7;

				if (interaction.options.getInteger('bestof')) {
					bestOf = interaction.options.getInteger('bestof');
				}

				// Get the ranked flag
				let onlyRanked = false;

				if (interaction.options.getBoolean('ranked')) {
					onlyRanked = interaction.options.getBoolean('ranked');
				}

				// Get the star rating
				let averageStarRating = null;

				if (interaction.options.getNumber('starrating')) {
					averageStarRating = interaction.options.getNumber('starrating');

					if (averageStarRating < 3) {
						return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
					} else if (averageStarRating > 10) {
						return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
					}
				}

				// Get the firstTeam
				let team = [];

				if (interaction.options.getUser('firstplayer')) {
					team.push(interaction.options.getUser('firstplayer').id);
				}

				if (interaction.options.getUser('secondplayer')) {
					team.push(interaction.options.getUser('secondplayer').id);
				}

				if (interaction.options.getUser('thirdplayer')) {
					team.push(interaction.options.getUser('thirdplayer').id);
				}

				if (interaction.options.getUser('fourthplayer')) {
					team.push(interaction.options.getUser('fourthplayer').id);
				}

				//Cross check that commandUser.userId, teammates and opponents are all unique
				const allUsers = [...team];
				const everyUser = [];

				// Collect the star ratings to calculate the average & update the duel ratings for the users
				const starRatings = [];

				for (let i = 0; i < allUsers.length; i++) {
					let starRating = 4;
					let discordUser = null;

					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers');
					discordUser = await DBDiscordUsers.findOne({
						where: {
							userId: allUsers[i],
							osuVerified: true
						}
					});

					if (discordUser && discordUser.osuUserId) {
						everyUser.push(discordUser);
						if (!averageStarRating) {
							try {
								await interaction.editReply(`Processing Duel Rating for ${discordUser.osuName}...`);
								starRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
							} catch (e) {
								if (e !== 'No standard plays') {
									console.error(e);
								}
							}
							starRatings.push(starRating.total);
						} else {
							getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
						}
					} else {
						//TODO
						return await interaction.editReply(`<@${allUsers[i]}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using \`/osu-link connect username:<username>\`.`);
					}
				}

				if (!averageStarRating) {
					let totalStarRating = 0;
					for (let i = 0; i < starRatings.length; i++) {
						totalStarRating += starRatings[i];
					}
					averageStarRating = totalStarRating / starRatings.length;
				}

				let lowerBound = averageStarRating - 0.125;
				let upperBound = averageStarRating + 0.125;

				//Remove the users from the queue
				let existingQueueTasks = await DBProcessQueue.findAll({
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					for (let j = 0; j < everyUser.length; j++) {
						if (everyUser[j].osuUserId === osuUserId) {
							await existingQueueTasks[i].destroy();
							await interaction.followUp(`<@${everyUser[j].userId}> you have been removed from the queue for a 1v1 duel.`);
							break;
						}
					}
				}

				updateQueueChannels(interaction.client);

				createDuelMatch(additionalObjects[0], additionalObjects[1], interaction, averageStarRating, lowerBound, upperBound, bestOf, onlyRanked, everyUser);
			}
		}
	},
};
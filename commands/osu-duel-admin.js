const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const { logDatabaseQueries, getUserDuelStarRating, createDuelMatch, updateQueueChannels } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-duel-admin',
	description: 'Admin commands for osu-duel',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 60,
	tags: 'debug',
	data: new SlashCommandBuilder()
		.setName('osu-duel-admin')
		.setDescription('Admin commands for osu-duel')
		.setDMPermission(false)
		.setDefaultMemberPermissions('0')
		.addSubcommand(subcommand =>
			subcommand
				.setName('createduel1v1')
				.setDescription('Creates a duel match')
				.addUserOption(option =>
					option
						.setName('firstplayer')
						.setDescription('The first player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('secondplayer')
						.setDescription('The second player')
						.setRequired(true)
				)
				.addNumberOption(option =>
					option
						.setName('starrating')
						.setDescription('The star rating to play on')
				)
				.addIntegerOption(option =>
					option
						.setName('bestof')
						.setDescription('The best of')
						.addChoices(
							{ name: 'Best of 13', value: 13 },
							{ name: 'Best of 11', value: 11 },
							{ name: 'Best of 9', value: 9 },
							{ name: 'Best of 7 (Default)', value: 7 },
							{ name: 'Best of 5', value: 5 },
							{ name: 'Best of 3', value: 3 },
							{ name: 'Best of 1', value: 1 }
						)
				)
				.addBooleanOption(option =>
					option
						.setName('ranked')
						.setDescription('Should only ranked maps be played?')
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('createduel2v2')
				.setDescription('Creates a duel match')
				.addUserOption(option =>
					option
						.setName('firstplayer')
						.setDescription('The first player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('secondplayer')
						.setDescription('The second player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('thirdplayer')
						.setDescription('The third player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('fourthplayer')
						.setDescription('The fourth player')
						.setRequired(true)
				)
				.addNumberOption(option =>
					option
						.setName('starrating')
						.setDescription('The star rating to play on')
				)
				.addIntegerOption(option =>
					option
						.setName('bestof')
						.setDescription('The best of')
						.addChoices(
							{ name: 'Best of 13', value: 13 },
							{ name: 'Best of 11', value: 11 },
							{ name: 'Best of 9', value: 9 },
							{ name: 'Best of 7 (Default)', value: 7 },
							{ name: 'Best of 5', value: 5 },
							{ name: 'Best of 3', value: 3 },
							{ name: 'Best of 1', value: 1 }
						)
				)
				.addBooleanOption(option =>
					option
						.setName('ranked')
						.setDescription('Should only ranked maps be played?')
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('createduel3v3')
				.setDescription('Creates a duel match')
				.addUserOption(option =>
					option
						.setName('firstplayer')
						.setDescription('The first player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('secondplayer')
						.setDescription('The second player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('thirdplayer')
						.setDescription('The third player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('fourthplayer')
						.setDescription('The fourth player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('fifthplayer')
						.setDescription('The fifth player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('sixthplayer')
						.setDescription('The sixth player')
						.setRequired(true)
				)
				.addNumberOption(option =>
					option
						.setName('starrating')
						.setDescription('The star rating to play on')
				)
				.addIntegerOption(option =>
					option
						.setName('bestof')
						.setDescription('The best of')
						.addChoices(
							{ name: 'Best of 13', value: 13 },
							{ name: 'Best of 11', value: 11 },
							{ name: 'Best of 9', value: 9 },
							{ name: 'Best of 7 (Default)', value: 7 },
							{ name: 'Best of 5', value: 5 },
							{ name: 'Best of 3', value: 3 },
							{ name: 'Best of 1', value: 1 }
						)
				)
				.addBooleanOption(option =>
					option
						.setName('ranked')
						.setDescription('Should only ranked maps be played?')
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('createduel4v4')
				.setDescription('Creates a duel match')
				.addUserOption(option =>
					option
						.setName('firstplayer')
						.setDescription('The first player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('secondplayer')
						.setDescription('The second player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('thirdplayer')
						.setDescription('The third player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('fourthplayer')
						.setDescription('The fourth player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('fifthplayer')
						.setDescription('The fifth player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('sixthplayer')
						.setDescription('The sixth player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('seventhplayer')
						.setDescription('The seventh player')
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('eighthplayer')
						.setDescription('The eighth player')
						.setRequired(true)
				)
				.addNumberOption(option =>
					option
						.setName('starrating')
						.setDescription('The star rating to play on')
				)
				.addIntegerOption(option =>
					option
						.setName('bestof')
						.setDescription('The best of')
						.addChoices(
							{ name: 'Best of 13', value: 13 },
							{ name: 'Best of 11', value: 11 },
							{ name: 'Best of 9', value: 9 },
							{ name: 'Best of 7 (Default)', value: 7 },
							{ name: 'Best of 5', value: 5 },
							{ name: 'Best of 3', value: 3 },
							{ name: 'Best of 1', value: 1 }
						)
				)
				.addBooleanOption(option =>
					option
						.setName('ranked')
						.setDescription('Should only ranked maps be played?')
				)
		),
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction.options.getSubcommand() === 'createduel1v1' || interaction.options.getSubcommand() === 'createduel2v2' || interaction.options.getSubcommand() === 'createduel3v3') {
			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

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
			let players = [];

			if (interaction.options.getUser('firstplayer')) {
				players.push(interaction.options.getUser('firstplayer').id);
			}

			if (interaction.options.getUser('secondplayer')) {
				players.push(interaction.options.getUser('secondplayer').id);
			}

			if (interaction.options.getUser('thirdplayer')) {
				players.push(interaction.options.getUser('thirdplayer').id);
			}

			if (interaction.options.getUser('fourthplayer')) {
				players.push(interaction.options.getUser('fourthplayer').id);
			}

			if (interaction.options.getUser('fifthplayer')) {
				players.push(interaction.options.getUser('fifthplayer').id);
			}

			if (interaction.options.getUser('sixthplayer')) {
				players.push(interaction.options.getUser('sixthplayer').id);
			}

			//Cross check that commandUser.userId, teammates and opponents are all unique
			const allUsers = [...players];
			const everyUser = [];

			// Collect the star ratings to calculate the average & update the duel ratings for the users
			const starRatings = [];

			for (let i = 0; i < allUsers.length; i++) {
				let starRating = 4;
				let discordUser = null;

				//TODO: Attributes
				logDatabaseQueries(4, 'commands/osu-duel-admin.js DBDiscordUsers');
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
					return await interaction.editReply(`<@${allUsers[i]}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
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
			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-duel-admin.js DBProcessQueue');
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
	},
};
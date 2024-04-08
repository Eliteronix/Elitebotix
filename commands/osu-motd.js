const { DBDiscordUsers, DBOsuBeatmaps, DBOsuMultiGameScores } = require('../dbObjects');
const { populateMsgFromInteraction, getOsuBeatmap, pause, logDatabaseQueries, logOsuAPICalls } = require('../utils');
const Discord = require('discord.js');
const osu = require('node-osu');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'osu-motd',
	description: 'Allows you to join the \'Maps of the Day\' competition!',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 10,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-motd')
		.setNameLocalizations({
			'de': 'osu-motd',
			'en-GB': 'osu-motd',
			'en-US': 'osu-motd',
		})
		.setDescription('Allows you to join the \'Maps of the Day\' competition!')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, an dem \'Maps of the Day\'-Turnier teilzunehmen!',
			'en-GB': 'Allows you to join the \'Maps of the Day\' competition!',
			'en-US': 'Allows you to join the \'Maps of the Day\' competition!',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('custom-fixed-players')
				.setNameLocalizations({
					'de': 'benutzerdefiniert-feste-spieler',
					'en-GB': 'custom-fixed-players',
					'en-US': 'custom-fixed-players',
				})
				.setDescription('Create a custom MOTD sort of competition with a fixed player list')
				.setDescriptionLocalizations({
					'de': 'Erstelle eine benutzerdefinierte MOTD Art Turnier mit einer festen Spielerliste',
					'en-GB': 'Create a custom MOTD sort of competition with a fixed player list',
					'en-US': 'Create a custom MOTD sort of competition with a fixed player list',
				})
				.addIntegerOption(option =>
					option
						.setName('lowerstars')
						.setNameLocalizations({
							'de': 'unteresternegrenze',
							'en-GB': 'lowerstars',
							'en-US': 'lowerstars',
						})
						.setDescription('The lower star rating limit for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die untere Sternegrenze für die benutzerdefinierte Lobby',
							'en-GB': 'The lower star rating limit for the custom lobby',
							'en-US': 'The lower star rating limit for the custom lobby',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('higherstars')
						.setNameLocalizations({
							'de': 'oberesternegrenze',
							'en-GB': 'higherstars',
							'en-US': 'higherstars',
						})
						.setDescription('The higher star rating limit for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die obere Sternegrenze für die benutzerdefinierte Lobby',
							'en-GB': 'The higher star rating limit for the custom lobby',
							'en-US': 'The higher star rating limit for the custom lobby',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('scoreversion')
						.setNameLocalizations({
							'de': 'scoreversion',
							'en-GB': 'scoreversion',
							'en-US': 'scoreversion',
						})
						.setDescription('The score version for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die Score Version für die benutzerdefinierte Lobby',
							'en-GB': 'The score version for the custom lobby',
							'en-US': 'The score version for the custom lobby',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Score v1', value: '0' },
							{ name: 'Score v2', value: '3' },
						)
				)
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('username2')
						.setNameLocalizations({
							'de': 'nutzername2',
							'en-GB': 'username2',
							'en-US': 'username2',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('username3')
						.setNameLocalizations({
							'de': 'nutzername3',
							'en-GB': 'username3',
							'en-US': 'username3',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username4')
						.setNameLocalizations({
							'de': 'nutzername4',
							'en-GB': 'username4',
							'en-US': 'username4',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username5')
						.setNameLocalizations({
							'de': 'nutzername5',
							'en-GB': 'username5',
							'en-US': 'username5',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username6')
						.setNameLocalizations({
							'de': 'nutzername6',
							'en-GB': 'username6',
							'en-US': 'username6',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username7')
						.setNameLocalizations({
							'de': 'nutzername7',
							'en-GB': 'username7',
							'en-US': 'username7',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username8')
						.setNameLocalizations({
							'de': 'nutzername8',
							'en-GB': 'username8',
							'en-US': 'username8',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username9')
						.setNameLocalizations({
							'de': 'nutzername9',
							'en-GB': 'username9',
							'en-US': 'username9',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username10')
						.setNameLocalizations({
							'de': 'nutzername10',
							'en-GB': 'username10',
							'en-US': 'username10',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username11')
						.setNameLocalizations({
							'de': 'nutzername11',
							'en-GB': 'username11',
							'en-US': 'username11',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username12')
						.setNameLocalizations({
							'de': 'nutzername12',
							'en-GB': 'username12',
							'en-US': 'username12',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username13')
						.setNameLocalizations({
							'de': 'nutzername13',
							'en-GB': 'username13',
							'en-US': 'username13',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username14')
						.setNameLocalizations({
							'de': 'nutzername14',
							'en-GB': 'username14',
							'en-US': 'username14',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username15')
						.setNameLocalizations({
							'de': 'nutzername15',
							'en-GB': 'username15',
							'en-US': 'username15',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('username16')
						.setNameLocalizations({
							'de': 'nutzername16',
							'en-GB': 'username16',
							'en-US': 'username16',
						})
						.setDescription('The username, id or link of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link des Spielers',
							'en-GB': 'The username, id or link of the player',
							'en-US': 'The username, id or link of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('mappool')
						.setNameLocalizations({
							'de': 'mappool',
							'en-GB': 'mappool',
							'en-US': 'mappool',
						})
						.setDescription('The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'')
						.setDescriptionLocalizations({
							'de': 'Die IDs oder Links der Beatmaps in diesem Format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
							'en-GB': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
							'en-US': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('custom-react-to-play')
				.setNameLocalizations({
					'de': 'custom-reagiere-zum-spielen',
					'en-GB': 'custom-react-to-play',
					'en-US': 'custom-react-to-play',
				})
				.setDescription('Create a custom MOTD sort of competition where players can react to join')
				.setDescriptionLocalizations({
					'de': 'Erstellen Sie ein custom MOTD-Art von Turnier, bei dem Spieler reagieren können, um beizutreten',
					'en-GB': 'Create a custom MOTD sort of competition where players can react to join',
					'en-US': 'Create a custom MOTD sort of competition where players can react to join',
				})
				.addIntegerOption(option =>
					option
						.setName('lowerstars')
						.setNameLocalizations({
							'de': 'unteresternegrenze',
							'en-GB': 'lowerstars',
							'en-US': 'lowerstars',
						})
						.setDescription('The lower star rating limit for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die untere Sternegrenze für die benutzerdefinierte Lobby',
							'en-GB': 'The lower star rating limit for the custom lobby',
							'en-US': 'The lower star rating limit for the custom lobby',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('higherstars')
						.setNameLocalizations({
							'de': 'oberesternegrenze',
							'en-GB': 'higherstars',
							'en-US': 'higherstars',
						})
						.setDescription('The higher star rating limit for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die obere Sternegrenze für die benutzerdefinierte Lobby',
							'en-GB': 'The higher star rating limit for the custom lobby',
							'en-US': 'The higher star rating limit for the custom lobby',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('scoreversion')
						.setNameLocalizations({
							'de': 'scoreversion',
							'en-GB': 'scoreversion',
							'en-US': 'scoreversion',
						})
						.setDescription('The score version for the custom lobby')
						.setDescriptionLocalizations({
							'de': 'Die Score Version für die benutzerdefinierte Lobby',
							'en-GB': 'The score version for the custom lobby',
							'en-US': 'The score version for the custom lobby',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Score v1', value: '0' },
							{ name: 'Score v2', value: '3' },
						)
				)
				.addStringOption(option =>
					option
						.setName('mappool')
						.setNameLocalizations({
							'de': 'mappool',
							'en-GB': 'mappool',
							'en-US': 'mappool',
						})
						.setDescription('The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'')
						.setDescriptionLocalizations({
							'de': 'Die IDs oder Links der Beatmaps in diesem Format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
							'en-GB': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
							'en-US': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
						})
						.setRequired(false)
				)
		),
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		let lowerStarLimit = 0;
		let higherStarLimit = 10;
		let scoreversion = 0;
		let mappool = null;

		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options.getSubcommand()];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'lowerstars') {
					lowerStarLimit = parseFloat(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'higherstars') {
					higherStarLimit = parseFloat(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'scoreversion') {
					scoreversion = parseFloat(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'mappool') {
					mappool = interaction.options._hoistedOptions[i].value.split(',');
				} else {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}

			//Set lower star limit to 0 if it lower than 0
			if (lowerStarLimit < 0) {
				lowerStarLimit = 0;
			}

			//Set lower star limit to 10 if it higher than 10
			if (higherStarLimit > 10) {
				higherStarLimit = 10;
			}

			//Set higher star limit to 0 if it lower than 0
			if (higherStarLimit < 0) {
				higherStarLimit = 0;
			}

			//Set higher star limit to 10 if it higher than 10
			if (higherStarLimit > 10) {
				higherStarLimit = 10;
			}

			//Swap lower and higher star limits if they're the wrong way around
			if ((interaction.options.getSubcommand() === 'custom-fixed-players' || interaction.options.getSubcommand() === 'custom-react-to-play') && lowerStarLimit > higherStarLimit) {
				[lowerStarLimit, higherStarLimit] = [higherStarLimit, lowerStarLimit];
			}

			if (interaction.options.getSubcommand() === 'custom-fixed-players' || interaction.options.getSubcommand() === 'custom-react-to-play') {
				//Defer the interaction
				await interaction.deferReply();
			}

			if (mappool) {
				for (let i = 0; i < mappool.length; i++) {
					if (i === 3 || i === 7) {
						mappool[i] = await getOsuBeatmap({ beatmapId: mappool[i].trim(), modBits: 64 });
					} else {
						mappool[i] = await getOsuBeatmap({ beatmapId: mappool[i].trim(), modBits: 0 });
					}

					mappool[i] = {
						id: mappool[i].beatmapId,
						beatmapSetId: mappool[i].beatmapsetId,
						title: mappool[i].title,
						creator: mappool[i].mapper,
						version: mappool[i].difficulty,
						artist: mappool[i].artist,
						rating: mappool[i].userRating,
						bpm: mappool[i].bpm,
						mode: mappool[i].mode,
						approvalStatus: mappool[i].approvalStatus,
						maxCombo: mappool[i].maxCombo,
						objects: {
							normal: mappool[i].circles,
							slider: mappool[i].sliders,
							spinner: mappool[i].spinners
						},
						difficulty: {
							rating: mappool[i].starRating,
							aim: mappool[i].aimRating,
							speed: mappool[i].speedRating,
							size: mappool[i].circleSize,
							overall: mappool[i].overallDifficulty,
							approach: mappool[i].approachRate,
							drain: mappool[i].hpDrain
						},
						length: {
							total: mappool[i].totalLength,
							drain: mappool[i].drainLength
						}
					};
				}

				if (mappool.length !== 10) {
					return await interaction.editReply('You need to provide exactly 10 maps if you want to use a custom mappool!');
				}
			}
		}


		if (args[0].toLowerCase() === 'custom-fixed-players') {
			//Return if its not triggered by a slash command
			if (msg.id) {
				return msg.reply(`Please use </osu-motd custom-fixed-players:${msg.client.slashCommandData.find(command => command.name === 'osu-motd').id}> to set up the custom MOTD`);
			}
			args.shift();

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			//Get all players from the osu! api and store them in the players array
			let players = [];
			let playersNotFound = [];
			for (let i = 0; i < args.length; i++) {
				logOsuAPICalls('commands/osu-motd.js custom-fixed-players getUser');
				let player = await osuApi.getUser({ u: args[i] });
				if (player) {
					players.push(player);
				} else {
					playersNotFound.push(args[i]);
				}
			}

			//Return if at least one player wasn't found
			if (playersNotFound.length > 0) {
				return await interaction.editReply(`The following players were not found: ${playersNotFound.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Check if there are any duplicate players
			let duplicatePlayers = [];
			for (let i = 0; i < players.length; i++) {
				for (let j = i + 1; j < players.length; j++) {
					if (players[i].id === players[j].id) {
						duplicatePlayers.push(players[i].name);
					}
				}
			}

			//Return if there are any duplicate players
			if (duplicatePlayers.length > 0) {
				return await interaction.editReply(`The following players have been mentioned multiple times: ${duplicatePlayers.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Get the related discordUser from the db for each player
			let discordUsers = [];
			let playersNotConnected = [];

			for (let i = 0; i < players.length; i++) {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/osu-motd.js DBDiscordUsers 5');
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						userId: {
							[Op.not]: null
						},
						osuUserId: players[i].id
					},
				});

				if (discordUser) {
					discordUsers.push(discordUser);
				} else {
					playersNotConnected.push(players[i].name);
				}
			}

			//Return if at least one player isn't connected to the bot
			if (playersNotConnected.length > 0) {
				return await interaction.editReply(`The following players are not connected to the bot: ${playersNotConnected.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Get the related user on discord for each discorduser
			let users = [];
			let unreachableUsers = [];

			for (let i = 0; i < discordUsers.length; i++) {
				let member = interaction.guild.members.cache.get(discordUsers[i].userId);

				let iterator = 0;
				while (!member && iterator < 3) {
					iterator++;
					try {
						member = await interaction.guild.members.fetch({ user: [discordUsers[i].userId], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});

						member = member.first();
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('commands/osu-motd.js | Get members for custom-fixed-players', e);
							return;
						}
					}
				}

				if (member) {
					users.push(member);
				} else {
					unreachableUsers.push(discordUsers[i].userId);
				}
			}

			//Return if at least one user isn't reachable
			if (unreachableUsers.length > 0) {
				return await interaction.editReply(`The following users are not reachable: ${unreachableUsers.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Push the chosen maps in correct order
			const mappoolInOrder = [];

			if (mappool) {
				for (let i = 0; i < mappool.length; i++) {
					mappoolInOrder.push(mappool[i]);
					if (i === 0) {
						mappoolInOrder.push(mappool[i]);
					}
				}
			} else {
				//Get the amount of Maps in the DB
				let amountOfMapsInDB = -1;

				while (amountOfMapsInDB === -1) {
					logOsuAPICalls('commands/osu-motd.js custom-fixed-players getBeatmaps');
					const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

					const dbBeatmap = await getOsuBeatmap({ beatmapId: mostRecentBeatmap[0].id, modBits: 0 });

					if (dbBeatmap) {
						amountOfMapsInDB = dbBeatmap.id;
					}
				}

				//Fill a Nomod map array with random tourney maps from the db
				//More maps than needed to get a better distribution
				let nomodMaps = [];
				let backupBeatmapIds = [];
				let i = 0;
				while (nomodMaps.length < 30) {

					let beatmap = null;
					while (!beatmap) {
						i++;
						const index = Math.floor(Math.random() * amountOfMapsInDB);

						//TODO: add attributes and logdatabasequeries
						logDatabaseQueries(4, 'commands/osu-motd.js DBOsuBeatmaps 1');
						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
							&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
							&& (dbBeatmap.mods === 0 || dbBeatmap.mods === 1)
							&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
							backupBeatmapIds.push(dbBeatmap.beatmapId);
							//TODO: add attributes and logdatabasequeries
							logDatabaseQueries(4, 'commands/osu-motd.js DBOsuMultiGameScores 1');
							const multiScores = await DBOsuMultiGameScores.findAll({
								where: {
									tourneyMatch: true,
									beatmapId: dbBeatmap.beatmapId,
									warmup: {
										[Op.not]: true
									}
								}
							});

							let onlyMOTD = true;
							for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
								if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
									onlyMOTD = false;
								}
							}

							if (!onlyMOTD) {
								beatmap = {
									id: dbBeatmap.beatmapId,
									beatmapSetId: dbBeatmap.beatmapsetId,
									title: dbBeatmap.title,
									creator: dbBeatmap.mapper,
									version: dbBeatmap.difficulty,
									artist: dbBeatmap.artist,
									rating: dbBeatmap.userRating,
									bpm: dbBeatmap.bpm,
									mode: dbBeatmap.mode,
									approvalStatus: dbBeatmap.approvalStatus,
									maxCombo: dbBeatmap.maxCombo,
									objects: {
										normal: dbBeatmap.circles,
										slider: dbBeatmap.sliders,
										spinner: dbBeatmap.spinners
									},
									difficulty: {
										rating: dbBeatmap.starRating,
										aim: dbBeatmap.aimRating,
										speed: dbBeatmap.speedRating,
										size: dbBeatmap.circleSize,
										overall: dbBeatmap.overallDifficulty,
										approach: dbBeatmap.approachRate,
										drain: dbBeatmap.hpDrain
									},
									length: {
										total: dbBeatmap.totalLength,
										drain: dbBeatmap.drainLength
									}
								};
							}
						}
					}

					nomodMaps.push(beatmap);
				}

				nomodMaps.sort((a, b) => parseFloat(a.difficulty.rating) - parseFloat(b.difficulty.rating));

				//Remove maps if more than enough to make it scale better
				while (nomodMaps.length > 9) {
					if (Math.round(nomodMaps[0].difficulty.rating * 100) / 100 < 4) {
						nomodMaps.splice(0, 1);
					} else {
						//Set initial object
						let smallestGap = {
							index: 1,
							gap: nomodMaps[2].difficulty.rating - nomodMaps[0].difficulty.rating,
						};

						//start at 2 because the first gap is already in initial object
						//Skip 0 and the end to avoid out of bounds exception
						for (let i = 2; i < nomodMaps.length - 1; i++) {
							if (smallestGap.gap > nomodMaps[i + 1].difficulty.rating - nomodMaps[i - 1].difficulty.rating) {
								smallestGap.gap = nomodMaps[i + 1].difficulty.rating - nomodMaps[i - 1].difficulty.rating;
								smallestGap.index = i;
							}
						}

						//Remove the map that causes the smallest gap
						nomodMaps.splice(smallestGap.index, 1);
					}
				}

				//Fill a DoubleTime map array with 50 random tourney maps from the db
				let doubleTimeMaps = [];

				backupBeatmapIds = [];

				i = 0;
				while (doubleTimeMaps.length < 50) {

					let beatmap = null;
					while (!beatmap) {
						i++;

						const index = Math.floor(Math.random() * amountOfMapsInDB);

						//TODO: add attributes and logdatabasequeries
						logDatabaseQueries(4, 'commands/osu-motd.js DBOsuBeatmaps 2');
						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
							&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
							&& (dbBeatmap.mods === 64 || dbBeatmap.mods === 65)
							&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
							backupBeatmapIds.push(dbBeatmap.beatmapId);
							//TODO: add attributes and logdatabasequeries
							logDatabaseQueries(4, 'commands/osu-motd.js DBOsuMultiGameScores 2');
							const multiScores = await DBOsuMultiGameScores.findAll({
								where: {
									tourneyMatch: true,
									beatmapId: dbBeatmap.beatmapId,
									warmup: {
										[Op.not]: true
									}
								}
							});

							let onlyMOTD = true;
							for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
								if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
									onlyMOTD = false;
								}
							}

							if (!onlyMOTD) {
								beatmap = {
									id: dbBeatmap.beatmapId,
									beatmapSetId: dbBeatmap.beatmapsetId,
									title: dbBeatmap.title,
									creator: dbBeatmap.mapper,
									version: dbBeatmap.difficulty,
									artist: dbBeatmap.artist,
									rating: dbBeatmap.userRating,
									bpm: dbBeatmap.bpm,
									mode: dbBeatmap.mode,
									approvalStatus: dbBeatmap.approvalStatus,
									maxCombo: dbBeatmap.maxCombo,
									objects: {
										normal: dbBeatmap.circles,
										slider: dbBeatmap.sliders,
										spinner: dbBeatmap.spinners
									},
									difficulty: {
										rating: dbBeatmap.starRating,
										aim: dbBeatmap.aimRating,
										speed: dbBeatmap.speedRating,
										size: dbBeatmap.circleSize,
										overall: dbBeatmap.overallDifficulty,
										approach: dbBeatmap.approachRate,
										drain: dbBeatmap.hpDrain
									},
									length: {
										total: dbBeatmap.totalLength,
										drain: dbBeatmap.drainLength
									}
								};
							}
						}
					}

					doubleTimeMaps.push(beatmap);
				}

				doubleTimeMaps.sort((a, b) => parseFloat(a.difficulty.rating) - parseFloat(b.difficulty.rating));

				// Max 16 players join the lobby
				//Push first map twice to simulate the qualifier map existing
				mappoolInOrder.push(nomodMaps[0]);
				// First map 16 -> 14
				mappoolInOrder.push(nomodMaps[0]);
				// Second map 14 -> 12
				mappoolInOrder.push(nomodMaps[1]);
				// Third map 12 -> 10
				mappoolInOrder.push(nomodMaps[2]);
				// Fourth map (DT) 10 -> 8  -> Between difficulty of third and fifth
				const firstDTDifficulty = (parseFloat(nomodMaps[3].difficulty.rating) + parseFloat(nomodMaps[2].difficulty.rating)) / 2;
				let mapUsedIndex = 0;
				let firstDTMap = doubleTimeMaps[0];
				for (let i = 1; i < doubleTimeMaps.length; i++) {
					if (Math.abs(firstDTMap.difficulty.rating - firstDTDifficulty) > Math.abs(doubleTimeMaps[i].difficulty.rating - firstDTDifficulty)) {
						firstDTMap = doubleTimeMaps[i];
						mapUsedIndex = i;
					}
				}
				doubleTimeMaps.splice(mapUsedIndex, 1);

				mappoolInOrder.push(firstDTMap);
				// Fifth map 8 -> 6
				mappoolInOrder.push(nomodMaps[3]);
				// Sixth map 6 -> 5
				mappoolInOrder.push(nomodMaps[4]);
				// Seventh map 5 -> 4
				mappoolInOrder.push(nomodMaps[5]);
				// Eigth map (DT) 4 -> 3  -> Between difficulty of seventh and eigth
				const secondDTDifficulty = (parseFloat(nomodMaps[5].difficulty.rating) + parseFloat(nomodMaps[6].difficulty.rating)) / 2;
				let secondDTMap = doubleTimeMaps[0];
				for (let i = 1; i < doubleTimeMaps.length; i++) {
					if (Math.abs(secondDTMap.difficulty.rating - secondDTDifficulty) > Math.abs(doubleTimeMaps[i].difficulty.rating - secondDTDifficulty)) {
						secondDTMap = doubleTimeMaps[i];
					}
				}
				mappoolInOrder.push(secondDTMap);
				// Ninth map 3 -> 2
				mappoolInOrder.push(nomodMaps[6]);
				// 10th map 2 -> 1
				mappoolInOrder.push(nomodMaps[7]);
			}

			let mappoolLength = 0;
			let gameLength = 0;

			//Calculate match times
			for (let i = 0; i < mappoolInOrder.length; i++) {
				if (!(i === 0 && players.length < 17)) {
					mappoolLength = mappoolLength + parseInt(mappoolInOrder[i].length.total);
					if (i === 0) {
						gameLength = gameLength + 600;
					} else {
						gameLength = gameLength + 120 + parseInt(mappoolInOrder[i].length.total);
					}
				}
			}

			//Prepare official mappool message
			const mappoolEmbed = new Discord.EmbedBuilder()
				.setColor('#C45686')
				.setTitle('Custom MOTD settings')
				.setFooter({ text: `Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}` });

			for (let i = 0; i < players.length; i++) {
				mappoolEmbed.addFields([{ name: `Player #${i + 1}`, value: `${players[i].name} | #${players[i].pp.rank}`, inline: true }]);
			}

			for (let i = 1; i < mappoolInOrder.length; i++) {
				let mapPrefix = '';
				if (i === 4 || i === 8) {
					mapPrefix = `Knockout #${i} (DT):`;
				} else {
					mapPrefix = `Knockout #${i}:`;
				}
				const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
				const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
				mappoolEmbed.addFields([{ name: embedName, value: embedValue }]);
			}

			await interaction.editReply({ embeds: [mappoolEmbed] });

			//Start the knockout lobby
			const { knockoutLobby } = require('../MOTD/knockoutLobby.js');
			knockoutLobby(additionalObjects[0], additionalObjects[1], 'Knockout', mappoolInOrder, 'custom', discordUsers, users, true, scoreversion);
		} else if (args[0].toLowerCase() === 'custom-react-to-play') {
			//Return if its not triggered by a slash command
			if (msg.id) {
				return msg.reply(`Please use </osu-motd custom-react-to-play:${msg.client.slashCommandData.find(command => command.name === 'osu-motd').id}> to set up the custom MOTD.`);
			}

			//Return if triggered in DMs
			if (msg.channel.type === Discord.ChannelType.DM) {
				return msg.reply(`Please use </osu-motd custom-react-to-play:${msg.client.slashCommandData.find(command => command.name === 'osu-motd').id}> in a server to set up the custom MOTD.`);
			}

			args.shift();

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			//Push the chosen maps in correct order
			const mappoolInOrder = [];

			if (mappool) {
				for (let i = 0; i < mappool.length; i++) {
					mappoolInOrder.push(mappool[i]);
					if (i === 0) {
						mappoolInOrder.push(mappool[i]);
					}
				}
			} else {
				//Get the amount of Maps in the DB
				let amountOfMapsInDB = -1;

				while (amountOfMapsInDB === -1) {
					logOsuAPICalls('commands/osu-motd.js custom-react-to-play');
					const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

					const dbBeatmap = await getOsuBeatmap({ beatmapId: mostRecentBeatmap[0].id, modBits: 0 });

					if (dbBeatmap) {
						amountOfMapsInDB = dbBeatmap.id;
					}
				}

				//Fill a Nomod map array with random tourney maps from the db
				//More maps than needed to get a better distribution
				let nomodMaps = [];
				let backupBeatmapIds = [];
				let i = 0;
				while (nomodMaps.length < 30) {

					let beatmap = null;
					while (!beatmap) {
						i++;
						const index = Math.floor(Math.random() * amountOfMapsInDB);

						//TODO: add attributes and logdatabasequeries
						logDatabaseQueries(4, 'commands/osu-motd.js DBOsuBeatmaps 3');
						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
							&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
							&& (dbBeatmap.mods === 0 || dbBeatmap.mods === 1)
							&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
							backupBeatmapIds.push(dbBeatmap.beatmapId);
							//TODO: add attributes and logdatabasequeries
							logDatabaseQueries(4, 'commands/osu-motd.js DBOsuMultiGameScores 3');
							const multiScores = await DBOsuMultiGameScores.findAll({
								where: {
									tourneyMatch: true,
									beatmapId: dbBeatmap.beatmapId,
									warmup: {
										[Op.not]: true
									}
								}
							});

							let onlyMOTD = true;
							for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
								if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
									onlyMOTD = false;
								}
							}

							if (!onlyMOTD) {
								beatmap = {
									id: dbBeatmap.beatmapId,
									beatmapSetId: dbBeatmap.beatmapsetId,
									title: dbBeatmap.title,
									creator: dbBeatmap.mapper,
									version: dbBeatmap.difficulty,
									artist: dbBeatmap.artist,
									rating: dbBeatmap.userRating,
									bpm: dbBeatmap.bpm,
									mode: dbBeatmap.mode,
									approvalStatus: dbBeatmap.approvalStatus,
									maxCombo: dbBeatmap.maxCombo,
									objects: {
										normal: dbBeatmap.circles,
										slider: dbBeatmap.sliders,
										spinner: dbBeatmap.spinners
									},
									difficulty: {
										rating: dbBeatmap.starRating,
										aim: dbBeatmap.aimRating,
										speed: dbBeatmap.speedRating,
										size: dbBeatmap.circleSize,
										overall: dbBeatmap.overallDifficulty,
										approach: dbBeatmap.approachRate,
										drain: dbBeatmap.hpDrain
									},
									length: {
										total: dbBeatmap.totalLength,
										drain: dbBeatmap.drainLength
									}
								};
							}
						}
					}

					nomodMaps.push(beatmap);
				}

				nomodMaps.sort((a, b) => parseFloat(a.difficulty.rating) - parseFloat(b.difficulty.rating));

				//Remove maps if more than enough to make it scale better
				while (nomodMaps.length > 9) {
					if (Math.round(nomodMaps[0].difficulty.rating * 100) / 100 < 4) {
						nomodMaps.splice(0, 1);
					} else {
						//Set initial object
						let smallestGap = {
							index: 1,
							gap: nomodMaps[2].difficulty.rating - nomodMaps[0].difficulty.rating,
						};

						//start at 2 because the first gap is already in initial object
						//Skip 0 and the end to avoid out of bounds exception
						for (let i = 2; i < nomodMaps.length - 1; i++) {
							if (smallestGap.gap > nomodMaps[i + 1].difficulty.rating - nomodMaps[i - 1].difficulty.rating) {
								smallestGap.gap = nomodMaps[i + 1].difficulty.rating - nomodMaps[i - 1].difficulty.rating;
								smallestGap.index = i;
							}
						}

						//Remove the map that causes the smallest gap
						nomodMaps.splice(smallestGap.index, 1);
					}
				}

				//Fill a DoubleTime map array with 50 random tourney maps from the db
				let doubleTimeMaps = [];

				backupBeatmapIds = [];

				i = 0;
				while (doubleTimeMaps.length < 50) {

					let beatmap = null;
					while (!beatmap) {
						i++;

						const index = Math.floor(Math.random() * amountOfMapsInDB);

						//TODO: add attributes and logdatabasequeries
						logDatabaseQueries(4, 'commands/osu-motd.js DBOsuBeatmaps 4');
						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
							&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
							&& (dbBeatmap.mods === 64 || dbBeatmap.mods === 65)
							&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
							backupBeatmapIds.push(dbBeatmap.beatmapId);
							//TODO: add attributes and logdatabasequeries
							logDatabaseQueries(4, 'commands/osu-motd.js DBOsuMultiGameScores 4');
							const multiScores = await DBOsuMultiGameScores.findAll({
								where: {
									tourneyMatch: true,
									beatmapId: dbBeatmap.beatmapId,
									warmup: {
										[Op.not]: true
									}
								}
							});

							let onlyMOTD = true;
							for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
								if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
									onlyMOTD = false;
								}
							}

							if (!onlyMOTD) {
								beatmap = {
									id: dbBeatmap.beatmapId,
									beatmapSetId: dbBeatmap.beatmapsetId,
									title: dbBeatmap.title,
									creator: dbBeatmap.mapper,
									version: dbBeatmap.difficulty,
									artist: dbBeatmap.artist,
									rating: dbBeatmap.userRating,
									bpm: dbBeatmap.bpm,
									mode: dbBeatmap.mode,
									approvalStatus: dbBeatmap.approvalStatus,
									maxCombo: dbBeatmap.maxCombo,
									objects: {
										normal: dbBeatmap.circles,
										slider: dbBeatmap.sliders,
										spinner: dbBeatmap.spinners
									},
									difficulty: {
										rating: dbBeatmap.starRating,
										aim: dbBeatmap.aimRating,
										speed: dbBeatmap.speedRating,
										size: dbBeatmap.circleSize,
										overall: dbBeatmap.overallDifficulty,
										approach: dbBeatmap.approachRate,
										drain: dbBeatmap.hpDrain
									},
									length: {
										total: dbBeatmap.totalLength,
										drain: dbBeatmap.drainLength
									}
								};
							}
						}
					}

					doubleTimeMaps.push(beatmap);
				}

				doubleTimeMaps.sort((a, b) => parseFloat(a.difficulty.rating) - parseFloat(b.difficulty.rating));

				// Max 16 players join the lobby
				//Push first map twice to simulate the qualifier map existing
				mappoolInOrder.push(nomodMaps[0]);
				// First map 16 -> 14
				mappoolInOrder.push(nomodMaps[0]);
				// Second map 14 -> 12
				mappoolInOrder.push(nomodMaps[1]);
				// Third map 12 -> 10
				mappoolInOrder.push(nomodMaps[2]);
				// Fourth map (DT) 10 -> 8  -> Between difficulty of third and fifth
				const firstDTDifficulty = (parseFloat(nomodMaps[3].difficulty.rating) + parseFloat(nomodMaps[2].difficulty.rating)) / 2;
				let mapUsedIndex = 0;
				let firstDTMap = doubleTimeMaps[0];
				for (let i = 1; i < doubleTimeMaps.length; i++) {
					if (Math.abs(firstDTMap.difficulty.rating - firstDTDifficulty) > Math.abs(doubleTimeMaps[i].difficulty.rating - firstDTDifficulty)) {
						firstDTMap = doubleTimeMaps[i];
						mapUsedIndex = i;
					}
				}
				doubleTimeMaps.splice(mapUsedIndex, 1);

				mappoolInOrder.push(firstDTMap);
				// Fifth map 8 -> 6
				mappoolInOrder.push(nomodMaps[3]);
				// Sixth map 6 -> 5
				mappoolInOrder.push(nomodMaps[4]);
				// Seventh map 5 -> 4
				mappoolInOrder.push(nomodMaps[5]);
				// Eigth map (DT) 4 -> 3  -> Between difficulty of seventh and eigth
				const secondDTDifficulty = (parseFloat(nomodMaps[5].difficulty.rating) + parseFloat(nomodMaps[6].difficulty.rating)) / 2;
				let secondDTMap = doubleTimeMaps[0];
				for (let i = 1; i < doubleTimeMaps.length; i++) {
					if (Math.abs(secondDTMap.difficulty.rating - secondDTDifficulty) > Math.abs(doubleTimeMaps[i].difficulty.rating - secondDTDifficulty)) {
						secondDTMap = doubleTimeMaps[i];
					}
				}
				mappoolInOrder.push(secondDTMap);
				// Ninth map 3 -> 2
				mappoolInOrder.push(nomodMaps[6]);
				// 10th map 2 -> 1
				mappoolInOrder.push(nomodMaps[7]);
			}

			let mappoolLength = 0;
			let gameLength = 0;

			//Calculate match times
			for (let i = 0; i < mappoolInOrder.length; i++) {
				if (i !== 0) {
					mappoolLength = mappoolLength + parseInt(mappoolInOrder[i].length.total);
					gameLength = gameLength + 120 + parseInt(mappoolInOrder[i].length.total);
				}
			}

			//Prepare official mappool message
			const mappoolEmbed = new Discord.EmbedBuilder()
				.setColor('#C45686')
				.setTitle('Custom MOTD settings')
				.setDescription('Sign up by reacting with ✅ in the next 2 minutes')
				.setFooter({ text: `Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}` });

			for (let i = 1; i < mappoolInOrder.length; i++) {
				let mapPrefix = '';
				if (i === 4 || i === 8) {
					mapPrefix = `Knockout #${i} (DT):`;
				} else {
					mapPrefix = `Knockout #${i}:`;
				}
				const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
				const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
				mappoolEmbed.addFields([{ name: embedName, value: embedValue }]);
			}

			let embedMessage = await interaction.editReply({ embeds: [mappoolEmbed] });
			//Handle reactions
			await embedMessage.react('✅');
			let discordUsers = [];
			let users = [];
			let discordUserIds = [];

			const filter = (reaction, user) => {
				return reaction.emoji.name === '✅' && !discordUserIds.includes(user.id) && user.id !== additionalObjects[0].user.id && discordUsers.length < 16;
			};

			const collector = embedMessage.createReactionCollector({ filter, time: 120000, max: 16 });

			collector.on('collect', async (reaction, user) => {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/osu-motd.js DBDiscordUsers 6');
				const dbDiscordUser = await DBDiscordUsers.findOne({
					where: { userId: user.id }
				});
				if (dbDiscordUser && dbDiscordUser.osuUserId && dbDiscordUser.osuVerified) {
					discordUsers.push(dbDiscordUser);
					users.push(user);
					discordUserIds.push(user.id);

					//Edit embed
					const mappoolEmbed = new Discord.EmbedBuilder()
						.setColor('#C45686')
						.setTitle('Custom MOTD settings')
						.setDescription('Sign up by reacting with ✅ in the next 2 minutes')
						.setFooter({ text: `Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}` });

					for (let i = 0; i < discordUsers.length; i++) {
						mappoolEmbed.addFields([{ name: `Player #${i + 1}`, value: `${discordUsers[i].osuName} | #${discordUsers[i].osuRank}`, inline: true }]);
					}

					for (let i = 1; i < mappoolInOrder.length; i++) {
						let mapPrefix = '';
						if (i === 4 || i === 8) {
							mapPrefix = `Knockout #${i} (DT):`;
						} else {
							mapPrefix = `Knockout #${i}:`;
						}
						const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
						const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
						mappoolEmbed.addFields([{ name: embedName, value: embedValue }]);
					}

					await interaction.editReply({ embeds: [mappoolEmbed] });
				} else {
					reaction.users.remove(user.id);
					let hintMessage = await embedMessage.channel.send(`It seems like you don't have your account connected and verified to the bot <@${user.id}>.\nPlease do so by using </osu-link connect:${embedMessage.client.slashCommandData.find(command => command.name === 'osu-link').id}> and try again.`);
					await pause(10000);
					hintMessage.delete();
				}
			});

			collector.on('end', async () => {
				embedMessage.reactions.removeAll();
				if (discordUsers.length < 2) {
					return await interaction.editReply({ content: 'Less than 2 players signed up. The custom MOTD has been aborted.', embeds: [] });
				}

				//Edit embed
				const mappoolEmbed = new Discord.EmbedBuilder()
					.setColor('#C45686')
					.setTitle('Custom MOTD settings [In Progress]')
					.setFooter({ text: `Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}` });

				for (let i = 0; i < discordUsers.length; i++) {
					mappoolEmbed.addFields([{ name: `Player #${i + 1}`, value: `${discordUsers[i].osuName} | #${discordUsers[i].osuRank}`, inline: true }]);
				}

				for (let i = 1; i < mappoolInOrder.length; i++) {
					let mapPrefix = '';
					if (i === 4 || i === 8) {
						mapPrefix = `Knockout #${i} (DT):`;
					} else {
						mapPrefix = `Knockout #${i}:`;
					}
					const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
					const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
					mappoolEmbed.addFields([{ name: embedName, value: embedValue }]);
				}

				await interaction.editReply({ embeds: [mappoolEmbed] });

				//Start the knockout lobby
				const { knockoutLobby } = require('../MOTD/knockoutLobby.js');
				knockoutLobby(additionalObjects[0], additionalObjects[1], 'Knockout', mappoolInOrder, 'custom', discordUsers, users, true, scoreversion);
			});
		} else {
			msg.reply('Please specify what you want to do: `server`, `register`, `unregister`, `mute`, `unmute`, `custom-fixed-players`, `custom-react-to-play`');
		}
	},
};
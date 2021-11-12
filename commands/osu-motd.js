const { DBDiscordUsers, DBOsuBeatmaps, DBOsuMultiScores } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, getOsuBeatmap, pause } = require('../utils');
const Discord = require('discord.js');
const osu = require('node-osu');

module.exports = {
	name: 'osu-motd',
	aliases: ['motd'],
	description: 'Allows you to join the `Maps of the Day` competition!',
	usage: '<server/register/unregister/mute/unmute> <#y/#mo/#w/#d/#h/#m>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;
		let lowerStarLimit = 0;
		let higherStarLimit = 10;

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._subcommand === 'custom-fixed-players') {
				args = ['custom-fixed-players'];
			} else {
				args = [interaction.options._subcommand];
			}

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'years') {
					years = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'months') {
					months = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'weeks') {
					weeks = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'days') {
					days = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'hours') {
					hours = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'minutes') {
					minutes = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'lowerstars') {
					lowerStarLimit = parseFloat(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'higherstars') {
					higherStarLimit = parseFloat(interaction.options._hoistedOptions[i].value);
				} else {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}

			if ((interaction.options._subcommand === 'custom-fixed-players' || interaction.options._subcommand === 'custom-react-to-play') && lowerStarLimit > higherStarLimit) {
				[lowerStarLimit, higherStarLimit] = [higherStarLimit, lowerStarLimit];
			}
		}


		if (args[0].toLowerCase() === 'server') {
			if (msg.id) {
				return sendMessage(msg, 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#801000891750547496> and assign yourself the MOTD role!\nEverything else will be done automatically when you registered!');
			}
			return interaction.reply({ content: 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#801000891750547496> and assign yourself the MOTD role!\nEverything else will be done automatically when you registered!', ephemeral: true });
		} else if (args[0].toLowerCase() === 'register') {
			const guildPrefix = await getGuildPrefix(msg);

			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				if (discordUser.osuMOTDRegistered) {
					if (msg.id) {
						return sendMessage(msg, `You are already registered for the \`Maps of the Day\` competition.\nBe sure to join the server if you didn't already. (\`${guildPrefix}osu-motd server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!`);
					}
					return interaction.reply({ content: 'You are already registered for the `Maps of the Day` competition.\nBe sure to join the server if you didn\'t already. (`/osu-motd server`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!', ephemeral: true });
				}
				if (discordUser.osuVerified) {
					discordUser.osuMOTDRegistered = true;
					discordUser.osuMOTDlastRoundPlayed = null;
					discordUser.osuMOTDMuted = false;
					discordUser.osuMOTDerrorFirstOccurence = null;
					discordUser.osuMOTDmutedUntil = null;
					discordUser.save();
					if (msg.id) {
						return sendMessage(msg, `You successfully registered for the \`Maps of the Day\` competition.\nBe sure to join the server and read <#834833321438740490> if you didn't already. (\`${guildPrefix}osu-motd server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!`);
					}
					return interaction.reply({ content: 'You successfully registered for the `Maps of the Day` competition.\nBe sure to join the server and read <#834833321438740490> if you didn\'t already. (`/osu-motd server`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!', ephemeral: true });
				} else {
					if (msg.id) {
						return sendMessage(msg, `It seems like you don't have your connected osu! account verified.\nPlease use \`${guildPrefix}osu-link verify\` to send a verification code to your osu! dms, follow the instructions and try again afterwards.`);
					}
					return interaction.reply({ content: 'It seems like you don\'t have your connected osu! account verified.\nPlease use `$/osu-link verify` to send a verification code to your osu! dms, follow the instructions and try again afterwards.', ephemeral: true });
				}
			} else {
				if (msg.id) {
					return sendMessage(msg, `It seems like you don't have your osu! account connected to the bot.\nPlease use \`${guildPrefix}osu-link osu-username\` to connect you account and verify it.`);
				}
				return interaction.reply({ content: 'It seems like you don\'t have your osu! account connected to the bot.\nPlease use `/osu-link osu-username` to connect you account and verify it.', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'unregister') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				discordUser.osuMOTDRegistered = false;
				discordUser.save();
				if (msg.id) {
					return sendMessage(msg, 'You have been unregistered from the `Maps of the Day` competition.\nStill thank you for showing interest!\nYou can always register again by using `e!osu-motd register`!');
				}
				return interaction.reply({ content: 'You have been unregistered from the `Maps of the Day` competition.\nStill thank you for showing interest!\nYou can always register again by using `/osu-motd register`!', ephemeral: true });
			} else {
				if (msg.id) {
					return sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
				}
				return interaction.reply({ content: 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `/osu-motd register`!', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'mute') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				if (discordUser.osuMOTDMuted) {
					if (args[1]) {
						for (let i = 0; i < args.length; i++) {
							let splice = true;
							if (args[i].endsWith('y') && !isNaN(args[i].replace('y', ''))) {
								years += parseInt(args[i].replace('y', ''));
							} else if (args[i].endsWith('mo') && !isNaN(args[i].replace('mo', ''))) {
								months += parseInt(args[i].replace('mo', ''));
							} else if (args[i].endsWith('w') && !isNaN(args[i].replace('w', ''))) {
								weeks += parseInt(args[i].replace('w', ''));
							} else if (args[i].endsWith('d') && !isNaN(args[i].replace('d', ''))) {
								days += parseInt(args[i].replace('d', ''));
							} else if (args[i].endsWith('h') && !isNaN(args[i].replace('h', ''))) {
								hours += parseInt(args[i].replace('h', ''));
							} else if (args[i].endsWith('m') && !isNaN(args[i].replace('m', ''))) {
								minutes += parseInt(args[i].replace('m', ''));
							} else {
								splice = false;
							}

							if (splice) {
								args.splice(i, 1);
								i--;
							}
						}
						let now = new Date();
						let date = new Date();
						date.setUTCFullYear(date.getUTCFullYear() + years);
						date.setUTCMonth(date.getUTCMonth() + months);
						date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
						date.setUTCHours(date.getUTCHours() + hours);
						date.setUTCMinutes(date.getUTCMinutes() + minutes);

						if (now !== date) {
							discordUser.osuMOTDmutedUntil = date;
							discordUser.save();
						}
					}
					if (msg.id) {
						return sendMessage(msg, 'The `Maps of the Day` competition has already been muted for you - the time has been update if a period was specified.\nTo receive messages and pings again use `e!osu-motd unmute`.');
					}
					return interaction.reply({ content: 'The `Maps of the Day` competition has already been muted for you - the time has been update if a period was specified.\nTo receive messages and pings again use `/osu-motd unmute`.', ephemeral: true });
				} else {
					if (args[1]) {
						let years = 0;
						let months = 0;
						let weeks = 0;
						let days = 0;
						let hours = 0;
						let minutes = 0;

						for (let i = 0; i < args.length; i++) {
							let splice = true;
							if (args[i].endsWith('y') && !isNaN(args[i].replace('y', ''))) {
								years += parseInt(args[i].replace('y', ''));
							} else if (args[i].endsWith('mo') && !isNaN(args[i].replace('mo', ''))) {
								months += parseInt(args[i].replace('mo', ''));
							} else if (args[i].endsWith('w') && !isNaN(args[i].replace('w', ''))) {
								weeks += parseInt(args[i].replace('w', ''));
							} else if (args[i].endsWith('d') && !isNaN(args[i].replace('d', ''))) {
								days += parseInt(args[i].replace('d', ''));
							} else if (args[i].endsWith('h') && !isNaN(args[i].replace('h', ''))) {
								hours += parseInt(args[i].replace('h', ''));
							} else if (args[i].endsWith('m') && !isNaN(args[i].replace('m', ''))) {
								minutes += parseInt(args[i].replace('m', ''));
							} else {
								splice = false;
							}

							if (splice) {
								args.splice(i, 1);
								i--;
							}
						}
						let now = new Date();
						let date = new Date();
						date.setUTCFullYear(date.getUTCFullYear() + years);
						date.setUTCMonth(date.getUTCMonth() + months);
						date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
						date.setUTCHours(date.getUTCHours() + hours);
						date.setUTCMinutes(date.getUTCMinutes() + minutes);

						if (now !== date) {
							discordUser.osuMOTDmutedUntil = date;
						} else {
							date.setUTCDate(date.getUTCDate() + 7);
							discordUser.osuMOTDmutedUntil = date;
						}
					}

					discordUser.osuMOTDMuted = true;
					discordUser.save();
					if (msg.id) {
						return sendMessage(msg, 'The `Maps of the Day` competition has been muted for you. You will not receive messages and pings anymore but will still appear on the leaderboard.\nTo receive messages and pings again use `e!osu-motd unmute`.');
					}
					return interaction.reply({ content: 'The `Maps of the Day` competition has been muted for you. You will not receive messages and pings anymore but will still appear on the leaderboard.\nTo receive messages and pings again use `/osu-motd unmute`.', ephemeral: true });
				}
			} else {
				if (msg.id) {
					return sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
				}
				return interaction.reply({ content: 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `/osu-motd register`!', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'unmute') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				if (discordUser.osuMOTDMuted) {
					discordUser.osuMOTDMuted = false;
					discordUser.osuMOTDmutedUntil = null;
					discordUser.save();
					if (msg.id) {
						return sendMessage(msg, 'The `Maps of the Day` competition has been unmuted for you. You will start receiving messages again.');
					}
					return interaction.reply({ content: 'The `Maps of the Day` competition has been unmuted for you. You will start receiving messages again.', ephemeral: true });
				} else {
					if (msg.id) {
						return sendMessage(msg, 'The `Maps of the Day` competition was not muted for you.');
					}
					return interaction.reply({ content: 'The `Maps of the Day` competition was not muted for you.', ephemeral: true });
				}
			} else {
				if (msg.id) {
					return sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
				}
				return interaction.reply({ content: 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `/osu-motd register`!', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'custom-fixed-players') {
			//Return if its not triggered by a slash command
			if (msg.id) {
				return msg.reply('Please use `/osu-motd custom-fixed-players` to set up the custom MOTD');
			}
			args.shift();

			//Defer the interaction
			await interaction.deferReply();

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
				let player = await osuApi.getUser({ u: args[i] });
				if (player) {
					players.push(player);
				} else {
					playersNotFound.push(args[i]);
				}
			}

			//Return if at least one player wasn't found
			if (playersNotFound.length > 0) {
				return interaction.editReply(`The following players were not found: ${playersNotFound.join(', ')}\nThe custom MOTD has been aborted.`);
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
				return interaction.editReply(`The following players have been mentioned multiple times: ${duplicatePlayers.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Get the related discordUser from the db for each player
			let discordUsers = [];
			let playersNotConnected = [];

			for (let i = 0; i < players.length; i++) {
				let discordUser = await DBDiscordUsers.findOne({
					where: { osuUserId: players[i].id },
				});

				if (discordUser) {
					discordUsers.push(discordUser);
				} else {
					playersNotConnected.push(players[i].name);
				}
			}

			//Return if at least one player isn't connected to the bot
			if (playersNotConnected.length > 0) {
				return interaction.editReply(`The following players are not connected to the bot: ${playersNotConnected.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Get the related user on discord for each discorduser
			let users = [];
			let unreachableUsers = [];

			for (let i = 0; i < discordUsers.length; i++) {
				let user = await interaction.guild.members.fetch(discordUsers[i].userId);
				if (user) {
					users.push(user);
				} else {
					unreachableUsers.push(discordUsers[i].userId);
				}
			}

			//Return if at least one user isn't reachable
			if (unreachableUsers.length > 0) {
				return interaction.editReply(`The following users are not reachable: ${unreachableUsers.join(', ')}\nThe custom MOTD has been aborted.`);
			}

			//Get the amount of Maps in the DB
			let amountOfMapsInDB = -1;

			while (amountOfMapsInDB === -1) {
				const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

				const dbBeatmap = await getOsuBeatmap(mostRecentBeatmap[0].id, 0);

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

					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
						&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
						&& (dbBeatmap.mods === 0 || dbBeatmap.mods === 1)
						&& !backupBeatmapIds.includes(dbBeatmap.id)) {
						backupBeatmapIds.push(dbBeatmap.id);
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId
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

			quicksort(nomodMaps);

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

					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
						&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
						&& (dbBeatmap.mods === 64 || dbBeatmap.mods === 65)
						&& !backupBeatmapIds.includes(dbBeatmap.id)) {
						backupBeatmapIds.push(dbBeatmap.id);
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId
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

			quicksort(doubleTimeMaps);

			//Push the chosen maps in correct order
			const mappoolInOrder = [];

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
			const mappoolEmbed = new Discord.MessageEmbed()
				.setColor('#C45686')
				.setTitle('Custom MOTD settings')
				.setFooter(`Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}`);

			for (let i = 0; i < players.length; i++) {
				mappoolEmbed.addField(`Player #${i + 1}`, `${players[i].name} | #${players[i].pp.rank}`, true);
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
				mappoolEmbed.addField(embedName, embedValue);
			}

			interaction.editReply({ embeds: [mappoolEmbed] });

			//Start the knockout lobby
			const { knockoutLobby } = require('../MOTD/knockoutLobby.js');
			knockoutLobby(additionalObjects[0], additionalObjects[1], 'Knockout', mappoolInOrder, 'custom', discordUsers, users, true);
		} else if (args[0].toLowerCase() === 'custom-react-to-play') {
			//Return if its not triggered by a slash command
			if (msg.id) {
				return msg.reply('Please use `/osu-motd custom-react-to-play` to set up the custom MOTD');
			}
			args.shift();

			//Defer the interaction
			await interaction.deferReply();

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			//Get the amount of Maps in the DB
			let amountOfMapsInDB = -1;

			while (amountOfMapsInDB === -1) {
				const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

				const dbBeatmap = await getOsuBeatmap(mostRecentBeatmap[0].id, 0);

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

					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
						&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
						&& (dbBeatmap.mods === 0 || dbBeatmap.mods === 1)
						&& !backupBeatmapIds.includes(dbBeatmap.id)) {
						backupBeatmapIds.push(dbBeatmap.id);
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId
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

			quicksort(nomodMaps);

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

					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
						&& parseFloat(dbBeatmap.starRating) >= lowerStarLimit - Math.floor(i * 0.001) * 0.1 && parseFloat(dbBeatmap.starRating) <= higherStarLimit + Math.floor(i * 0.001) * 0.1
						&& (dbBeatmap.mods === 64 || dbBeatmap.mods === 65)
						&& !backupBeatmapIds.includes(dbBeatmap.id)) {
						backupBeatmapIds.push(dbBeatmap.id);
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId
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

			quicksort(doubleTimeMaps);

			//Push the chosen maps in correct order
			const mappoolInOrder = [];

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
			const mappoolEmbed = new Discord.MessageEmbed()
				.setColor('#C45686')
				.setTitle('Custom MOTD settings')
				.setDescription('Sign up by reacting with ✅ in the next 2 minutes')
				.setFooter(`Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}`);

			// for (let i = 0; i < players.length; i++) {
			// 	mappoolEmbed.addField(`Player #${i + 1}`, `${players[i].name} | #${players[i].pp.rank}`, true);
			// }

			for (let i = 1; i < mappoolInOrder.length; i++) {
				let mapPrefix = '';
				if (i === 4 || i === 8) {
					mapPrefix = `Knockout #${i} (DT):`;
				} else {
					mapPrefix = `Knockout #${i}:`;
				}
				const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
				const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
				mappoolEmbed.addField(embedName, embedValue);
			}

			let embedMessage = await interaction.editReply({ embeds: [mappoolEmbed] });
			//Handle reactions
			embedMessage.react('✅');
			let discordUsers = [];
			let users = [];
			let discordUserIds = [];

			const filter = (reaction, user) => {
				return reaction.emoji.name === '✅' && !discordUserIds.includes(user.id) && user.id !== additionalObjects[0].user.id && discordUsers.length < 16;
			};

			const collector = embedMessage.createReactionCollector({ filter, time: 120000 });

			collector.on('collect', async (reaction, user) => {
				const dbDiscordUser = await DBDiscordUsers.findOne({
					where: { userId: user.id }
				});
				if (dbDiscordUser && dbDiscordUser.osuUserId) {
					discordUsers.push(dbDiscordUser);
					users.push(user);
					discordUserIds.push(user.id);

					//Edit embed
					const mappoolEmbed = new Discord.MessageEmbed()
						.setColor('#C45686')
						.setTitle('Custom MOTD settings')
						.setDescription('Sign up by reacting with ✅ in the next 2 minutes')
						.setFooter(`Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}`);

					for (let i = 0; i < discordUsers.length; i++) {
						mappoolEmbed.addField(`Player #${i + 1}`, `${discordUsers[i].osuName} | #${discordUsers[i].osuRank}`, true);
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
						mappoolEmbed.addField(embedName, embedValue);
					}

					interaction.editReply({ embeds: [mappoolEmbed] });
				} else {
					reaction.users.remove(user.id);
					let hintMessage = await embedMessage.channel.send(`It seems like you don't have your account connected and verified to the bot <@${user.id}>.\nPlease do so by using \`/osu-link connect\`and try again.`);
					await pause(10000);
					hintMessage.delete();
				}
			});

			collector.on('end', () => {
				if (discordUsers.length < 2) {
					embedMessage.reactions.removeAll();
					return interaction.editReply({ content: 'Less than 2 players signed up. The custom MOTD has been aborted.', embeds: [] });
				}

				//Start the knockout lobby
				const { knockoutLobby } = require('../MOTD/knockoutLobby.js');
				knockoutLobby(additionalObjects[0], additionalObjects[1], 'Knockout', mappoolInOrder, 'custom', discordUsers, users, true);
			});
		} else {
			msg.reply('Please specify what you want to do: `server`, `register`, `unregister`, `mute`, `unmute`, `custom-fixed-players`, `custom-react-to-play`');
		}
	},
};

function sendMessage(msg, content) {
	msg.author.send(content)
		.then(() => {
			if (msg.channel.type === 'DM') return;
			msg.reply('I\'ve sent you a DM with some info!');
		})
		.catch(() => {
			msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
		});
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].difficulty.rating) <= parseFloat(pivot.difficulty.rating)) {
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
const { DBDiscordUsers, DBOsuBeatmaps, DBOsuMultiScores } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, getOsuBeatmap } = require('../utils');

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
	async execute(msg, args, interaction) {
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._subcommand === 'custom-fixed-players') {
				args = ['custom'];
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
				} else if (interaction.options._hoistedOptions[i].name === 'message') {
					args = [interaction.options._hoistedOptions[i].value];
				}
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
		} else if (args[0].toLowerCase() === 'custom') {
			//Return if its not triggered by a slash command
			if (msg.id) {
				return msg.reply('Please use `/osu-motd custom` to set up the custom MOTD');
			}
			args.shift();
			//Decide between provided player list or not
			if (args[0]) { //Player list provided
				if (!args[1]) {
					//Send a message that not enough players were provided (min 2)
					return interaction.reply('You need to provide at least 2 players to start a custom MOTD!');
				}

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

				//Get the related discordUser from the db for each player
				let discordUsers = [];
				let playersNotConnected = [];

				for (let i = 0; i < players.length; i++) {
					let discordUser = await DBDiscordUsers.findOne({
						where: { userId: players[i].id },
					});

					if (discordUser) {
						discordUsers.push(discordUser);
					} else {
						playersNotConnected.push(players[i].username);
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
				let nomodMaps = [];
				let backupBeatmapIds = [];
				while (nomodMaps.length < 9) {

					let beatmap = null;

					while (!beatmap) {
						const index = Math.floor(Math.random() * amountOfMapsInDB);

						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});



						if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
							&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6
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

					nomodMaps.push(beatmap);
				}

				quicksort(nomodMaps);

				//Fill a DoubleTime map array with 50 random tourney maps from the db
				let doubleTimeMaps = [];

				backupBeatmapIds = [];

				while (doubleTimeMaps.length < 50) {

					let beatmap = null;

					while (!beatmap) {
						const index = Math.floor(Math.random() * amountOfMapsInDB);

						const dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
							&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6
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

					doubleTimeMaps.push(beatmap);
				}

				quicksort(doubleTimeMaps);


			}
		} else {
			msg.reply('Please specify what you want to do: `server`, `register`, `unregister`, `mute`, `unmute`, `custom`');
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
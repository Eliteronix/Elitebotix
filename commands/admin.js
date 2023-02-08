const { DBOsuMultiScores, DBProcessQueue, DBDiscordUsers, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBOsuForumPosts, DBDuelRatingHistory } = require('../dbObjects');
const { logDatabaseQueries, getUserDuelStarRating, cleanUpDuplicateEntries, humanReadable, getOsuBeatmap } = require('../utils');
const osu = require('node-osu');
const { developers, currentElitiriCup } = require('../config.json');
const { Op } = require('sequelize');

module.exports = {
	name: 'admin',
	description: 'Sends a message with the bots server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (!developers.includes(msg.author.id)) {
			return;
		}

		if (args[0] === 'guildCommands') {
			const { REST, Routes } = require('discord.js');
			const fs = require('fs');

			const commands = [];
			// Grab all the command files from the commands directory you created earlier
			const commandFiles = fs.readdirSync('./commands');

			// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
			for (const file of commandFiles) {
				const command = require(`./${file}`);

				if (args.includes(command.name)) {
					commands.push(command.data.toJSON());
				}
			}

			// Construct and prepare an instance of the REST module
			// eslint-disable-next-line no-undef
			const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

			// and deploy your commands!
			return (async () => {
				try {
					await msg.reply(`Started adding ${commands.length} application (/) commands.`);

					// The put method is used to fully refresh all commands in the guild with the current set
					await rest.put(
						Routes.applicationGuildCommands(msg.client.user.id, msg.guildId),
						{ body: commands },
					);

					await msg.reply(`Successfully added ${commands.length} application (/) commands.`);
				} catch (error) {
					// And of course, make sure you catch and log any errors!
					console.error(error);
				}
			})();
		} else if (args[0] === 'globalCommands') {
			const { REST, Routes } = require('discord.js');
			const fs = require('node:fs');

			const commands = [];
			// Grab all the command files from the commands directory you created earlier
			const commandFiles = fs.readdirSync('./commands');

			// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
			for (const file of commandFiles) {
				const command = require(`./${file}`);

				if (command.tags !== 'debug' && command.data) {
					commands.push(command.data.toJSON());
				}
			}

			// Construct and prepare an instance of the REST module
			// eslint-disable-next-line no-undef
			const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

			// and deploy your commands!
			return (async () => {
				try {
					await msg.reply(`Started refreshing ${commands.length} application (/) commands.`);

					// The put method is used to fully refresh all commands in the guild with the current set
					const data = await rest.put(
						Routes.applicationCommands(msg.client.user.id),
						{ body: commands },
					);

					await msg.reply(`Successfully reloaded ${data.length} application (/) commands.`);
				} catch (error) {
					// And of course, make sure you catch and log any errors!
					console.error(error);
				}
			})();
		} else if (args[0] === 'saveMultiMatches') {
			const processQueueTasks = await DBProcessQueue.findAll({ where: { task: 'saveMultiMatches' } });
			for (let i = 0; i < processQueueTasks.length; i++) {
				await processQueueTasks[i].destroy();
			}

			let now = new Date();
			DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${args[1]}`, priority: 2, date: now });
		} else if (args[0] === 'removeOsuUserConnection') {
			let DBDiscordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: args[1], osuVerified: true }
			});

			if (DBDiscordUser) {
				DBDiscordUser.osuUserId = null;
				DBDiscordUser.osuVerificationCode = null;
				DBDiscordUser.osuVerified = false;
				DBDiscordUser.osuName = null;
				DBDiscordUser.osuBadges = 0;
				DBDiscordUser.osuPP = null;
				DBDiscordUser.osuRank = null;
				DBDiscordUser.taikoPP = null;
				DBDiscordUser.taikoRank = null;
				DBDiscordUser.catchPP = null;
				DBDiscordUser.catchRank = null;
				DBDiscordUser.maniaPP = null;
				DBDiscordUser.maniaRank = null;
				DBDiscordUser.save();
				// eslint-disable-next-line no-console
				console.log('Removed osuUserId and verification for:', args[1]);
			} else {
				msg.reply('User not found');
			}
		} else if (args[0] === 'deleteElitiriSignup') {
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { id: args[1] }
			});

			if (DBElitiriSignup) {
				DBElitiriSignup.destroy();
				// eslint-disable-next-line no-console
				console.log('Deleted Elitiri Signup:', args[1]);
			} else {
				msg.reply('Signup not found');
			}
		} else if (args[0] === 'updateElitiriRanks') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignups = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup }
			});

			for (let i = 0; i < DBElitiriSignups.length; i++) {
				logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
				const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId } });
				if (!existingTask) {
					DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId });
				}
			}
		} else if (args[0] === 'updateElitiriPlayer') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { tournamentName: currentElitiriCup, osuUserId: args[1] }
			});

			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId } });
			if (!existingTask) {
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId });
			}
			// DBElitiriSignup.osuRank = args[2];
			// DBElitiriSignup.bracketName = args[3] + ' ' + args[4];
			// DBElitiriSignup.save();
		} else if (args[0] === 'multiScoresDBSize') {
			const mapScoreAmount = await DBOsuMultiScores.count();

			// eslint-disable-next-line no-console
			console.log(mapScoreAmount);
		} else if (args[0] === 'updateServerDuelRatings') {
			let sentMessage = await msg.reply('Processing...');
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {

					const members = [];
					guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

					for (let i = 0; i < members.length; i++) {
						if (i % 25 === 0) {
							sentMessage.edit(`${i} out of ${members.length} done`);
						}
						logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: {
								userId: members[i].id
							},
						});

						if (discordUser) {
							await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client });
						}
					}

					sentMessage.delete();
				})
				.catch(error => {
					console.error(error);
				});
		} else if (args[0] === 'addElitiriTopBracketNMMap') {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			// eslint-disable-next-line no-undef
			process.send('osu!API');
			osuApi.getBeatmaps({ b: args[1] })
				.then(async (beatmaps) => {
					DBElitiriCupSubmissions.create({
						osuUserId: '-1',
						osuName: 'ECW 2021 Submission',
						bracketName: 'Top Bracket',
						tournamentName: currentElitiriCup,
						modPool: 'NM',
						title: beatmaps[0].title,
						artist: beatmaps[0].artist,
						difficulty: beatmaps[0].version,
						starRating: beatmaps[0].difficulty.rating,
						drainLength: beatmaps[0].length.drain,
						circleSize: beatmaps[0].difficulty.size,
						approachRate: beatmaps[0].difficulty.approach,
						overallDifficulty: beatmaps[0].difficulty.overall,
						hpDrain: beatmaps[0].difficulty.drain,
						mapper: beatmaps[0].creator,
						beatmapId: beatmaps[0].id,
						beatmapsetId: beatmaps[0].beatmapSetId,
						bpm: beatmaps[0].bpm,
					});
				})
				.catch(error => {
					console.error(error);
				});
		} else if (args[0] === 'patreon') {
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser.patreon) {
				discordUser.patreon = false;
				msg.reply('Patreon status set to false');
			} else {
				discordUser.patreon = true;
				msg.reply('Patreon status set to true');
			}
			discordUser.save();
		} else if (args[0] === 'removeTwitchSyncEnable') {
			let twitchSyncUsers = await DBDiscordUsers.findAll({
				where: {
					twitchOsuMapSync: true
				}
			});

			for (let i = 0; i < twitchSyncUsers.length; i++) {
				twitchSyncUsers[i].twitchOsuMapSync = false;
				await twitchSyncUsers[i].save();
			}
		} else if (args[0] === 'cleanUp') {
			cleanUpDuplicateEntries(true);
		} else if (args[0] === 'clearForumPosts') {
			let forumPosts = await DBOsuForumPosts.findAll();
			for (let i = 0; i < forumPosts.length; i++) {
				await forumPosts[i].destroy();
			}
		} else if (args[0] === 'runningMatches') {
			let importMatchTasks = await DBProcessQueue.findAll({
				where: {
					task: 'importMatch',
				}
			});

			for (let i = 0; i < importMatchTasks.length; i++) {
				await msg.reply(`https://osu.ppy.sh/mp/${importMatchTasks[i].additions}`);
			}
		} else if (args[0] === 'deleteDiscordUser') {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser) {
				await discordUser.destroy();
				return await msg.reply('Deleted discord user');
			}

			return await msg.reply('Could not find discord user');
		} else if (args[0] === 'resetSavedPPValues') {
			// Reset saved pp values in DBOsuMultiScores using an update statement
			await msg.reply('Resetting...');
			let count = await DBOsuMultiScores.update({
				pp: null,
			}, {
				where: {
					pp: {
						[Op.ne]: null
					}
				}
			});

			return msg.reply(`Reset ${humanReadable(count)} scores' pp values`);
		} else if (args[0] === 'duelAdminCommand') {
			//TODO: Move to command file
			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'osu-duel-admin',
					description: 'Duel admin commands',
					default_member_permissions: '0',
					options: [
						{
							'name': 'createduel1v1',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'createduel2v2',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdplayer',
									'description': 'The third player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthplayer',
									'description': 'The fourth player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
					]
				},
			});
		} else if (args[0] === 'averageRating') {
			let discordUsers = await DBDiscordUsers.findAll({
				where: {
					osuUserId: {
						[Op.gt]: 0
					},
					osuPP: {
						[Op.gt]: 0
					},
					osuDuelStarRating: {
						[Op.gt]: 0
					},
					osuDuelProvisional: {
						[Op.not]: true,
					}
				}
			});

			let totalRating = 0;
			let totalPlayers = 0;

			for (let i = 0; i < discordUsers.length; i++) {
				let discordUser = discordUsers[i];

				if (discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[1]) && parseInt(discordUser.osuRank) <= parseInt(args[2])) {
					totalRating += parseFloat(discordUser.osuDuelStarRating);
					totalPlayers++;
				}
			}

			let averageRating = totalRating / totalPlayers;

			return msg.reply(`The average rating for players ranked ${args[1]} to ${args[2]} is ${averageRating.toFixed(2)}`);
		} else if (args[0] === 'restart') {
			let guildSizes = await msg.client.shard.fetchClientValues('guilds.cache.size');
			let startDates = await msg.client.shard.fetchClientValues('startDate');
			let duels = await msg.client.shard.fetchClientValues('duels');
			let other = await msg.client.shard.fetchClientValues('otherMatches');
			let matchtracks = await msg.client.shard.fetchClientValues('matchTracks');
			let bingoMatches = await msg.client.shard.fetchClientValues('bingoMatches');
			let update = await msg.client.shard.fetchClientValues('update');

			// eslint-disable-next-line no-console
			console.log('duels', duels);
			// eslint-disable-next-line no-console
			console.log('other', other);
			// eslint-disable-next-line no-console
			console.log('matchtracks', matchtracks);

			let output = `Options: \`all\`, \`free\`, \`shardId\`, \`update\`\n\`\`\`Cur.: ${msg.client.shardId} | Started          | Guilds | Duels | Other | Matchtrack | Bingo | Update\n`;
			for (let i = 0; i < guildSizes.length; i++) {
				output = output + '--------|------------------|--------|-------|-------|------------|-------|--------\n';
				let startDate = new Date(startDates[i]);
				let startedString = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')} ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${startDate.getUTCFullYear()}`;
				let guildSize = guildSizes[i].toString().padStart(6, ' ');
				let duelSize = duels[i].length.toString().padStart(5, ' ');
				let otherSize = other[i].length.toString().padStart(5, ' ');
				let matchtrackSize = matchtracks[i].length.toString().padStart(10, ' ');
				let bingoMatchSize = bingoMatches[i].toString().padStart(5, ' ');
				let updateString = update[i].toString().padStart(6, ' ');
				output = output + `Shard ${i} | ${startedString} | ${guildSize} | ${duelSize} | ${otherSize} | ${matchtrackSize} | ${bingoMatchSize} | ${updateString}\n`;
			}
			output = output + '```';
			await msg.reply(output);

			// Restart relevant ones
			await msg.client.shard.broadcastEval(async (c, { condition }) => {
				if (condition === 'all' ||
					condition === 'free' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks === 0 && c.bingoMatches === 0 ||
					!isNaN(condition) && c.shardId === parseInt(condition) ||
					condition === 'update' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches === 0) {

					// eslint-disable-next-line no-undef
					process.exit();
				} else if (condition === 'update') {
					c.update = 1;
				}
			}, { context: { condition: args[1] } });
			return;
		} else if (args[0] === 'resetSavedRatings') {
			let deleted = await DBDuelRatingHistory.destroy({
				where: {
					id: {
						[Op.gt]: 0,
					},
				}
			});

			await msg.reply(`Deleted ${deleted} duel rating histories.`);

			let updated = await DBDiscordUsers.update({
				lastDuelRatingUpdate: null,
			}, {
				where: {
					lastDuelRatingUpdate: {
						[Op.not]: null,
					},
				},
				silent: true
			});

			return await msg.reply(`Updated ${updated} discord users.`);
		} else if (args[0] === 'removeProcessQueueTask') {
			await DBProcessQueue.destroy({
				where: {
					id: args[1],
				}
			});

			return await msg.reply('Deleted the processqueue entry.');
		} else if (args[0] === 'remainingUsers') {
			let count = await DBDiscordUsers.count({
				where: {
					osuUserId: {
						[Op.not]: null
					},
					userId: null,
					osuRank: null,
					nextOsuPPUpdate: {
						[Op.eq]: null
					},
				},
			});

			return msg.reply(`Remaining users: ${count}`);
		} else if (args[0] === 'warmupnull') {
			let count = await DBOsuMultiScores.count({
				where: {
					warmup: null,
				},
			});

			return msg.reply(`Warmup null: ${count}`);
		} else if (args[0] === 'tournamentBanned') {
			let discordUsers = await DBDiscordUsers.findAll({
				where: {
					tournamentBannedUntil: {
						[Op.gte]: new Date(),
					},
				},
			});

			for (let i = 0; i < discordUsers.length; i++) {
				await msg.reply(`${discordUsers[i].osuName} | <https://osu.ppy.sh/users/${discordUsers[i].osuUserId}>`);
			}
		} else if (args[0] === 'tournamentDifficulty') {
			if (!args[1]) {
				return msg.reply('Missing beatmap ID');
			}

			if (!args[1]) {
				return msg.reply('Missing mods');
			}

			let modBits = 0;

			if (args[2] === 'NM') {
				modBits = 0;
			} else if (args[2] === 'HD') {
				modBits = 8;
			} else if (args[2] === 'HR') {
				modBits = 16;
			} else if (args[2] === 'DT') {
				modBits = 64;
			} else {
				return msg.reply('Invalid mod');
			}

			let beatmap = await getOsuBeatmap({ beatmapId: args[1], modBits: modBits });

			if (!beatmap) {
				return msg.reply('Beatmap not found');
			}

			//Get all the scores for the map
			let scores = await DBOsuMultiScores.findAll({
				where: {
					beatmapId: args[1],
					freeMod: false,
				}
			});

			let plays = [];

			// grab the player IDs, scores, mods, and month
			for (let i = 0; i < scores.length; i++) {
				if (scores[i].warmup) {
					continue;
				}

				if (parseInt(scores[i].gameRawMods) % 2 === 1) {
					scores[i].gameRawMods = parseInt(scores[i].gameRawMods) - 1;
				}
				if (parseInt(scores[i].rawMods) % 2 === 1) {
					scores[i].rawMods = parseInt(scores[i].rawMods) - 1;
				}

				if (parseInt(modBits) !== parseInt(scores[i].rawMods) + parseInt(scores[i].gameRawMods)) {
					continue;
				}

				plays.push({
					osuUserId: scores[i].osuUserId,
					score: scores[i].score,
					month: new Date(scores[i].gameStartDate).getUTCMonth(),
					year: new Date(scores[i].gameStartDate).getUTCFullYear(),
				});
			}

			let allDuelRatingHistories = await DBDuelRatingHistory.findAll({
				where: {
					osuUserId: {
						[Op.in]: plays.map(p => p.osuUserId),
					},
				}
			});

			for (let i = 0; i < plays.length; i++) {
				let duelRatingHistory = allDuelRatingHistories.find(d => d.osuUserId === plays[i].osuUserId && d.month === plays[i].month && d.year === plays[i].year);

				if (!duelRatingHistory) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				if (args[2] === 'NM') {
					plays[i].score = plays[i].score / 1;
					plays[i].duelRating = duelRatingHistory.osuNoModDuelStarRating;
				} else if (args[2] === 'HD') {
					plays[i].score = plays[i].score / 1.06;
					plays[i].duelRating = duelRatingHistory.osuHiddenDuelStarRating;
				} else if (args[2] === 'HR') {
					plays[i].score = plays[i].score / 1.1;
					plays[i].duelRating = duelRatingHistory.osuHardRockDuelStarRating;
				} else if (args[2] === 'DT') {
					plays[i].score = plays[i].score / 1.2;
					plays[i].duelRating = duelRatingHistory.osuDoubleTimeDuelStarRating;
				}

				if (!plays[i].duelRating) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				plays[i].duelRating = parseFloat(plays[i].duelRating);

				if (plays[i].score < 20000) {
					plays[i].score = 20000;
				}

				// calculate the expected SR
				// y=a (x + (b-r))²+c
				// r = (ab+sqrt(-a(c-y))+ax)/a
				// y = plays[i].score
				// x = plays[i].duelRating
				// r = ? (the expected duel rating)
				const a = 120000;
				const b = -1.67;
				const c = 20000;

				let helpRating = (a * b + Math.sqrt(-a * (c - plays[i].score)) + a * plays[i].duelRating) / a;

				plays[i].expectedDuelRating = plays[i].duelRating - (helpRating - plays[i].duelRating);
			}

			if (plays.length === 0) {
				return msg.reply('No plays found');
			}

			// Get the average expected duel rating
			let averageExpectedDuelRating = 0;
			for (let i = 0; i < plays.length; i++) {
				averageExpectedDuelRating += plays[i].expectedDuelRating;
			}
			averageExpectedDuelRating /= plays.length;

			return await msg.reply(`The tournament difficulty for ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] with ${args[2]} is ${averageExpectedDuelRating.toFixed(2)} based on ${plays.length} plays.`);
		} else {
			msg.reply('Invalid command');
		}

		msg.reply('Done.');
	},
};
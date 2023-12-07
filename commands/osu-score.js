const { DBDiscordUsers, DBOsuMultiGames, DBOsuMultiMatches, DBOsuMultiGameScores } = require('../dbObjects');
const osu = require('node-osu');
const { getLinkModeName, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getIDFromPotentialOsuLink, getOsuBeatmap, logDatabaseQueries, getBeatmapModeId, getModBits, multiToBanchoScore, scoreCardAttachment, gatariToBanchoScore, logOsuAPICalls } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-score',
	description: 'Sends an info card about the score of the specified player on the map',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 45,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-score')
		.setNameLocalizations({
			'de': 'osu-score',
			'en-GB': 'osu-score',
			'en-US': 'osu-score',
		})
		.setDescription('Sends an info card about the score of the specified player on the map')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den Score des angegebenen Spielers auf der map',
			'en-GB': 'Sends an info card about the score of the specified player on the map',
			'en-US': 'Sends an info card about the score of the specified player on the map',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('beatmap')
				.setNameLocalizations({
					'de': 'beatmap',
					'en-GB': 'beatmap',
					'en-US': 'beatmap',
				})
				.setDescription('The beatmap id or link')
				.setDescriptionLocalizations({
					'de': 'Die Beatmap-ID oder der Link',
					'en-GB': 'The beatmap id or link',
					'en-US': 'The beatmap id or link',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('mods')
				.setNameLocalizations({
					'de': 'mods',
					'en-GB': 'mods',
					'en-US': 'mods',
				})
				.setDescription('The mod combination that should be displayed (i.e. all, NM, HDHR, ...)')
				.setDescriptionLocalizations({
					'de': 'Die Mod-Kombination, die angezeigt werden soll (z. B. alle, NM, HDHR, ...)',
					'en-GB': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
					'en-US': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('The gamemode that should be displayed')
				.setDescriptionLocalizations({
					'de': 'Der Spielmodus, der angezeigt werden soll',
					'en-GB': 'The gamemode that should be displayed',
					'en-US': 'The gamemode that should be displayed',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Standard', value: 0 },
					{ name: 'Taiko', value: 1 },
					{ name: 'Catch The Beat', value: 2 },
					{ name: 'Mania', value: 3 },
				)
		)
		.addStringOption(option =>
			option.setName('server')
				.setNameLocalizations({
					'de': 'server',
					'en-GB': 'server',
					'en-US': 'server',
				})
				.setDescription('The server from which the results will be displayed')
				.setDescriptionLocalizations({
					'de': 'Der Server, von dem die Ergebnisse angezeigt werden',
					'en-GB': 'The server from which the results will be displayed',
					'en-US': 'The server from which the results will be displayed',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Bancho', value: 'bancho' },
					{ name: 'Ripple', value: 'ripple' },
					{ name: 'Gatari', value: 'gatari' },
					{ name: 'Tournaments', value: 'tournaments' },
				)
		)
		.addStringOption(option =>
			option.setName('username')
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
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username2')
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
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username3')
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
			option.setName('username4')
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
			option.setName('username5')
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
		),
	async execute(msg, args, interaction) {
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

		const beatmapId = getIDFromPotentialOsuLink(interaction.options.getString('beatmap'));

		let mods = 'best';

		if (interaction.options.getString('mods')) {
			mods = interaction.options.getString('mods').toUpperCase();

			if (mods === 'ALL') {
				mods = 'all';
			} else if (mods === 'NM') {
				mods = '';
			}
		}

		let usernames = [];

		if (interaction.options.getString('username')) {
			usernames.push(interaction.options.getString('username'));
		}

		if (interaction.options.getString('username2')) {
			usernames.push(interaction.options.getString('username2'));
		}

		if (interaction.options.getString('username3')) {
			usernames.push(interaction.options.getString('username3'));
		}

		if (interaction.options.getString('username4')) {
			usernames.push(interaction.options.getString('username4'));
		}

		if (interaction.options.getString('username5')) {
			usernames.push(interaction.options.getString('username5'));
		}

		let mapRank = 0;

		if (interaction.options.getInteger('mapRank')) {
			mapRank = interaction.options.getInteger('mapRank');
		}

		logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers commandUser');
		const commandUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuMainMode', 'osuMainServer'],
			where: {
				userId: interaction.user.id
			},
		});

		let gamemode = interaction.options.getNumber('gamemode');

		if (!gamemode) {
			if (commandUser && commandUser.osuMainMode) {
				gamemode = commandUser.osuMainMode;
			} else {
				gamemode = 0;
			}
		}

		let server = interaction.options.getString('server');

		if (!server) {
			if (commandUser && commandUser.osuMainServer) {
				server = commandUser.osuMainServer;
			} else {
				server = 'bancho';
			}
		}

		const dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		if (!dbBeatmap) {
			return await interaction.followUp(`Couldn't find beatmap \`${beatmapId.replace(/`/g, '')}\``);
		} else if (dbBeatmap.mode !== 'Standard') {
			gamemode = getBeatmapModeId(dbBeatmap);
		}

		if (!usernames[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getScore(interaction, dbBeatmap, commandUser.osuUserId, server, gamemode, false, mapRank, mods);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}

				getScore(interaction, dbBeatmap, userDisplayName, server, gamemode, false, mapRank, mods);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(interaction, dbBeatmap, discordUser.osuUserId, server, gamemode, false, mapRank, mods);
					} else {
						await interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getScore(interaction, dbBeatmap, usernames[i], server, gamemode, false, mapRank, mods);
					}
				} else {

					if (usernames.length === 1 && !(usernames[0].startsWith('<@')) && !(usernames[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getScore(interaction, dbBeatmap, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, true, mapRank, mods);
						} else {
							getScore(interaction, dbBeatmap, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, mapRank, mods);
						}
					} else {
						getScore(interaction, dbBeatmap, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, mapRank, mods);
					}
				}
			}
		}
	},
};

async function getScore(interaction, beatmap, username, server, mode, noLinkedAccount, mapRank, mods) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	if (server === 'bancho') {
		logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 2');
		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuName', 'osuUserId'],
			where: {
				osuUserId: username
			}
		});

		if (discordUser && discordUser.osuUserId) {
			username = discordUser.osuName;
		}

		logOsuAPICalls('commands/osu-score.js getScores Bancho 1');
		osuApi.getScores({ b: beatmap.beatmapId, u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return await interaction.followUp(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				}
				let scoreHasBeenOutput = false;
				for (let i = 0; i < scores.length; i++) {
					if (mods === 'best' && i === 0 || mods === 'all' || mods !== 'best' && mods !== 'all' && getModBits(mods) === scores[i].raw_mods) {
						scoreHasBeenOutput = true;
						logOsuAPICalls('commands/osu-score.js getUser Bancho');
						const user = await osuApi.getUser({ u: username, m: mode });
						updateOsuDetailsforUser(interaction.client, user, mode);

						//Get the map leaderboard and fill the maprank if found
						if (!mapRank) {
							logOsuAPICalls('commands/osu-score.js getScores Bancho 2 maprank');
							await osuApi.getScores({ b: beatmap.beatmapId, m: mode, limit: 100 })
								.then(async (mapScores) => {
									for (let j = 0; j < mapScores.length && !mapRank; j++) {
										if (scores[i].raw_mods === mapScores[j].raw_mods && scores[i].user.id === mapScores[j].user.id && scores[i].score === mapScores[j].score) {
											mapRank = j + 1;
										}
									}
								})
								// eslint-disable-next-line no-unused-vars
								.catch(err => {
									//Nothing
								});
						}

						const input = {
							beatmap: beatmap,
							score: scores[i],
							mode: mode,
							user: user,
							server: server,
							mapRank: mapRank,
						};

						const scoreCard = await scoreCardAttachment(input);

						logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 3');
						const linkedUser = await DBDiscordUsers.findOne({
							attributes: ['userId'],
							where: {
								osuUserId: user.id
							}
						});

						if (linkedUser && linkedUser.userId) {
							noLinkedAccount = false;
						}

						let messageContent = `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`;

						if (noLinkedAccount) {
							messageContent += `\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
						}

						let sentMessage = await interaction.followUp({ content: messageContent, files: [scoreCard] });

						try {
							if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
								await sentMessage.react('<:COMPARE:827974793365159997>');
							}
							await sentMessage.react('🗺️');
							await sentMessage.react('👤');
						} catch (err) {
							//Nothing
						}

						//Reset maprank in case of multiple scores displayed
						mapRank = 0;
					}
				}
				if (!scoreHasBeenOutput) {
					await interaction.followUp(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\` with \`${mods}\`.`);
				}
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		fetch(`https://www.ripple.moe/api/get_scores?b=${beatmap.beatmapId}&u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return await interaction.followUp(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = rippleToBanchoUser(responseJson[0]);

						let mapRank = 0;
						//Get the map leaderboard and fill the maprank if found
						await fetch(`https://www.ripple.moe/api/get_scores?b=${beatmap.beatmapId}&m=${mode}&limit=100`)
							.then(async (response) => {
								const responseJson = await response.json();

								//Order by score
								responseJson.sort((a, b) => {
									return parseInt(b.score) - parseInt(a.score);
								});

								for (let j = 0; j < responseJson.length && !mapRank; j++) {
									if (score.raw_mods === responseJson[j].enabled_mods && score.user.id === responseJson[j].user_id && score.score === responseJson[j].score) {
										mapRank = j + 1;
									}
								}
							})
							.catch(() => {
								//Nothing
							});

						const input = {
							beatmap: beatmap,
							score: score,
							mode: mode,
							user: user,
							server: server,
							mapRank: mapRank,
						};

						const scoreCard = await scoreCardAttachment(input);

						//Send attachment
						let sentMessage = await interaction.followUp({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`, files: [scoreCard] });

						if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
							sentMessage.react('<:COMPARE:827974793365159997>');
						}
						await sentMessage.react('🗺️');
						await sentMessage.react('👤');
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						} else {
							console.error(err);
						}
					});
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'tournaments') {
		logOsuAPICalls('commands/osu-score.js getUser tournaments');
		const osuUser = await osuApi.getUser({ u: username, m: mode });

		logDatabaseQueries(4, 'commands/osu-score.js DBOsuMultiGameScores');
		const beatmapScores = await DBOsuMultiGameScores.findAll({
			attributes: [
				'id',
				'matchId',
				'gameId',
				'score',
				'gameRawMods',
				'rawMods',
				'teamType',
				'pp',
				'beatmapId',
				'createdAt',
				'osuUserId',
				'count50',
				'count100',
				'count300',
				'countGeki',
				'countKatu',
				'countMiss',
				'maxCombo',
				'perfect',
				'mode',
			],
			where: {
				beatmapId: beatmap.beatmapId,
				scoringType: 3,
				score: {
					[Op.gte]: 10000,
				},
			},
			order: [['score', 'DESC']],
		});

		let gameIds = [...new Set(beatmapScores.map((item) => item.gameId))];

		logDatabaseQueries(4, 'commands/osu-score.js DBOsuMultiGames');
		const games = await DBOsuMultiGames.findAll({
			attributes: [
				'gameId',
				'gameStartDate',
			],
			where: {
				gameId: {
					[Op.in]: gameIds,
				},
			},
		});

		let matchIds = [...new Set(beatmapScores.map((item) => item.matchId))];

		logDatabaseQueries(4, 'commands/osu-score.js DBOsuMultiMatches');
		const matches = await DBOsuMultiMatches.findAll({
			attributes: [
				'matchId',
				'matchName',
			],
			where: {
				matchId: {
					[Op.in]: matchIds,
				},
			},
		});

		// Add game start date and match name to beatmapScores
		for (let i = 0; i < beatmapScores.length; i++) {
			let game = games.find((game) => game.gameId === beatmapScores[i].gameId);
			let match = matches.find((match) => match.matchId === beatmapScores[i].matchId);

			beatmapScores[i].gameStartDate = game.gameStartDate;
			beatmapScores[i].matchName = match.matchName;
		}

		const userScores = [];

		let userScoreAmount = 0;

		for (let i = 0; i < beatmapScores.length; i++) {
			if (beatmapScores[i].osuUserId === osuUser.id) {
				userScoreAmount++;
				if (mods === 'best' && userScores.length === 0 || mods === 'all'
					|| mods !== 'best' && mods !== 'all' && getModBits(mods) === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)
					|| mods !== 'best' && mods !== 'all' && mods.includes('NF') && getModBits(mods) - 1 === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)
					|| mods !== 'best' && mods !== 'all' && !mods.includes('NF') && getModBits(mods) + 1 === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)) {
					beatmapScores[i].mapRank = i + 1;
					userScores.push(beatmapScores[i]);
				}
			}

			if (beatmapScores[i].osuUserId !== osuUser.id) {
				for (let j = i + 1; j < beatmapScores.length; j++) {
					if (beatmapScores[j] && beatmapScores[i].osuUserId === beatmapScores[j].osuUserId) {
						beatmapScores.splice(j, 1);
						j--;
					}
				}
			}
		}

		if (!userScores.length) {
			return await interaction.followUp(`Couldn't find any tournament scores for \`${osuUser.name.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
		}

		for (let i = 0; i < userScores.length; i++) {
			userScores[i] = await multiToBanchoScore(userScores[i]);
			mapRank = `${userScores[i].mapRank}/${beatmapScores.length - userScoreAmount + 1}`;

			updateOsuDetailsforUser(interaction.client, osuUser, mode);

			const input = {
				beatmap: beatmap,
				score: userScores[i],
				mode: mode,
				user: osuUser,
				server: server,
				mapRank: mapRank,
			};

			const scoreCard = await scoreCardAttachment(input);

			logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 4');
			const linkedUser = await DBDiscordUsers.findOne({
				attributes: ['userId'],
				where: {
					osuUserId: osuUser.id
				}
			});

			if (linkedUser && linkedUser.userId) {
				noLinkedAccount = false;
			}

			let messageContent = `${osuUser.name}: <https://osu.ppy.sh/users/${osuUser.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`;

			if (noLinkedAccount) {
				messageContent += `\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
			}

			let sentMessage = await interaction.followUp({ content: messageContent, files: [scoreCard] });

			if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
				await sentMessage.react('<:COMPARE:827974793365159997>');
			}
			await sentMessage.react('🗺️');
			await sentMessage.react('👤');
		}
	} else if (server === 'gatari') {
		let gatariUser = await fetch(`https://api.gatari.pw/users/get?u=${username}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.users.length) {
					await interaction.followUp(`Couldn't find user \`${username.replace(/`/g, '')}\` on Gatari.`);
					return;
				}

				return responseJson.users[0];
			})
			.catch(async (err) => {
				await interaction.followUp(`An error occured while trying to get user \`${username.replace(/`/g, '')}\`.`);
				console.error(err);
			});

		if (!gatariUser) {
			return;
		}

		let gatariUserStats = await fetch(`https://api.gatari.pw/user/stats?u=${username}&mode=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.stats) {
					await interaction.followUp(`Couldn't find user stats for \`${username.replace(/`/g, '')}\` on Gatari.`);
					return;
				}

				return responseJson.stats;
			})
			.catch(async (err) => {
				await interaction.followUp(`An error occured while trying to get user \`${username.replace(/`/g, '')}\`.`);
				console.error(err);
			});

		if (!gatariUserStats) {
			return;
		}

		let user = {
			id: gatariUser.id,
			name: gatariUser.username,
			pp: {
				rank: gatariUserStats.rank,
				raw: gatariUserStats.pp,
			}
		};

		let gatariScore = await fetch(`https://api.gatari.pw/beatmap/user/score?b=${beatmap.beatmapId}&u=${user.id}&mode=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.score) {
					await interaction.followUp(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
					return;
				}

				return responseJson.score;
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});

		if (!gatariScore) {
			return;
		}

		gatariScore.username = user.name;
		gatariScore.user_id = user.id;
		gatariScore.beatmap_id = beatmap.beatmapId;
		gatariScore.beatmap_max_combo = beatmap.maxCombo;

		let score = gatariToBanchoScore(gatariScore);

		const input = {
			beatmap: beatmap,
			score: score,
			mode: mode,
			user: user,
			server: server,
			mapRank: gatariScore.top,
		};

		const scoreCard = await scoreCardAttachment(input);

		//Send attachment
		let sentMessage = await interaction.followUp({ content: `${user.name}: <https://osu.gatari.pw/u/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`, files: [scoreCard] });

		if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
			sentMessage.react('<:COMPARE:827974793365159997>');
		}
		await sentMessage.react('🗺️');
		await sentMessage.react('👤');
	}
} 
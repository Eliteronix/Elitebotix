const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getLinkModeName, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getIDFromPotentialOsuLink, getOsuBeatmap, logDatabaseQueries, scoreCardAttachment, gatariToBanchoScore } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-recent',
	aliases: ['ors'],
	description: 'Sends an info card about the last score of the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-recent')
		.setNameLocalizations({
			'de': 'osu-recent',
			'en-GB': 'osu-recent',
			'en-US': 'osu-recent',
		})
		.setDescription('Sends an info card about the last score of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den letzten Score des angegebenen Spielers',
			'en-GB': 'Sends an info card about the last score of the specified player',
			'en-US': 'Sends an info card about the last score of the specified player',
		})
		.setDMPermission(true)
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
			option.setName('pass')
				.setNameLocalizations({
					'de': 'pass',
					'en-GB': 'pass',
					'en-US': 'pass',
				})
				.setDescription('Show the recent pass?')
				.setDescriptionLocalizations({
					'de': 'Zeige den letzten Pass?',
					'en-GB': 'Show the recent pass?',
					'en-US': 'Show the recent pass?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'True', value: 'True' }
				)
		)
		.addNumberOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('Gamemode')
				.setDescriptionLocalizations({
					'de': 'Spielmodus',
					'en-GB': 'Gamemode',
					'en-US': 'Gamemode',
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
				)
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

		let pass = false;

		if (interaction.options.getString('pass')) {
			pass = true;
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

		if (!usernames[0]) {//Get profile by author if no argument
			//get discordUser from db
			if (commandUser && commandUser.osuUserId) {
				getScore(interaction, commandUser.osuUserId, server, gamemode, false, pass);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}

				getScore(interaction, userDisplayName, server, gamemode, false, pass);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(interaction, discordUser.osuUserId, server, gamemode, false, pass);
					} else {
						interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getScore(interaction, usernames[i], server, gamemode);
					}
				} else {
					if (usernames.length === 1 && !(usernames[0].startsWith('<@')) && !(usernames[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getScore(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, true, pass);
						} else {
							getScore(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, pass);
						}
					} else {
						getScore(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, pass);
					}
				}
			}
		}
	},
};

async function getScore(interaction, username, server, mode, noLinkedAccount, pass) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});
		let i = 0;
		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getUserRecent({ u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return interaction.followUp(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					if (pass) {
						do {
							i++;
						} while (scores[i] && scores[i].rank == 'F');
						if (!scores[i] || scores[i].rank == 'F') {
							return interaction.followUp(`Couldn't find any recent passes for \`${username.replace(/`/g, '')}\`.`);
						}
					}
				}

				const dbBeatmap = await getOsuBeatmap({ beatmapId: scores[i].beatmapId, modBits: 0 });
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const user = await osuApi.getUser({ u: username, m: mode });
				updateOsuDetailsforUser(interaction.client, user, mode);

				let mapRank = 0;
				//Get the map leaderboard and fill the maprank if found
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				await osuApi.getScores({ b: dbBeatmap.beatmapId, m: mode, limit: 100 })
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

				const input = {
					beatmap: dbBeatmap,
					score: scores[i],
					mode: mode,
					user: user,
					server: server,
					mapRank: mapRank,
				};

				const scoreCard = await scoreCardAttachment(input);

				logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers Bancho linkedUser');
				const linkedUser = await DBDiscordUsers.findOne({
					attributes: ['userId'],
					where: {
						osuUserId: user.id
					}
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				let messageContent = `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`;

				if (noLinkedAccount) {
					messageContent += `\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
				}

				let sentMessage = await interaction.followUp({ content: messageContent, files: [scoreCard] });

				if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
					sentMessage.react('<:COMPARE:827974793365159997>');
				}
				await sentMessage.react('🗺️');
				await sentMessage.react('👤');
			})
			.catch(err => {
				if (err.message === 'Not found') {
					interaction.followUp(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		fetch(`https://www.ripple.moe/api/get_user_recent?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return interaction.followUp(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

				const dbBeatmap = await getOsuBeatmap({ beatmapId: score.beatmapId, modBits: 0 });
				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = rippleToBanchoUser(responseJson[0]);

						let mapRank = 0;
						//Get the map leaderboard and fill the maprank if found
						await fetch(`https://www.ripple.moe/api/get_scores?b=${dbBeatmap.beatmapId}&m=${mode}&limit=100`)
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
							beatmap: dbBeatmap,
							score: score,
							mode: mode,
							user: user,
							server: server,
						};

						const scoreCard = await scoreCardAttachment(input);

						//Send attachment
						const sentMessage = await interaction.followUp({ content: `${user.name}: <https://ripple.moe/u/${user.id}?mode=${mode}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`, files: [scoreCard] });

						if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
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

		let passOnly = 1;

		if (pass) {
			passOnly = 0;
		}

		let gatariScore = await fetch(`https://api.gatari.pw/user/scores/recent?id=${user.id}&mode=${mode}&f=${passOnly}&l=1`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.scores.length) {
					await interaction.followUp(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
					return;
				}

				return responseJson.scores[0];
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

		let beatmap = await getOsuBeatmap({ beatmapId: gatariScore.beatmap.beatmap_id });

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
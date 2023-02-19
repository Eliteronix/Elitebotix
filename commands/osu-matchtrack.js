const osu = require('node-osu');
const { getGuildPrefix, getIDFromPotentialOsuLink, populateMsgFromInteraction, pause, getOsuPlayerName, saveOsuMultiScores, roundedRect, humanReadable, getModImage, calculateGrade, getModBits, getRankImage, getOsuBeatmap, getBeatmapSlimcover, getAvatar } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Discord = require('discord.js');
const Canvas = require('canvas');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');
const { DBOsuMultiScores } = require('../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-matchtrack',
	description: 'Sends an evaluation of how valuable all the players in the match were',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages, Attach Files and Embed Links',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-matchtrack')
		.setNameLocalizations({
			'de': 'osu-matchtrack',
			'en-GB': 'osu-matchtrack',
			'en-US': 'osu-matchtrack'
		})
		.setDescription('Tracks the progress of a match')
		.setDescriptionLocalizations({
			'de': 'Verfolgt den Fortschritt eines Matches',
			'en-GB': 'Tracks the progress of a match',
			'en-US': 'Tracks the progress of a match'
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('match')
				.setNameLocalizations({
					'de': 'match',
					'en-GB': 'match',
					'en-US': 'match'
				})
				.setDescription('Match ID or link')
				.setDescriptionLocalizations({
					'de': 'Match ID oder Link',
					'en-GB': 'Match ID or link',
					'en-US': 'Match ID or link'
				})
				.setRequired(true)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
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

			msg = await populateMsgFromInteraction(interaction);

			args = [];

			args.push(interaction.options._hoistedOptions[0].value);
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		let showStart = false;

		if (args[1] === '--tracking') {
			showStart = true;
		}

		if (isNaN(matchID)) {
			if (matchID.startsWith('https://osu.ppy.sh/community/matches/') || matchID.startsWith('https://osu.ppy.sh/mp/')) {
				matchID = getIDFromPotentialOsuLink(matchID);
			} else {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					return msg.channel.send(`You didn't provide a valid match ID or URL.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
				} else {
					return interaction.editReply(`You didn't provide a valid match ID or URL.\nUsage: \`/${this.name} ${this.usage}\``);
				}
			}
		}

		matchID = Number(matchID);

		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				if (match.raw_end && !showStart) {
					if (msg.id) {
						return msg.channel.send(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					} else {
						return interaction.editReply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					}
				}

				let initialMessage = null;

				if (msg.id) {
					initialMessage = await msg.channel.send(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
					msg.client.matchTracks.push(matchID);
				} else {
					initialMessage = await interaction.editReply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
					interaction.client.matchTracks.push(matchID);
				}

				let stop = false;

				const reactionCollector = initialMessage.createReactionCollector();

				reactionCollector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '🛑' && (user.id === msg.author.id || msg.guild && user.id === msg.guild.ownerId)) {
						reactionCollector.stop();
					}
				});

				reactionCollector.on('end', async () => {
					stop = true;
					initialMessage.reactions.removeAll().catch(() => { });
					msg.channel.send(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					if (msg.id) {
						if (msg.client.matchTracks.includes(matchID)) {
							msg.client.matchTracks.splice(msg.client.matchTracks.indexOf(matchID), 1);
						}
					} else {
						if (interaction.client.matchTracks.includes(matchID)) {
							interaction.client.matchTracks.splice(interaction.client.matchTracks.indexOf(matchID), 1);
						}
					}

					// eslint-disable-next-line no-undef
					process.send('osu!API');
					await osuApi.getMatch({ mp: matchID })
						.then(async (match) => {
							await saveOsuMultiScores(match);
						})
						.catch(() => {
							//Nothing
						});

					let warmups = await DBOsuMultiScores.findAll({
						attributes: ['gameId'],
						where: {
							matchId: matchID,
							warmup: {
								[Op.ne]: false,
							}
						},
						group: ['gameId'],
					});

					let matchScoreCommand = require('./osu-matchscore.js');

					await matchScoreCommand.execute(null, null, {
						id: null,
						options: {
							getString: (string) => {
								if (string === 'match') {
									return matchID.toString();
								}
							},
							getInteger: (string) => {
								if (string === 'warmups') {
									return warmups.length;
								}
							},
							getNumber: () => {

							},
						},
						deferReply: () => { },
						editReply: async (input) => {
							return await msg.channel.send(input);
						},
					});

					if (msg.id) {
						if (msg.client.update === 1 && msg.client.duels.length === 0 && msg.client.otherMatches.length === 0 && msg.client.matchTracks.length === 0 && msg.client.bingoMatches === 0) {

							// eslint-disable-next-line no-undef
							process.exit();
						}
					} else {
						if (interaction.client.update === 1 && interaction.client.duels.length === 0 && interaction.client.otherMatches.length === 0 && interaction.client.matchTracks.length === 0 && interaction.client.bingoMatches === 0) {

							// eslint-disable-next-line no-undef
							process.exit();
						}
					}
				});

				reactionCollector.on('error', (error) => {
					console.error(error);
				});

				initialMessage.react('🛑');

				let latestEventId = null;

				if (showStart) {
					latestEventId = 1;
				}

				let lastMessage = null;
				let lastMessageType = 'mapresult';

				while (!stop) {
					try {
						// eslint-disable-next-line no-undef
						process.send('osu! website');
						await fetch(`https://osu.ppy.sh/community/matches/${match.id}`)
							.then(async (res) => {
								let htmlCode = await res.text();
								htmlCode = htmlCode.replace(/&quot;/gm, '"');
								const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
								const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
								const matchesRunning = matchRunningRegex.exec(htmlCode);
								const matchesPaused = matchPausedRegex.exec(htmlCode);

								let regexMatch = null;
								if (matchesRunning && matchesRunning[0]) {
									regexMatch = matchesRunning[0];
								}

								if (matchesPaused && matchesPaused[0]) {
									regexMatch = matchesPaused[0];
								}

								if (regexMatch) {
									let json = JSON.parse(regexMatch);

									if (!latestEventId) {
										latestEventId = json.latest_event_id - 1;
									}

									while (json.first_event_id !== json.events[0].id) {
										await pause(15000);
										// eslint-disable-next-line no-undef
										process.send('osu! website');
										let earlierEvents = await fetch(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`)
											.then(async (res) => {
												let htmlCode = await res.text();
												htmlCode = htmlCode.replace(/&quot;/gm, '"');
												const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
												const matchesPaused = matchPausedRegex.exec(htmlCode);

												if (matchesPaused && matchesPaused[0]) {
													regexMatch = matchesPaused[0];
												}

												let json = JSON.parse(regexMatch);

												return json.events;
											});

										json.events = earlierEvents.concat(json.events);
									}

									if (json.latest_event_id > latestEventId) {
										let playerUpdates = [];
										let redScore = 0; //Score on the left side / first slots
										let blueScore = 0; //Score on the right side / last slots
										for (let i = 0; i < json.events.length; i++) {
											if (json.events[i].detail.type === 'other') {
												//Reset player updates
												playerUpdates = [];

												//Get the scores of the teams
												let blueScores = json.events[i].game.scores.filter(score => score.match.team === 'blue');
												let redScores = json.events[i].game.scores.filter(score => score.match.team === 'red');

												if (blueScores.length || redScores.length) {
													//Team vs
													quicksort(blueScores);
													quicksort(redScores);

													let blueTotalScore = 0;
													for (let i = 0; i < blueScores.length; i++) {
														blueTotalScore += blueScores[i].score;
													}

													let redTotalScore = 0;
													for (let i = 0; i < redScores.length; i++) {
														redTotalScore += redScores[i].score;
													}

													if (blueTotalScore > redTotalScore) {
														blueScore++;
													} else if (blueTotalScore < redTotalScore) {
														redScore++;
													}
												} else if (json.events[i].game.scores.length === 2) {
													//Head to head
													let playerNames = match.name.split(/\) ?vs.? ?\(/gm);
													//basically a check if its a tourney match (basically)
													if (playerNames[1]) {
														let redPlayer = playerNames[0].replace(/.+\(/gm, '');
														let bluePlayer = playerNames[1].replace(')', '');

														let redTotal = null;
														let blueTotal = null;

														for (let j = 0; j < json.events[i].game.scores.length; j++) {
															json.events[i].game.scores[j].username = await getOsuPlayerName(json.events[i].game.scores[j].user_id);
															if (json.events[i].game.scores[j].username === redPlayer) {
																redTotal = json.events[i].game.scores[j].score;
															}

															if (json.events[i].game.scores[j].username === bluePlayer) {
																blueTotal = json.events[i].game.scores[j].score;
															}
														}

														if (blueTotal > redTotal) {
															blueScore++;
														} else if (blueTotal < redTotal) {
															redScore++;
														}
													}
												}
											} else if (json.events[i].detail.type === 'host-changed' && json.events[i].user_id) {
												let playerName = await getOsuPlayerName(json.events[i].user_id);
												playerUpdates.push(`<:exchangealtsolid:1005141205069344859> ${playerName} became the host.`);
											} else if (json.events[i].detail.type === 'host-changed') {
												playerUpdates.push('<:exchangealtsolid:1005141205069344859> The host has been reset.');

												if (json.events[i].user_id === 0) {
													redScore = 0;
													blueScore = 0;
												}
											} else if (json.events[i].detail.type === 'player-joined') {
												let playerName = await getOsuPlayerName(json.events[i].user_id);
												playerUpdates.push(`<:arrowrightsolid:1005141207879536761> ${playerName} joined the match.`);
											} else if (json.events[i].detail.type === 'player-left') {
												let playerName = await getOsuPlayerName(json.events[i].user_id);
												playerUpdates.push(`<:arrowleftsolid:1005141359008682024> ${playerName} left the match.`);
											} else if (json.events[i].detail.type === 'player-kicked') {
												let playerName = await getOsuPlayerName(json.events[i].user_id);
												playerUpdates.push(`<:bansolid:1032747189941829683> ${playerName} has been kicked from the match.`);
											} else if (json.events[i].detail.type === 'match-disbanded') {
												playerUpdates.push('<:timessolid:1005141203819434104> The match has been closed.');
											} else if (json.events[i].detail.type === 'match-created') {
												playerUpdates.push('<:plussolid:1005142572823494677> The match has been created.');
											} else {
												playerUpdates.push(`${json.events[i].detail.type}, ${json.events[i].user_id}`);
											}

											if (json.events[i].id > latestEventId) {
												if (json.events[i].detail.type === 'match-disbanded') {
													reactionCollector.stop();
												}

												if (lastMessageType === 'mapresult' && json.events[i].detail.type !== 'other') {
													let embed = new Discord.EmbedBuilder()
														.setColor(0x0099FF)
														.setTitle(`${match.name.replace(/`/g, '')}`)
														.setDescription(`${playerUpdates.join('\n')}`);

													let hideQualifiers = new Date();
													hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

													if (!match.name.toLowerCase().includes('qualifier') || new Date(match.raw_start) < hideQualifiers) {
														embed.setURL(`https://osu.ppy.sh/mp/${match.id}`);
													}

													lastMessage = await msg.channel.send({ embeds: [embed] });
												} else if (json.events[i].detail.type === 'other' && json.events[i].game.end_time !== null) {
													let attachment = await getResultImage(json.events[i], json.users);
													let currentScore = '';
													if (redScore + blueScore > 0) {
														currentScore = `\n**Current score:** \`${redScore} - ${blueScore}\``;
													}

													let sharedLink = `<https://osu.ppy.sh/mp/${match.id}>`;

													let hideQualifiers = new Date();
													hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

													if (match.name.toLowerCase().includes('qualifier') && new Date(match.raw_start) > hideQualifiers) {
														sharedLink = `MP Link hidden for ${daysHidingQualifiers} days (Qualifiers)`;
													}

													if (lastMessageType === 'playing') {
														lastMessage = await lastMessage.edit({ content: `\`${match.name.replace(/`/g, '')}\`\n${sharedLink}${currentScore}`, files: [attachment] });
													} else {
														lastMessage = await msg.channel.send({ content: `\`${match.name.replace(/`/g, '')}\`\n${sharedLink}${currentScore}`, files: [attachment] });
													}

													await lastMessage.react('<:COMPARE:827974793365159997>');
													await lastMessage.react('🗺️');
												} else if (json.events[i].detail.type === 'other') {
													if (lastMessageType !== 'playing') {
														let modBits = getModBits(json.events[i].game.mods.join(''));
														let attachment = await getPlayingImage(json.events[i], json.users);
														let currentScore = '';
														if (redScore + blueScore > 0) {
															currentScore = `\n**Current score:** \`${redScore} - ${blueScore}\``;
														}

														let beatmap = await getOsuBeatmap({ beatmapId: json.events[i].game.beatmap.id, modBits: modBits });

														let startDate = new Date(json.events[i].game.start_time);

														if (beatmap) {
															startDate.setUTCSeconds(startDate.getUTCSeconds() + parseInt(beatmap.totalLength) + 30);
														}

														let sharedLink = `<https://osu.ppy.sh/mp/${match.id}>`;

														let hideQualifiers = new Date();
														hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

														if (match.name.toLowerCase().includes('qualifier') && new Date(match.raw_start) > hideQualifiers) {
															sharedLink = `MP Link hidden for ${daysHidingQualifiers} days (Qualifiers)`;
														}

														lastMessage = await msg.channel.send({ content: `\`${match.name.replace(/`/g, '')}\`\n${sharedLink}${currentScore}\nExpected end of the map: <t:${Date.parse(startDate) / 1000}:R>`, files: [attachment] });

														await lastMessage.react('<:COMPARE:827974793365159997>');
														await lastMessage.react('🗺️');
													}
												} else if (json.events[i].detail.type !== 'other') {
													let embed = new Discord.EmbedBuilder()
														.setColor(0x0099FF)
														.setTitle(`${match.name.replace(/`/g, '')}`)
														.setDescription(`${playerUpdates.join('\n')}`);

													let hideQualifiers = new Date();
													hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

													if (!match.name.toLowerCase().includes('qualifier') || new Date(match.raw_start) < hideQualifiers) {
														embed.setURL(`https://osu.ppy.sh/mp/${match.id}`);
													}

													lastMessage.edit({ embeds: [embed] });
												}


												if (json.events[i].detail.type === 'other' && json.events[i].game.end_time !== null) {
													lastMessageType = 'mapresult';
													latestEventId = json.events[i].id;
												} else if (json.events[i].detail.type === 'other') {
													lastMessageType = 'playing';
													let notLastMap = false;

													for (let j = i + 1; j < json.events.length; j++) {
														if (json.events[j].detail.type === 'other') {
															notLastMap = true;
														}
													}

													if (notLastMap || json.match.end_time) {
														latestEventId = json.events[i].id;
													} else {
														latestEventId = json.events[i].id - 1;
														break;
													}
												} else {
													lastMessageType = 'updates';
													latestEventId = json.events[i].id;
												}
											}
										}
									}
								}
							});
					} catch (e) {
						if (!e.message.endsWith('reason: Client network socket disconnected before secure TLS connection was established')
							&& !e.message.endsWith('reason: read ECONNRESET')) {
							console.error(e);
						}
						await pause(165000);
					}
					await pause(15000);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.channel.send(`Could not find match \`${matchID.replace(/`/g, '')}\`.`);
					} else {
						return interaction.editReply(`Could not find match \`${matchID.replace(/`/g, '')}\`.`);
					}
				} else {
					console.error(err);
				}
			});
	},
};

async function getResultImage(event, users) {
	let scores = [];
	let teamModeHeight = 0;
	let blueScore = 0;
	let redScore = 0;

	if (event.game.scores && event.game.scores[0] && event.game.scores[0].match.team === 'none') {
		scores = event.game.scores;
		quicksort(scores);
	} else {
		teamModeHeight = 75;
		let blueScores = event.game.scores.filter(score => score.match.team === 'blue');
		let redScores = event.game.scores.filter(score => score.match.team === 'red');

		quicksort(blueScores);
		quicksort(redScores);

		for (let i = 0; i < blueScores.length; i++) {
			blueScore += blueScores[i].score;
		}

		for (let i = 0; i < redScores.length; i++) {
			redScore += redScores[i].score;
		}

		if (blueScore > redScore) {
			scores = blueScores;

			for (let i = 0; i < redScores.length; i++) {
				scores.push(redScores[i]);
			}
		} else {
			scores = redScores;

			for (let i = 0; i < blueScores.length; i++) {
				scores.push(blueScores[i]);
			}
		}
	}

	const canvasWidth = 1000;
	const canvasHeight = 300 + scores.length * 75 + 15 + teamModeHeight;

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	//Get context and load the image
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('./other/osu-background.png');
	for (let i = 0; i < canvas.height / background.height; i++) {
		for (let j = 0; j < canvas.width / background.width; j++) {
			ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
		}
	}

	//Draw beatmap cover
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(25, 25 + 10);
	ctx.lineTo(25, 25 + 178 - 10);
	ctx.arcTo(25, 25 + 178, 25 + 10, 25 + 178, 10);
	ctx.lineTo(25 + 950 - 10, 25 + 178);
	ctx.arcTo(25 + 950, 25 + 178, 25 + 950, 25 + 178 - 10, 10);
	ctx.lineTo(25 + 950, 25 + 10);
	ctx.arcTo(25 + 950, 25, 25 + 950 - 10, 25, 10);
	ctx.lineTo(25 + 10, 25);
	ctx.arcTo(25, 25, 25, 25 + 10, 10);
	ctx.clip();

	if (!event.game.beatmap) {
		event.game.beatmap = {
			beatmapset: {
				id: '0',
				title: 'Unavailable',
				artist: 'Unavailable',
			},
			id: '0',
			version: 'Unavailable',
		};
	}

	try {
		const beatmapCover = await getBeatmapSlimcover(event.game.beatmap.beatmapset.id, event.game.beatmap.id);

		ctx.drawImage(beatmapCover, 25, 25, 950, 178);
	} catch (e) {
		//Nothing
	}

	ctx.restore();

	//Draw mods
	for (let i = 0; i < event.game.mods.length; i++) {
		event.game.mods[i] = getModImage(event.game.mods[i]);
		const modImage = await Canvas.loadImage(event.game.mods[i]);
		ctx.drawImage(modImage, 960 - ((event.game.mods.length - i) * 48), 35, 45, 32);
	}

	//Write Title and Artist
	ctx.fillStyle = '#ffffff';
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillText(`${event.game.beatmap.beatmapset.title} [${event.game.beatmap.version}]`, 30, 240, 900 - ctx.measureText(event.game.scoring_type).width);
	ctx.fillText(`${event.game.beatmap.beatmapset.artist}`, 30, 280, 900 - ctx.measureText(event.game.team_type).width);

	//Write team and scoring type
	ctx.textAlign = 'right';
	ctx.fillText(event.game.scoring_type, 970, 240);
	ctx.fillText(event.game.team_type, 970, 280);

	for (let i = 0; i < scores.length; i++) {
		//Draw background rectangle
		roundedRect(ctx, 25, 300 + i * 75, 950, 65, 10, '70', '57', '63', 0.75);

		let user = users.find(u => u.id === scores[i].user_id);

		//Draw Avatar
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(35, 305 + i * 75 + 5);
		ctx.lineTo(35, 305 + i * 75 + 55 - 5);
		ctx.arcTo(35, 305 + i * 75 + 55, 35 + 5, 305 + i * 75 + 55, 5);
		ctx.lineTo(35 + 55 - 5, 305 + i * 75 + 55);
		ctx.arcTo(35 + 55, 305 + i * 75 + 55, 35 + 55, 305 + i * 75 + 55 - 5, 5);
		ctx.lineTo(35 + 55, 305 + i * 75 + 5);
		ctx.arcTo(35 + 55, 305 + i * 75, 35 + 55 - 5, 305 + i * 75, 5);
		ctx.lineTo(35 + 5, 305 + i * 75);
		ctx.arcTo(35, 305 + i * 75, 35, 305 + i * 75 + 5, 5);
		ctx.clip();

		try {
			const avatar = await getAvatar(user.id);

			ctx.drawImage(avatar, 35, 305 + i * 75, 55, 55);
		} catch (e) {
			//Nothing
		}

		ctx.restore();

		//Mark the team if needed
		if (scores[i].match.team !== 'none') {
			ctx.beginPath();
			ctx.moveTo(25, 300 + i * 75 + 10);
			ctx.lineTo(25, 300 + i * 75 + 65 - 10);
			ctx.arcTo(25, 300 + i * 75 + 65, 25 + 10, 300 + i * 75 + 65, 10);
			ctx.lineTo(25 + 10, 300 + i * 75);
			ctx.arcTo(25, 300 + i * 75, 25, 300 + i * 75 + 10, 10);
			if (scores[i].match.team === 'blue') {
				ctx.fillStyle = '#2299BB';
			} else {
				ctx.fillStyle = '#BB1177';
			}
			ctx.fill();
		}

		// Write the username
		ctx.font = 'bold 25px comfortaa, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText(user.username, 100, 330 + i * 75);

		// Draw the flag
		try {
			let flag = await Canvas.loadImage(`./other/flags/${user.country_code}.png`);

			ctx.drawImage(flag, 100, 338 + i * 75, flag.width * 0.1785, flag.height * 0.1785);
		} catch (e) {
			let flag = await Canvas.loadImage('./other/flags/__.png');

			ctx.drawImage(flag, 100, 338 + i * 75, 25, 18);
		}

		// Draw the grade
		let mode = 'Standard';
		if (scores[i].mode_int === 1) {
			mode = 'Taiko';
		} else if (scores[i].mode_int === 2) {
			mode = 'Catch the Beat';
		} else if (scores[i].mode_int === 3) {
			mode = 'Mania';
		}

		let counts = {
			'300': scores[i].statistics.count_300,
			'100': scores[i].statistics.count_100,
			'50': scores[i].statistics.count_50,
			miss: scores[i].statistics.count_miss,
			katu: scores[i].statistics.count_katu,
			geki: scores[i].statistics.count_geki,
		};

		let mods = scores[i].mods;
		for (let j = 0; j < mods.length; j++) {
			if (mods[j].includes('no-fail')) {
				mods[j] = 'NF';
			} else if (mods[j].includes('hidden')) {
				mods[j] = 'HD';
			} else if (mods[j].includes('hard-rock')) {
				mods[j] = 'HR';
			}
		}

		let modBits = getModBits(mods.join(''));

		let grade = calculateGrade(mode, counts, modBits);

		let gradeImage = await Canvas.loadImage(getRankImage(grade));

		ctx.drawImage(gradeImage, 927, 338 + i * 75, 32, 16);

		// Draw the mods
		for (let j = 0; j < mods.length; j++) {
			mods[j] = getModImage(mods[j]);
			const modImage = await Canvas.loadImage(mods[j]);
			ctx.drawImage(modImage, 475 - ((mods.length - j) * 48), 305 + i * 75, 45, 32);
		}

		// Write the combo
		ctx.font = 'bold 12px comfortaa, sans-serif';
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('Combo', 500, 330 + i * 75);

		ctx.font = 'bold 20px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].max_combo), 550, 330 + i * 75);

		// Write the accuracy
		ctx.font = 'bold 12px comfortaa, sans-serif';
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('Accuracy', 638, 330 + i * 75);

		ctx.font = 'bold 20px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(`${Math.round(scores[i].accuracy * 10000) / 100}%`, 700, 330 + i * 75);

		// Write the score
		ctx.font = 'bold 22px comfortaa, sans-serif';
		ctx.fillStyle = '#FF66AB';
		ctx.textAlign = 'right';
		ctx.fillText(humanReadable(scores[i].score), 960, 330 + i * 75);

		let scoreTextWidth = ctx.measureText(humanReadable(scores[i].score)).width;

		ctx.font = 'bold 12px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText('Score', 953 - scoreTextWidth, 330 + i * 75);

		// Write the counts
		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillStyle = '#F0DBE4';
		if (mode === 'Mania') {
			ctx.fillText('MAX', 618, 350 + i * 75);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(humanReadable(scores[i].statistics.count_geki.toString()), 645, 350 + i * 75);
			ctx.fillStyle = '#F0DBE4';
			ctx.fillText('300', 680, 350 + i * 75);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(humanReadable(scores[i].statistics.count_300.toString()), 700, 350 + i * 75);
			ctx.fillStyle = '#F0DBE4';
			ctx.fillText('200', 730, 350 + i * 75);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(humanReadable(scores[i].statistics.count_katu.toString()), 750, 350 + i * 75);
		} else {
			ctx.fillText('300', 730, 350 + i * 75);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(humanReadable(scores[i].statistics.count_300.toString()), 750, 350 + i * 75);
		}
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('100', 781, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_100.toString()), 800, 350 + i * 75);
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('50', 830, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_50.toString()), 845, 350 + i * 75);
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('Miss', 873, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_miss.toString()), 900, 350 + i * 75);
	}

	if (teamModeHeight) {
		//Draw background rectangle
		roundedRect(ctx, 25, 300 + scores.length * 75, 950, 65, 10, '70', '57', '63', 0.95);

		// Write the teams and scores
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText('Red Team', 50, 325 + scores.length * 75);
		ctx.font = 'bold 25px comfortaa, sans-serif';
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText(humanReadable(redScore), 50, 350 + scores.length * 75);

		ctx.textAlign = 'right';
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText('Blue Team', 950, 325 + scores.length * 75);
		ctx.font = 'bold 25px comfortaa, sans-serif';
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText(humanReadable(blueScore), 950, 350 + scores.length * 75);

		ctx.textAlign = 'center';
		ctx.fillStyle = '#FFFFFF';
		if (redScore > blueScore) {
			ctx.fillText(`Red Team Wins by ${humanReadable(redScore - blueScore)}`, 500, 342 + scores.length * 75);
		} else {
			ctx.fillText(`Blue Team Wins by ${humanReadable(blueScore - redScore)}`, 500, 342 + scores.length * 75);
		}
	}

	let mods = event.game.mods;
	for (let i = 0; i < mods.length; i++) {
		if (mods[i].includes('no-fail')) {
			mods[i] = 'NF';
		} else if (mods[i].includes('hidden')) {
			mods[i] = 'HD';
		} else if (mods[i].includes('hard-rock')) {
			mods[i] = 'HR';
		} else if (mods[i].includes('double-time')) {
			mods[i] = 'DT';
		} else if (mods[i].includes('half-time')) {
			mods[i] = 'HT';
		}
	}

	let modBits = getModBits(mods.join(''));

	//Create as an attachment
	return new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-game-${event.game.id}-${event.game.beatmap.id}-${modBits}.png` });
}

async function getPlayingImage(event) {
	const canvasWidth = 1000;
	const canvasHeight = 300 + 15;

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	//Get context and load the image
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('./other/osu-background.png');
	for (let i = 0; i < canvas.height / background.height; i++) {
		for (let j = 0; j < canvas.width / background.width; j++) {
			ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
		}
	}

	//Draw beatmap cover
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(25, 25 + 10);
	ctx.lineTo(25, 25 + 178 - 10);
	ctx.arcTo(25, 25 + 178, 25 + 10, 25 + 178, 10);
	ctx.lineTo(25 + 950 - 10, 25 + 178);
	ctx.arcTo(25 + 950, 25 + 178, 25 + 950, 25 + 178 - 10, 10);
	ctx.lineTo(25 + 950, 25 + 10);
	ctx.arcTo(25 + 950, 25, 25 + 950 - 10, 25, 10);
	ctx.lineTo(25 + 10, 25);
	ctx.arcTo(25, 25, 25, 25 + 10, 10);
	ctx.clip();

	if (!event.game.beatmap) {
		event.game.beatmap = {
			beatmapset: {
				id: '0',
				title: 'Unavailable',
				artist: 'Unavailable',
			},
			id: '0',
			version: 'Unavailable',
		};
	}

	try {
		const beatmapCover = await getBeatmapSlimcover(event.game.beatmap.beatmapset.id, event.game.beatmap.id);

		ctx.drawImage(beatmapCover, 25, 25, 950, 178);
	} catch (e) {
		//Nothing
	}

	ctx.restore();

	//Draw mods
	for (let i = 0; i < event.game.mods.length; i++) {
		event.game.mods[i] = getModImage(event.game.mods[i]);
		const modImage = await Canvas.loadImage(event.game.mods[i]);
		ctx.drawImage(modImage, 960 - ((event.game.mods.length - i) * 48), 35, 45, 32);
	}

	//Write Title and Artist
	ctx.fillStyle = '#ffffff';
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillText(`${event.game.beatmap.beatmapset.title} [${event.game.beatmap.version}]`, 30, 240, 900 - ctx.measureText(event.game.scoring_type).width);
	ctx.fillText(`${event.game.beatmap.beatmapset.artist}`, 30, 280, 900 - ctx.measureText(event.game.team_type).width);

	//Write team and scoring type
	ctx.textAlign = 'right';
	ctx.fillText(event.game.scoring_type, 970, 240);
	ctx.fillText(event.game.team_type, 970, 280);

	let mods = event.game.mods;
	for (let i = 0; i < mods.length; i++) {
		if (mods[i].includes('no-fail')) {
			mods[i] = 'NF';
		} else if (mods[i].includes('hidden')) {
			mods[i] = 'HD';
		} else if (mods[i].includes('hard-rock')) {
			mods[i] = 'HR';
		} else if (mods[i].includes('double-time')) {
			mods[i] = 'DT';
		} else if (mods[i].includes('half-time')) {
			mods[i] = 'HT';
		}
	}

	let modBits = getModBits(mods.join(''));

	//Create as an attachment
	return new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-game-${event.game.id}-${event.game.beatmap.id}-${modBits}.png` });
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].score) >= parseInt(pivot.score)) {
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
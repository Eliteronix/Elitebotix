const osu = require('node-osu');
const { getGuildPrefix, getIDFromPotentialOsuLink, populateMsgFromInteraction, pause, getOsuPlayerName, saveOsuMultiScores, fitTextOnLeftCanvas, roundedRect, humanReadable, getModImage, calculateGrade, getModBits, getRankImage } = require('../utils');
const { Permissions } = require('discord.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const Canvas = require('canvas');

module.exports = {
	name: 'osu-matchtrack',
	aliases: ['osu-matchfollow'],
	description: 'Sends an evaluation of how valuable all the players in the match were',
	usage: '<match ID or URL> [# of warmups] [avg]',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			await interaction.deferReply();

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

		if (isNaN(matchID)) {
			if (args[0].startsWith('https://osu.ppy.sh/community/matches/') || args[0].startsWith('https://osu.ppy.sh/mp/')) {
				matchID = getIDFromPotentialOsuLink(args[0]);
			} else {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					return msg.reply(`You didn't provide a valid match ID or URL.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
				} else {
					return interaction.editReply(`You didn't provide a valid match ID or URL.\nUsage: \`/${this.name} ${this.usage}\``);
				}
			}
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				if (match.raw_end) {
					if (msg.id) {
						return msg.reply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					} else {
						return interaction.editReply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					}
				}

				let initialMessage = null;

				if (msg.id) {
					initialMessage = msg.reply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				} else {
					initialMessage = await interaction.editReply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				}

				let stop = false;

				const reactionCollector = initialMessage.createReactionCollector();

				reactionCollector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '🛑' && user.id === msg.author.id) {
						reactionCollector.stop();
					}
				});

				reactionCollector.on('end', () => {
					stop = true;
					initialMessage.reactions.removeAll().catch(() => { });
					if (msg.id) {
						msg.reply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					} else {
						interaction.editReply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					}

					osuApi.getMatch({ mp: matchID })
						.then(async (match) => {
							saveOsuMultiScores(match);
						})
						.catch(() => {
							//Nothing
						});
				});

				reactionCollector.on('error', (error) => {
					console.log(error);
				});

				initialMessage.react('🛑');

				let latestEventId = null;

				let lastMessage = null;
				let lastMessageType = 'mapresult';

				while (!stop) {
					await fetch(`https://osu.ppy.sh/community/matches/${match.id}`)
						.then(async (res) => {
							let htmlCode = await res.text();
							htmlCode = htmlCode.replace(/&quot;/gm, '"');
							// console.log(htmlCode);
							const matchRunningRegex = /{"match".+,"current_game_id":d+}/gm;
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
									latestEventId = json.latest_event_id;
								}

								if (json.latest_event_id > latestEventId) {
									let playerUpdates = [];
									for (let i = 0; i < json.events.length; i++) {
										if (json.events[i].detail.type === 'other') {
											playerUpdates = [];
										} else if (json.events[i].detail.type === 'host-changed') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`<:exchangealtsolid:1005141205069344859> ${playerName} became the host.`);
										} else if (json.events[i].detail.type === 'player-joined') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`<:arrowrightsolid:1005141207879536761> ${playerName} joined the game.`);
										} else if (json.events[i].detail.type === 'player-left') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`<:arrowleftsolid:1005141359008682024> ${playerName} left the game.`);
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
												let embed = new Discord.MessageEmbed()
													.setColor(0x0099FF)
													.setTitle(`${match.name.replace(/`/g, '')}`)
													.setDescription(`${playerUpdates.join('\n')}`);

												lastMessage = await msg.channel.send({ embeds: [embed] });
											} else if (json.events[i].detail.type === 'other') {
												let attachment = await getResultImage(json.events[i], json.users);
												lastMessage = await msg.channel.send({ files: [attachment] });
											} else if (json.events[i].detail.type !== 'other') {
												let embed = new Discord.MessageEmbed()
													.setColor(0x0099FF)
													.setTitle(`${match.name.replace(/`/g, '')}`)
													.setDescription(`${playerUpdates.join('\n')}`);

												lastMessage.edit({ embeds: [embed] });
											}


											if (json.events[i].detail.type === 'other') {
												lastMessageType = 'mapresult';
											} else {
												lastMessageType = 'updates';
											}
										}
									}

									latestEventId = json.latest_event_id;
								}
							}
						});

					await pause(15000);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					} else {
						return interaction.editReply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					}
				} else {
					console.log(err);
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

	try {
		const beatmapCover = await Canvas.loadImage(event.game.beatmap.beatmapset.covers.slimcover);

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
	fitTextOnLeftCanvas(ctx, `${event.game.beatmap.beatmapset.title} [${event.game.beatmap.version}]`, 30, 'comfortaa, sans-serif', 240, 940, 30);
	fitTextOnLeftCanvas(ctx, `${event.game.beatmap.beatmapset.artist}`, 30, 'comfortaa, sans-serif', 280, 940, 30);

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
			const avatar = await Canvas.loadImage(user.avatar_url);

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
			miss: scores[i].statistics.count_miss
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

		ctx.drawImage(gradeImage, 927, 338 + i * 75, gradeImage.width, gradeImage.height);

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
		ctx.fillText('300', 730, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_300), 750, 350 + i * 75);
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('100', 781, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_100), 800, 350 + i * 75);
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('50', 830, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_50), 845, 350 + i * 75);
		ctx.fillStyle = '#F0DBE4';
		ctx.fillText('Miss', 873, 350 + i * 75);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(humanReadable(scores[i].statistics.count_miss), 900, 350 + i * 75);
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

	//Create as an attachment
	return new Discord.MessageAttachment(canvas.toBuffer(), `osu-game-${event.game.id}.png`);
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
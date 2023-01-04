const { populateMsgFromInteraction, getOsuUserServerMode, pause, logDatabaseQueries, getMods, humanReadable, getMapListCover } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { DBOsuBeatmaps, DBDiscordUsers } = require('../dbObjects');
const Canvas = require('canvas');
const Discord = require('discord.js');
const osu = require('node-osu');

module.exports = {
	name: 'osu-bingo',
	// aliases: ['osu-map', 'beatmap-info', 'o-bm'],
	description: 'Allows you to play a bingo match',
	// usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let team1 = [];

		msg = await populateMsgFromInteraction(interaction);

		const commandConfig = await getOsuUserServerMode(msg, []);
		const commandUser = commandConfig[0];

		if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
			return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using </osu-link connect:1023849632599658496>.');
		}

		team1.push(commandUser.userId);

		if (interaction.options.getUser('player2team1')) {
			team1.push(interaction.options.getUser('player2team1').id);
		}

		if (interaction.options.getUser('player3team1')) {
			team1.push(interaction.options.getUser('player3team1').id);
		}

		let team2 = [];

		if (interaction.options.getUser('player1team2')) {
			team2.push(interaction.options.getUser('player1team2').id);
		}

		if (interaction.options.getUser('player2team2')) {
			team2.push(interaction.options.getUser('player2team2').id);
		}

		if (interaction.options.getUser('player3team2')) {
			team2.push(interaction.options.getUser('player3team2').id);
		}

		let team3 = [];

		if (interaction.options.getUser('player1team3')) {
			team3.push(interaction.options.getUser('player1team3').id);
		}

		if (interaction.options.getUser('player2team3')) {
			team3.push(interaction.options.getUser('player2team3').id);
		}

		if (interaction.options.getUser('player3team3')) {
			team3.push(interaction.options.getUser('player3team3').id);
		}

		let team4 = [];

		if (interaction.options.getUser('player1team4')) {
			team4.push(interaction.options.getUser('player1team4').id);
		}

		if (interaction.options.getUser('player2team4')) {
			team4.push(interaction.options.getUser('player2team4').id);
		}

		if (interaction.options.getUser('player3team4')) {
			team4.push(interaction.options.getUser('player3team4').id);
		}

		let team5 = [];

		if (interaction.options.getUser('player1team5')) {
			team5.push(interaction.options.getUser('player1team5').id);
		}

		if (interaction.options.getUser('player2team5')) {
			team5.push(interaction.options.getUser('player2team5').id);
		}

		if (interaction.options.getUser('player3team5')) {
			team5.push(interaction.options.getUser('player3team5').id);
		}

		// Get the star rating
		let lowerstarrating = 4;

		if (interaction.options.getNumber('lowerstarrating')) {
			lowerstarrating = interaction.options.getNumber('lowerstarrating');

			if (lowerstarrating < 3) {
				return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
			} else if (lowerstarrating > 10) {
				return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
			}
		}

		let higherstarrating = 7;

		if (interaction.options.getNumber('higherstarrating')) {
			higherstarrating = interaction.options.getNumber('higherstarrating');

			if (higherstarrating < 3) {
				return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
			} else if (higherstarrating > 10) {
				return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
			}
		}

		let requirement = 'Pass';

		if (interaction.options.getString('requirement')) {
			requirement = interaction.options.getString('requirement');
		}


		//Cross check that commandUser.userId, teammates and opponents are all unique
		const allUsers = [...team1, ...team2, ...team3, ...team4, ...team5];
		const uniqueUsers = [...new Set(allUsers)];

		if (allUsers.length !== uniqueUsers.length) {
			return await interaction.editReply('You can\'t play a bingo match with the same user twice');
		}

		if (allUsers.length < 2) {
			return await interaction.editReply('You can\'t play a bingo match alone');
		}

		let everyUser = [];
		for (let i = 0; i < allUsers.length; i++) {
			logDatabaseQueries(4, 'commands/osu-bingo.js DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: allUsers[i],
					osuVerified: true
				}
			});

			if (discordUser && discordUser.osuUserId) {
				everyUser.push(discordUser);
			} else {
				return await interaction.editReply(`<@${allUsers[i]}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using </osu-link connect:1023849632599658496>.`);
			}
		}

		let teamsString = '';

		if (team1.length > 0) {
			teamsString = `\nTeam 1: <@${team1.join('>, <@')}>`;
		}

		if (team2.length > 0) {
			teamsString = teamsString + `\nTeam 2: <@${team2.join('>, <@')}>`;
		}

		if (team3.length > 0) {
			teamsString = teamsString + `\nTeam 3: <@${team3.join('>, <@')}>`;
		}

		if (team4.length > 0) {
			teamsString = teamsString + `\nTeam 4: <@${team4.join('>, <@')}>`;
		}

		if (team5.length > 0) {
			teamsString = teamsString + `\nTeam 5: <@${team5.join('>, <@')}>`;
		}

		let sentMessage = await interaction.editReply(`<@${commandUser.userId}> wants to play a bingo match:${teamsString}. (SR: ${Math.round(lowerstarrating * 100) / 100}-${Math.round(higherstarrating * 100) / 100}*)\nReact with ✅ to accept.\nReact with ❌ to decline.`);

		let pingMessage = await interaction.channel.send(`<@${uniqueUsers.join('>, <@')}>`);
		await sentMessage.react('✅');
		await sentMessage.react('❌');
		pingMessage.delete();

		let responded = false;
		let accepted = [];
		let declined = false;
		let decliner = null;

		const collector = sentMessage.createReactionCollector({ time: 300000 });

		collector.on('collect', (reaction, user) => {
			if (reaction.emoji.name === '✅' && [...team1, ...team2, ...team3, ...team4, ...team5].includes(user.id)) {
				if (!accepted.includes(user.id)) {
					accepted.push(user.id);

					if (accepted.length === team1.length + team2.length + team3.length + team4.length + team5.length) {
						collector.stop();
					}
				}
			} else if (reaction.emoji.name === '❌' && [...team1, ...team2, ...team3, ...team4, ...team5].includes(user.id)) {
				decliner = user.id;
				collector.stop();
			}
		});

		collector.on('end', () => {
			if (accepted.length < team1.length + team2.length + team3.length + team4.length + team5.length) {
				declined = true;
			}
			responded = true;
		});

		while (!responded) {
			await pause(1000);
		}

		sentMessage.reactions.removeAll().catch(() => { });

		if (declined) {
			if (decliner) {
				return await interaction.editReply(`<@${decliner}> declined.`);
			} else {
				return await interaction.editReply('Someone didn\'t respond in time.');
			}
		}

		await interaction.editReply('Generating map pool...');

		// Get the map pool
		let mappool = [];

		let beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				mods: 0,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: lowerstarrating,
						[Op.lte]: higherstarrating,
					}
				},
				drainLength: {
					[Op.and]: {
						[Op.gte]: 30,
						[Op.lte]: 300,
					}
				},
				usedOften: true,
			},
		});

		// Add 25 random beatmaps to the mappool
		for (let i = 0; i < 25 && beatmaps.length; i++) {
			let index = Math.floor(Math.random() * beatmaps.length);
			let randomBeatmap = beatmaps[index];
			mappool.push(randomBeatmap);
			beatmaps.splice(index, 1);
		}

		beatmaps = null;

		let lastRefresh = { date: new Date(), lastScore: new Date() };

		let reply = `The bingo match has started!\n\nPlay the maps without \`NF\`, \`HT\`, \`Score v2\`, \`Relax\` and \`Autopilot\` to claim a map.\nThe minimum requirement to claim a map is: \`${requirement}\`\nYou can claim a map for your own team by beating the achieved score on the map!`;

		reply = reply + teamsString;

		await interaction.editReply(reply);

		reply = '|------------------------------------------------------------------------|\n|';

		for (let i = 0; i < mappool.length; i++) {
			reply = reply + `  [${mappool[i].starRating.toFixed(2)}* - ${Math.floor(mappool[i].drainLength / 60).toString().padStart(1, '0')}:${(mappool[i].drainLength % 60).toString().padStart(2, '0')}](<https://osu.ppy.sh/b/${mappool[i].beatmapId}>)  |`;
			if (i % 5 === 4) {
				reply = reply + '\n|------------------------------------------------------------------------|\n| ';
			}
		}

		// Remove the last |
		reply = reply.slice(0, -2);

		await interaction.followUp(reply);

		interaction.client.bingoMatches++;

		let message = await interaction.channel.send('Creating the bingo card...');

		await refreshMessage(message, mappool, lastRefresh);

		let matchStart = new Date();

		await message.react('🔄');

		// Refresh the message when the refresh button is pressed
		const refreshCollector = message.createReactionCollector();

		refreshCollector.on('collect', async (reaction, user) => {
			if (reaction.emoji.name === '🔄' && allUsers.includes(user.id)) {
				await refreshStandings(message, mappool, everyUser, matchStart, requirement, team1, team2, team3, team4, team5, lastRefresh);
			}

			// Remove the reaction unless its the bot
			if (user.id !== interaction.client.user.id) {
				reaction.users.remove(user.id);
			}

			let winningTeam = await checkWin(mappool);
			if (winningTeam) {
				refreshCollector.stop();
				message.reactions.removeAll().catch(() => { });
			}
		});

		// Refresh the message every 30 seconds
		let interval = setInterval(async () => {
			if (lastRefresh.date.getTime() + 30000 < new Date().getTime()) {
				await refreshStandings(message, mappool, everyUser, matchStart, requirement, team1, team2, team3, team4, team5, lastRefresh);

				let winningTeam = await checkWin(mappool);
				if (winningTeam) {
					refreshCollector.stop();
					message.reactions.removeAll().catch(() => { });

					//Stop the interval
					clearInterval(interval);
					interaction.client.bingoMatches--;
				} else if (lastRefresh.lastScore.getTime() + 1800000 < new Date().getTime()) {
					// Stop the interval if the match has been going on for more than 30 minutes without scores
					refreshCollector.stop();
					message.reactions.removeAll().catch(() => { });

					//Stop the interval
					clearInterval(interval);
					interaction.client.bingoMatches--;
				}
			}
		}, 5000);
	},
};

async function refreshMessage(message, mappool, lastRefresh) {
	lastRefresh.date = new Date();
	let reply = `\n\nLast updated: <t:${Math.floor(lastRefresh.date.getTime() / 1000)}:R>`;

	const canvasWidth = 1280;
	const canvasHeight = 1280;

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Get context and load the image
	const ctx = canvas.getContext('2d');

	const background = await Canvas.loadImage('./other/osu-background.png');

	for (let i = 0; i < canvas.height / background.height; i++) {
		for (let j = 0; j < canvas.width / background.width; j++) {
			ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
		}
	}

	// Draw the grid of maps
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 5; j++) {
			try {
				let beatmapImage = await getMapListCover(mappool[i * 5 + j].beatmapsetId, mappool[i * 5 + j].beatmapId);
				ctx.drawImage(beatmapImage, 5 + (5 + 250) * j, 5 + (5 + 250) * i, 250, 250);
			} catch (e) {
				//Nothing
			}

			// Draw a border around the map
			if (mappool[i * 5 + j].team) {
				if (mappool[i * 5 + j].team === 'Team 1') {
					ctx.strokeStyle = '#FF0000';
				} else if (mappool[i * 5 + j].team === 'Team 2') {
					ctx.strokeStyle = '#0000FF';
				} else if (mappool[i * 5 + j].team === 'Team 3') {
					ctx.strokeStyle = '#00FF00';
				} else if (mappool[i * 5 + j].team === 'Team 4') {
					ctx.strokeStyle = '#FFFF00';
				} else if (mappool[i * 5 + j].team === 'Team 5') {
					ctx.strokeStyle = '#FF00FF';
				}
				ctx.lineWidth = 30;
				ctx.strokeRect(20 + (5 + 250) * j, 20 + (5 + 250) * i, 220, 220);
			}
		}
	}

	let winningTeam = await checkWin(mappool);
	if (winningTeam) {
		reply = `**${winningTeam} has won!**\n\n Match finished: <t:${Math.floor(lastRefresh.date.getTime() / 1000)}:f>`;
		// Draw the diagonals
		if (mappool[0].team &&
			mappool[0].team === mappool[6].team &&
			mappool[0].team === mappool[12].team &&
			mappool[0].team === mappool[18].team &&
			mappool[0].team === mappool[24].team) {

			// Draw the line
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 30;
			ctx.beginPath();
			ctx.moveTo(130, 130);
			ctx.lineTo(1280 - 130, 1280 - 130);
			ctx.stroke();
		}

		if (mappool[4].team &&
			mappool[4].team === mappool[8].team &&
			mappool[4].team === mappool[12].team &&
			mappool[4].team === mappool[16].team &&
			mappool[4].team === mappool[20].team) {

			// Draw the line
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 30;
			ctx.beginPath();
			ctx.moveTo(1280 - 130, 130);
			ctx.lineTo(130, 1280 - 130);
			ctx.stroke();
		}

		// Draw the verticals
		for (let i = 0; i < 5; i++) {
			if (mappool[i].team &&
				mappool[i].team === mappool[i + 5].team &&
				mappool[i].team === mappool[i + 10].team &&
				mappool[i].team === mappool[i + 15].team &&
				mappool[i].team === mappool[i + 20].team) {

				// Draw the line
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 30;
				ctx.beginPath();
				ctx.moveTo(130 + i * 255, 130);
				ctx.lineTo(130 + i * 255, 1280 - 130);
				ctx.stroke();
			}
		}

		// Draw the horizontals
		for (let i = 0; i < 25; i += 5) {
			if (mappool[i].team &&
				mappool[i].team === mappool[i + 1].team &&
				mappool[i].team === mappool[i + 2].team &&
				mappool[i].team === mappool[i + 3].team &&
				mappool[i].team === mappool[i + 4].team) {

				// Draw the line
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 30;
				ctx.beginPath();
				ctx.moveTo(130, 130 + (i * 255) / 5);
				ctx.lineTo(1280 - 130, 130 + (i * 255) / 5);
				ctx.stroke();
			}
		}
	}

	const bingoCard = new Discord.MessageAttachment(canvas.toBuffer(), 'bingo.png');
	await message.fetch();
	await message.edit({ content: reply, files: [bingoCard] });
}

async function refreshStandings(message, mappool, everyUser, matchStart, requirement, team1, team2, team3, team4, team5, lastRefresh) {

	lastRefresh.date = new Date();

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let winningTeam = checkWin(mappool);

	for (let i = 0; i < everyUser.length && !winningTeam; i++) {
		await osuApi.getUserRecent({ u: everyUser[i].osuUserId, m: 0, limit: 10 })
			.then(async (scores) => {
				for (let j = 0; j < scores.length && !winningTeam; j++) {
					let scoreDate = new Date(scores[j].raw_date);
					scoreDate.setUTCMinutes(scoreDate.getUTCMinutes() - new Date().getTimezoneOffset());

					if (scoreDate > matchStart) {
						for (let k = 0; k < mappool.length && !winningTeam; k++) {
							if (mappool[k].beatmapId === scores[j].beatmapId) {
								if (requirement === 'S' && (scores[j].rank.startsWith('S') || scores[j].rank.startsWith('X'))
									|| requirement === 'A' && (scores[j].rank === 'A' || scores[j].rank.startsWith('S') || scores[j].rank.startsWith('X'))
									|| requirement === 'Pass' && scores[j].rank !== 'F') {
									if (!getMods(scores[j].raw_mods).includes('NF') && !getMods(scores[j].raw_mods).includes('HT')) {
										if (mappool[k].score) {
											if (mappool[k].score < Number(scores[j].score)) {
												mappool[k].score = Number(scores[j].score);
												mappool[k].achievedCombo = scores[j].maxCombo;
												if (getMods(scores[j].raw_mods).length === 0) {
													mappool[k].mods = 'NM';
												} else {
													mappool[k].mods = getMods(scores[j].raw_mods).join('');
												}

												// Get the players team
												if (team1.includes(everyUser[i].userId)) {
													mappool[k].team = 'Team 1';
												} else if (team2.includes(everyUser[i].userId)) {
													mappool[k].team = 'Team 2';
												} else if (team3.includes(everyUser[i].userId)) {
													mappool[k].team = 'Team 3';
												} else if (team4.includes(everyUser[i].userId)) {
													mappool[k].team = 'Team 4';
												} else if (team5.includes(everyUser[i].userId)) {
													mappool[k].team = 'Team 5';
												}

												await mappool[k].message.fetch();
												await mappool[k].message.delete();
												mappool[k].message = await message.channel.send(`<@${everyUser[i].userId}> (${mappool[k].team}) just reclaimed map ${k + 1}: \`${mappool[k].artist} - ${mappool[k].title} [${mappool[k].difficulty}] (${mappool[k].starRating.toFixed(2)}* - ${Math.floor(mappool[k].drainLength / 60).toString().padStart(1, '0')}:${(mappool[k].drainLength % 60).toString().padStart(2, '0')})\` with \`${humanReadable(mappool[k].score)} score; ${humanReadable(mappool[k].achievedCombo)}/${humanReadable(mappool[k].maxCombo)} combo; ${getMods(mappool[k].mods)}\`!`);
												lastRefresh.lastScore = new Date();
											}
										} else {
											mappool[k].score = Number(scores[j].score);
											mappool[k].achievedCombo = scores[j].maxCombo;
											if (getMods(scores[j].raw_mods).length === 0) {
												mappool[k].mods = 'NM';
											} else {
												mappool[k].mods = getMods(scores[j].raw_mods).join('');
											}

											// Get the players team
											if (team1.includes(everyUser[i].userId)) {
												mappool[k].team = 'Team 1';
											} else if (team2.includes(everyUser[i].userId)) {
												mappool[k].team = 'Team 2';
											} else if (team3.includes(everyUser[i].userId)) {
												mappool[k].team = 'Team 3';
											} else if (team4.includes(everyUser[i].userId)) {
												mappool[k].team = 'Team 4';
											} else if (team5.includes(everyUser[i].userId)) {
												mappool[k].team = 'Team 5';
											}

											mappool[k].message = await message.channel.send(`<@${everyUser[i].userId}> (${mappool[k].team}) just claimed map ${k + 1}: \`${mappool[k].artist} - ${mappool[k].title} [${mappool[k].difficulty}] (${mappool[k].starRating.toFixed(2)}* - ${Math.floor(mappool[k].drainLength / 60).toString().padStart(1, '0')}:${(mappool[k].drainLength % 60).toString().padStart(2, '0')})\` with \`${humanReadable(mappool[k].score)} score; ${humanReadable(mappool[k].achievedCombo)}/${humanReadable(mappool[k].maxCombo)} combo; ${getMods(mappool[k].mods)}\`!`);
											lastRefresh.lastScore = new Date();
										}

										winningTeam = checkWin(mappool);
										if (winningTeam) {
											// End the game
											await message.channel.send(`${winningTeam} has won the game!`);
											break;
										}
									}
								}
							}
						}
					}
				}
			})
			.catch(err => {
				if (err.message !== 'Not found') {
					console.error(err);
				}
			});

		await pause(1000);
	}

	await refreshMessage(message, mappool, lastRefresh);

	lastRefresh.date = new Date();
}

function checkWin(mappool) {
	// Check if a team has a line
	// Check the diagonals
	if (mappool[0].team &&
		mappool[0].team === mappool[6].team &&
		mappool[0].team === mappool[12].team &&
		mappool[0].team === mappool[18].team &&
		mappool[0].team === mappool[24].team) {
		return mappool[0].team;
	}

	if (mappool[4].team &&
		mappool[4].team === mappool[8].team &&
		mappool[4].team === mappool[12].team &&
		mappool[4].team === mappool[16].team &&
		mappool[4].team === mappool[20].team) {
		return mappool[4].team;
	}

	// Check the verticals
	for (let i = 0; i < 5; i++) {
		if (mappool[i].team &&
			mappool[i].team === mappool[i + 5].team &&
			mappool[i].team === mappool[i + 10].team &&
			mappool[i].team === mappool[i + 15].team &&
			mappool[i].team === mappool[i + 20].team) {
			return mappool[i].team;
		}
	}

	// Check the horizontals
	for (let i = 0; i < 25; i += 5) {
		if (mappool[i].team &&
			mappool[i].team === mappool[i + 1].team &&
			mappool[i].team === mappool[i + 2].team &&
			mappool[i].team === mappool[i + 3].team &&
			mappool[i].team === mappool[i + 4].team) {
			return mappool[i].team;
		}
	}

	return false;
}
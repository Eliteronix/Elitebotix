const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { logDatabaseQueries, getOsuUserServerMode, populateMsgFromInteraction, pause, getMessageUserDisplayname, getIDFromPotentialOsuLink, getUserDuelStarRating, createLeaderboard, getOsuDuelLeague, createDuelMatch, updateQueueChannels, getDerankStats, humanReadable, getOsuPlayerName } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');
const { leaderboardEntriesPerPage } = require('../config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-duel',
	aliases: ['osu-quickmatch'],
	description: 'Lets you play a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use `_` instead of spaces; Use `--b` for bancho / `--r` for ripple; Use `--s`/`--t`/`--c`/`--m` for modes)',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	//args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('Please use the / command `/osu-duel`');
		}
		if (interaction) {
			if (interaction.options._subcommand === 'match1v1' || interaction.options._subcommand === 'match2v2' || interaction.options._subcommand === 'match3v3' || interaction.options._subcommand === 'match4v4') {
				try {
					await interaction.deferReply();
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					return;
				}

				msg = await populateMsgFromInteraction(interaction);

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

				// Get the teammates
				let teammates = [];

				if (interaction.options.getUser('teammate')) {
					teammates.push(interaction.options.getUser('teammate').id);
				}

				if (interaction.options.getUser('firstteammate')) {
					teammates.push(interaction.options.getUser('firstteammate').id);
				}

				if (interaction.options.getUser('secondteammate')) {
					teammates.push(interaction.options.getUser('secondteammate').id);
				}

				if (interaction.options.getUser('thirdteammate')) {
					teammates.push(interaction.options.getUser('thirdteammate').id);
				}

				// Get the opponents
				let opponents = [];

				if (interaction.options.getUser('opponent')) {
					opponents.push(interaction.options.getUser('opponent').id);
				}

				if (interaction.options.getUser('firstopponent')) {
					opponents.push(interaction.options.getUser('firstopponent').id);
				}

				if (interaction.options.getUser('secondopponent')) {
					opponents.push(interaction.options.getUser('secondopponent').id);
				}

				if (interaction.options.getUser('thirdopponent')) {
					opponents.push(interaction.options.getUser('thirdopponent').id);
				}

				if (interaction.options.getUser('fourthopponent')) {
					opponents.push(interaction.options.getUser('fourthopponent').id);
				}

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect:<username>`.');
				}

				//Cross check that commandUser.userId, teammates and opponents are all unique
				const allUsers = [commandUser.userId, ...teammates, ...opponents];
				const uniqueUsers = [...new Set(allUsers)];
				const everyUser = [];

				if (allUsers.length !== uniqueUsers.length) {
					return await interaction.editReply('You can\'t play a match with the same user twice');
				}

				// Collect the star ratings to calculate the average & update the duel ratings for the users
				const starRatings = [];

				for (let i = 0; i < allUsers.length; i++) {
					let starRating = 4;
					let discordUser = null;

					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers');
					discordUser = await DBDiscordUsers.findOne({
						where: {
							userId: allUsers[i],
							osuVerified: true
						}
					});

					if (discordUser && discordUser.osuUserId) {
						try {
							await interaction.editReply(`Processing Duel Rating for ${discordUser.osuName}...`);
							starRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
						} catch (e) {
							if (e !== 'No standard plays') {
								console.log(e);
							}
						}
						everyUser.push(discordUser);
						starRatings.push(starRating.total);
					} else {
						return await interaction.editReply(`<@${allUsers[i]}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using \`/osu-link connect:<username>\`.`);
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

				let sentMessage = await interaction.editReply(`<@${commandUser.userId}> wants to play a match with <@${teammates.join('>, <@')}> against <@${opponents.join('>, <@')}>. (SR: ${Math.round(averageStarRating * 100) / 100}*)\nReact with ✅ to accept.\nReact with ❌ to decline.`.replace('with <@> ', ''));

				let pingMessage = await interaction.channel.send(`<@${teammates.join('>, <@')}>, <@${opponents.join('>, <@')}>`.replace('<@>, ', ''));
				await sentMessage.react('✅');
				await sentMessage.react('❌');
				pingMessage.delete();

				let responded = false;
				let accepted = [];
				let declined = false;
				let decliner = null;

				const collector = sentMessage.createReactionCollector({ time: 120000 });

				collector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '✅' && [...teammates, ...opponents].includes(user.id)) {
						if (!accepted.includes(user.id)) {
							accepted.push(user.id);

							if (accepted.length === teammates.length + opponents.length) {
								collector.stop();
							}
						}
					} else if (reaction.emoji.name === '❌' && [...teammates, ...opponents].includes(user.id)) {
						decliner = user.id;
						collector.stop();
					}
				});

				collector.on('end', () => {
					if (accepted.length < teammates.length + opponents.length) {
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

				//Remove the users from the queue
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
			} else if (interaction.options._subcommand === 'rating') {
				let processingMessage = null;
				if (interaction.id) {
					try {
						await interaction.deferReply();
					} catch (error) {
						if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
							console.error(error);
						}
						return;
					}
				} else {
					let playerName = await getOsuPlayerName(interaction.options._hoistedOptions[0].value);
					processingMessage = await interaction.channel.send(`Processing league ratings for ${playerName}...`);
				}

				let osuUser = {
					id: null,
					name: null,
				};

				let username = null;
				let historical = null;

				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'username') {
						username = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'historical') {
						historical = parseInt(interaction.options._hoistedOptions[i].value);
					}
				}

				if (historical === null) {
					historical = 1;
				}

				if (username) {
					//Get the user by the argument given
					if (username.startsWith('<@') && username.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating');
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: username.replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${username.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect:<username>\`.`, ephemeral: true });
						}
					} else {
						osuUser.name = getIDFromPotentialOsuLink(username);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.id) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					const user = await osuApi.getUser({ u: osuUser.name, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.log(err);
							}
						});

					if (!user) {
						if (interaction.id) {
							return await interaction.editReply({ content: `Could not find user \`${osuUser.name.replace(/`/g, '')}\`.`, ephemeral: true });
						} else {
							return processingMessage.edit(`Could not find user \`${osuUser.name.replace(/`/g, '')}\`.`);
						}
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				let seasonEnd = new Date();
				seasonEnd.setUTCFullYear(seasonEnd.getUTCFullYear() - 1);
				seasonEnd.setUTCMonth(11);
				seasonEnd.setUTCDate(31);
				seasonEnd.setUTCHours(23);
				seasonEnd.setUTCMinutes(59);
				seasonEnd.setUTCSeconds(59);
				seasonEnd.setUTCMilliseconds(999);

				let historicalUserDuelStarRatings = [];

				while (seasonEnd.getUTCFullYear() > 2014 && historical) {
					let historicalDataset = {
						seasonEnd: `${seasonEnd.getUTCMonth() + 1}/${seasonEnd.getUTCFullYear()}`,
						ratings: await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client, date: seasonEnd })
					};

					if (historicalUserDuelStarRatings.length === 0 && historicalDataset.ratings.total || historicalUserDuelStarRatings.length && historicalDataset.ratings.total && historicalDataset.ratings.total !== historicalUserDuelStarRatings[historicalUserDuelStarRatings.length - 1].ratings.total) {
						historicalUserDuelStarRatings.push(historicalDataset);
					}

					seasonEnd.setUTCMonth(seasonEnd.getUTCMonth() - 12);
					historical--;
				}

				const canvasWidth = 700;
				const canvasHeight = 575 + historicalUserDuelStarRatings.length * 250;

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

				//Footer
				let today = new Date().toLocaleDateString();

				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';

				ctx.textAlign = 'left';
				ctx.fillText(`UserID: ${osuUser.id}`, 10, canvas.height - 10);

				ctx.textAlign = 'right';
				ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 10, canvas.height - 10);

				//Title
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 30px comfortaa, sans-serif';
				ctx.fillText(`League Ratings for ${osuUser.name}`, 350, 40);

				//Set Duel Rating and League Rank
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 25px comfortaa, sans-serif';
				//Current Total Rating
				ctx.fillText('Current Total Rating', 475, 100);
				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								if (interaction.id) {
									return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
								} else {
									return processingMessage.edit(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
								}
							} else {
								if (interaction.id) {
									return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
								} else {
									return processingMessage.edit('The API seems to be running into errors right now.\nPlease try again later.');
								}
							}
						} else {
							await pause(15000);
						}
					}
				}

				let duelLeague = getOsuDuelLeague(userDuelStarRating.total);

				let leagueText = duelLeague.name;
				let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 400, 100, 150, 150);

				if (userDuelStarRating.provisional) {
					leagueText = 'Provisional: ' + leagueText;
				} else if (userDuelStarRating.outdated) {
					leagueText = 'Outdated: ' + leagueText;
				}

				ctx.fillText(leagueText, 475, 275);
				ctx.fillText(`(${Math.round(userDuelStarRating.total * 1000) / 1000}*)`, 475, 300);

				ctx.font = 'bold 18px comfortaa, sans-serif';

				//Current NoMod Rating
				ctx.fillText('NoMod', 100, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.noMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 50, 350, 100, 100);

				ctx.fillText(leagueText, 100, 475);
				if (userDuelStarRating.noMod !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.noMod * 1000) / 1000}*)`, 100, 500);
				}

				//Current Hidden Rating
				ctx.fillText('Hidden', 225, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hidden);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 175, 350, 100, 100);

				ctx.fillText(leagueText, 225, 475);
				if (userDuelStarRating.hidden !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.hidden * 1000) / 1000}*)`, 225, 500);
				}

				//Current HardRock Rating
				ctx.fillText('HardRock', 350, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hardRock);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 300, 350, 100, 100);

				ctx.fillText(leagueText, 350, 475);
				if (userDuelStarRating.hardRock !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.hardRock * 1000) / 1000}*)`, 350, 500);
				}

				//Current DoubleTime Rating
				ctx.fillText('DoubleTime', 475, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.doubleTime);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 425, 350, 100, 100);

				ctx.fillText(leagueText, 475, 475);
				if (userDuelStarRating.doubleTime !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}*)`, 475, 500);
				}

				//Current FreeMod Rating
				ctx.fillText('FreeMod', 600, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.freeMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 550, 350, 100, 100);

				ctx.fillText(leagueText, 600, 475);
				if (userDuelStarRating.freeMod !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.freeMod * 1000) / 1000}*)`, 600, 500);
				}

				for (let i = 0; i < historicalUserDuelStarRatings.length; i++) {
					ctx.beginPath();
					ctx.moveTo(20, 545 + i * 250);
					ctx.lineTo(680, 545 + i * 250);
					ctx.strokeStyle = 'white';
					ctx.stroke();

					//Set Duel Rating and League Rank
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.font = 'bold 20px comfortaa, sans-serif';
					//Season Total Rating
					ctx.fillText(`${historicalUserDuelStarRatings[i].seasonEnd} Total Rating`, 125, 575 + i * 250);
					let duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.total);

					let leagueText = duelLeague.name;
					let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 50, 575 + i * 250, 150, 150);

					if (historicalUserDuelStarRatings[i].ratings.provisional) {
						leagueText = 'Provisional: ' + leagueText;
					}

					ctx.fillText(leagueText, 125, 750 + i * 250, 150, 150);
					ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.total * 1000) / 1000}*)`, 125, 775 + i * 250, 150, 150);

					ctx.font = 'bold 15px comfortaa, sans-serif';

					//Season NoMod Rating
					ctx.fillText('NoMod', 287, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.noMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 250, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 287, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.noMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.noMod * 1000) / 1000}*)`, 287, 725 + i * 250);
					}

					//Season Hidden Rating
					ctx.fillText('Hidden', 377, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hidden);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 340, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 377, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hidden !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hidden * 1000) / 1000}*)`, 377, 775 + i * 250);
					}

					//Season HardRock Rating
					ctx.fillText('HardRock', 467, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hardRock);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 430, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 467, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hardRock !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hardRock * 1000) / 1000}*)`, 467, 725 + i * 250);
					}

					//Season DoubleTime Rating
					ctx.fillText('DoubleTime', 557, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.doubleTime);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 520, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 557, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.doubleTime !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.doubleTime * 1000) / 1000}*)`, 557, 775 + i * 250);
					}

					//Season FreeMod Rating
					ctx.fillText('FreeMod', 647, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.freeMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 610, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 647, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.freeMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.freeMod * 1000) / 1000}*)`, 647, 725 + i * 250);
					}
				}

				//Draw badges onto the canvas
				const badgeURLs = [];
				await fetch(`https://osu.ppy.sh/users/${osuUser.id}/osu`)
					.then(async (res) => {
						let htmlCode = await res.text();
						htmlCode = htmlCode.replace(/&quot;/gm, '"');
						const badgesRegex = /,"badges".+,"comments_count":/gm;
						const matches = badgesRegex.exec(htmlCode);
						if (matches && matches[0]) {
							const cleanedMatch = matches[0].replace(',"badges":[', '').replace('],"comments_count":', '');
							const rawBadgesArray = cleanedMatch.split('},{');
							for (let i = 0; i < rawBadgesArray.length; i++) {
								if (rawBadgesArray[i] !== '') {
									const badgeArray = rawBadgesArray[i].split('","');
									badgeURLs.push(badgeArray[2].substring(12));
								}
							}
						}
					});

				let yOffset = -2;
				if (badgeURLs.length < 6) {
					yOffset = yOffset + (6 - badgeURLs.length) * 22;
				}
				for (let i = 0; i < badgeURLs.length && i < 6; i++) {
					const badge = await Canvas.loadImage(badgeURLs[i].replace(/\\/gm, ''));
					ctx.drawImage(badge, 10, 60 + i * 44 + yOffset, 86, 40);
				}

				//Draw the Player derank rank
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: osuUser.id
					}
				});

				if (discordUser) {
					let derankStats = await getDerankStats(discordUser);

					ctx.font = 'bold 25px comfortaa, sans-serif';
					ctx.fillText(`Duel Rank: #${humanReadable(derankStats.expectedPpRankOsu)}`, 190, 287);
				}

				//Get a circle for inserting the player avatar
				ctx.beginPath();
				ctx.arc(190, 170, 80, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();

				//Draw a shape onto the main canvas
				try {
					const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${osuUser.id}`);
					ctx.drawImage(avatar, 110, 90, 160, 160);
				} catch (error) {
					const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
					ctx.drawImage(avatar, 110, 90, 160, 160);
				}

				//Create as an attachment
				const leagueRatings = new Discord.MessageAttachment(canvas.toBuffer(), `osu-league-ratings-${osuUser.id}.png`);

				let sentMessage = null;

				if (interaction.id) {
					sentMessage = await interaction.editReply({ content: 'The data is based on matches played using `/osu-duel match` and any other tournament matches.\nThe values are supposed to show a star rating where a player will get around 350k average score with Score v2.', files: [leagueRatings] });
				} else {
					processingMessage.delete();
					sentMessage = await interaction.channel.send({ content: 'The data is based on matches played using `/osu-duel match` and any other tournament matches.\nThe values are supposed to show a star rating where a player will get around 350k average score with Score v2.', files: [leagueRatings] });
				}
				await sentMessage.react('👤');
				await sentMessage.react('🥇');
				await sentMessage.react('📈');
				if (userDuelStarRating.noMod !== null
					|| userDuelStarRating.hidden !== null
					|| userDuelStarRating.hardRock !== null
					|| userDuelStarRating.doubleTime !== null
					|| userDuelStarRating.freeMod !== null) {
					await sentMessage.react('🆚');
					await sentMessage.react('📊');
				}
				return;
			} else if (interaction.options._subcommand === 'rating-leaderboard') {
				if (interaction.id) {
					interaction.reply('Processing leaderboard...');
				}

				let osuAccounts = [];

				if (interaction.guild) {
					await interaction.guild.members.fetch()
						.then(async (guildMembers) => {
							const members = [];
							guildMembers.each(member => members.push(member));
							for (let i = 0; i < members.length; i++) {
								logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-leaderboard');
								const discordUser = await DBDiscordUsers.findOne({
									where: {
										userId: members[i].id,
										osuUserId: {
											[Op.not]: null,
										},
										osuDuelStarRating: {
											[Op.not]: null,
										}
									},
								});

								if (discordUser) {
									osuAccounts.push({
										userId: discordUser.userId,
										osuUserId: discordUser.osuUserId,
										osuName: discordUser.osuName,
										osuVerified: discordUser.osuVerified,
										osuDuelStarRating: parseFloat(discordUser.osuDuelStarRating),
									});
								}
							}
						})
						.catch(err => {
							console.log(err);
						});
				} else {
					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-leaderboard 2');
					const discordUsers = await DBDiscordUsers.findAll({
						where: {
							osuUserId: {
								[Op.not]: null,
							},
							osuDuelStarRating: {
								[Op.not]: null,
							}
						},
					});

					for (let i = 0; i < discordUsers.length; i++) {
						osuAccounts.push({
							userId: discordUsers[i].userId,
							osuUserId: discordUsers[i].osuUserId,
							osuName: discordUsers[i].osuName,
							osuVerified: discordUsers[i].osuVerified,
							osuDuelStarRating: parseFloat(discordUsers[i].osuDuelStarRating),
						});
					}
				}

				quicksortDuelStarRating(osuAccounts);

				let leaderboardData = [];

				let messageToAuthor = '';
				let authorPlacement = 0;

				for (let i = 0; i < osuAccounts.length; i++) {
					if (interaction.user.id === osuAccounts[i].userId) {
						messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
						authorPlacement = i + 1;
					}

					if (interaction.guild) {
						const member = await interaction.guild.members.fetch(osuAccounts[i].userId);

						let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

						if (member.nickname) {
							userDisplayName = `${member.nickname} / ${userDisplayName}`;
						}

						let verified = 'x';

						if (osuAccounts[i].osuVerified) {
							verified = '✔';
						}

						let dataset = {
							name: userDisplayName,
							value: `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}* | ${verified} ${osuAccounts[i].osuName}`,
							color: getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).color,
						};

						leaderboardData.push(dataset);
					} else {
						let dataset = {
							name: osuAccounts[i].osuName,
							value: `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}*`,
							color: getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).color,
						};

						leaderboardData.push(dataset);
					}
				}

				let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

				let page;

				if (interaction.options._hoistedOptions && interaction.options._hoistedOptions[0] && interaction.options._hoistedOptions[0].value) {
					page = Math.abs(parseInt(interaction.options._hoistedOptions[0].value));
				}

				if (!page && leaderboardData.length > 300) {
					page = 1;
					if (authorPlacement) {
						page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
					}
				}

				if (totalPages === 1) {
					page = null;
				}

				let guildName = 'Global';

				if (interaction.guild) {
					guildName = `${interaction.guild.name}'s`;
				}

				let filename = `osu-duelrating-leaderboard-${interaction.user.id}-${guildName}.png`;

				if (page) {
					filename = `osu-duelrating-leaderboard-${interaction.user.id}-${guildName}-page${page}.png`;
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${guildName} osu! Duel Star Rating leaderboard`, filename, page);

				//Send attachment
				let leaderboardMessage = await interaction.channel.send({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`/osu-link connect:<username>\` to connect your osu! account.\nData is being updated once a day or when \`/osu-duel rating username:[username]\` is being used.`, files: [attachment] });

				if (page) {
					if (page > 1) {
						await leaderboardMessage.react('◀️');
					}

					if (page < totalPages) {
						await leaderboardMessage.react('▶️');
					}
				}
			} else if (interaction.options._subcommand === 'data') {
				await interaction.deferReply({ ephemeral: true });
				let osuUser = {
					id: null,
					name: null,
				};

				if (interaction.options._hoistedOptions[0]) {
					//Get the user by the argument given
					if (interaction.options._hoistedOptions[0].value.startsWith('<@') && interaction.options._hoistedOptions[0].value.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers data');
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: interaction.options._hoistedOptions[0].value.replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${interaction.options._hoistedOptions[0].value.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect:<username>\`.`, ephemeral: true });
						}
					} else {
						osuUser.id = getIDFromPotentialOsuLink(interaction.options._hoistedOptions[0].value);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.name) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					const user = await osuApi.getUser({ u: osuUser.id, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.log(err);
							}
						});

					if (!user) {
						return await interaction.editReply({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
							} else {
								return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
							}
						} else {
							await pause(15000);
						}
					}
				}

				//Create all the output files
				let files = [];

				let stepData = [
					userDuelStarRating.stepData.NM,
					userDuelStarRating.stepData.HD,
					userDuelStarRating.stepData.HR,
					userDuelStarRating.stepData.DT,
					userDuelStarRating.stepData.FM
				];

				for (let i = 0; i < stepData.length; i++) {
					quicksortStep(stepData[i]);

					for (let j = 0; j < stepData[i].length; j++) {
						stepData[i][j] = `${stepData[i][j].step.toFixed(1)}*: ${(Math.round(stepData[i][j].averageWeight * 1000) / 1000).toFixed(3)} weight`;
					}

					if (i === 0) {
						stepData[i] = 'NM Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 1) {
						stepData[i] = 'HD Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 2) {
						stepData[i] = 'HR Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 3) {
						stepData[i] = 'DT Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 4) {
						stepData[i] = 'FM Starrating Weights:\n' + stepData[i].join('\n');
					}
				}

				//Get the multiplayer matches
				let multiScores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				let multiMatches = [];
				let multiMatchIds = [];

				for (let i = 0; i < multiScores.length; i++) {
					for (let j = 0; j < multiScores[i].length; j++) {
						if (!multiMatchIds.includes(multiScores[i][j].matchId)) {
							multiMatches.push({ matchId: multiScores[i][j].matchId, matchName: multiScores[i][j].matchName, matchStartDate: multiScores[i][j].matchStartDate });
							multiMatchIds.push(multiScores[i][j].matchId);
						}
					}
				}

				quicksortMatchId(multiMatches);

				for (let i = 0; i < multiMatches.length; i++) {
					try {
						multiMatches[i] = `${(multiMatches[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${multiMatches[i].matchStartDate.getUTCFullYear()} - ${multiMatches[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiMatches[i].matchId}`;
					} catch (e) {
						multiMatches[i] = 'Error';
						console.log(e, multiMatches[i]);
					}
				}

				let scores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				for (let i = 0; i < scores.length; i++) {
					quicksortScore(scores[i]);

					for (let j = 0; j < scores[i].length; j++) {
						let outlierText = '';
						if (scores[i][j].outlier) {
							outlierText = ' [outlier - not counted]';
						}
						scores[i][j] = `${(scores[i][j].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scores[i][j].matchStartDate.getUTCFullYear()} - ${Math.round(scores[i][j].score)} points (${(Math.round(scores[i][j].weight * 1000) / 1000).toFixed(3)}): ${(Math.round(scores[i][j].starRating * 100) / 100).toFixed(2)}* | Expected SR: ${scores[i][j].expectedRating.toFixed(2)} | https://osu.ppy.sh/b/${scores[i][j].beatmapId}${outlierText}`;
					}

					if (i === 0) {
						scores[i] = 'NM Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 1) {
						scores[i] = 'HD Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 2) {
						scores[i] = 'HR Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 3) {
						scores[i] = 'DT Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 4) {
						scores[i] = 'FM Scores & Weights:\n' + scores[i].join('\n');
					}
				}

				// eslint-disable-next-line no-undef
				scores = new Discord.MessageAttachment(Buffer.from(scores.join('\n\n'), 'utf-8'), `osu-duel-scores-and-weights-${osuUser.id}.txt`);
				files.push(scores);

				// eslint-disable-next-line no-undef
				stepData = new Discord.MessageAttachment(Buffer.from(stepData.join('\n\n'), 'utf-8'), `osu-duel-star-rating-group-weights-${osuUser.id}.txt`);
				files.push(stepData);

				// eslint-disable-next-line no-undef
				multiMatches = new Discord.MessageAttachment(Buffer.from(multiMatches.join('\n'), 'utf-8'), `osu-duel-multimatches-${osuUser.id}.txt`);
				files.push(multiMatches);

				let explaination = [];
				explaination.push('**Hello!**');
				explaination.push('You will likely be overwhelmed by all the info that just popped up.');
				explaination.push('If you are just here to get a rough explaination of how the calculation works, here is a tldr:');
				explaination.push('');
				explaination.push('**TL;DR:**');
				explaination.push('The star rating is calculated based on your last 35 tournament score v2 scores for each modpool.');
				explaination.push('You can see the scores taken into account in the first file attached.');
				explaination.push('You can see the starratings and how they are evaluated in the second file. (The higher the weight the more effect the star rating has on the overall star rating)');
				explaination.push('You can see the matches where the scores are from in the third file.');
				explaination.push('');
				explaination.push('**In Depth Explaination:**');
				explaination.push('Relevant Star Rating Change:');
				explaination.push('HD maps always get a star rating buff in the calculations. These depend on the AR of the map.');
				explaination.push('AR7.5 HD will count as a +0.75 SR buff (maximum) and AR9 will count as a +0.2 SR buff (minimum). Everything in between is rising linearly.');
				explaination.push('');
				explaination.push('1. Step:');
				explaination.push('The bot grabs the last 35 tournament score v2 scores for each modpool. (Limited to unique ranked maps)');
				explaination.push('The limit exists to not evaluate the same maps twice, to limit the API calls to some extend and to get relatively recent data without losing accuracy due to limiting it to a timestamp.');
				explaination.push('');
				explaination.push('2. Step:');
				explaination.push('After doing some adaptions to counter mods effects on the score each score will be assigned a weight using a bell curve with the highest weight at 350k; dropping lower on both sides to not get too hard and not too easy maps.');
				explaination.push('You can find the weight graph here: <https://www.desmos.com/calculator/netnkpeupv>');
				explaination.push('');
				await interaction.editReply({ content: explaination.join('\n'), ephemeral: true });
				explaination = [];
				explaination.push('3. Step:');
				explaination.push('Each score and its weight will be put into a star rating step. (A 5.0 map will be put into the 4.8, 4.9, 5.0, 5.1 and 5.2 steps)');
				explaination.push('Each step will average the weights of their scores and will calculate a weighted star rating (e.g. 4.8 stars with an average weight of 0.5 will be a weighted star rating of 2.4)');
				explaination.push('The weighted star ratings of each step will now be summed up and divided by all the average weights of each step summed up.');
				explaination.push('');
				explaination.push('4. Step:');
				explaination.push('The last 35 scores from that modpool will now once again effect the star rating.');
				explaination.push('For each score there will be an expected score calculated using this formula which is based on the starrating itself: <https://www.desmos.com/calculator/oae69zr9ze> (cap of 950k upwards | 20k downwards)');
				explaination.push('The difference between the score and the expected score will now be calculated.');
				explaination.push('The difference now decides the star rating change using this formula: <https://www.desmos.com/calculator/zlckiq6hgx> (cap of 1*)');
				explaination.push('Each star rating change will now be applied to the previously calculated star rating using a weight. (1x for the most recent score, 0.98 for the second most recent score, 0.96 for the third most recent score, etc.)');
				explaination.push('After all scores applied their effect on the starrating this will result in the final modpool star rating.');
				explaination.push('');
				explaination.push('5. Step:');
				explaination.push('The total star rating will be calculated relative to how many maps of each modpool were played in the last 100 score v2 tournament scores.');
				explaination.push('This will allow a player that mainly plays HD to have their HD modpool star rating have more impact on the total star rating than a player that mostly plays NM. This is being done because in a real match the HD player is more likely to play HD than the NM player and will therefore be more affected by their HD skill.');
				explaination.push('');
				explaination.push('**What does Provisional mean?**');
				explaination.push('A provisional rank is given if there is barely enough data to give a relatively reliable star rating.');
				explaination.push('');
				explaination.push('**What does outdated mean?**');
				explaination.push('An outdated rank means that there have not been equal to or more than 5 scores in the past 6 months.');

				return await interaction.followUp({ content: explaination.join('\n'), files: files, ephemeral: true });
			} else if (interaction.options._subcommand === 'rating-spread') {
				await interaction.deferReply();

				const width = 1500; //px
				const height = 750; //px
				const canvasRenderService = new ChartJSNodeCanvas({ width, height });

				let labels = ['Bronze 1', 'Bronze 2', 'Bronze 3', 'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3', 'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3', 'Master'];
				let colors = ['#F07900', '#F07900', '#F07900', '#B5B5B5', '#B5B5B5', '#B5B5B5', '#FFEB47', '#FFEB47', '#FFEB47', '#1DD9A5', '#1DD9A5', '#1DD9A5', '#49B0FF', '#49B0FF', '#49B0FF', '#FFAEFB'];
				let leagueAmounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

				let osuAccounts = [];

				if (interaction.guild) {
					await interaction.guild.members.fetch()
						.then(async (guildMembers) => {
							const members = [];
							guildMembers.each(member => members.push(member));
							for (let i = 0; i < members.length; i++) {
								logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-spread');
								const discordUser = await DBDiscordUsers.findOne({
									where: {
										userId: members[i].id,
										osuUserId: {
											[Op.not]: null,
										},
										osuDuelStarRating: {
											[Op.not]: null,
										}
									},
								});

								if (discordUser) {
									osuAccounts.push({
										userId: discordUser.userId,
										osuUserId: discordUser.osuUserId,
										osuName: discordUser.osuName,
										osuVerified: discordUser.osuVerified,
										osuDuelStarRating: parseFloat(discordUser.osuDuelStarRating),
									});
								}
							}
						})
						.catch(err => {
							console.log(err);
						});
				} else {
					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-spread 2');
					const discordUsers = await DBDiscordUsers.findAll({
						where: {
							osuUserId: {
								[Op.not]: null,
							},
							osuDuelStarRating: {
								[Op.not]: null,
							}
						},
					});

					for (let i = 0; i < discordUsers.length; i++) {
						osuAccounts.push({
							userId: discordUsers[i].userId,
							osuUserId: discordUsers[i].osuUserId,
							osuName: discordUsers[i].osuName,
							osuVerified: discordUsers[i].osuVerified,
							osuDuelStarRating: parseFloat(discordUsers[i].osuDuelStarRating),
						});
					}
				}

				for (let i = 0; i < osuAccounts.length; i++) {
					leagueAmounts[labels.indexOf(getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).name)]++;
				}

				let finalAmounts = [];
				for (let i = 0; i < labels.length; i++) {
					let amountArray = [];
					for (let j = 0; j < labels.length; j++) {
						amountArray.push(0);
					}
					amountArray[i] = leagueAmounts[i];
					finalAmounts.push(amountArray);
				}

				let datasets = [];

				for (let i = 0; i < labels.length; i++) {
					datasets.push({
						label: labels[i],
						data: finalAmounts[i],
						backgroundColor: colors[i],
						fill: true,
					});
				}

				const data = {
					labels: labels,
					datasets: datasets,
				};

				const configuration = {
					type: 'bar',
					data: data,
					options: {
						plugins: {
							title: {
								display: true,
								text: 'Rating Spread',
								color: '#FFFFFF',
							},
							legend: {
								labels: {
									color: '#FFFFFF',
								}
							},
						},
						responsive: true,
						scales: {
							x: {
								stacked: true,
								title: {
									display: true,
									text: 'Time',
									color: '#FFFFFF'
								},
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
							},
							y: {
								stacked: true,
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
							}
						}
					}
				};

				const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

				const attachment = new Discord.MessageAttachment(imageBuffer, 'osu-league-spread.png');

				let guildName = 'Global';

				if (interaction.guild) {
					guildName = `${interaction.guild.name}'s`;
				}

				interaction.editReply({ content: `${guildName} osu! Duel League Rating Spread`, files: [attachment] });
			} else if (interaction.options._subcommand === 'rating-updates') {
				await interaction.deferReply({ ephemeral: true });

				let enable = false;

				if (interaction.options._hoistedOptions[0].value === true) {
					enable = true;
				}

				let discordUser = await DBDiscordUsers.findOne({
					where: {
						userId: interaction.user.id,
					},
				});

				if (!discordUser || !discordUser.osuUserId) {
					return interaction.editReply('You must link your osu! account before using this command.');
				}

				if (enable) {
					if (discordUser.osuDuelRatingUpdates) {
						return interaction.editReply('You are already receiving osu! Duel rating updates.');
					}

					discordUser.osuDuelRatingUpdates = true;
					await discordUser.save();

					return interaction.editReply('You will now receive osu! Duel rating updates.');
				}

				if (!discordUser.osuDuelRatingUpdates) {
					return interaction.editReply('You are not receiving osu! Duel rating updates.');
				}

				discordUser.osuDuelRatingUpdates = false;
				await discordUser.save();

				return interaction.editReply('You will no longer receive osu! Duel rating updates.');
			} else if (interaction.options._subcommand === 'queue1v1') {
				await interaction.deferReply({ ephemeral: true });

				msg = await populateMsgFromInteraction(interaction);

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect:<username>`.');
				}

				let existingQueueTasks = await DBProcessQueue.findAll({
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						return await interaction.editReply('You are already in the queue for a 1v1 duel.');
					}
				}

				let ownStarRating = 5;
				try {
					await interaction.editReply('Processing Duel Rating...');
					ownStarRating = await getUserDuelStarRating({ osuUserId: commandUser.osuUserId, client: interaction.client });

					ownStarRating = ownStarRating.total;
				} catch (e) {
					if (e !== 'No standard plays') {
						console.log(e);
					}
				}

				//Check again in case the cooldown had passed and it was triggered again
				existingQueueTasks = await DBProcessQueue.findAll({
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						return await interaction.editReply('You are already in the queue for a 1v1 duel.');
					}
				}

				await DBProcessQueue.create({
					guildId: 'none',
					task: 'duelQueue1v1',
					additions: `${commandUser.osuUserId};${ownStarRating};0.125`,
					date: new Date(),
					priority: 9
				});

				updateQueueChannels(interaction.client);

				return await interaction.editReply('You are now queued up for a 1v1 duel.');
			} else if (interaction.options._subcommand === 'queue1v1-leave') {
				await interaction.deferReply({ ephemeral: true });

				msg = await populateMsgFromInteraction(interaction);

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect:<username>`.');
				}

				let existingQueueTasks = await DBProcessQueue.findAll({
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						await existingQueueTasks[i].destroy();
						updateQueueChannels(interaction.client);
						return await interaction.editReply('You have been removed from the queue for a 1v1 duel.');
					}
				}

				return await interaction.editReply('You are not in the queue for a 1v1 duel.');
			}
		}
	},
};

function partitionDuelStarRating(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].osuDuelStarRating >= pivot.osuDuelStarRating) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortDuelStarRating(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionDuelStarRating(list, start, end);
		quicksortDuelStarRating(list, start, p - 1);
		quicksortDuelStarRating(list, p + 1, end);
	}
	return list;
}

function partitionStep(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].step < pivot.step) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortStep(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionStep(list, start, end);
		quicksortStep(list, start, p - 1);
		quicksortStep(list, p + 1, end);
	}
	return list;
}

function partitionScore(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].score < pivot.score) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortScore(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionScore(list, start, end);
		quicksortScore(list, start, p - 1);
		quicksortScore(list, p + 1, end);
	}
	return list;
}

function partitionMatchId(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].matchId) > parseInt(pivot.matchId)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortMatchId(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionMatchId(list, start, end);
		quicksortMatchId(list, start, p - 1);
		quicksortMatchId(list, p + 1, end);
	}
	return list;
}
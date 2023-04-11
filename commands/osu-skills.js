const Discord = require('discord.js');
const osu = require('node-osu');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers, DBOsuBeatmaps } = require('../dbObjects');
const { getIDFromPotentialOsuLink, getOsuBeatmap, getMods, getAccuracy, logDatabaseQueries, fitTextOnLeftCanvas, getScoreModpool, getUserDuelStarRating, getOsuDuelLeague, fitTextOnMiddleCanvas, getAvatar } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const Canvas = require('canvas');
const { Op } = require('sequelize');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');

module.exports = {
	name: 'osu-skills',
	description: 'Sends an info card about the skills of the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-skills')
		.setNameLocalizations({
			'de': 'osu-skills',
			'en-GB': 'osu-skills',
			'en-US': 'osu-skills',
		})
		.setDescription('Sends an info card about the skills of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die Fähigkeiten des angegebenen Spielers',
			'en-GB': 'Sends an info card about the skills of the specified player',
			'en-US': 'Sends an info card about the skills of the specified player',
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
		)
		.addBooleanOption(option =>
			option.setName('scaled')
				.setNameLocalizations({
					'de': 'skaliert',
					'en-GB': 'scaled',
					'en-US': 'scaled',
				})
				.setDescription('Should the graph be scaled by the total evaluation?')
				.setDescriptionLocalizations({
					'de': 'Soll der Graph nach der Gesamtbewertung skaliert werden?',
					'en-GB': 'Should the graph be scaled by the total evaluation?',
					'en-US': 'Should the graph be scaled by the total evaluation?',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('scores')
				.setNameLocalizations({
					'de': 'scores',
					'en-GB': 'scores',
					'en-US': 'scores',
				})
				.setDescription('Which types of scores should the graph evaluate?')
				.setDescriptionLocalizations({
					'de': 'Welche Arten von Scores sollen in den Graphen einfließen?',
					'en-GB': 'Which types of scores should the graph evaluate?',
					'en-US': 'Which types of scores should the graph evaluate?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Only Score v2', value: 'v2' },
					{ name: 'Only Score v1', value: 'v1' },
					{ name: 'All Scores', value: 'vx' },
				)
		)
		.addBooleanOption(option =>
			option.setName('tourney')
				.setNameLocalizations({
					'de': 'turnier',
					'en-GB': 'tourney',
					'en-US': 'tourney',
				})
				.setDescription('Should it only count scores from tournaments?')
				.setDescriptionLocalizations({
					'de': 'Sollen nur Turnierscores gezählt werden?',
					'en-GB': 'Should it only count scores from tournaments?',
					'en-US': 'Should it only count scores from tournaments?',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('runningaverage')
				.setNameLocalizations({
					'de': 'laufenderdurchschnitt',
					'en-GB': 'runningaverage',
					'en-US': 'runningaverage',
				})
				.setDescription('Should a running average be shown instead?')
				.setDescriptionLocalizations({
					'de': 'Soll ein laufender Durchschnitt angezeigt werden?',
					'en-GB': 'Should a running average be shown instead?',
					'en-US': 'Should a running average be shown instead?',
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

		let scaled = true;

		if (interaction.options.getBoolean('scaled') === false) {
			scaled = false;
		}

		let tourneyMatch = true;

		if (interaction.options.getBoolean('tourney') === false) {
			tourneyMatch = false;
		}

		let runningAverage = true;

		if (interaction.options.getBoolean('runningaverage') === false) {
			runningAverage = false;
		}

		let scoringType = 'v2';

		if (interaction.options.getString('scores')) {
			scoringType = interaction.options.getString('scores');
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

		if (usernames.length === 0) {//Get profile by author if no argument
			logDatabaseQueries(4, 'commands/osu-skills.js DiscordUsers 1');
			let commandUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id
				},
			});

			if (commandUser && commandUser.osuUserId) {
				getOsuSkills(interaction, commandUser.osuUserId, scaled, scoringType, tourneyMatch, runningAverage);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}
				getOsuSkills(interaction, userDisplayName, scaled, scoringType, tourneyMatch, runningAverage);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-skills.js DBDiscordUsers 2');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getOsuSkills(interaction, discordUser.osuUserId, scaled, scoringType, tourneyMatch, runningAverage);
					} else {
						await interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						continue;
					}
				} else {
					getOsuSkills(interaction, getIDFromPotentialOsuLink(usernames[i]), scaled, scoringType, tourneyMatch, runningAverage);
				}
			}
		}
	},
};

async function getOsuSkills(interaction, username, scaled, scoringType, tourneyMatch, runningAverage) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	// eslint-disable-next-line no-undef
	process.send('osu!API');
	osuApi.getUser({ u: username })
		.then(async (user) => {
			const topScores = await osuApi.getUserBest({ u: user.name, m: 0, limit: 100 })
				.catch(err => {
					if (err.message === 'Not found') {
						throw new Error('No standard plays');
					} else {
						console.error(err);
					}
				});

			let mods = [];
			let mappers = [];
			let pp = [];
			let stars = [];
			let aim = [];
			let speed = [];
			let acc = [];
			let bpm = [];

			logDatabaseQueries(4, 'commands/osu-skills.js DBOsuBeatmaps');
			let dbBeatmaps = await DBOsuBeatmaps.findAll({
				attributes: [
					'beatmapId',
					'mods',
					'starRating',
					'approvalStatus',
					'popular',
					'approachRate',
					'circleSize',
					'updatedAt',
					'maxCombo',
					'mapper',
					'aimRating',
					'speedRating',
					'bpm',
				],
				where: {
					beatmapId: topScores.map(score => score.beatmapId)
				},
			});

			for (let i = 0; i < topScores.length; i++) {
				//Add and count mods
				let modAdded = false;
				for (let j = 0; j < mods.length && !modAdded; j++) {
					if (mods[j].bits === topScores[i].raw_mods) {
						mods[j].amount++;
						modAdded = true;
					}
				}

				if (!modAdded) {
					const modObject = {
						bits: topScores[i].raw_mods,
						modsReadable: getMods(topScores[i].raw_mods).join(''),
						amount: 1
					};

					if (!modObject.modsReadable) {
						modObject.modsReadable = 'NM';
					}

					mods.push(modObject);
				}

				//Add and count mappers
				let mapperAdded = false;

				let dbBeatmap = dbBeatmaps.find(beatmap => beatmap.beatmapId === topScores[i].beatmapId && beatmap.mods === topScores[i].raw_mods);

				dbBeatmap = await getOsuBeatmap({ beatmap: dbBeatmap, beatmapId: topScores[i].beatmapId, modBits: topScores[i].raw_mods });

				for (let j = 0; j < mappers.length && !mapperAdded; j++) {
					if (mappers[j] && dbBeatmap && mappers[j].mapper === dbBeatmap.mapper) {
						mappers[j].amount++;
						mapperAdded = true;
					}
				}

				if (!mapperAdded && dbBeatmap && dbBeatmap.mapper) {
					mappers.push({
						mapper: dbBeatmap.mapper,
						amount: 1
					});
				}

				//Add pp counts
				pp.push(topScores[i].pp);

				//Add difficulty ratings
				if (dbBeatmap && dbBeatmap.starRating && parseFloat(dbBeatmap.starRating) > 0) {
					stars.push(dbBeatmap.starRating);
					aim.push(dbBeatmap.aimRating);
					speed.push(dbBeatmap.speedRating);
				}

				//Add accuracy
				acc.push(getAccuracy(topScores[i], 0));

				//Add bpm
				if (dbBeatmap && dbBeatmap.bpm) {
					bpm.push(dbBeatmap.bpm);
				}
			}

			mods.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
			mappers.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
			stars.sort((a, b) => parseFloat(b) - parseFloat(a));
			aim.sort((a, b) => parseFloat(b) - parseFloat(a));
			speed.sort((a, b) => parseFloat(b) - parseFloat(a));
			acc.sort((a, b) => parseFloat(b) - parseFloat(a));
			bpm.sort((a, b) => parseFloat(b) - parseFloat(a));

			const canvasWidth = 700;
			const canvasHeight = 500;

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

			//Set Duel Rating and League Rank
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Duel Rating', 90, 195);

			logDatabaseQueries(4, 'commands/osu-skills.js DBDiscordUsers duelrating');
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuDuelStarRating', 'osuDuelProvisional', 'osuDuelOutdated'],
				where: {
					osuUserId: user.id
				}
			});

			let userDuelStarRating = null;

			if (discordUser && discordUser.osuDuelStarRating) {
				userDuelStarRating = {
					total: discordUser.osuDuelStarRating,
					provisional: discordUser.osuDuelProvisional,
					outdated: discordUser.osuDuelOutdated
				};
			} else {
				userDuelStarRating = await getUserDuelStarRating({ osuUserId: user.id, client: interaction.client });
			}

			let duelLeague = getOsuDuelLeague(userDuelStarRating.total);

			let leagueText = duelLeague.name;
			let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

			ctx.drawImage(leagueImage, 50, 195, 100, 100);

			if (userDuelStarRating.provisional) {
				leagueText = 'Provisional: ' + leagueText;
			} else if (userDuelStarRating.outdated) {
				leagueText = 'Outdated: ' + leagueText;
			}

			ctx.fillText(leagueText, 90, 310);
			ctx.fillText(`(${Math.round(userDuelStarRating.total * 1000) / 1000}*)`, 90, 330);

			let today = new Date().toLocaleDateString();

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';

			ctx.textAlign = 'left';
			ctx.fillText(`UserID: ${user.id}`, canvas.width / 140, canvas.height - canvas.height / 70);

			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.font = 'bold 30px comfortaa, sans-serif';
			fitTextOnMiddleCanvas(ctx, `Top Play Stats for ${user.name}`, 30, 'comfortaa, sans-serif', 40, canvas.width + 150, 320);

			// ctx.fillText(`Top Play Stats for ${user.name}`, 400, 40);

			ctx.textAlign = 'left';
			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('PP', 200, 80);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averagepp = 0;
			for (let i = 0; i < pp.length; i++) {
				averagepp += parseFloat(pp[i]);
			}
			averagepp = averagepp / pp.length;
			ctx.fillText(`${Math.round(pp[pp.length - 1] * 100) / 100} (Lowest) - ${Math.round(averagepp * 100) / 100} (avg) - ${Math.round(pp[0] * 100) / 100} (Highest)`, 200, 100);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Stars', 200, 130);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averageStars = 0;
			for (let i = 0; i < stars.length; i++) {
				averageStars += parseFloat(stars[i]);
			}
			averageStars = averageStars / stars.length;
			ctx.fillText(`${Math.round(stars[stars.length - 1] * 100) / 100} (Lowest) - ${Math.round(averageStars * 100) / 100} (avg) - ${Math.round(stars[0] * 100) / 100} (Highest)`, 200, 150);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Aim', 200, 175);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averageAim = 0;
			for (let i = 0; i < aim.length; i++) {
				averageAim += parseFloat(aim[i]);
			}
			averageAim = averageAim / aim.length;
			ctx.fillText(`${Math.round(aim[aim.length - 1] * 100) / 100} (Lowest) - ${Math.round(averageAim * 100) / 100} (avg) - ${Math.round(aim[0] * 100) / 100} (Highest)`, 200, 195);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Speed', 200, 220);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averageSpeed = 0;
			for (let i = 0; i < speed.length; i++) {
				averageSpeed += parseFloat(speed[i]);
			}
			averageSpeed = averageSpeed / speed.length;
			ctx.fillText(`${Math.round(speed[speed.length - 1] * 100) / 100} (Lowest) - ${Math.round(averageSpeed * 100) / 100} (avg) - ${Math.round(speed[0] * 100) / 100} (Highest)`, 200, 240);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Accuracy', 200, 265);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averageAcc = 0;
			for (let i = 0; i < acc.length; i++) {
				averageAcc += parseFloat(acc[i]);
			}
			averageAcc = averageAcc / acc.length;
			ctx.fillText(`${Math.round(acc[acc.length - 1] * 10000) / 100}% (Lowest) - ${Math.round(averageAcc * 10000) / 100}% (avg) - ${Math.round(acc[0] * 10000) / 100}% (Highest)`, 200, 285);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('BPM', 200, 310);
			ctx.font = 'bold 18px comfortaa, sans-serif';

			let averageBPM = 0;
			for (let i = 0; i < bpm.length; i++) {
				averageBPM += parseFloat(bpm[i]);
			}
			averageBPM = averageBPM / bpm.length;
			ctx.fillText(`${Math.round(bpm[bpm.length - 1] * 100) / 100} (Lowest) - ${Math.round(averageBPM * 100) / 100} (avg) - ${Math.round(bpm[0] * 100) / 100} (Highest)`, 200, 330);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Favourite Mods', 30, 370);
			ctx.font = 'bold 18px comfortaa, sans-serif';
			for (let i = 0; i < mods.length && i < 5; i++) {
				// ctx.fillText(`${mods[i].modsReadable}`, 30, 390 + i * 20);
				fitTextOnLeftCanvas(ctx, `${mods[i].modsReadable}`, 18, 'comfortaa, sans-serif', 390 + i * 20, 120, 30);
				ctx.font = 'bold 18px comfortaa, sans-serif';
				if (mods[i].amount > 1) {
					ctx.fillText(`Used ${mods[i].amount} times`, 130, 390 + i * 20);
				} else {
					ctx.fillText('Used once', 130, 390 + i * 20);
				}
			}

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillText('Most Farmed Mappers', 380, 370);
			ctx.font = 'bold 18px comfortaa, sans-serif';
			for (let i = 0; i < mappers.length && i < 5; i++) {
				fitTextOnLeftCanvas(ctx, `${mappers[i].mapper}`, 18, 'comfortaa, sans-serif', 390 + i * 20, 520, 380);
				ctx.font = 'bold 18px comfortaa, sans-serif';
				if (mappers[i].amount > 1) {
					ctx.fillText(`Used ${mappers[i].amount} times`, 530, 390 + i * 20);
				} else {
					ctx.fillText('Used once', 530, 390 + i * 20);
				}
			}

			//Get a circle for inserting the player avatar
			ctx.beginPath();
			ctx.arc(90, 90, 80, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();

			//Draw a shape onto the main canvas
			const avatar = await getAvatar(user.id);
			ctx.drawImage(avatar, 10, 10, 160, 160);

			//Create as an attachment
			const topPlayStats = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-topPlayStats-${user.id}.png` });

			const files = [topPlayStats];

			let content = 'Top play stats';

			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new ChartJSNodeCanvas({ width, height });

			(async () => {
				logDatabaseQueries(4, 'commands/osu-skills.js DBOsuMultiScores');
				const userScores = await DBOsuMultiScores.findAll({
					attributes: [
						'score',
						'mode',
						'scoringType',
						'warmup',
						'tourneyMatch',
						'evaluation',
						'matchStartDate',
						'matchName',
						'matchId',
						'gameRawMods',
						'rawMods',
						'freeMod',
						'gameId',
					],
					where: {
						osuUserId: user.id,
						score: {
							[Op.gte]: 10000
						},
						[Op.or]: [
							{ warmup: false },
							{ warmup: null }
						],
					}
				});

				for (let i = 0; i < userScores.length; i++) {
					if (parseInt(userScores[i].score) <= 10000) {
						userScores.splice(i, 1);
						i--;
					}
				}

				//Remove userScores which don't fit the criteria
				for (let i = 0; i < userScores.length; i++) {
					if (userScores[i].mode !== 'Standard'
						|| scoringType === 'v2' && userScores[i].scoringType !== 'Score v2'
						|| scoringType === 'v1' && userScores[i].scoringType !== 'Score'
						|| tourneyMatch && !userScores[i].tourneyMatch
						|| userScores[i].evaluation === null) {
						userScores.splice(i, 1);
						i--;
					}
				}

				if (!userScores.length) {
					content = `${content}; No multi/tourney-scores found in the database for ${user.name} - skipping modpool evaluation\n${user.name}: <https://osu.ppy.sh/users/${user.id}>`;
				} else {
					let oldestDate = new Date();
					oldestDate.setUTCDate(1);
					oldestDate.setUTCHours(0);
					oldestDate.setUTCMinutes(0);

					let matchesPlayed = [];
					userScores.sort((a, b) => {
						return parseInt(b.gameId) - parseInt(a.gameId);
					});
					userScores.forEach(score => {
						if (oldestDate > score.matchStartDate) {
							oldestDate.setUTCFullYear(score.matchStartDate.getUTCFullYear());
							oldestDate.setUTCMonth(score.matchStartDate.getUTCMonth());
						}
					});

					const rawModsData = [];
					const labels = [];
					//Get the base data which is gonna be added up later
					for (let now = new Date(); oldestDate < now; oldestDate.setUTCMonth(oldestDate.getUTCMonth() + 1)) {
						let rawModsDataObject = {
							label: `${(oldestDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${oldestDate.getUTCFullYear()}`,
							totalEvaluation: 0,
							totalCount: 0,
							NMEvaluation: 0,
							NMCount: 0,
							HDEvaluation: 0,
							HDCount: 0,
							HREvaluation: 0,
							HRCount: 0,
							DTEvaluation: 0,
							DTCount: 0,
							FMEvaluation: 0,
							FMCount: 0
						};
						labels.push(rawModsDataObject.label);
						rawModsData.push(rawModsDataObject);
					}

					let hideQualifiers = new Date();
					hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

					let uncompletedMonths = [];
					let runningAverageAmount = 150; //All mods together
					for (let i = 0; i < userScores.length; i++) {
						//Push matches for the history txt
						let date = new Date(userScores[i].matchStartDate);

						if (date > hideQualifiers && userScores[i].matchName.toLowerCase().includes('qualifier')) {
							userScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
						}

						if (!matchesPlayed.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`)) {
							matchesPlayed.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`);
						}

						let modPool = getScoreModpool(userScores[i]);

						for (let j = 0; j < rawModsData.length; j++) {
							if (rawModsData[j].label === `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`) {
								rawModsData[j].totalEvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].totalCount++;

								//Add values to Mods
								if (modPool === 'NM') {
									rawModsData[j].NMEvaluation += parseFloat(userScores[i].evaluation);
									rawModsData[j].NMCount++;
								} else if (modPool === 'HD') {
									rawModsData[j].HDEvaluation += parseFloat(userScores[i].evaluation);
									rawModsData[j].HDCount++;
								} else if (modPool === 'HR') {
									rawModsData[j].HREvaluation += parseFloat(userScores[i].evaluation);
									rawModsData[j].HRCount++;
								} else if (modPool === 'DT') {
									rawModsData[j].DTEvaluation += parseFloat(userScores[i].evaluation);
									rawModsData[j].DTCount++;
								} else {
									rawModsData[j].FMEvaluation += parseFloat(userScores[i].evaluation);
									rawModsData[j].FMCount++;
								}

								//add to uncompleted months for running avg
								if (runningAverage && rawModsData[j].totalCount < runningAverageAmount && !uncompletedMonths.includes(rawModsData[j])) {
									uncompletedMonths.push(rawModsData[j]);
								}

								for (let k = 0; k < uncompletedMonths.length; k++) {
									if (rawModsData[j].label !== uncompletedMonths[k].label) {

										//Add values to Mods
										if (uncompletedMonths[k].NMCount < runningAverageAmount / 5 && modPool === 'NM') {
											uncompletedMonths[k].NMEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].NMCount++;
											//add to total evaluation
											uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].totalCount++;
										} else if (uncompletedMonths[k].HDCount < runningAverageAmount / 5 && modPool === 'HD') {
											uncompletedMonths[k].HDEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].HDCount++;
											//add to total evaluation
											uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].totalCount++;
										} else if (uncompletedMonths[k].HRCount < runningAverageAmount / 5 && modPool === 'HR') {
											uncompletedMonths[k].HREvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].HRCount++;
											//add to total evaluation
											uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].totalCount++;
										} else if (uncompletedMonths[k].DTCount < runningAverageAmount / 5 && modPool === 'DT') {
											uncompletedMonths[k].DTEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].DTCount++;
											//add to total evaluation
											uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].totalCount++;
										} else if (uncompletedMonths[k].FMCount < runningAverageAmount / 5) {
											uncompletedMonths[k].FMEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].FMCount++;
											//add to total evaluation
											uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
											uncompletedMonths[k].totalCount++;
										}

										if (uncompletedMonths[k].totalCount >= runningAverageAmount
											&& uncompletedMonths[k].NMCount >= runningAverageAmount / 5
											&& uncompletedMonths[k].HDCount >= runningAverageAmount / 5
											&& uncompletedMonths[k].HRCount >= runningAverageAmount / 5
											&& uncompletedMonths[k].DTCount >= runningAverageAmount / 5
											&& uncompletedMonths[k].FMCount >= runningAverageAmount / 5) {
											uncompletedMonths.splice(k, 1);
										}
									}
								}
							}
						}
					}

					const totalDatapoints = [];
					const NMDatapoints = [];
					const HDDatapoints = [];
					const HRDatapoints = [];
					const DTDatapoints = [];
					const FMDatapoints = [];
					rawModsData.forEach(rawModsDataObject => {
						let totalValue = NaN;
						if (rawModsDataObject.totalCount) {
							totalValue = rawModsDataObject.totalEvaluation / rawModsDataObject.totalCount;
						}

						let NMValue = NaN;
						if (rawModsDataObject.NMCount) {
							NMValue = rawModsDataObject.NMEvaluation / rawModsDataObject.NMCount;
							if (scaled) {
								NMValue = NMValue / totalValue;
							}
						}
						NMDatapoints.push(NMValue);

						let HDValue = NaN;
						if (rawModsDataObject.HDCount) {
							HDValue = rawModsDataObject.HDEvaluation / rawModsDataObject.HDCount;
							if (scaled) {
								HDValue = HDValue / totalValue;
							}
						}
						HDDatapoints.push(HDValue);

						let HRValue = NaN;
						if (rawModsDataObject.HRCount) {
							HRValue = rawModsDataObject.HREvaluation / rawModsDataObject.HRCount;
							if (scaled) {
								HRValue = HRValue / totalValue;
							}
						}
						HRDatapoints.push(HRValue);

						let DTValue = NaN;
						if (rawModsDataObject.DTCount) {
							DTValue = rawModsDataObject.DTEvaluation / rawModsDataObject.DTCount;
							if (scaled) {
								DTValue = DTValue / totalValue;
							}
						}
						DTDatapoints.push(DTValue);

						let FMValue = NaN;
						if (rawModsDataObject.FMCount) {
							FMValue = rawModsDataObject.FMEvaluation / rawModsDataObject.FMCount;
							if (scaled) {
								FMValue = FMValue / totalValue;
							}
						}
						FMDatapoints.push(FMValue);

						if (scaled) {
							totalValue = totalValue / totalValue;
						}
						totalDatapoints.push(totalValue);
					});

					for (let i = 0; i < totalDatapoints.length; i++) {
						if (isNaN(totalDatapoints[i])) {
							labels.splice(i, 1);
							totalDatapoints.splice(i, 1);
							NMDatapoints.splice(i, 1);
							HDDatapoints.splice(i, 1);
							HRDatapoints.splice(i, 1);
							DTDatapoints.splice(i, 1);
							FMDatapoints.splice(i, 1);
							i--;
						}
					}

					if (labels.length === 1) {
						labels.push(labels[0]);
						totalDatapoints.push(totalDatapoints[0]);
						NMDatapoints.push(NMDatapoints[0]);
						HDDatapoints.push(HDDatapoints[0]);
						HRDatapoints.push(HRDatapoints[0]);
						DTDatapoints.push(DTDatapoints[0]);
						FMDatapoints.push(FMDatapoints[0]);
					}

					const data = {
						labels: labels,
						datasets: [
							{
								label: 'Evaluation (All Mods)',
								data: totalDatapoints,
								borderColor: 'rgb(201, 203, 207)',
								fill: false,
								tension: 0.4
							}, {
								label: 'Evaluation (NM only)',
								data: NMDatapoints,
								borderColor: 'rgb(54, 162, 235)',
								fill: false,
								tension: 0.4
							}, {
								label: 'Evaluation (HD only)',
								data: HDDatapoints,
								borderColor: 'rgb(255, 205, 86)',
								fill: false,
								tension: 0.4
							}, {
								label: 'Evaluation (HR only)',
								data: HRDatapoints,
								borderColor: 'rgb(255, 99, 132)',
								fill: false,
								tension: 0.4
							}, {
								label: 'Evaluation (DT only)',
								data: DTDatapoints,
								borderColor: 'rgb(153, 102, 255)',
								fill: false,
								tension: 0.4
							}, {
								label: 'Evaluation (FM only)',
								data: FMDatapoints,
								borderColor: 'rgb(75, 192, 192)',
								fill: false,
								tension: 0.4
							}
						]
					};

					const configuration = {
						type: 'line',
						data: data,
						options: {
							spanGaps: true,
							responsive: true,
							plugins: {
								title: {
									display: true,
									text: 'Elitebotix Evaluation for submitted matches',
									color: '#FFFFFF',
								},
								legend: {
									labels: {
										color: '#FFFFFF',
									}
								},
							},
							interaction: {
								intersect: false,
							},
							scales: {
								x: {
									display: true,
									title: {
										display: true,
										text: 'Month',
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
									display: true,
									title: {
										display: true,
										text: 'Evaluation value',
										color: '#FFFFFF'
									},
									grid: {
										color: '#8F8F8F'
									},
									ticks: {
										color: '#FFFFFF',
									},
									suggestedMin: 0,
									suggestedMax: 1.5
								}
							}
						},
					};

					const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

					const attachment = new Discord.AttachmentBuilder(imageBuffer, { name: `osu-skills-${user.id}.png` });

					files.push(attachment);

					let scaledText = '';
					if (scaled) {
						scaledText = ' (Scaled by total evaluation)';
					}

					let tourneyMatchText = 'Casual & Tourney matches';
					if (tourneyMatch) {
						tourneyMatchText = 'Tourney matches only';
					}

					let runningAverageText = '';
					if (runningAverage) {
						runningAverageText = ` (Running Average of at least ${runningAverageAmount / 5} maps per mod per month)`;
					}

					// eslint-disable-next-line no-undef
					matchesPlayed = new Discord.AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${user.id}.txt` });
					files.push(matchesPlayed);

					content = `${content} and Modpool evaluation development for ${user.name} (Score ${scoringType}; ${tourneyMatchText})${scaledText}${runningAverageText}\n${user.name}: <https://osu.ppy.sh/users/${user.id}>`;
				}

				let sentMessage = await interaction.followUp({ content: content, files: files });
				await sentMessage.react('👤');
				await sentMessage.react('🥇');
				if (userScores.length) {
					await sentMessage.react('<:master:951396806653255700>');
					await sentMessage.react('🆚');
					await sentMessage.react('📊');
				}
			})();
		})
		.catch(async (err) => {
			if (err.message === 'Not found') {
				await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			} else if (err.message === 'No standard plays') {
				await interaction.followUp(`Could not find any standard plays for user \`${username.replace(/`/g, '')}\`.`);
			} else {
				console.error(err);
			}
		});
}
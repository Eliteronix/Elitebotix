const Discord = require('discord.js');
const Canvas = require('canvas');
const { getGameMode, getIDFromPotentialOsuLink, getOsuBeatmap, getModBits, getMods, getModImage, checkModsCompatibility, getOsuPP, logDatabaseQueries, getScoreModpool, humanReadable, getBeatmapCover, adjustStarRating } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBOsuMultiGameScores, DBOsuMultiMatches, DBOsuMultiGames } = require('../dbObjects');
const { Op } = require('sequelize');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');

module.exports = {
	name: 'osu-beatmap',
	description: 'Sends an info card about the specified beatmap',
	botPermissions: [PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-beatmap')
		.setNameLocalizations({
			'de': 'osu-beatmap',
			'en-GB': 'osu-beatmap',
			'en-US': 'osu-beatmap',
		})
		.setDescription('Sends an info card about the specified beatmap')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die angegebene Beatmap',
			'en-GB': 'Sends an info card about the specified beatmap',
			'en-US': 'Sends an info card about the specified beatmap',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('id')
				.setNameLocalizations({
					'de': 'id',
					'en-GB': 'id',
					'en-US': 'id',
				})
				.setDescription('The id or link of the beatmap to display')
				.setDescriptionLocalizations({
					'de': 'Die ID oder der Link der Beatmap, die angezeigt werden soll',
					'en-GB': 'The id or link of the beatmap to display',
					'en-US': 'The id or link of the beatmap to display',
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
				.setDescription('The mod combination that should be displayed (i.e. NM, HDHR, ...)')
				.setDescriptionLocalizations({
					'de': 'Die Mod-Kombination, die angezeigt werden soll (z.B. NM, HDHR, ...)',
					'en-GB': 'The mod combination that should be displayed (i.e. NM, HDHR, ...)',
					'en-US': 'The mod combination that should be displayed (i.e. NM, HDHR, ...)',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('accuracy')
				.setNameLocalizations({
					'de': 'genauigkeit',
					'en-GB': 'accuracy',
					'en-US': 'accuracy',
				})
				.setDescription('The accuracy that the pp should be calculated for')
				.setDescriptionLocalizations({
					'de': 'Die Genauigkeit, für die die pp berechnet werden sollen',
					'en-GB': 'The accuracy that the pp should be calculated for',
					'en-US': 'The accuracy that the pp should be calculated for',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('tourney')
				.setNameLocalizations({
					'de': 'turnier',
					'en-GB': 'tourney',
					'en-US': 'tourney',
				})
				.setDescription('Should additional tournament data be attached?')
				.setDescriptionLocalizations({
					'de': 'Soll zusätzliche Turnierdaten angehängt werden?',
					'en-GB': 'Should additional tournament data be attached?',
					'en-US': 'Should additional tournament data be attached?',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('id2')
				.setNameLocalizations({
					'de': 'id2',
					'en-GB': 'id2',
					'en-US': 'id2',
				})
				.setDescription('The id or link of the beatmap to display')
				.setDescriptionLocalizations({
					'de': 'Die ID oder der Link der Beatmap, die angezeigt werden soll',
					'en-GB': 'The id or link of the beatmap to display',
					'en-US': 'The id or link of the beatmap to display',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('id3')
				.setNameLocalizations({
					'de': 'id3',
					'en-GB': 'id3',
					'en-US': 'id3',
				})
				.setDescription('The id or link of the beatmap to display')
				.setDescriptionLocalizations({
					'de': 'Die ID oder der Link der Beatmap, die angezeigt werden soll',
					'en-GB': 'The id or link of the beatmap to display',
					'en-US': 'The id or link of the beatmap to display',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('id4')
				.setNameLocalizations({
					'de': 'id4',
					'en-GB': 'id4',
					'en-US': 'id4',
				})
				.setDescription('The id or link of the beatmap to display')
				.setDescriptionLocalizations({
					'de': 'Die ID oder der Link der Beatmap, die angezeigt werden soll',
					'en-GB': 'The id or link of the beatmap to display',
					'en-US': 'The id or link of the beatmap to display',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('id5')
				.setNameLocalizations({
					'de': 'id5',
					'en-GB': 'id5',
					'en-US': 'id5',
				})
				.setDescription('The id or link of the beatmap to display')
				.setDescriptionLocalizations({
					'de': 'Die ID oder der Link der Beatmap, die angezeigt werden soll',
					'en-GB': 'The id or link of the beatmap to display',
					'en-US': 'The id or link of the beatmap to display',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
		if (interaction.commandName === 'osu-beatmap') {
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
		}

		let accuracy = interaction.options.getNumber('accuracy') || 95;

		accuracy = Math.min(accuracy, 100);
		accuracy = Math.max(accuracy, 0);
		accuracy = Math.round(accuracy * 100) / 100;

		let mods = 'NM';

		if (interaction.options.getString('mods')) {
			mods = interaction.options.getString('mods').toUpperCase();
		} else if (interaction.options.getString('modpool')) {
			mods = interaction.options.getString('modpool').toUpperCase();

			if (mods === 'FM') {
				mods = 'NM';
			}
		}

		let modBits = getModBits(mods);

		let tournament = false;

		if (interaction.options.getBoolean('tourney')) {
			tournament = interaction.options.getBoolean('tourney');
		}

		let maps = [];

		if (interaction.options.getString('id')) {
			maps.push(interaction.options.getString('id'));
		}

		if (interaction.options.getString('id2')) {
			maps.push(interaction.options.getString('id2'));
		}

		if (interaction.options.getString('id3')) {
			maps.push(interaction.options.getString('id3'));
		}

		if (interaction.options.getString('id4')) {
			maps.push(interaction.options.getString('id4'));
		}

		if (interaction.options.getString('id5')) {
			maps.push(interaction.options.getString('id5'));
		}

		maps.forEach(async (map) => {
			let modCompatibility = await checkModsCompatibility(modBits, getIDFromPotentialOsuLink(map));
			if (!modCompatibility) {
				modBits = 0;
			}

			const dbBeatmap = await getOsuBeatmap({ beatmapId: getIDFromPotentialOsuLink(map), modBits: modBits });
			if (dbBeatmap) {
				getBeatmap(interaction, dbBeatmap, tournament, accuracy);
			} else {
				if (interaction.commandName === 'osu-beatmap') {
					await interaction.followUp({ content: `Could not find beatmap \`${map.replace(/`/g, '')}\`.` });
				} else {
					await interaction.followUp({ content: `Could not find beatmap \`${map.replace(/`/g, '')}\`.`, ephemeral: true });
				}
			}
		});
	},
};

async function getBeatmap(interaction, beatmap, tournament, accuracy) {
	let processingMessage = null;

	const canvasWidth = 1000;
	const canvasHeight = 500;

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	//Get context and load the image
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('./other/osu-background.png');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

	let elements = [canvas, ctx, beatmap];

	elements = await drawTitle(elements);

	elements = await drawMode(elements);

	elements = await drawStats(elements, accuracy, interaction.client);

	elements = await drawFooter(elements);

	await drawBackground(elements, interaction.client);

	//Create as an attachment
	const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-beatmap-${beatmap.beatmapId}-${beatmap.mods}.png` });

	if (!interaction) {
		processingMessage.delete();
	}

	let files = [attachment];

	let tournamentOccurences = '';

	logDatabaseQueries(4, 'commands/osu-beatmap.js DBOsuMultiGameScores');
	const mapGames = await DBOsuMultiGames.findAll({
		attributes: ['matchId', 'gameId', 'scores'],
		where: {
			beatmapId: beatmap.beatmapId,
			tourneyMatch: true,
			[Op.or]: [
				{ warmup: false },
				{ warmup: null }
			],
			scores: {
				[Op.gt]: 0,
			},
		},
		order: [
			['matchId', 'DESC'],
		],
	});

	const matchData = await DBOsuMultiMatches.findAll({
		attributes: ['matchId', 'matchName', 'matchStartDate'],
		where: {
			matchId: {
				[Op.in]: mapGames.map((game) => {
					return game.matchId;
				}),
			},
		},
		order: [
			['matchId', 'DESC'],
		],
	});

	// populate mapScores with matchName and matchStartDate
	for (let i = 0; i < mapGames.length; i++) {
		if (mapGames[i].matchId === matchData[0].matchId) {
			mapGames[i].matchName = matchData[0].matchName;
			mapGames[i].matchStartDate = matchData[0].matchStartDate;

			// if matchName starts with MOTD, remove it from mapScores
			if (mapGames[i].matchName.startsWith('MOTD:')) {
				mapGames.splice(i, 1);
				i--;
			}
			continue;
		}

		// remove matchData entry if matchId is not the same as the current one
		matchData.shift();
		i--;
	}

	let tournaments = [];
	let totalScores = 0;
	let matchMakingScores = 0;

	let hideQualifiers = new Date();
	hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

	for (let i = 0; i < mapGames.length; i++) {
		let acronym = mapGames[i].matchName.replace(/:.+/gm, '').replace(/`/g, '');

		totalScores += mapGames[i].scores;

		if (mapGames[i].matchName.startsWith('ETX') || mapGames[i].matchName.startsWith('o!mm')) {
			matchMakingScores += mapGames[i].scores;
		}

		if (tournaments.indexOf(acronym) === -1) {
			tournaments.push(acronym);
		}

		if (!tournament) {
			continue;
		}
	}

	let matches = [];
	if (tournament) {
		logDatabaseQueries(4, 'commands/osu-beatmap.js DBOsuMultiGameScores');
		const mapScores = await DBOsuMultiGameScores.findAll({
			attributes: ['matchId', 'gameId', 'score', 'gameRawMods', 'rawMods', 'freeMod'],
			where: {
				gameId: {
					[Op.in]: mapGames.map((game) => {
						return game.gameId;
					}),
				},
				score: {
					[Op.gte]: 10000,
				},
			},
			order: [
				['matchId', 'DESC'],
			],
		});

		for (let i = 0; i < mapScores.length; i++) {
			let correspondingGame = mapGames.find((game) => {
				return game.gameId === mapScores[i].gameId;
			});

			mapScores[i].matchStartDate = correspondingGame.matchStartDate;
			mapScores[i].matchName = correspondingGame.matchName;

			let modPool = getScoreModpool(mapScores[i]);

			let date = new Date(mapScores[i].matchStartDate);
			let dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;

			if (date > hideQualifiers && mapScores[i].matchName.toLowerCase().includes('qualifier')) {
				mapScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
				mapScores[i].score = 'XXXXXX';
			}

			matches.push(`${dateReadable}: ${modPool} - ${humanReadable(mapScores[i].score)} - ${mapScores[i].matchName}  - https://osu.ppy.sh/community/matches/${mapScores[i].matchId}`);
		}
	}

	//TODO: Number is wrong
	tournamentOccurences = `The map was played ${totalScores} times (${totalScores - matchMakingScores} times without ETX / o!mm) with any mods in these tournaments (new -> old):\n\`${tournaments.join('`, `')}\``;

	if (tournaments.length === 0) {
		tournamentOccurences = 'The map was never played in any tournaments.';
	}

	if (tournamentOccurences.length > 2000) {
		tournamentOccurences = tournamentOccurences.substring(0, 1897) + '...';
	}

	if (tournament) {
		// eslint-disable-next-line no-undef
		matches = new Discord.AttachmentBuilder(Buffer.from(matches.join('\n'), 'utf-8'), { name: `tourney-scores-${beatmap.beatmapId}.txt` });
		files.push(matches);
	}

	//Send attachment
	if (interaction.commandName !== 'osu-beatmap') {
		return interaction.followUp({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\n${tournamentOccurences}`, files: files, ephemeral: true });
	} else {
		try {
			const sentMessage = await interaction.followUp({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\n${tournamentOccurences}`, files: files });
			if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
				sentMessage.react('<:COMPARE:827974793365159997>');
			}
			sentMessage.react('<:HD:918922015182827531>');
			sentMessage.react('<:HR:918938816377671740>');
			sentMessage.react('<:DT:918920670023397396>');
			if (beatmap.mode === 'Standard') {
				sentMessage.react('<:HDHR:918935327215861760>');
				sentMessage.react('<:HDDT:918935350125142036>');
			}
			if (beatmap.mode === 'Mania') {
				sentMessage.react('<:FI:918922047994880010>');
			}
			sentMessage.react('<:EZ:918920760586805259>');
			sentMessage.react('<:HT:918921193426411544>');
			sentMessage.react('<:FL:918920836755382343>');

			return;
		} catch (error) {
			if (error.message !== 'Unknown Message') {
				console.error(error, interaction, beatmap, tournament, accuracy);
			}
			return;
		}
	}
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let beatmapTitle = `${beatmap.title}`;
	const maxSizeTitle = parseInt(canvas.width / 1000 * 40);
	if (beatmapTitle.length > maxSizeTitle) {
		beatmapTitle = beatmapTitle.substring(0, maxSizeTitle - 3) + '...';
	}

	let beatmapArtist = `by ${beatmap.artist}`;
	const maxSizeArtist = parseInt(canvas.width / 1000 * 40);
	if (beatmapArtist.length > maxSizeArtist) {
		beatmapArtist = beatmapArtist.substring(0, maxSizeArtist - 3) + '...';
	}

	let beatmapDifficulty = `[${beatmap.difficulty}]`;
	const maxSizeDifficulty = parseInt(canvas.width / 1000 * 40);
	if (beatmapDifficulty.length > maxSizeDifficulty) {
		beatmapDifficulty = beatmapDifficulty.substring(0, maxSizeDifficulty - 3) + '...';
	}

	// Write the title of the map
	ctx.font = 'bold 25px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(beatmapTitle, canvas.width / 3 * 2, canvas.height / 100 * 7);
	ctx.fillText(beatmapArtist, canvas.width / 3 * 2, canvas.height / 50 * 7);
	ctx.fillText(beatmapDifficulty, canvas.width / 3 * 2, canvas.height / 100 * 21);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawMode(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let gameMode = getGameMode(beatmap);
	if (gameMode === 'fruits') {
		gameMode = 'catch';
	}

	const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
	ctx.drawImage(modePic, (canvas.height / 3 - canvas.height / 3 / 4 * 3) / 2, canvas.height / 3 * 2 + (canvas.height / 3 - canvas.height / 3 / 4 * 3) / 4, canvas.height / 3 / 4 * 3, canvas.height / 3 / 4 * 3);

	let mods = getMods(beatmap.mods);

	if (!mods[0]) {
		mods = ['NM'];
	}

	for (let i = 0; i < mods.length; i++) {
		mods[i] = getModImage(mods[i]);
		const modImage = await Canvas.loadImage(mods[i]);
		ctx.drawImage(modImage, 150, 385 + i * 40 - ((mods.length - 1) * 40) / 2, 45, 32);
	}

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawStats(input, accuracy, client) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	const totalLengthSeconds = (beatmap.totalLength % 60) + '';
	const totalLengthMinutes = (beatmap.totalLength - beatmap.totalLength % 60) / 60;
	const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');
	const drainLengthSeconds = (beatmap.drainLength % 60) + '';
	const drainLengthMinutes = (beatmap.drainLength - beatmap.drainLength % 60) / 60;
	const drainLength = drainLengthMinutes + ':' + Math.round(drainLengthSeconds).toString().padStart(2, '0');

	//Round user rating and display as 10 stars
	const userRating = Math.round(beatmap.userRating);
	let userRatingDisplay;
	for (let i = 0; i < 10; i++) {
		if (i < userRating) {
			if (userRatingDisplay) {
				userRatingDisplay = userRatingDisplay + '★';
			} else {
				userRatingDisplay = '★';
			}
		} else {
			if (userRatingDisplay) {
				userRatingDisplay = userRatingDisplay + '☆';
			} else {
				userRatingDisplay = '☆';
			}
		}
	}

	// Write the stats of the map
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	//First column
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Ranked Status', canvas.width / 1000 * 330, canvas.height / 500 * 170);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(beatmap.approvalStatus, canvas.width / 1000 * 330, canvas.height / 500 * 200);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Difficulty Rating', canvas.width / 1000 * 330, canvas.height / 500 * 230);

	let adjustedStarRating = adjustStarRating(beatmap.starRating, beatmap.approachRate, beatmap.circleSize, beatmap.mods);

	let adjustedRatingString = '';

	if (Math.round(adjustedStarRating * 100) / 100 !== Math.round(beatmap.starRating * 100) / 100) {
		adjustedRatingString = ` (${Math.round(adjustedStarRating * 100) / 100}* ETX)`;
	}

	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100}*${adjustedRatingString}`, canvas.width / 1000 * 330, canvas.height / 500 * 260, 220);

	let beatmapMapper = beatmap.mapper;
	const maxSizeMapper = parseInt(canvas.width / 1000 * 12);
	if (beatmapMapper.length > maxSizeMapper) {
		beatmapMapper = beatmapMapper.substring(0, maxSizeMapper - 3) + '...';
	}

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Mapper', canvas.width / 1000 * 330, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(beatmapMapper, canvas.width / 1000 * 330, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('User Rating', canvas.width / 1000 * 330, canvas.height / 500 * 350);
	ctx.font = 'bold 20px comfortaa, sans-serif';
	ctx.fillText(userRatingDisplay, canvas.width / 1000 * 330, canvas.height / 500 * 375);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText(`${accuracy}% Accuracy`, canvas.width / 1000 * 330, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, accuracy, 0, beatmap.maxCombo, client))} pp`, canvas.width / 1000 * 330, canvas.height / 500 * 440);

	//Second column
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Circle Size', canvas.width / 1000 * 580, canvas.height / 500 * 170);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`CS ${beatmap.circleSize}`, canvas.width / 1000 * 580, canvas.height / 500 * 200);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Approach Rate', canvas.width / 1000 * 580, canvas.height / 500 * 230);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`AR ${beatmap.approachRate}`, canvas.width / 1000 * 580, canvas.height / 500 * 260);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Overall Difficulty', canvas.width / 1000 * 580, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`OD ${beatmap.overallDifficulty}`, canvas.width / 1000 * 580, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('HP Drain', canvas.width / 1000 * 580, canvas.height / 500 * 350);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`HP ${beatmap.hpDrain}`, canvas.width / 1000 * 580, canvas.height / 500 * 380);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('99% Accuracy', canvas.width / 1000 * 580, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, 99.00, 0, beatmap.maxCombo, client))} pp`, canvas.width / 1000 * 580, canvas.height / 500 * 440);

	//Third column
	if (beatmap.mode === 'Mania') {
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillText('# of objects', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText(`${parseInt(beatmap.circles) + parseInt(beatmap.sliders) + parseInt(beatmap.spinners)}`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	} else {
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillText('Maximum Combo', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText(`${beatmap.maxCombo}x`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	}
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Beats per Minute', canvas.width / 1000 * 750, canvas.height / 500 * 230);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(beatmap.bpm * 100) / 100} BPM`, canvas.width / 1000 * 750, canvas.height / 500 * 260);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length', canvas.width / 1000 * 750, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${totalLength} Total`, canvas.width / 1000 * 750, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length (Drain)', canvas.width / 1000 * 750, canvas.height / 500 * 350);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${drainLength} Drain`, canvas.width / 1000 * 750, canvas.height / 500 * 380);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('100% Accuracy', canvas.width / 1000 * 750, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, 100.00, 0, beatmap.maxCombo, client))} pp`, canvas.width / 1000 * 750, canvas.height / 500 * 440);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'left';
	ctx.fillText(`ID: ${beatmap.beatmapId}`, canvas.width / 140, canvas.height - canvas.height / 70);

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawBackground(input, client) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	//Get a circle in the middle for inserting the map background
	ctx.beginPath();
	ctx.arc(0, 0, canvas.height / 3 * 2, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	//Draw a shape onto the main canvas in the top left
	const background = await getBeatmapCover(beatmap.beatmapsetId, beatmap.beatmapId, client);
	ctx.drawImage(background, background.width / 2 - background.height / 2, 0, background.height, background.height, 0, 0, canvas.height / 3 * 2, canvas.height / 3 * 2);
	const output = [canvas, ctx, beatmap];
	return output;
}
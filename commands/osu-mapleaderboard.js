const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getBeatmapApprovalStatusImage, getGameMode, checkModsCompatibility, roundedRect, getModImage, getMods, getAccuracy, getIDFromPotentialOsuLink, getOsuBeatmap, multiToBanchoScore, getOsuPlayerName, getModBits } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-mapleaderboard',
	aliases: ['osu-map-leaderboard'],
	description: 'Sends an info card about the leaderboard on the specified beatmap',
	usage: '<id>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: false,
	args: true,
	cooldown: 10,
	noCooldownMessage: false,
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

		let id = interaction.options.getString('id');

		let acronym = interaction.options.getString('acronym');

		let server = 'bancho';
		if (interaction.options.getString('server')) {
			server = interaction.options.getString('server');
		}

		let amount = 10;
		if (interaction.options.getInteger('amount')) {
			amount = interaction.options.getInteger('amount');

			if (amount > 50) {
				amount = 50;
			} else if (amount < 1) {
				amount = 1;
			}
		}

		let modBits = 0;

		if (interaction.options.getString('mods')) {
			modBits = getModBits(interaction.options.getString('mods'));
		}

		let modCompatibility = await checkModsCompatibility(modBits, getIDFromPotentialOsuLink(id));

		if (!modCompatibility) {
			modBits = 0;
		}

		const dbBeatmap = await getOsuBeatmap({ beatmapId: getIDFromPotentialOsuLink(id), modBits: modBits });

		if (!dbBeatmap) {
			return await interaction.followUp({ content: `Could not find beatmap \`${id.replace(/`/g, '')}\`.` });
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let mode = dbBeatmap.mode;

		if (interaction.options.getString('mode')) {
			mode = interaction.options.getString('mode');
		}

		if (mode == 'Standard') {
			mode = 0;
		} else if (mode == 'Taiko') {
			mode = 1;
		} else if (mode == 'Catch') {
			mode = 2;
		} else if (mode == 'Mania') {
			mode = 3;
		}

		let scoresArray = [];
		let userScore = null;

		const user = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.user.id,
			}
		});

		if (server === 'bancho') {
			let options = {
				b: dbBeatmap.beatmapId,
				m: mode,
			};

			try {
				if (interaction.options.getString('mods')) {
					options.mods = modBits;
				}

				await osuApi.getScores(options)
					.then(async (mapScores) => {
						scoresArray = mapScores;
					});
			} catch (error) {
				if (error.message === 'Not found') {
					return interaction.followUp({ content: 'The map doesn\'t have any submitted scores.' });
				}

				console.error(error);
			}

			for (let i = 0; i < scoresArray.length; i++) {
				if (user && scoresArray[i].user.id === user.osuUserId) {
					userScore = {
						score: scoresArray[i],
						rank: i
					};
					break;
				}
			}

			if (user && !userScore) {
				try {
					options.u = user.osuUserId;
					await osuApi.getScores(options)
						.then(async scores => {
							userScore = { score: scores[0] };
						});
				} catch (error) {
					// nothing
				}
			}
		} else if (server === 'tournaments') {
			let multiScores = await DBOsuMultiScores.findAll({
				where: {
					beatmapId: dbBeatmap.beatmapId,
					scoringType: 'Score v2',
					tourneyMatch: true
				}
			});

			quicksort(multiScores);

			let addedUserScores = [];

			if (getMods(modBits).includes('NF')) {
				modBits--;
			}

			for (let i = 0; i < multiScores.length; i++) {
				if (parseInt(multiScores[i].score) < 10000) {
					break;
				}

				//Check mods
				if (interaction.options.getString('mods')) {
					if (parseInt(multiScores[i].gameRawMods) + parseInt(multiScores[i].rawMods) !== modBits &&
						parseInt(multiScores[i].gameRawMods) + parseInt(multiScores[i].rawMods) !== modBits + 1) {
						continue;
					}
				}

				//Check acronym
				if (acronym) {
					if (!multiScores[i].matchName.trim().startsWith(acronym)) {
						continue;
					}
				}

				if (!addedUserScores.includes(multiScores[i].osuUserId)) {
					addedUserScores.push(multiScores[i].osuUserId);

					let banchoScore = await multiToBanchoScore(multiScores[i]);

					scoresArray.push(banchoScore);

					if (user && multiScores[i].osuUserId === user.osuUserId) {
						userScore = { score: banchoScore, rank: scoresArray.length };
					}
				}
			}

			if (!scoresArray.length) {
				return interaction.followUp({ content: 'The map doesn\'t have any submitted scores.' });
			}
		}

		if (amount > scoresArray.length) {
			amount = scoresArray.length;
		}

		let userScoreHeight = 0;
		if (userScore) {
			userScoreHeight = 90;
		}

		const canvasWidth = 900;
		let canvasHeight = 275 + userScoreHeight + amount * 30;

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

		let elements = [canvas, ctx, dbBeatmap];

		elements = await drawTitle(elements);

		elements = await drawTopScore(elements, mode, scoresArray);

		elements = await drawScores(elements, mode, userScore, scoresArray);

		await drawFooter(elements);

		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-map-leaderboard-${dbBeatmap.beatmapId}-${dbBeatmap.mods}.png`);

		let files = [attachment];

		return interaction.followUp({ content: `Website: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>\nosu! direct: <osu://b/${dbBeatmap.beatmapId}>`, files: files, ephemeral: false });

		async function drawTitle(input) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let beatmapImage;
			roundedRect(ctx, 20, 20, 860, 120, 500 / 70, '70', '57', '63', 0.75);
			ctx.save();
			ctx.clip();
			ctx.globalCompositeOperation = 'source-over';
			try {
				beatmapImage = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapsetId}/covers/cover.jpg`);
				ctx.drawImage(beatmapImage, 0, canvas.height / 6.25, canvas.width, beatmapImage.height / beatmapImage.width * canvas.width);
			} catch (error) {
				beatmapImage = await Canvas.loadImage('https://osu.ppy.sh/assets/images/default-bg.7594e945.png');
				ctx.drawImage(beatmapImage, 0, canvas.height / 6.25, canvas.width, beatmapImage.height / beatmapImage.width * canvas.width);
			}
			ctx.drawImage(beatmapImage, 0, 0);
			ctx.restore();
			roundedRect(ctx, 20, 20, 860, 120, 500 / 70, '0', '0', '0', 0.65);

			let beatmapTitle = `${beatmap.title}`;
			const maxSizeTitle = parseInt(canvas.width / 1000 * 55);
			if (beatmapTitle.length > maxSizeTitle) {
				beatmapTitle = beatmapTitle.substring(0, maxSizeTitle - 3) + '...';
			}

			let beatmapDifficulty = `[${beatmap.difficulty}]`;
			const maxSizeDifficulty = parseInt(canvas.width / 1000 * 35);
			if (beatmapDifficulty.length > maxSizeDifficulty) {
				beatmapDifficulty = beatmapDifficulty.substring(0, maxSizeDifficulty - 3) + '...';
			}

			const beatmapStatusIcon = await Canvas.loadImage(getBeatmapApprovalStatusImage(beatmap));
			const gameMode = getGameMode(beatmap);
			const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
			const starImage = await Canvas.loadImage('./other/overall-difficulty.png');

			ctx.drawImage(starImage, 65, 75, starImage.width / starImage.height * 40, 40);
			ctx.drawImage(beatmapStatusIcon, 22, 25, beatmapStatusIcon.width / beatmapStatusIcon.height * 40, 40);
			ctx.drawImage(modePic, 22, 75, modePic.width / modePic.height * 40, 40);

			ctx.font = 'bold 30px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, 70, 55);
			ctx.font = 'bold 23px comfortaa, sans-serif';
			ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100} [${beatmapDifficulty}] mapped by ${beatmap.mapper}`, 100, 103.5);

			//Draw mods
			let mods = getMods(beatmap.mods);
			for (let i = 0; i < mods.length; i++) {
				mods[i] = getModImage(mods[i]);
				const modImage = await Canvas.loadImage(mods[i]);
				ctx.drawImage(modImage, 860 - ((mods.length - i) * 48), 35, 45, 32);
			}

			const output = [canvas, ctx, beatmap];
			return output;
		}

		async function drawTopScore(input, mode, mapScores) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let topScore = mapScores[0];
			roundedRect(ctx, 50, 165, 800, 80, 500 / 70, '70', '57', '63', 0.75);

			let topScoreUserImage;
			try {
				topScoreUserImage = await Canvas.loadImage(`https://s.ppy.sh/a/${topScore.user.id}`);
			} catch (error) {
				topScoreUserImage = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			}

			roundedRect(ctx, 100, 175, 60.39, 60.39, 500 / 70, '0', '0', '0', 0.75);
			ctx.save();
			ctx.clip();
			ctx.drawImage(topScoreUserImage, 100, 175, 60.39, 60.39);
			ctx.restore();

			ctx.font = 'bold 20px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText('#1', 65, 200);

			let gradeSS;
			let gradeS;

			let mods = getMods(topScore.raw_mods);

			if (mods.includes('HD')) {
				gradeSS = await Canvas.loadImage('./other/rank_pictures/XH_Rank.png');
				gradeS = await Canvas.loadImage('./other/rank_pictures/SH_Rank.png');
			} else {
				gradeSS = await Canvas.loadImage('./other/rank_pictures/X_Rank.png');
				gradeS = await Canvas.loadImage('./other/rank_pictures/S_Rank.png');
			}

			let gradeA = await Canvas.loadImage('other/rank_pictures/A_Rank.png');
			let gradeB = await Canvas.loadImage('other/rank_pictures/B_Rank.png');
			let gradeC = await Canvas.loadImage('other/rank_pictures/C_Rank.png');
			let gradeD = await Canvas.loadImage('other/rank_pictures/D_Rank.png');

			if (topScore.rank === 'XH') {
				ctx.drawImage(gradeSS, 60, 210, 32, 16);
			} else if (topScore.rank === 'SH') {
				ctx.drawImage(gradeS, 60, 210, 32, 16);
			} else if (topScore.rank === 'X') {
				ctx.drawImage(gradeSS, 60, 210, 32, 16);
			} else if (topScore.grade === 'S') {
				ctx.drawImage(gradeS, 60, 210, 32, 16);
			} else if (topScore.rank === 'A') {
				ctx.drawImage(gradeA, 60, 210, 32, 16);
			} else if (topScore.rank === 'B') {
				ctx.drawImage(gradeB, 60, 210, 32, 16);
			} else if (topScore.rank === 'C') {
				ctx.drawImage(gradeC, 60, 210, 32, 16);
			} else if (topScore.rank === 'D') {
				ctx.drawImage(gradeD, 60, 210, 32, 16);
			}

			if (!topScore.user.name) {
				topScore.user.name = await getOsuPlayerName(topScore.user.id);
			}
			// nickname
			ctx.font = 'bold 20px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText(`${topScore.user.name}`, 170, 200);

			// submitted on
			ctx.font = '12px comfortaa, sans-serif';
			ctx.textAlign = 'left';
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(getDate(topScore), 170, 228);

			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';

			//total score
			let score = Number(topScore.score);
			ctx.fillText(`${score.toLocaleString('en-US')}`, 615, 195);
			// accuracy
			let accuracy = Math.floor(getAccuracy(topScore, mode) * 100 * 100) / 100;
			ctx.fillText(`${accuracy}%`, 720, 195);
			// maxCombo
			ctx.fillText(`${topScore.maxCombo}`, 780, 195);
			//mods
			for (let i = 0; i < mods.length; i++) {
				const modImage = await Canvas.loadImage(getModImage(mods[i]));
				let xOffset = 28;
				ctx.drawImage(modImage, 720 + xOffset * i, 220, modImage.width / 1.8, modImage.height / 1.8);
			}

			// pp
			ctx.fillText(`${Math.round(topScore.pp)}`, 675, 232);
			// miss
			ctx.fillText(`${topScore.counts['miss']}`, 625, 232);
			//counts 50
			ctx.fillText(`${topScore.counts['50']}`, 575, 232);
			// counts 100
			ctx.fillText(`${topScore.counts['100']}`, 525, 232);
			// counts {300}
			ctx.fillText(`${topScore.counts['300']}`, 475, 232);

			ctx.font = 'bold 8px comfortaa, sans-serif';
			ctx.fillStyle = '#898989';
			ctx.fillText('Total Score', 615, 180);
			ctx.fillText('Accuracy', 720, 180);
			ctx.fillText('Max Combo', 780, 180);

			ctx.fillText('Mods', 720, 217);
			ctx.fillText('PP', 675, 217);
			ctx.fillText('Miss', 625, 217);
			ctx.fillText('50', 575, 217);
			ctx.fillText('100', 525, 217);
			ctx.fillText('300', 475, 217);

			return [canvas, ctx, beatmap];
		}

		async function drawScores(input, mode, userScore, scoresArray) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let globalOffset = 0;

			// try to add user's score
			if (userScore) {
				globalOffset = 90;
				let topScore = userScore.score;
				roundedRect(ctx, 50, 255, 800, 80, 500 / 70, '70', '57', '63', 0.75);

				let topScoreUserImage;
				try {
					topScoreUserImage = await Canvas.loadImage(`https://s.ppy.sh/a/${topScore.user.id}`);
				} catch (error) {
					topScoreUserImage = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
				}

				roundedRect(ctx, 100, 175 + 90, 60.39, 60.39, 500 / 70, '0', '0', '0', 0.75);
				ctx.save();
				ctx.clip();
				ctx.drawImage(topScoreUserImage, 100, 175 + 90, 60.39, 60.39);
				ctx.restore();

				ctx.font = 'bold 20px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'left';

				let gradeSS;
				let gradeS;

				let mods = getMods(topScore.raw_mods);

				if (mods.includes('HD')) {
					gradeSS = await Canvas.loadImage('./other/rank_pictures/XH_Rank.png');
					gradeS = await Canvas.loadImage('./other/rank_pictures/SH_Rank.png');
				} else {
					gradeSS = await Canvas.loadImage('./other/rank_pictures/X_Rank.png');
					gradeS = await Canvas.loadImage('./other/rank_pictures/S_Rank.png');
				}

				let gradeA = await Canvas.loadImage('other/rank_pictures/A_Rank.png');
				let gradeB = await Canvas.loadImage('other/rank_pictures/B_Rank.png');
				let gradeC = await Canvas.loadImage('other/rank_pictures/C_Rank.png');
				let gradeD = await Canvas.loadImage('other/rank_pictures/D_Rank.png');

				let gradeOffset = 0;
				if (userScore.rank) {
					gradeOffset += 10;
					ctx.font = 'bold 20px comfortaa, sans-serif';
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'left';
					ctx.fillText(`#${userScore.rank}`, 60, 290);
				}

				if (topScore.rank === 'XH') {
					ctx.drawImage(gradeSS, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'SH') {
					ctx.drawImage(gradeS, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'X') {
					ctx.drawImage(gradeSS, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'S') {
					ctx.drawImage(gradeS, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'A') {
					ctx.drawImage(gradeA, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'B') {
					ctx.drawImage(gradeB, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'C') {
					ctx.drawImage(gradeC, 60, 200 + 90 + gradeOffset, 32, 16);
				} else if (topScore.rank === 'D') {
					ctx.drawImage(gradeD, 60, 200 + 90 + gradeOffset, 32, 16);
				}

				if (!topScore.user.name) {
					topScore.user.name = await getOsuPlayerName(topScore.user.id);
				}
				// nickname
				ctx.font = 'bold 20px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'left';
				ctx.fillText(`${topScore.user.name}`, 170, 200 + 90);


				// submitted on
				ctx.font = '12px comfortaa, sans-serif';
				ctx.textAlign = 'left';
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText(getDate(topScore), 170, 228 + 90);

				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'left';

				//total score
				let score = Number(topScore.score);
				ctx.fillText(`${score.toLocaleString('en-US')}`, 615, 195 + 90);
				// accuracy
				let accuracy = Math.floor(getAccuracy(topScore, mode) * 100 * 100) / 100;
				ctx.fillText(`${accuracy}%`, 720, 195 + 90);
				// maxCombo
				ctx.fillText(`${topScore.maxCombo}`, 780, 195 + 90);
				//mods
				for (let i = 0; i < mods.length; i++) {
					const modImage = await Canvas.loadImage(getModImage(mods[i]));
					let xOffset = 28;
					ctx.drawImage(modImage, 720 + xOffset * i, 220 + 90, modImage.width / 2, modImage.height / 2);
				}

				// pp
				ctx.fillText(`${Math.round(topScore.pp)}`, 675, 232 + 90);
				// miss
				ctx.fillText(`${topScore.counts['miss']}`, 625, 232 + 90);
				//counts 50
				ctx.fillText(`${topScore.counts['50']}`, 575, 232 + 90);
				// counts 100
				ctx.fillText(`${topScore.counts['100']}`, 525, 232 + 90);
				// counts {300}
				ctx.fillText(`${topScore.counts['300']}`, 475, 232 + 90);

				ctx.font = 'bold 8px comfortaa, sans-serif';
				ctx.fillStyle = '#898989';
				ctx.fillText('Total Score', 615, 180 + 90);
				ctx.fillText('Accuracy', 720, 180 + 90);
				ctx.fillText('Max Combo', 780, 180 + 90);

				ctx.fillText('Mods', 720, 217 + 90);
				ctx.fillText('PP', 675, 217 + 90);
				ctx.fillText('Miss', 625, 217 + 90);
				ctx.fillText('50', 575, 217 + 90);
				ctx.fillText('100', 525, 217 + 90);
				ctx.fillText('300', 475, 217 + 90);
			}

			if (amount > 1 && scoresArray.length > 1) {
				ctx.fillText('Rank', 60, 258.5 + globalOffset);
				ctx.fillText('Score', 90, 258.5 + globalOffset);
				ctx.fillText('Accuracy', 160, 258.5 + globalOffset);
				ctx.fillText('Player', 215, 258.5 + globalOffset);
				ctx.fillText('Max Combo', 380, 258.5 + globalOffset);
				ctx.fillText('300', 475, 258.5 + globalOffset);
				ctx.fillText('100', 525, 258.5 + globalOffset);
				ctx.fillText('50', 575, 258.5 + globalOffset);
				ctx.fillText('Miss', 625, 258.5 + globalOffset);
				ctx.fillText('PP', 675, 258.5 + globalOffset);
				ctx.fillText('Mods', 720, 258.5 + globalOffset);
			}

			let localOffset = 10;
			for (let i = 1; i < scoresArray.length && i < amount; i++) {
				localOffset += 30;
				roundedRect(ctx, 50, 220.5 + globalOffset + localOffset, 800, 20, 500 / 70, '70', '57', '63', 0.75);

				ctx.fillStyle = '#FFFFFF';
				ctx.font = 'bold 10px comfortaa, sans-serif';

				// rank
				ctx.fillText(`#${i + 1}`, 63, 235.5 + globalOffset + localOffset);
				// score
				ctx.fillText(`${Number(scoresArray[i].score).toLocaleString('en-US')}`, 90, 235.5 + globalOffset + localOffset);
				// accuracy
				let accuracy = Math.floor(getAccuracy(scoresArray[i], mode) * 100 * 100) / 100;
				ctx.fillText(`${accuracy}%`, 160, 235.5 + globalOffset + localOffset);
				// nickname
				if (!scoresArray[i].user.name) {
					scoresArray[i].user.name = await getOsuPlayerName(scoresArray[i].user.id);
				}
				ctx.fillText(`${scoresArray[i].user.name}`, 215, 235.5 + globalOffset + localOffset);
				// maxCombo
				ctx.fillText(`${scoresArray[i].maxCombo}`, 380, 235.5 + globalOffset + localOffset);
				// counts 300
				ctx.fillText(`${scoresArray[i].counts['300']}`, 475, 235.5 + globalOffset + localOffset);
				// counts 100
				ctx.fillText(`${scoresArray[i].counts['100']}`, 525, 235.5 + globalOffset + localOffset);
				// counts 50
				ctx.fillText(`${scoresArray[i].counts['50']}`, 575, 235.5 + globalOffset + localOffset);
				// counts miss
				ctx.fillText(`${scoresArray[i].counts['miss']}`, 625, 235.5 + globalOffset + localOffset);
				// pp
				ctx.fillText(`${Math.round(scoresArray[i].pp)}`, 675, 235.5 + globalOffset + localOffset);
				// mods
				let mods = getMods(scoresArray[i].raw_mods);
				for (let j = 0; j < mods.length; j++) {
					const modImage = await Canvas.loadImage(getModImage(mods[j]));
					let xOffset = 28;
					let v = 2;
					if (modImage.width > 45) {
						v = 4;
					}
					ctx.drawImage(modImage, 720 + xOffset * j, 223 + globalOffset + localOffset, modImage.width / v, modImage.height / v);
				}
			}

			return [canvas, ctx, beatmap];
		}

		async function drawFooter(input) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let today = new Date().toLocaleDateString();

			ctx.font = '23px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			if (acronym) {
				ctx.textAlign = 'left';
				ctx.fillText(`Filtered to ${acronym}`, 50, canvas.height - 25);
			}

			ctx.font = '12px comfortaa, sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 10, canvas.height - 10);

			return [canvas, ctx, beatmap];
		}
	}
};

function getDate(topScore) {
	let month = 'January';
	if (topScore.raw_date.substring(5, 7) === '02') {
		month = 'February';
	} else if (topScore.raw_date.substring(5, 7) === '03') {
		month = 'March';
	} else if (topScore.raw_date.substring(5, 7) === '04') {
		month = 'April';
	} else if (topScore.raw_date.substring(5, 7) === '05') {
		month = 'May';
	} else if (topScore.raw_date.substring(5, 7) === '06') {
		month = 'June';
	} else if (topScore.raw_date.substring(5, 7) === '07') {
		month = 'July';
	} else if (topScore.raw_date.substring(5, 7) === '08') {
		month = 'August';
	} else if (topScore.raw_date.substring(5, 7) === '09') {
		month = 'September';
	} else if (topScore.raw_date.substring(5, 7) === '10') {
		month = 'October';
	} else if (topScore.raw_date.substring(5, 7) === '11') {
		month = 'November';
	} else if (topScore.raw_date.substring(5, 7) === '12') {
		month = 'December';
	}
	const formattedSubmitDate = `${topScore.raw_date.substring(8, 10)} ${month} ${topScore.raw_date.substring(0, 4)} ${topScore.raw_date.substring(11, 16)}`;

	return formattedSubmitDate;
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) >= parseFloat(pivot.score)) {
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
const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getModBits, getBeatmapApprovalStatusImage,getGameMode , checkModsCompatibility, roundedRect, getModImage, getMods, getAccuracy, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-map-leaderboard',
	aliases: ['osu-map-leaderboard'],
	description: 'Sends an info card about the leaderboard on the specified beatmap',
	usage: '<id> [mode]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: false,
	args: true,
	cooldown: 5,
	noCooldownMessage: false,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'id') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'gamemode') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'server') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		}
        
        
		let mods = 0;
		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('--NM') || args[i].startsWith('--NF') || args[i].startsWith('--HT') || args[i].startsWith('--EZ')
				|| args[i].startsWith('--HR') || args[i].startsWith('--HD') || args[i].startsWith('--SD') || args[i].startsWith('--DT')
				|| args[i].startsWith('--NC') || args[i].startsWith('--FL') || args[i].startsWith('--SO') || args[i].startsWith('--PF')
				|| args[i].startsWith('--K4') || args[i].startsWith('--K5') || args[i].startsWith('--K6') || args[i].startsWith('--K7')
				|| args[i].startsWith('--K8') || args[i].startsWith('--FI') || args[i].startsWith('--RD') || args[i].startsWith('--K9')
				|| args[i].startsWith('--KC') || args[i].startsWith('--K1') || args[i].startsWith('--K2') || args[i].startsWith('--K3')
				|| args[i].startsWith('--MR')) {
				mods = args[i].substring(2);
				args.splice(i, 1);
				i--;
			} else if (args[i].startsWith('--FM')) {
				args.splice(i, 1);
				i--;
			}
		}

		let modBits = getModBits(mods);
		let limit = 10;

		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('--') && !isNaN(args[i].replace('--', '')) && args[i].replace('--', '').length > 3) {
				limit = parseInt(args[i].replace('--', ''));
				if (limit > 100) {
					limit = 100;
				} else if (limit < 1) {
					limit = 1;
				}
				args.splice(i, 1);
				i--;
			}
		}

		args.forEach(async (arg) => {
			let modCompatibility = await checkModsCompatibility(modBits, getIDFromPotentialOsuLink(arg));
			if (!modCompatibility) {
				modBits = 0;
			}
			const dbBeatmap = await getOsuBeatmap({ beatmapId: getIDFromPotentialOsuLink(arg), modBits: modBits });
			if (dbBeatmap) {
				getBeatmapLeaderboard(msg, interaction, dbBeatmap, limit);
			} else {
				if (msg.id) {
					await msg.reply({ content: `Could not find beatmap \`${arg.replace(/`/g, '')}\`.` });
				} else {
					await interaction.followUp({ content: `Could not find beatmap \`${arg.replace(/`/g, '')}\`.` });
				}
			}
		});
        

		async function getBeatmapLeaderboard(msg, interaction, beatmap, limit) {
			let processingMessage = null;

			if (msg.id) {
				processingMessage = await msg.reply('Processing...');
			}
            
			const canvasWidth = 900;
			const canvasHeight = 133 + limit * 41.66666;

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

			let mode = 'Standard';

			let elements = [canvas, ctx, beatmap];

			elements = await drawTitle(elements);

			elements = await drawTopScore(elements, mode);

			elements = await drawScores(elements, mode);

			await drawFooter(elements);
            
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-map-leaderboard-${beatmap.beatmapId}-${beatmap.mods}.png`);

			if (msg.id) {
				processingMessage.delete();
			}

			let files = [attachment];
            
			if (interaction && interaction.commandName !== 'osu-map-leaderboard') {
				return interaction.followUp({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\nosu! direct: <osu://b/${beatmap.beatmapId}>`, files: files, ephemeral: true });
			} else {
				return await msg.reply({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\nosu! direct: <osu://b/${beatmap.beatmapId}>`, files: files });
			}
		}


		
		async function drawTitle(input) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let beatmapImage;
			roundedRect(ctx, 20, 20, 860, 120, 500 / 70,'70', '57', '63', 0.75);
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
			roundedRect(ctx, 20, 20, 860, 120, 500 / 70,'0', '0', '0', 0.65);

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

			ctx.drawImage(starImage, 65, 75, canvas.height / 500 * 35, canvas.height / 500 * 35);
			ctx.drawImage(beatmapStatusIcon, 22, 25, canvas.height / 500 * 35, canvas.height / 500 * 35);
			ctx.drawImage(modePic, 22, 75, canvas.height / 500 * 35, canvas.height / 500 * 35);

			ctx.font = 'bold 30px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, 70, 55);
			ctx.font = 'bold 23px comfortaa, sans-serif';
			ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100} [${beatmapDifficulty}] mapped by ${beatmap.mapper}`, 100, 103.5);

			const output = [canvas, ctx, beatmap];
			return output;
		}

		async function drawTopScore(input, mode) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let firstApiCall;
			
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getScores({ b: beatmap.beatmapId, m: mode, limit: limit })
				.then(async (mapScores) => {
					let topScore = mapScores[0];
					roundedRect(ctx, 50, 165, 800, 80, 500 / 70, '70', '57', '63', 0.75);

					let topScoreUserImage;
					try {
						topScoreUserImage = await Canvas.loadImage(`https://s.ppy.sh/a/${topScore.user.id}`);
					} catch (error) {
						topScoreUserImage = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
					}

					roundedRect(ctx, 100, 175, canvas.height / 500 * 55, canvas.height / 500 * 55, 500 / 70,'0', '0', '0', 0.75);
					ctx.save();
					ctx.clip();
					ctx.drawImage(topScoreUserImage, 100, 175, canvas.height / 500 * 55, canvas.height / 500 * 55);
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
						ctx.drawImage(modImage, 720 + xOffset * i, 220, canvas.width / 1000 * 28, canvas.height / 500 * 18);
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
				})
			// eslint-disable-next-line no-unused-vars
				.catch(err => {
					//Nothing
				});
			return [canvas, ctx, beatmap];
		}
		
		async function drawScores(input, mode) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			const user = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});
			

			let secondApiCall;
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let globalOffset = 0;

			// check if the user has account linked
			// if so, try to find and add user's score
			if (user) {
				try {
					await osuApi.getScores({ b: beatmap.beatmapId, u: user.osuName, m: mode, limit: 100 })
						.then(async scores => {
							if (scores.length === 0) return;
							globalOffset = 100;
							let topScore = scores[0];
							roundedRect(ctx, 50, 255, 800, 80, 500 / 70, '70', '57', '63', 0.75);

							let topScoreUserImage;
							try {
								topScoreUserImage = await Canvas.loadImage(`https://s.ppy.sh/a/${topScore.user.id}`);
							} catch (error) {
								topScoreUserImage = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
							}

							roundedRect(ctx, 100, 175 + 90, canvas.height / 500 * 55, canvas.height / 500 * 55, 500 / 70,'0', '0', '0', 0.75);
							ctx.save();
							ctx.clip();
							ctx.drawImage(topScoreUserImage, 100, 175 + 90, canvas.height / 500 * 55, canvas.height / 500 * 55);
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

							if (topScore.rank === 'XH') {
								ctx.drawImage(gradeSS, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'SH') {
								ctx.drawImage(gradeS, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'X') {
								ctx.drawImage(gradeSS, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'S') {
								ctx.drawImage(gradeS, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'A') {
								ctx.drawImage(gradeA, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'B') {
								ctx.drawImage(gradeB, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'C') {
								ctx.drawImage(gradeC, 60, 210 + 90, 32, 16);
							} else if (topScore.rank === 'D') {
								ctx.drawImage(gradeD, 60, 210 + 90, 32, 16);
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
								ctx.drawImage(modImage, 720 + xOffset * i, 220 + 90, canvas.width / 1000 * 28, canvas.height / 500 * 18);
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
						});	
				} catch (error) {
					// nothing
				}
			}

			let thirdApiCall;
			//here i need to get all the scores again 

			for (let i = 0; i < mapArray.length && i < limit; i++) {
				roundedRect(ctx, 50, 255 + globalOffset, 800, 80, 500 / 70, '70', '57', '63', 0.75);
				
			}





			return [canvas, ctx, beatmap];
		}

		














		async function drawFooter(input) {
			let canvas = input[0];
			let ctx = input[1];
			let beatmap = input[2];

			let today = new Date().toLocaleDateString();

			ctx.font = '12px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);
			
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
const Discord = require('discord.js');
const osu = require('node-osu');
const { calculateStarRating } = require('osu-sr-calculator');
const { DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects.js');
const { getGuildPrefix, pause } = require('../utils.js');

module.exports = {
	name: 'ecs2021-submit',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Allows you to submit beatmaps for the Elitiri Cup Summer 2021',
	usage: '<NM/HD/HR/DT/FM> <id> | <list>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'ecs2021',
	prefixCommand: true,
	async execute(msg, args) {
		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { tournamentName: 'Elitiri Cup Summer 2021', userId: msg.author.id }
		});

		if (!elitiriSignUp) {
			return msg.channel.send('It seems like you are not registered for any bracket of the Elitiri Cup.');
		}

		if (args[0].toLowerCase() === 'list') {
			const submissions = await DBElitiriCupSubmissions.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUp.osuUserId }
			});

			const guildPrefix = await getGuildPrefix(msg);

			const submissionsEmbed = new Discord.MessageEmbed()
				.setColor('#00FF00')
				.setTitle('You can find your submissions for the Elitiri Cup below')
				.setDescription(`To submit a map use \`${guildPrefix}${this.name} <NM/HD/HR/DT/FM> <id>\``);

			let NMSubmission = null;
			let HDSubmission = null;
			let HRSubmission = null;
			let DTSubmission = null;
			let FMSubmission = null;

			for (let i = 0; i < submissions.length; i++) {
				if (submissions[i].modPool === 'NM') {
					NMSubmission = submissions[i];
				} else if (submissions[i].modPool === 'HD') {
					HDSubmission = submissions[i];
				} else if (submissions[i].modPool === 'HR') {
					HRSubmission = submissions[i];
				} else if (submissions[i].modPool === 'DT') {
					DTSubmission = submissions[i];
				} else if (submissions[i].modPool === 'FM') {
					FMSubmission = submissions[i];
				}
			}

			if (NMSubmission) {
				submissionsEmbed.addField(`NoMod Map: Submitted (${NMSubmission.beatmapId})`, `${NMSubmission.artist} - ${NMSubmission.title} [${NMSubmission.difficulty}] (${Math.round(NMSubmission.starRating * 100) / 100}*)`);
			} else {
				submissionsEmbed
					.setColor('#FF0000')
					.addField('NoMod Map: Not yet submitted', `Please submit a map by using \`${guildPrefix}${this.name} NM <ID>\``);
			}

			if (HDSubmission) {
				submissionsEmbed.addField(`Hidden Map: Submitted (${HDSubmission.beatmapId})`, `${HDSubmission.artist} - ${HDSubmission.title} [${HDSubmission.difficulty}] (${Math.round(HDSubmission.starRating * 100) / 100}*)`);
			} else {
				submissionsEmbed
					.setColor('#FF0000')
					.addField('Hidden Map: Not yet submitted', `Please submit a map by using \`${guildPrefix}${this.name} HD <ID>\``);
			}

			if (HRSubmission) {
				submissionsEmbed.addField(`HardRock Map: Submitted (${HRSubmission.beatmapId})`, `${HRSubmission.artist} - ${HRSubmission.title} [${HRSubmission.difficulty}] (${Math.round(HRSubmission.starRating * 100) / 100}*)`);
			} else {
				submissionsEmbed
					.setColor('#FF0000')
					.addField('HardRock Map: Not yet submitted', `Please submit a map by using \`${guildPrefix}${this.name} HR <ID>\``);
			}

			if (DTSubmission) {
				submissionsEmbed.addField(`DoubleTime Map: Submitted (${DTSubmission.beatmapId})`, `${DTSubmission.artist} - ${DTSubmission.title} [${DTSubmission.difficulty}] (${Math.round(DTSubmission.starRating * 100) / 100}*)`);
			} else {
				submissionsEmbed
					.setColor('#FF0000')
					.addField('DoubleTime Map: Not yet submitted', `Please submit a map by using \`${guildPrefix}${this.name} DT <ID>\``);
			}

			if (FMSubmission) {
				submissionsEmbed.addField(`FreeMod Map: Submitted (${FMSubmission.beatmapId})`, `${FMSubmission.artist} - ${FMSubmission.title} [${FMSubmission.difficulty}] (${Math.round(FMSubmission.starRating * 100) / 100}*)`);
			} else {
				submissionsEmbed
					.setColor('#FF0000')
					.addField('FreeMod Map: Not yet submitted', `Please submit a map by using \`${guildPrefix}${this.name} FM <ID>\``);
			}

			if (msg.channel.type !== 'dm') {
				submissionsEmbed.setFooter(`This embed will automatically get deleted in 30 seconds to avoid leaking maps.\nYou can use 'e!${this.name} list' in my DMs to send the embed without a timer.`);
			}

			let sentMessage = await msg.channel.send(submissionsEmbed);

			if (msg.channel.type !== 'dm') {
				await pause(30000);
				const editEmbed = new Discord.MessageEmbed()
					.setTitle('The embed was automatically deleted to avoid leaking maps.')
					.setDescription(`You can use \`e!${this.name} list\` in my DMs to send the embed without a timer.`);
				sentMessage.edit({ embed: editEmbed });
			}

			return;
		}

		if (args[0].toLowerCase() !== 'nm' && args[0].toLowerCase() !== 'hd' && args[0].toLowerCase() !== 'hr' && args[0].toLowerCase() !== 'dt' && args[0].toLowerCase() !== 'fm') {
			return msg.channel.send('Please specify in which pool the map is supposed to be as the first argument. (NM, HD, HR, DT, FM)');
		}

		let bracketNameParts = elitiriSignUp.bracketName.split(' ');
		let bracket = bracketNameParts[0].toLowerCase();

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getBeatmaps({ b: args[1] })
			.then(async (beatmaps) => {
				getBeatmap(msg, args);

				const existingMap = await DBElitiriCupSubmissions.findOne({
					where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUp.osuUserId, beatmapId: beatmaps[0].id }
				});

				const guildPrefix = await getGuildPrefix(msg);

				const viabilityEmbed = new Discord.MessageEmbed()
					.setColor('#00FF00')
					.setTitle(`You have submitted the beatmap for the tournament (${bracket} bracket)`)
					.setDescription(`To look at your submitted maps use \`${guildPrefix}${this.name} list\``)
					.setFooter(`ID: ${beatmaps[0].id}; Checked by ${msg.author.username}#${msg.author.discriminator}`);

				if (existingMap) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('You already submitted the same map once. Please replace the map by another one in the modpool where it has been submitted already.')
						.setDescription(`To look at your submitted maps use \`${guildPrefix}${this.name} list\`\nIf you think the map is within the restrictions please contact Eliteronix#4208`)
						.addField('Map has been submitted already', 'Each map can just be submitted once for each player');

					return msg.channel.send(viabilityEmbed);
				}

				//The map has to have audio
				if (!(beatmaps[0].hasAudio)) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map has no audio', 'The map has to have audio / can\'t be muted');
				}

				//Mode has to be standard osu!
				if (beatmaps[0].mode !== 'Standard') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not in Standard mode', 'The map has to be in the osu!Standard Mode');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].id === '1033882' || beatmaps[0].id === '529285') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is an Aspire Map', 'The map can\'t be an Aspire map');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].approvalStatus !== 'Ranked' && beatmaps[0].approvalStatus !== 'Approved') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not Ranked', 'The map has to be Ranked');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain < 130) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 2:10');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain > 270) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain < 195) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 2:10 (after DT)');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain > 405) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30 (after DT)');
				}

				//Circle Size: FM maps may not exceed the circle size of 5 when played NoMod
				if (args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.size > 5) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is has too small Circle Size', 'FreeMod maps may not exceed circle size 5 when played NoMod');
				}

				//Top:
				const topLowerDiff = 5.61;
				const topUpperDiff = 7.04;
				//Middle:
				const middleLowerDiff = 5.09;
				const middleUpperDiff = 6.3;
				//Lower:
				const lowerLowerDiff = 4.55;
				const lowerUpperDiff = 5.74;
				//Middle:
				const beginnerLowerDiff = 4.06;
				const beginnerUpperDiff = 5.34;

				if (args[0].toLowerCase() === 'hr') {
					const starRating = await calculateStarRating(beatmaps[0].id, ['HR'], false, true);

					beatmaps[0].difficulty.rating = starRating.HR.total;
					beatmaps[0].difficulty.aim = starRating.HR.aim;
					beatmaps[0].difficulty.speed = starRating.HR.speed;
				} else if (args[0].toLowerCase() === 'dt') {
					const starRating = await calculateStarRating(beatmaps[0].id, ['DT'], false, true);

					beatmaps[0].difficulty.rating = starRating.DT.total;
					beatmaps[0].difficulty.aim = starRating.DT.aim;
					beatmaps[0].difficulty.speed = starRating.DT.speed;
					beatmaps[0].length.total = Math.round(beatmaps[0].length.total / 3 * 2);
					beatmaps[0].length.drain = Math.round(beatmaps[0].length.drain / 3 * 2);
					beatmaps[0].bpm = beatmaps[0].bpm * 1.5;
				}

				//Difficulty: Maps have to be between the specified diffculty
				if (bracket === 'top' && beatmaps[0].difficulty.rating < topLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (bracket === 'top' && beatmaps[0].difficulty.rating > topUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (bracket === 'middle' && beatmaps[0].difficulty.rating < middleLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (bracket === 'middle' && beatmaps[0].difficulty.rating > middleUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (bracket === 'lower' && beatmaps[0].difficulty.rating < lowerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (bracket === 'lower' && beatmaps[0].difficulty.rating > lowerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (bracket === 'beginner' && beatmaps[0].difficulty.rating < beginnerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				} else if (bracket === 'beginner' && beatmaps[0].difficulty.rating > beginnerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				}

				if (viabilityEmbed.title.startsWith('You have submitted the beatmap for the tournament')) {
					const submittedModMap = await DBElitiriCupSubmissions.findOne({
						where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUp.osuUserId, modPool: args[0].toUpperCase() }
					});

					if (submittedModMap) {
						submittedModMap.osuUserId = elitiriSignUp.osuUserId;
						submittedModMap.osuName = elitiriSignUp.osuName;
						submittedModMap.bracketName = elitiriSignUp.bracketName;
						submittedModMap.tournamentName = 'Elitiri Cup Summer 2021';
						submittedModMap.modPool = args[0].toUpperCase();
						submittedModMap.title = beatmaps[0].title;
						submittedModMap.artist = beatmaps[0].artist;
						submittedModMap.difficulty = beatmaps[0].version;
						submittedModMap.starRating = beatmaps[0].difficulty.rating;
						submittedModMap.drainLength = beatmaps[0].length.drain;
						submittedModMap.circleSize = beatmaps[0].difficulty.size;
						submittedModMap.approachRate = beatmaps[0].difficulty.approach;
						submittedModMap.overallDifficulty = beatmaps[0].difficulty.overall;
						submittedModMap.hpDrain = beatmaps[0].difficulty.drain;
						submittedModMap.mapper = beatmaps[0].creator;
						submittedModMap.beatmapId = beatmaps[0].id;
						submittedModMap.beatmapsetId = beatmaps[0].beatmapSetId;
						submittedModMap.bpm = beatmaps[0].bpm;
						submittedModMap.save();
					} else {
						DBElitiriCupSubmissions.create({
							osuUserId: elitiriSignUp.osuUserId,
							osuName: elitiriSignUp.osuName,
							bracketName: elitiriSignUp.bracketName,
							tournamentName: 'Elitiri Cup Summer 2021',
							modPool: args[0].toUpperCase(),
							title: beatmaps[0].title,
							artist: beatmaps[0].artist,
							difficulty: beatmaps[0].version,
							starRating: beatmaps[0].difficulty.rating,
							drainLength: beatmaps[0].length.drain,
							circleSize: beatmaps[0].difficulty.size,
							approachRate: beatmaps[0].difficulty.approach,
							overallDifficulty: beatmaps[0].difficulty.overall,
							hpDrain: beatmaps[0].difficulty.drain,
							mapper: beatmaps[0].creator,
							beatmapId: beatmaps[0].id,
							beatmapsetId: beatmaps[0].beatmapSetId,
							bpm: beatmaps[0].bpm,
						});
					}
				}

				msg.channel.send(viabilityEmbed);
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find beatmap \`${args[2].replace(/`/g, '')}\`.`);
				} else {
					console.log(err);
				}
			}
			);
	}
};

async function getBeatmap(msg, args) {
	let command = require('./osu-beatmap.js');
	let newArgs = [args[1]];
	try {
		command.execute(msg, newArgs, true);
	} catch (error) {
		console.error(error);
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		msg.reply('There was an error trying to execute that command. The developers have been alerted.');
		eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
	}
}
const { getOsuPP, getOsuBeatmap, getMods, logDatabaseQueries, getScoreModpool, humanReadable, adjustHDStarRating, getBeatmapModeId } = require('./utils');
const { DBOsuMultiScores, DBOsuBeatmaps, DBDiscordUsers } = require('./dbObjects');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const osu = require('node-osu');

module.exports = async function (message) {

	//Listen to now playing / now listening and send pp info
	if (message.message.match(/https?:\/\/osu\.ppy\.sh\/beatmapsets\/.+\/\d+/gm)) {
		let beatmapId = message.message.match(/https?:\/\/osu\.ppy\.sh\/beatmapsets\/.+\/\d+/gm)[0].replace(/.+\//gm, '');

		let modBits = 0;

		if (message.message.includes('-NoFail')) {
			modBits += 1;
		}
		if (message.message.includes('-Easy')) {
			modBits += 2;
		}
		if (message.message.includes('+Hidden')) {
			modBits += 8;
		}
		if (message.message.includes('+HardRock')) {
			modBits += 16;
		}
		if (message.message.includes('+DoubleTime')) {
			modBits += 64;
		}
		if (message.message.includes('-HalfTime')) {
			modBits += 256;
		}
		if (message.message.includes('+Nightcore')) {
			modBits += 512 + 64; //Special case
		}
		if (message.message.includes('+Flashlight')) {
			modBits += 1024;
		}
		if (message.message.includes('+SpunOut')) {
			modBits += 4096;
		}
		if (message.message.includes('+FadeIn')) {
			modBits += 1048576;
		}
		if (message.message.includes('+KeyCoop')) {
			modBits += 33554432;
		}

		let beatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: modBits });

		let firstPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 95.00, 0, beatmap.maxCombo);
		let secondPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 98.00, 0, beatmap.maxCombo);
		let thirdPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 99.00, 0, beatmap.maxCombo);
		let fourthPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 100.00, 0, beatmap.maxCombo);

		let mods = getMods(beatmap.mods);

		if (!mods[0]) {
			mods = ['NM'];
		}

		mods = mods.join('');

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]] [${mods}] | 95%: ${Math.round(firstPP)}pp | 98%: ${Math.round(secondPP)}pp | 99%: ${Math.round(thirdPP)}pp | 100%: ${Math.round(fourthPP)}pp`);
		// message starts with '!r'
	} else if (message.message.toLowerCase().startsWith('!r')) {
		let args = message.message.slice(2).trim().split(/ +/);

		let mod = 'NM';
		let userStarRating;
		for (let i = 0; i < args.length; i++) {
			if (args[i] == '-Hidden' || args[i] == '-HD') {
				mod = 'HD';
				args.splice(i, 1);
				i--;
			} else if (args[i] == ('-HardRock') || args[i] == ('-HR')) {
				mod = 'HR';
				args.splice(i, 1);
				i--;
			} else if (args[i] == ('-DoubleTime') || args[i] == ('-DT')) {
				mod = 'DT';
				args.splice(i, 1);
				i--;
			} else if (args[i] == ('-FreeMod') || args[i] == ('-FM')) {
				mod = 'FM';
				args.splice(i, 1);
				i--;
			} else if (parseFloat(args[i]) > 3 && parseFloat(args[i]) < 15) {
				userStarRating = parseFloat(args[i]);
				args.splice(i, 1);
				i--;
			}
		}

		logDatabaseQueries(4, 'commands/osu-beatmap.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				osuName: message.user.banchojs.username
			},
		});
		let beatmaps;

		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				tourneyMap: true,
			},
			order: Sequelize.fn('RANDOM'),
			limit: 500,
		});
		
		if (discordUser && discordUser.osuDuelProvisional && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuDuelStarRating);
		} else if (mod == 'NM' && discordUser && discordUser.osuNoModDuelStarRating != null && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuNoModDuelStarRating);
		} else if (mod == 'HD' && discordUser && discordUser.osuHiddenDuelStarRating != null && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuHiddenDuelStarRating);
		} else if (mod == 'HR' && discordUser && discordUser.osuHardRockDuelStarRating != null && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuHardRockDuelStarRating);
		} else if (mod == 'DT' && discordUser && discordUser.osuDoubleTimeDuelStarRating != null && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuDoubleTimeDuelStarRating);
		} else if (mod == 'FM' && discordUser && discordUser.osuFreeModDuelStarRating != null && !userStarRating) {
			userStarRating = parseFloat(discordUser.osuFreeModDuelStarRating);
		}

		let beatmap;
		for (let i = 0; i < beatmaps.length; i = Math.floor(Math.random() * beatmaps.length)) {
			if (beatmaps[i].noModMap === true && mod == 'NM') {
				if (validSrRange(beatmaps[i], userStarRating) && !checkIfPlayed(beatmaps[i], message.user.banchojs.username)) {
					beatmap = beatmaps[i];
					break;
				}
			} else if (beatmaps[i].hiddenMap === true && mod == 'HD') {
				if (validSrRange(beatmaps[i], userStarRating, true) && !checkIfPlayed(beatmaps[i], message.user.banchojs.username)) {
					beatmap = beatmaps[i];
					break;
				}
			} else if (beatmaps[i].hardRockMap === true && mod == 'HR') {
				if (validSrRange(beatmaps[i], userStarRating) && !checkIfPlayed(beatmaps[i], message.user.banchojs.username)) {
					beatmap = beatmaps[i];
					break;
				}
			} else if (beatmaps[i].doubleTimeMap === true && mod == 'DT') {
				if (validSrRange(beatmaps[i], userStarRating) && !checkIfPlayed(beatmaps[i], message.user.banchojs.username)) {
					beatmap = beatmaps[i];
					break;
				}
			} else if (beatmaps[i].freeModMap === true && mod == 'FM') {
				if (validSrRange(beatmaps[i], userStarRating) && !checkIfPlayed(beatmaps[i], message.user.banchojs.username)) {
					beatmap = beatmaps[i];
					break;
				}
			} else {
				beatmaps.splice(i, 1);
				i++;
			}
		} 
		
		const totalLengthSeconds = (beatmap.totalLength % 60) + '';
		const totalLengthMinutes = (beatmap.totalLength - beatmap.totalLength % 60) / 60;
		const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');
			
		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]] + ${mod} | Beatmap ★: ${Math.floor(beatmap.starRating * 100) / 100} | Your ${mod} duel ★: ${Math.floor(userStarRating * 100) / 100} | ${totalLength}  ♫${beatmap.bpm}  AR${beatmap.approachRate}  OD${beatmap.overallDifficulty}`);
		
		logDatabaseQueries(4, 'commands/osu-beatmap.js DBOsuMultiScores');
		const mapScores = await DBOsuMultiScores.findAll({
			where: {
				beatmapId: beatmap.beatmapId,
				tourneyMatch: true,
				matchName: {
					[Op.notLike]: 'MOTD:%',
				},
				[Op.or]: [
					{ warmup: false },
					{ warmup: null }
				],
			}
		});

		//Bubblesort mapScores by matchId property descending
		mapScores.sort((a, b) => {
			if (parseInt(a.matchId) > parseInt(b.matchId)) {
				return -1;
			}
			if (parseInt(a.matchId) < parseInt(b.matchId)) {
				return 1;
			}
			return 0;
		});

		let tournaments = [];
		let matches = [];

		for (let i = 0; i < mapScores.length; i++) {
			let acronym = mapScores[i].matchName.replace(/:.+/gm, '').replace(/`/g, '');

			if (tournaments.indexOf(acronym) === -1) {
				tournaments.push(acronym);
			}

			let modPool = getScoreModpool(mapScores[i]);

			let date = mapScores[i].matchStartDate;
			let dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;

			matches.push(`${dateReadable}: ${modPool} - ${humanReadable(mapScores[i].score)} - ${mapScores[i].matchName}  - https://osu.ppy.sh/community/matches/${mapScores[i].matchId}`);
		}

		let tournamentOccurences = `The map was played ${mapScores.length} times with any mods in these tournaments (new -> old): ${tournaments.join(', ')}`;

		if (tournaments.length === 0) {
			tournamentOccurences = 'The map was never played in any tournaments.';
		}
		
		message.user.sendMessage(tournamentOccurences);
	}
};

function validSrRange(beatmap, userStarRating, mod) {
	let lowerBound = userStarRating - 0.125;
	let upperBound = userStarRating + 0.125;
	if (mod) {
		beatmap.starRating = adjustHDStarRating(beatmap.starRating, beatmap.approachRate);
	}
	if (Number(beatmap.starRating) < lowerBound || Number(beatmap.starRating) > upperBound) {
		return false;
	} else
		return true;
}

function checkIfPlayed(beatmap, osuName) {
	let now = new Date();
	
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let mode = getBeatmapModeId(beatmap);

	osuApi.getScores({ b: beatmap.beatmapId, u: osuName, m: mode })
		.then(async (scores) => {
			if (!scores[0]) {
				return false;
			} else {
				let score = scores[0];
				let date = new Date(score.raw_date);
				let timeDiff = Math.abs(now.getTime() - date.getTime());
				let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
				if (diffDays < 60) {
					return true;
				} else {
					return false;
				}
			}
			// eslint-disable-next-line no-unused-vars
		}).catch(err => {
			return true;
		}
		);
}
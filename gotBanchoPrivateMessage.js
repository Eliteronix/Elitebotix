const { getOsuPP, getOsuBeatmap, getMods, logDatabaseQueries, adjustHDStarRating, getBeatmapModeId, getUserDuelStarRating, updateQueueChannels } = require('./utils');
const { DBOsuMultiScores, DBOsuBeatmaps, DBDiscordUsers, DBProcessQueue } = require('./dbObjects');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const osu = require('node-osu');

module.exports = async function (client, bancho, message) {
	if (message.message === '!help') {
		await message.user.sendMessage('/ /np - Get the pp values for the current beatmap with the current mods');
		await message.user.sendMessage('!autohost <password> - Autohosts a lobby with tournament maps');
		await message.user.sendMessage('!discord - Sends a link to the main Elitebotix discord');
		await message.user.sendMessage('!play / !play1v1 / !queue1v1 - Queue up for 1v1 matches');
		await message.user.sendMessage('!leave / !leave1v1 / !queue1v1-leave - Leave the queue for 1v1 matches');
		await message.user.sendMessage('!r [mod] [StarRating] - Get a beatmap recommendation for your current duel StarRating. If you don\'t have your account connected to the bot (can be done by using /osu-link command in discord) nor didn\'t specify desired Star Rating, it will use default value of 4.5*');
		//Listen to now playing / now listening and send pp info
	} else if (message.message.match(/https?:\/\/osu\.ppy\.sh\/beatmapsets\/.+\/\d+/gm)) {
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
	} else if (message.message === '!queue1v1' || message.message === '!play1v1' || message.message === '!play') {
		await message.user.fetchFromAPI();
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: message.user.id,
				osuVerified: true
			}
		});

		if (!discordUser) {
			return message.user.sendMessage(`Please connect and verify your account with the bot on discord as a backup by using: '/osu-link connect username:${message.user.username}' [https://discord.gg/Asz5Gfe Discord]`);
		}

		let existingQueueTasks = await DBProcessQueue.findAll({
			where: {
				task: 'duelQueue1v1',
			},
		});

		for (let i = 0; i < existingQueueTasks.length; i++) {
			const osuUserId = existingQueueTasks[i].additions.split(';')[0];

			if (osuUserId === discordUser.osuUserId) {
				return message.user.sendMessage('You are already in the queue for a 1v1 duel.');
			}
		}

		let ownStarRating = 5;
		try {
			message.user.sendMessage('Processing duel rating...');
			ownStarRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: client });

			ownStarRating = ownStarRating.total;
		} catch (e) {
			if (e !== 'No standard plays') {
				console.log(e);
			}
		}

		//Check again in case the user spammed the command
		existingQueueTasks = await DBProcessQueue.findAll({
			where: {
				task: 'duelQueue1v1',
			},
		});

		for (let i = 0; i < existingQueueTasks.length; i++) {
			const osuUserId = existingQueueTasks[i].additions.split(';')[0];

			if (osuUserId === discordUser.osuUserId) {
				return message.user.sendMessage('You are already in the queue for a 1v1 duel.');
			}
		}

		await DBProcessQueue.create({
			guildId: 'none',
			task: 'duelQueue1v1',
			additions: `${discordUser.osuUserId};${ownStarRating};0.125`,
			date: new Date(),
			priority: 9
		});

		updateQueueChannels(client);

		return await message.user.sendMessage('You are now queued up for a 1v1 duel.');
	} else if (message.message === '!queue1v1-leave' || message.message === '!leave1v1' || message.message === '!leave') {
		await message.user.fetchFromAPI();
		let existingQueueTasks = await DBProcessQueue.findAll({
			where: {
				task: 'duelQueue1v1',
			},
		});

		for (let i = 0; i < existingQueueTasks.length; i++) {
			const osuUserId = existingQueueTasks[i].additions.split(';')[0];

			if (osuUserId == message.user.id) {
				await existingQueueTasks[i].destroy();
				updateQueueChannels(client);
				return message.user.sendMessage('You have been removed from the queue for a 1v1 duel.');
			}
		}

		return message.user.sendMessage('You are not in the queue for a 1v1 duel.');
		// message starts with '!r'
	} else if (message.message.toLowerCase().startsWith('!r')) {
		let args = message.message.slice(2).trim().split(/ +/);

		let specifiedRating = false;

		// set default values
		let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];
		let mod = modPools[Math.floor(Math.random() * modPools.length)];
		let userStarRating;
		let mode = 'Standard';

		for (let i = 0; i < args.length; i++) {
			if (args[i].toLowerCase() == 'nomod' || args[i].toLowerCase() == 'nm') {
				mod = 'NM';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == 'hidden' || args[i].toLowerCase() == 'hd') {
				mod = 'HD';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == ('hardrock') || args[i].toLowerCase() == ('hr')) {
				mod = 'HR';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == ('doubletime') || args[i].toLowerCase() == ('dt')) {
				mod = 'DT';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == ('freemod') || args[i].toLowerCase() == ('fm')) {
				mod = 'FM';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == 'mania' || args[i].toLowerCase() == 'm') {
				mode = 'Mania';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == 'taiko' || args[i].toLowerCase() == 't') {
				mode = 'Taiko';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase() == 'catch the beat' || args[i].toLowerCase() == 'ctb') {
				mode = 'Catch the Beat';
				args.splice(i, 1);
				i--;
			} else if (parseFloat(args[i]) > 3 && parseFloat(args[i]) < 15) {
				userStarRating = parseFloat(args[i]);
				args.splice(i, 1);
				i--;
				specifiedRating = true;
			}
		}

		let osuUserId = await message.user.fetchFromAPI()
			.then((user) => {
				return user.id;
				// eslint-disable-next-line no-unused-vars
			}).catch((e) => {
				//
			});
		logDatabaseQueries(4, 'commands/osu-beatmap.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: osuUserId
			},
		});

		let beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				tourneyMap: true,
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});

		if (!discordUser && !userStarRating) {
			userStarRating = 4.5;
		}

		// check if the user has account connected, duel star rating not provisioanl and did not specify SR
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
		// loop through beatmaps until we find one that meets the criteria =>
		// Tourney map with the correct mod
		// Check if the beatmap is within the user's star rating and haven't been played before
		for (let i = 0; i < beatmaps.length; i = Math.floor(Math.random() * beatmaps.length)) {
			let adaptHDStarRating = false;
			// Check if its not valid for it's slot and refresh if it fits
			if (mod == 'NM') {
				if (!beatmaps[i].noModMap) {
					beatmaps.splice(i, 1);
					continue;
				}

				beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });
			} else if (mod == 'HD') {
				if (!beatmaps[i].hiddenMap) {
					beatmaps.splice(i, 1);
					continue;
				}

				beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });

				adaptHDStarRating = true;
			} else if (mod == 'HR') {
				if (!beatmaps[i].hardRockMap) {
					beatmaps.splice(i, 1);
					continue;
				}

				beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 16 });
			} else if (mod == 'DT') {
				if (!beatmaps[i].doubleTimeMap) {
					beatmaps.splice(i, 1);
					continue;
				}

				beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 64 });
			} else if (mod == 'FM') {
				if (!beatmaps[i].freeModMap) {
					beatmaps.splice(i, 1);
					continue;
				}

				beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });
			} else {
				console.log('Something about the mods in !r fucked up if you see this');
				beatmaps.splice(i, 1);
				continue;
			}

			if (!validSrRange(beatmaps[i], userStarRating, adaptHDStarRating)) {
				beatmaps.splice(i, 1);
				continue;
			}

			if (beatmapPlayed(beatmaps[i], osuUserId)) {
				beatmaps.splice(i, 1);
				continue;
			}

			const mapScoreAmount = await DBOsuMultiScores.count({
				where: {
					beatmapId: beatmaps[i].beatmapId,
					matchName: {
						[Op.notLike]: 'MOTD:%',
					},
					[Op.or]: [
						{ warmup: false },
						{ warmup: null }
					],
				}
			});

			if (mapScoreAmount < 25) {
				beatmaps.splice(i, 1);
				continue;
			}

			beatmap = beatmaps[i];
			break;
		}

		const totalLengthSeconds = (beatmap.totalLength % 60) + '';
		const totalLengthMinutes = (beatmap.totalLength - beatmap.totalLength % 60) / 60;
		const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');

		let hdBuff = ' ';
		if (mod == 'HD') {
			hdBuff = ' (with Elitebotix HD buff) ';
		}
		let modeText = '';
		if (mode == 'Mania') {
			modeText = ' [Mania]';
		} else if (mode == 'Catch the Beat') {
			modeText = ' [Catch the Beat]';
		} else if (mode == 'Taiko') {
			modeText = ' [Taiko]';
		}

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]]${modeText} + ${mod} | Beatmap ★: ${Math.floor(beatmap.starRating * 100) / 100}${hdBuff}| Your${specifiedRating ? ' specified' : ''} ${mod} duel ★: ${Math.floor(userStarRating * 100) / 100} | ${totalLength}  ♫${beatmap.bpm}  AR${beatmap.approachRate}  OD${beatmap.overallDifficulty}`);


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

		for (let i = 0; i < mapScores.length; i++) {
			let acronym = mapScores[i].matchName.replace(/:.+/gm, '').replace(/`/g, '');

			if (tournaments.indexOf(acronym) === -1) {
				tournaments.push(acronym);
			}
		}

		let tournamentOccurences = `The map was played ${mapScores.length} times with any mods in these tournaments (new -> old): ${tournaments.join(', ')}`;

		if (tournaments.length === 0) {
			tournamentOccurences = 'The map was never played in any tournaments.';
		}

		message.user.sendMessage(tournamentOccurences);
	} else if (message.message.toLowerCase().startsWith('!autohost')) {
		let args = message.message.slice(9).trim().split(/ +/);

		const command = require('./commands/osu-autohost.js');
		command.execute(message, args, null, [client, bancho]);
	} else if (message.message === '!discord') {
		message.user.sendMessage('Feel free to join the [https://discord.gg/Asz5Gfe Discord]');
	}
};

function validSrRange(beatmap, userStarRating, mod) {
	let lowerBound = userStarRating - 0.125;
	let upperBound = userStarRating + 0.125;
	if (mod) {
		beatmap.starRating = adjustHDStarRating(beatmap.starRating, beatmap.approachRate);
	}
	if (parseFloat(beatmap.starRating) < lowerBound || parseFloat(beatmap.starRating) > upperBound) {
		return false;
	} else
		return true;
}

// returns true if the user has already played the map in the last 60 days, so we should skip it
function beatmapPlayed(beatmap, osuUserId) {
	let now = new Date();

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let mode = getBeatmapModeId(beatmap);

	osuApi.getScores({ b: beatmap.beatmapId, u: osuUserId, m: mode })
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
				} else if (score.rank === 'S') {
					return true;
				} else {
					return false;
				}
			}
			// eslint-disable-next-line no-unused-vars
		}).catch(err => {
			return true;
		});
}
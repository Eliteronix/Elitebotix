const { getOsuPP, getOsuBeatmap, getMods, logDatabaseQueries, getUserDuelStarRating, updateQueueChannels, getValidTournamentBeatmap, getModBits } = require('./utils');
const { DBDiscordUsers, DBProcessQueue } = require('./dbObjects');

module.exports = async function (client, bancho, message) {
	process.send(`osuuser ${message.user.id}}`);

	if (message.message === '!help') {
		await message.user.sendMessage('/ /np - Get the pp values for the current beatmap with the current mods');
		await message.user.sendMessage('!acc - Get the last map\'s pp value with the given accuracy');
		await message.user.sendMessage('!with - Get the pp values for the last map with the given mods');
		await message.user.sendMessage('!autohost <password> - Autohosts a lobby with tournament maps');
		await message.user.sendMessage('!discord - Sends a link to the main Elitebotix discord');
		await message.user.sendMessage('!play / !play1v1 / !queue1v1 - Queue up for 1v1 matches');
		await message.user.sendMessage('!lastrequests - Shows the last 5 twitch requests again');
		await message.user.sendMessage('!leave / !leave1v1 / !queue1v1-leave - Leave the queue for 1v1 matches');
		await message.user.sendMessage('!r [mod] [StarRating] - Get a beatmap recommendation for your current duel StarRating. If you don\'t have your account connected to the bot (can be done by using /osu-link command in discord) nor didn\'t specify desired Star Rating, it will use default value of 4.5*');
		await message.user.sendMessage('!unlink - Unlink your discord account from your osu! account');

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

		await message.user.fetchFromAPI();
		bancho.lastUserMaps.set(message.user.id.toString(), { beatmapId: beatmapId, modBits: modBits });

		let firstPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 95.00, 0, beatmap.maxCombo, client);
		let secondPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 98.00, 0, beatmap.maxCombo, client);
		let thirdPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 99.00, 0, beatmap.maxCombo, client);
		let fourthPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 100.00, 0, beatmap.maxCombo, client);

		let mods = getMods(beatmap.mods);

		if (!mods[0]) {
			mods = ['NM'];
		}

		mods = mods.join('');

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]] [${mods}] | 95%: ${Math.round(firstPP)}pp | 98%: ${Math.round(secondPP)}pp | 99%: ${Math.round(thirdPP)}pp | 100%: ${Math.round(fourthPP)}pp | ♫${beatmap.bpm} CS${beatmap.circleSize} AR${beatmap.approachRate} OD${beatmap.overallDifficulty} HP${beatmap.hpDrain}`);
	} else if (message.message === '!queue1v1' || message.message === '!play1v1' || message.message === '!play') {
		await message.user.fetchFromAPI();

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBDiscordUsers !queue1v1');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId'],
			where: {
				osuUserId: message.user.id,
				osuVerified: true
			}
		});

		if (!discordUser) {
			return message.user.sendMessage(`Please connect and verify your account with the bot on discord as a backup by using: '/osu-link connect username:${message.user.username}' [https://discord.gg/Asz5Gfe Discord]`);
		}

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBProcessQueue check queue task');
		let existingQueueTasks = await DBProcessQueue.findAll({
			attributes: ['additions'],
			where: {
				task: 'duelQueue1v1',
			},
		});

		for (let i = 0; i < existingQueueTasks.length; i++) {
			const osuUserId = existingQueueTasks[i].additions.split(';')[0];

			if (osuUserId === discordUser.osuUserId) {
				let ownRating = parseFloat(existingQueueTasks[i].additions.split(';')[1]);
				let tasksInReach = existingQueueTasks.filter((task) => {
					return Math.abs(ownRating - parseFloat(task.additions.split(';')[1])) < 1;
				});

				return message.user.sendMessage(`You are already in the queue for a 1v1 duel. There are ${existingQueueTasks.length - 1} opponents in the queue (${tasksInReach.length - 1} in reach).`);
			}
		}

		let ownStarRating = 5;
		try {
			message.user.sendMessage('Processing duel rating...');
			ownStarRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: client });

			ownStarRating = ownStarRating.total;
		} catch (e) {
			if (e !== 'No standard plays') {
				console.error('gotBanchoPrivateMessage.js | process duel rating for queue' + e);
			}
		}

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBProcessQueue check queue task again');
		//Check again in case the user spammed the command
		existingQueueTasks = await DBProcessQueue.findAll({
			attributes: ['additions'],
			where: {
				task: 'duelQueue1v1',
			},
		});

		for (let i = 0; i < existingQueueTasks.length; i++) {
			const osuUserId = existingQueueTasks[i].additions.split(';')[0];

			if (osuUserId === discordUser.osuUserId) {
				let ownRating = parseFloat(existingQueueTasks[i].additions.split(';')[1]);
				let tasksInReach = existingQueueTasks.filter((task) => {
					return Math.abs(ownRating - parseFloat(task.additions.split(';')[1])) < 1;
				});

				return message.user.sendMessage(`You are already in the queue for a 1v1 duel. There are ${existingQueueTasks.length - 1} opponents in the queue (${tasksInReach.length - 1} in reach).`);
			}
		}

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBProcessQueue create queue task');
		await DBProcessQueue.create({
			guildId: 'none',
			task: 'duelQueue1v1',
			additions: `${discordUser.osuUserId};${ownStarRating};0.125`,
			date: new Date(),
			priority: 9
		});

		updateQueueChannels(client);

		let tasksInReach = existingQueueTasks.filter((task) => {
			return Math.abs(ownStarRating - parseFloat(task.additions.split(';')[1])) < 1;
		});

		return await message.user.sendMessage(`You are now queued up for a 1v1 duel. There are ${existingQueueTasks.length} opponents in the queue (${tasksInReach.length} in reach).`);
	} else if (message.message === '!queue1v1-leave' || message.message === '!leave1v1' || message.message === '!leave' || message.message === '!quit' || message.message === '!exit' || message.message === '!stop' || message.message === '!cancel') {
		await message.user.fetchFromAPI();

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBProcessQueue !queue1v1-leave');
		let existingQueueTasks = await DBProcessQueue.findAll({
			attributes: ['id', 'additions'],
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

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBDiscordUsers !r');
		const discordUser = await DBDiscordUsers.findOne({
			attributes: [
				'osuUserId',
				'osuDuelProvisional',
				'osuDuelStarRating',
				'osuNoModDuelStarRating',
				'osuHiddenDuelStarRating',
				'osuHardRockDuelStarRating',
				'osuDoubleTimeDuelStarRating',
				'osuFreeModDuelStarRating',
			],
			where: {
				osuUserId: osuUserId
			},
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

		let beatmap = await getValidTournamentBeatmap({ modPool: mod, lowerBound: userStarRating - 0.125, upperBound: userStarRating + 0.125, mode: mode });

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

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]]${modeText} + ${mod} | Beatmap ★: ${Math.floor(beatmap.starRating * 100) / 100}${hdBuff}| Your${specifiedRating ? ' specified' : ''} ${mod} duel ★: ${Math.floor(userStarRating * 100) / 100} | ${totalLength} ♫${beatmap.bpm} CS${beatmap.circleSize} AR${beatmap.approachRate} OD${beatmap.overallDifficulty}`);
	} else if (message.message.toLowerCase().startsWith('!autohost')) {
		let args = message.message.slice(9).trim().split(/ +/);

		const command = require('./commands/osu-autohost.js');

		process.send(`command ${command.name}`);

		command.execute(message, args, null, [client, bancho]);
	} else if (message.message === '!discord') {
		message.user.sendMessage('Feel free to join the [https://discord.gg/Asz5Gfe Discord]');
	} else if (message.message === '!lastrequests') {
		await message.user.fetchFromAPI();
		let userRequests = [];

		for (let i = 0; i < bancho.sentRequests.length; i++) {
			if (bancho.sentRequests[i].osuUserId == message.user.id) {
				userRequests.push(bancho.sentRequests[i]);
			}
		}

		if (userRequests.length === 0) {
			return message.user.sendMessage('You have no requests since the last Elitebotix restart.');
		}

		//Remove everything but the last 5 requests
		while (userRequests.length > 5) {
			userRequests.shift();
		}

		//Resend the messages
		await message.user.sendMessage(`Here are your last ${userRequests.length} twitch requests:`);
		for (let i = 0; i < userRequests.length; i++) {
			await message.user.sendMessage(userRequests[i].main);
			if (userRequests[i].comment) {
				await message.user.sendMessage(userRequests[i].comment);
			}
		}
	} else if (message.message.toLowerCase().startsWith('!with')) {
		let args = message.message.slice(5).trim().split(/ +/);
		let mods = args.join('').toUpperCase();
		let modBits = getModBits(mods);

		await message.user.fetchFromAPI();
		let oldBeatmap = bancho.lastUserMaps.get(message.user.id.toString());

		if (!oldBeatmap) {
			return message.user.sendMessage('Please /np a map first.');
		}

		let beatmap = await getOsuBeatmap({ beatmapId: oldBeatmap.beatmapId, modBits: modBits });

		bancho.lastUserMaps.set(message.user.id.toString(), { beatmapId: oldBeatmap.beatmapId, modBits: modBits });

		let firstPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 95.00, 0, beatmap.maxCombo, client);
		let secondPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 98.00, 0, beatmap.maxCombo, client);
		let thirdPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 99.00, 0, beatmap.maxCombo, client);
		let fourthPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, 100.00, 0, beatmap.maxCombo, client);

		mods = getMods(beatmap.mods);

		if (!mods[0]) {
			mods = ['NM'];
		}

		mods = mods.join('');

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]] [${mods}] | 95%: ${Math.round(firstPP)}pp | 98%: ${Math.round(secondPP)}pp | 99%: ${Math.round(thirdPP)}pp | 100%: ${Math.round(fourthPP)}pp`);
	} else if (message.message.toLowerCase().startsWith('!acc')) {
		let args = message.message.slice(5).trim().split(/ +/);

		if (!args[0]) {
			return message.user.sendMessage('Please specify an accuracy.');
		}

		let acc = parseFloat(args[0].replace(',', '.'));

		await message.user.fetchFromAPI();
		let oldBeatmap = bancho.lastUserMaps.get(message.user.id.toString());

		if (!oldBeatmap) {
			return message.user.sendMessage('Please /np a map first.');
		}

		let beatmap = await getOsuBeatmap({ beatmapId: oldBeatmap.beatmapId, modBits: oldBeatmap.modBits });

		let accPP = await getOsuPP(beatmap.beatmapId, beatmap.mods, acc, 0, beatmap.maxCombo, client);

		let mods = getMods(beatmap.mods);

		if (!mods[0]) {
			mods = ['NM'];
		}

		mods = mods.join('');

		message.user.sendMessage(`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}]] [${mods}] | ${acc}%: ${Math.round(accPP)}pp`);
	} else if (message.message === '!unlink') {
		await message.user.fetchFromAPI();

		logDatabaseQueries(4, 'gotBanchoPrivateMessage.js DBDiscordUsers !unlink');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'userId', 'osuVerified'],
			where: {
				osuUserId: message.user.id
			}
		});

		if (discordUser && discordUser.userId) {
			discordUser.userId = null;
			discordUser.osuVerified = false;
			await discordUser.save();

			return await message.user.sendMessage('Your discord account has been unlinked from your osu! account.');
		} else {
			await message.user.sendMessage('You have no discord account linked to your osu! account.');
		}
	}
};
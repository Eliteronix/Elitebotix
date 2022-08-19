const { DBDiscordUsers, DBProcessQueue } = require('./dbObjects');
const { getOsuPP, getOsuBeatmap, getMods, getUserDuelStarRating, updateQueueChannels } = require('./utils');

module.exports = async function (client, bancho, message) {
	if (message.message === '!help') {
		await message.user.sendMessage('/ /np - Get the pp values for the current beatmap with the current mods');
		await message.user.sendMessage('!play / !play1v1 / !queue1v1 - Queue up for 1v1 matches');
		await message.user.sendMessage('!leave / !leave1v1 / !queue1v1-leave - Leave the queue for 1v1 matches');
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
	}
};
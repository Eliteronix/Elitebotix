const { populateMsgFromInteraction, logMatchCreation, getOsuUserServerMode, getOsuBeatmap, getBeatmapModeId, adjustHDStarRating } = require('../utils');
const { Permissions } = require('discord.js');
const { DBDiscordUsers, DBOsuBeatmaps, DBOsuMultiScores } = require('../dbObjects');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const osu = require('node-osu');

module.exports = {
	name: 'osu-autohost',
	// aliases: ['osu-map', 'beatmap-info', 'o-bm'],
	description: 'Hosts an automated lobby ingame',
	// usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		let password = null;
		let winCondition = '0';
		let modsInput = null;
		let nmStarRating = null;
		let hdStarRating = null;
		let hrStarRating = null;
		let dtStarRating = null;
		let fmStarRating = null;
		if (interaction) {
			await interaction.deferReply({ ephemeral: true });
			msg = await populateMsgFromInteraction(interaction);

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'password') {
					password = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'condition') {
					winCondition = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'mods') {
					modsInput = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'nmstarrating') {
					nmStarRating = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'hdstarrating') {
					hdStarRating = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'hrstarrating') {
					hrStarRating = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'dtstarrating') {
					dtStarRating = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'fmstarrating') {
					fmStarRating = interaction.options._hoistedOptions[i].value;
				}
			}
		}

		if (args.length) {
			password = args[0];
		}

		let createMessage = 'Creating lobby...';
		if (password) {
			createMessage = `Creating lobby with password ${password} ...`;
		}

		if (interaction) {
			await interaction.editReply(createMessage);
		} else {
			await msg.user.sendMessage(createMessage);
		}

		//get the commandUser
		let commandUser = null;
		if (interaction) {
			const commandConfig = await getOsuUserServerMode(msg, []);
			commandUser = commandConfig[0];

			if (!commandUser || commandUser && !commandUser.osuUserId || commandUser && commandUser.osuVerified !== true) {
				return interaction.editReply('Please connect and verify your account with the bot on discord as a backup by using: \'/osu-link connect\' [https://discord.gg/Asz5Gfe Discord]');
			}
		} else {
			await msg.user.fetchFromAPI();
			commandUser = await DBDiscordUsers.findOne({
				where: {
					osuUserId: msg.user.id,
					osuVerified: true
				}
			});

			if (!commandUser) {
				return msg.user.sendMessage(`Please connect and verify your account with the bot on discord as a backup by using: '/osu-link connect username:${msg.user.username}' [https://discord.gg/Asz5Gfe Discord]`);
			}
		}

		//Fill in star ratings if needed
		if (!nmStarRating) {
			nmStarRating = parseFloat(commandUser.osuNoModDuelStarRating);
		}
		if (!hdStarRating) {
			hdStarRating = parseFloat(commandUser.osuHiddenDuelStarRating);
		}
		if (!hrStarRating) {
			hrStarRating = parseFloat(commandUser.osuHardRockDuelStarRating);
		}
		if (!dtStarRating) {
			dtStarRating = parseFloat(commandUser.osuDoubleTimeDuelStarRating);
		}
		if (!fmStarRating) {
			fmStarRating = parseFloat(commandUser.osuFreeModDuelStarRating);
		}

		let matchName = 'ETX Autohost';

		//Get the mods that should be played
		let mods = [];

		if (!modsInput || modsInput && modsInput.toLowerCase().includes('nm')) {
			mods.push('NM');
			matchName = matchName + ` | ${nmStarRating.toFixed(1)} NM`;
		}
		if (!modsInput || modsInput && modsInput.toLowerCase().includes('hd')) {
			mods.push('HD');
			matchName = matchName + ` | ${hdStarRating.toFixed(1)} HD`;
		}
		if (!modsInput || modsInput && modsInput.toLowerCase().includes('hr')) {
			mods.push('HR');
			matchName = matchName + ` | ${hrStarRating.toFixed(1)} HR`;
		}
		if (!modsInput || modsInput && modsInput.toLowerCase().includes('dt')) {
			mods.push('DT');
			matchName = matchName + ` | ${dtStarRating.toFixed(1)} DT`;
		}
		if (!modsInput || modsInput && modsInput.toLowerCase().includes('fm')) {
			mods.push('FM');
			matchName = matchName + ` | ${fmStarRating.toFixed(1)} FM`;
		}

		if (!mods.length) {
			mods.push('NM');
			matchName = matchName + ` | ${nmStarRating.toFixed(1)} NM`;

			mods.push('HD');
			matchName = matchName + ` | ${hdStarRating.toFixed(1)} HD`;

			mods.push('HR');
			matchName = matchName + ` | ${hrStarRating.toFixed(1)} HR`;

			mods.push('DT');
			matchName = matchName + ` | ${dtStarRating.toFixed(1)} DT`;

			mods.push('FM');
			matchName = matchName + ` | ${fmStarRating.toFixed(1)} FM`;
		}

		let channel = null;

		let bancho = additionalObjects[1];

		for (let i = 0; i < 5; i++) {
			try {
				try {
					await bancho.connect();
				} catch (error) {
					if (!error.message === 'Already connected/connecting') {
						throw (error);
					}
				}
				channel = await bancho.createLobby(matchName);
				break;
			} catch (error) {
				if (i === 4) {
					if (interaction) {
						return await interaction.editReply('I am having issues creating the lobby and the match has been aborted.\nPlease try again later.');
					} else {
						return msg.user.sendMessage('I am having issues creating the lobby and the match has been aborted. Please try again later.');
					}
				} else {
					await new Promise(resolve => setTimeout(resolve, 10000));
				}
			}
		}

		const lobby = channel.lobby;
		logMatchCreation(additionalObjects[0], lobby.name, lobby.id);

		if (password) {
			await lobby.setPassword(password);
		}

		await channel.sendMessage('!mp addref Eliteronix');
		await channel.sendMessage(`!mp set 0 ${winCondition}`);

		await channel.sendMessage(`!mp invite #${commandUser.osuUserId}`);

		if (interaction) {
			await interaction.editReply('The lobby has been created. You have been sent an invite ingame.');
		}

		let poolIterator = 0;
		let currentPotentialMods = [];

		for (let i = 0; i < 10; i++) {
			getNextModPool();
		}

		channel.on('message', async (msg) => {
			if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
				await channel.sendMessage('!mp start 10');
			} else if (msg.user._id == commandUser.osuUserId) {
				let modUpdate = false;
				//If it is the creator
				if (msg.message === '!help') {
					await channel.sendMessage('!abort - Aborts the currently playing map.');
					await channel.sendMessage('!condition - Allows you to change the win condition. (Score/Scorev2/Accuracy)');
					await channel.sendMessage('!password - Allows you to change the password.');
					await channel.sendMessage('!skip - Skips the currently selected map.');
					await channel.sendMessage('!timeout - Increases the timer to 5 minutes.');
					await channel.sendMessage('!mods - Allows you to change the played mods. (Ex: "NM,HR,DT")');
					await channel.sendMessage('!nm - Allows you to change the NM SR (Ex: "!nm 5.6")');
					await channel.sendMessage('!hd - Allows you to change the HD SR (Ex: "!hd 5.6")');
					await channel.sendMessage('!hr - Allows you to change the HR SR (Ex: "!hr 5.6")');
					await channel.sendMessage('!dt - Allows you to change the DT SR (Ex: "!dt 5.6")');
					await channel.sendMessage('!fm - Allows you to change the FM SR (Ex: "!fm 5.6")');
				} else if (msg.message === '!skip') {
					await channel.sendMessage('!mp aborttimer');
					await channel.sendMessage('Looking for new map...');
					let nextModPool = getNextModPool(true);
					let beatmap = await getPoolBeatmap(nextModPool, nmStarRating, hdStarRating, hrStarRating, dtStarRating, fmStarRating, commandUser);

					while (lobby._beatmapId != beatmap.beatmapId) {
						await channel.sendMessage(`!mp map ${beatmap.beatmapId}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
					}

					while (nextModPool === 'FM' && !lobby.freemod //There is no FreeMod combination otherwise
						|| nextModPool !== 'FM' && lobby.freemod
						|| nextModPool !== 'NM' && nextModPool !== 'FM' && !lobby.mods
						|| nextModPool === 'NM' && lobby.mods && lobby.mods.length //Only NM has only one mod
						|| nextModPool === 'HD' && lobby.mods && lobby.mods.length < 1
						|| nextModPool === 'HD' && lobby.mods && lobby.mods[0].shortMod !== 'hd'
						|| nextModPool === 'HR' && lobby.mods && lobby.mods.length < 1
						|| nextModPool === 'HR' && lobby.mods && lobby.mods[0].shortMod !== 'hr'
						|| nextModPool === 'DT' && lobby.mods && lobby.mods.length < 1
						|| nextModPool === 'DT' && lobby.mods && lobby.mods[0].shortMod !== 'dt'
					) {
						if (nextModPool === 'FM') {
							await channel.sendMessage('!mp mods FreeMod');
						} else {
							await channel.sendMessage(`!mp mods ${nextModPool}`);
						}

						await new Promise(resolve => setTimeout(resolve, 5000));
					}

					await channel.sendMessage('!mp timer 120');
				} else if (msg.message === '!abort') {
					await channel.sendMessage('!mp abort');
					await new Promise(resolve => setTimeout(resolve, 5000));
					await channel.sendMessage('!mp timer 120');
				} else if (msg.message === '!timeout') {
					await channel.sendMessage('!mp timer 300');
				} else if (msg.message.toLowerCase().startsWith('!mods')) {
					let matchName = 'ETX Autohost';

					//Get the mods that should be played
					mods = [];

					if (msg.message.toLowerCase().includes('nm')) {
						mods.push('NM');
						matchName = matchName + ` | ${nmStarRating.toFixed(1)} NM`;
					}
					if (msg.message.toLowerCase().includes('hd')) {
						mods.push('HD');
						matchName = matchName + ` | ${hdStarRating.toFixed(1)} HD`;
					}
					if (msg.message.toLowerCase().includes('hr')) {
						mods.push('HR');
						matchName = matchName + ` | ${hrStarRating.toFixed(1)} HR`;
					}
					if (msg.message.toLowerCase().includes('dt')) {
						mods.push('DT');
						matchName = matchName + ` | ${dtStarRating.toFixed(1)} DT`;
					}
					if (msg.message.toLowerCase().includes('fm')) {
						mods.push('FM');
						matchName = matchName + ` | ${fmStarRating.toFixed(1)} FM`;
					}

					if (!mods.length) {
						mods.push('NM');
						matchName = matchName + ` | ${nmStarRating.toFixed(1)} NM`;

						mods.push('HD');
						matchName = matchName + ` | ${hdStarRating.toFixed(1)} HD`;

						mods.push('HR');
						matchName = matchName + ` | ${hrStarRating.toFixed(1)} HR`;

						mods.push('DT');
						matchName = matchName + ` | ${dtStarRating.toFixed(1)} DT`;

						mods.push('FM');
						matchName = matchName + ` | ${fmStarRating.toFixed(1)} FM`;
					}

					currentPotentialMods = [];

					for (let i = 0; i < 10; i++) {
						getNextModPool();
					}

					await channel.sendMessage(`!mp name ${matchName}`);
					await channel.sendMessage('Adapted the played mods. The changes will take place next map. Use !skip to update now.');
				} else if (msg.message.toLowerCase().startsWith('!nm')) {
					let args = msg.message.slice(3).trim().split(/ +/);
					if (!args.length) {
						await channel.sendMessage('You didn\'t specify a star rating');
					} else if (isNaN(parseFloat(args[0]))) {
						await channel.sendMessage(`"${args[0]}" is not a valid star rating`);
					} else if (parseFloat(args[0]) > 10 || parseFloat(args[0]) < 3.5) {
						await channel.sendMessage('The star rating should not be higher than 10 or lower than 3.5');
					} else {
						nmStarRating = parseFloat(args[0]);
						modUpdate = true;
					}
				} else if (msg.message.toLowerCase().startsWith('!hd')) {
					let args = msg.message.slice(3).trim().split(/ +/);
					if (!args.length) {
						await channel.sendMessage('You didn\'t specify a star rating');
					} else if (isNaN(parseFloat(args[0]))) {
						await channel.sendMessage(`"${args[0]}" is not a valid star rating`);
					} else if (parseFloat(args[0]) > 10 || parseFloat(args[0]) < 3.5) {
						await channel.sendMessage('The star rating should not be higher than 10 or lower than 3.5');
					} else {
						hdStarRating = parseFloat(args[0]);
						modUpdate = true;
					}
				} else if (msg.message.toLowerCase().startsWith('!hr')) {
					let args = msg.message.slice(3).trim().split(/ +/);
					if (!args.length) {
						await channel.sendMessage('You didn\'t specify a star rating');
					} else if (isNaN(parseFloat(args[0]))) {
						await channel.sendMessage(`"${args[0]}" is not a valid star rating`);
					} else if (parseFloat(args[0]) > 10 || parseFloat(args[0]) < 3.5) {
						await channel.sendMessage('The star rating should not be higher than 10 or lower than 3.5');
					} else {
						hrStarRating = parseFloat(args[0]);
						modUpdate = true;
					}
				} else if (msg.message.toLowerCase().startsWith('!dt')) {
					let args = msg.message.slice(3).trim().split(/ +/);
					if (!args.length) {
						await channel.sendMessage('You didn\'t specify a star rating');
					} else if (isNaN(parseFloat(args[0]))) {
						await channel.sendMessage(`"${args[0]}" is not a valid star rating`);
					} else if (parseFloat(args[0]) > 10 || parseFloat(args[0]) < 3.5) {
						await channel.sendMessage('The star rating should not be higher than 10 or lower than 3.5');
					} else {
						dtStarRating = parseFloat(args[0]);
						modUpdate = true;
					}
				} else if (msg.message.toLowerCase().startsWith('!fm')) {
					let args = msg.message.slice(3).trim().split(/ +/);
					if (!args.length) {
						await channel.sendMessage('You didn\'t specify a star rating');
					} else if (isNaN(parseFloat(args[0]))) {
						await channel.sendMessage(`"${args[0]}" is not a valid star rating`);
					} else if (parseFloat(args[0]) > 10 || parseFloat(args[0]) < 3.5) {
						await channel.sendMessage('The star rating should not be higher than 10 or lower than 3.5');
					} else {
						fmStarRating = parseFloat(args[0]);
						modUpdate = true;
					}
				} else if (msg.message.toLowerCase().startsWith('!password')) {
					let args = msg.message.slice(9).trim().split(/ +/);

					if (args[0]) {
						lobby.setPassword(args[0]);
						await channel.sendMessage(`Updated the password to ${args[0]}`);
					} else {
						await channel.sendMessage('You didn\'t specify a password');
					}
				} else if (msg.message.toLowerCase().startsWith('!condition')) {
					let condition = '0';

					if (msg.message.toLowerCase().includes('v2')) {
						condition = '3';
					} else if (msg.message.toLowerCase().includes('acc')) {
						condition = '1';
					}

					await channel.sendMessage(`!mp set 0 ${condition}`);
					await channel.sendMessage('The condition has been adapted.');
				}

				if (modUpdate) {
					let matchName = 'ETX Autohost';

					//Get the mods that should be played

					if (mods.includes('NM')) {
						matchName = matchName + ` | ${nmStarRating.toFixed(1)} NM`;
					}
					if (mods.includes('HD')) {
						matchName = matchName + ` | ${hdStarRating.toFixed(1)} HD`;
					}
					if (mods.includes('HR')) {
						matchName = matchName + ` | ${hrStarRating.toFixed(1)} HR`;
					}
					if (mods.includes('DT')) {
						matchName = matchName + ` | ${dtStarRating.toFixed(1)} DT`;
					}
					if (mods.includes('FM')) {
						matchName = matchName + ` | ${fmStarRating.toFixed(1)} FM`;
					}

					await channel.sendMessage(`!mp name ${matchName}`);
					await channel.sendMessage('Adapted the star rating. The changes will take place next map. Use !skip to update now.');
				}
			}
		});

		lobby.on('playerJoined', async (obj) => {
			if (commandUser.osuUserId === obj.player.user.id.toString()) {
				let nextModPool = getNextModPool(true);
				let beatmap = await getPoolBeatmap(nextModPool, nmStarRating, hdStarRating, hrStarRating, dtStarRating, fmStarRating, commandUser);

				while (lobby._beatmapId != beatmap.beatmapId) {
					await channel.sendMessage(`!mp map ${beatmap.beatmapId}`);
					await new Promise(resolve => setTimeout(resolve, 5000));
				}

				while (nextModPool === 'FM' && !lobby.freemod //There is no FreeMod combination otherwise
					|| nextModPool !== 'FM' && lobby.freemod
					|| nextModPool !== 'NM' && nextModPool !== 'FM' && !lobby.mods
					|| nextModPool === 'NM' && lobby.mods && lobby.mods.length //Only NM has only one mod
					|| nextModPool === 'HD' && lobby.mods && lobby.mods.length < 1
					|| nextModPool === 'HD' && lobby.mods && lobby.mods[0].shortMod !== 'hd'
					|| nextModPool === 'HR' && lobby.mods && lobby.mods.length < 1
					|| nextModPool === 'HR' && lobby.mods && lobby.mods[0].shortMod !== 'hr'
					|| nextModPool === 'DT' && lobby.mods && lobby.mods.length < 1
					|| nextModPool === 'DT' && lobby.mods && lobby.mods[0].shortMod !== 'dt'
				) {
					if (nextModPool === 'FM') {
						await channel.sendMessage('!mp mods FreeMod');
					} else {
						await channel.sendMessage(`!mp mods ${nextModPool}`);
					}

					await new Promise(resolve => setTimeout(resolve, 5000));
				}

				await channel.sendMessage('!mp timer 120');
			}
		});

		lobby.on('allPlayersReady', async () => {
			await channel.sendMessage('!mp start 5');
		});

		lobby.on('matchFinished', async () => {
			let nextModPool = getNextModPool(true);
			let beatmap = await getPoolBeatmap(nextModPool, nmStarRating, hdStarRating, hrStarRating, dtStarRating, fmStarRating, commandUser);

			while (lobby._beatmapId != beatmap.beatmapId) {
				await channel.sendMessage(`!mp map ${beatmap.beatmapId}`);
				await new Promise(resolve => setTimeout(resolve, 5000));
			}

			while (nextModPool === 'FM' && !lobby.freemod //There is no FreeMod combination otherwise
				|| nextModPool !== 'FM' && lobby.freemod
				|| nextModPool !== 'NM' && nextModPool !== 'FM' && !lobby.mods
				|| nextModPool === 'NM' && lobby.mods && lobby.mods.length //Only NM has only one mod
				|| nextModPool === 'HD' && lobby.mods && lobby.mods.length < 1
				|| nextModPool === 'HD' && lobby.mods && lobby.mods[0].shortMod !== 'hd'
				|| nextModPool === 'HR' && lobby.mods && lobby.mods.length < 1
				|| nextModPool === 'HR' && lobby.mods && lobby.mods[0].shortMod !== 'hr'
				|| nextModPool === 'DT' && lobby.mods && lobby.mods.length < 1
				|| nextModPool === 'DT' && lobby.mods && lobby.mods[0].shortMod !== 'dt'
			) {
				if (nextModPool === 'FM') {
					await channel.sendMessage('!mp mods FreeMod');
				} else {
					await channel.sendMessage(`!mp mods ${nextModPool}`);
				}
				await new Promise(resolve => setTimeout(resolve, 5000));
			}

			await channel.sendMessage('!mp timer 120');
		});

		function getNextModPool(remove) {
			let modPool = null;

			if (remove) {
				let index = Math.floor(Math.random() * currentPotentialMods.length);
				modPool = currentPotentialMods[index];
				currentPotentialMods.splice(index, 1);
			}

			currentPotentialMods.push(mods[poolIterator % mods.length]);
			poolIterator++;

			return modPool;
		}
	},
};

async function getPoolBeatmap(modPool, nmStarRating, hdStarRating, hrStarRating, dtStarRating, fmStarRating, commandUser) {
	let beatmaps = null;
	let starRating = null;
	let adaptHDStarRating = false;
	if (modPool === 'NM') {
		starRating = nmStarRating;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				noModMap: true
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});
	} else if (modPool === 'HD') {
		adaptHDStarRating = true;
		starRating = hdStarRating;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				hiddenMap: true
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});
	} else if (modPool === 'HR') {
		starRating = hrStarRating;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				hardRockMap: true
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});
	} else if (modPool === 'DT') {
		starRating = dtStarRating;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				doubleTimeMap: true
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});
	} else if (modPool === 'FM') {
		starRating = fmStarRating;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				mode: 'Standard',
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				BeatmapSetID: {
					[Op.not]: null,
				},
				freeModMap: true
			},
			order: Sequelize.fn('RANDOM'),
			// because it gets random beatmaps each time, 150 limit is fine for quick reply
			limit: 150,
		});
	}

	// loop through beatmaps until we find one that meets the criteria =>
	// Tourney map with the correct mod
	// Check if the beatmap is within the user's star rating and haven't been played before
	for (let i = 0; i < beatmaps.length; i = Math.floor(Math.random() * beatmaps.length)) {
		// refresh the map
		if (modPool == 'NM') {
			beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });
		} else if (modPool == 'HD') {
			beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });
		} else if (modPool == 'HR') {
			beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 16 });
		} else if (modPool == 'DT') {
			beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 64 });
		} else if (modPool == 'FM') {
			beatmaps[i] = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, modBits: 0 });
		}

		if (!validSrRange(beatmaps[i], starRating, adaptHDStarRating)) {
			beatmaps.splice(i, 1);
			continue;
		}

		if (beatmapPlayed(beatmaps[i], commandUser.osuUserId)) {
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
			},
			limit: 26,
		});

		if (mapScoreAmount < 25) {
			beatmaps.splice(i, 1);
			continue;
		}

		return beatmaps[i];
	}
}

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
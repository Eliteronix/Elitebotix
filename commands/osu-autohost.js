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
				//If it is the creator
				if (msg.message === '!help') {
					await channel.sendMessage('!abort - Aborts the currently playing map.');
					await channel.sendMessage('!skip - Skips the currently selected map.');
				} else if (msg.message === '!skip') {
					let nextModPool = getNextModPool(true);
					let beatmap = await getPoolBeatmap(nextModPool, nmStarRating, hdStarRating, hrStarRating, dtStarRating, fmStarRating, commandUser);

					while (lobby._beatmapId != beatmap.beatmapId) {
						await channel.sendMessage(`!mp map ${beatmap.beatmapId}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
					}

					while (nextModPool === 'FM' && !lobby.freemod //There is no FreeMod combination otherwise
						|| nextModPool === 'NM' && lobby.mods.length !== 0 //Only NM has only one mod
						|| nextModPool === 'HD' && lobby.mods.length < 1
						|| nextModPool === 'HD' && lobby.mods[0].shortMod !== 'hd'
						|| nextModPool === 'HR' && lobby.mods.length < 1
						|| nextModPool === 'HR' && lobby.mods[0].shortMod !== 'hr'
						|| nextModPool === 'DT' && lobby.mods.length < 1
						|| nextModPool === 'DT' && lobby.mods[0].shortMod !== 'dt'
					) {
						await channel.sendMessage(`!mp mods ${nextModPool}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
					}

					await channel.sendMessage('!mp timer 120');
				} else if (msg.message === '!abort') {
					await channel.sendMessage('!mp abort');
					await new Promise(resolve => setTimeout(resolve, 5000));
					await channel.sendMessage('!mp timer 120');
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
					|| nextModPool === 'NM' && lobby.mods.length !== 0 //Only NM has only one mod
					|| nextModPool === 'HD' && lobby.mods.length < 1
					|| nextModPool === 'HD' && lobby.mods[0].shortMod !== 'hd'
					|| nextModPool === 'HR' && lobby.mods.length < 1
					|| nextModPool === 'HR' && lobby.mods[0].shortMod !== 'hr'
					|| nextModPool === 'DT' && lobby.mods.length < 1
					|| nextModPool === 'DT' && lobby.mods[0].shortMod !== 'dt'
				) {
					await channel.sendMessage(`!mp mods ${nextModPool}`);
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
				|| nextModPool === 'NM' && lobby.mods.length !== 0 //Only NM has only one mod
				|| nextModPool === 'HD' && lobby.mods.length < 1
				|| nextModPool === 'HD' && lobby.mods[0].shortMod !== 'hd'
				|| nextModPool === 'HR' && lobby.mods.length < 1
				|| nextModPool === 'HR' && lobby.mods[0].shortMod !== 'hr'
				|| nextModPool === 'DT' && lobby.mods.length < 1
				|| nextModPool === 'DT' && lobby.mods[0].shortMod !== 'dt'
			) {
				await channel.sendMessage(`!mp mods ${nextModPool}`);
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

	console.log('got maps');

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
		console.log('Refreshed map');

		if (!validSrRange(beatmaps[i], starRating, adaptHDStarRating)) {
			beatmaps.splice(i, 1);
			continue;
		}

		console.log('Valid SR');

		if (beatmapPlayed(beatmaps[i], commandUser.osuUserId)) {
			beatmaps.splice(i, 1);
			continue;
		}

		console.log('Not played');

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

		console.log('Returning', beatmaps[i]);

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
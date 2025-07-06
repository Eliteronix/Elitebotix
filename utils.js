const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBActivityRoles, DBOsuBeatmaps, DBBirthdayGuilds, DBOsuTourneyFollows, DBDuelRatingHistory, DBOsuForumPosts, DBOsuTrackingUsers, DBOsuGuildTrackers, DBOsuMultiGameScores, DBOsuMultiMatches, DBOsuMultiGames } = require('./dbObjects');
const { leaderboardEntriesPerPage, logBroadcastEval, traceOsuAPICalls, matchMakingAcronyms } = require('./config.json');
const Canvas = require('@napi-rs/canvas');
const Discord = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const osu = require('node-osu');
const { Op } = require('sequelize');
const rosu = require('rosu-pp-js');
const mapsRetriedTooOften = [];
const fs = require('fs');

module.exports = {
	getGuildPrefix: async function (msg) {
		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === Discord.ChannelType.DM) {
			//Set prefix to standard prefix
			guildPrefix = 'e!';
		} else {
			const guild = await DBGuilds.findOne({
				attributes: ['customPrefixUsed', 'customPrefix'],
				where: {
					guildId: msg.guildId
				},
			});

			//Check if a guild record was found
			if (guild) {
				if (guild.customPrefixUsed) {
					guildPrefix = guild.customPrefix;
				} else {
					//Set prefix to standard prefix
					guildPrefix = 'e!';
				}
			} else {
				//Set prefix to standard prefix
				guildPrefix = 'e!';
			}
		}
		return guildPrefix;
	},
	humanReadable: function (input) {
		let output = '';
		if (input) {
			input = input.toString();
			for (let i = 0; i < input.length; i++) {
				if (i > 0 && (input.length - i) % 3 === 0) {
					output = output + ',';
				}
				output = output + input.charAt(i);
			}
		}

		return output;
	},
	roundedRect: function (ctx, x, y, width, height, radius, R, G, B, A) {
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.arcTo(x, y + height, x + radius, y + height, radius);
		ctx.lineTo(x + width - radius, y + height);
		ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
		ctx.lineTo(x + width, y + radius);
		ctx.arcTo(x + width, y, x + width - radius, y, radius);
		ctx.lineTo(x + radius, y);
		ctx.arcTo(x, y, x, y + radius, radius);
		ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${A})`;
		ctx.fill();
	},
	getRankImage: function (rank) {
		let path = 'other/rank_pictures/D_Rank.png'; //D Rank

		if (rank === 'XH') {
			path = 'other/rank_pictures/XH_Rank.png';
		} else if (rank === 'X') {
			path = 'other/rank_pictures/X_Rank.png';
		} else if (rank === 'SH') {
			path = 'other/rank_pictures/SH_Rank.png';
		} else if (rank === 'S') {
			path = 'other/rank_pictures/S_Rank.png';
		} else if (rank === 'A') {
			path = 'other/rank_pictures/A_Rank.png';
		} else if (rank === 'B') {
			path = 'other/rank_pictures/B_Rank.png';
		} else if (rank === 'C') {
			path = 'other/rank_pictures/C_Rank.png';
		}
		return path;
	},
	getModImage: function (mod) {
		let path = 'other/mods/NM.png';

		if (mod) {
			path = `other/mods/${mod}.png`;
		}

		return path;
	},
	getBeatmapApprovalStatusImage: function (beatmap) {
		let beatmapStatusIcon;
		if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved') {
			beatmapStatusIcon = './other/ApprovalStatus-UpwardsChevron.png';
		} else if (beatmap.approvalStatus === 'Loved') {
			beatmapStatusIcon = './other/ApprovalStatus-Heart.png';
		} else if (beatmap.approvalStatus === 'Qualified') {
			beatmapStatusIcon = './other/ApprovalStatus-Check.png';
		} else {
			beatmapStatusIcon = './other/ApprovalStatus-QuestionMark.png';
		}

		return beatmapStatusIcon;
	},
	getMods: function (input) {
		let mods = [];
		let modsBits = input;
		let PFpossible = false;
		let hasNC = false;
		if (modsBits >= 1073741824) {
			mods.push('MI');
			modsBits = modsBits - 1073741824;
		}
		if (modsBits >= 536870912) {
			mods.push('V2');
			modsBits = modsBits - 536870912;
		}
		if (modsBits >= 268435456) {
			mods.push('2K');
			modsBits = modsBits - 268435456;
		}
		if (modsBits >= 134217728) {
			mods.push('3K');
			modsBits = modsBits - 134217728;
		}
		if (modsBits >= 67108864) {
			mods.push('1K');
			modsBits = modsBits - 67108864;
		}
		if (modsBits >= 33554432) {
			mods.push('KC');
			modsBits = modsBits - 33554432;
		}
		if (modsBits >= 16777216) {
			mods.push('9K');
			modsBits = modsBits - 16777216;
		}
		if (modsBits >= 8388608) {
			mods.push('TG');
			modsBits = modsBits - 8388608;
		}
		if (modsBits >= 4194304) {
			mods.push('CI');
			modsBits = modsBits - 4194304;
		}
		if (modsBits >= 2097152) {
			mods.push('RD');
			modsBits = modsBits - 2097152;
		}
		if (modsBits >= 1048576) {
			mods.push('FI');
			modsBits = modsBits - 1048576;
		}
		if (modsBits >= 524288) {
			mods.push('8K');
			modsBits = modsBits - 524288;
		}
		if (modsBits >= 262144) {
			mods.push('7K');
			modsBits = modsBits - 262144;
		}
		if (modsBits >= 131072) {
			mods.push('6K');
			modsBits = modsBits - 131072;
		}
		if (modsBits >= 65536) {
			mods.push('5K');
			modsBits = modsBits - 65536;
		}
		if (modsBits >= 32768) {
			mods.push('4K');
			modsBits = modsBits - 32768;
		}
		if (modsBits >= 16384) {
			PFpossible = true;
			modsBits = modsBits - 16384;
		}
		if (modsBits >= 8192) {
			mods.push('AP');
			modsBits = modsBits - 8192;
		}
		if (modsBits >= 4096) {
			mods.push('SO');
			modsBits = modsBits - 4096;
		}
		if (modsBits >= 2048) {
			modsBits = modsBits - 2048;
		}
		if (modsBits >= 1024) {
			mods.push('FL');
			modsBits = modsBits - 1024;
		}
		if (modsBits >= 512) {
			hasNC = true;
			mods.push('NC');
			modsBits = modsBits - 512;
		}
		if (modsBits >= 256) {
			mods.push('HT');
			modsBits = modsBits - 256;
		}
		if (modsBits >= 128) {
			mods.push('RX');
			modsBits = modsBits - 128;
		}
		if (modsBits >= 64) {
			if (!hasNC) {
				mods.push('DT');
			}
			modsBits = modsBits - 64;
		}
		if (modsBits >= 32) {
			if (PFpossible) {
				mods.push('PF');
			} else {
				mods.push('SD');
			}
			modsBits = modsBits - 32;
		}
		if (modsBits >= 16) {
			mods.push('HR');
			modsBits = modsBits - 16;
		}
		if (modsBits >= 8) {
			mods.push('HD');
			modsBits = modsBits - 8;
		}
		if (modsBits >= 4) {
			mods.push('TD');
			modsBits = modsBits - 4;
		}
		if (modsBits >= 2) {
			mods.push('EZ');
			modsBits = modsBits - 2;
		}
		if (modsBits >= 1) {
			mods.push('NF');
			modsBits = modsBits - 1;
		}

		return mods.reverse();
	},
	getModBits: function (input, noVisualMods) {
		let modBits = 0;

		if (input === 'NM') {
			return modBits;
		}

		for (let i = 0; i < input.length; i += 2) {
			if (input.substring(i, i + 2) === 'MI' && !noVisualMods) {
				modBits += 1073741824;
			} else if (input.substring(i, i + 2) === 'V2') {
				modBits += 536870912;
			} else if (input.substring(i, i + 2) === '2K') {
				modBits += 268435456;
			} else if (input.substring(i, i + 2) === '3K') {
				modBits += 134217728;
			} else if (input.substring(i, i + 2) === '1K') {
				modBits += 67108864;
			} else if (input.substring(i, i + 2) === 'KC') {
				modBits += 33554432;
			} else if (input.substring(i, i + 2) === '9K') {
				modBits += 16777216;
			} else if (input.substring(i, i + 2) === 'TG') {
				modBits += 8388608;
			} else if (input.substring(i, i + 2) === 'CI') {
				modBits += 4194304;
			} else if (input.substring(i, i + 2) === 'RD') {
				modBits += 2097152;
			} else if (input.substring(i, i + 2) === 'FI' && !noVisualMods) {
				modBits += 1048576;
			} else if (input.substring(i, i + 2) === '8K') {
				modBits += 524288;
			} else if (input.substring(i, i + 2) === '7K') {
				modBits += 262144;
			} else if (input.substring(i, i + 2) === '6K') {
				modBits += 131072;
			} else if (input.substring(i, i + 2) === '5K') {
				modBits += 65536;
			} else if (input.substring(i, i + 2) === '4K') {
				modBits += 32768;
			} else if (input.substring(i, i + 2) === 'PF' && !noVisualMods) {
				modBits += 16384;
				modBits += 32;
			} else if (input.substring(i, i + 2) === 'AP') {
				modBits += 8192;
			} else if (input.substring(i, i + 2) === 'SO' && !noVisualMods) {
				modBits += 4096;
			} else if (input.substring(i, i + 2) === 'FL') {
				modBits += 1024;
			} else if (input.substring(i, i + 2) === 'NC') {
				if (!noVisualMods) {
					modBits += 512;
				}
				modBits += 64;
			} else if (input.substring(i, i + 2) === 'HT') {
				modBits += 256;
			} else if (input.substring(i, i + 2) === 'RX') {
				modBits += 128;
			} else if (input.substring(i, i + 2) === 'DT') {
				modBits += 64;
			} else if (input.substring(i, i + 2) === 'SD' && !noVisualMods) {
				modBits += 32;
			} else if (input.substring(i, i + 2) === 'HR') {
				modBits += 16;
			} else if (input.substring(i, i + 2) === 'HD' && (input.includes('FL') || !input.includes('FL') && !noVisualMods)) {
				modBits += 8;
			} else if (input.substring(i, i + 2) === 'TD') {
				modBits += 4;
			} else if (input.substring(i, i + 2) === 'EZ') {
				modBits += 2;
			} else if (input.substring(i, i + 2) === 'NF' && !noVisualMods) {
				modBits += 1;
			}
		}

		return modBits;
	},
	getLinkModeName: function (ID) {
		let gameMode = 'osu';
		if (ID === 1) {
			gameMode = 'taiko';
		} else if (ID === 2) {
			gameMode = 'fruits';
		} else if (ID === 3) {
			gameMode = 'mania';
		}
		return gameMode;
	},
	getGameModeName: function (ID) {
		let gameMode = 'standard';
		if (ID === 1) {
			gameMode = 'taiko';
		} else if (ID === 2) {
			gameMode = 'catch';
		} else if (ID === 3) {
			gameMode = 'mania';
		}
		return gameMode;
	},
	getGameMode: function (beatmap) {
		let gameMode;
		if (beatmap.mode === 'Standard') {
			gameMode = 'osu';
		} else if (beatmap.mode === 'Taiko') {
			gameMode = 'taiko';
		} else if (beatmap.mode === 'Mania') {
			gameMode = 'mania';
		} else if (beatmap.mode === 'Catch the Beat') {
			gameMode = 'fruits';
		}
		return gameMode;
	},
	roundedImage: function (ctx, image, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.arcTo(x, y + height, x + radius, y + height, radius);
		ctx.lineTo(x + width - radius, y + height);
		ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
		ctx.lineTo(x + width, y + radius);
		ctx.arcTo(x + width, y, x + width - radius, y, radius);
		ctx.lineTo(x + radius, y);
		ctx.arcTo(x, y, x, y + radius, radius);
		ctx.closePath();
		ctx.clip();

		ctx.drawImage(image, x, y, width, height);
	},
	getBeatmapModeId: function (beatmap) {
		let gameMode;
		if (beatmap.mode === 'Standard') {
			gameMode = 0;
		} else if (beatmap.mode === 'Taiko') {
			gameMode = 1;
		} else if (beatmap.mode === 'Mania') {
			gameMode = 3;
		} else if (beatmap.mode === 'Catch the Beat') {
			gameMode = 2;
		}
		return gameMode;
	},
	rippleToBanchoScore: function (inputScore) {
		let outputScore = {
			score: inputScore.score,
			user: {
				name: null,
				id: inputScore.user_id
			},
			beatmapId: inputScore.beatmap_id,
			counts: {
				'50': inputScore.count50,
				'100': inputScore.count100,
				'300': inputScore.count300,
				geki: inputScore.countgeki,
				katu: inputScore.countkatu,
				miss: inputScore.countmiss
			},
			maxCombo: inputScore.maxcombo,
			perfect: false,
			raw_date: inputScore.date,
			rank: inputScore.rank,
			pp: inputScore.pp,
			hasReplay: false,
			raw_mods: inputScore.enabled_mods,
			beatmap: undefined
		};

		if (inputScore.perfect === '1') {
			outputScore.perfect = true;
		}
		return outputScore;
	},
	gatariToBanchoScore: function (inputScore) {
		let date = new Date(inputScore.time * 1000);

		let outputScore = {
			score: inputScore.score,
			user: {
				name: inputScore.username,
				id: inputScore.user_id
			},
			beatmapId: inputScore.beatmap_id.toString(),
			counts: {
				'50': inputScore.count_50,
				'100': inputScore.count_100,
				'300': inputScore.count_300,
				geki: inputScore.count_gekis,
				katu: inputScore.count_katu,
				miss: inputScore.count_miss
			},
			maxCombo: inputScore.max_combo,
			perfect: inputScore.full_combo,
			raw_date: `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate()).toString().padStart(2, '0')} ${(date.getUTCHours()).toString().padStart(2, '0')}:${(date.getUTCMinutes()).toString().padStart(2, '0')}:${(date.getUTCSeconds()).toString().padStart(2, '0')}`,
			rank: inputScore.rank,
			pp: inputScore.pp,
			hasReplay: false,
			raw_mods: inputScore.mods,
			beatmap: undefined
		};

		if (!outputScore.rank && inputScore.ranking) {
			outputScore.rank = inputScore.ranking;
		}

		return outputScore;
	},
	rippleToBanchoUser: function (inputUser) {
		let outputUser = {
			id: inputUser.user_id,
			name: inputUser.username,
			counts: {
				'300': parseInt(inputUser.count300),
				'100': parseInt(inputUser.count100),
				'50': parseInt(inputUser.count50),
				'SSH': parseInt(inputUser.count_rank_ssh),
				'SS': parseInt(inputUser.count_rank_ss),
				'SH': parseInt(inputUser.count_rank_sh),
				'S': parseInt(inputUser.count_rank_s),
				'A': parseInt(inputUser.count_rank_a),
				'plays': parseInt(inputUser.playcount)
			},
			scores: {
				ranked: parseInt(inputUser.ranked_score),
				total: parseInt(inputUser.total_score)
			},
			pp: {
				raw: parseFloat(inputUser.pp_raw),
				rank: parseInt(inputUser.pp_rank),
				countryRank: parseInt(inputUser.pp_country_rank)
			},
			country: inputUser.country,
			level: parseFloat(inputUser.level),
			accuracy: parseFloat(inputUser.accuracy),
			secondsPlayed: parseInt(inputUser.total_seconds_played),
			raw_joinDate: inputUser.join_date,
			events: []
		};

		return outputUser;
	},
	updateOsuDetailsforUser: async function (client, user, mode) {
		//get discordUser from db to update pp and rank
		DBDiscordUsers.findOne({
			attributes: [
				'id',
				'osuUserId',
				'osuName',
				'country',
				'osuPP',
				'osuPlayCount',
				'oldOsuRank',
				'lastOsuPPChange',
				'lastOsuPlayCountChange',
				'nextOsuPPUpdate',
				'osuRank',
				'osuRankedScore',
				'osuTotalScore',
				'taikoPP',
				'lastTaikoPPChange',
				'nextTaikoPPUpdate',
				'taikoPlayCount',
				'lastTaikoPlayCountChange',
				'taikoRank',
				'taikoRankedScore',
				'taikoTotalScore',
				'catchPP',
				'lastCatchPPChange',
				'nextCatchPPUpdate',
				'catchPlayCount',
				'lastCatchPlayCountChange',
				'catchRank',
				'catchRankedScore',
				'catchTotalScore',
				'maniaPP',
				'lastManiaPPChange',
				'nextManiaPPUpdate',
				'maniaPlayCount',
				'lastManiaPlayCountChange',
				'maniaRank',
				'maniaRankedScore',
				'maniaTotalScore',
			],
			where: {
				osuUserId: user.id
			},
		})
			.then(async (discordUser) => {
				if (discordUser && discordUser.osuUserId) {
					discordUser.osuName = user.name;
					discordUser.country = user.country;
					if (mode === 0) {
						if (Number(discordUser.osuPP) !== Number(user.pp.raw)) {
							discordUser.lastOsuPPChange = new Date();
							discordUser.oldOsuRank = user.pp.rank;
							discordUser.osuPP = user.pp.raw;
						}

						if (Number(discordUser.osuPlayCount) !== Number(user.counts.plays)) {
							discordUser.lastOsuPlayCountChange = new Date();
							discordUser.osuPlayCount = user.counts.plays;
							discordUser.nextOsuPPUpdate = new Date();
						} else {
							discordUser.nextOsuPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastOsuPlayCountChange));
						}

						discordUser.osuRank = user.pp.rank;
						discordUser.osuRankedScore = user.scores.ranked;
						discordUser.osuTotalScore = user.scores.total;
					} else if (mode === 1) {
						if (Number(discordUser.taikoPP) !== Number(user.pp.raw)) {
							discordUser.lastTaikoPPChange = new Date();
							discordUser.taikoPP = user.pp.raw;
						}

						if (Number(discordUser.taikoPlayCount) !== Number(user.counts.plays)) {
							discordUser.lastTaikoPlayCountChange = new Date();
							discordUser.taikoPlayCount = user.counts.plays;
							discordUser.nextTaikoPPUpdate = new Date();
						} else {
							discordUser.nextTaikoPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastTaikoPlayCountChange));
						}

						discordUser.taikoRank = user.pp.rank;
						discordUser.taikoRankedScore = user.scores.ranked;
						discordUser.taikoTotalScore = user.scores.total;
					} else if (mode === 2) {
						if (Number(discordUser.catchPP) !== Number(user.pp.raw)) {
							discordUser.lastCatchPPChange = new Date();
							discordUser.catchPP = user.pp.raw;
						}

						if (Number(discordUser.catchPlayCount) !== Number(user.counts.plays)) {
							discordUser.lastCatchPlayCountChange = new Date();
							discordUser.catchPlayCount = user.counts.plays;
							discordUser.nextCatchPPUpdate = new Date();
						} else {
							discordUser.nextCatchPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastCatchPlayCountChange));
						}

						discordUser.catchRank = user.pp.rank;
						discordUser.catchRankedScore = user.scores.ranked;
						discordUser.catchTotalScore = user.scores.total;
					} else if (mode === 3) {
						if (Number(discordUser.maniaPP) !== Number(user.pp.raw)) {
							discordUser.lastManiaPPChange = new Date();
							discordUser.maniaPP = user.pp.raw;
						}

						if (Number(discordUser.maniaPlayCount) !== Number(user.counts.plays)) {
							discordUser.lastManiaPlayCountChange = new Date();
							discordUser.maniaPlayCount = user.counts.plays;
							discordUser.nextManiaPPUpdate = new Date();
						} else {
							discordUser.nextManiaPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastManiaPlayCountChange));
						}

						discordUser.maniaRank = user.pp.rank;
						discordUser.maniaRankedScore = user.scores.ranked;
						discordUser.maniaTotalScore = user.scores.total;
					}

					discordUser.save();
				}
			})
			.catch(err => {
				console.error(err);
			});
		return;
	},
	getOsuUserServerMode: async function (msg, args) {
		let server = 'bancho';
		let mode = 0;

		//Check user settings
		const discordUser = await DBDiscordUsers.findOne({
			attributes: [
				'id',
				'userId',
				'osuName',
				'osuUserId',
				'osuRank',
				'osuPP',
				'osuVerified',
				'osuMainServer',
				'osuMainMode',
				'tournamentPings',
				'tournamentPingsMode',
				'tournamentPingsBadged',
				'tournamentPingsStartingFrom',
				'osuDuelStarRating',
				'osuNoModDuelStarRating',
				'osuHiddenDuelStarRating',
				'osuHardRockDuelStarRating',
				'osuDoubleTimeDuelStarRating',
				'osuFreeModDuelStarRating',
			],
			where: {
				userId: msg.author.id
			},
		});

		if (discordUser && discordUser.osuMainServer) {
			server = discordUser.osuMainServer;
		}

		if (discordUser && discordUser.osuMainMode) {
			mode = discordUser.osuMainMode;
		}

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--s' || args[i].toString().toLowerCase() === '--standard') {
				mode = 0;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--t' || args[i].toString().toLowerCase() === '--taiko') {
				mode = 1;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--c' || args[i].toString().toLowerCase() === '--catch') {
				mode = 2;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--m' || args[i].toString().toLowerCase() === '--mania') {
				mode = 3;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--r' || args[i] === '--ripple') {
				server = 'ripple';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--b' || args[i] === '--bancho') {
				server = 'bancho';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--tournaments') {
				server = 'tournaments';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--mixed') {
				server = 'mixed';
				args.splice(i, 1);
				i--;
			}

		}
		const outputArray = [discordUser, server, mode];
		return outputArray;
	},
	updateServerUserActivity: async function (msg) {
		try {
			if (msg.channel.type !== Discord.ChannelType.DM) {
				const now = new Date();
				now.setSeconds(now.getSeconds() - 15);

				const serverUserActivity = await DBServerUserActivity.findOne({
					attributes: [
						'id',
						'updatedAt',
						'points',
					],
					where: {
						guildId: msg.guildId, userId: msg.author.id
					},
				});

				if (serverUserActivity && serverUserActivity.updatedAt < now) {
					serverUserActivity.points = serverUserActivity.points + 1;
					await serverUserActivity.save();

					const activityRoles = await DBActivityRoles.count({
						where: { guildId: msg.guildId }
					});
					if (activityRoles) {
						const existingTask = await DBProcessQueue.count({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (existingTask === 0) {
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 5);
							await DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
						}
					}
				}

				if (!serverUserActivity) {
					await DBServerUserActivity.create({ guildId: msg.guildId, userId: msg.author.id });

					const activityRoles = await DBActivityRoles.count({
						where: { guildId: msg.guildId }
					});
					if (activityRoles) {
						const existingTask = await DBProcessQueue.count({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (existingTask === 0) {
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 5);
							await DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
						}
					}
				}
			}
		} catch (e) {
			//Nothing
		}
	},
	getMessageUserDisplayname: async function (msg) {
		let userDisplayName = msg.author.username;
		if (msg.channel.type !== Discord.ChannelType.DM) {
			let member = null;

			while (!member) {
				try {
					member = await msg.guild.members.fetch({ user: [msg.author.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('utils.js | getMessageUserDisplayname', e);
						return;
					}
				}
			}

			member = member.first();

			const guildDisplayName = member.displayName;
			if (guildDisplayName) {
				userDisplayName = guildDisplayName;
			}
		}

		return userDisplayName;
	},
	executeNextProcessQueueTask: async function (client) {
		let now = new Date();
		let nextTasks = await DBProcessQueue.findAll({
			where: {
				beingExecuted: false,
				date: {
					[Op.lt]: now
				}
			},
			order: [
				['priority', 'DESC'],
				['date', 'ASC'],
			]
		});

		for (let i = 0; i < nextTasks.length; i++) {
			if (!module.exports.wrongCluster(client, nextTasks[i].id)) {
				nextTasks[i].beingExecuted = true;
				await nextTasks[i].save();

				executeFoundTask(client, nextTasks[i]);
				break;
			}
		}
	},
	refreshOsuRank: async function (client) {
		if (module.exports.wrongCluster(client)) {
			return;
		}

		let existingTasksCount = await DBProcessQueue.count({ where: { task: 'updateOsuRank' } });

		if (existingTasksCount > 10) {
			return;
		}

		let now = new Date();

		let yesterday = new Date();
		yesterday.setUTCHours(yesterday.getUTCHours() - 24);

		let lastMonth = new Date();
		lastMonth.setUTCDate(lastMonth.getUTCMonth() - 1);

		// Update queue length
		let osuUpdateQueueLength = await DBDiscordUsers.count({
			where: {
				[Op.or]: [
					{
						osuUserId: {
							[Op.not]: null
						},
						userId: {
							[Op.not]: null
						},
						updatedAt: {
							[Op.lt]: yesterday
						},
						[Op.or]: [
							{
								nextOsuPPUpdate: {
									[Op.eq]: null
								}
							},
							{
								lastDuelRatingUpdate: {
									[Op.eq]: null
								}
							},
							{
								nextOsuPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextTaikoPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextCatchPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextManiaPPUpdate: {
									[Op.lt]: now
								}
							}
						]
					},
					{
						osuUserId: {
							[Op.not]: null
						},
						userId: null,
						[Op.or]: [
							{
								updatedAt: {
									[Op.lt]: lastMonth
								}
							},
							{
								osuRank: null
							}
						],
						[Op.or]: [
							{
								nextOsuPPUpdate: {
									[Op.eq]: null
								}
							},
							{
								lastDuelRatingUpdate: {
									[Op.eq]: null
								}
							},
							{
								nextOsuPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextTaikoPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextCatchPPUpdate: {
									[Op.lt]: now
								}
							},
							{
								nextManiaPPUpdate: {
									[Op.lt]: now
								}
							}
						]
					},
				]
			},
		});

		process.send(`osuUpdateQueue ${osuUpdateQueueLength}`);

		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId'],
			where: {
				osuUserId: {
					[Op.not]: null
				},
				userId: {
					[Op.not]: null
				},
				updatedAt: {
					[Op.lt]: yesterday
				},
				[Op.or]: [
					{
						nextOsuPPUpdate: {
							[Op.eq]: null
						}
					},
					{
						lastDuelRatingUpdate: {
							[Op.eq]: null
						}
					},
					{
						nextOsuPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextTaikoPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextCatchPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextManiaPPUpdate: {
							[Op.lt]: now
						}
					}
				]
			},
			order: [
				['updatedAt', 'ASC'],
			]
		});

		if (discordUser) {
			const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (existingTask === 0) {
				let now = new Date();
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId, date: now });
			}
		}

		await new Promise(resolve => setTimeout(resolve, 25000));

		discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId'],
			where: {
				osuUserId: {
					[Op.not]: null
				},
				userId: null,
				[Op.or]: [
					{
						updatedAt: {
							[Op.lt]: lastMonth
						}
					},
					{
						osuRank: null
					}
				],
				[Op.or]: [
					{
						nextOsuPPUpdate: {
							[Op.eq]: null
						}
					},
					{
						lastDuelRatingUpdate: {
							[Op.eq]: null
						}
					},
					{
						nextOsuPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextTaikoPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextCatchPPUpdate: {
							[Op.lt]: now
						}
					},
					{
						nextManiaPPUpdate: {
							[Op.lt]: now
						}
					}
				]
			},
			order: [
				['updatedAt', 'ASC'],
			]
		});

		if (discordUser) {
			const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (existingTask === 0) {
				let now = new Date();
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId, date: now });
			}
		}
	},
	async createLeaderboard(data, backgroundFile, title, filename, page, teamMatchscore) {
		if (page && (page - 1) * leaderboardEntriesPerPage > data.length) {
			page = null;
		}
		let totalPages = Math.floor((data.length - 1) / leaderboardEntriesPerPage) + 1;

		let dataStart = 0;
		let dataEnd = Infinity;
		if (page) {
			dataStart = leaderboardEntriesPerPage * (page - 1);
			dataEnd = leaderboardEntriesPerPage * page;

			for (let i = 0; i < dataStart; i++) {
				data.splice(0, 1);
			}

			for (let i = leaderboardEntriesPerPage; i < data.length; i++) {
				data.splice(leaderboardEntriesPerPage, 1);
				i--;
			}
		}

		let columns = 1;
		let canvasWidth = 900;
		let rows = data.length;
		if (data.length > 63) {
			columns = 5;
		} else if (data.length > 48) {
			columns = 4;
		} else if (data.length > 33) {
			columns = 3;
		} else if (data.length > 15) {
			columns = 2;
		}

		if (teamMatchscore) {
			columns = 2;
		}

		if (columns > 1) {
			rows = 2 + Math.floor((data.length - 3) / columns) + 1;
		}

		let percentage = 1;

		if (teamMatchscore) {
			percentage = 0.66;
		}

		canvasWidth = canvasWidth * columns * percentage;
		const canvasHeight = 125 + 20 + rows * 90;

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
		Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage(`./other/${backgroundFile}`);

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		// Write the title of the leaderboard
		ctx.fillStyle = '#ffffff';
		module.exports.fitTextOnMiddleCanvas(ctx, title, 35, 'comfortaa, arial', 50, canvas.width, 50);

		// Write the data
		ctx.textAlign = 'center';

		let placement = dataStart;

		for (let i = 0; i < data.length && dataStart + i < dataEnd; i++) {
			let xPosition = canvas.width / 2;
			let yPositionName = 125 + i * 90;
			let yPositionValue = 160 + i * 90;
			if (columns > 1) {
				if (i + dataStart === 0 && !teamMatchscore) {
					xPosition = canvas.width / 2;
				} else if (i + dataStart === 1 && !teamMatchscore) {
					if (columns === 2) {
						xPosition = canvas.width / 3;
					} else {
						xPosition = canvas.width / 4;
					}
				} else if (i + dataStart === 2 && !teamMatchscore) {
					if (columns === 2) {
						xPosition = (canvas.width / 3) * 2;
					} else {
						xPosition = (canvas.width / 4) * 3;
					}
					yPositionName = 125 + (Math.floor((i - 3) / columns) + 2) * 90;
					yPositionValue = 160 + (Math.floor((i - 3) / columns) + 2) * 90;
				} else {
					if (dataStart === 0 && !teamMatchscore) {
						//Create standard xPosition
						xPosition = (canvas.width / (columns + 1)) * (((i - 3) % columns) + 1);
						//Stretch it
						let max = canvas.width / (columns + 1) / 2;
						let iterator = (i - 3) % columns;
						let standardizedIterator = iterator - (columns - 1) / 2;
						let lengthScaled = max / (columns / 2) * standardizedIterator;
						xPosition += lengthScaled;
						yPositionName = 125 + (Math.floor((i - 3) / columns) + 2) * 90;
						yPositionValue = 160 + (Math.floor((i - 3) / columns) + 2) * 90;
					} else {
						//Create standard xPosition
						xPosition = (canvas.width / (columns + 1)) * ((i % columns) + 1);
						//Stretch it
						let max = canvas.width / (columns + 1) / 2;
						let iterator = i % columns;
						let standardizedIterator = iterator - (columns - 1) / 2;
						let lengthScaled = max / (columns / 2) * standardizedIterator;
						xPosition += lengthScaled;
						yPositionName = 125 + (Math.floor(i / columns) + 1) * 90;
						yPositionValue = 160 + (Math.floor(i / columns) + 1) * 90;
					}
				}
			}

			if (data[i].color && data[i].color !== '#000000') {
				ctx.fillStyle = data[i].color;
			} else if (i + dataStart === 0) {
				ctx.fillStyle = '#E2B007';
			} else if (i + dataStart === 1) {
				ctx.fillStyle = '#C4CACE';
			} else if (i + dataStart === 2) {
				ctx.fillStyle = '#CC8E34';
			} else {
				ctx.fillStyle = '#ffffff';
			}

			if (data[i].name || data[i].value) {
				placement++;
				ctx.font = 'bold 25px comfortaa, arial';
				ctx.fillText(`${placement}. ${data[i].name}`, xPosition, yPositionName);
				ctx.font = '25px comfortaa, arial';
				ctx.fillText(data[i].value, xPosition, yPositionValue);
			}
		}

		let today = new Date().toLocaleDateString();

		ctx.font = 'bold 15px comfortaa, arial';
		ctx.fillStyle = '#ffffff';

		if (page) {
			ctx.textAlign = 'left';
			ctx.fillText(`Page ${page} / ${totalPages}`, canvas.width / 140, canvas.height - 10);
		}

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

		//Create as an attachment and return
		return new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: filename });
	},
	async getAdditionalOsuInfo(osuUserId, client) {
		await module.exports.getNewOsuAPIv2TokenIfNecessary(client);

		const url = new URL(
			`https://osu.ppy.sh/api/v2/users/${osuUserId}/osu`
		);

		const headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': `Bearer ${client.osuv2_access_token}`
		};

		const additionalInfo = {
			tournamentBan: false,
			badges: [],
			tournamentBadges: [],
		};

		await fetch(url, {
			method: 'GET',
			headers,
		}).then(async (response) => {
			let json = await response.json();

			if (json.account_history) {
				let tournamentBans = json.account_history.filter((entry) => entry.type === 'tournament_ban');

				if (tournamentBans.length) {
					tournamentBans[0].tournamentBannedUntil = new Date(tournamentBans[0].timestamp);

					if (tournamentBans[0].permanent) {
						tournamentBans[0].tournamentBannedUntil.setUTCMilliseconds(999);
						tournamentBans[0].tournamentBannedUntil.setUTCSeconds(59);
						tournamentBans[0].tournamentBannedUntil.setUTCMinutes(59);
						tournamentBans[0].tournamentBannedUntil.setUTCHours(23);
						tournamentBans[0].tournamentBannedUntil.setUTCDate(31);
						tournamentBans[0].tournamentBannedUntil.setUTCMonth(11);
						tournamentBans[0].tournamentBannedUntil.setUTCFullYear(9999);
					} else {
						tournamentBans[0].tournamentBannedUntil.setUTCSeconds(tournamentBans[0].tournamentBannedUntil.getUTCSeconds() + tournamentBans[0].length);
					}

					tournamentBans[0].description = tournamentBans[0].description.replace('&#039;', '\'').replace('&amp;', '&');

					additionalInfo.tournamentBan = tournamentBans[0];
				}
			} else {
				console.log('Account history not found', osuUserId, json.account_history);
			}

			additionalInfo.badges = json.badges;

			for (let i = 0; i < json.badges.length; i++) {
				const badge = json.badges[i];
				if (!badge.description.startsWith('Beatmap Spotlights: ')
					&& !badge.description.includes(' contribution to the ')
					&& !badge.description.includes(' contributor')
					&& !badge.description.includes('Contributions')
					&& !badge.description.includes('commitment')
					&& !badge.description.includes('Mapper\'s Favourite ')
					&& !badge.description.includes('Community Favourite ')
					&& !badge.description.includes('Community Choice ')
					&& !badge.description.includes('Mapping')
					&& !badge.description.includes('Aspire')
					&& !badge.description.includes('Beatmapping')
					&& !badge.description.includes('osu!idol')
					&& badge.description !== 'The official voice behind osu!'
					&& !badge.description.includes('Newspaper ')
					&& !badge.description.includes('Pending Cup ')
					&& !badge.description.includes('Mapper\'s Choice ')
					&& !badge.description.includes('Exemplary performance')
					&& !badge.description.toLowerCase().includes('contribution')
					&& !badge.description.toLowerCase().includes('elite mapper')
					&& !badge.description.toLowerCase().includes('outstanding commitment')
					&& !badge.description.toLowerCase().includes('featured artist playlist')) {
					additionalInfo.tournamentBadges.push(badge);
				}
			}
		})
			.catch(err => {
				console.error(err);
			});

		//get discordUser from db to update pp and rank
		await DBDiscordUsers.findOne({
			attributes: ['id', 'osuBadges', 'osuName', 'osuUserId', 'tournamentBannedReason', 'tournamentBannedUntil'],
			where: {
				osuUserId: osuUserId
			},
		})
			.then(async (discordUser) => {
				if (discordUser) {
					if (discordUser.osuBadges !== additionalInfo.tournamentBadges.length) {
						await module.exports.sendMessageToLogChannel(client, process.env.BADGELOG, `\`${discordUser.osuName}\` gained ${additionalInfo.tournamentBadges.length - discordUser.osuBadges} tournament badge(s). (${discordUser.osuBadges} -> ${additionalInfo.tournamentBadges.length}) | https://osu.ppy.sh/users/${discordUser.osuUserId}`, true);

						discordUser.osuBadges = additionalInfo.tournamentBadges.length;
					}

					if (additionalInfo.tournamentBan) {
						if (discordUser.tournamentBannedReason !== additionalInfo.tournamentBan.description || new Date(discordUser.tournamentBannedUntil).getTime() !== additionalInfo.tournamentBan.tournamentBannedUntil.getTime()) {
							let bannedUntilString = 'indefinite';

							if (additionalInfo.tournamentBan.tournamentBannedUntil.getUTCFullYear() !== 9999) {
								bannedUntilString = `over <t:${Math.floor(additionalInfo.tournamentBan.tournamentBannedUntil.getTime() / 1000)}:R>`;
							}

							await module.exports.sendMessageToLogChannel(client, process.env.TOURNAMENTBANLOG, `\`${discordUser.osuName}\` has received a tournament ban at <t:${Math.floor(new Date(additionalInfo.tournamentBan.timestamp).getTime() / 1000)}:f> for \`${additionalInfo.tournamentBan.description}\`. (${bannedUntilString}) | https://osu.ppy.sh/users/${discordUser.osuUserId}`, true);
						}

						discordUser.tournamentBannedReason = additionalInfo.tournamentBan.description;
						discordUser.tournamentBannedUntil = additionalInfo.tournamentBan.tournamentBannedUntil;
					}

					await discordUser.save();
				}
			})
			.catch(err => {
				console.error(err);
			});

		return additionalInfo;
	},
	async getNewOsuAPIv2TokenIfNecessary(client) {
		if (client.osuv2_access_token) {
			return;
		}

		const url = new URL(
			'https://osu.ppy.sh/oauth/token'
		);

		const headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		let body = `client_id=${process.env.OSUCLIENTID}&client_secret=${process.env.OSUTOKENV2}&grant_type=client_credentials&scope=public`;

		await fetch(url, {
			method: 'POST',
			headers,
			body: body,
		}).then(async (response) => {
			let json = await response.json();

			client.osuv2_access_token = json.access_token;

			setTimeout(() => {
				client.osuv2_access_token = null;
			}, json.expires_in * 1000);
		});
	},
	async restartProcessQueueTask() {
		const tasksInWork = await DBProcessQueue.findAll({
			attributes: ['id', 'beingExecuted'],
			where: {
				beingExecuted: true
			}
		});
		tasksInWork.forEach(task => {
			task.beingExecuted = 0;
			task.save();
		});
	},
	pause(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	},
	getAccuracy(score, mode) {
		let accuracy = ((score.counts[300] * 100 + score.counts[100] * 33.33 + score.counts[50] * 16.67) / (parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss))) / 100;

		if (mode === 1) {
			accuracy = (parseInt(score.counts[300]) + parseInt(score.counts[100] * 0.5)) / (parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss));
		} else if (mode === 2) {
			let objects = parseInt(score.counts[300]) + parseInt(score.counts[50]) + parseInt(score.counts.miss);
			accuracy = (objects / (objects + parseInt(score.counts.katu) + parseInt(score.counts.miss)));
		} else if (mode === 3) {
			accuracy = (50 * parseInt(score.counts[50]) + 100 * parseInt(score.counts[100]) + 200 * parseInt(score.counts.katu) + 300 * (parseInt(score.counts[300]) + parseInt(score.counts.geki))) / (300 * (parseInt(score.counts.miss) + parseInt(score.counts[50]) + parseInt(score.counts[100]) + parseInt(score.counts.katu) + parseInt(score.counts[300]) + parseInt(score.counts.geki)));
		}

		return accuracy;
	},
	fitTextOnLeftCanvas(ctx, text, startingSize, fontface, yPosition, width, xOffset) {
		// start with a large font size
		var fontsize = startingSize;

		// lower the font size until the text fits the canvas
		do {
			fontsize--;
			ctx.font = fontsize + 'px ' + fontface;
		} while (ctx.measureText(text).width > width - xOffset);

		// draw the text
		ctx.textAlign = 'left';
		ctx.fillText(text, xOffset, yPosition);

		return fontsize;
	},
	getIDFromPotentialOsuLink(link) {
		if (link.endsWith('/')) {
			link = link.substring(0, link.length - 1);
		}
		return link.replace(/.+\//g, '');
	},
	async saveOsuMultiScores(match, client) {
		// let stringifiedMatch = JSON.stringify(match);

		// //Move the match by spawning child process
		// const { spawn } = require('child_process');

		// //Create a child and pass it the match
		// const child = spawn('node', ['./saveOsuMultiScores.js'], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'], });

		// child.on('spawn', () => {
		// 	child.send(stringifiedMatch);
		// });

		// child.on('message', () => {
		// 	child.kill('SIGINT');
		// });

		// await new Promise((resolve) => {
		// 	child.on('close', resolve);
		// });
		let matchAlreadyGetsImported = true;
		let waitForADifferentImport = false;

		if (!client) {
			matchAlreadyGetsImported = false;
		}

		while (matchAlreadyGetsImported) {
			try {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting utils.js sameMatchGettingImported to shards...');
				}
				let sameMatchGettingImported = false;
				sameMatchGettingImported = await client.shard.broadcastEval(async (c, { matchId, games }) => {
					if (c.shardId === 0) {
						if (c.matchesGettingImported === undefined) {
							c.matchesGettingImported = [];
						}

						let minutesAgo = new Date();
						minutesAgo.setMinutes(minutesAgo.getMinutes() - 5);

						let match = c.matchesGettingImported.find(m => m.matchId === matchId && m.date > minutesAgo);

						if (match) {
							return match.games;
						} else {
							c.matchesGettingImported.push({
								matchId: matchId,
								games: games,
								date: new Date()
							});
							return false;
						}
					}
				}, {
					context: {
						matchId: match.id,
						games: match.games.length
					}
				});

				sameMatchGettingImported = sameMatchGettingImported[0];

				if (sameMatchGettingImported === false) {
					matchAlreadyGetsImported = false;
				} else if (sameMatchGettingImported >= match.games.length) {
					waitForADifferentImport = true;
					matchAlreadyGetsImported = false;
				}

				if (matchAlreadyGetsImported) {
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			} catch (error) {
				console.error(error);
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		}

		while (waitForADifferentImport) {
			try {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting utils.js waitForADifferentImport to shards...');
				}
				let sameMatchGettingImported = false;

				if (client) {
					sameMatchGettingImported = await client.shard.broadcastEval(async (c, { matchId }) => {
						if (c.shardId === 0) {
							if (c.matchesGettingImported === undefined) {
								c.matchesGettingImported = [];
							}

							let match = c.matchesGettingImported.find(m => m.matchId === matchId);
							if (match) {
								return true;
							} else {
								return false;
							}
						}
					}, {
						context: {
							matchId: match.id,
						}
					});
				}

				sameMatchGettingImported = sameMatchGettingImported[0];

				if (sameMatchGettingImported === false) {
					return;
				}

				await new Promise(resolve => setTimeout(resolve, 5000));
			} catch (error) {
				console.error(error);
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		}

		if (match.games.length && match.raw_end === null) {
			let yesterday = new Date();

			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (match.games[match.games.length - 1] && match.games[match.games.length - 1].raw_end && yesterday > new Date(match.games[match.games.length - 1].raw_end)) {
				// Set the end date to the last map's enddate for bugged lobbies
				match.raw_end = match.games[match.games.length - 1].raw_end;
			} else if (match.games[match.games.length - 2] && match.games[match.games.length - 2].raw_end && yesterday > new Date(match.games[match.games.length - 2].raw_end)) {
				// Sometimes it bugged during the last map and has to take the timestamp from the one before
				match.raw_end = match.games[match.games.length - 2].raw_end;
			}
		}

		let tourneyMatchPlayers = [];
		let newMatchPlayers = [];
		let existingMatchPlayers = [];
		let playersToUpdate = [];
		let newScores = [];
		let beatmapModPools = [];

		let tourneyMatch = false;
		if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
			tourneyMatch = true;
		}

		let acronym = match.name.toLowerCase().replace(/:.+/gm, '').trim();

		let weeksPrior = new Date(match.raw_start);
		weeksPrior.setUTCDate(weeksPrior.getUTCDate() - 14);

		let weeksAfter = new Date(match.raw_start);
		weeksAfter.setUTCDate(weeksAfter.getUTCDate() + 14);

		let existingScores = await DBOsuMultiGameScores.findAll({
			attributes: [
				'id',
				'osuUserId',
				'matchId',
				'gameId',
				'beatmapId',
				'scoringType',
				'mode',
				'tourneyMatch',
				'evaluation',
				'score',
				'gameRawMods',
				'rawMods',
				'gameStartDate',
				'gameEndDate',
				'freeMod',
				'warmup',
				'maxCombo',
				'count50',
				'count100',
				'count300',
				'countMiss',
				'countKatu',
				'countGeki',
				'perfect',
				'teamType',
				'team',
			],
			where: {
				matchId: match.id,
			}
		});

		let sameTournamentGames = null;

		if (!matchMakingAcronyms.includes(acronym)) {
			sameTournamentGames = await DBOsuMultiGames.findAll({
				attributes: ['id', 'matchId', 'gameId', 'warmup', 'warmupDecidedByAmount', 'beatmapId'],
				where: {
					gameStartDate: {
						[Op.gte]: weeksPrior
					},
					gameEndDate: {
						[Op.lte]: weeksAfter
					},
					tourneyMatch: true,
					matchId: {
						[Op.not]: match.id
					}
				}
			});

			// Adapt the timespan to make sure the matches are included
			weeksPrior.setUTCDate(weeksPrior.getUTCDate() - 1);
			weeksAfter.setUTCDate(weeksAfter.getUTCDate() + 1);

			let sameTournamentGameMatches = await DBOsuMultiMatches.findAll({
				attributes: ['matchId'],
				where: {
					acronym: acronym,
					matchId: {
						[Op.in]: sameTournamentGames.map(m => m.matchId)
					},
					matchStartDate: {
						[Op.gte]: weeksPrior
					},
					matchEndDate: {
						[Op.lte]: weeksAfter
					},
				}
			});

			for (let i = 0; i < sameTournamentGames.length; i++) {
				let match = sameTournamentGameMatches.find(m => m.matchId === sameTournamentGames[i].matchId);

				if (!match) {
					sameTournamentGames.splice(i, 1);
					i--;
				}
			}
		}

		let games = [];

		for (let gameIndex = 0; gameIndex < match.games.length; gameIndex++) {
			//Define if the game is freemod or not
			let freeMod = false;
			for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
				if (match.games[gameIndex].scores[i].raw_mods) {
					freeMod = true;
					break;
				}
			}

			let forceMod = true;

			if (!freeMod) {
				forceMod = false;
			}

			for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
				if (parseInt(match.games[gameIndex].scores[i].score) >= 10000 && forceMod) {
					//Remove HT, DT and NC from scoreMods
					let scoreMods = module.exports.getMods(match.games[gameIndex].scores[i].raw_mods);
					for (let j = 0; j < scoreMods.length; j++) {
						if (scoreMods[j] === 'HT' || scoreMods[j] === 'DT' || scoreMods[j] === 'NC') {
							scoreMods.splice(j, 1);
							j--;
						}
					}
					scoreMods = module.exports.getModBits(scoreMods.join(''));

					if (scoreMods <= 1) {
						forceMod = false;
					}
				}
			}

			let warmup = false;

			let warmupDecidedByAmount = false;

			if (!matchMakingAcronyms.includes(acronym)) {
				let warmupCheckResult = await checkWarmup(match, gameIndex, tourneyMatch, sameTournamentGames);

				warmup = warmupCheckResult.warmup;

				warmupDecidedByAmount = warmupCheckResult.byAmount;
			}

			let gameScores = [];
			for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
				gameScores.push(match.games[gameIndex].scores[i]);
			}

			gameScores.sort((a, b) => {
				return parseInt(b.score) - parseInt(a.score);
			});

			for (let i = 0; i < gameScores.length; i++) {
				if (parseInt(gameScores[i].score) < 10000) {
					gameScores.splice(i, 1);
					i--;
				}
			}

			let scoringType = null;

			if (match.games[gameIndex].scoringType === 'Score') {
				scoringType = 0;
			} else if (match.games[gameIndex].scoringType === 'Accuracy') {
				scoringType = 1;
			} else if (match.games[gameIndex].scoringType === 'Combo') {
				scoringType = 2;
			} else if (match.games[gameIndex].scoringType === 'Score v2') {
				scoringType = 3;
			}

			let mode = null;

			if (match.games[gameIndex].mode === 'Standard') {
				mode = 0;
			} else if (match.games[gameIndex].mode === 'Taiko') {
				mode = 1;
			} else if (match.games[gameIndex].mode === 'Catch the Beat') {
				mode = 2;
			} else if (match.games[gameIndex].mode === 'Mania') {
				mode = 3;
			}

			let teamType = null;

			if (match.games[gameIndex].teamType === 'Head to Head') {
				teamType = 0;
			} else if (match.games[gameIndex].teamType === 'Tag Co-op') {
				teamType = 1;
			} else if (match.games[gameIndex].teamType === 'Team vs') {
				teamType = 2;
			} else if (match.games[gameIndex].teamType === 'Tag Team vs') {
				teamType = 3;
			}

			games.push({
				matchId: match.id,
				gameId: match.games[gameIndex].id,
				tourneyMatch: tourneyMatch,
				scoringType: scoringType,
				mode: mode,
				beatmapId: match.games[gameIndex].beatmapId,
				gameRawMods: match.games[gameIndex].raw_mods,
				gameStartDate: match.games[gameIndex].raw_start,
				gameEndDate: match.games[gameIndex].raw_end,
				freeMod: freeMod,
				forceMod: forceMod,
				warmup: warmup,
				warmupDecidedByAmount: warmupDecidedByAmount,
				teamType: teamType,
				scores: gameScores.length,
			});

			for (let scoreIndex = 0; scoreIndex < match.games[gameIndex].scores.length; scoreIndex++) {
				//Calculate evaluation
				let evaluation = null;

				if (gameScores.length > 1) {
					let sortedScores = [];
					for (let j = 0; j < gameScores.length; j++) {
						//Remove the own score to make it odd for the middle score
						if (!(gameScores.length % 2 === 0 && match.games[gameIndex].scores[scoreIndex].userId === gameScores[j].userId)) {
							sortedScores.push(gameScores[j].score);
						}
					}

					const middleScore = getMiddleScore(sortedScores);

					for (let i = 0; i < gameScores.length; i++) {
						if (match.games[gameIndex].scores[scoreIndex].userId === gameScores[i].userId && gameScores.length > 1) {
							evaluation = 1 / parseInt(middleScore) * parseInt(gameScores[i].score);
						}
					}
				}

				try {
					//Add the player ID to the list if needed
					if (tourneyMatchPlayers.indexOf(match.games[gameIndex].scores[scoreIndex].userId) === -1) {
						tourneyMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
					}

					//Remove HT, DT and NC from scoreMods
					let scoreMods = module.exports.getMods(match.games[gameIndex].scores[scoreIndex].raw_mods);
					for (let i = 0; i < scoreMods.length; i++) {
						if (scoreMods[i] === 'HT' || scoreMods[i] === 'DT' || scoreMods[i] === 'NC') {
							scoreMods.splice(i, 1);
							i--;
						}
					}
					scoreMods = module.exports.getModBits(scoreMods.join(''));

					let existingScore = null;

					for (let i = 0; i < existingScores.length; i++) {
						if (existingScores[i].osuUserId == match.games[gameIndex].scores[scoreIndex].userId
							&& existingScores[i].matchId == match.id
							&& existingScores[i].gameId == match.games[gameIndex].id) {
							existingScore = existingScores[i];
							break;
						}
					}

					if (!existingScore) {
						if (!newMatchPlayers.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							newMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						if (!playersToUpdate.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							playersToUpdate.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						newScores.push({
							osuUserId: match.games[gameIndex].scores[scoreIndex].userId,
							matchId: match.id,
							gameId: match.games[gameIndex].id,
							scoringType: scoringType,
							mode: mode,
							beatmapId: match.games[gameIndex].beatmapId.toString(),
							tourneyMatch: tourneyMatch,
							evaluation: evaluation,
							score: match.games[gameIndex].scores[scoreIndex].score,
							gameRawMods: match.games[gameIndex].raw_mods.toString(),
							rawMods: scoreMods.toString(),
							gameStartDate: match.games[gameIndex].raw_start,
							gameEndDate: match.games[gameIndex].raw_end,
							freeMod: freeMod,
							warmup: warmup,
							maxCombo: match.games[gameIndex].scores[scoreIndex].maxCombo,
							count50: match.games[gameIndex].scores[scoreIndex].counts['50'],
							count100: match.games[gameIndex].scores[scoreIndex].counts['100'],
							count300: match.games[gameIndex].scores[scoreIndex].counts['300'],
							countMiss: match.games[gameIndex].scores[scoreIndex].counts.miss,
							countKatu: match.games[gameIndex].scores[scoreIndex].counts.katu,
							countGeki: match.games[gameIndex].scores[scoreIndex].counts.geki,
							perfect: match.games[gameIndex].scores[scoreIndex].perfect,
							teamType: teamType,
							team: match.games[gameIndex].scores[scoreIndex].team,
						});
					} else if (existingScore.warmup === null || !existingScore.matchEndDate) {
						if (!existingMatchPlayers.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							existingMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						if (!playersToUpdate.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							playersToUpdate.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						existingScore.osuUserId = match.games[gameIndex].scores[scoreIndex].userId;
						existingScore.matchId = match.id;
						existingScore.gameId = match.games[gameIndex].id;
						existingScore.scoringType = scoringType;
						existingScore.mode = mode;
						existingScore.beatmapId = match.games[gameIndex].beatmapId;
						existingScore.evaluation = evaluation;
						existingScore.score = match.games[gameIndex].scores[scoreIndex].score;
						existingScore.gameRawMods = match.games[gameIndex].raw_mods;
						existingScore.rawMods = scoreMods;
						existingScore.gameStartDate = match.games[gameIndex].raw_start;
						existingScore.gameEndDate = match.games[gameIndex].raw_end;
						existingScore.freeMod = freeMod;
						existingScore.warmup = warmup;
						existingScore.maxCombo = match.games[gameIndex].scores[scoreIndex].maxCombo;
						existingScore.count50 = match.games[gameIndex].scores[scoreIndex].counts['50'];
						existingScore.count100 = match.games[gameIndex].scores[scoreIndex].counts['100'];
						existingScore.count300 = match.games[gameIndex].scores[scoreIndex].counts['300'];
						existingScore.countMiss = match.games[gameIndex].scores[scoreIndex].counts.miss;
						existingScore.countKatu = match.games[gameIndex].scores[scoreIndex].counts.katu;
						existingScore.countGeki = match.games[gameIndex].scores[scoreIndex].counts.geki;
						existingScore.perfect = match.games[gameIndex].scores[scoreIndex].perfect;
						existingScore.teamType = teamType;
						existingScore.team = match.games[gameIndex].scores[scoreIndex].team;
						await existingScore.save();

						//Set the tournament flags on the corresponding beatmap
						if (tourneyMatch && !match.name.startsWith('MOTD:') && warmup === false) {
							let modPool = module.exports.getScoreModpool(existingScore);

							let existingEntry = beatmapModPools.find(x => x.beatmapId === existingScore.beatmapId && x.modPool === modPool);

							if (!existingEntry) {
								beatmapModPools.push({ modPool: modPool, beatmapId: match.games[gameIndex].beatmapId });
							}
						}
					} else if (existingScore.matchEndDate === null) {
						existingScore.matchEndDate = match.raw_end;
					} else {
						if (!existingMatchPlayers.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							existingMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
						}
					}
				} catch (error) {
					scoreIndex--;
				}
			}
		}

		// Bulkcreate the new scores
		if (newScores.length) {
			let created = false;
			while (!created) {
				try {
					await DBOsuMultiGameScores.bulkCreate(newScores)
						.then(async (scores) => {
							// Update warmup flags if needed
							if (!matchMakingAcronyms.includes(acronym)) {
								for (let i = 0; i < scores.length; i++) {
									if (tourneyMatch && !match.name.startsWith('MOTD:') && scores[i].warmup === false) {
										let modPool = module.exports.getScoreModpool(scores[i]);

										let existingEntry = beatmapModPools.find(x => x.beatmapId === scores[i].beatmapId && x.modPool === modPool);

										if (!existingEntry) {
											beatmapModPools.push({
												beatmapId: scores[i].beatmapId,
												modPool: modPool,
											});
										}
									}
								}

								//Set back warmup flag if it was set by amount | warmup = false is always gonna get reset | the rest only if the map was played
								for (let i = 0; i < sameTournamentGames.length; i++) {
									if (sameTournamentGames[i].warmupDecidedByAmount && sameTournamentGames[i].warmup !== null
										&& beatmapModPools.map(x => x.beatmapId).includes(sameTournamentGames[i].beatmapId)
										|| sameTournamentGames[i].warmupDecidedByAmount && sameTournamentGames[i].warmup === false) {
										sameTournamentGames[i].warmup = null;
										await sameTournamentGames[i].save();
									}
								}
							}

							created = true;
						});
				} catch (e) {
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			}
		}

		let existingGames = await DBOsuMultiGames.findAll({
			attributes: [
				'id',
				'gameId',
				'tourneyMatch',
				'scoringType',
				'mode',
				'beatmapId',
				'gameRawMods',
				'gameStartDate',
				'gameEndDate',
				'freeMod',
				'forceMod',
				'warmup',
				'warmupDecidedByAmount',
				'teamType',
				'scores'
			],
			where: {
				matchId: match.id,
			}
		});

		let newGames = [];

		for (let i = 0; i < games.length; i++) {
			let existingGame = existingGames.find(x => x.gameId === parseInt(games[i].gameId));

			if (existingGame) {
				existingGame.tourneyMatch = games[i].tourneyMatch;
				existingGame.scoringType = games[i].scoringType;
				existingGame.mode = games[i].mode;
				existingGame.beatmapId = games[i].beatmapId;
				existingGame.gameRawMods = games[i].gameRawMods;
				existingGame.gameStartDate = games[i].gameStartDate;
				existingGame.gameEndDate = games[i].gameEndDate;
				existingGame.freeMod = games[i].freeMod;
				existingGame.forceMod = games[i].forceMod;
				existingGame.warmup = games[i].warmup;
				existingGame.warmupDecidedByAmount = games[i].warmupDecidedByAmount;
				existingGame.teamType = games[i].teamType;
				existingGame.scores = games[i].scores;
				await existingGame.save();
			} else {
				newGames.push(games[i]);
			}
		}

		if (newGames.length) {
			await DBOsuMultiGames.bulkCreate(newGames);
		}

		let existingMatch = await DBOsuMultiMatches.findOne({
			attributes: [
				'id',
				'matchName',
				'acronym',
				'tourneyMatch',
				'matchStartDate',
				'matchEndDate'
			],
			where: {
				matchId: match.id,
			}
		});

		if (existingMatch) {
			existingMatch.matchName = match.name;
			existingMatch.acronym = acronym;
			existingMatch.tourneyMatch = tourneyMatch;
			existingMatch.matchStartDate = match.raw_start;
			existingMatch.matchEndDate = match.raw_end;
			await existingMatch.save();
		} else {
			await DBOsuMultiMatches.create({
				matchId: match.id,
				matchName: match.name,
				acronym: acronym,
				tourneyMatch: tourneyMatch,
				matchStartDate: match.raw_start,
				matchEndDate: match.raw_end,
			});
		}

		//Set the tournament flags on the corresponding beatmaps
		for (let i = 0; i < beatmapModPools.length; i++) {
			let NMBeatmaps = beatmapModPools.filter(x => x.modPool === 'NM').map(x => x.beatmapId);

			if (NMBeatmaps.length) {
				await DBOsuBeatmaps.update({
					noModMap: true,
				}, {
					where: {
						beatmapId: {
							[Op.in]: NMBeatmaps,
						},
						noModMap: {
							[Op.not]: true,
						}
					},
					silent: true,
				});
			}

			let HDBeatmaps = beatmapModPools.filter(x => x.modPool === 'HD').map(x => x.beatmapId);

			if (HDBeatmaps.length) {
				await DBOsuBeatmaps.update({
					hiddenMap: true,
				}, {
					where: {
						beatmapId: {
							[Op.in]: HDBeatmaps,
						},
						hiddenMap: {
							[Op.not]: true,
						}
					},
					silent: true,
				});
			}

			let HRBeatmaps = beatmapModPools.filter(x => x.modPool === 'HR').map(x => x.beatmapId);

			if (HRBeatmaps.length) {
				await DBOsuBeatmaps.update({
					hardRockMap: true,
				}, {
					where: {
						beatmapId: {
							[Op.in]: HRBeatmaps,
						},
						hardRockMap: {
							[Op.not]: true,
						}
					},
					silent: true,
				});
			}

			let DTBeatmaps = beatmapModPools.filter(x => x.modPool === 'DT').map(x => x.beatmapId);

			if (DTBeatmaps.length) {
				await DBOsuBeatmaps.update({
					doubleTimeMap: true,
				}, {
					where: {
						beatmapId: {
							[Op.in]: DTBeatmaps,
						},
						doubleTimeMap: {
							[Op.not]: true,
						}
					},
					silent: true,
				});
			}

			let FMBeatmaps = beatmapModPools.filter(x => x.modPool === 'FM').map(x => x.beatmapId);

			if (FMBeatmaps.length) {
				await DBOsuBeatmaps.update({
					freeModMap: true,
				}, {
					where: {
						beatmapId: {
							[Op.in]: FMBeatmaps,
						},
						freeModMap: {
							[Op.not]: true,
						}
					},
					silent: true,
				});
			}
		}

		if (tourneyMatch) {
			if (playersToUpdate.length) {
				await DBDiscordUsers.update({
					lastDuelRatingUpdate: null,
				}, {
					where: {
						osuUserId: {
							[Op.in]: playersToUpdate
						}
					},
					silent: true
				});
			}

			for (let i = 0; i < newMatchPlayers.length; i++) {
				if (existingMatchPlayers.includes(newMatchPlayers[i])) {
					newMatchPlayers.splice(i, 1);
					i--;
				}
			}

			if (newMatchPlayers.length) {
				//Get all follows for the players in the match
				let follows = await DBOsuTourneyFollows.findAll({
					attributes: ['userId', 'osuUserId'],
					where: {
						osuUserId: {
							[Op.in]: newMatchPlayers
						}
					}
				});

				//Collect the follows per user
				let usersToNotify = [];
				let usersToNotifyIds = [];

				for (let i = 0; i < follows.length; i++) {
					if (usersToNotifyIds.indexOf(follows[i].userId) === -1) {
						usersToNotifyIds.push(follows[i].userId);
						usersToNotify.push({ userId: follows[i].userId, osuUserIds: [follows[i].osuUserId] });
					} else {
						usersToNotify[usersToNotifyIds.indexOf(follows[i].userId)].osuUserIds.push(follows[i].osuUserId);
					}
				}

				//Create a notification for each user
				let now = new Date();
				for (let i = 0; i < usersToNotify.length; i++) {
					await DBProcessQueue.create({ task: 'tourneyFollow', priority: 1, additions: `${usersToNotify[i].userId};${match.id};${usersToNotify[i].osuUserIds.join(',')};${match.name}`, date: now });
				}
			}

			//Manage osu-track follows for guilds
			if (newMatchPlayers.length) {
				//Get all follows for the players in the match
				let guildTrackers = await DBOsuGuildTrackers.findAll({
					attributes: ['guildId', 'osuUserId', 'acronym', 'channelId', 'matchActivityAutoTrack'],
					where: {
						osuUserId: {
							[Op.in]: newMatchPlayers
						},
						matchActivity: true
					}
				});

				//Check for the acronym
				for (let i = 0; i < guildTrackers.length; i++) {
					if (!guildTrackers[i].acronym) {
						continue;
					}

					let acronyms = guildTrackers[i].acronym.split(',');

					let correctAcronym = false;

					for (let j = 0; j < acronyms.length; j++) {
						if (match.name.toLowerCase().startsWith(acronyms[j].toLowerCase().trim())) {
							correctAcronym = true;
						}
					}

					if (!correctAcronym) {
						guildTrackers.splice(i, 1);
						i--;
					}
				}

				let existingMatchPlayerTrackers = await DBOsuGuildTrackers.findAll({
					attributes: ['channelId'],
					where: {
						osuUserId: {
							[Op.in]: existingMatchPlayers
						},
						matchActivity: true,
						matchActivityAutoTrack: true,
					}
				});

				let existingMatchPlayerChannelIds = [];

				for (let i = 0; i < existingMatchPlayerTrackers.length; i++) {
					existingMatchPlayerChannelIds.push(existingMatchPlayerTrackers[i].channelId);
				}

				//Collect the follows per user
				let channelsToNotify = [];
				let channelsToNotifyIds = [];

				for (let i = 0; i < guildTrackers.length; i++) {
					if (channelsToNotifyIds.indexOf(guildTrackers[i].channelId) === -1) {
						channelsToNotifyIds.push(guildTrackers[i].channelId);
						let trackMatch = guildTrackers[i].matchActivityAutoTrack;
						if (existingMatchPlayerChannelIds.includes(guildTrackers[i].channelId)) {
							trackMatch = false;
						}
						channelsToNotify.push({ guildId: guildTrackers[i].guildId, channelId: guildTrackers[i].channelId, osuUserIds: [guildTrackers[i].osuUserId], trackMatch: trackMatch });
					} else {
						channelsToNotify[channelsToNotifyIds.indexOf(guildTrackers[i].channelId)].osuUserIds.push(guildTrackers[i].osuUserId);
					}
				}

				//Create a notification for each channel
				let now = new Date();
				for (let i = 0; i < channelsToNotify.length; i++) {
					await DBProcessQueue.create({ task: 'guildTourneyFollow', priority: 1, additions: `${channelsToNotify[i].guildId};${channelsToNotify[i].channelId};${match.id};${channelsToNotify[i].osuUserIds.join(',')};${channelsToNotify[i].trackMatch};${match.name}`, date: now });
				}
			}

			//Manage osu-track follows for guilds for acronyms
			if (newMatchPlayers.length && existingMatchPlayers.length === 0) {
				//Get all follows for the players in the match
				let guildTrackers = await DBOsuGuildTrackers.findAll({
					attributes: ['guildId', 'channelId', 'matchActivityAutoTrack'],
					where: {
						osuUserId: null,
						acronym: match.name.replace(/:.*/gm, ''),
						matchActivity: true
					}
				});


				//Collect the follows
				let channelsToNotify = [];
				let channelsToNotifyIds = [];

				for (let i = 0; i < guildTrackers.length; i++) {
					if (channelsToNotifyIds.indexOf(guildTrackers[i].channelId) === -1) {
						channelsToNotifyIds.push(guildTrackers[i].channelId);
						let trackMatch = guildTrackers[i].matchActivityAutoTrack;
						channelsToNotify.push({ guildId: guildTrackers[i].guildId, channelId: guildTrackers[i].channelId, trackMatch: trackMatch });
					}
				}

				//Create a notification for each channel
				let now = new Date();
				for (let i = 0; i < channelsToNotify.length; i++) {
					await DBProcessQueue.create({ task: 'guildTourneyAcronymFollow', priority: 1, additions: `${channelsToNotify[i].guildId};${channelsToNotify[i].channelId};${match.id};${match.name.replace(/:.*/gm, '')};${channelsToNotify[i].trackMatch};${match.name}`, date: now });
				}
			}
		}

		// Remove the match from the getting imported list
		try {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting utils.js remove sameMatchesGettingImported to shards...');
			}

			if (client) {
				await client.shard.broadcastEval(async (c, { matchId }) => {
					if (c.shardId === 0) {
						c.matchesGettingImported = c.matchesGettingImported.filter(m => m.matchId !== matchId);
					}
				}, {
					context: {
						matchId: match.id,
					}
				});
			}
		} catch (err) {
			//Ignore
		}
	},
	async populateMsgFromInteraction(interaction) {
		let userMentions = new Discord.Collection();
		let roleMentions = new Discord.Collection();
		let channelMentions = new Discord.Collection();

		if (interaction.options._hoistedOptions) {
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].type === 'USER') {
					userMentions.set(interaction.options._hoistedOptions[i].user.id, interaction.options._hoistedOptions[i].user);
				} else if (interaction.options._hoistedOptions[i].value && interaction.options._hoistedOptions[i].type === 'STRING' && interaction.options._hoistedOptions[i].value.startsWith('<@') && interaction.options._hoistedOptions[i].value.endsWith('>')) {
					let user = await interaction.client.users.fetch(interaction.options._hoistedOptions[i].value.replace(/\D/g, ''));
					userMentions.set(user.id, user);
				} else if (interaction.options._hoistedOptions[i].type === 'ROLE') {
					roleMentions.set(interaction.options._hoistedOptions[i].role.id, interaction.options._hoistedOptions[i].role);
				} else if (interaction.options._hoistedOptions[i].type === 'CHANNEL') {
					channelMentions.set(interaction.options._hoistedOptions[i].channel.id, interaction.options._hoistedOptions[i].channel);
				}
			}
		}

		let mentions = {
			users: userMentions,
			roles: roleMentions,
			channels: channelMentions
		};

		let guildId = null;

		if (interaction.guild) {
			guildId = interaction.guild.id;
		}

		return {
			author: interaction.user,
			client: interaction.client,
			channel: interaction.channel,
			guild: interaction.guild,
			mentions: mentions,
			guildId: guildId
		};
	},
	async getOsuBeatmap(input) {
		let beatmapId = input.beatmapId;
		let modBits = 0;
		if (input.modBits) {
			modBits = input.modBits;
		}

		let mods = module.exports.getMods(modBits);

		let forceUpdate = false;
		if (input.forceUpdate) {
			forceUpdate = true;
		}

		let dbBeatmap = null;

		if (input.beatmap && modBits === parseInt(input.beatmap.mods)) {
			dbBeatmap = input.beatmap;
		}

		let lastRework = new Date();
		lastRework.setUTCFullYear(2025);
		lastRework.setUTCMonth(2);
		lastRework.setUTCDate(7);
		lastRework.setUTCHours(23);

		let lastMonth = new Date();
		lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);

		// //Date of reworked EZ values
		// if (mods.includes('EZ')) {
		// 	lastRework.setUTCFullYear(2022);
		// 	lastRework.setUTCMonth(2);
		// 	lastRework.setUTCDate(19);
		// }

		// //Date of reworked DT values
		// if (mods.includes('DT') || mods.includes('NC') || mods.includes('HT')) {
		// 	lastRework.setUTCFullYear(2022);
		// 	lastRework.setUTCMonth(7);
		// 	lastRework.setUTCDate(21);
		// }

		// //Date of reworked FL values
		// if (mods.includes('FL')) {
		// 	lastRework.setUTCFullYear(2022);
		// 	lastRework.setUTCMonth(7);
		// 	lastRework.setUTCDate(29);
		// }

		//Repeat up to 3 times if errors appear
		for (let i = 0; i < 3; i++) {
			if (!dbBeatmap) {
				dbBeatmap = await DBOsuBeatmaps.findOne({
					where: {
						beatmapId: beatmapId, mods: modBits
					}
				});
			}

			try {
				//Date of reworked mania values
				if (dbBeatmap && dbBeatmap.mode === 'Mania') {
					lastRework.setUTCFullYear(2022);
					lastRework.setUTCMonth(9);
					lastRework.setUTCDate(12);
				}

				//Date of reworked SO values
				if (mods.includes('SO')) {
					lastRework.setUTCFullYear(2023);
					lastRework.setUTCMonth(0);
					lastRework.setUTCDate(13);
				}

				//Date of reworked EZ / HR + DT / HT values
				if ((mods.includes('EZ') || mods.includes('HR')) && (mods.includes('DT') || mods.includes('NC') || mods.includes('HT'))) {
					lastRework.setUTCFullYear(2023);
					lastRework.setUTCMonth(2);
					lastRework.setUTCDate(1);
				}

				//Fucked up Not found partially, this should make the process faster
				if (dbBeatmap && dbBeatmap.approvalStatus === 'Not found') {
					lastRework.setUTCFullYear(2022);
					lastRework.setUTCMonth(11);
					lastRework.setUTCDate(12);
					lastRework.setUTCHours(18);
				}

				if (!dbBeatmap
					|| forceUpdate
					|| dbBeatmap && dbBeatmap.updatedAt < lastRework //If reworked
					|| dbBeatmap && dbBeatmap.approvalStatus === 'Qualified'
					|| dbBeatmap && dbBeatmap.approvalStatus !== 'Ranked' && dbBeatmap.approvalStatus !== 'Approved' && (!dbBeatmap.updatedAt || dbBeatmap.updatedAt.getTime() < lastMonth.getTime()) //Update if old non-ranked map
					|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && (!dbBeatmap.starRating || !dbBeatmap.maxCombo || dbBeatmap.starRating == 0 || !dbBeatmap.mode)) { //Always update ranked maps if values are missing

					//Delete the map if it exists and we are checking NM
					const path = `./maps/${beatmapId}.osu`;

					try {
						const fs = require('fs');
						fs.unlinkSync(path);
					} catch (err) {
						//console.error(err);
					}

					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					module.exports.logOsuAPICalls(`utils.js getOsuBeatmap ${beatmapId} ${modBits}`);
					await osuApi.getBeatmaps({ b: beatmapId, mods: modBits })
						.then(async (beatmaps) => {
							let noVisualModBeatmap = beatmaps[0];
							if (mods.includes('MI') || mods.includes('HD') && !mods.includes('FL') || mods.includes('FI') || mods.includes('NF') || mods.includes('NC') || mods.includes('PF') || mods.includes('SD') || mods.includes('SO')) {
								let realNoVisualModBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: module.exports.getModBits(mods.join(''), true) });
								noVisualModBeatmap.difficulty.rating = realNoVisualModBeatmap.starRating;
								noVisualModBeatmap.difficulty.aim = realNoVisualModBeatmap.aimRating;
								noVisualModBeatmap.difficulty.speed = realNoVisualModBeatmap.speedRating;
								noVisualModBeatmap.maxCombo = realNoVisualModBeatmap.maxCombo;
							}

							//Recalculate bpm for HT and DT
							let bpm = beatmaps[0].bpm;
							let cs = beatmaps[0].difficulty.size;
							let ar = beatmaps[0].difficulty.approach;
							let od = beatmaps[0].difficulty.overall;
							let hpDrain = beatmaps[0].difficulty.drain;
							let drainLength = beatmaps[0].length.drain;
							let totalLength = beatmaps[0].length.total;

							//EZ
							if (mods.includes('EZ')) {
								cs = parseFloat(cs) / 2;
								ar = parseFloat(ar) / 2;
								od = parseFloat(od) / 2;
								hpDrain = parseFloat(hpDrain) / 2;
							}

							//HR
							if (mods.includes('HR')) {
								cs = parseFloat(cs) * 1.3;
								ar = parseFloat(ar) * 1.4;
								od = parseFloat(od) * 1.4;
								hpDrain = parseFloat(hpDrain) * 1.4;
							}

							if (mods.includes('DT') || mods.includes('NC')) {
								bpm = parseFloat(bpm) * 1.5;
								drainLength = parseFloat(drainLength) / 1.5;
								totalLength = parseFloat(totalLength) / 1.5;
								let ms;
								if (ar > 5) {
									ms = 200 + (11 - ar) * 100;
								} else ms = 800 + (5 - ar) * 80;

								if (ms < 300) {
									ar = 11;
								} else if (ms < 1200) {
									ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
								} else ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
							} else if (mods.includes('HT')) {
								let speed = 0.75;
								let ar_ms;
								let ar0_ms = 1800;
								let ar5_ms = 1200;
								let ar_ms_step1 = 120;
								let ar_ms_step2 = 150;
								let ar10_ms = 450;

								if (ar <= 5) ar_ms = ar0_ms - ar_ms_step1 * ar;
								else ar_ms = ar5_ms - ar_ms_step2 * (ar - 5);

								if (ar_ms < ar10_ms) ar_ms = ar10_ms;
								if (ar_ms > ar0_ms) ar_ms = ar0_ms;

								ar_ms /= speed;

								if (ar <= 5) ar = (ar0_ms - ar_ms) / ar_ms_step1;
								else ar = 5 + (ar5_ms - ar_ms) / ar_ms_step2;

								bpm = parseFloat(bpm) * 0.75;
								drainLength = parseFloat(drainLength) / 0.75;
								totalLength = parseFloat(totalLength) / 0.75;
							}

							//Limit AR to 10 if not DT or NC
							if (ar > 10 && !mods.includes('DT') && !mods.includes('NC')) {
								ar = 10;
							}

							//Limit OD to 10 if not DT or NC
							if (od > 10 && !mods.includes('DT') && !mods.includes('NC')) {
								od = 10;
							}

							//Limit HP to 10 if not DT or NC
							if (hpDrain > 10 && !mods.includes('DT') && !mods.includes('NC')) {
								hpDrain = 10;
							}

							cs = Math.min(Math.round(cs * 100) / 100, 10);
							ar = Math.min(Math.round(ar * 100) / 100, 11);
							od = Math.min(Math.round(od * 100) / 100, 11);
							hpDrain = Math.min(Math.round(hpDrain * 100) / 100, 11);

							let notDownloadable = false;
							if (!beatmaps[0].hasDownload) {
								notDownloadable = true;
							}

							let audioUnavailable = false;
							if (!beatmaps[0].hasAudio) {
								audioUnavailable = true;
							}

							//Map has to be updated
							if (dbBeatmap) {
								dbBeatmap.title = beatmaps[0].title;
								dbBeatmap.artist = beatmaps[0].artist;
								dbBeatmap.difficulty = beatmaps[0].version;
								dbBeatmap.starRating = noVisualModBeatmap.difficulty.rating;
								dbBeatmap.aimRating = noVisualModBeatmap.difficulty.aim;
								dbBeatmap.speedRating = noVisualModBeatmap.difficulty.speed;
								dbBeatmap.drainLength = drainLength;
								dbBeatmap.totalLength = totalLength;
								dbBeatmap.circleSize = cs;
								dbBeatmap.approachRate = ar;
								dbBeatmap.overallDifficulty = od;
								dbBeatmap.hpDrain = hpDrain;
								dbBeatmap.mapper = beatmaps[0].creator;
								dbBeatmap.beatmapsetId = beatmaps[0].beatmapSetId;
								dbBeatmap.bpm = bpm;
								dbBeatmap.mode = beatmaps[0].mode;
								dbBeatmap.approvalStatus = beatmaps[0].approvalStatus;
								dbBeatmap.maxCombo = noVisualModBeatmap.maxCombo;
								dbBeatmap.circles = beatmaps[0].objects.normal;
								dbBeatmap.sliders = beatmaps[0].objects.slider;
								dbBeatmap.spinners = beatmaps[0].objects.spinner;
								dbBeatmap.mods = modBits;
								dbBeatmap.userRating = beatmaps[0].rating;
								dbBeatmap.notDownloadable = notDownloadable;
								dbBeatmap.audioUnavailable = audioUnavailable;
								dbBeatmap.hash = beatmaps[0].hash;
								dbBeatmap.changed('updatedAt', true);
								await dbBeatmap.save();
							} else { // Map has to be added new
								//Get the tourney map flags
								let tourneyMap = false;
								let noModMap = false;
								let hiddenMap = false;
								let hardRockMap = false;
								let doubleTimeMap = false;
								let freeModMap = false;

								let tourneyScores = await DBOsuMultiGameScores.findAll({
									attributes: ['gameRawMods', 'rawMods', 'freeMod', 'matchId'],
									where: {
										beatmapId: beatmaps[0].id,
										tourneyMatch: true,
										warmup: {
											[Op.not]: true,
										},
									}
								});

								let tourneyMatches = await DBOsuMultiMatches.findAll({
									attributes: ['matchId'],
									where: {
										matchId: {
											[Op.in]: tourneyScores.map(x => x.matchId),
										},
										acronym: {
											[Op.not]: 'MOTD',
										},
									}
								});

								for (let i = 0; i < tourneyScores.length; i++) {
									let match = tourneyMatches.find(x => x.matchId === tourneyScores[i].matchId);

									if (!match) {
										tourneyScores.splice(i, 1);
										i--;
									}
								}

								if (tourneyScores.length > 0) {
									tourneyMap = true;
								}

								for (let i = 0; i < tourneyScores.length; i++) {
									let modPool = module.exports.getScoreModpool(tourneyScores[i]);

									if (modPool === 'NM') {
										noModMap = true;
									} else if (modPool === 'HD') {
										hiddenMap = true;
									} else if (modPool === 'HR') {
										hardRockMap = true;
									} else if (modPool === 'DT') {
										doubleTimeMap = true;
									} else if (modPool === 'FM') {
										freeModMap = true;
									}
								}

								dbBeatmap = await DBOsuBeatmaps.create({
									title: beatmaps[0].title,
									artist: beatmaps[0].artist,
									difficulty: beatmaps[0].version,
									starRating: noVisualModBeatmap.difficulty.rating,
									aimRating: noVisualModBeatmap.difficulty.aim,
									speedRating: noVisualModBeatmap.difficulty.speed,
									drainLength: drainLength,
									totalLength: totalLength,
									circleSize: cs,
									approachRate: ar,
									overallDifficulty: od,
									hpDrain: hpDrain,
									mapper: beatmaps[0].creator,
									beatmapId: beatmaps[0].id,
									beatmapsetId: beatmaps[0].beatmapSetId,
									bpm: bpm,
									mode: beatmaps[0].mode,
									approvalStatus: beatmaps[0].approvalStatus,
									maxCombo: noVisualModBeatmap.maxCombo,
									circles: beatmaps[0].objects.normal,
									sliders: beatmaps[0].objects.slider,
									spinners: beatmaps[0].objects.spinner,
									mods: modBits,
									userRating: beatmaps[0].rating,
									tourneyMap: tourneyMap,
									noModMap: noModMap,
									hiddenMap: hiddenMap,
									hardRockMap: hardRockMap,
									doubleTimeMap: doubleTimeMap,
									freeModMap: freeModMap,
									notDownloadable: notDownloadable,
									audioUnavailable: audioUnavailable,
									hash: beatmaps[0].hash,
								});
							}
						})
						.catch(async (error) => {
							//Nothing
							//Map is already saved; Delay next check until 7 days
							if (dbBeatmap && error.message === 'Not found') {
								dbBeatmap.approvalStatus = 'Not found';
								dbBeatmap.changed('updatedAt', true);
								await dbBeatmap.save();
							} else if (error.message === 'Not found') { // Map has to be added new
								dbBeatmap = await DBOsuBeatmaps.create({
									beatmapId: beatmapId,
									approvalStatus: 'Not found',
									mods: modBits,
									starRating: 0,
									maxCombo: 0,
								});
							}
						});
				}

				i = Infinity;
			} catch (e) {
				if (i < 2) {
					dbBeatmap = null;
				}
			}
		}

		if (dbBeatmap && dbBeatmap.approvalStatus === 'Not found') {
			return null;
		}

		return dbBeatmap;
	},
	logOsuAPICalls(output) {
		process.send('osu!API');

		if (traceOsuAPICalls) {
			// eslint-disable-next-line no-console
			console.log('osu!API', new Date(), output);
		}
	},
	fitTextOnMiddleCanvas(ctx, text, startingSize, fontface, yPosition, width, widthReduction) {
		// start with a large font size
		var fontsize = startingSize;

		// lower the font size until the text fits the canvas
		do {
			fontsize--;
			ctx.font = fontsize + 'px ' + fontface;
		} while (ctx.measureText(text).width > width - widthReduction);

		// draw the text
		ctx.textAlign = 'center';
		ctx.fillText(text, width / 2, yPosition);

		return fontsize;
	},
	getScoreModpool(dbScore) {
		//Evaluate with which mods the game was played
		if (dbScore.freeMod || dbScore.rawMods !== 0) {
			return 'FM';
		}

		if (dbScore.gameRawMods === 0 || dbScore.gameRawMods === 1) {
			return 'NM';
		}

		if (dbScore.gameRawMods === 8 || dbScore.gameRawMods === 9) {
			return 'HD';
		}

		if (dbScore.gameRawMods === 16 || dbScore.gameRawMods === 17) {
			return 'HR';
		}

		if (dbScore.gameRawMods > 63 && (dbScore.gameRawMods === 64 || dbScore.gameRawMods === 65 || dbScore.gameRawMods === 576 || dbScore.gameRawMods === 577)) {
			return 'DT';
		}

		return 'FM';
	},
	async checkForBirthdays(client) {
		//get current date
		const currentDate = new Date();

		if (module.exports.wrongCluster(client)) {
			return;
		}

		//get birthday dates from DBBirthdayGuilds for all users in the database that have a birthday set
		let birthdayAnnouncements = await DBBirthdayGuilds.findAll({
			attributes: ['id', 'userId', 'guildId', 'birthdayTime'],
			where: {
				birthdayTime: {
					[Op.lte]: currentDate
				},
			}
		});

		// iterate through all users and check if the current date is the same as the birthday date 
		for (let i = 0; i < birthdayAnnouncements.length; i++) {
			//Check if the birthday announcement is enabled on the guild
			let dbGuild = await DBGuilds.findOne({
				attributes: ['birthdayEnabled', 'birthdayMessageChannel'],
				where: {
					guildId: birthdayAnnouncements[i].guildId
				}
			});

			if (dbGuild && dbGuild.birthdayEnabled) {
				//Fetch the channel
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting utils.js birthdayAnnouncement to shards...');
				}

				let channelFound = await client.shard.broadcastEval(async (c, { guildId, channelId, userId }) => {
					const birthdayMessageChannel = await c.channels.cache.get(channelId);

					if (birthdayMessageChannel) {
						if (birthdayMessageChannel.type !== 0) {
							const { DBGuilds } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);

							let dbGuild = await DBGuilds.findOne({
								attributes: ['id', 'birthdayEnabled', 'birthdayMessageChannel'],
								where: {
									guildId: guildId
								}
							});

							dbGuild.birthdayEnabled = false;
							dbGuild.birthdayMessageChannel = null;
							await dbGuild.save();
							return false;
						}

						// send a birthday gif from tenor 
						let index;
						const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
						const birthdayGif = await fetch(`https://api.tenor.com/v1/search?q=anime_birthday&key=${process.env.TENORTOKEN}&limit=30&contentfilter=medium`)
							.then(async (res) => {
								let gifs = await res.json();
								index = Math.floor(Math.random() * gifs.results.length);
								return gifs.results[index].media[0].gif.url;
							});

						// send the birthday message
						await birthdayMessageChannel.send(`<@${userId}> is celebrating their birthday today! :partying_face: :tada:\n${birthdayGif}`);
						return true;
					}
					return false;
				}, { context: { guildId: birthdayAnnouncements[i].guildId, channelId: dbGuild.birthdayMessageChannel, userId: birthdayAnnouncements[i].userId } });

				channelFound = channelFound.some(channel => channel);

				if (channelFound) {
					let date = new Date(birthdayAnnouncements[i].birthdayTime);
					date.setUTCFullYear(date.getUTCFullYear() + 1);
					date.setUTCHours(0);
					date.setUTCMinutes(0);
					date.setUTCSeconds(0);
					birthdayAnnouncements[i].birthdayTime = date;

					await birthdayAnnouncements[i].save();
					continue;
				}
			} else if (dbGuild) {
				//Guild was found but birthdays are disabled; Delay by a year
				let date = new Date(birthdayAnnouncements[i].birthdayTime);
				date.setUTCFullYear(date.getUTCFullYear() + 1);
				date.setUTCHours(0);
				date.setUTCMinutes(0);
				date.setUTCSeconds(0);
				birthdayAnnouncements[i].birthdayTime = date;
				await birthdayAnnouncements[i].save();
				continue;
			}

			//Guild or Channel was not found; Delay by 5 minutes unless its after 12 UTC already
			if (currentDate.getUTCHours() < 12) {
				let date = new Date(birthdayAnnouncements[i].birthdayTime);
				date.setUTCMinutes(date.getUTCMinutes() + 5);
				birthdayAnnouncements[i].birthdayTime = date;
				birthdayAnnouncements[i].save();
			} else {
				birthdayAnnouncements[i].destroy();
			}
		}
	},
	async getUserDuelStarRating(input) {
		// console.log('-------------------------------------------------------------------------------------------------------------------');
		// let startTime = new Date();
		//Try to get it from tournament data if available
		let endDate = new Date();
		if (input.date) {
			endDate = input.date;
		}

		let startDate = new Date(endDate);
		startDate.setUTCFullYear(endDate.getUTCFullYear() - 1);

		//Check if it is the last moment of a month
		let completeMonth = false;
		let lastDayOfTheMonth = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, 0);
		if (endDate.getUTCDate() === lastDayOfTheMonth.getDate()
			&& endDate.getUTCHours() === 23
			&& endDate.getUTCMinutes() === 59
			&& endDate.getUTCSeconds() === 59
			&& endDate.getUTCMilliseconds() === 999) {
			completeMonth = true;
		}

		//Check if it is the last moment of a week
		let completeWeek = false;
		if (endDate.getUTCDay() === 0
			&& endDate.getUTCHours() === 23
			&& endDate.getUTCMinutes() === 59
			&& endDate.getUTCSeconds() === 59
			&& endDate.getUTCMilliseconds() === 999) {
			completeWeek = true;
		}

		let duelRatings = {
			total: null,
			noMod: null,
			noModLimited: false,
			hidden: null,
			hiddenLimited: false,
			hardRock: null,
			hardRockLimited: false,
			doubleTime: null,
			doubleTimeLimited: false,
			freeMod: null,
			freeModLimited: false,
			stepData: {
				NM: [],
				HD: [],
				HR: [],
				DT: [],
				FM: []
			},
			scores: {
				NM: [],
				HD: [],
				HR: [],
				DT: [],
				FM: []
			},
			provisional: false,
			outdated: false
		};

		let savedStats = null;
		if (completeMonth || completeWeek) {
			savedStats = await DBDuelRatingHistory.findOne({
				attributes: [
					'osuDuelStarRating',
					'osuNoModDuelStarRating',
					'osuNoModDuelStarRatingLimited',
					'osuHiddenDuelStarRating',
					'osuHiddenDuelStarRatingLimited',
					'osuHardRockDuelStarRating',
					'osuHardRockDuelStarRatingLimited',
					'osuDoubleTimeDuelStarRating',
					'osuDoubleTimeDuelStarRatingLimited',
					'osuFreeModDuelStarRating',
					'osuFreeModDuelStarRatingLimited',
					'osuDuelProvisional',
					'osuDuelOutdated'
				],
				where: {
					osuUserId: input.osuUserId,
					year: endDate.getUTCFullYear(),
					month: endDate.getUTCMonth() + 1,
					date: endDate.getUTCDate()
				}
			});
		}

		if (savedStats) {
			duelRatings.total = parseFloat(savedStats.osuDuelStarRating);
			duelRatings.noMod = parseFloat(savedStats.osuNoModDuelStarRating);
			duelRatings.noModLimited = savedStats.osuNoModDuelStarRatingLimited;
			duelRatings.hidden = parseFloat(savedStats.osuHiddenDuelStarRating);
			duelRatings.hiddenLimited = savedStats.osuHiddenDuelStarRatingLimited;
			duelRatings.hardRock = parseFloat(savedStats.osuHardRockDuelStarRating);
			duelRatings.hardRockLimited = savedStats.osuHardRockDuelStarRatingLimited;
			duelRatings.doubleTime = parseFloat(savedStats.osuDoubleTimeDuelStarRating);
			duelRatings.doubleTimeLimited = savedStats.osuDoubleTimeDuelStarRatingLimited;
			duelRatings.freeMod = parseFloat(savedStats.osuFreeModDuelStarRating);
			duelRatings.freeModLimited = savedStats.osuFreeModDuelStarRatingLimited;
			duelRatings.provisional = savedStats.osuDuelProvisional;
			duelRatings.outdated = savedStats.osuDuelOutdated;
			return duelRatings;
		}

		let discordUser = await DBDiscordUsers.findOne({
			attributes: [
				'lastDuelRatingUpdate',
				'osuDuelStarRating',
				'osuNoModDuelStarRating',
				'osuNoModDuelStarRatingLimited',
				'osuHiddenDuelStarRating',
				'osuHiddenDuelStarRatingLimited',
				'osuHardRockDuelStarRating',
				'osuHardRockDuelStarRatingLimited',
				'osuDoubleTimeDuelStarRating',
				'osuDoubleTimeDuelStarRatingLimited',
				'osuFreeModDuelStarRating',
				'osuFreeModDuelStarRatingLimited',
				'osuDuelProvisional',
				'osuDuelOutdated'
			],
			where: {
				osuUserId: input.osuUserId
			}
		});

		let weeksAgo = new Date();
		weeksAgo.setUTCDate(weeksAgo.getUTCDate() - 21);
		if (discordUser && discordUser.lastDuelRatingUpdate && discordUser.lastDuelRatingUpdate > weeksAgo && !input.date && !input.forceUpdate) {
			duelRatings.total = parseFloat(discordUser.osuDuelStarRating);
			duelRatings.noMod = parseFloat(discordUser.osuNoModDuelStarRating);
			duelRatings.noModLimited = discordUser.osuNoModDuelStarRatingLimited;
			duelRatings.hidden = parseFloat(discordUser.osuHiddenDuelStarRating);
			duelRatings.hiddenLimited = discordUser.osuHiddenDuelStarRatingLimited;
			duelRatings.hardRock = parseFloat(discordUser.osuHardRockDuelStarRating);
			duelRatings.hardRockLimited = discordUser.osuHardRockDuelStarRatingLimited;
			duelRatings.doubleTime = parseFloat(discordUser.osuDoubleTimeDuelStarRating);
			duelRatings.doubleTimeLimited = discordUser.osuDoubleTimeDuelStarRatingLimited;
			duelRatings.freeMod = parseFloat(discordUser.osuFreeModDuelStarRating);
			duelRatings.freeModLimited = discordUser.osuFreeModDuelStarRatingLimited;
			duelRatings.provisional = discordUser.osuDuelProvisional;
			duelRatings.outdated = discordUser.osuDuelOutdated;
			return duelRatings;
		}

		//Check for scores from the past half a year
		const lastHalfYear = new Date();
		lastHalfYear.setUTCMonth(lastHalfYear.getUTCMonth() - 6);

		const pastHalfYearScoreCount = await DBOsuMultiGameScores.count({
			where: {
				osuUserId: input.osuUserId,
				tourneyMatch: true,
				scoringType: 3,
				mode: 0,
				gameEndDate: {
					[Op.gte]: lastHalfYear
				}
			}
		});

		let outdated = false;

		if (pastHalfYearScoreCount < 5) {
			outdated = true;
		}

		duelRatings.outdated = outdated;

		let scoresPerMod = 35;
		let outliersPerMod = 3;

		let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];

		//Get the tournament data either limited by the date
		let userScores = await DBOsuMultiGameScores.findAll({
			attributes: [
				'gameId',
				'beatmapId',
				'score',
				'matchId',
				'gameRawMods',
				'rawMods',
				'count300',
				'count100',
				'count50',
				'countMiss'
			],
			where: {
				osuUserId: input.osuUserId,
				tourneyMatch: true,
				scoringType: 3,
				mode: 0,
				score: {
					[Op.gt]: 10000
				},
				warmup: {
					[Op.not]: true
				},
				[Op.and]: [
					{
						gameEndDate: {
							[Op.lte]: endDate
						}
					},
					{
						gameEndDate: {
							[Op.gte]: startDate
						}
					}
				]
			},
			order: [
				['gameId', 'DESC']
			]
		});

		let userMatches = await DBOsuMultiMatches.findAll({
			attributes: [
				'matchId',
				'matchName',
				'acronym',
				'matchStartDate',
				'verifiedBy',
				'verifiedAt'
			],
			where: {
				matchId: {
					[Op.in]: userScores.map(score => score.matchId)
				},
				[Op.and]: [
					{
						[Op.not]: [
							{
								acronym: 'FEM2' //Femboy 2 has challenges including missing on purpose
							}
						],
					},
					{
						[Op.not]: [
							{
								acronym: 'ZKFC S2' //Requires getting a specific score
							}
						]
					},
					{
						[Op.not]: [
							{
								acronym: 'NDC2:' //Requires getting a specific score
							}
						]
					},
				]
			}
		});

		//Add the match data to the scores
		for (let i = 0; i < userScores.length; i++) {
			let match = userMatches.find(match => match.matchId === userScores[i].matchId);

			if (!match) {
				userScores.splice(i, 1);
				i--;
				continue;
			}

			userScores[i].matchName = match.matchName;
			userScores[i].acronym = match.acronym;
			userScores[i].matchStartDate = match.matchStartDate;
			userScores[i].verifiedBy = match.verifiedBy;
			userScores[i].verifiedAt = match.verifiedAt;
		}

		// Get the modpool ratios for the first 100 maps for later
		const modPoolAmounts = [0, 0, 0, 0, 0];

		//Get ratio of modPools played maps
		for (let i = 0; i < userScores.length && i < 100; i++) {
			modPoolAmounts[modPools.indexOf(module.exports.getScoreModpool(userScores[i]))]++;
		}

		//Loop through all modpools
		for (let modIndex = 0; modIndex < modPools.length; modIndex++) {
			//Get only unique maps for each modpool
			const checkedMapIds = [];
			const userMapIds = [];
			const userMaps = [];

			// Don't count plays with more than 15% misses
			for (let i = 0; i < userScores.length; i++) {
				let totalHits = parseInt(userScores[i].count300) + parseInt(userScores[i].count100) + parseInt(userScores[i].count50) + parseInt(userScores[i].countMiss);

				if (100 / totalHits * parseInt(userScores[i].countMiss) > 15 &&
					(
						(matchMakingAcronyms.includes(userScores[i].acronym) && userScores[i].verifiedBy === '31050083') ||
						userScores[i].verifiedAt === null
					)
				) {
					if (input.client && input.client.knownSuspiciousMatches.indexOf(userScores[i].matchId) === -1) {
						input.client.knownSuspiciousMatches.push(userScores[i].matchId);

						await module.exports.sendMessageToLogChannel(input.client, process.env.SUSPICIOUSACTIVITYLOG, `Found suspicious unverified match: https://osu.ppy.sh/community/matches/${userScores[i].matchId}\nReason: More than 15% misses on a map`);
					}

					continue;
				}

				//Check if the map is already in; the score is above 10k and the map is not an aspire map
				if (checkedMapIds.indexOf(userScores[i].beatmapId) === -1 && userScores[i].beatmapId !== '1033882' && userScores[i].beatmapId !== '529285') {
					checkedMapIds.push(userScores[i].beatmapId);
					if (module.exports.getScoreModpool(userScores[i]) === modPools[modIndex]) {
						if (userMapIds.indexOf(userScores[i].beatmapId) === -1) {
							userMapIds.push(userScores[i].beatmapId);
							userMaps.push({ beatmapId: userScores[i].beatmapId, score: parseInt(userScores[i].score), matchId: userScores[i].matchId, matchName: userScores[i].matchName, matchStartDate: userScores[i].matchStartDate, modBits: parseInt(userScores[i].gameRawMods) + parseInt(userScores[i].rawMods) });
						}
					}
				}
			}

			let beatmaps = await DBOsuBeatmaps.findAll({
				attributes: [
					'id',
					'beatmapId',
					'mods',
					'starRating',
					'approvalStatus',
					'popular',
					'approachRate',
					'circleSize',
					'updatedAt',
					'maxCombo',
				],
				where: {
					beatmapId: {
						[Op.in]: userMapIds
					}
				}
			});

			// Get all the maps and fill in their data
			let relevantMaps = [];
			for (let i = 0; i < userMaps.length && i < scoresPerMod + outliersPerMod * 2; i++) {
				//Get the most recent data
				// NM: 0, HD: 0, HR: 16, DT: 64, FM: Calculated
				let mods = 0;

				if (modPools[modIndex] === 'HD') {
					mods = 8;
				} else if (modPools[modIndex] === 'HR') {
					mods = 16;
				} else if (modPools[modIndex] === 'DT') {
					mods = 64;
				} else if (modPools[modIndex] === 'FM') {
					mods = module.exports.getMods(userMaps[i].modBits);

					if (mods.length === 0) {
						mods = 0;
					} else {
						mods = module.exports.getModBits(mods.join(''));
					}
				}

				let dbBeatmap = beatmaps.find(beatmap => beatmap.beatmapId === userMaps[i].beatmapId && beatmap.mods === mods);

				dbBeatmap = await module.exports.getOsuBeatmap({ beatmap: dbBeatmap, beatmapId: userMaps[i].beatmapId, modBits: mods });

				//Filter by ranked / popular maps > 4*
				if (dbBeatmap && parseFloat(dbBeatmap.starRating) > 3.5 && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.popular)) {
					//Standardize the score from the mod multiplier
					if (modPools[modIndex] === 'HD') {
						userMaps[i].score = userMaps[i].score / 1.06;
					} else if (modPools[modIndex] === 'HR') {
						userMaps[i].score = userMaps[i].score / 1.1;
					} else if (modPools[modIndex] === 'DT') {
						userMaps[i].score = userMaps[i].score / 1.2;
					} else if (modPools[modIndex] === 'FM') {
						let scoreMods = module.exports.getMods(userMaps[i].modBits);

						if (scoreMods.includes('HD')) {
							userMaps[i].score = userMaps[i].score / 1.06;
						}
						if (scoreMods.includes('HR')) {
							userMaps[i].score = userMaps[i].score / 1.1;
						}
						if (scoreMods.includes('FL')) {
							userMaps[i].score = userMaps[i].score / 1.12;
						}
						if (scoreMods.includes('DT')) {
							userMaps[i].score = userMaps[i].score / 1.2;
						}
						if (scoreMods.includes('EZ')) {
							userMaps[i].score = userMaps[i].score / 0.5;
						}
						if (scoreMods.includes('HT')) {
							userMaps[i].score = userMaps[i].score / 0.3;
						}
					}

					//Calculate the weights based on the graph below
					//https://www.desmos.com/calculator/wmdwcyfduw
					let c = 175000;
					let b = 2;
					let a = 0.7071;
					let overPerformWeight = (1 / (a * Math.sqrt(2))) * Math.E ** (-0.5 * Math.pow((((userMaps[i].score / c) - b) / a), 2));
					let underPerformWeight = (1 / (a * Math.sqrt(2))) * Math.E ** (-0.5 * Math.pow((((userMaps[i].score / c) - b) / a), 2));

					if (parseFloat(userMaps[i].score) > 350000) {
						overPerformWeight = 1;
					} else if (parseFloat(userMaps[i].score) < 350000) {
						underPerformWeight = 1;
					}

					userMaps[i].overPerformWeight = overPerformWeight;
					userMaps[i].underPerformWeight = underPerformWeight;
					userMaps[i].weight = Math.abs(overPerformWeight + underPerformWeight - 1);

					let mapStarRating = module.exports.adjustStarRating(dbBeatmap.starRating, dbBeatmap.approachRate, dbBeatmap.circleSize, dbBeatmap.mods);

					userMaps[i].starRating = mapStarRating;

					userMaps[i].expectedRating = getExpectedDuelRating(userMaps[i]);

					relevantMaps.push(userMaps[i]);
				} else {
					userMaps.splice(i, 1);
					i--;
				}
			}

			//Get rid of the outliersPerMod best maps by expectedRating
			if (relevantMaps.length < 10) {
				outliersPerMod = 0;
			} else if (relevantMaps.length < 20) {
				outliersPerMod = 1;
			} else if (relevantMaps.length < 30) {
				outliersPerMod = 2;
			}

			for (let i = 0; i < outliersPerMod; i++) {
				let worstBeatmap = relevantMaps[0];
				let bestBeatmap = relevantMaps[0];

				for (let j = 0; j < relevantMaps.length; j++) {
					if (relevantMaps[j].expectedRating < worstBeatmap.expectedRating) {
						worstBeatmap = relevantMaps[j];
					} else if (relevantMaps[j].expectedRating > bestBeatmap.expectedRating) {
						bestBeatmap = relevantMaps[j];
					}
				}

				//Add the maps to the scores array
				worstBeatmap.outlier = true;
				bestBeatmap.outlier = true;
				if (!completeMonth && !completeWeek) {
					if (modIndex === 0) {
						duelRatings.scores.NM.push(worstBeatmap);
						duelRatings.scores.NM.push(bestBeatmap);
					} else if (modIndex === 1) {
						duelRatings.scores.HD.push(worstBeatmap);
						duelRatings.scores.HD.push(bestBeatmap);
					} else if (modIndex === 2) {
						duelRatings.scores.HR.push(worstBeatmap);
						duelRatings.scores.HR.push(bestBeatmap);
					} else if (modIndex === 3) {
						duelRatings.scores.DT.push(worstBeatmap);
						duelRatings.scores.DT.push(bestBeatmap);
					} else if (modIndex === 4) {
						duelRatings.scores.FM.push(worstBeatmap);
						duelRatings.scores.FM.push(bestBeatmap);
					}
				}

				relevantMaps.splice(relevantMaps.indexOf(worstBeatmap), 1);
				relevantMaps.splice(relevantMaps.indexOf(bestBeatmap), 1);
			}

			//Group the maps into steps of 0.1 of difficulty
			const steps = [];
			const stepData = [];
			for (let i = 0; i < relevantMaps.length; i++) {
				if (!completeMonth && !completeWeek) {
					//Add the map to the scores array
					if (modIndex === 0) {
						duelRatings.scores.NM.push(relevantMaps[i]);
					} else if (modIndex === 1) {
						duelRatings.scores.HD.push(relevantMaps[i]);
					} else if (modIndex === 2) {
						duelRatings.scores.HR.push(relevantMaps[i]);
					} else if (modIndex === 3) {
						duelRatings.scores.DT.push(relevantMaps[i]);
					} else if (modIndex === 4) {
						duelRatings.scores.FM.push(relevantMaps[i]);
					}
				}

				//Add the data to the 5 steps in the area of the maps' star rating -> 5.0 will be representing 4.8, 4.9, 5.0, 5.1, 5.2
				for (let j = 0; j < 5; j++) {
					let starRatingStep = Math.round((Math.round(relevantMaps[i].starRating * 10) / 10 + 0.1 * j - 0.2) * 10) / 10;
					if (steps.indexOf(starRatingStep) === -1) {
						stepData.push({
							step: starRatingStep,
							totalOverPerformWeight: relevantMaps[i].overPerformWeight,
							totalUnderPerformWeight: relevantMaps[i].underPerformWeight,
							amount: 1,
							averageOverPerformWeight: relevantMaps[i].overPerformWeight,
							averageUnderPerformWeight: relevantMaps[i].underPerformWeight,
							averageWeight: Math.abs(((relevantMaps[i].overPerformWeight + relevantMaps[i].underPerformWeight) / 1) - 1),
							overPerformWeightedStarRating: (starRatingStep) * relevantMaps[i].overPerformWeight,
							underPerformWeightedStarRating: (starRatingStep) * relevantMaps[i].underPerformWeight,
							weightedStarRating: (starRatingStep) * Math.abs(((relevantMaps[i].overPerformWeight + relevantMaps[i].underPerformWeight) / 1) - 1),
						});
						steps.push(starRatingStep);
					} else {
						stepData[steps.indexOf(starRatingStep)].totalOverPerformWeight += relevantMaps[i].overPerformWeight;
						stepData[steps.indexOf(starRatingStep)].totalUnderPerformWeight += relevantMaps[i].underPerformWeight;
						stepData[steps.indexOf(starRatingStep)].amount++;
						stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight = stepData[steps.indexOf(starRatingStep)].totalOverPerformWeight / stepData[steps.indexOf(starRatingStep)].amount;
						stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight = stepData[steps.indexOf(starRatingStep)].totalUnderPerformWeight / stepData[steps.indexOf(starRatingStep)].amount;
						stepData[steps.indexOf(starRatingStep)].averageWeight = Math.abs(stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight + stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight - 1);
						stepData[steps.indexOf(starRatingStep)].overPerformWeightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight;
						stepData[steps.indexOf(starRatingStep)].underPerformWeightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight;
						stepData[steps.indexOf(starRatingStep)].weightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageWeight;
					}
				}
			}

			//Calculate the starrating for the modpool
			let totalWeight = 0;
			let totalWeightedStarRating = 0;
			for (let i = 0; i < stepData.length; i++) {
				if (stepData[i].amount > 1) {
					totalWeight += stepData[i].averageWeight;
					totalWeightedStarRating += stepData[i].weightedStarRating;
				}
			}

			if (relevantMaps.length < 5) {
				duelRatings.provisional = true;
			}

			//add the values to the modpool data
			if (totalWeight > 0 && relevantMaps.length > 0) {
				let weightedStarRating = totalWeightedStarRating / totalWeight;

				for (let i = 0; i < scoresPerMod; i++) {
					weightedStarRating = applyOsuDuelStarratingCorrection(weightedStarRating, relevantMaps[relevantMaps.length - 1 - i % relevantMaps.length], Math.round((1 - (i * 1 / scoresPerMod)) * 100) / 100);
				}

				if (modIndex === 0) {
					duelRatings.noMod = weightedStarRating;
					if (!completeMonth && !completeWeek) {
						duelRatings.stepData.NM = stepData;
					}
				} else if (modIndex === 1) {
					duelRatings.hidden = weightedStarRating;
					if (!completeMonth && !completeWeek) {
						duelRatings.stepData.HD = stepData;
					}
				} else if (modIndex === 2) {
					duelRatings.hardRock = weightedStarRating;
					if (!completeMonth && !completeWeek) {
						duelRatings.stepData.HR = stepData;
					}
				} else if (modIndex === 3) {
					duelRatings.doubleTime = weightedStarRating;
					if (!completeMonth && !completeWeek) {
						duelRatings.stepData.DT = stepData;
					}
				} else if (modIndex === 4) {
					duelRatings.freeMod = weightedStarRating;
					if (!completeMonth && !completeWeek) {
						duelRatings.stepData.FM = stepData;
					}
				}
			}
		}

		// Free the memory
		userScores = null;

		//Check the past month for individual ratings and limit a potential drop to .02
		let newEndDate = new Date(endDate);
		newEndDate.setUTCDate(1);
		newEndDate.setUTCHours(0);
		newEndDate.setUTCMinutes(0);
		newEndDate.setUTCSeconds(0);
		newEndDate.setUTCMilliseconds(-1);

		let lastMonthStats = await DBDuelRatingHistory.findOne({
			attributes: [
				'osuDuelProvisional',
				'osuNoModDuelStarRating',
				'osuHiddenDuelStarRating',
				'osuHardRockDuelStarRating',
				'osuDoubleTimeDuelStarRating',
				'osuFreeModDuelStarRating'
			],
			where: {
				osuUserId: input.osuUserId,
				year: newEndDate.getUTCFullYear(),
				month: newEndDate.getUTCMonth(),
				date: newEndDate.getUTCDate()
			}
		});

		if (!lastMonthStats && (duelRatings.noMod > 0 || duelRatings.hidden > 0 || duelRatings.hardRock > 0 || duelRatings.doubleTime > 0 || duelRatings.freeMod > 0)) {
			let lastMonthDuelRating = await module.exports.getUserDuelStarRating({ osuUserId: input.osuUserId, client: input.client, date: newEndDate });

			lastMonthStats = {
				osuUserId: input.osuUserId,
				osuDuelStarRating: lastMonthDuelRating.total,
				osuNoModDuelStarRating: lastMonthDuelRating.noMod,
				osuNoModDuelStarRatingLimited: lastMonthDuelRating.noModLimited,
				osuHiddenDuelStarRating: lastMonthDuelRating.hidden,
				osuHiddenDuelStarRatingLimited: lastMonthDuelRating.hiddenLimited,
				osuHardRockDuelStarRating: lastMonthDuelRating.hardRock,
				osuHardRockDuelStarRatingLimited: lastMonthDuelRating.hardRockLimited,
				osuDoubleTimeDuelStarRating: lastMonthDuelRating.doubleTime,
				osuDoubleTimeDuelStarRatingLimited: lastMonthDuelRating.doubleTimeLimited,
				osuFreeModDuelStarRating: lastMonthDuelRating.freeMod,
				osuFreeModDuelStarRatingLimited: lastMonthDuelRating.freeModLimited,
				osuDuelProvisional: lastMonthDuelRating.provisional,
			};
		} else if (!lastMonthStats) {
			lastMonthStats = {
				osuUserId: input.osuUserId,
				osuDuelStarRating: null,
				osuNoModDuelStarRating: null,
				osuNoModDuelStarRatingLimited: false,
				osuHiddenDuelStarRating: null,
				osuHiddenDuelStarRatingLimited: false,
				osuHardRockDuelStarRating: null,
				osuHardRockDuelStarRatingLimited: false,
				osuDoubleTimeDuelStarRating: null,
				osuDoubleTimeDuelStarRatingLimited: false,
				osuFreeModDuelStarRating: null,
				osuFreeModDuelStarRatingLimited: false,
				osuDuelProvisional: true,
			};
		}

		//Get the modpool spread out of the past 100 user scores for the total value
		if (duelRatings.noMod || duelRatings.hidden || duelRatings.hardRock || duelRatings.doubleTime || duelRatings.freeMod) {

			if (lastMonthStats && !lastMonthStats.osuDuelProvisional) {
				if (lastMonthStats.osuNoModDuelStarRating && duelRatings.noMod < lastMonthStats.osuNoModDuelStarRating - 0.025) {
					duelRatings.noMod = lastMonthStats.osuNoModDuelStarRating - 0.025;
					duelRatings.noModLimited = true;
				}

				if (lastMonthStats.osuHiddenDuelStarRating && duelRatings.hidden < lastMonthStats.osuHiddenDuelStarRating - 0.025) {
					duelRatings.hidden = lastMonthStats.osuHiddenDuelStarRating - 0.025;
					duelRatings.hiddenLimited = true;
				}

				if (lastMonthStats.osuHardRockDuelStarRating && duelRatings.hardRock < lastMonthStats.osuHardRockDuelStarRating - 0.025) {
					duelRatings.hardRock = lastMonthStats.osuHardRockDuelStarRating - 0.025;
					duelRatings.hardRockLimited = true;
				}

				if (lastMonthStats.osuDoubleTimeDuelStarRating && duelRatings.doubleTime < lastMonthStats.osuDoubleTimeDuelStarRating - 0.025) {
					duelRatings.doubleTime = lastMonthStats.osuDoubleTimeDuelStarRating - 0.025;
					duelRatings.doubleTimeLimited = true;
				}

				if (lastMonthStats.osuFreeModDuelStarRating && duelRatings.freeMod < lastMonthStats.osuFreeModDuelStarRating - 0.025) {
					duelRatings.freeMod = lastMonthStats.osuFreeModDuelStarRating - 0.025;
					duelRatings.freeModLimited = true;
				}
			}

			if (duelRatings.noMod === null) {
				modPoolAmounts[0] = 0;
			}
			if (duelRatings.hidden === null) {
				modPoolAmounts[1] = 0;
			}
			if (duelRatings.hardRock === null) {
				modPoolAmounts[2] = 0;
			}
			if (duelRatings.doubleTime === null) {
				modPoolAmounts[3] = 0;
			}
			if (duelRatings.freeMod === null) {
				modPoolAmounts[4] = 0;
			}

			//Set total star rating based on the spread
			duelRatings.total = (duelRatings.noMod * modPoolAmounts[0] + duelRatings.hidden * modPoolAmounts[1] + duelRatings.hardRock * modPoolAmounts[2] + duelRatings.doubleTime * modPoolAmounts[3] + duelRatings.freeMod * modPoolAmounts[4]) / (modPoolAmounts[0] + modPoolAmounts[1] + modPoolAmounts[2] + modPoolAmounts[3] + modPoolAmounts[4]);

			if (completeMonth || completeWeek) {
				//Create the stats if they don't exist
				await DBDuelRatingHistory.create({
					osuUserId: input.osuUserId,
					year: endDate.getUTCFullYear(),
					month: endDate.getUTCMonth() + 1,
					date: endDate.getUTCDate(),
					osuDuelStarRating: duelRatings.total,
					osuNoModDuelStarRating: duelRatings.noMod,
					osuNoModDuelStarRatingLimited: duelRatings.noModLimited,
					osuHiddenDuelStarRating: duelRatings.hidden,
					osuHiddenDuelStarRatingLimited: duelRatings.hiddenLimited,
					osuHardRockDuelStarRating: duelRatings.hardRock,
					osuHardRockDuelStarRatingLimited: duelRatings.hardRockLimited,
					osuDoubleTimeDuelStarRating: duelRatings.doubleTime,
					osuDoubleTimeDuelStarRatingLimited: duelRatings.doubleTimeLimited,
					osuFreeModDuelStarRating: duelRatings.freeMod,
					osuFreeModDuelStarRatingLimited: duelRatings.freeModLimited,
					osuDuelProvisional: duelRatings.provisional,
					osuDuelOutdated: duelRatings.outdated,
				});
			}

			//Log the values in the discords if they changed and the user is connected to the bot
			let discordUser = await DBDiscordUsers.findOne({
				attributes: [
					'id',
					'userId',
					'osuName',
					'osuUserId',
					'osuDuelRatingUpdates',
					'osuDuelStarRating',
					'osuNoModDuelStarRating',
					'osuNoModDuelStarRatingLimited',
					'osuHiddenDuelStarRating',
					'osuHiddenDuelStarRatingLimited',
					'osuHardRockDuelStarRating',
					'osuHardRockDuelStarRatingLimited',
					'osuDoubleTimeDuelStarRating',
					'osuDoubleTimeDuelStarRatingLimited',
					'osuFreeModDuelStarRating',
					'osuFreeModDuelStarRatingLimited',
					'osuDuelProvisional',
					'osuDuelOutdated',
					'lastDuelRatingUpdate',
				],
				where: {
					osuUserId: input.osuUserId
				}
			});

			if (!discordUser) {
				discordUser = await DBDiscordUsers.create({ osuUserId: input.osuUserId });
			}

			if (discordUser && !input.date) {
				if (input.client) {
					try {
						let message = [`${discordUser.osuName} / ${discordUser.osuUserId}:`];
						if (Math.round(discordUser.osuDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.total * 1000) / 1000) {
							message.push(`SR: ${Math.round(discordUser.osuDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.total * 1000) / 1000}`);
							message.push(`Ratio: ${modPoolAmounts[0]} NM | ${modPoolAmounts[1]} HD | ${modPoolAmounts[2]} HR | ${modPoolAmounts[3]} DT | ${modPoolAmounts[4]} FM`);
						}
						if (Math.round(discordUser.osuNoModDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.noMod * 1000) / 1000) {
							message.push(`NM: ${Math.round(discordUser.osuNoModDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.noMod * 1000) / 1000}`);
						}
						if (Math.round(discordUser.osuHiddenDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.hidden * 1000) / 1000) {
							message.push(`HD: ${Math.round(discordUser.osuHiddenDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.hidden * 1000) / 1000}`);
						}
						if (Math.round(discordUser.osuHardRockDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.hardRock * 1000) / 1000) {
							message.push(`HR: ${Math.round(discordUser.osuHardRockDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.hardRock * 1000) / 1000}`);
						}
						if (Math.round(discordUser.osuDoubleTimeDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.doubleTime * 1000) / 1000) {
							message.push(`DT: ${Math.round(discordUser.osuDoubleTimeDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.doubleTime * 1000) / 1000}`);
						}
						if (Math.round(discordUser.osuFreeModDuelStarRating * 1000) / 1000 !== Math.round(duelRatings.freeMod * 1000) / 1000) {
							message.push(`FM: ${Math.round(discordUser.osuFreeModDuelStarRating * 1000) / 1000} -> ${Math.round(duelRatings.freeMod * 1000) / 1000}`);
						}
						if (discordUser.osuDuelProvisional !== duelRatings.provisional) {
							message.push(`Provisional: ${discordUser.osuDuelProvisional} -> ${duelRatings.provisional}`);
						}
						if (discordUser.osuDuelOutdated !== duelRatings.outdated) {
							message.push(`Outdated: ${discordUser.osuDuelOutdated} -> ${duelRatings.outdated}`);
						}

						let oldDerankStats = await module.exports.getDerankStats(discordUser);
						//Setting the new values even tho it does that later just to get the new derank values
						discordUser.osuDuelStarRating = Math.round(duelRatings.total * 100000000000000) / 100000000000000;
						discordUser.osuNoModDuelStarRating = duelRatings.noMod;
						discordUser.osuHiddenDuelStarRating = duelRatings.hidden;
						discordUser.osuHardRockDuelStarRating = duelRatings.hardRock;
						discordUser.osuDoubleTimeDuelStarRating = duelRatings.doubleTime;
						discordUser.osuFreeModDuelStarRating = duelRatings.freeMod;
						discordUser.osuDuelProvisional = duelRatings.provisional;
						discordUser.osuDuelOutdated = duelRatings.outdated;
						let newDerankStats = await module.exports.getDerankStats(discordUser);

						if (oldDerankStats.expectedPpRankOsu !== newDerankStats.expectedPpRankOsu) {
							message.push(`Deranked Rank change: #${oldDerankStats.expectedPpRankOsu} -> #${newDerankStats.expectedPpRankOsu} (${newDerankStats.expectedPpRankOsu - oldDerankStats.expectedPpRankOsu})`);
						}

						if (message.length > 1) {
							await module.exports.sendMessageToLogChannel(input.client, process.env.DUELRATINGLOG, `\`\`\`${message.join('\n')}\`\`\``);

							if (discordUser.osuDuelRatingUpdates) {
								const user = await input.client.users.cache.get(discordUser.userId);
								if (user) {
									try {
										await user.send(`Your duel ratings have been updated.\`\`\`${message.join('\n')}\`\`\``);
									} catch (err) {
										if (err.message === 'Cannot send messages to this user') {
											discordUser.osuDuelRatingUpdates = false;
											await discordUser.save();
										}
									}
								}
							}

							let guildTrackers = await DBOsuGuildTrackers.findAll({
								attributes: ['guildId', 'channelId'],
								where: {
									osuUserId: discordUser.osuUserId,
									duelRating: true,
								},
							});

							for (let i = 0; i < guildTrackers.length; i++) {
								try {
									if (logBroadcastEval) {
										// eslint-disable-next-line no-console
										console.log('Broadcasting utils.js duel Rating change for guilds to shards...');
									}

									input.client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
										let guild = await c.guilds.cache.get(guildId);

										if (!guild || guild.shardId !== c.shardId) {
											return;
										}

										let channel = await guild.channels.cache.get(channelId);
										if (channel) {
											await channel.send(message);
										}
									}, { context: { guildId: guildTrackers[i].guildId, channelId: guildTrackers[i].channelId, message: `\`\`\`${message.join('\n')}\`\`\`` } });
								} catch (err) {
									if (err.message === 'Missing Access') {
										await guildTrackers[i].destroy();
									} else {
										console.error(err);
									}
								}
							}
						}
					} catch (e) {
						console.error(e);
					}
				}

				discordUser.osuDuelStarRating = duelRatings.total;
				discordUser.osuNoModDuelStarRating = duelRatings.noMod;
				discordUser.osuNoModDuelStarRatingLimited = duelRatings.noModLimited;
				discordUser.osuHiddenDuelStarRating = duelRatings.hidden;
				discordUser.osuHiddenDuelStarRatingLimited = duelRatings.hiddenLimited;
				discordUser.osuHardRockDuelStarRating = duelRatings.hardRock;
				discordUser.osuHardRockDuelStarRatingLimited = duelRatings.hardRockLimited;
				discordUser.osuDoubleTimeDuelStarRating = duelRatings.doubleTime;
				discordUser.osuDoubleTimeDuelStarRatingLimited = duelRatings.doubleTimeLimited;
				discordUser.osuFreeModDuelStarRating = duelRatings.freeMod;
				discordUser.osuFreeModDuelStarRatingLimited = duelRatings.freeModLimited;
				discordUser.osuDuelProvisional = duelRatings.provisional;
				discordUser.osuDuelOutdated = duelRatings.outdated;
				discordUser.lastDuelRatingUpdate = new Date();
				await discordUser.save();
			}

			return duelRatings;
		}

		if (input.date) {
			return duelRatings;
		}

		duelRatings.provisional = true;

		//Get it from the top plays if no tournament data is available
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let topScores = null;

		for (let i = 0; i < 5 && !topScores; i++) {
			module.exports.logOsuAPICalls('utils.js getUserDuelStarRating');
			topScores = await osuApi.getUserBest({ u: input.osuUserId, m: 0, limit: 100 })
				.then((response) => {
					i = Infinity;
					return response;
				})
				.catch(async (err) => {
					if (i === 4) {
						if (err.message === 'Not found') {
							throw new Error('No standard plays');
						} else {
							console.error(err);
						}
					} else {
						await new Promise(resolve => setTimeout(resolve, 10000));
					}
				});
		}

		let stars = [];
		for (let i = 0; i < topScores.length; i++) {
			//Add difficulty ratings
			const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: topScores[i].beatmapId, modBits: topScores[i].raw_mods });
			if (dbBeatmap && dbBeatmap.starRating && parseFloat(dbBeatmap.starRating) > 0) {
				stars.push(dbBeatmap.starRating);
			}
		}

		let averageStars = 0;
		for (let i = 0; i < stars.length; i++) {
			averageStars += parseFloat(stars[i]);
		}

		duelRatings.total = (averageStars / stars.length) * 0.85;
		duelRatings.noMod = null;
		duelRatings.hidden = null;
		duelRatings.hardRock = null;
		duelRatings.doubleTime = null;
		duelRatings.freeMod = null;
		duelRatings.provisional = true;

		discordUser = await DBDiscordUsers.findOne({
			attributes: [
				'id',
				'osuDuelStarRating',
				'osuNoModDuelStarRating',
				'osuHiddenDuelStarRating',
				'osuHardRockDuelStarRating',
				'osuDoubleTimeDuelStarRating',
				'osuFreeModDuelStarRating',
				'osuDuelProvisional',
				'lastDuelRatingUpdate',
			],
			where: {
				osuUserId: input.osuUserId
			}
		});

		if (!discordUser) {
			discordUser = await DBDiscordUsers.create({ osuUserId: input.osuUserId });
		}

		if (discordUser) {
			discordUser.osuDuelStarRating = duelRatings.total;
			discordUser.osuNoModDuelStarRating = duelRatings.noMod;
			discordUser.osuHiddenDuelStarRating = duelRatings.hidden;
			discordUser.osuHardRockDuelStarRating = duelRatings.hardRock;
			discordUser.osuDoubleTimeDuelStarRating = duelRatings.doubleTime;
			discordUser.osuFreeModDuelStarRating = duelRatings.freeMod;
			discordUser.osuDuelProvisional = duelRatings.provisional;
			discordUser.lastDuelRatingUpdate = new Date();
			await discordUser.save();
		}

		return duelRatings;
	},
	getOsuDuelLeague(rating) {
		if (rating > 8) {
			return { name: 'Grandmaster 3', imageName: 'grandmaster_3', color: '#581CFF' };
		} else if (rating > 7.8) {
			return { name: 'Grandmaster 2', imageName: 'grandmaster_2', color: '#581CFF' };
		} else if (rating > 7.6) {
			return { name: 'Grandmaster 1', imageName: 'grandmaster_1', color: '#581CFF' };
		} else if (rating > 7.4) {
			return { name: 'Master 3', imageName: 'master_3', color: '#FFAEFB' };
		} else if (rating > 7.2) {
			return { name: 'Master 2', imageName: 'master_2', color: '#FFAEFB' };
		} else if (rating > 7) {
			return { name: 'Master 1', imageName: 'master_1', color: '#FFAEFB' };
		} else if (rating > 6.8) {
			return { name: 'Diamond 3', imageName: 'diamond_3', color: '#49B0FF' };
		} else if (rating > 6.6) {
			return { name: 'Diamond 2', imageName: 'diamond_2', color: '#49B0FF' };
		} else if (rating > 6.4) {
			return { name: 'Diamond 1', imageName: 'diamond_1', color: '#49B0FF' };
		} else if (rating > 6.2) {
			return { name: 'Platinum 3', imageName: 'platinum_3', color: '#1DD9A5' };
		} else if (rating > 6) {
			return { name: 'Platinum 2', imageName: 'platinum_2', color: '#1DD9A5' };
		} else if (rating > 5.8) {
			return { name: 'Platinum 1', imageName: 'platinum_1', color: '#1DD9A5' };
		} else if (rating > 5.6) {
			return { name: 'Gold 3', imageName: 'gold_3', color: '#FFEB47' };
		} else if (rating > 5.4) {
			return { name: 'Gold 2', imageName: 'gold_2', color: '#FFEB47' };
		} else if (rating > 5.2) {
			return { name: 'Gold 1', imageName: 'gold_1', color: '#FFEB47' };
		} else if (rating > 5) {
			return { name: 'Silver 3', imageName: 'silver_3', color: '#B5B5B5' };
		} else if (rating > 4.8) {
			return { name: 'Silver 2', imageName: 'silver_2', color: '#B5B5B5' };
		} else if (rating > 4.6) {
			return { name: 'Silver 1', imageName: 'silver_1', color: '#B5B5B5' };
		} else if (rating > 4.4) {
			return { name: 'Bronze 3', imageName: 'bronze_3', color: '#F07900' };
		} else if (rating > 4.2) {
			return { name: 'Bronze 2', imageName: 'bronze_2', color: '#F07900' };
		} else if (rating > 0) {
			return { name: 'Bronze 1', imageName: 'bronze_1', color: '#F07900' };
		} else {
			return { name: 'Unranked', imageName: 'unranked', color: '#FF6552' };
		}
	},
	async checkModsCompatibility(input, beatmapId) { //input = mods | beatmapMode needs to be NOT ID
		let beatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: input });
		if (beatmap) {
			let mods = module.exports.getMods(input);
			if (beatmap.mode !== 'Mania') {
				//double time - halftime
				if (mods.includes('DT') && mods.includes('HT')) {
					return false;
					//nightcore - halftime
				} else if (mods.includes('NC') && mods.includes('HT')) {
					return false;
					//nightcore - double time
				} else if (mods.includes('NC') && mods.includes('DT')) {
					return false;
					//hardrock - easy
				} else if (mods.includes('HR') && mods.includes('EZ')) {
					return false;
					//no fail - sudden death
				} else if (mods.includes('NF') && mods.includes('SD')) {
					return false;
					//no fail - perfect
				} else if (mods.includes('NF') && mods.includes('PF')) {
					return false;
					// perfect - sudden death
				} else if (mods.includes('PF') && mods.includes('SD')) {
					return false;
				}
			} else {
				// hidden + faid in
				if (mods.includes('HD') && mods.includes('FI')) {
					return false;
					//hidden - flashlight
				} else if (mods.includes('HD') && mods.includes('FL')) {
					return false;
					// flashlight - fade in
				} else if (mods.includes('FL') && mods.includes('FI')) {
					return false;
				}
			}
		}
		return true;
	},
	async getOsuPP(beatmapId, mode, modBits, accuracy, misses, combo, client, depth) {
		const fs = require('fs');

		if (!depth) {
			depth = 0;
		}

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/maps`)) {
			fs.mkdirSync(`${process.env.ELITEBOTIXROOTPATH}/maps`);
		}

		//Check if the map is already downloaded and download if necessary
		const path = `${process.env.ELITEBOTIXROOTPATH}/maps/${beatmapId}.osu`;

		//Force download if the map is recently updated in the database and therefore probably updated
		const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		if (dbBeatmap.approvalStatus === 'Not found') {
			return null;
		}

		const recent = new Date();
		recent.setUTCMinutes(recent.getUTCMinutes() - 3);

		let forceDownload = false;
		if (recent < dbBeatmap.updatedAt) {
			forceDownload = true;
		}

		try {
			if (forceDownload || !fs.existsSync(path)) {
				if (mapsRetriedTooOften.includes(beatmapId)) {
					return null;
				}

				let permission = null;

				if (!client) {
					permission = true;
				} else {
					permission = await module.exports.awaitWebRequestPermission(`https://osu.ppy.sh/osu/${beatmapId}`, client);
				}

				if (permission) {
					const res = await fetch(`https://osu.ppy.sh/osu/${beatmapId}`);

					await new Promise((resolve, reject) => {
						const fileStream = fs.createWriteStream(`${process.env.ELITEBOTIXROOTPATH}/maps/${beatmapId}.osu`);
						res.body.pipe(fileStream);
						res.body.on('error', (err) => {
							reject(err);
						});
						fileStream.on('finish', function () {
							resolve();
						});
					});
				}
			}
		} catch (err) {
			if (err.message.match(/Malformed_HTTP_Response fetching "https:\/\/osu.ppy.sh\/osu\/\d+". For more information, pass `verbose: true` in the second argument to fetch\(\)/gm)) {
				if (depth < 3) {
					depth++;

					return await module.exports.getOsuPP(beatmapId, mode, modBits, accuracy, misses, combo, client, depth);
				} else {
					mapsRetriedTooOften.push(beatmapId);
					return null;
				}
			} else if (!err.message.match(/request to https:\/\/osu.ppy.sh\/osu\/\d+ failed, reason: Parse Error: Invalid header value char/gm)) {
				console.error(err);
			}
			return;
		}

		if (!combo) {
			combo = 0;
		}

		try {
			let bytes = fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/maps/${beatmapId}.osu`);

			// Parse the map.
			let map = new rosu.Beatmap(bytes);

			if (mode && dbBeatmap.mode === 'Standard') {
				if (mode === 1) {
					map.convert(rosu.GameMode.Taiko);
				} else if (mode === 2) {
					map.convert(rosu.GameMode.Catch);
				} else if (mode === 3) {
					let mods = module.exports.getMods(modBits);

					let keyMod = mods.find(m => m.match(/\dK/));

					if (keyMod) {
						map.convert(rosu.GameMode.Mania, keyMod);
					} else {
						map.convert(rosu.GameMode.Mania);
					}
				} else {
					console.error(`Something went wrong and we got mode ${mode}`);
				}
			} else if (dbBeatmap.mode === 'Mania') {
				let mods = module.exports.getMods(modBits);

				let keyMod = mods.find(m => m.match(/\dK/));

				if (keyMod) {
					map.convert(rosu.GameMode.Mania, keyMod);
				}
			}

			// Calculating performance attributes for a specific score.
			const currAttrs = new rosu.Performance({
				mods: parseInt(modBits),
				misses: parseInt(misses),
				accuracy: parseFloat(accuracy),
				combo: parseInt(combo),
				hitresultPriority: rosu.HitResultPriority.BestCase,
				lazer: false
			}).calculate(map);

			// Free the beatmap manually to avoid risking memory leakage.
			map.free();

			return currAttrs.pp;
		} catch (e) {
			if (depth < 3) {
				const path = `${process.env.ELITEBOTIXROOTPATH}/maps/${beatmapId}.osu`;

				try {
					fs.unlinkSync(path);
				} catch (err) {
					// Nothing
				}

				depth++;

				return await module.exports.getOsuPP(beatmapId, mode, modBits, accuracy, misses, combo, client, depth);
			} else if (e.message !== 'Failed to parse beatmap: expected `osu file format v` at file begin' &&
				!e.message.includes('Failed to parse beatmap: IO error  - caused by: The system cannot find the file specified. (os error 2)') &&
				!e.message.includes('ENOENT: no such file or directory')) {
				console.error(`error with map ${beatmapId}`, e);
				mapsRetriedTooOften.push(beatmapId);
				return null;
			} else {
				mapsRetriedTooOften.push(beatmapId);
				return null;
			}
		}
	},
	async getMapOsrFile(beatmapId) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./mapsets')) {
			fs.mkdirSync('./mapsets');
		}

		//Force download if the map is recently updated in the database and therefore probably updated
		const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		//Check if the map is already downloaded and download if necessary
		const path = `./mapsets/${dbBeatmap.beatmapsetId}.osr`;

		const recent = new Date();
		recent.setUTCMinutes(recent.getUTCMinutes() - 3);

		let forceDownload = false;
		if (recent < dbBeatmap.updatedAt) {
			forceDownload = true;
		}

		try {
			if (forceDownload || !fs.existsSync(path)) {
				const res = await fetch(`https://beatconnect.io/b/${dbBeatmap.beatmapsetId}`);

				await new Promise((resolve, reject) => {
					const fileStream = fs.createWriteStream(`./mapsets/${dbBeatmap.beatmapsetId}.osr`);
					res.body.pipe(fileStream);
					res.body.on('error', (err) => {
						reject(err);
					});
					fileStream.on('finish', function () {
						resolve();
					});
				});
			}
		} catch (err) {
			console.error(err);
			return;
		}

		return dbBeatmap.beatmapsetId;
	},
	async multiToBanchoScore(inputScore, client) {
		let date = new Date(inputScore.gameStartDate);
		let outputScore = {
			score: inputScore.score,
			user: {
				name: null,
				id: inputScore.osuUserId
			},
			beatmapId: inputScore.beatmapId,
			counts: {
				'50': inputScore.count50,
				'100': inputScore.count100,
				'300': inputScore.count300,
				geki: inputScore.countGeki,
				katu: inputScore.countKatu,
				miss: inputScore.countMiss
			},
			maxCombo: inputScore.maxCombo,
			perfect: inputScore.perfect,
			raw_date: `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate()).toString().padStart(2, '0')} ${(date.getUTCHours()).toString().padStart(2, '0')}:${(date.getUTCMinutes()).toString().padStart(2, '0')}:${(date.getUTCSeconds()).toString().padStart(2, '0')}`,
			rank: inputScore.rank,
			pp: inputScore.pp,
			hasReplay: false,
			raw_mods: parseInt(inputScore.gameRawMods) + parseInt(inputScore.rawMods),
			beatmap: undefined,
			matchName: inputScore.matchName,
			mapRank: inputScore.mapRank,
			gameStartDate: inputScore.gameStartDate,
			createdAt: inputScore.createdAt,
		};

		try {
			if (!outputScore.pp && outputScore.maxCombo) {
				const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: outputScore.beatmapId, modBits: 0 });
				if (dbBeatmap) {
					let pp = await module.exports.getOsuPP(outputScore.beatmapId, inputScore.mode, outputScore.raw_mods, module.exports.getAccuracy(outputScore) * 100, parseInt(outputScore.counts.miss), parseInt(outputScore.maxCombo), client);

					try {
						await DBOsuMultiGameScores.update({ pp: pp }, { where: { id: inputScore.id } });
					} catch (e) {
						//Nothing
					}

					outputScore.pp = pp;
				}
			}
		} catch (e) {
			if (e.message !== 'Failed to parse beatmap: IO error  - caused by: The system cannot find the file specified. (os error 2)') {
				console.error(e.message);
				console.error(`Error calculating pp for beatmap ${outputScore.beatmapId}`, e);
			}
		}

		outputScore.rank = module.exports.calculateGrade(inputScore.mode, outputScore.counts, outputScore.raw_mods);

		return outputScore;
	},
	async cleanUpDuplicateEntries(client, manually) {
		const Sequelize = require('sequelize');
		// Automatically add missing players to the database
		let existingUsers = await DBDiscordUsers.findAll({
			attributes: ['osuUserId']
		});

		existingUsers = existingUsers.map(user => user.osuUserId);

		// Remove null values
		existingUsers = existingUsers.filter(user => user !== null);

		let missingUsers = await DBOsuMultiGameScores.findAll({
			attributes: ['osuUserId'],
			where: {
				osuUserId: {
					[Op.notIn]: existingUsers
				}
			},
			group: ['osuUserId']
		});

		missingUsers = missingUsers.map(user => user.osuUserId);

		if (missingUsers.length) {
			await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `${missingUsers.length} missing users found`);
		}

		let iterator = 0;
		while (iterator < 50 && missingUsers.length) {
			let randomIndex = Math.floor(Math.random() * missingUsers.length);
			await DBDiscordUsers.create({
				osuUserId: missingUsers[randomIndex]
			});

			missingUsers.splice(randomIndex, 1);
			iterator++;
		}

		if (iterator) {
			await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Created ${iterator} missing users`);
		}

		//Only clean up during the night
		let date = new Date();
		if (date.getUTCHours() > 6 && !manually) {
			return;
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, 'Getting most played maps and matches');
		let mostplayed = await DBOsuMultiGames.findAll({
			attributes: ['matchId', 'beatmapId', [Sequelize.fn('SUM', Sequelize.col('scores')), 'playcount']],
			where: {
				warmup: false,
				beatmapId: {
					[Op.gt]: 0,
				},
				tourneyMatch: true,
			},
			group: ['matchId', 'beatmapId'],
			order: [[Sequelize.fn('SUM', Sequelize.col('scores')), 'DESC']],
		});

		let matchIds = [...new Set(mostplayed.map(item => item.matchId))];

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Getting most played matchIds for matchMaking for ${matchIds.length} matches`);
		let matchMakingMatchData = await DBOsuMultiMatches.findAll({
			attributes: ['matchId'],
			where: {
				matchId: {
					[Op.in]: matchIds
				},
				acronym: {
					[Op.in]: matchMakingAcronyms
				},
			},
			group: ['matchId']
		});

		let matchMakingMatchIds = [...new Set(matchMakingMatchData.map(item => item.matchId))];

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Matchmaking matches: ${matchMakingMatchIds.length}`);

		// Get playcount for all matches that are not in matchMakingMatchIds
		mostplayed = await DBOsuMultiGames.findAll({
			attributes: ['beatmapId', [Sequelize.fn('SUM', Sequelize.col('scores')), 'playcount']],
			where: {
				warmup: false,
				beatmapId: {
					[Op.gt]: 0,
				},
				tourneyMatch: true,
				matchId: {
					[Op.notIn]: matchMakingMatchIds
				},
			},
			group: ['beatmapId'],
			order: [[Sequelize.fn('SUM', Sequelize.col('scores')), 'DESC']],
		});

		// Filter out maps that have less than 250 plays
		let popular = mostplayed.filter(map => map.dataValues.playcount > 250);
		popular = popular.map(map => map.beatmapId);

		// Update beatmap data
		let update = await DBOsuBeatmaps.update({
			popular: false
		}, {
			where: {
				beatmapId: {
					[Op.notIn]: popular
				},
				popular: {
					[Op.not]: false
				}
			},
			silent: true
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Marked ${update[0]} beatmaps as not popular again`);

		// Update beatmap data
		update = await DBOsuBeatmaps.update({
			popular: true
		}, {
			where: {
				beatmapId: {
					[Op.in]: popular
				},
				popular: {
					[Op.not]: true
				}
			},
			silent: true
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Marked ${update[0]} new beatmaps as popular`);

		// Filter out maps that have less than 100 plays
		let usedOften = mostplayed.filter(map => map.dataValues.playcount > 100);
		usedOften = usedOften.map(map => map.beatmapId);

		// Update beatmap data
		update = await DBOsuBeatmaps.update({
			usedOften: false
		}, {
			where: {
				beatmapId: {
					[Op.notIn]: usedOften
				},
				usedOften: {
					[Op.not]: false
				}
			},
			silent: true
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Marked ${update[0]} beatmaps as not used often again`);

		// Update beatmap data
		update = await DBOsuBeatmaps.update({
			usedOften: true
		}, {
			where: {
				beatmapId: {
					[Op.in]: usedOften
				},
				usedOften: {
					[Op.not]: true
				}
			},
			silent: true
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Marked ${update[0]} new beatmaps as used often`);

		if (date.getUTCHours() > 0 && !manually) {
			return await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, 'Finished cleanup');
		}

		// Remove duplicate discorduser entries
		let deleted = 0;

		let duplicates = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', [Sequelize.fn('COUNT', Sequelize.col('osuUserId')), 'amount']],
			where: {
				userId: {
					[Op.ne]: null
				},
				osuUserId: {
					[Op.ne]: null
				},
			},
			group: ['osuUserId'],
			order: [[Sequelize.fn('COUNT', Sequelize.col('osuUserId')), 'DESC']],
		});

		duplicates = duplicates.filter(user => user.dataValues.amount > 1);

		for (let i = 0; i < duplicates.length; i++) {
			let results = await DBDiscordUsers.findAll({
				attributes: ['id', 'userId', 'osuUserId', 'osuName', 'updatedAt'],
				where: {
					osuUserId: duplicates[i].osuUserId
				},
				order: [['userId', 'ASC'], ['osuVerified', 'ASC'], ['updatedAt', 'ASC']]
			});

			if (results.length > 1) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				await results[0].destroy();

				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`${results[0].userId}, ${results[0].osuUserId}, ${results[0].osuName}, ${results[0].updatedAt}\``);

				deleted++;
				i--;
			}
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate users (by osuUserId)`);

		deleted = 0;

		duplicates = await DBDiscordUsers.findAll({
			attributes: ['userId', [Sequelize.fn('COUNT', Sequelize.col('userId')), 'amount']],
			where: {
				userId: {
					[Op.ne]: null
				},
			},
			group: ['userId'],
			order: [[Sequelize.fn('COUNT', Sequelize.col('userId')), 'DESC']],
		});

		duplicates = duplicates.filter(user => user.dataValues.amount > 1);

		for (let i = 0; i < duplicates.length; i++) {
			let results = await DBDiscordUsers.findAll({
				attributes: ['id', 'userId', 'osuUserId', 'osuName', 'updatedAt'],
				where: {
					userId: duplicates[i].userId
				},
				order: [['osuVerified', 'ASC'], ['osuUserId', 'ASC'], ['updatedAt', 'ASC']]
			});

			if (results.length > 1) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				await results[0].destroy();

				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`${results[0].userId}, ${results[0].osuUserId}, ${results[0].osuName}, ${results[0].updatedAt}\``);

				deleted++;
				i--;
			}
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate users (by userId)`);

		// Remove entries over half a year old
		duplicates = true;
		deleted = 0;

		let dateLimit = new Date();
		dateLimit.setMonth(dateLimit.getMonth() - 6);

		deleted = await DBDuelRatingHistory.destroy({
			where: {
				updatedAt: {
					[Op.lt]: dateLimit
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} old duel rating histories`);

		duplicates = true;
		deleted = 0;
		let iterations = 0;

		const beatmaps = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'databases/beatmaps.sqlite',
			retry: {
				max: 15, // Maximum retry 15 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		while (duplicates && iterations < 100) {
			let result = await beatmaps.query(
				'SELECT id, beatmapId, mods, updatedAt FROM DBOsuBeatmaps WHERE 0 < (SELECT COUNT(1) FROM DBOsuBeatmaps as a WHERE a.beatmapId = DBOsuBeatmaps.beatmapId AND a.mods = DBOsuBeatmaps.mods AND a.id <> DBOsuBeatmaps.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Found ${result[0].length} duplicate beatmaps`);
				let beatmapIds = [];
				let deleteIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (beatmapIds.indexOf(`${result[0][i].beatmapId}-${result[0][i].mods}`) === -1) {
						beatmapIds.push(`${result[0][i].beatmapId}-${result[0][i].mods}`);

						deleteIds.push(result[0][i].id);

						deleted++;

						await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`# ${deleted} iteration ${iterations} beatmapId ${result[0][i].beatmapId} mods ${result[0][i].mods} updatedAt ${result[0][i].updatedAt}\``);
					}
				}

				try {
					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleting ${deleteIds.length} duplicate beatmaps`);

					await DBOsuBeatmaps.destroy({
						where: {
							id: {
								[Op.in]: deleteIds
							}
						}
					});

					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleteIds.length} duplicate beatmaps`);
				} catch (e) {
					console.error(e);
				}
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate beatmaps`);

		duplicates = true;
		deleted = 0;
		iterations = 0;

		const multiMatches = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'databases/multiMatches.sqlite',
			retry: {
				max: 15, // Maximum retry 15 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		while (duplicates && iterations < 100) {
			let result = await multiMatches.query(
				'SELECT id, matchId, updatedAt FROM DBOsuMultiMatches WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiMatches as a WHERE a.matchId = DBOsuMultiMatches.matchId AND a.id <> DBOsuMultiMatches.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Found ${result[0].length} duplicate matches`);
				let matchIds = [];
				let deleteIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (matchIds.indexOf(result[0][i].matchId) === -1) {
						matchIds.push(result[0][i].matchId);

						deleteIds.push(result[0][i].id);

						deleted++;

						await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`# ${deleted} iteration ${iterations} matchId ${result[0][i].matchId} updatedAt ${result[0][i].updatedAt}\``);
					}
				}

				try {
					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleting ${deleteIds.length} duplicate matches`);

					await DBOsuMultiMatches.destroy({
						where: {
							id: {
								[Op.in]: deleteIds
							}
						}
					});

					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleteIds.length} duplicate matches`);
				} catch (e) {
					console.error(e);
				}
			}

			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate matches`);

		duplicates = true;
		deleted = 0;
		iterations = 0;

		const multiGames = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'databases/multiGames.sqlite',
			retry: {
				max: 15, // Maximum retry 15 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		while (duplicates && iterations < 100) {
			let result = await multiGames.query(
				'SELECT id, matchId, gameId, updatedAt FROM DBOsuMultiGames WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiGames as a WHERE a.matchId = DBOsuMultiGames.matchId AND a.gameId = DBOsuMultiGames.gameId AND a.id <> DBOsuMultiGames.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Found ${result[0].length} duplicate games`);
				let gameIds = [];
				let deleteIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (gameIds.indexOf(result[0][i].gameId) === -1) {
						gameIds.push(result[0][i].gameId);

						deleteIds.push(result[0][i].id);

						deleted++;

						await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`# ${deleted} iteration ${iterations} matchId ${result[0][i].matchId} gameId ${result[0][i].gameId} updatedAt ${result[0][i].updatedAt}\``);
					}
				}

				try {
					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleting ${deleteIds.length} duplicate games`);

					await DBOsuMultiGames.destroy({
						where: {
							id: {
								[Op.in]: deleteIds
							}
						}
					});

					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleteIds.length} duplicate games`);
				} catch (e) {
					console.error(e);
				}
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate games`);

		duplicates = true;
		deleted = 0;
		iterations = 0;

		const multiGameScores = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'databases/multiGameScores.sqlite',
			retry: {
				max: 15, // Maximum retry 15 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		while (duplicates && iterations < 100) {
			let result = await multiGameScores.query(
				'SELECT id, matchId, gameId, osuUserId, updatedAt FROM DBOsuMultiGameScores WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiGameScores as a WHERE a.osuUserId = DBOsuMultiGameScores.osuUserId AND a.matchId = DBOsuMultiGameScores.matchId AND a.gameId = DBOsuMultiGameScores.gameId AND a.id <> DBOsuMultiGameScores.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Found ${result[0].length} duplicate scores`);
				let gameIds = [];
				let deleteIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (gameIds.indexOf(`${result[0][i].gameId}-${result[0][i].osuUserId}`) === -1) {
						gameIds.push(`${result[0][i].gameId}-${result[0][i].osuUserId}`);

						deleteIds.push(result[0][i].id);

						deleted++;

						await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `\`# ${deleted} iteration ${iterations} matchId ${result[0][i].matchId} gameId ${result[0][i].gameId} osuUserId ${result[0][i].osuUserId} updatedAt ${result[0][i].updatedAt}\``);
					}
				}

				try {
					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleting ${deleteIds.length} duplicate scores`);

					await DBOsuMultiGameScores.destroy({
						where: {
							id: {
								[Op.in]: deleteIds
							}
						}
					});

					await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleteIds.length} duplicate scores`);
				} catch (e) {
					console.error(e);
				}
			}

			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Cleaned up ${deleted} duplicate scores`);

		let beatmapsOtherModes = await DBOsuBeatmaps.findAll({
			attributes: ['beatmapId', 'mode'],
			where: {
				mode: {
					[Op.not]: 'Standard'
				}
			},
			group: ['beatmapId', 'mode'],
		});

		let taikoMaps = beatmapsOtherModes.filter(beatmap => beatmap.mode === 'Taiko');

		taikoMaps = taikoMaps.map(beatmap => beatmap.beatmapId);

		let updated = await DBOsuMultiGames.update({
			mode: 1,
		}, {
			where: {
				beatmapId: {
					[Op.in]: taikoMaps
				},
				mode: {
					[Op.not]: 1
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Taiko games that were in the wrong mode`);

		updated = await DBOsuMultiGameScores.update({
			mode: 1,
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: taikoMaps
				},
				mode: {
					[Op.not]: 1
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Taiko scores that were in the wrong mode`);

		let catchMaps = beatmapsOtherModes.filter(beatmap => beatmap.mode === 'Catch the Beat');

		catchMaps = catchMaps.map(beatmap => beatmap.beatmapId);

		updated = await DBOsuMultiGames.update({
			mode: 2,
		}, {
			where: {
				beatmapId: {
					[Op.in]: catchMaps
				},
				mode: {
					[Op.not]: 2
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Catch the Beat games that were in the wrong mode`);

		updated = await DBOsuMultiGameScores.update({
			mode: 2,
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: catchMaps
				},
				mode: {
					[Op.not]: 2
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Catch the Beat scores that were in the wrong mode`);

		let maniaMaps = beatmapsOtherModes.filter(beatmap => beatmap.mode === 'Mania');

		maniaMaps = maniaMaps.map(beatmap => beatmap.beatmapId);

		updated = await DBOsuMultiGames.update({
			mode: 3,
		}, {
			where: {
				beatmapId: {
					[Op.in]: maniaMaps
				},
				mode: {
					[Op.not]: 3
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Mania games that were in the wrong mode`);

		updated = await DBOsuMultiGameScores.update({
			mode: 3,
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: maniaMaps
				},
				mode: {
					[Op.not]: 3
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Updated ${updated[0]} Mania scores that were in the wrong mode`);

		// Reset unverified scores that were checked by Elitebotix
		let weeksAgo = new Date();
		weeksAgo.setDate(weeksAgo.getDate() - 58);

		updated = await DBOsuMultiMatches.update({
			verifiedBy: null,
		}, {
			where: {
				verifiedBy: '31050083', // Elitebotix
				verifiedAt: null,
				matchStartDate: {
					[Op.gte]: weeksAgo
				}
			},
			silent: true,
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Reset ${updated[0]} unverified scores that were checked by Elitebotix`);

		let matchesWithoutEndDate = await DBOsuMultiMatches.findAll({
			attributes: ['matchId'],
			where: {
				matchEndDate: null,
				tourneyMatch: true,
			},
		});

		updated = await DBOsuMultiGames.update({
			warmup: null,
		}, {
			where: {
				matchId: {
					[Op.in]: matchesWithoutEndDate.map(match => match.matchId)
				},
				warmup: {
					[Op.not]: null
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Reset ${updated[0]} games without matchEndDates warmup flag`);

		updated = await DBOsuMultiGameScores.update({
			warmup: null,
		}, {
			where: {
				matchId: {
					[Op.in]: matchesWithoutEndDate.map(match => match.matchId)
				},
				warmup: {
					[Op.not]: null
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Reset ${updated[0]} scores without matchEndDates warmup flag`);

		// Delete mappacks that are older than 4 weeks
		let weeksAgo4 = new Date();
		weeksAgo4.setDate(weeksAgo4.getDate() - 28);

		deleted = 0;

		fs.readdirSync('mappacks').forEach(async (file) => {
			let stats = fs.statSync(`mappacks/${file}`);
			if (stats.mtime < weeksAgo4) {
				fs.unlinkSync(`mappacks/${file}`);
				deleted++;

				await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted mappack ${file}`);
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleted} mappacks older than 4 weeks`);

		// Get all gameIds
		let gameIds = await DBOsuMultiGameScores.findAll({
			attributes: ['gameId'],
			group: ['gameId']
		});

		gameIds = [...new Set(gameIds.map(score => score.gameId))];

		// Delete all games that don't occur in the list
		deleted = await DBOsuMultiGames.destroy({
			where: {
				gameId: {
					[Op.notIn]: gameIds
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleted} games that don't have scores`);

		// Get all matchIds
		matchIds = await DBOsuMultiGames.findAll({
			attributes: ['matchId'],
			group: ['matchId']
		});

		matchIds = [...new Set(matchIds.map(game => game.matchId))];

		// Delete all matches that don't occur in the list
		deleted = await DBOsuMultiMatches.destroy({
			where: {
				matchId: {
					[Op.notIn]: matchIds
				}
			}
		});

		await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, `Deleted ${deleted} matches that don't have games`);

		return await module.exports.sendMessageToLogChannel(client, process.env.CLEANUPLOG, 'Finished cleanup');
	},
	wrongCluster(client, id) {
		let clusterAmount = client.totalShards;

		// console.log(clusterAmount, 'clusterAmount');

		// Allow cluster 0 if no id is provided
		if (!id && client.shardId === 0) {
			// console.log('Not wrong cluster because no Id and zero', clusterAmount, id);
			return false;
		}

		//Allow the modulo cluster to execute
		if (id && id.toString().substring(id.toString().length - 3) % clusterAmount === parseInt(client.shardId)) {
			// console.log('Not wrong cluster because of modulo', clusterAmount, id);
			return false;
		}

		// console.log('Wrong cluster', clusterAmount, id);

		// Else its the wrong cluster
		return true;
	},
	async getDerankStats(discordUser) {
		let ppDiscordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuPP', 'osuRank'],
			where: {
				osuUserId: {
					[Op.gt]: 0
				},
				osuPP: {
					[Op.gt]: 0
				},
				osuDuelStarRating: {
					[Op.gt]: 0
				},
				osuDuelProvisional: {
					[Op.not]: true,
				}
			},
			order: [
				['osuPP', 'DESC']
			]
		});

		ppDiscordUsers.sort((a, b) => parseFloat(b.osuPP) - parseFloat(a.osuPP));

		let duelDiscordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuDuelStarRating'],
			where: {
				osuUserId: {
					[Op.gt]: 0
				},
				osuPP: {
					[Op.gt]: 0
				},
				osuDuelStarRating: {
					[Op.gt]: 0
				},
				osuDuelProvisional: {
					[Op.not]: true,
				}
			},
			order: [
				['osuDuelStarRating', 'DESC']
			]
		});

		duelDiscordUsers.sort((a, b) => parseFloat(b.osuDuelStarRating) - parseFloat(a.osuDuelStarRating));

		//Get the user's position in the list
		let ppRank = null;

		for (let i = 0; i < ppDiscordUsers.length; i++) {
			if (Number(discordUser.osuPP) >= Number(ppDiscordUsers[i].osuPP)) {
				ppRank = i;
				break;
			}
		}

		if (ppRank === null) {
			ppRank = ppDiscordUsers.length - 1;
		}

		//Get the user's position in the list
		let duelRank = null;

		for (let i = 0; i < duelDiscordUsers.length; i++) {
			if (Number(discordUser.osuDuelStarRating).toFixed(4) >= Number(duelDiscordUsers[i].osuDuelStarRating).toFixed(4)) {
				duelRank = i;
				break;
			}
		}

		if (duelRank === null) {
			duelRank = duelDiscordUsers.length - 1;
		}

		//Get expected pp rank
		let expectedPpRank = Math.round(duelRank / duelDiscordUsers.length * ppDiscordUsers.length);

		let expectedPpRankPercentageDifference = Math.round((100 / ppDiscordUsers.length * ppRank - 100 / ppDiscordUsers.length * expectedPpRank) * 100) / 100;

		let expectedPpRankOsu = ppDiscordUsers[expectedPpRank].osuRank;

		try {
			return {
				ppRank: ppRank,
				ppUsersLength: ppDiscordUsers.length,
				duelRank: duelRank,
				duelUsersLength: duelDiscordUsers.length,
				expectedPpRank: expectedPpRank,
				expectedPpRankPercentageDifference: expectedPpRankPercentageDifference,
				expectedPpRankOsu: expectedPpRankOsu,
				expectedDuelRating: duelDiscordUsers[duelRank].osuDuelStarRating,
				expectedCurrentDuelRating: duelDiscordUsers[Math.min(ppRank, duelDiscordUsers.length - 1)].osuDuelStarRating
			};
		} catch (error) {
			console.error(duelDiscordUsers.length, ppRank, discordUser.osuUserId, discordUser.osuName);
			throw error;
		}
	},
	logMatchCreation(client, name, matchId) {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js log match creation to shards...');
		}

		client.shard.broadcastEval(async (c, { message }) => {
			let guildId = null;
			let channelId = null;
			if (process.env.SERVER === 'Dev') {
				guildId = '800641468321759242';
				channelId = '980119563381383228';
			} else if (process.env.SERVER === 'QA') {
				guildId = '800641367083974667';
				channelId = '980119465998037084';
			} else {
				guildId = '727407178499096597';
				channelId = '980119218047549470';
			}

			const guild = await c.guilds.cache.get(guildId);

			if (!guild || guild.shardId !== c.shardId) {
				return;
			}

			const channel = await guild.channels.cache.get(channelId);

			if (!channel) return;

			await channel.send(message);
		}, { context: { message: `https://osu.ppy.sh/mp/${matchId}` } });
	},
	async syncJiraCards(client) {
		if (module.exports.wrongCluster(client) || process.env.SERVER !== 'Live') {
			return;
		}

		let response = await fetch('https://eliteronix.atlassian.net/rest/api/2/search?jql=project=EL and updated>=-20m&maxResults=100', {
			method: 'GET',
			headers: {
				'Authorization': `Basic ${Buffer.from(
					`zimmermann.mariomarvin@gmail.com:${process.env.ATLASSIANTOKEN}`
				).toString('base64')}`,
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		})
			.catch(err => console.error(err));

		const responseJson = await response.json();

		let issues = responseJson.issues;

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js jira cards to shards...');
		}

		client.shard.broadcastEval(async (c, { issues }) => {

			const backlogChannel = await c.channels.cache.get('1000372560552276028');
			if (backlogChannel) {
				const selectedForDevChannel = await c.channels.cache.get('1000372600251351070');
				const inProgressChannel = await c.channels.cache.get('1000372630060281856');
				const doneChannel = await c.channels.cache.get('1000372653762285708');

				for (let i = 0; i < issues.length; i++) {
					let channel = backlogChannel;

					if (issues[i].fields.status.name === 'Selected for Development') {
						channel = selectedForDevChannel;
					} else if (issues[i].fields.status.name === 'In Progress') {
						channel = inProgressChannel;
					} else if (issues[i].fields.status.name === 'Done') {
						channel = doneChannel;
					}

					let color = '#000000';

					if (issues[i].fields.priority.name === 'Highest') {
						color = '#ff1500';
					} else if (issues[i].fields.priority.name === 'High') {
						color = '#f0655d';
					} else if (issues[i].fields.priority.name === 'Medium') {
						color = '#f59536';
					} else if (issues[i].fields.priority.name === 'Low') {
						color = '#0ecf00';
					}

					let updatedDate = new Date(issues[i].fields.updated);

					//Create embed
					const Discord = require('discord.js');
					const issueEmbed = new Discord.EmbedBuilder()
						.setColor(color)
						.setTitle(issues[i].fields.summary)
						.setFooter({ text: `Last updated: ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')} ${updatedDate.getUTCDate().toString().padStart(2, '0')}.${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${updatedDate.getUTCFullYear()}` });

					if (issues[i].fields.assignee) {
						issueEmbed.setAuthor({ name: `Assigned to: ${issues[i].fields.assignee.displayName}`, iconURL: issues[i].fields.assignee.avatarUrls['48x48'] });
					}

					if (issues[i].fields.parent) {
						issueEmbed.addFields([{ name: 'Parent', value: `${issues[i].fields.parent.key} - ${issues[i].fields.parent.fields.summary}` }]);
					}

					await backlogChannel.messages.fetch({ limit: 100 })
						.then(async (messages) => {
							const issueMessages = messages.filter(m => m.content === issues[i].key);
							issueMessages.forEach(async (message) => {
								await message.delete();
							});
						});

					await selectedForDevChannel.messages.fetch({ limit: 100 })
						.then(async (messages) => {
							const issueMessages = messages.filter(m => m.content === issues[i].key);
							issueMessages.forEach(async (message) => {
								await message.delete();
							});
						});

					await inProgressChannel.messages.fetch({ limit: 100 })
						.then(async (messages) => {
							const issueMessages = messages.filter(m => m.content === issues[i].key);
							issueMessages.forEach(async (message) => {
								await message.delete();
							});
						});

					await doneChannel.messages.fetch({ limit: 100 })
						.then(async (messages) => {
							const issueMessages = messages.filter(m => m.content === issues[i].key);
							issueMessages.forEach(async (message) => {
								await message.delete();
							});
						});

					await channel.send({ content: issues[i].key, embeds: [issueEmbed] });
				}
			}
		}, { context: { issues: issues } });
	},
	async getOsuPlayerName(osuUserId) {
		let playerName = osuUserId;

		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuName'],
			where: {
				osuUserId: osuUserId
			}
		});

		if (discordUser) {
			playerName = discordUser.osuName;
		} else {
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				module.exports.logOsuAPICalls('utils.js getOsuPlayerName');
				const osuUser = await osuApi.getUser({ u: osuUserId });
				if (osuUser) {
					playerName = osuUser.name;

					await DBDiscordUsers.create({ osuUserId: osuUserId, osuName: osuUser.name });
				}
			} catch (err) {
				//Nothing
			}
		}

		return playerName;
	},
	calculateGrade(mode, counts, modBits) {
		if (mode === 0) {
			let grade = 'D';

			let count300Rate = parseInt(counts['300']) / (parseInt(counts['300']) + parseInt(counts['100']) + parseInt(counts['50']) + parseInt(counts.miss));
			let count50Rate = parseInt(counts['50']) / (parseInt(counts['300']) + parseInt(counts['100']) + parseInt(counts['50']) + parseInt(counts.miss));

			if (count300Rate === 1) {
				grade = 'X';
			} else if (count300Rate > 0.9 && count50Rate <= 0.01 && parseInt(counts.miss) === 0) {
				grade = 'S';
			} else if (count300Rate > 0.9 || count300Rate > 0.8 && parseInt(counts.miss) === 0) {
				grade = 'A';
			} else if (count300Rate > 0.8 || count300Rate > 0.7 && parseInt(counts.miss) === 0) {
				grade = 'B';
			} else if (count300Rate > 0.6) {
				grade = 'C';
			}

			if (grade === 'X' || grade === 'S') {
				if (module.exports.getMods(modBits).includes('HD') || module.exports.getMods(modBits).includes('FL')) {
					grade = grade + 'H';
				}
			}

			return grade;
		} else if (mode === 1) {
			let grade = 'D';

			let count300Rate = parseInt(counts['300']) / (parseInt(counts['300']) + parseInt(counts['100']) + parseInt(counts['50']) + parseInt(counts.miss));

			if (count300Rate === 1) {
				grade = 'X';
			} else if (count300Rate > 0.9 && parseInt(counts.miss) === 0) {
				grade = 'S';
			} else if (count300Rate > 0.9 || count300Rate > 0.8 && parseInt(counts.miss) === 0) {
				grade = 'A';
			} else if (count300Rate > 0.8 || count300Rate > 0.7 && parseInt(counts.miss) === 0) {
				grade = 'B';
			} else if (count300Rate > 0.6) {
				grade = 'C';
			}

			if (grade === 'X' || grade === 'S') {
				if (module.exports.getMods(modBits).includes('HD') || module.exports.getMods(modBits).includes('FL')) {
					grade = grade + 'H';
				}
			}

			return grade;
		} else if (mode === 2) {
			let grade = 'D';

			let accuracy = module.exports.getAccuracy({ counts: counts }, 2);

			if (accuracy === 1) {
				grade = 'X';
			} else if (accuracy > 0.98) {
				grade = 'S';
			} else if (accuracy > 0.94) {
				grade = 'A';
			} else if (accuracy > 0.90) {
				grade = 'B';
			} else if (accuracy > 0.85) {
				grade = 'C';
			}

			if (grade === 'X' || grade === 'S') {
				if (module.exports.getMods(modBits).includes('HD') || module.exports.getMods(modBits).includes('FL')) {
					grade = grade + 'H';
				}
			}

			return grade;
		} else if (mode === 3) {
			let grade = 'D';

			let accuracy = module.exports.getAccuracy({ counts: counts }, 3);

			if (accuracy === 1) {
				grade = 'X';
			} else if (accuracy > 0.95) {
				grade = 'S';
			} else if (accuracy > 0.90) {
				grade = 'A';
			} else if (accuracy > 0.80) {
				grade = 'B';
			} else if (accuracy > 0.70) {
				grade = 'C';
			}

			if (grade === 'X' || grade === 'S') {
				if (module.exports.getMods(modBits).includes('HD') || module.exports.getMods(modBits).includes('FL')) {
					grade = grade + 'H';
				}
			}

			return grade;
		} else {
			return 'D';
		}
	},
	async updateQueueChannels(client) {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js updateQueueChannels to shards...');
		}

		// eslint-disable-next-line no-empty-pattern
		client.shard.broadcastEval(async (c, { }) => {
			try {
				let voiceChannelId = '1010093794714189865';
				let textChannelId = '1045505232576184470';
				if (process.env.SERVER === 'Dev') {
					voiceChannelId = '1010092736155762818';
					textChannelId = '1045483219555983381';
				}

				let textChannel = await c.channels.cache.get(textChannelId);
				if (textChannel && textChannel.guildId) {
					const { DBProcessQueue, DBDiscordUsers } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
					const { getOsuPlayerName } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

					let existingQueueTasks = await DBProcessQueue.findAll({
						attributes: ['id', 'additions', 'createdAt'],
						where: {
							task: 'duelQueue1v1',
						},
					});

					let voiceChannel = await c.channels.cache.get(voiceChannelId);

					let multipleString = 's';
					let verb = 'are';
					if (existingQueueTasks.length === 1) {
						multipleString = '';
						verb = 'is';
					}

					voiceChannel.edit({ name: `1v1 queue | ${existingQueueTasks.length} user${multipleString}` });

					// Get all messages and delete
					let messages = await textChannel.messages.fetch({ limit: 100 });

					try {
						await textChannel.bulkDelete(messages);
					} catch (error) {
						if (error.message !== 'Unknown Message') {
							throw error;
						}
					}

					// Send new message
					let players = [];

					for (let i = 0; i < existingQueueTasks.length; i++) {
						let oneDayAgo = new Date();
						oneDayAgo.setDate(oneDayAgo.getDate() - 1);

						let args = existingQueueTasks[i].additions.split(';');

						let currentUser = args[0];

						if (existingQueueTasks[i].createdAt < oneDayAgo) {
							existingQueueTasks[i].destroy();

							let discordUser = await DBDiscordUsers.findOne({
								attributes: 'userId',
								where: {
									osuUserId: currentUser
								}
							});

							// Message the user
							if (discordUser) {
								let user = await c.users.fetch(discordUser.userId);

								await user.send('It seems like there is no fitting opponent in the queue at the moment and you have been removed from the queue for now. Feel free to requeue at any time.');
							}

							continue;
						}

						let playername = await getOsuPlayerName(currentUser);
						let starRating = parseFloat(args[1]);

						players.push({ text: `${playername} - ${starRating.toFixed(2)}* <t:${Date.parse(existingQueueTasks[i].createdAt) / 1000}:R>`, starRating: starRating });
					}

					players.sort((a, b) => {
						return b.starRating - a.starRating;
					});

					players.reverse();

					players = players.map(player => player.text);

					await textChannel.send(`There ${verb} currently ${existingQueueTasks.length} user${multipleString} in the 1v1 queue!\nRead <#1042938217684541551> for more information.\n\n${players.join('\n')}`);
				}
			} catch (error) {
				console.error('Error in updateQueueChannels utils.js', error);
			}
		}, { context: {} });
	},
	async updateCurrentMatchesChannel(client) {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js updateCurrentMatchesChannel to shards...');
		}

		// eslint-disable-next-line no-empty-pattern
		client.shard.broadcastEval(async (c, { }) => {
			let textChannelId = '1089269685259866242';
			if (process.env.SERVER === 'Dev') {
				textChannelId = '1089272362869985390';
			}

			let textChannel = await c.channels.cache.get(textChannelId);
			if (!textChannel || !textChannel.guildId) {
				return;
			}

			const { DBProcessQueue } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
			const { getOsuPlayerName } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			let existingQueueTasks = await DBProcessQueue.findAll({
				attributes: ['additions', 'createdAt'],
				where: {
					task: 'importMatch',
				},
			});

			let matches = [];

			for (let i = 0; i < existingQueueTasks.length; i++) {
				let args = existingQueueTasks[i].additions.split(';');

				let tourneyMatch = parseInt(args[1]);

				if (tourneyMatch === 0) {
					existingQueueTasks.splice(i, 1);
					i--;
					continue;
				}

				let matchId = args[0];

				let matchCreation = args[2];

				let matchName = args[3];

				if (!matchName) {
					existingQueueTasks.splice(i, 1);
					i--;
					continue;
				}

				let players = '';

				if (args[4]) {
					players = args[4].split(',');

					for (let j = 0; j < players.length; j++) {
						let playerName = await getOsuPlayerName(players[j]);

						if (playerName) {
							players[j] = `[${playerName}](<https://osu.ppy.sh/users/${players[j]}>)`;
						} else {
							players[j] = `[${players[j]}](<https://osu.ppy.sh/users/${players[j]}>)`;
						}
					}

					players = ` - Players: ${players.join(', ')}`;
				}

				if (matchName.toLowerCase().includes('qualifiers')) {
					matchId = 'XXXXXXXXX';
				}

				matches.push({
					content: `<t:${matchCreation / 1000}:R> - [${matchName}](<https://osu.ppy.sh/mp/${matchId}>)${players}`,
					start: `<t:${matchCreation / 1000}:R> - [${matchName}](<https://osu.ppy.sh/mp/${matchId}>)`,
				});
			}

			// Get all messages and delete those that arent in the matchMessageStarts array
			let messages = await textChannel.messages.fetch({ limit: 100 });

			let messagesToDelete = messages.filter(message => !matches.map(match => match.start.toLowerCase()).includes(message.content.replace(/:R>.+/gm, ':R>').toLowerCase()));

			messagesToDelete.forEach(async (message) => {
				try {
					await message.delete();
				} catch (error) {
					if (error.message !== 'Unknown Message') {
						console.error('Error deleting message in updateCurrentMatchesChannel utils.js', error);
					}
				}
			});

			// Send new messages if there are any missing
			if (matches.length > 0) {
				for (let i = 0; i < matches.length; i++) {
					if (!messages.map(message => message.content.replace(/:R>.+/gm, ':R>').toLowerCase()).includes(matches[i].start.toLowerCase())) {
						await textChannel.send({ content: matches[i].content, allowedMentions: { 'users': [] } });
					} else {
						let message = messages.find(m => m.content.replace(/:R>.+/gm, ':R>').toLowerCase() === matches[i].start.toLowerCase());
						if (message && message.content !== matches[i].content) {
							try {
								await message.edit(matches[i].content);
							} catch (error) {
								if (error.message !== 'Unknown Message') {
									console.error('Error editing message in updateCurrentMatchesChannel utils.js', error);
								}
							}
						}
					}
				}
			} else {
				await textChannel.send('There are currently no matches in progress!');
			}
		}, { context: {} });
	},
	async createNewForumPostRecords(client) {
		await module.exports.awaitWebRequestPermission('https://osu.ppy.sh/community/forums/55', client);
		await fetch('https://osu.ppy.sh/community/forums/55')
			.then(async (res) => {
				let htmlCode = await res.text();
				htmlCode = htmlCode.replace(/&quot;/gm, '"');
				const topicRegex = /https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/\d+/gm;
				const topicMatches = htmlCode.match(topicRegex);

				let uniqueTopics = [];
				for (let i = 0; i < topicMatches.length; i++) {
					if (!uniqueTopics.includes(topicMatches[i])) {
						uniqueTopics.push(topicMatches[i]);
					}
				}

				for (let i = 0; i < uniqueTopics.length; i++) {
					let existingForumPost = await DBOsuForumPosts.count({
						where: {
							forumPost: uniqueTopics[i]
						}
					});

					if (existingForumPost) {
						continue;
					}

					await new Promise(resolve => setTimeout(resolve, 60000));
					await fetch(uniqueTopics[i] + '?n=1')
						.then(async (topicRes) => {
							let topicHtmlCode = await topicRes.text();
							topicHtmlCode = topicHtmlCode.replace(/&quot;/gm, '"');

							const hostRegex = /data-post-username=".+"/gm;
							const hostMatch = topicHtmlCode.match(hostRegex);

							let host = null;
							if (hostMatch.length) {
								host = hostMatch[0].replace('data-post-username="', '').replace('"', '');
							}

							const postedRegex = /<time class='js-timeago' datetime='.+'>.+<\/time>/gm;
							const postedMatch = topicHtmlCode.match(postedRegex);

							let posted = null;
							if (postedMatch.length) {
								posted = postedMatch[0].replace(/<\/time>/gm, '').replace(/<time class='js-timeago' datetime='.+'>/gm, '');
								posted = new Date(posted);
							}

							const titleRegex = /<h1 class="forum-topic-title__title forum-topic-title__title--display">\n.+/gm;
							const titleMatch = titleRegex.exec(topicHtmlCode);

							let title = null;
							let format = null;
							let rankRange = null;
							let gamemode = null;
							let notes = null;
							if (titleMatch) {
								title = titleMatch[0].replace('<h1 class="forum-topic-title__title forum-topic-title__title--display">\n', '').replace('&#039;', '\'').replace('&amp;', '&').trim();

								const formatRegex = /\dv\d/gm;
								const formatMatch = title.match(formatRegex);

								if (formatMatch) {
									format = formatMatch[0];
								}

								const rankRangeRegex = /\d*[,.]?\d+k?\s?-\s?\d*k?∞?[,.]?\d*/gm;
								const rankRangeMatch = title.toLowerCase().replace('infinity', '∞').replace(/#/gm, '').match(rankRangeRegex);

								if (rankRangeMatch) {
									rankRange = rankRangeMatch.join(' | ');
								}

								if (rankRange === null && title.toLowerCase().includes('open rank')) {
									rankRange = 'Open Rank';
								}

								if (title.toLowerCase().includes('std')) {
									gamemode = 'Standard';
								} else if (title.toLowerCase().includes('taiko')) {
									gamemode = 'Taiko';
								} else if (title.toLowerCase().includes('ctb') || title.toLowerCase().includes('catch')) {
									gamemode = 'Catch the Beat';
								} else if (title.toLowerCase().includes('mania')) {
									gamemode = 'Mania';
								}
							}

							const bbCodeRegex = /<div class='bbcode'>.+/gm;
							const bbCodeMatch = bbCodeRegex.exec(topicHtmlCode);

							let body = null;
							let discord = null;
							if (bbCodeMatch) {
								body = bbCodeMatch[0].replace('<div class=\'bbcode\'>', '').substring(0, bbCodeMatch[0].length - '</div>'.length);

								const discordRegex = /https:\/\/discord\.gg\/\w+/gm;
								let discordMatches = body.match(discordRegex);

								if (discordMatches) {
									discord = discordMatches[0];
								}
							}

							if (title.includes('SMST') && host === 'Sinaeb') {
								format = '1v1';
							} else if (title.includes('Rapid Monthly osu! Tournament') && host === 'Redavor') {
								format = '1v1';
								rankRange = '28k-72k';
								gamemode = 'Standard';
								notes = 'The matches are played in Scorev1';
							}

							await DBOsuForumPosts.create({
								forumPost: uniqueTopics[i],
								discord: discord,
								host: host,
								title: title,
								format: format,
								rankRange: rankRange,
								gamemode: gamemode,
								region: 'International',
								posted: posted,
								notes: notes,
							});

							await module.exports.sendMessageToLogChannel(client, process.env.TOURNAMENTPOSTSLOG, `There is a new tournament post: ${uniqueTopics[i]}`);
						});
				}
			});
	},
	async getValidTournamentBeatmap(input) {
		//Set the mode
		let mode = 'Standard';

		//Get the mode from the input
		if (input.mode) {
			mode = input.mode;
		}

		//Set to a random modPool by default
		let modPool = ['NM', 'HD', 'HR', 'DT', 'FM'][Math.floor(Math.random() * 5)];

		//Get the modPool from the input
		if (input.modPool) {
			modPool = input.modPool;
		}

		//Set the difficulty range
		let lowerBound = 3.5;
		let upperBound = 10;

		if (input.lowerBound) {
			lowerBound = input.lowerBound;
		}

		if (input.upperBound) {
			upperBound = input.upperBound;
		}

		//Set the length
		let lowerDrain = 0;
		let upperDrain = 600;

		if (input.lowerDrain) {
			lowerDrain = input.lowerDrain;
		}

		if (input.upperDrain) {
			upperDrain = input.upperDrain;
		}

		//Set the approach Rate
		let lowerApproach = 0;
		let upperApproach = 11;

		if (input.lowerApproach) {
			lowerApproach = input.lowerApproach;
		}

		if (input.upperApproach) {
			upperApproach = input.upperApproach;
		}

		//Set the circle size
		let lowerCircleSize = 0;
		let upperCircleSize = 10;

		if (input.lowerCircleSize) {
			lowerCircleSize = input.lowerCircleSize;
		}

		if (input.upperCircleSize) {
			upperCircleSize = input.upperCircleSize;
		}

		//Set the maps to avoid
		let avoidMaps = [];

		if (input.avoidMaps) {
			avoidMaps = input.avoidMaps;
		}

		let finalAvoidList = [];
		for (let i = 0; i < avoidMaps.length; i++) {
			if (!finalAvoidList.includes(avoidMaps[i])) {
				finalAvoidList.push(avoidMaps[i]);
			}
		}

		if (!input.alreadyCheckedSR) {
			input.alreadyCheckedSR = [];
		}

		if (!input.alreadyCheckedOther) {
			input.alreadyCheckedOther = [];
		}

		for (let i = 0; i < input.alreadyCheckedSR.length; i++) {
			if (!finalAvoidList.includes(input.alreadyCheckedSR[i])) {
				finalAvoidList.push(input.alreadyCheckedSR[i]);
			}
		}

		for (let i = 0; i < input.alreadyCheckedOther.length; i++) {
			if (!finalAvoidList.includes(input.alreadyCheckedOther[i])) {
				finalAvoidList.push(input.alreadyCheckedOther[i]);
			}
		}

		// if (modPool === 'HR') {
		// 	console.log('avoidMaps', avoidMaps.length, 'finalAvoidList', finalAvoidList.length);
		// }

		//Set if it should only be ranked maps
		let rankedStatus = ['Ranked', 'Approved', 'Qualified', 'Loved', 'Pending', 'Graveyard', 'WIP'];

		if (input.onlyRanked) {
			rankedStatus = ['Ranked', 'Approved'];
		}

		const beatmapAttributes = [
			'id',
			'artist',
			'title',
			'difficulty',
			'beatmapId',
			'beatmapsetId',
			'mods',
			'starRating',
			'approvalStatus',
			'popular',
			'approachRate',
			'circleSize',
			'overallDifficulty',
			'updatedAt',
			'maxCombo',
			'drainLength',
			'totalLength',
			'bpm',
		];

		const where = {
			mode: mode,
			usedOften: true,
			approvalStatus: {
				[Op.in]: rankedStatus,
			},
			starRating: {
				[Op.and]: {
					[Op.gte]: lowerBound,
					[Op.lte]: upperBound,
				}
			},
			circleSize: {
				[Op.and]: {
					[Op.gte]: lowerCircleSize,
					[Op.lte]: upperCircleSize,
				}
			},
			approachRate: {
				[Op.and]: {
					[Op.gte]: lowerApproach,
					[Op.lte]: upperApproach,
				}
			},
			drainLength: {
				[Op.and]: {
					[Op.gte]: lowerDrain,
					[Op.lte]: upperDrain,
				}
			},
			beatmapId: {
				[Op.notIn]: finalAvoidList,
			},
			notDownloadable: {
				[Op.not]: true,
			},
			audioUnavailable: {
				[Op.not]: true,
			},
		};

		if (input.upperBound - input.lowerBound > 2) {
			delete where.usedOften;
		}

		let beatmaps = null;
		if (modPool === 'NM') {
			where.noModMap = true;
			where.mods = 0;
		} else if (modPool === 'HD') {
			where.hiddenMap = true;
			where.mods = 0;

			let HDLowerBound = lowerBound - 0.8;
			let HDUpperBound = upperBound - 0.1;

			where.starRating = {
				[Op.and]: {
					[Op.gte]: HDLowerBound,
					[Op.lte]: HDUpperBound,
				}
			};
		} else if (modPool === 'HR') {
			where.hardRockMap = true;
			where.mods = 16;
		} else if (modPool === 'DT') {
			where.doubleTimeMap = true;
			where.mods = 64;
		} else if (modPool === 'FM') {
			where.freeModMap = true;
			where.mods = 0;
		}

		beatmaps = await DBOsuBeatmaps.findAll({
			attributes: beatmapAttributes,
			where: where,
			limit: 2500,
		});

		// if (modPool === 'HR') {
		// 	console.log('Found', beatmaps.length, 'maps');
		// }

		if (beatmaps.length === 0) {
			input.alreadyCheckedSR = [];
			input.lowerBound = lowerBound - 0.25;
			if (input.lowerBound < 3.5) {
				input.lowerBound = 3.5;
			}
			input.upperBound = upperBound + 0.25;
			if (input.upperBound > 9.9) {
				input.upperBound = 9.9;
			}
			// if (modPool === 'HR') {
			// console.log('Increased SR range to', input.lowerBound, '-', input.upperBound);
			// }
		}

		//Loop through the beatmaps until a fitting one is found
		while (beatmaps.length) {
			const index = Math.floor(Math.random() * beatmaps.length);
			let randomBeatmap = beatmaps[index];

			if (!randomBeatmap) {
				beatmaps.splice(index, 1);
				continue;
			}

			input.alreadyCheckedSR.push(randomBeatmap.beatmapId);

			let beatmapId = randomBeatmap.beatmapId;

			// refresh the map
			if (modPool == 'NM') {
				randomBeatmap = await module.exports.getOsuBeatmap({ beatmap: randomBeatmap, beatmapId: randomBeatmap.beatmapId, modBits: 0 });

				randomBeatmap.starRating = module.exports.adjustStarRating(randomBeatmap.starRating, randomBeatmap.approachRate, randomBeatmap.circleSize, 0);
			} else if (modPool == 'HD') {
				randomBeatmap = await module.exports.getOsuBeatmap({ beatmap: randomBeatmap, beatmapId: randomBeatmap.beatmapId, modBits: 8 });

				if (!randomBeatmap) {
					beatmaps.splice(index, 1);
					continue;
				}

				randomBeatmap.starRating = module.exports.adjustStarRating(randomBeatmap.starRating, randomBeatmap.approachRate, randomBeatmap.circleSize, 8);
			} else if (modPool == 'HR') {
				randomBeatmap = await module.exports.getOsuBeatmap({ beatmap: randomBeatmap, beatmapId: randomBeatmap.beatmapId, modBits: 16 });

				randomBeatmap.starRating = module.exports.adjustStarRating(randomBeatmap.starRating, randomBeatmap.approachRate, randomBeatmap.circleSize, 16);
			} else if (modPool == 'DT') {
				randomBeatmap = await module.exports.getOsuBeatmap({ beatmap: randomBeatmap, beatmapId: randomBeatmap.beatmapId, modBits: 64 });

				randomBeatmap.starRating = module.exports.adjustStarRating(randomBeatmap.starRating, randomBeatmap.approachRate, randomBeatmap.circleSize, 64);
			} else if (modPool == 'FM') {
				randomBeatmap = await module.exports.getOsuBeatmap({ beatmap: randomBeatmap, beatmapId: randomBeatmap.beatmapId, modBits: 0 });

				if (!randomBeatmap) {
					beatmaps.splice(index, 1);
					continue;
				}

				let HDStarRating = module.exports.adjustStarRating(randomBeatmap.starRating, randomBeatmap.approachRate, randomBeatmap.circleSize, 8);
				let randomBeatmapHR = await module.exports.getOsuBeatmap({ beatmapId: randomBeatmap.beatmapId, modBits: 16 });

				if (!randomBeatmapHR) {
					beatmaps.splice(index, 1);
					continue;
				}

				randomBeatmapHR.starRating = module.exports.adjustStarRating(randomBeatmapHR.starRating, randomBeatmapHR.approachRate, randomBeatmapHR.circleSize, 16);

				randomBeatmap.starRating = (HDStarRating + randomBeatmapHR.starRating) / 2;
			}

			if (!randomBeatmap) {
				beatmaps.splice(index, 1);
				// console.log('Map Selection: Not available');
				input.alreadyCheckedOther.push(beatmapId);
				continue;
			}

			//Check drain length
			if (randomBeatmap.drainLength > upperDrain || randomBeatmap.drainLength < lowerDrain) {
				beatmaps.splice(index, 1);
				// if (modPool === 'HR') {
				// 	console.log('Map Selection: Drain length out of bounds', randomBeatmap.drainLength, lowerDrain, upperDrain);
				// }
				input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
				continue;
			}

			//Check the approach rate
			if (randomBeatmap.approachRate > upperApproach || randomBeatmap.approachRate < lowerApproach) {
				beatmaps.splice(index, 1);
				// if (modPool === 'HR') {
				// 	console.log('Map Selection: Approach rate out of bounds', randomBeatmap.approachRate, lowerApproach, upperApproach);
				// }
				input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
				continue;
			}

			//Check the circle size
			if (randomBeatmap.circleSize > upperCircleSize || randomBeatmap.circleSize < lowerCircleSize) {
				beatmaps.splice(index, 1);
				// if (modPool === 'HR') {
				// 	console.log('Map Selection: Circle size out of bounds', randomBeatmap.circleSize, lowerCircleSize, upperCircleSize);
				// }
				// console.log('Map Selection: Circle size out of bounds');
				input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
				continue;
			}

			//Check star rating
			if (randomBeatmap.starRating > upperBound || randomBeatmap.starRating < lowerBound) {
				beatmaps.splice(index, 1);
				// console.log('Map Selection: Star rating out of bounds', randomBeatmap.starRating);
				// if (modPool === 'HR') {
				// 	console.log('Map Selection: Star rating out of bounds', randomBeatmap.starRating, lowerBound, upperBound);
				// }
				input.alreadyCheckedSR.push(randomBeatmap.beatmapId);
				continue;
			}

			//Deep clone beatmap, use proper library if you ever need dates or functions of the beatmap or just refetch from the database
			let clone = JSON.parse(JSON.stringify(randomBeatmap));
			beatmaps = null;
			return clone;
		}

		// if (modPool === 'HR') {
		// 	console.log('Map Selection: None found - Going again');
		// }
		return await module.exports.getValidTournamentBeatmap(input);
	},
	async processOsuTrack(client) {
		let now = new Date();

		let osuTracker = await DBOsuTrackingUsers.findOne({
			attributes: ['id', 'osuUserId', 'nextCheck', 'updatedAt', 'minutesBetweenChecks'],
			where: {
				nextCheck: {
					[Op.lte]: now,
				},
			},
			order: [
				['nextCheck', 'ASC'],
			],
		});

		let osuTrackQueueLength = await DBOsuTrackingUsers.count({
			where: {
				nextCheck: {
					[Op.lte]: now,
				},
			},
		});

		process.send(`osuTrackQueue ${osuTrackQueueLength}`);

		if (osuTracker) {
			let osuUser = { osuUserId: osuTracker.osuUserId };

			// console.log(`Processing osu! track for ${osuTracker.osuUserId}...`);

			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting utils.js osu! track activity to shards...');
			}

			let recentActivities = client.shard.broadcastEval(async (c, { osuUser, lastUpdated }) => {
				try {
					const osu = require('node-osu');
					const { Op } = require('sequelize');
					const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
					const { DBOsuGuildTrackers, DBOsuMultiGameScores, DBOsuMultiMatches } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
					const { getOsuPlayerName, multiToBanchoScore, logOsuAPICalls } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					let recentActivity = false;

					let guildTrackers = await DBOsuGuildTrackers.findAll({
						attributes: [
							'id',
							'guildId',
							'channelId',
							'osuUserId',
							'medals',
							'osuLeaderboard',
							'taikoLeaderboard',
							'catchLeaderboard',
							'maniaLeaderboard',
							'osuTopPlays',
							'taikoTopPlays',
							'catchTopPlays',
							'maniaTopPlays',
							'tournamentTopPlays',
							'showAmeobeaUpdates',
							'osuAmeobea',
							'taikoAmeobea',
							'catchAmeobea',
							'maniaAmeobea',
						],
						where: {
							osuUserId: osuUser.osuUserId,
						},
					});

					for (let i = 0; i < guildTrackers.length; i++) {
						try {
							//Fetch the guild
							guildTrackers[i].guild = await c.guilds.cache.get(guildTrackers[i].guildId);

							if (!guildTrackers[i].guild || guildTrackers[i].guild.shardId !== c.shardId) {
								continue;
							}

							//Fetch the channel
							guildTrackers[i].channel = await guildTrackers[i].guild.channels.cache.get(guildTrackers[i].channelId);

							if (!guildTrackers[i].channel) {
								guildTrackers[i].channel = await guildTrackers[i].guild.channels.fetch(guildTrackers[i].channelId);
							}
						} catch (err) {
							if (err.message === 'Missing Access' || err.message === 'Unknown Channel') {
								await guildTrackers[i].destroy();
								continue;
							}

							console.error('Error fetching channel for osu-track', err);
							continue;
						}

						if (guildTrackers[i].medals || guildTrackers[i].osuLeaderboard || guildTrackers[i].taikoLeaderboard || guildTrackers[i].catchLeaderboard || guildTrackers[i].maniaLeaderboard) {
							if (!osuUser.osuUser) {
								// console.log(`Grabbing osu! user for ${osuUser.osuUserId}...`);
								try {
									logOsuAPICalls('utils.js processOsuTrack getUser');
									let osuUserResult = await osuApi.getUser({ u: osuUser.osuUserId });
									osuUser.osuUser = osuUserResult;
								} catch (err) {
									if (err.message === 'Not found') {
										await guildTrackers[i].channel.send(`Could not find user \`${osuUser.osuUserId}\` anymore and I will therefore stop tracking them.`);
										await guildTrackers[i].destroy();
										guildTrackers.splice(i, 1);
										i--;
										continue;
									} else {
										console.error(`Grabbing osu! user for ${osuUser.osuUserId}...`, err);
										await new Promise(resolve => setTimeout(resolve, 60000));
										i--;
										continue;
									}
								}
							}

							//Grab recent events and send it in
							if (osuUser.osuUser.events.length > 0) {
								for (let j = 0; j < osuUser.osuUser.events.length; j++) {
									//Remove older scores on the map to avoid duplicates if its a score
									if (osuUser.osuUser.events[j].beatmapId) {
										for (let k = j + 1; k < osuUser.osuUser.events.length; k++) {
											if (osuUser.osuUser.events[j].beatmapId === osuUser.osuUser.events[k].beatmapId) {
												osuUser.osuUser.events.splice(k, 1);
												k--;
											}
										}
									}

									if (osuUser.osuUser.events[j].html.includes('medal')) {
										if (!guildTrackers[i].medals) {
											continue;
										}

										if (!osuUser.medalsData) {
											// Fetch https://osekai.net/medals/api/medals_nogrouping.php
											let medalsData = await fetch('https://osekai.net/medals/api/medals_nogrouping.php');
											medalsData = await medalsData.json();
											osuUser.medalsData = medalsData;
										}

										//This only works if the local timezone is UTC
										if (new Date(osuUser.osuUser.events[j].raw_date) < new Date(lastUpdated)) {
											continue;
										}

										// console.log(`Sending medal for ${osuUser.osuUserId}...`);

										let medalName = osuUser.osuUser.events[j].html.replace('</b>" medal!', '').replace(/.+<b>/gm, '');

										//Find the medal in osuUser.medalsData with the same name
										let medal = osuUser.medalsData.find(medal => medal.name === medalName);

										if (!osuUser.osuName) {
											osuUser.osuName = await getOsuPlayerName(osuUser.osuUserId);
										}

										const Discord = require('discord.js');
										let medalEmbed = new Discord.EmbedBuilder()
											.setColor('#583DA9')
											.setTitle(`${osuUser.osuName} unlocked the medal ${medalName}`)
											.setThumbnail(medal.link)
											.setDescription(medal.description)
											.addFields([{ name: 'Medal Group', value: medal.grouping }]);

										if (medal.instructions) {
											medalEmbed.addFields([{ name: 'Medal Hint', value: medal.instructions.replace('<b>', '**').replace('</b>', '**').replace('<i>', '*').replace('</i>', '*') }]);
										}

										try {
											await guildTrackers[i].channel.send({ embeds: [medalEmbed] });
										} catch (err) {
											if (err.message === 'Missing Permissions') {
												await guildTrackers[i].destroy();
											}
										}
									} else {
										let mapRank = osuUser.osuUser.events[j].html.replace(/.+<\/a><\/b> achieved rank #/gm, '').replace(/.+<\/a><\/b> achieved .+rank #/gm, '').replace(/ on <a href='\/b\/.+/gm, '').replace('</b>', '');
										let modeName = osuUser.osuUser.events[j].html.replace(/.+<\/a> \(osu!/gm, '');
										modeName = modeName.substring(0, modeName.length - 1);
										if (modeName.length === 0) {
											modeName = 'osu!';
										}

										if (modeName === 'osu!' && !guildTrackers[i].osuLeaderboard ||
											modeName.toLowerCase() === 'taiko' && !guildTrackers[i].taikoLeaderboard ||
											modeName.toLowerCase() === 'catch' && !guildTrackers[i].catchLeaderboard ||
											modeName.toLowerCase() === 'mania' && !guildTrackers[i].maniaLeaderboard) {
											continue;
										}

										//This only works if the local timezone is UTC
										if (parseInt(mapRank) <= 50 && new Date(lastUpdated) <= new Date(osuUser.osuUser.events[j].raw_date)) {

											// console.log(`Sending leaderboard scores for ${osuUser.osuUserId}...`);

											recentActivity = true;

											//Setup artificial interaction
											let interaction = {
												id: null,
												commandName: 'osu-score',
												channel: guildTrackers[i].channel,
												client: c,
												guild: guildTrackers[i].guild,
												user: {
													id: c.user.id
												},
												options: {
													getString: (string) => {
														if (string === 'beatmap') {
															return osuUser.osuUser.events[j].beatmapId;
														} else if (string === 'username') {
															return osuUser.osuUser.name;
														}
													},
													getNumber: (string) => {
														if (string === 'gamemode') {
															if (modeName === 'osu!') {
																return 0;
															} else if (modeName.toLowerCase() === 'taiko') {
																return 1;
															} else if (modeName.toLowerCase() === 'catch') {
																return 2;
															} else if (modeName.toLowerCase() === 'mania') {
																return 3;
															}
														}
													},
													getInteger: (string) => {
														if (string === 'mapRank') {
															return parseInt(mapRank);
														}
													},
												},
												deferReply: () => { },
												followUp: async (input) => {
													return await guildTrackers[i].channel.send(input);
												},
											};

											let scoreCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-score.js`);

											process.send(`command ${scoreCommand.name}`);

											scoreCommand.execute(interaction);
											await new Promise(resolve => setTimeout(resolve, 5000));
										}
									}
								}
							}
						}

						if (guildTrackers[i].osuTopPlays) {
							if (guildTrackers[i].osuNumberTopPlays === undefined) {
								// console.log(`Getting osu! top plays for ${osuUser.osuUserId}...`);
								logOsuAPICalls('utils.js processOsuTrack getUserBest standard');
								guildTrackers[i].osuNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 0 })
									.then(scores => {
										let recentPlaysAmount = 0;
										for (let j = 0; j < scores.length; j++) {
											//This only works if the local timezone is UTC
											if (new Date(lastUpdated) <= new Date(scores[j].raw_date)) {
												recentPlaysAmount++;
											}
										}
										return recentPlaysAmount;
									})
									// eslint-disable-next-line no-unused-vars
									.catch(err => {
										return err.message;
									});

								if (guildTrackers[i].osuNumberTopPlays === 'Not found') {
									guildTrackers[i].osuTopPlays = false;
									await guildTrackers[i].save();
								}
							}

							if (!isNaN(guildTrackers[i].osuNumberTopPlays) && guildTrackers[i].osuNumberTopPlays > 0) {
								// console.log(`Sending osu! top plays for ${osuUser.osuUserId}...`);

								recentActivity = true;

								let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

								//Setup artificial interaction
								let interaction = {
									id: null,
									client: c,
									channel: guildTrackers[i].channel,
									user: {
										id: c.user.id
									},
									options: {
										getString: (string) => {
											if (string === 'username') {
												return osuUser.osuUserId.toString();
											} else if (string === 'sorting') {
												return 'recent';
											}
										},
										getNumber: (string) => {
											if (string === 'gamemode') {
												return 0;
											}
										},
										getInteger: (string) => {
											if (string === 'amount') {
												return parseInt(guildTrackers[i].osuNumberTopPlays);
											}
										},
										getBoolean: (string) => {
											if (string === 'tracking') {
												return true;
											}
										},
									},
									deferReply: () => { },
									followUp: async (input) => {
										return await guildTrackers[i].channel.send(input);
									},
								};

								process.send(`command ${topCommand.name}`);

								topCommand.execute(interaction);
								await new Promise(resolve => setTimeout(resolve, 5000));
							}
						}

						if (guildTrackers[i].taikoTopPlays) {
							if (guildTrackers[i].taikoNumberTopPlays === undefined) {
								// console.log(`Getting taiko top plays for ${osuUser.osuUserId}...`);
								logOsuAPICalls('utils.js processOsuTrack getUserBest taiko');
								guildTrackers[i].taikoNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 1 })
									.then(scores => {
										let recentPlaysAmount = 0;
										for (let j = 0; j < scores.length; j++) {
											//This only works if the local timezone is UTC
											if (new Date(lastUpdated) <= new Date(scores[j].raw_date)) {
												recentPlaysAmount++;
											}
										}
										return recentPlaysAmount;
									})
									// eslint-disable-next-line no-unused-vars
									.catch(err => {
										return err.message;
									});

								if (guildTrackers[i].taikoNumberTopPlays === 'Not found') {
									guildTrackers[i].taikoTopPlays = false;
									await guildTrackers[i].save();
								}
							}

							if (!isNaN(guildTrackers[i].taikoNumberTopPlays) && guildTrackers[i].taikoNumberTopPlays > 0) {
								// console.log(`Sending taiko top plays for ${osuUser.osuUserId}...`);

								recentActivity = true;

								let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

								//Setup artificial interaction
								let interaction = {
									id: null,
									client: c,
									channel: guildTrackers[i].channel,
									user: {
										id: c.user.id
									},
									options: {
										getString: (string) => {
											if (string === 'username') {
												return osuUser.osuUserId.toString();
											} else if (string === 'sorting') {
												return 'recent';
											}
										},
										getNumber: (string) => {
											if (string === 'gamemode') {
												return 1;
											}
										},
										getInteger: (string) => {
											if (string === 'amount') {
												return parseInt(guildTrackers[i].taikoNumberTopPlays);
											}
										},
										getBoolean: (string) => {
											if (string === 'tracking') {
												return true;
											}
										},
									},
									deferReply: () => { },
									followUp: async (input) => {
										return await guildTrackers[i].channel.send(input);
									},
								};

								process.send(`command ${topCommand.name}`);

								topCommand.execute(interaction);
								await new Promise(resolve => setTimeout(resolve, 5000));
							}
						}

						if (guildTrackers[i].catchTopPlays) {
							if (guildTrackers[i].catchNumberTopPlays === undefined) {
								// console.log(`Getting catch top plays for ${osuUser.osuUserId}...`);

								logOsuAPICalls('utils.js processOsuTrack getUserBest catch');
								guildTrackers[i].catchNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 2 })
									.then(scores => {
										let recentPlaysAmount = 0;
										for (let j = 0; j < scores.length; j++) {
											//This only works if the local timezone is UTC
											if (new Date(lastUpdated) <= new Date(scores[j].raw_date)) {
												recentPlaysAmount++;
											}
										}
										return recentPlaysAmount;
									})
									// eslint-disable-next-line no-unused-vars
									.catch(err => {
										return err.message;
									});

								if (guildTrackers[i].catchNumberTopPlays === 'Not found') {
									guildTrackers[i].catchTopPlays = false;
									await guildTrackers[i].save();
								}
							}

							if (!isNaN(guildTrackers[i].catchNumberTopPlays) && guildTrackers[i].catchNumberTopPlays > 0) {
								// console.log(`Sending catch top plays for ${osuUser.osuUserId}...`);

								recentActivity = true;

								let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

								//Setup artificial interaction
								let interaction = {
									id: null,
									client: c,
									channel: guildTrackers[i].channel,
									user: {
										id: c.user.id
									},
									options: {
										getString: (string) => {
											if (string === 'username') {
												return osuUser.osuUserId.toString();
											} else if (string === 'sorting') {
												return 'recent';
											}
										},
										getNumber: (string) => {
											if (string === 'gamemode') {
												return 2;
											}
										},
										getInteger: (string) => {
											if (string === 'amount') {
												return parseInt(guildTrackers[i].catchNumberTopPlays);
											}
										},
										getBoolean: (string) => {
											if (string === 'tracking') {
												return true;
											}
										},
									},
									deferReply: () => { },
									followUp: async (input) => {
										return await guildTrackers[i].channel.send(input);
									},
								};

								process.send(`command ${topCommand.name}`);

								topCommand.execute(interaction);
								await new Promise(resolve => setTimeout(resolve, 5000));
							}
						}

						if (guildTrackers[i].maniaTopPlays) {
							if (guildTrackers[i].maniaNumberTopPlays === undefined) {
								// console.log(`Getting mania top plays for ${osuUser.osuUserId}...`);

								logOsuAPICalls('utils.js processOsuTrack getUserBest mania');
								guildTrackers[i].maniaNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 3 })
									.then(scores => {
										let recentPlaysAmount = 0;
										for (let j = 0; j < scores.length; j++) {
											//This only works if the local timezone is UTC
											if (new Date(lastUpdated) <= new Date(scores[j].raw_date)) {
												recentPlaysAmount++;
											}
										}
										return recentPlaysAmount;
									})
									// eslint-disable-next-line no-unused-vars
									.catch(err => {
										return err.message;
									});

								if (guildTrackers[i].maniaNumberTopPlays === 'Not found') {
									guildTrackers[i].maniaTopPlays = false;
									await guildTrackers[i].save();
								}
							}

							if (!isNaN(guildTrackers[i].maniaNumberTopPlays) && guildTrackers[i].maniaNumberTopPlays > 0) {
								// console.log(`Sending mania top plays for ${osuUser.osuUserId}...`);

								recentActivity = true;

								let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

								//Setup artificial interaction
								let interaction = {
									id: null,
									client: c,
									channel: guildTrackers[i].channel,
									user: {
										id: c.user.id
									},
									options: {
										getString: (string) => {
											if (string === 'username') {
												return osuUser.osuUserId.toString();
											} else if (string === 'sorting') {
												return 'recent';
											}
										},
										getNumber: (string) => {
											if (string === 'gamemode') {
												return 3;
											}
										},
										getInteger: (string) => {
											if (string === 'amount') {
												return parseInt(guildTrackers[i].maniaNumberTopPlays);
											}
										},
										getBoolean: (string) => {
											if (string === 'tracking') {
												return true;
											}
										},
									},
									deferReply: () => { },
									followUp: async (input) => {
										return await guildTrackers[i].channel.send(input);
									},
								};

								process.send(`command ${topCommand.name}`);

								topCommand.execute(interaction);
								await new Promise(resolve => setTimeout(resolve, 5000));
							}
						}

						if (guildTrackers[i].tournamentTopPlays) {
							if (guildTrackers[i].tournamentNumberTopPlays === undefined) {
								// console.log(`Getting tournament top plays for ${osuUser.osuUserId}...`);
								//Get all scores from tournaments
								let multiScores = await DBOsuMultiGameScores.findAll({
									attributes: [
										'id',
										'score',
										'gameRawMods',
										'rawMods',
										'teamType',
										'pp',
										'beatmapId',
										'createdAt',
										'osuUserId',
										'count50',
										'count100',
										'count300',
										'countGeki',
										'countKatu',
										'countMiss',
										'maxCombo',
										'perfect',
										'mode',
										'gameStartDate',
										'matchId',
									],
									where: {
										osuUserId: osuUser.osuUserId,
										mode: 0,
										tourneyMatch: true,
										score: {
											[Op.gte]: 10000
										}
									}
								});

								let multiMatches = await DBOsuMultiMatches.findAll({
									attributes: [
										'matchId',
										'matchName',
									],
									where: {
										matchId: {
											[Op.in]: multiScores.map(score => score.matchId)
										}
									}
								});

								for (let j = 0; j < multiScores.length; j++) {
									let match = multiMatches.find(match => match.matchId === multiScores[j].matchId);

									if (multiScores[j].teamType === 3 || multiScores[j].teamType === 1 || !match) {
										multiScores.splice(j, 1);
										j--;
									}
								}

								//Translate the scores to bancho scores
								for (let j = 0; j < multiScores.length; j++) {
									if (parseInt(multiScores[j].gameRawMods) % 2 === 1) {
										multiScores[j].gameRawMods = parseInt(multiScores[j].gameRawMods) - 1;
									}

									if (parseInt(multiScores[j].rawMods) % 2 === 1) {
										multiScores[j].rawMods = parseInt(multiScores[j].rawMods) - 1;
									}

									multiScores[j] = await multiToBanchoScore(multiScores[j], c);

									if (!multiScores[j].pp || parseFloat(multiScores[j].pp) > 2000 || !parseFloat(multiScores[j].pp)) {
										multiScores.splice(j, 1);
										j--;
										continue;
									}
								}

								//Sort the scores by pp descending
								multiScores.sort((a, b) => {
									return parseFloat(b.pp) - parseFloat(a.pp);
								});

								//Remove duplicates by beatmapId
								for (let j = 0; j < multiScores.length; j++) {
									for (let k = j + 1; k < multiScores.length; k++) {
										if (multiScores[j].beatmapId === multiScores[k].beatmapId) {
											multiScores.splice(k, 1);
											k--;
										}
									}
								}

								//Feed the scores into the array
								let scores = [];
								for (let j = 0; j < multiScores.length && j < 100; j++) {
									if (multiScores[j].pp) {
										scores.push(multiScores[j]);
									}
								}

								//Check which scores are new
								let newScores = [];
								for (let j = 0; j < scores.length; j++) {
									if (new Date(scores[j].createdAt) > new Date(lastUpdated)) {
										newScores.push(scores[j]);
									}
								}

								guildTrackers[i].tournamentNumberTopPlays = newScores.length;
							}

							if (!isNaN(guildTrackers[i].tournamentNumberTopPlays) && guildTrackers[i].tournamentNumberTopPlays > 0) {
								// console.log(`Sending tournament top plays for ${osuUser.osuUserId}...`);

								recentActivity = true;

								let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

								//Setup artificial interaction
								let interaction = {
									id: null,
									client: c,
									channel: guildTrackers[i].channel,
									user: {
										id: c.user.id
									},
									options: {
										getString: (string) => {
											if (string === 'username') {
												return osuUser.osuUserId.toString();
											} else if (string === 'sorting') {
												return 'recent';
											} else if (string === 'server') {
												return 'tournaments';
											}
										},
										getNumber: (string) => {
											if (string === 'gamemode') {
												return 0;
											}
										},
										getInteger: (string) => {
											if (string === 'amount') {
												return parseInt(guildTrackers[i].tournamentNumberTopPlays);
											}
										},
										getBoolean: (string) => {
											if (string === 'tracking') {
												return true;
											}
										},
									},
									deferReply: () => { },
									followUp: async (input) => {
										return await guildTrackers[i].channel.send(input);
									},
								};

								process.send(`command ${topCommand.name}`);

								topCommand.execute(interaction);
								await new Promise(resolve => setTimeout(resolve, 5000));
							}
						}

						if (guildTrackers[i].osuAmeobea) {
							try {
								if (!guildTrackers[i].osuAmeobeaUpdated) {
									// console.log(`Updating osu! Ameobea for ${osuUser.osuUserId}...`);

									await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=0`, { method: 'POST', body: 'a=1' });
									guildTrackers[i].osuAmeobeaUpdated = true;
									await new Promise(resolve => setTimeout(resolve, 5000));
								}

								if (guildTrackers[i].showAmeobeaUpdates) {
									if (!osuUser.osuName) {
										osuUser.osuName = await getOsuPlayerName(osuUser.osuUserId);
									}

									try {
										await guildTrackers[i].channel.send(`Ameobea has updated the standard osu!track profile for \`${osuUser.osuName}\`!`);
									} catch (err) {
										if (err.message === 'Missing Permissions') {
											await guildTrackers[i].destroy();
										}
									}
								}
							} catch (err) {
								//Nothing
							}
						}

						if (guildTrackers[i].taikoAmeobea) {
							try {
								if (!guildTrackers[i].taikoAmeobeaUpdated) {
									// console.log(`Updating taiko Ameobea for ${osuUser.osuUserId}...`);

									await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=1`, { method: 'POST', body: 'a=1' });
									guildTrackers[i].taikoAmeobeaUpdated = true;
									await new Promise(resolve => setTimeout(resolve, 5000));
								}

								if (guildTrackers[i].showAmeobeaUpdates) {
									if (!osuUser.osuName) {
										osuUser.osuName = await getOsuPlayerName(osuUser.osuUserId);
									}

									try {
										await guildTrackers[i].channel.send(`Ameobea has updated the taiko osu!track profile for \`${osuUser.osuName}\`!`);
									} catch (err) {
										if (err.message === 'Missing Permissions') {
											await guildTrackers[i].destroy();
										}
									}
								}
							} catch (err) {
								//Nothing
							}
						}

						if (guildTrackers[i].catchAmeobea) {
							try {
								if (!guildTrackers[i].catchAmeobeaUpdated) {
									// console.log(`Updating catch Ameobea for ${osuUser.osuUserId}...`);

									await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=2`, { method: 'POST', body: 'a=1' });
									guildTrackers[i].catchAmeobeaUpdated = true;
									await new Promise(resolve => setTimeout(resolve, 5000));
								}

								if (guildTrackers[i].showAmeobeaUpdates) {
									if (!osuUser.osuName) {
										osuUser.osuName = await getOsuPlayerName(osuUser.osuUserId);
									}

									try {
										await guildTrackers[i].channel.send(`Ameobea has updated the catch osu!track profile for \`${osuUser.osuName}\`!`);
									} catch (err) {
										if (err.message === 'Missing Permissions') {
											await guildTrackers[i].destroy();
										}
									}
								}
							} catch (err) {
								//Nothing
							}
						}

						if (guildTrackers[i].maniaAmeobea) {
							try {
								if (!guildTrackers[i].maniaAmeobeaUpdated) {
									// console.log(`Updating mania Ameobea for ${osuUser.osuUserId}...`);

									await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=3`, { method: 'POST', body: 'a=1' });
									guildTrackers[i].maniaAmeobeaUpdated = true;
									await new Promise(resolve => setTimeout(resolve, 5000));
								}

								if (guildTrackers[i].showAmeobeaUpdates) {
									if (!osuUser.osuName) {
										osuUser.osuName = await getOsuPlayerName(osuUser.osuUserId);
									}

									try {
										await guildTrackers[i].channel.send(`Ameobea has updated the mania osu!track profile for \`${osuUser.osuName}\`!`);
									} catch (err) {
										if (err.message === 'Missing Permissions') {
											await guildTrackers[i].destroy();
										}
									}
								}
							} catch (err) {
								//Nothing
							}
						}
					}

					return recentActivity;
				} catch (err) {
					console.error('Error in osu! track', err);
				}
			}, { context: { osuUser: osuUser, lastUpdated: osuTracker.updatedAt } });

			// console.log(`Finished processing ${osuTracker.osuUserId}...`);

			// wait for either the recentactivities to resolve or reject after a 180s timeout
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					reject('Timeout in osu! track - reject');
				}, 180000);

				Promise.all([recentActivities]).then(() => {
					resolve();
				}).catch(() => {
					reject('error in osu! track - reject');
				});
			});

			recentActivities = await recentActivities;

			let guildTrackers = await DBOsuGuildTrackers.count({
				where: {
					osuUserId: osuUser.osuUserId,
				},
			});

			if (guildTrackers) {
				// set variable recentActivity true if any of the recentActivities are true
				const recentActivity = recentActivities.some(activity => activity);

				if (recentActivity) {
					osuTracker.minutesBetweenChecks = 15;
				} else {
					osuTracker.minutesBetweenChecks = osuTracker.minutesBetweenChecks + 1;
				}

				if (osuTracker.minutesBetweenChecks > 60 * 23) {
					osuTracker.minutesBetweenChecks = 60 * 23;
				}

				let date = new Date();
				date.setMinutes(date.getMinutes() + osuTracker.minutesBetweenChecks);
				osuTracker.nextCheck = date;
				await osuTracker.save();
			} else {
				await osuTracker.destroy();
			}
		}
	},
	async getNextMap(modPool, lowerBound, upperBound, onlyRanked, avoidMaps) {
		let nextMap = null;
		if (modPool === 'NM') {
			nextMap = await module.exports.getValidTournamentBeatmap({
				modPool: 'NM',
				lowerBound: lowerBound,
				upperBound: upperBound,
				mode: 'Standard',
				upperDrain: 270,
				lowerDrain: 100,
				avoidMaps: avoidMaps,
				onlyRanked: onlyRanked,
			});
		}

		if (modPool === 'HD') {
			if (Math.random() > 0.3) {
				//70% not HD2
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'HD',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					lowerApproach: 8.5,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			} else {
				//30% HD2
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'HD',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					upperApproach: 8,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			}
		}

		if (modPool === 'HR') {
			if (Math.random() > 0.3) {
				//70% not HR2
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'HR',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					lowerCircleSize: 4.5,
					upperCircleSize: 6,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			} else {
				//30% HR2
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'HR',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					lowerCircleSize: 6.5,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			}
		}

		if (modPool === 'DT') {
			let upperApproach = 11;
			if (Math.random() > 0.4) {
				// 60% not over AR10
				upperApproach = 10;
			}

			nextMap = await module.exports.getValidTournamentBeatmap({
				modPool: 'DT',
				lowerBound: lowerBound,
				upperBound: upperBound,
				mode: 'Standard',
				upperDrain: 270,
				lowerDrain: 100,
				avoidMaps: avoidMaps,
				onlyRanked: onlyRanked,
				upperApproach: upperApproach,
			});
		}

		if (modPool === 'FreeMod' || modPool === 'FM') {
			if (Math.random() > 0.5) {
				//50% FM2
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'FM',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					lowerCircleSize: 5,
					upperApproach: 8,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			} else {
				//50% not FM2 (and not too low cs only, AR can go for whatever)
				nextMap = await module.exports.getValidTournamentBeatmap({
					modPool: 'FM',
					lowerBound: lowerBound,
					upperBound: upperBound,
					mode: 'Standard',
					upperDrain: 270,
					lowerDrain: 100,
					upperCircleSize: 4.5,
					avoidMaps: avoidMaps,
					onlyRanked: onlyRanked,
				});
			}
		}

		if (modPool === 'TieBreaker') {
			nextMap = await module.exports.getValidTournamentBeatmap({
				modPool: 'FM',
				lowerBound: lowerBound + 0.25,
				upperBound: upperBound + 0.25,
				mode: 'Standard',
				upperDrain: 360,
				lowerDrain: 270,
				upperCircleSize: 5,
				lowerApproach: 8,
				avoidMaps: avoidMaps,
				onlyRanked: onlyRanked,
			});
		}

		//Retry if no map
		if (!nextMap) {
			nextMap = await module.exports.getNextMap(modPool, lowerBound, upperBound, onlyRanked, avoidMaps);
		}

		return nextMap;
	},
	async addMatchMessage(matchId, array, user, message) {
		let now = new Date();
		array.push(`${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} [${user}]: ${message}`);

		//write the array to a .txt with the name of the matchId in the folder matchLogs
		let matchLog = array.join('\n');
		const fs = require('fs');

		//Check if the matchLogs folder exists and create it if necessary
		if (!fs.existsSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs`)) {
			fs.mkdirSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs`);
		}

		fs.writeFile(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs/${matchId}.txt`, matchLog, function (err) {
			if (err) {
				return console.error(err);
			}
		});
	},
	async getMapListCover(beatmapsetId, beatmapId, client) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./listcovers')) {
			fs.mkdirSync('./listcovers');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./listcovers/${beatmapsetId}.jpg`;

		//Force download if the map is recently updated in the database and therefore probably updated
		const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		if (dbBeatmap.approvalStatus === 'Not found') {
			return null;
		}

		try {
			if (!fs.existsSync(path) || fs.existsSync(path) && fs.statSync(path).mtime < dbBeatmap.updatedAt) {
				let permission = await module.exports.awaitWebRequestPermission(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/list@2x.jpg`, client);

				if (permission) {
					const res = await fetch(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/list@2x.jpg`);

					if (res.status === 404) {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./listcovers/${beatmapsetId}.jpg`);
							fs.createReadStream('./other/defaultListCover.png').pipe(fileStream);
							fileStream.on('finish', function () {
								resolve();
							});
							fileStream.on('error', (err) => {
								reject(err);
							});
						});
					} else {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./listcovers/${beatmapsetId}.jpg`);
							res.body.pipe(fileStream);
							res.body.on('error', (err) => {
								reject(err);
							});
							fileStream.on('finish', function () {
								resolve();
							});
						});
					}
				}
			}
		} catch (err) {
			console.error(err);
		}

		try {
			return await Canvas.loadImage(path);
		} catch (err) {
			return null;
		}
	},
	async getBeatmapCover(beatmapsetId, beatmapId, client) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./beatmapcovers')) {
			fs.mkdirSync('./beatmapcovers');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./beatmapcovers/${beatmapsetId}.jpg`;

		//Force download if the map is recently updated in the database and therefore probably updated
		const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		if (dbBeatmap.approvalStatus === 'Not found') {
			return null;
		}

		try {
			if (!fs.existsSync(path) || fs.existsSync(path) && fs.statSync(path).mtime < dbBeatmap.updatedAt) {
				let permission = await module.exports.awaitWebRequestPermission(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/cover.jpg`, client);

				if (permission) {
					const res = await fetch(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/cover.jpg`);

					if (res.status === 404) {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./beatmapcovers/${beatmapsetId}.jpg`);
							fs.createReadStream('./other/defaultMapCover.png').pipe(fileStream);
							fileStream.on('finish', function () {
								resolve();
							});
							fileStream.on('error', (err) => {
								reject(err);
							});
						});
					} else {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./beatmapcovers/${beatmapsetId}.jpg`);
							res.body.pipe(fileStream);
							res.body.on('error', (err) => {
								reject(err);
							});
							fileStream.on('finish', function () {
								resolve();
							});
						});
					}
				}
			}
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async getBeatmapSlimcover(beatmapsetId, beatmapId, client) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./slimcovers')) {
			fs.mkdirSync('./slimcovers');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./slimcovers/${beatmapsetId}.jpg`;

		//Force download if the map is recently updated in the database and therefore probably updated
		const dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

		if (dbBeatmap.approvalStatus === 'Not found') {
			return null;
		}

		try {
			if (!fs.existsSync(path) || fs.existsSync(path) && fs.statSync(path).mtime < dbBeatmap.updatedAt) {
				let permission = await module.exports.awaitWebRequestPermission(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/slimcover.jpg`, client);

				if (permission) {
					const res = await fetch(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/slimcover.jpg`);

					if (res.status === 404) {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./slimcovers/${beatmapsetId}.jpg`);
							fs.createReadStream('./other/defaultMapCover.png').pipe(fileStream);
							fileStream.on('finish', function () {
								resolve();
							});
							fileStream.on('error', (err) => {
								reject(err);
							});
						});
					} else {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./slimcovers/${beatmapsetId}.jpg`);
							res.body.pipe(fileStream);
							res.body.on('error', (err) => {
								reject(err);
							});
							fileStream.on('finish', function () {
								resolve();
							});
						});
					}
				}
			}
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async getAvatar(osuUserId, client) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./avatars')) {
			fs.mkdirSync('./avatars');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./avatars/${osuUserId}.png`;

		try {
			// Doesn't exist or older than 48 hours
			if (!fs.existsSync(path) || fs.existsSync(path) && fs.statSync(path).mtime < new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2)) {
				let permission = await module.exports.awaitWebRequestPermission(`https://s.ppy.sh/a/${osuUserId}`, client);

				if (permission) {
					const res = await fetch(`https://s.ppy.sh/a/${osuUserId}`);

					if (res.status === 404) {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./avatars/${osuUserId}.jpg`);
							fs.createReadStream('./other/defaultAvatar.png').pipe(fileStream);
							fileStream.on('finish', function () {
								resolve();
							});
							fileStream.on('error', (err) => {
								reject(err);
							});
						});
					} else {
						await new Promise((resolve, reject) => {
							const fileStream = fs.createWriteStream(`./avatars/${osuUserId}.png`);
							res.body.pipe(fileStream);
							res.body.on('error', (err) => {
								reject(err);
							});
							fileStream.on('finish', function () {
								resolve();
							});
						});
					}
				}
			}
		} catch (err) {
			console.error(err);
		}

		let loadedImage;

		try {
			loadedImage = await Canvas.loadImage(path);
		} catch (err) {
			loadedImage = await Canvas.loadImage('./other/defaultAvatar.png');
		}

		return loadedImage;
	},
	async getBadgeImage(badgeName, client) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./badges')) {
			fs.mkdirSync('./badges');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./badges/${badgeName.replaceAll('/', '_').replaceAll('?', '__')}`;

		try {
			if (!fs.existsSync(path)) {
				let permission = await module.exports.awaitWebRequestPermission(`https://assets.ppy.sh/profile-badges/${badgeName}`, client);

				if (permission) {
					const res = await fetch(`https://assets.ppy.sh/profile-badges/${badgeName}`);

					await new Promise((resolve, reject) => {
						const fileStream = fs.createWriteStream(`./badges/${badgeName.replaceAll('/', '_').replaceAll('?', '__')}`);
						res.body.pipe(fileStream);
						res.body.on('error', (err) => {
							reject(err);
						});
						fileStream.on('finish', function () {
							resolve();
						});
					});
				}
			}
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async awaitWebRequestPermission(request, client) {
		let randomString = Math.random().toString(36).substring(2);

		process.webRequestsWaiting.push({ string: randomString, link: request });

		process.send(`osu! website ${randomString} ${request}`);

		let startTime = new Date();
		let iterator = 0;

		let webRequest = true;

		while (webRequest) {
			if (iterator) {
				await new Promise(resolve => setTimeout(resolve, 100));
			} else {
				await new Promise(resolve => setTimeout(resolve, 55));
			}

			webRequest = process.webRequestsWaiting.find(item => item.string === randomString);

			if (webRequest) {
				if (webRequest.coveredByOtherRequest) {
					process.webRequestsWaiting = process.webRequestsWaiting.filter(item => item.string !== randomString);

					await new Promise(resolve => setTimeout(resolve, 5000));

					return false;
				}

				//Every 60 seconds send a message to the parent process to let it know that the bot is still waiting for a web request permission
				if (iterator % 600 === 0) {
					process.send(`osu! website ${randomString} ${request}`);
				}
			}

			iterator++;
		}

		let endTime = new Date();

		try {
			let err = new Error();
			let stack = err.stack.split('\n');
			stack.shift();

			for (let i = 0; i < stack.length; i++) {
				if (stack[i].includes('awaitWebRequestPermission')
					|| stack[i].includes('processTimers')
					|| stack[i].includes('runNextTicks')
					|| stack[i].includes('ShardClientUtil')
					|| stack[i].includes('_eval')
					|| stack[i].includes('listOnTimeout')) {
					stack.splice(i, 1);
					i--;
					continue;
				}

				stack[i] = stack[i].trim().replace('at ', '').replace('async ', '').replace(/\(\w:\\.+/gm, '').replace(/\w:\\.+\\/gm, '').trim();
				stack[i] = '`' + stack[i] + '`';
			}

			client.shard.broadcastEval(async (c, { message }) => {
				let channel;
				if (process.env.SERVER === 'Live') {
					channel = await c.channels.cache.get('1211359645638070333');
				} else {
					channel = await c.channels.cache.get('1211359790882885702');
				}

				if (channel) {
					await channel.send(message);
				}
			}, { context: { message: `After \`${endTime - startTime}ms\` - Requested <${request}> with string \`${randomString}\`\n${stack.reverse().join(' -> ')}` } });
		} catch (err) {
			console.error(err);
		}

		return true;
	},
	adjustStarRating(starRating, approachRate, circleSize, mods) {
		// Adapt star rating from 0.0 to 1.5 depending on the CS
		circleSize = parseFloat(circleSize);

		if (circleSize > 5.5) {
			let starRatingAdjust = 1.5 * (circleSize - 5) / 4.5;

			starRating = parseFloat(starRating) + starRatingAdjust;
		}

		approachRate = parseFloat(approachRate);

		if (module.exports.getMods(mods).includes('HD') && approachRate <= 10) {
			// Adapt star rating from 0.0 to 0.2 depending on the AR for the HD modpool only
			if (approachRate > 9) {
				let starRatingAdjust = 0.2 * (10 - approachRate);

				return parseFloat(starRating) + starRatingAdjust;
			}


			//Adapt starRating from 0.2 to 1.5 depending on the AR for the HD modpool only
			//Cap at AR 5
			if (approachRate < 5) {
				approachRate = 5;
			}

			let starRatingAdjust = 0.2 + (1.3 * (9 - approachRate) / 4);

			return parseFloat(starRating) + starRatingAdjust;
		}

		// Does not include HD
		// Adapt star rating from 0.0 to 0.75 depending on the AR
		if (approachRate > 10) {
			let starRatingAdjust = 0.75 - (0.75 * (11 - approachRate));

			return parseFloat(starRating) + starRatingAdjust;
		}

		//Adapt starRating from 0.0 to 1.0 depending on the AR
		if (approachRate < 9) {
			if (approachRate < 5) {
				approachRate = 5;
			}

			let starRatingAdjust = 1.0 * (9 - approachRate) / 4;

			return parseFloat(starRating) + starRatingAdjust;
		}

		return parseFloat(starRating);
	},
	async scoreCardAttachment(input) {
		//Input has to be an object with the following properties:
		//beatmap (NM)
		//mode (Integer)
		//score
		//user
		//server
		// Optional: maprank

		const canvasWidth = 1000;
		const canvasHeight = 500;

		Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
		Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		//Get context and load the image
		const ctx = canvas.getContext('2d');
		const cardBackground = await Canvas.loadImage('./other/osu-background.png');
		ctx.drawImage(cardBackground, 0, 0, canvas.width, canvas.height);

		// Draw the Title
		let gameMode = module.exports.getGameMode(input.beatmap);
		if (gameMode === 'fruits') {
			gameMode = 'catch';
		}
		const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
		const beatmapStatusIcon = await Canvas.loadImage(module.exports.getBeatmapApprovalStatusImage(input.beatmap));
		const starImage = await Canvas.loadImage('./other/overall-difficulty.png');

		ctx.drawImage(beatmapStatusIcon, 10, 5, canvas.height / 500 * 35, canvas.height / 500 * 35);
		ctx.drawImage(modePic, canvas.width / 1000 * 10, canvas.height / 500 * 40, canvas.height / 500 * 35, canvas.height / 500 * 35);

		if (gameMode === 'osu' && input.mode !== 0) {
			const modePic = await Canvas.loadImage(`./other/mode-${module.exports.getGameModeName(input.mode)}.png`);
			ctx.drawImage(modePic, canvas.width / 1000 * 20, canvas.height / 500 * 40, canvas.height / 500 * 35, canvas.height / 500 * 35);
		}

		// Write the title of the beatmap
		ctx.font = '30px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'left';

		let outputString = `${input.beatmap.title} by ${input.beatmap.artist}`;
		let shortened = false;
		while (ctx.measureText(outputString + '...').width > 930) {
			shortened = true;
			outputString = outputString.substring(0, outputString.length - 1);
		}

		if (shortened) {
			outputString += '...';
		}

		ctx.fillText(outputString, 60, 35);
		ctx.font = '25px comfortaa, arial';

		const mods = module.exports.getMods(input.score.raw_mods);

		if (mods.includes('NC')) {
			for (let i = 0, changed = false; i < mods.length && changed === false; i++) {
				if (mods[i] === 'NC') {
					mods[i] = 'DT';
					changed = true;
				}
			}
		}

		ctx.drawImage(starImage, 55, 42, canvas.height / 500 * 35, canvas.height / 500 * 35);
		if (mods.includes('DT') || mods.includes('HT') || mods.includes('HR') || mods.includes('EZ')) {
			let modMap = input.beatmap;
			if (mods.includes('DT') && mods.includes('HR')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 80 });
			} else if (mods.includes('DT') && mods.includes('EZ')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 66 });
			} else if (mods.includes('DT')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 64 });
			} else if (mods.includes('HT') && mods.includes('HR')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 272 });
			} else if (mods.includes('HT') && mods.includes('EZ')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 258 });
			} else if (mods.includes('HT')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 256 });
			} else if (mods.includes('EZ')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 2 });
			} else if (mods.includes('HR')) {
				modMap = await module.exports.getOsuBeatmap({ beatmapId: input.beatmap.beatmapId, modBits: 16 });
			}
			ctx.fillText(`${Math.round(input.beatmap.starRating * 100) / 100} (${Math.round(modMap.starRating * 100) / 100} with ${mods.join('')})  ${input.beatmap.difficulty} mapped by ${input.beatmap.mapper}`, canvas.width / 1000 * 90, canvas.height / 500 * 70);
		} else {
			ctx.fillText(`${Math.round(input.beatmap.starRating * 100) / 100}  ${input.beatmap.difficulty} mapped by ${input.beatmap.mapper}`, canvas.width / 1000 * 90, canvas.height / 500 * 70);
		}

		//Draw the cover
		ctx.globalAlpha = 0.6;

		//Draw a shape onto the main canvas in the top left
		let background = await module.exports.getBeatmapCover(input.beatmap.beatmapsetId, input.beatmap.beatmapId, input.client);
		ctx.drawImage(background, 0, canvas.height / 6.25, canvas.width, background.height / background.width * canvas.width);

		ctx.globalAlpha = 1;

		let gradeSS;
		let gradeS;

		if (mods.includes('HD')) {
			gradeSS = await Canvas.loadImage('./other/rank_pictures/XH_Rank.png');
			gradeS = await Canvas.loadImage('./other/rank_pictures/SH_Rank.png');
		} else {
			gradeSS = await Canvas.loadImage('./other/rank_pictures/X_Rank.png');
			gradeS = await Canvas.loadImage('./other/rank_pictures/S_Rank.png');
		}

		const gradeA = await Canvas.loadImage('./other/rank_pictures/A_Rank.png');
		const gradeB = await Canvas.loadImage('./other/rank_pictures/B_Rank.png');
		const gradeC = await Canvas.loadImage('./other/rank_pictures/C_Rank.png');
		const gradeD = await Canvas.loadImage('./other/rank_pictures/D_Rank.png');

		ctx.globalAlpha = 0.2;

		if (input.score.rank === 'XH' || input.score.rank === 'X') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeSS, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 40 + canvas.height / 6.25, 32, 16);
		if (input.score.rank === 'XH' || input.score.rank === 'X') {
			ctx.globalAlpha = 0.5;
		} else if (input.score.rank === 'SH' || input.score.rank === 'S') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeS, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 68 + canvas.height / 6.25, 32, 16);
		if (input.score.rank === 'SH' || input.score.rank === 'S') {
			ctx.globalAlpha = 0.5;
		} else if (input.score.rank === 'A') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeA, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 96 + canvas.height / 6.25, 32, 16);
		if (input.score.rank === 'A') {
			ctx.globalAlpha = 0.5;
		} else if (input.score.rank === 'B') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeB, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 124 + canvas.height / 6.25, 32, 16);
		if (input.score.rank === 'B') {
			ctx.globalAlpha = 0.5;
		} else if (input.score.rank === 'C') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeC, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 152 + canvas.height / 6.25, 32, 16);
		if (input.score.rank === 'C') {
			ctx.globalAlpha = 0.5;
		} else if (input.score.rank === 'D') {
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(gradeD, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 180 + canvas.height / 6.25, 32, 16);

		ctx.globalAlpha = 1;

		//Calculate accuracy
		let accuracy = module.exports.getAccuracy(input.score, input.mode);

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 90, 0, (2 * Math.PI));
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 23;
		ctx.stroke();

		var gradient = ctx.createLinearGradient(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 28 + canvas.height / 6.25, canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 208 + canvas.height / 6.25);
		gradient.addColorStop(0, '#65C8FA'); //Blue
		gradient.addColorStop(1, '#B2FE67'); // Green


		//Draw inner circle
		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 90, Math.PI * -0.5, (2 * Math.PI) * accuracy + Math.PI * -0.5);
		ctx.strokeStyle = gradient;
		ctx.lineWidth = 23;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) + Math.PI * -0.5);
		ctx.strokeStyle = '#BE0089'; //Red/Pink / SS Color
		ctx.lineWidth = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.99 + Math.PI * -0.5);
		ctx.strokeStyle = '#0D8790'; //Blue / S Color
		ctx.lineWidth = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.92 + Math.PI * -0.5);
		ctx.strokeStyle = '#72C904'; //Green / A Color
		ctx.lineWidth = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.86 + Math.PI * -0.5);
		ctx.strokeStyle = '#D99D03'; //Yellow / B Color
		ctx.lineWidth = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.8 + Math.PI * -0.5);
		ctx.strokeStyle = '#EA7948'; //Orange / C Color
		ctx.lineWidth = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.6 + Math.PI * -0.5);
		ctx.strokeStyle = '#FF5858'; //Red / D Color
		ctx.lineWidth = 4;
		ctx.stroke();

		//Write rank
		ctx.font = '70px comfortaa, arial';
		ctx.textAlign = 'center';
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 4;
		ctx.strokeText(input.score.rank.replace('X', 'SS').replace('H', ''), canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(input.score.rank.replace('X', 'SS').replace('H', ''), canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);

		//mods
		for (let i = 0; i < mods.length; i++) {
			const modImage = await Canvas.loadImage(module.exports.getModImage(mods[i]));
			ctx.drawImage(modImage, canvas.width / 900 * 300 + canvas.width / 1000 * 40 * i, (background.height / background.width * canvas.width) / 250 * 28 + canvas.height / 6.25, canvas.width / 1000 * 33, canvas.height / 500 * 23);
		}

		//Write Score
		ctx.font = '60px comfortaa, arial';
		ctx.textAlign = 'left';
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 4;
		ctx.strokeText(module.exports.humanReadable(input.score.score), canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 100 + canvas.height / 6.25);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(module.exports.humanReadable(input.score.score), canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 100 + canvas.height / 6.25);

		//Write Played By and Submitted on
		ctx.font = '10px comfortaa, arial';
		ctx.textAlign = 'left';
		ctx.fillStyle = '#FFFFFF';

		if (input.score.matchName) {
			module.exports.roundedRect(ctx, canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 125 + canvas.height / 6.25, Math.max(220, ctx.measureText(input.score.matchName).width + 100), 75, 5, '00', '00', '00', 0.75);
		} else {
			module.exports.roundedRect(ctx, canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 125 + canvas.height / 6.25, 220, 50, 5, '00', '00', '00', 0.75);
		}

		let month = 'January';
		if (input.score.raw_date.substring(5, 7) === '02') {
			month = 'February';
		} else if (input.score.raw_date.substring(5, 7) === '03') {
			month = 'March';
		} else if (input.score.raw_date.substring(5, 7) === '04') {
			month = 'April';
		} else if (input.score.raw_date.substring(5, 7) === '05') {
			month = 'May';
		} else if (input.score.raw_date.substring(5, 7) === '06') {
			month = 'June';
		} else if (input.score.raw_date.substring(5, 7) === '07') {
			month = 'July';
		} else if (input.score.raw_date.substring(5, 7) === '08') {
			month = 'August';
		} else if (input.score.raw_date.substring(5, 7) === '09') {
			month = 'September';
		} else if (input.score.raw_date.substring(5, 7) === '10') {
			month = 'October';
		} else if (input.score.raw_date.substring(5, 7) === '11') {
			month = 'November';
		} else if (input.score.raw_date.substring(5, 7) === '12') {
			month = 'December';
		}

		const formattedSubmitDate = `${input.score.raw_date.substring(8, 10)} ${month} ${input.score.raw_date.substring(0, 4)} ${input.score.raw_date.substring(11, 16)}`;

		ctx.font = '10px comfortaa, arial';
		ctx.textAlign = 'left';
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText('Played by', canvas.width / 900 * 310, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
		ctx.fillText(input.user.name, canvas.width / 900 * 380, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
		ctx.fillText('Submitted on', canvas.width / 900 * 310, (background.height / background.width * canvas.width) / 250 * 162 + canvas.height / 6.25);
		ctx.fillText(formattedSubmitDate, canvas.width / 900 * 380, (background.height / background.width * canvas.width) / 250 * 162 + canvas.height / 6.25);
		if (input.score.matchName) {
			ctx.fillText('Match', canvas.width / 900 * 310, (background.height / background.width * canvas.width) / 250 * 184 + canvas.height / 6.25);
			ctx.fillText(input.score.matchName, canvas.width / 900 * 380, (background.height / background.width * canvas.width) / 250 * 184 + canvas.height / 6.25);
		}

		//Draw the acc info
		if (input.mapRank > 0 || input.mapRank && input.mapRank.includes('/')) {
			//Draw completion
			module.exports.roundedRect(ctx, canvas.width / 1000 * 450, canvas.height / 500 * 395, 116, 50, 5, '00', '00', '00', 0.5);
			ctx.font = '18px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText('Global Rank', canvas.width / 1000 * 453 + 55, canvas.height / 500 * 415);
			ctx.fillText(`#${input.mapRank}`, canvas.width / 1000 * 453 + 55, canvas.height / 500 * 440);
		}

		if (input.score.rank === 'F') {
			//Calculate Completion
			const beatmapObjects = parseInt(input.beatmap.circles) + parseInt(input.beatmap.sliders) + parseInt(input.beatmap.spinners);
			let scoreHits = parseInt(input.score.counts[300]) + parseInt(input.score.counts[100]) + parseInt(input.score.counts[50]) + parseInt(input.score.counts.miss);
			//Mania needs to add geki and katu
			if (input.mode === 3) {
				scoreHits = scoreHits + parseInt(input.score.counts.geki) + parseInt(input.score.counts.katu);
			}
			const completion = 100 / beatmapObjects * scoreHits;

			//Draw completion
			module.exports.roundedRect(ctx, canvas.width / 1000 * 453, canvas.height / 500 * 395, 110, 50, 5, '00', '00', '00', 0.5);
			ctx.font = '18px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText('Completion', canvas.width / 1000 * 453 + 55, canvas.height / 500 * 415);
			ctx.fillText(`${Math.round(completion * 100) / 100}%`, canvas.width / 1000 * 453 + 55, canvas.height / 500 * 440);
		}

		//Calculate accuracy
		accuracy = accuracy * 100;

		//Acc
		module.exports.roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Accuracy', canvas.width / 1000 * 600 + 55, canvas.height / 500 * 385);
		ctx.fillText(`${Math.round(accuracy * 100) / 100}%`, canvas.width / 1000 * 600 + 55, canvas.height / 500 * 410);
		//Combo
		module.exports.roundedRect(ctx, canvas.width / 1000 * 725, canvas.height / 500 * 365, 130, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Max Combo', canvas.width / 1000 * 735 + 55, canvas.height / 500 * 385);

		let combo = `${input.score.maxCombo}x`;

		if (input.score.perfect) {
			ctx.fillStyle = '#B3FF66';
		} else {
			if (input.mode === 3 || input.mode === 1) {
				combo = `${input.score.maxCombo}x`;
			} else {
				combo = `${input.score.maxCombo}/${input.beatmap.maxCombo}x`;
			}
		}
		ctx.fillText(combo, canvas.width / 1000 * 735 + 55, canvas.height / 500 * 410);

		let pp = 'None';

		if (input.score.pp) {
			pp = Math.round(input.score.pp);
		} else {
			pp = Math.round(await module.exports.getOsuPP(input.beatmap.beatmapId, input.mode, input.score.raw_mods, Math.round(accuracy * 100) / 100, input.score.counts.miss, input.score.maxCombo, input.client));
		}

		ctx.font = '18px comfortaa, arial';
		if (!input.score.perfect) {
			let fcScore = {
				counts: {
					'300': parseInt(input.score.counts[300]) + parseInt(input.score.counts.miss),
					'100': parseInt(input.score.counts[100]),
					'50': parseInt(input.score.counts[50]),
					miss: 0
				}
			};

			let fcScoreAccuracy = module.exports.getAccuracy(fcScore, 0) * 100;
			let fcpp = Math.round(await module.exports.getOsuPP(input.beatmap.beatmapId, input.mode, input.score.raw_mods, fcScoreAccuracy, 0, input.beatmap.maxCombo, input.client));
			if (pp !== fcpp) {
				pp = `${pp} (${Math.round(fcpp)} FC)`;
				ctx.font = '16px comfortaa, arial';
			}
		}

		//PP
		module.exports.roundedRect(ctx, canvas.width / 1000 * 870, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
		if (input.beatmap.approvalStatus !== 'Ranked' && input.beatmap.approvalStatus !== 'Approved') {
			ctx.fillStyle = '#808080';
		} else {
			ctx.fillStyle = '#ffffff';
		}
		ctx.textAlign = 'center';
		ctx.fillText('PP', canvas.width / 1000 * 870 + 55, canvas.height / 500 * 385);
		ctx.fillText(`${pp}`, canvas.width / 1000 * 870 + 55, canvas.height / 500 * 410);

		//MAX
		if (input.mode === 3) {
			module.exports.roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 425, 60, 50, 5, '00', '00', '00', 0.5);
			ctx.font = '18px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText('Max', canvas.width / 1000 * 600 + 30, canvas.height / 500 * 445);
			ctx.fillText(`${input.score.counts.geki}`, canvas.width / 1000 * 600 + 30, canvas.height / 500 * 470);
		}

		//300
		let displayTerm = '300s';
		let xTextOffset = 0;
		let widthOffset = 0;
		let xRectOffset = 0;
		if (input.mode === 1) {
			displayTerm = 'Great';
			xTextOffset = 15;
			widthOffset = 30;
		} else if (input.mode === 2) {
			displayTerm = 'Fruits';
		} else if (input.mode === 3) {
			xRectOffset = 64;
			widthOffset = -20;
			xTextOffset = 54;
		}
		module.exports.roundedRect(ctx, canvas.width / 1000 * 600 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(displayTerm, canvas.width / 1000 * 600 + 40 + xTextOffset, canvas.height / 500 * 445);
		ctx.fillText(`${input.score.counts[300]}`, canvas.width / 1000 * 600 + 40 + xTextOffset, canvas.height / 500 * 470);

		//200
		if (input.mode === 3) {
			module.exports.roundedRect(ctx, canvas.width / 1000 * 728, canvas.height / 500 * 425, 60, 50, 5, '00', '00', '00', 0.5);
			ctx.font = '18px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText('200s', canvas.width / 1000 * 728 + 30, canvas.height / 500 * 445);
			ctx.fillText(`${input.score.counts.katu}`, canvas.width / 1000 * 728 + 30, canvas.height / 500 * 470);
		}

		//100
		xRectOffset = 0;
		widthOffset = 0;
		xTextOffset = 0;
		displayTerm = '100s';
		if (input.mode === 1) {
			displayTerm = 'Good';
			xRectOffset = 25;
			widthOffset = 50;
			xTextOffset = 50;
		} else if (input.mode === 2) {
			displayTerm = 'Ticks';
		} else if (input.mode === 3) {
			xRectOffset = 92;
			widthOffset = -20;
			xTextOffset = 82;
		}
		module.exports.roundedRect(ctx, canvas.width / 1000 * 700 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(displayTerm, canvas.width / 1000 * 700 + 40 + xTextOffset, canvas.height / 500 * 445);
		ctx.fillText(`${input.score.counts[100]}`, canvas.width / 1000 * 700 + 40 + xTextOffset, canvas.height / 500 * 470);

		//50
		if (input.mode !== 1) {
			displayTerm = '50s';
			xRectOffset = 0;
			widthOffset = 0;
			xTextOffset = 0;
			let value = input.score.counts[50];
			if (input.mode === 2) {
				displayTerm = 'DRPMiss';
				value = input.score.counts.katu;
			} else if (input.mode === 3) {
				xRectOffset = 56;
				widthOffset = -20;
				xTextOffset = 46;
			}
			module.exports.roundedRect(ctx, canvas.width / 1000 * 800 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
			ctx.font = '18px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText(displayTerm, canvas.width / 1000 * 800 + 40 + xTextOffset, canvas.height / 500 * 445);
			ctx.fillText(value, canvas.width / 1000 * 800 + 40 + xTextOffset, canvas.height / 500 * 470);
		}

		//Miss
		xRectOffset = 0;
		widthOffset = 0;
		xTextOffset = 0;
		if (input.mode === 1) {
			xRectOffset = -30;
			widthOffset = 30;
			xTextOffset = -15;
		} else if (input.mode === 3) {
			xRectOffset = 20;
			widthOffset = -20;
			xTextOffset = 10;
		}
		module.exports.roundedRect(ctx, canvas.width / 1000 * 900 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Miss', canvas.width / 1000 * 900 + 40 + xTextOffset, canvas.height / 500 * 445);
		ctx.fillText(`${input.score.counts.miss}`, canvas.width / 1000 * 900 + 40 + xTextOffset, canvas.height / 500 * 470);

		//Draw the footer
		let today = new Date().toLocaleDateString();

		ctx.font = '12px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

		//Draw user info
		if (input.server !== 'bancho') {
			ctx.save();
			//ctx.translate(newx, newy);
			ctx.rotate(-Math.PI / 2);
			ctx.font = '18px comfortaa, arial';
			ctx.textAlign = 'center';
			ctx.fillText(`[${input.server}]`, -canvas.height / 500 * 425, 50, 100);
			ctx.restore();
		}

		const userBackground = await Canvas.loadImage('./other/defaultBanner.jpg');

		module.exports.roundedImage(ctx, userBackground, canvas.width / 900 * 50, canvas.height / 500 * 375, userBackground.width / 10 * 2, userBackground.height / 10 * 2, 5);

		let userAvatar = null;

		if (input.server === 'ripple') {
			userAvatar = await Canvas.loadImage(`https://a.ripple.moe/${input.user.id}`);
		} else if (input.server === 'gatari') {
			userAvatar = await Canvas.loadImage(`https://a.gatari.pw/${input.user.id}`);
		} else {
			userAvatar = await module.exports.getAvatar(input.user.id, input.client);
		}

		module.exports.roundedRect(ctx, canvas.width / 900 * 50 + userBackground.height / 10 * 2, canvas.height / 500 * 375 + 5, userBackground.width / 10 * 2 - userBackground.height / 10 * 2 - 5, userBackground.height / 10 * 2 - 10, 5, '00', '00', '00', 0.5);

		ctx.font = '20px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'left';
		ctx.fillText(`Player: ${input.user.name}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 25);
		ctx.fillText(`Rank: #${module.exports.humanReadable(input.user.pp.rank)}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 55);
		ctx.fillText(`PP: ${module.exports.humanReadable(Math.floor(input.user.pp.raw))}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 85);

		module.exports.roundedImage(ctx, userAvatar, canvas.width / 900 * 50 + 5, canvas.height / 500 * 375 + 5, userBackground.height / 10 * 2 - 10, userBackground.height / 10 * 2 - 10, 5);

		//Create as an attachment
		return new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: `osu-score-${input.user.id}-${input.beatmap.beatmapId}-${input.score.raw_mods}.png` });
	},
	async sendMessageToLogChannel(client, channelId, message, crosspost) {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js sendMessageToLogChannel to shards...');
		}

		client.shard.broadcastEval(async (c, { guildId, channelId, message, crosspost }) => {
			let guild = await c.guilds.cache.get(guildId);

			if (!guild || guild.shardId !== c.shardId) {
				return;
			}

			let channel = await guild.channels.cache.get(channelId);

			if (!channel) {
				return;
			}

			let sentMessage = await channel.send(message);

			if (crosspost) {
				try {
					await sentMessage.crosspost();
				} catch (e) {
					if (e.message !== 'This message has already been crossposted.') {
						console.error('utils.js sendMessageToLogChannel | ', e);
					}
				}
			}
		}, {
			context: {
				guildId: process.env.LOGSERVER,
				channelId: channelId,
				message: message,
				crosspost: crosspost
			}
		});
	},
};

function applyOsuDuelStarratingCorrection(rating, score, weight) {
	//Get the expected score for the starrating
	//https://www.desmos.com/calculator/oae69zr9ze
	const a = 120000;
	const b = -1.67;
	const c = 20000;
	let expectedScore = a * Math.pow(parseFloat(score.starRating) + (b - rating), 2) + c;

	//Set the score to the lowest expected of c if a really high starrating occurs
	if (parseFloat(score.starRating) > Math.abs(b - rating)) {
		expectedScore = c;
	} else if (expectedScore > 950000) {
		expectedScore = 950000;
	}

	//Get the difference to the actual score
	let scoreDifference = score.score - expectedScore;

	if (score.score > 950000) {
		scoreDifference = 0;
	}

	//Get the star rating change by the difference
	//https://www.desmos.com/calculator/zlckiq6hgx
	const z = 0.000000000000000005;
	let starRatingChange = z * Math.pow(scoreDifference, 3);

	if (starRatingChange > 1) {
		starRatingChange = 1;
	} else if (starRatingChange < -1) {
		starRatingChange = -1;
	}

	//Get the new rating
	const newRating = rating + (starRatingChange * weight);

	return newRating;
}

async function executeFoundTask(client, nextTask) {
	try {
		if (nextTask && !module.exports.wrongCluster(client, nextTask.id)) {
			const task = require(`./processQueueTasks/${nextTask.task}.js`);

			await task.execute(client, nextTask);
		}
	} catch (e) {
		console.error('Error executing process queue task', e);
		console.error('Process Queue entry:', nextTask);
		nextTask.destroy();
	}
}

function getMiddleScore(scores) {
	if (scores.length % 2) {
		//Odd amount of scores
		const middleIndex = scores.length - Math.round(scores.length / 2);
		return scores[middleIndex];
	}

	while (scores.length > 2) {
		scores.splice(0, 1);
		scores.splice(scores.length - 1, 1);
	}

	return (parseInt(scores[0]) + parseInt(scores[1])) / 2;
}

async function checkWarmup(match, gameIndex, tourneyMatch, sameTournamentGames, crossCheck) {

	let acronym = match.name.toLowerCase().replace(/:.+/gm, '').trim();

	//Matches without warmups
	if (!tourneyMatch || gameIndex > 1 || matchMakingAcronyms.includes(acronym)) {
		// console.log('Not a warmup due to naming / map #');
		return { warmup: false, byAmount: false };
	}

	let sameMapSameTournamentScore = null;

	for (let i = 0; i < sameTournamentGames.length; i++) {
		if (sameTournamentGames[i].beatmapId == match.games[gameIndex].beatmapId) {
			sameMapSameTournamentScore = sameTournamentGames[i];
			break;
		}
	}

	if (sameMapSameTournamentScore) {
		return { warmup: false, byAmount: false };
	}

	let playersTeamBlue = 0;
	let playersTeamRed = 0;
	let playersNoTeam = 0;

	for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
		let scoreMods = module.exports.getMods(match.games[gameIndex].scores[i].raw_mods);
		if (scoreMods.includes('RX')
			|| scoreMods.includes('AP')
			|| scoreMods.includes('EZ')
			|| scoreMods.includes('FL')
			|| scoreMods.includes('SO')
			|| scoreMods.includes('PF')
			|| scoreMods.includes('SD')) {
			// console.log('Warmup due to mods');
			return { warmup: true, byAmount: false };
		}

		if (parseInt(match.games[gameIndex].scores[i].score) >= 10000) {
			if (match.games[gameIndex].scores[i].team === 'Blue') {
				playersTeamBlue++;
			} else if (match.games[gameIndex].scores[i].team === 'Red') {
				playersTeamRed++;
			} else {
				playersNoTeam++;
			}
		}
	}

	if (playersTeamBlue !== playersTeamRed) {
		// console.log('Warmup due to uneven teams');
		return { warmup: true, byAmount: false };
	}

	if (playersNoTeam > 2) {
		// console.log('No warmup due to lobby');
		return { warmup: false, byAmount: false };
	}

	//Check if the first map was not a warmup
	if (gameIndex === 1 && !crossCheck) {
		// console.log('Crosscheck for first map no warmup:');
		let firstMapWarmup = await checkWarmup(match, 0, tourneyMatch, sameTournamentGames, true);

		//Return not a warmup if the first map was not a warmup
		if (firstMapWarmup.warmup === false) {
			// console.log('Not a warmup due to first map not being a warmup');
			return { warmup: false, byAmount: false };
		}
	}

	//Check if the second map is a warmup
	if (gameIndex === 0 && match.games.length > 1 && !crossCheck) {
		// console.log('Crosscheck for second map warmup:');
		let secondMapWarmup = await checkWarmup(match, 1, tourneyMatch, sameTournamentGames, true);

		//Return not a warmup if the first map was not a warmup
		if (secondMapWarmup.warmup === true) {
			// console.log('Warmup due to second map being a warmup');
			return { warmup: true, byAmount: false };
		}
	}

	//Check for unique matchIds
	let matchIds = [];
	for (let i = 0; i < sameTournamentGames.length; i++) {
		if (!matchIds.includes(sameTournamentGames[i].matchId)) {
			matchIds.push(sameTournamentGames[i].matchId);
		}
	}

	//Last resort
	//Set to warmup if more than 5 matches were played and didn't have the map
	if (matchIds.length + 1 > 5 && !crossCheck) {
		// console.log('Warmup due to amount of matches that still don\'t have the map');
		return { warmup: true, byAmount: true };
	} else if (!crossCheck) {
		// console.log('Not a warmup due to amount of matches that still don\'t have the map');
		return { warmup: false, byAmount: true };
	}

	// console.log('Warmup status unclear');
	return { warmup: null, byAmount: false };
}

function getExpectedDuelRating(score) {
	score.score = Math.min(Math.max(parseInt(score.score), 20000), 950000);

	score.starRating = parseFloat(score.starRating);

	let rating = score.starRating;
	let oldRating = 0;

	while (oldRating.toFixed(3) !== rating.toFixed(3)) {
		oldRating = rating;
		rating = applyOsuDuelStarratingCorrection(rating, score, 1);
	}

	return rating;
}
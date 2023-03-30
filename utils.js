const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBActivityRoles, DBOsuBeatmaps, DBOsuMultiScores, DBBirthdayGuilds, DBOsuTourneyFollows, DBDuelRatingHistory, DBOsuForumPosts, DBOsuTrackingUsers, DBOsuGuildTrackers } = require('./dbObjects');
const { prefix, leaderboardEntriesPerPage, traceDatabaseQueries, logBroadcastEval } = require('./config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const osu = require('node-osu');
const { Op } = require('sequelize');
const { Beatmap, Calculator } = require('rosu-pp');

module.exports = {
	getGuildPrefix: async function (msg) {
		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === Discord.ChannelType.DM) {
			//Set prefix to standard prefix
			guildPrefix = prefix;
		} else {
			module.exports.logDatabaseQueries(3, 'utils.js DBGuilds getGuildPrefix');
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
					guildPrefix = prefix;
				}
			} else {
				//Set prefix to standard prefix
				guildPrefix = prefix;
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
		module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers updateOsuDetailsforUser');
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

		module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers getOsuUserServerMode');
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

				module.exports.logDatabaseQueries(3, 'utils.js DBServerUserActivity');
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

					module.exports.logDatabaseQueries(3, 'utils.js DBActivityRoles old updateServerUserActivity activityRoles');
					const activityRoles = await DBActivityRoles.count({
						where: { guildId: msg.guildId }
					});
					if (activityRoles) {
						module.exports.logDatabaseQueries(3, 'utils.js old updateServerUserActivity DBProcessQueue');
						const existingTask = await DBProcessQueue.count({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (existingTask === 0) {
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 5);
							module.exports.logDatabaseQueries(3, 'utils.js old updateServerUserActivity DBProcessQueue create');
							await DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
						}
					}
				}

				if (!serverUserActivity) {
					module.exports.logDatabaseQueries(3, 'utils.js DBServerUserActivity new ServerUserActivity create');
					await DBServerUserActivity.create({ guildId: msg.guildId, userId: msg.author.id });

					module.exports.logDatabaseQueries(3, 'utils.js new updateServerUserActivity DBActivityRoles');
					const activityRoles = await DBActivityRoles.count({
						where: { guildId: msg.guildId }
					});
					if (activityRoles) {
						module.exports.logDatabaseQueries(3, 'utils.js new updateServerUserActivity DBProcessQueue');
						const existingTask = await DBProcessQueue.count({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (existingTask === 0) {
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 5);
							module.exports.logDatabaseQueries(3, 'utils.js new updateServerUserActivity DBProcessQueue create');
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
	executeNextProcessQueueTask: async function (client, bancho) {
		let now = new Date();
		module.exports.logDatabaseQueries(1, 'utils.js DBProcessQueue nextTask');
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

				executeFoundTask(client, bancho, nextTasks[i]);
				break;
			}
		}
	},
	refreshOsuRank: async function (client) {
		if (module.exports.wrongCluster(client)) {
			return;
		}

		let now = new Date();

		let yesterday = new Date();
		yesterday.setUTCHours(yesterday.getUTCHours() - 24);

		let lastMonth = new Date();
		lastMonth.setUTCDate(lastMonth.getUTCMonth() - 1);

		// Update queue length
		module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBDiscordUsers 3');
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

		// eslint-disable-next-line no-undef
		process.send(`osuUpdateQueue ${osuUpdateQueueLength}`);

		module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBDiscordUsers');
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
			module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBProcessQueue');
			const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (existingTask === 0) {
				let now = new Date();
				module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBProcessQueue create');
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId, date: now });
			}
		}

		await new Promise(resolve => setTimeout(resolve, 25000));

		module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBDiscordUsers 2');
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
			module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBProcessQueue');
			const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (existingTask === 0) {
				let now = new Date();
				module.exports.logDatabaseQueries(2, 'utils.js refreshOsuRank DBProcessQueue create');
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

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

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
		module.exports.fitTextOnMiddleCanvas(ctx, title, 35, 'comfortaa, sans-serif', 50, canvas.width, 50);

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
				ctx.font = 'bold 25px comfortaa, sans-serif';
				ctx.fillText(`${placement}. ${data[i].name}`, xPosition, yPositionName);
				ctx.font = '25px comfortaa, sans-serif';
				ctx.fillText(data[i].value, xPosition, yPositionValue);
			}
		}

		let today = new Date().toLocaleDateString();

		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';

		if (page) {
			ctx.textAlign = 'left';
			ctx.fillText(`Page ${page} / ${totalPages}`, canvas.width / 140, canvas.height - 10);
		}

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

		//Create as an attachment and return
		return new Discord.AttachmentBuilder(canvas.toBuffer(), { name: filename });
	},
	async getAdditionalOsuInfo(osuUserId, client) {
		await module.exports.awaitWebRequestPermission();
		return await fetch(`https://osu.ppy.sh/users/${osuUserId}/`)
			.then(async (res) => {
				let htmlCode = await res.text();
				htmlCode = htmlCode.replace(/&quot;/gm, '"');

				const additionalInfo = {
					tournamentBan: false,
					badges: [],
					tournamentBadges: [],
				};

				// console.log(htmlCode);
				const accountHistoryRegex = /,"account_history".+,"active_tournament_banner":/gm;
				const tournamentBanMatches = accountHistoryRegex.exec(htmlCode);
				if (tournamentBanMatches && tournamentBanMatches[0]) {
					const cleanedMatch = tournamentBanMatches[0].replace(',"account_history":', '').replace(',"active_tournament_banner":', '');
					const rawAccountHistoryNotices = JSON.parse(cleanedMatch);
					const tournamentBans = rawAccountHistoryNotices.filter((notice) => notice.type === 'tournament_ban');

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
				}

				const badgesRegex = /,"badges".+,"comments_count":/gm;
				const badgeMatches = badgesRegex.exec(htmlCode);
				if (badgeMatches && badgeMatches[0]) {
					const cleanedMatch = badgeMatches[0].replace(',"badges":', '').replace(',"comments_count":', '');

					additionalInfo.badges = JSON.parse(cleanedMatch);

					for (let i = 0; i < additionalInfo.badges.length; i++) {
						additionalInfo.badges[i].description = additionalInfo.badges[i].description.replace('&#039;', '\'');

						const badge = additionalInfo.badges[i];
						if (!badge.description.startsWith('Beatmap Spotlights: ')
							&& !badge.description.includes(' contribution to the ')
							&& !badge.description.includes(' contributor')
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
							&& !badge.description.toLowerCase().includes('outstanding commitment')
							&& !badge.description.toLowerCase().includes('featured artist playlist')) {
							additionalInfo.tournamentBadges.push(badge);
						}
					}
				}

				module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers updateOsuDetailsforUser');
				//get discordUser from db to update pp and rank
				await DBDiscordUsers.findOne({
					attributes: ['id', 'osuBadges', 'osuName', 'osuUserId', 'tournamentBannedReason', 'tournamentBannedUntil'],
					where: {
						osuUserId: osuUserId
					},
				})
					.then(async (discordUser) => {
						if (discordUser) {
							if (discordUser.osuBadges < additionalInfo.tournamentBadges.length) {

								if (logBroadcastEval) {
									// eslint-disable-next-line no-console
									console.log('Broadcasting utils.js tournamentbadges to shards...');
								}

								client.shard.broadcastEval(async (c, { message }) => {
									let guildId = '727407178499096597';

									// eslint-disable-next-line no-undef
									if (process.env.SERVER === 'Dev') {
										guildId = '800641468321759242';
									}

									const guild = await c.guilds.cache.get(guildId);

									if (!guild || guild.shardId !== c.shardId) {
										return;
									}

									let channelId = '1078318397688926260';

									// eslint-disable-next-line no-undef
									if (process.env.SERVER === 'Dev') {
										channelId = '1078318144914985050';
									}

									const channel = await guild.channels.cache.get(channelId);

									if (channel) {
										let sentMessage = await channel.send(message);
										sentMessage.crosspost();
									}
								}, { context: { message: `\`${discordUser.osuName}\` gained ${additionalInfo.tournamentBadges.length - discordUser.osuBadges} tournament badge(s). (${discordUser.osuBadges} -> ${additionalInfo.tournamentBadges.length}) | https://osu.ppy.sh/users/${discordUser.osuUserId}` } });
							}

							discordUser.osuBadges = additionalInfo.tournamentBadges.length;

							if (additionalInfo.tournamentBan) {
								if (discordUser.tournamentBannedReason !== additionalInfo.tournamentBan.description || new Date(discordUser.tournamentBannedUntil).getTime() !== additionalInfo.tournamentBan.tournamentBannedUntil.getTime()) {
									let bannedUntilString = 'permanent';

									if (additionalInfo.tournamentBan.tournamentBannedUntil.getUTCFullYear() !== 9999) {
										bannedUntilString = `over <t:${Math.floor(additionalInfo.tournamentBan.tournamentBannedUntil.getTime() / 1000)}:R>`;
									}

									if (logBroadcastEval) {
										// eslint-disable-next-line no-console
										console.log('Broadcasting utils.js tournamentban to shards...');
									}

									client.shard.broadcastEval(async (c, { message }) => {
										let guildId = '727407178499096597';

										// eslint-disable-next-line no-undef
										if (process.env.SERVER === 'Dev') {
											guildId = '800641468321759242';
										}

										const guild = await c.guilds.cache.get(guildId);

										if (!guild || guild.shardId !== c.shardId) {
											return;
										}

										let channelId = '1078318437408968804';

										// eslint-disable-next-line no-undef
										if (process.env.SERVER === 'Dev') {
											channelId = '1078318180302323842';
										}

										const channel = await guild.channels.cache.get(channelId);

										if (channel) {
											let sentMessage = await channel.send(message);
											sentMessage.crosspost();
										}
									}, { context: { message: `\`${discordUser.osuName}\` has received a tournament ban at <t:${Math.floor(new Date(additionalInfo.tournamentBan.timestamp).getTime() / 1000)}:f> for \`${additionalInfo.tournamentBan.description}\`. (${bannedUntilString}) | https://osu.ppy.sh/users/${discordUser.osuUserId}` } });
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
			});
	},
	async restartProcessQueueTask() {
		module.exports.logDatabaseQueries(5, 'utils.js DBProcessQueue restartProcessQueueTask');
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
	async createMOTDAttachment(stagename, beatmap, doubletime) {
		let canvasWidth = 1000;
		const canvasHeight = 1000;

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/osu-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		// Write the stage of the map
		ctx.font = 'bold 50px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(stagename, canvas.width / 2, 65);

		ctx.fillStyle = 'rgba(173, 216, 230, 0.25)';
		ctx.fillRect(100, 100, 800, 800);

		// Write the map infos
		ctx.font = 'bold 50px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		module.exports.fitTextOnMiddleCanvas(ctx, beatmap.artist, 40, 'comfortaa, sans-serif', 200, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, beatmap.title, 40, 'comfortaa, sans-serif', 240, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, `Mapper: ${beatmap.creator}`, 40, 'comfortaa, sans-serif', 280, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, `[${beatmap.version}]`, 100, 'comfortaa, sans-serif', 450, canvas.width, 220);
		let doubletimeMod = '';
		if (doubletime) {
			doubletimeMod = '+DoubleTime';
			ctx.save();
			ctx.beginPath();
			// move the rotation point to the center of the rect
			ctx.translate(775, 700);
			// rotate the rect
			ctx.rotate(45 * Math.PI / 180);

			// draw the rect on the transformed context
			// Note: after transforming [0,0] is visually [x,y]
			//       so the rect needs to be offset accordingly when drawn
			ctx.rect(-60, -60, 120, 120);

			ctx.fillStyle = 'rgb(56, 172, 236)';
			ctx.fill();

			// restore the context to its untranslated/unrotated state
			ctx.restore();

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 65px comfortaa, sans-serif';
			ctx.fillText('DT', 775, 725);
		}
		module.exports.fitTextOnMiddleCanvas(ctx, `Mods: Freemod${doubletimeMod}`, 50, 'comfortaa, sans-serif', 575, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, '(All mods allowed except: Relax, Autopilot, Auto, ScoreV2)', 25, 'comfortaa, sans-serif', 600, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, `Length: ${Math.floor(beatmap.length.total / 60)}:${(beatmap.length.total % 60).toString().padStart(2, '0')}`, 35, 'comfortaa, sans-serif', 700, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, `SR: ${Math.round(beatmap.difficulty.rating * 100) / 100} | ${beatmap.bpm} BPM`, 35, 'comfortaa, sans-serif', 750, canvas.width, 220);
		module.exports.fitTextOnMiddleCanvas(ctx, `CS ${beatmap.difficulty.size} | HP ${beatmap.difficulty.drain} | OD ${beatmap.difficulty.overall} | AR ${beatmap.difficulty.approach}`, 35, 'comfortaa, sans-serif', 800, canvas.width, 220);

		let today = new Date().toLocaleDateString();

		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

		//Create as an attachment and return
		return new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `${stagename}.png` });
	}, pause(ms) {
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

		while (matchAlreadyGetsImported) {
			try {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting utils.js sameMatchGettingImported to shards...');
				}

				let sameMatchGettingImported = await client.shard.broadcastEval(async (c, { matchId, games }) => {
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

				let sameMatchGettingImported = await client.shard.broadcastEval(async (c, { matchId }) => {
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

		module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores warmup detection same tourney');
		let sameTournamentMatches = await DBOsuMultiScores.findAll({
			attributes: ['id', 'osuUserId', 'matchId', 'gameId', 'warmup', 'warmupDecidedByAmount', 'beatmapId'],
			where: {
				[Op.or]: [
					{
						matchName: {
							[Op.like]: `%${acronym}%:%`,
						},
						gameStartDate: {
							[Op.gte]: weeksPrior
						},
						gameEndDate: {
							[Op.lte]: weeksAfter
						},
						tourneyMatch: true
					},
					{
						matchId: match.id,
					}
				],
			}
		});

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

			let warmupCheckResult = await checkWarmup(match, gameIndex, tourneyMatch, sameTournamentMatches);

			let warmup = warmupCheckResult.warmup;

			let warmupDecidedByAmount = warmupCheckResult.byAmount;

			for (let scoreIndex = 0; scoreIndex < match.games[gameIndex].scores.length; scoreIndex++) {
				//Calculate evaluation
				let evaluation = null;

				let gameScores = [];
				for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
					gameScores.push(match.games[gameIndex].scores[i]);
				}

				if (gameScores.length > 1) {
					gameScores.sort((a, b) => {
						return parseInt(b.score) - parseInt(a.score);
					});

					for (let i = 0; i < gameScores.length; i++) {
						if (parseInt(gameScores[i].score) < 10000) {
							gameScores.splice(i, 1);
							i--;
						}
					}

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

					for (let i = 0; i < sameTournamentMatches.length; i++) {
						if (sameTournamentMatches[i].osuUserId == match.games[gameIndex].scores[scoreIndex].userId
							&& sameTournamentMatches[i].matchId == match.id
							&& sameTournamentMatches[i].gameId == match.games[gameIndex].id) {
							existingScore = sameTournamentMatches[i];
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
							matchName: match.name,
							gameId: match.games[gameIndex].id,
							scoringType: match.games[gameIndex].scoringType,
							mode: match.games[gameIndex].mode,
							beatmapId: match.games[gameIndex].beatmapId.toString(),
							tourneyMatch: tourneyMatch,
							evaluation: evaluation,
							score: match.games[gameIndex].scores[scoreIndex].score,
							gameRawMods: match.games[gameIndex].raw_mods.toString(),
							rawMods: scoreMods.toString(),
							matchStartDate: match.raw_start,
							matchEndDate: match.raw_end,
							gameStartDate: match.games[gameIndex].raw_start,
							gameEndDate: match.games[gameIndex].raw_end,
							freeMod: freeMod,
							forceMod: forceMod,
							warmup: warmup,
							warmupDecidedByAmount: warmupDecidedByAmount,
							maxCombo: match.games[gameIndex].scores[scoreIndex].maxCombo,
							count50: match.games[gameIndex].scores[scoreIndex].counts['50'],
							count100: match.games[gameIndex].scores[scoreIndex].counts['100'],
							count300: match.games[gameIndex].scores[scoreIndex].counts['300'],
							countMiss: match.games[gameIndex].scores[scoreIndex].counts.miss,
							countKatu: match.games[gameIndex].scores[scoreIndex].counts.katu,
							countGeki: match.games[gameIndex].scores[scoreIndex].counts.geki,
							perfect: match.games[gameIndex].scores[scoreIndex].perfect,
							teamType: match.games[gameIndex].teamType,
							team: match.games[gameIndex].scores[scoreIndex].team,
						});
					} else if (existingScore.warmup === null) {
						if (!existingMatchPlayers.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							existingMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						if (!playersToUpdate.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
							playersToUpdate.push(match.games[gameIndex].scores[scoreIndex].userId);
						}

						existingScore.osuUserId = match.games[gameIndex].scores[scoreIndex].userId;
						existingScore.matchId = match.id;
						existingScore.matchName = match.name;
						existingScore.gameId = match.games[gameIndex].id;
						existingScore.scoringType = match.games[gameIndex].scoringType;
						existingScore.mode = match.games[gameIndex].mode;
						existingScore.beatmapId = match.games[gameIndex].beatmapId;
						existingScore.evaluation = evaluation;
						existingScore.score = match.games[gameIndex].scores[scoreIndex].score;
						existingScore.gameRawMods = match.games[gameIndex].raw_mods;
						existingScore.rawMods = scoreMods;
						existingScore.matchStartDate = match.raw_start;
						existingScore.matchEndDate = match.raw_end;
						existingScore.gameStartDate = match.games[gameIndex].raw_start;
						existingScore.gameEndDate = match.games[gameIndex].raw_end;
						existingScore.freeMod = freeMod;
						existingScore.forceMod = forceMod;
						existingScore.warmup = warmup;
						existingScore.warmupDecidedByAmount = warmupDecidedByAmount;
						existingScore.maxCombo = match.games[gameIndex].scores[scoreIndex].maxCombo;
						existingScore.count50 = match.games[gameIndex].scores[scoreIndex].counts['50'];
						existingScore.count100 = match.games[gameIndex].scores[scoreIndex].counts['100'];
						existingScore.count300 = match.games[gameIndex].scores[scoreIndex].counts['300'];
						existingScore.countMiss = match.games[gameIndex].scores[scoreIndex].counts.miss;
						existingScore.countKatu = match.games[gameIndex].scores[scoreIndex].counts.katu;
						existingScore.countGeki = match.games[gameIndex].scores[scoreIndex].counts.geki;
						existingScore.perfect = match.games[gameIndex].scores[scoreIndex].perfect;
						existingScore.teamType = match.games[gameIndex].teamType;
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
					module.exports.logDatabaseQueries(4, 'utils.js DBOsuMultiScores create');
					await DBOsuMultiScores.bulkCreate(newScores)
						.then(async (scores) => {
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

							//Set back warmup flag if it was set by amount
							for (let i = 0; i < sameTournamentMatches.length; i++) {
								if (sameTournamentMatches[i].warmupDecidedByAmount && sameTournamentMatches[i].warmup !== null
									&& beatmapModPools.map(x => x.beatmapId).includes(sameTournamentMatches[i].beatmapId)
									&& sameTournamentMatches[i].matchId != match.id
									|| sameTournamentMatches[i].warmupDecidedByAmount && sameTournamentMatches[i].warmup === false
									&& sameTournamentMatches[i].matchId != match.id) {
									sameTournamentMatches[i].warmup = null;
									await sameTournamentMatches[i].save();
								}
							}

							created = true;
						});
				} catch (e) {
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			}
		}

		//Set the tournament flags on the corresponding beatmaps
		for (let i = 0; i < beatmapModPools.length; i++) {
			let NMBeatmaps = beatmapModPools.filter(x => x.modPool === 'NM').map(x => x.beatmapId);

			if (NMBeatmaps.length) {
				module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuBeatmaps NM tourney flags new score');
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
				module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuBeatmaps HD tourney flags new score');
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
				module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuBeatmaps HR tourney flags new score');
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
				module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuBeatmaps DT tourney flags new score');
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
				module.exports.logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuBeatmaps FM tourney flags new score');
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
				module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers lastDuelRatingUpdate null');
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
				module.exports.logDatabaseQueries(4, 'utils.js DBOsuTourneyFollows saveOsuMultiScores');
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
					module.exports.logDatabaseQueries(4, 'utils.js DBProcessQueue saveOsuMultiScores tourneyFollow');
					await DBProcessQueue.create({ task: 'tourneyFollow', priority: 1, additions: `${usersToNotify[i].userId};${match.id};${usersToNotify[i].osuUserIds.join(',')};${match.name}`, date: now });
				}
			}

			//Manage osu-track follows for guilds
			if (newMatchPlayers.length) {
				//Get all follows for the players in the match
				module.exports.logDatabaseQueries(4, 'utils.js DBOsuGuildTrackers saveOsuMultiScores');
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

				module.exports.logDatabaseQueries(4, 'utils.js DBOsuGuildTrackers saveOsuMultiScores existingMatchPlayerTrackers');
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
					module.exports.logDatabaseQueries(4, 'utils.js DBProcessQueue saveOsuMultiScores guildTourneyFollow');
					await DBProcessQueue.create({ task: 'guildTourneyFollow', priority: 1, additions: `${channelsToNotify[i].guildId};${channelsToNotify[i].channelId};${match.id};${channelsToNotify[i].osuUserIds.join(',')};${channelsToNotify[i].trackMatch};${match.name}`, date: now });
				}
			}

			//Manage osu-track follows for guilds for acronyms
			if (newMatchPlayers.length && existingMatchPlayers.length === 0) {
				//Get all follows for the players in the match
				module.exports.logDatabaseQueries(4, 'utils.js DBOsuGuildTrackers saveOsuMultiScores no existing match players');
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
					module.exports.logDatabaseQueries(4, 'utils.js DBProcessQueue saveOsuMultiScores guildTourneyAcronymFollow');
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

			await client.shard.broadcastEval(async (c, { matchId }) => {
				if (c.shardId === 0) {
					c.matchesGettingImported = c.matchesGettingImported.filter(m => m.matchId !== matchId);
				}
			}, {
				context: {
					matchId: match.id,
				}
			});
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
	isWrongSystem(guildId, isDM) {
		//Always respond to DMs
		if (isDM) {
			return false;
		}
		//For the development version
		//if the message is not in the Dev-Servers then return
		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Dev') {
			if (guildId != '800641468321759242' && guildId != '800641735658176553') {
				return true;
			}
			//For the QA version
			//if the message is in the QA-Servers then return
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'QA') {
			if (guildId != '800641367083974667' && guildId != '800641819086946344') {
				return true;
			}
			//For the Live version
			//if the message is in the Dev/QA-Servers then return
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'Live') {
			if (guildId === '800641468321759242' || guildId === '800641735658176553' || guildId === '800641367083974667' || guildId === '800641819086946344') {
				return true;
			}
		}

		//Otherwise its on the correct server
		return false;
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
		lastRework.setUTCFullYear(2023);
		lastRework.setUTCMonth(2);
		lastRework.setUTCDate(13);
		lastRework.setUTCHours(23);

		let lastWeek = new Date();
		lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);

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
				module.exports.logDatabaseQueries(1, 'utils.js DBOsuBeatmaps getOsuBeatmap');
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
					|| dbBeatmap && dbBeatmap.approvalStatus !== 'Ranked' && dbBeatmap.approvalStatus !== 'Approved' && (!dbBeatmap.updatedAt || dbBeatmap.updatedAt.getTime() < lastWeek.getTime()) //Update if old non-ranked map
					|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && (!dbBeatmap.starRating || !dbBeatmap.maxCombo || dbBeatmap.starRating == 0 || !dbBeatmap.mode)) { //Always update ranked maps if values are missing

					//Delete the map if it exists and we are checking NM
					const path = `./maps/${beatmapId}.osu`;

					try {
						const fs = require('fs');
						fs.unlinkSync(path);
					} catch (err) {
						//console.error(err);
					}

					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					// eslint-disable-next-line no-undef
					process.send('osu!API');
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

								module.exports.logDatabaseQueries(1, 'utils.js DBOsuMultiScores getOsuBeatmap');
								let tourneyScores = await DBOsuMultiScores.findAll({
									attributes: ['gameRawMods', 'rawMods', 'freeMod'],
									where: {
										beatmapId: beatmaps[0].id,
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

								module.exports.logDatabaseQueries(1, 'utils.js DBOsuBeatmaps getOsuBeatmap create');
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
								module.exports.logDatabaseQueries(1, 'utils.js DBOsuBeatmaps getOsuBeatmap create not found');
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
	logDatabaseQueries(level, output) {
		// eslint-disable-next-line no-undef
		process.send('traceDatabaseQueries: ' + output);
		//Level 5: Log rarely used queries
		//Level 4: Log queries used in commands
		//Level 3: Log queries used in (all) messages
		//Level 2: Log constant periodic queries
		//Level 1: Log all queries
		if (traceDatabaseQueries <= level) {
			// eslint-disable-next-line no-console
			console.log('traceDatabaseQueries: ', new Date(), output);
		}

		// const os = require('os');

		// let startTotal = os.freemem() / 1000000;

		// for (let i = 0; i < 10; i++) {
		// 	await new Promise(resolve => setTimeout(resolve, 1000));

		// 	//if 2500MiB descrease, log it
		// 	if (startTotal - 2500 > (os.freemem() / 1000000)) {
		// 		// eslint-disable-next-line no-console
		// 		console.log('traceDatabaseQueries: Memory usage increased by 2500MB', new Date(), (os.totalmem() - os.freemem()) / 1000000, 'MiB in use right now', output);
		// 		break;
		// 	}
		// }
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
		if (dbScore.freeMod || dbScore.rawMods !== '0') {
			return 'FM';
		}

		if (dbScore.gameRawMods === '0' || dbScore.gameRawMods === '1') {
			return 'NM';
		}

		if (dbScore.gameRawMods === '8' || dbScore.gameRawMods === '9') {
			return 'HD';
		}

		if (dbScore.gameRawMods === '16' || dbScore.gameRawMods === '17') {
			return 'HR';
		}

		if (parseInt(dbScore.gameRawMods) > 63 && (dbScore.gameRawMods === '64' || dbScore.gameRawMods === '65' || dbScore.gameRawMods === '576' || dbScore.gameRawMods === '577')) {
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
		module.exports.logDatabaseQueries(2, 'utils.js DBBirthdayGuilds checkForBirthdays');
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
			module.exports.logDatabaseQueries(2, 'utils.js DBGuilds checkForBirthdays');
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

				let channelFound = await client.shard.broadcastEval(async (c, { channelId, userId }) => {
					const birthdayMessageChannel = await c.channels.cache.get(channelId);

					if (birthdayMessageChannel) {
						// send a birthday gif from tenor 
						let index;
						const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
						// eslint-disable-next-line no-undef
						const birthdayGif = await fetch(`https://api.tenor.com/v1/search?q=anime_birthday&key=${process.env.TENORTOKEN}&limit=30&contentfilter=medium`)
							.then(async (res) => {
								let gifs = await res.json();
								index = Math.floor(Math.random() * gifs.results.length);
								return gifs.results[index].media[0].gif.url;
							});

						// send the birthday message
						birthdayMessageChannel.send(`<@${userId}> is celebrating their birthday today! :partying_face: :tada:\n${birthdayGif}`);
						return true;
					}
					return false;
				}, { context: { channelId: dbGuild.birthdayMessageChannel, userId: birthdayAnnouncements[i].userId } });

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
		let userScores;

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
			module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBDuelRatingHistory');
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

		module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBDiscordUsers savedStats');
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

		//Get the tournament data either limited by the date
		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores getUserDuelStarRating');
		userScores = await DBOsuMultiScores.findAll({
			attributes: [
				'gameId',
				'beatmapId',
				'score',
				'matchId',
				'matchName',
				'matchStartDate',
				'gameRawMods',
				'rawMods',
			],
			where: {
				osuUserId: input.osuUserId,
				tourneyMatch: true,
				scoringType: 'Score v2',
				mode: 'Standard',
				[Op.or]: [
					{ warmup: false },
					{ warmup: null }
				],
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
					},
				]
			}
		});

		//Check for scores from the past half a year
		const lastHalfYear = new Date();
		lastHalfYear.setUTCMonth(lastHalfYear.getUTCMonth() - 6);

		module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBOsuMultiScores pastHalfYearScoreCount');
		const pastHalfYearScoreCount = await DBOsuMultiScores.count({
			where: {
				osuUserId: input.osuUserId,
				tourneyMatch: true,
				scoringType: 'Score v2',
				mode: 'Standard',
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

		//Sort it by game ID
		userScores.sort((a, b) => {
			return parseInt(b.gameId) - parseInt(a.gameId);
		});

		let scoresPerMod = 35;
		let outliersPerMod = 3;

		let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];

		//Loop through all modpools
		for (let modIndex = 0; modIndex < modPools.length; modIndex++) {
			//Get only unique maps for each modpool
			const checkedMapIds = [];
			const userMapIds = [];
			const userMaps = [];
			for (let i = 0; i < userScores.length; i++) {
				//Check if the map is already in; the score is above 10k and the map is not an aspire map
				if (checkedMapIds.indexOf(userScores[i].beatmapId) === -1 && parseInt(userScores[i].score) > 10000 && userScores[i].beatmapId !== '1033882' && userScores[i].beatmapId !== '529285') {
					checkedMapIds.push(userScores[i].beatmapId);
					if (module.exports.getScoreModpool(userScores[i]) === modPools[modIndex]) {
						if (userMapIds.indexOf(userScores[i].beatmapId) === -1) {
							userMapIds.push(userScores[i].beatmapId);
							userMaps.push({ beatmapId: userScores[i].beatmapId, score: parseInt(userScores[i].score), matchId: userScores[i].matchId, matchName: userScores[i].matchName, matchStartDate: userScores[i].matchStartDate, modBits: parseInt(userScores[i].gameRawMods) + parseInt(userScores[i].rawMods) });
						}
					}
				}
			}

			module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBOsuBeatmaps beatmaps');
			let beatmaps = await DBOsuBeatmaps.findAll({
				attributes: [
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

				relevantMaps.splice(relevantMaps.indexOf(worstBeatmap), 1);
				relevantMaps.splice(relevantMaps.indexOf(bestBeatmap), 1);
			}

			//Group the maps into steps of 0.1 of difficulty
			const steps = [];
			const stepData = [];
			for (let i = 0; i < relevantMaps.length; i++) {
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
					duelRatings.stepData.NM = stepData;
				} else if (modIndex === 1) {
					duelRatings.hidden = weightedStarRating;
					duelRatings.stepData.HD = stepData;
				} else if (modIndex === 2) {
					duelRatings.hardRock = weightedStarRating;
					duelRatings.stepData.HR = stepData;
				} else if (modIndex === 3) {
					duelRatings.doubleTime = weightedStarRating;
					duelRatings.stepData.DT = stepData;
				} else if (modIndex === 4) {
					duelRatings.freeMod = weightedStarRating;
					duelRatings.stepData.FM = stepData;
				}
			}
		}

		//Check the past month for individual ratings and limit a potential drop to .02
		let newEndDate = new Date(endDate);
		newEndDate.setUTCDate(1);
		newEndDate.setUTCHours(0);
		newEndDate.setUTCMinutes(0);
		newEndDate.setUTCSeconds(0);
		newEndDate.setUTCMilliseconds(-1);

		module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBDuelRatingHistory lastMonthStats');
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

			//Get ratio of modPools played maps
			const modPoolAmounts = [0, 0, 0, 0, 0];
			for (let i = 0; i < userScores.length && i < 100; i++) {
				if (parseInt(userScores[i].score) > 10000) {
					modPoolAmounts[modPools.indexOf(module.exports.getScoreModpool(userScores[i]))]++;
				} else {
					userScores.splice(i, 1);
					i--;
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
				module.exports.logDatabaseQueries(4, 'utils.js getUserDuelStarRating DBDuelRatingHistory create');
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
			module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getUserDuelStarRating');
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
				module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getUserDuelStarRating create');
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
							if (logBroadcastEval) {
								// eslint-disable-next-line no-console
								console.log('Broadcasting utils.js duel Rating change for official server to shards...');
							}

							input.client.shard.broadcastEval(async (c, { message }) => {
								let guildId = '727407178499096597';
								let channelId = '946150632128135239';
								// eslint-disable-next-line no-undef
								if (process.env.SERVER === 'Dev') {
									guildId = '800641468321759242';
									channelId = '946190123677126666';
									// eslint-disable-next-line no-undef
								} else if (process.env.SERVER === 'QA') {
									guildId = '800641367083974667';
									channelId = '946190678189293569';
								}

								const guild = await c.guilds.cache.get(guildId);

								if (!guild || guild.shardId !== c.shardId) {
									return;
								}

								const channel = await guild.channels.cache.get(channelId);

								if (!channel) return;

								channel.send(message);
							}, { context: { message: `\`\`\`${message.join('\n')}\`\`\`` } });

							if (discordUser.osuDuelRatingUpdates) {
								const user = await input.client.users.cache.get(discordUser.userId);
								if (user) {
									user.send(`Your duel ratings have been updated.\`\`\`${message.join('\n')}\`\`\``);
								}
							}

							module.exports.logDatabaseQueries(2, 'utils.js DBOsuGuildTrackers getUserDuelStarRating');
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
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let topScores = null;

		for (let i = 0; i < 5 && !topScores; i++) {
			// eslint-disable-next-line no-undef
			process.send('osu!API');
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

		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getUserDuelRatings backup');
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
			module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getUserDuelRatings backup create');
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
		if (rating > 7) {
			return { name: 'Master', imageName: 'master', color: '#FFAEFB' };
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
	async twitchConnect(client, bancho) {
		if (module.exports.wrongCluster(client)) {
			return;
		}

		bancho.sentRequests = [];

		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers twitchConnect');
		let twitchSyncUsers = await DBDiscordUsers.findAll({
			attributes: ['twitchName'],
			where: {
				twitchName: {
					[Op.not]: null,
				}
			},
		});

		let twitchChannels = ['lunepie'];

		for (let i = 0; i < twitchSyncUsers.length; i++) {
			twitchChannels.push(twitchSyncUsers[i].twitchName);
		}

		//Require twitch irc module
		const tmi = require('tmi.js');

		// Define configuration options
		const opts = {
			identity: {
				// eslint-disable-next-line no-undef
				username: process.env.TWITCH_USERNAME,
				// eslint-disable-next-line no-undef
				password: process.env.TWITCH_OAUTH_TOKEN
			},
			channels: twitchChannels
		};

		// Create a client with our options
		let twitchClient = new tmi.client(opts);

		// Register our event handlers (defined below)
		twitchClient.on('message', onMessageHandler);
		twitchClient.on('connected', onConnectedHandler);

		// Connect to Twitch:
		await twitchClient.connect();

		// Called every time a message comes in
		async function onMessageHandler(target, context, msg, self) {
			if (self) { return; } // Ignore messages from the bot

			if (msg.startsWith('!verify') && context.username === target.substring(1)) {
				let content = msg.substring(7).trim();

				if (!content) {
					return;
				}

				if (!content.includes('#')) {
					return;
				}

				let discordName = content.split('#')[0];
				let discordDiscriminator = content.split('#')[1];

				let discordUser = client.users.cache.find(user => user.username === discordName && user.discriminator === discordDiscriminator);

				if (!discordUser) {
					return;
				}

				module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers twitchConnect 1');
				let dbDiscordUser = await DBDiscordUsers.findOne({
					attributes: ['id', 'twitchVerified', 'twitchName'],
					where: {
						userId: discordUser.id,
						twitchName: target.substring(1).toLowerCase(),
					}
				});

				if (!dbDiscordUser) {
					return;
				}

				dbDiscordUser.twitchVerified = true;
				await dbDiscordUser.save();

				twitchClient.say(target.substring(1), 'Your connection has been verified.');

				try {
					await discordUser.send(`Your connection to the twitch account ${dbDiscordUser.twitchName} has been verified!`);
				} catch (e) {
					console.error(e);
				}
				return;
			}

			if (msg === '!mp') {
				module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers twitchConnect 2');
				let discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId', 'osuName'],
					where: {
						twitchName: target.substring(1),
						twitchVerified: true,
						twitchOsuMatchCommand: true,
						osuUserId: {
							[Op.ne]: null
						}
					}
				});

				if (!discordUser) {
					return;
				}

				module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores lastMultiScore');
				let lastMultiScore = await DBOsuMultiScores.findOne({
					attributes: ['matchId', 'matchName', 'matchEndDate'],
					where: {
						osuUserId: discordUser.osuUserId
					},
					order: [
						['gameStartDate', 'DESC']
					]
				});

				if (!lastMultiScore) {
					return;
				}

				if (lastMultiScore.matchEndDate) {
					return twitchClient.say(target.substring(1), `Last match with ${discordUser.osuName}: ${lastMultiScore.matchName} | https://osu.ppy.sh/mp/${lastMultiScore.matchId}`);
				}

				return twitchClient.say(target.substring(1), `Current match with ${discordUser.osuName}: ${lastMultiScore.matchName} | https://osu.ppy.sh/mp/${lastMultiScore.matchId}`);
			}

			if (msg.startsWith('!')) { return; } // Ignore other messages starting with !

			if (msg.includes('https://osu.ppy.sh/community/matches/') || msg.includes('https://osu.ppy.sh/mp/')) {
				// Get the match ID
				let matchIDRegex = /https:\/\/osu\.ppy\.sh\/community\/matches\/(\d+)/gm;
				let matchID = matchIDRegex.exec(msg);

				if (!matchID) {
					matchIDRegex = /https:\/\/osu\.ppy\.sh\/mp\/(\d+)/gm;
					matchID = matchIDRegex.exec(msg);
				}

				if (!matchID) {
					return;
				}

				matchID = matchID[0].replace(/.*\//gm, '');

				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				let match = await osuApi.getMatch({ mp: matchID })
					.then(async (match) => {
						await module.exports.saveOsuMultiScores(match, client);

						return match;
					})
					.catch(async () => {
						//Nothing
						return { name: 'Error' };
					});

				let tourneyMatch = 0;
				if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
					tourneyMatch = 1;
				}

				module.exports.logDatabaseQueries(2, 'utils.js DBProcessQueue importMatch twitch chat');
				await DBProcessQueue.create({ guildId: 'None', task: 'importMatch', additions: `${matchID};${tourneyMatch};${Date.parse(match.raw_start)};${match.name}`, priority: 1, date: new Date() });

				return module.exports.updateCurrentMatchesChannel(client);
			}

			const longRegex = /https?:\/\/osu\.ppy\.sh\/beatmapsets\/.+\/\d+/gm;
			const shortRegex = /https?:\/\/osu\.ppy\.sh\/b\/\d+/gm;
			const longMatches = longRegex.exec(msg);
			const shortMatches = shortRegex.exec(msg);

			let map = null;
			if (longMatches) {
				map = longMatches[0];
			} else if (shortMatches) {
				map = shortMatches[0];
			}

			if (!map && msg.includes('https://osu.ppy.sh/beatmapsets/')) {
				module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers no map selected');
				let discordUser = await DBDiscordUsers.findOne({
					attributes: ['twitchName'],
					where: {
						twitchName: target.substring(1),
						twitchVerified: true,
						twitchOsuMapSync: true,
						osuUserId: {
							[Op.ne]: null
						}
					}
				});

				if (discordUser && context['display-name'].toLowerCase() !== discordUser.twitchName.toLowerCase()) {
					await twitchClient.say(target.substring(1), `${context['display-name']} -> Please select a difficulty of the mapset.`);
				}
				return;
			}

			if (map) {
				map = map.replace(/.+\//gm, '');

				//Get the message without the map link
				let message = msg.replace(longRegex, '').replace(shortRegex, '').trim();

				try {
					await bancho.connect();
				} catch (error) {
					if (!error.message === 'Already connected/connecting') {
						throw (error);
					}
				}

				try {
					module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers twitchConnect 2');
					let discordUser = await DBDiscordUsers.findOne({
						attributes: ['twitchName', 'osuName', 'osuUserId'],
						where: {
							twitchName: target.substring(1),
							twitchVerified: true,
							twitchOsuMapSync: true,
							osuUserId: {
								[Op.ne]: null
							}
						}
					});

					if (discordUser && context['display-name'].toLowerCase() !== discordUser.twitchName.toLowerCase()) {
						const IRCUser = await bancho.getUser(discordUser.osuName);

						let prefix = [];
						if (context.mod) {
							prefix.push('MOD');
						}
						if (context.badges && context.badges.vip) {
							prefix.push('VIP');
						}
						if (context.subscriber) {
							prefix.push('SUB');
						}

						if (prefix.length > 0) {
							prefix = `[${prefix.join('/')}] `;
						} else {
							prefix = '';
						}

						let dbBeatmap = await module.exports.getOsuBeatmap({ beatmapId: map, modBits: 0 });

						if (dbBeatmap) {
							bancho.lastUserMaps.set(discordUser.osuUserId, { beatmapId: map, modBits: 0 });

							let mainMessage = `${prefix}${context['display-name']} -> [${dbBeatmap.approvalStatus}] [https://osu.ppy.sh/b/${dbBeatmap.beatmapId} ${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}]] (mapped by ${dbBeatmap.mapper}) | ${Math.round(dbBeatmap.starRating * 100) / 100}* | ${dbBeatmap.bpm} BPM`;
							await IRCUser.sendMessage(mainMessage);
							if (message) {
								let comment = `${prefix}${context['display-name']} -> Comment: ${message}`;
								await IRCUser.sendMessage(comment);
								bancho.sentRequests.push({ osuUserId: discordUser.osuUserId, main: mainMessage, comment: comment });
							} else {
								bancho.sentRequests.push({ osuUserId: discordUser.osuUserId, main: mainMessage });
							}

							twitchClient.say(target.substring(1), `${context['display-name']} -> [${dbBeatmap.approvalStatus}] ${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}] (mapped by ${dbBeatmap.mapper}) | ${Math.round(dbBeatmap.starRating * 100) / 100}* | ${dbBeatmap.bpm} BPM`);
						} else {
							twitchClient.say(target.substring(1), `${context['display-name']} -> Map not found.`);
						}
					}
				} catch (error) {
					if (error.message !== 'Currently disconnected!') {
						console.error(error);
					}
				}

				return;
			}

			const fishhChannels = ['54068428', '640238356', '860369226', '217355740', '82273365', '236370675', '269391990'];
			// Eliteronix, Lunepie, Lunepieoffline, eneques, kaitiri, MaryLiOsu, Laan_c

			if (msg.includes('fishh') && fishhChannels.includes(context['room-id'])) {
				const catches = [
					{ name: 'Joel', weight: 250 },
					{ name: 'Christopher', weight: 250 },
					{ name: 'jol', weight: 250 },
					{ name: 'Noah', weight: 250 },
					{ name: 'Muhammed', weight: 250 },
					{ name: 'Damien', weight: 250 },
					{ name: 'Max', weight: 250 },
					{ name: 'COD', weight: 250 },
					{ name: 'Harold', weight: 250 },
					{ name: 'FishMoley', weight: 250 },
					{ name: 'fishJAM', weight: 100 },
					{ name: 'jellyfishJam', weight: 100 },
					{ name: 'JoelPride', weight: 100 },
					{ name: 'JUSSY', weight: 50 },
					{ name: 'Sharkge', weight: 50 },
					{ name: 'JoelJAM', weight: 25 },
					{ name: 'Joeler', weight: 10 },
					{ name: 'fishShy', weight: 10 },
					{ name: 'PogFish', weight: 10 },
					{ name: 'JoelbutmywindowsXPiscrashing', weight: 10 },
					{ name: 'JoelerRAVE', weight: 10 },
					{ name: 'JoelTeachingHisSonJolHowToSpinWhileWideBorisPassesBy', weight: 10 },
					{ name: 'Robert', weight: 1 }
				];

				let totalWeight = 0;
				for (let i = 0; i < catches.length; i++) {
					totalWeight += catches[i].weight;
				}

				let random = Math.floor(Math.random() * totalWeight);

				let currentWeight = 0;

				for (let i = 0; i < catches.length; i++) {
					currentWeight += catches[i].weight;
					if (random < currentWeight) {
						if (catches[i].name === 'Robert') {
							twitchClient.say(target.substring(1), `${context['display-name']} saved Robert from the water! (Legendary)`);
							return;
						}

						let rarity = 'Common';

						if (catches[i].weight < 25) {
							rarity = 'Epic';
						} else if (catches[i].weight < 100) {
							rarity = 'Rare';
						} else if (catches[i].weight < 250) {
							rarity = 'Uncommon';
						}

						twitchClient.say(target.substring(1), `${context['display-name']} caught ${catches[i].name} ! (${rarity})`);
						return;
					}
				}
			}
		}

		// Called every time the bot connects to Twitch chat
		function onConnectedHandler(addr, port) {
			// eslint-disable-next-line no-console
			console.log(`* Connected to ${addr}:${port}`);
		}

		return twitchClient;
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
	async getOsuPP(beatmapId, modBits, accuracy, misses, combo, depth) {
		const fs = require('fs');

		if (!depth) {
			depth = 0;
		}

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./maps')) {
			fs.mkdirSync('./maps');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./maps/${beatmapId}.osu`;

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
				await module.exports.awaitWebRequestPermission();
				const res = await fetch(`https://osu.ppy.sh/osu/${beatmapId}`);
				await new Promise((resolve, reject) => {
					const fileStream = fs.createWriteStream(`./maps/${beatmapId}.osu`);
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
			if (!err.message.match(/request to https:\/\/osu.ppy.sh\/osu\/\d+ failed, reason: Parse Error: Invalid header value char/gm)) {
				console.error(err);
			}
			return;
		}

		if (!combo) {
			combo = 0;
		}

		let arg = {
			mods: parseInt(modBits),
			acc: parseFloat(accuracy),
			nMisses: parseInt(misses),
			combo: parseInt(combo),
		};

		try {
			let map = new Beatmap({ path: `./maps/${beatmapId}.osu` });

			return new Calculator(arg).performance(map).pp;
		} catch (e) {
			if (depth < 3) {
				const path = `./maps/${beatmapId}.osu`;

				try {
					fs.unlinkSync(path);
				} catch (err) {
					// Nothing
				}

				depth++;

				return await module.exports.getOsuPP(beatmapId, modBits, accuracy, misses, combo, depth);
			} else if (e.message !== 'Failed to parse beatmap: expected `osu file format v` at file begin') {
				console.error(`error with map ${beatmapId}`, e);
				return null;
			} else {
				return null;
			}
		}
	},
	async multiToBanchoScore(inputScore) {
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
					let pp = await module.exports.getOsuPP(outputScore.beatmapId, outputScore.raw_mods, module.exports.getAccuracy(outputScore) * 100, parseInt(outputScore.counts.miss), parseInt(outputScore.maxCombo));

					module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores pp update');
					DBOsuMultiScores.update({ pp: pp }, { where: { id: inputScore.id } });

					outputScore.pp = pp;
				}
			}
		} catch (e) {
			if (e.message !== 'Failed to parse beatmap: IO error  - caused by: The system cannot find the file specified. (os error 2)') {
				console.error(`Error calculating pp for beatmap ${outputScore.beatmapId}`, e);
			}
		}

		outputScore.rank = module.exports.calculateGrade(inputScore.mode, outputScore.counts, outputScore.raw_mods);

		return outputScore;
	},
	async cleanUpDuplicateEntries(manually) {
		const Sequelize = require('sequelize');
		// Automatically add missing players to the database
		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries existingUsers');
		let existingUsers = await DBDiscordUsers.findAll({
			attributes: ['osuUserId']
		});

		existingUsers = existingUsers.map(user => user.osuUserId);

		// Remove null values
		existingUsers = existingUsers.filter(user => user !== null);

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries missingUsers');
		let missingUsers = await DBOsuMultiScores.findAll({
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
			// eslint-disable-next-line no-console
			console.log(`${missingUsers.length} missing users found`);
		}

		let iterator = 0;
		while (iterator < 50 && missingUsers.length) {
			let randomIndex = Math.floor(Math.random() * missingUsers.length);
			module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries missingUsers create');
			await DBDiscordUsers.create({
				osuUserId: missingUsers[randomIndex]
			});

			missingUsers.splice(randomIndex, 1);
			iterator++;
		}

		if (iterator) {
			// eslint-disable-next-line no-console
			console.log(`Created ${iterator} missing users`);
		}

		//Only clean up during the night
		let date = new Date();
		if (date.getUTCHours() > 6 && !manually) {
			return;
		}

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries mostplayed');
		let mostplayed = await DBOsuMultiScores.findAll({
			attributes: ['beatmapId', [Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'playcount']],
			where: {
				warmup: false,
				beatmapId: {
					[Op.gt]: 0,
				},
				matchName: {
					[Op.and]: {
						[Op.notLike]: 'ETX%:%',
						[Op.notLike]: 'o!mm%:%',
					}
				},
				tourneyMatch: true,
			},
			group: ['beatmapId'],
			order: [[Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'DESC']],
		});

		// Filter out maps that have less than 250 plays
		let popular = mostplayed.filter(map => map.dataValues.playcount > 250);
		popular = popular.map(map => map.dataValues.beatmapId);

		// Update beatmap data
		module.exports.logDatabaseQueries(2, 'utils.js DBOsuBeatmaps cleanUpDuplicateEntries popular');
		let update = await DBOsuBeatmaps.update({
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

		// eslint-disable-next-line no-console
		console.log(`Marked ${update[0]} new beatmaps as popular`);

		// Filter out maps that have less than 100 plays
		let usedOften = mostplayed.filter(map => map.dataValues.playcount > 100);
		usedOften = usedOften.map(map => map.dataValues.beatmapId);

		// Update beatmap data
		module.exports.logDatabaseQueries(2, 'utils.js DBOsuBeatmaps cleanUpDuplicateEntries usedOften');
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

		// eslint-disable-next-line no-console
		console.log(`Marked ${update[0]} new beatmaps as used often`);

		if (date.getUTCHours() > 0 && !manually) {
			return;
		}

		// Remove duplicate discorduser entries
		let deleted = 0;

		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries osuUserId 1');
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
			module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries osuUserId 2');
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

				// eslint-disable-next-line no-console
				console.log(results[0].userId, results[0].osuUserId, results[0].osuName, results[0].updatedAt);

				deleted++;
				i--;
			}
		}

		// eslint-disable-next-line no-console
		console.log(`Cleaned up ${deleted} duplicate users (by osuUserId)`);

		deleted = 0;

		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries userId 1');
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
			module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries userId 2');
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

				// eslint-disable-next-line no-console
				console.log(results[0].userId, results[0].osuUserId, results[0].osuName, results[0].updatedAt);

				deleted++;
				i--;
			}
		}

		// eslint-disable-next-line no-console
		console.log(`Cleaned up ${deleted} duplicate users (by userId)`);

		// Remove entries over half a year old
		duplicates = true;
		deleted = 0;

		let dateLimit = new Date();
		dateLimit.setMonth(dateLimit.getMonth() - 6);

		module.exports.logDatabaseQueries(2, 'utils.js DBDuelRatingHistory cleanUpDuplicateEntries oldData');
		deleted = await DBDuelRatingHistory.destroy({
			where: {
				updatedAt: {
					[Op.lt]: dateLimit
				}
			}
		});

		// eslint-disable-next-line no-console
		console.log(`Cleaned up ${deleted} old duel rating histories`);

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

		while (duplicates && iterations < 10) {
			module.exports.logDatabaseQueries(2, 'utils.js DBOsuBeatmaps cleanUpDuplicateEntries duplicates');
			let result = await beatmaps.query(
				'SELECT * FROM DBOsuBeatmaps WHERE 0 < (SELECT COUNT(1) FROM DBOsuBeatmaps as a WHERE a.beatmapId = DBOsuBeatmaps.beatmapId AND a.mods = DBOsuBeatmaps.mods AND a.id <> DBOsuBeatmaps.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				let beatmapIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (beatmapIds.indexOf(`${result[0][i].beatmapId}-${result[0][i].mods}`) === -1) {
						beatmapIds.push(`${result[0][i].beatmapId}-${result[0][i].mods}`);

						await new Promise(resolve => setTimeout(resolve, 500));

						module.exports.logDatabaseQueries(2, 'utils.js DBOsuBeatmaps cleanUpDuplicateEntries duplicates delete');
						let duplicate = await DBOsuBeatmaps.findOne({
							attributes: ['id', 'beatmapId', 'mods', 'updatedAt'],
							where: {
								id: result[0][i].id
							}
						});

						deleted++;

						// eslint-disable-next-line no-console
						console.log('#', deleted, 'iteration', iterations, 'beatmapId', duplicate.beatmapId, 'mods', duplicate.mods, 'updatedAt', duplicate.updatedAt);

						await new Promise(resolve => setTimeout(resolve, 500));
						try {
							await duplicate.destroy();
						} catch (e) {
							console.error(e);
						}
					}
				}
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		// eslint-disable-next-line no-console
		console.log(`Cleaned up ${deleted} duplicate beatmaps`);

		duplicates = true;
		deleted = 0;
		iterations = 0;

		const multiScores = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'databases/multiScores.sqlite',
			retry: {
				max: 15, // Maximum retry 15 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		while (duplicates && iterations < 10) {
			module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries duplicates');
			let result = await multiScores.query(
				'SELECT * FROM DBOsuMultiScores WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiScores as a WHERE a.osuUserId = DBOsuMultiScores.osuUserId AND a.matchId = DBOsuMultiScores.matchId AND a.gameId = DBOsuMultiScores.gameId AND a.id <> DBOsuMultiScores.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				let gameIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (gameIds.indexOf(`${result[0][i].gameId}-${result[0][i].osuUserId}`) === -1) {
						gameIds.push(`${result[0][i].gameId}-${result[0][i].osuUserId}`);

						await new Promise(resolve => setTimeout(resolve, 500));

						module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries duplicates delete');
						let duplicate = await DBOsuMultiScores.findOne({
							attributes: ['id', 'matchId', 'gameId', 'osuUserId', 'matchStartDate', 'updatedAt'],
							where: {
								id: result[0][i].id
							}
						});

						deleted++;

						// eslint-disable-next-line no-console
						console.log('#', deleted, 'iteration', iterations, 'matchId', duplicate.matchId, 'gameId', duplicate.gameId, 'osuUserId', duplicate.osuUserId, 'matchStartDate', duplicate.matchStartDate, 'updatedAt', duplicate.updatedAt);

						await new Promise(resolve => setTimeout(resolve, 500));
						try {
							await duplicate.destroy();
						} catch (e) {
							console.error(e);
						}
					}
				}
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		// eslint-disable-next-line no-console
		console.log(`Cleaned up ${deleted} duplicate scores`);

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuBeatmaps cleanUpDuplicateEntries wrong mode scores');
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

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries update taiko');
		let updated = await DBOsuMultiScores.update({
			mode: 'Taiko',
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: taikoMaps
				},
				mode: {
					[Op.not]: 'Taiko'
				}
			}
		});

		// eslint-disable-next-line no-console
		console.log(`Updated ${updated[0]} Taiko scores that were in the wrong mode`);

		let catchMaps = beatmapsOtherModes.filter(beatmap => beatmap.mode === 'Catch the Beat');

		catchMaps = catchMaps.map(beatmap => beatmap.beatmapId);

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries update catcch');
		updated = await DBOsuMultiScores.update({
			mode: 'Catch the Beat',
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: catchMaps
				},
				mode: {
					[Op.not]: 'Catch the Beat'
				}
			}
		});

		// eslint-disable-next-line no-console
		console.log(`Updated ${updated[0]} Catch the Beat scores that were in the wrong mode`);

		let maniaMaps = beatmapsOtherModes.filter(beatmap => beatmap.mode === 'Mania');

		maniaMaps = maniaMaps.map(beatmap => beatmap.beatmapId);

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries update mania');
		updated = await DBOsuMultiScores.update({
			mode: 'Mania',
			pp: null,
		}, {
			where: {
				beatmapId: {
					[Op.in]: maniaMaps
				},
				mode: {
					[Op.not]: 'Mania'
				}
			}
		});

		// eslint-disable-next-line no-console
		console.log(`Updated ${updated[0]} Mania scores that were in the wrong mode`);

		// Reset unverified scores that were checked by Elitebotix
		let weeksAgo = new Date();
		weeksAgo.setDate(weeksAgo.getDate() - 58);

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries reset unverified');
		updated = await DBOsuMultiScores.update({
			verifiedBy: null,
		}, {
			where: {
				verifiedBy: '31050083', // Elitebotix
				verifiedAt: null,
				matchStartDate: {
					[Op.gte]: weeksAgo
				}
			}
		});

		// eslint-disable-next-line no-console
		console.log(`Reset ${updated[0]} unverified scores that were checked by Elitebotix`);
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
		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getDerankStats osuPP');
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

		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers getDerankStats osuDuelStarRating');
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
				expectedCurrentDuelRating: duelDiscordUsers[ppRank].osuDuelStarRating
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
			// eslint-disable-next-line no-undef
			if (process.env.SERVER === 'Dev') {
				guildId = '800641468321759242';
				channelId = '980119563381383228';
				// eslint-disable-next-line no-undef
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
		// eslint-disable-next-line no-undef
		if (module.exports.wrongCluster(client) || process.env.SERVER !== 'Live') {
			return;
		}

		let response = await fetch('https://eliteronix.atlassian.net/rest/api/2/search?jql=project=EL and updated>=-20m&maxResults=100', {
			method: 'GET',
			headers: {
				// eslint-disable-next-line no-undef
				'Authorization': `Basic ${Buffer.from(
					// eslint-disable-next-line no-undef
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

					channel.send({ content: issues[i].key, embeds: [issueEmbed] });
				}
			}
		}, { context: { issues: issues } });
	},
	async getOsuPlayerName(osuUserId) {
		let playerName = osuUserId;

		module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers getOsuPlayerName');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuName'],
			where: {
				osuUserId: osuUserId
			}
		});

		if (discordUser) {
			playerName = discordUser.osuName;
		} else {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const osuUser = await osuApi.getUser({ u: osuUserId });
				if (osuUser) {
					playerName = osuUser.name;

					module.exports.logDatabaseQueries(4, 'utils.js DBDiscordUsers getOsuPlayerName create');
					await DBDiscordUsers.create({ osuUserId: osuUserId, osuName: osuUser.name });
				}
			} catch (err) {
				//Nothing
			}
		}

		return playerName;
	},
	calculateGrade(mode, counts, modBits) {
		if (mode === 'Standard') {
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
		} else if (mode === 'Taiko') {
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
		} else if (mode === 'Catch the Beat') {
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
		} else if (mode === 'Mania') {
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
	async createDuelMatch(client, bancho, interaction, averageStarRating, lowerBound, upperBound, bestOf, onlyRanked, users, queued) {
		if (interaction) {
			await interaction.editReply('Duel has been accepted. Getting necessary data...');
		}

		// Get the maps to avoid
		// Remove all maps played in the last 3 months
		// Remove all maps that have been played but not by all players
		let beatmapIds = [];
		let beatmaps = [];

		let avoidMaps = [];
		let threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		module.exports.logDatabaseQueries(4, 'utils.js createDuelMatch DBOsuMultiScores player scores');
		const playerScores = await DBOsuMultiScores.findAll({
			attributes: ['osuUserId', 'beatmapId', 'gameStartDate'],
			where: {
				osuUserId: {
					[Op.in]: users.map(user => user.osuUserId),
				},
				tourneyMatch: true,
				matchName: {
					[Op.notLike]: 'MOTD:%',
				},
				mode: 'Standard',
				[Op.or]: [
					{ warmup: false },
					{ warmup: null }
				],
			}
		});

		for (let i = 0; i < users.length; i++) {
			const currentPlayerScores = playerScores.filter(score => score.osuUserId === users[i].osuUserId);

			for (let j = 0; j < currentPlayerScores.length; j++) {
				if (currentPlayerScores[j].gameStartDate > threeMonthsAgo && !avoidMaps.includes(currentPlayerScores[j].beatmapId)) {
					avoidMaps.push(currentPlayerScores[j].beatmapId);
				}

				if (beatmapIds.includes(currentPlayerScores[j].beatmapId)) {
					beatmaps[beatmapIds.indexOf(currentPlayerScores[j].beatmapId)].count++;
				} else {
					beatmapIds.push(currentPlayerScores[j].beatmapId);
					beatmaps.push({ beatmapId: currentPlayerScores[j].beatmapId, count: 1 });
				}
			}
		}

		if (users.length === 2) {
			// Remove all maps that have not been played by all players
			for (let i = 0; i < beatmaps.length; i++) {
				if (beatmaps[i].count < users.length && !avoidMaps.includes(beatmaps[i].beatmapId)) {
					avoidMaps.push(beatmaps[i].beatmapId);
				}
			}
		}

		// Set up the modpools
		let modPools = [];

		//Fill as much as needed in groups
		while (modPools.length < bestOf - 1) {
			let modsToAdd = ['NM', 'HD', 'HR', 'DT', 'FreeMod'];
			shuffle(modsToAdd);
			modsToAdd.push('NM');

			while (modsToAdd.length) {
				modPools.push(modsToAdd.shift());
			}
		}

		//Remove everything that is too much
		while (modPools.length > bestOf - 1) {
			modPools.splice(modPools.length - 1, 1);
		}

		//Add TieBreaker
		modPools.push('FreeMod');

		//Set up the lobby
		let channel = null;

		let team1 = [];
		let team2 = [];
		let teamname1 = '';
		let teamname2 = '';

		for (let i = 0; i < users.length; i++) {
			let teamSize = users.length / 2;
			let perTeamIterator = i % teamSize;

			if (i < teamSize) {
				team1.push(users[i]);
				teamname1 += users[i].osuName.substring(Math.floor(users[i].osuName.length / teamSize * perTeamIterator), Math.floor(users[i].osuName.length / teamSize * perTeamIterator) + Math.floor(users[i].osuName.length / teamSize) + 1);
			} else {
				team2.push(users[i]);
				teamname2 += users[i].osuName.substring(Math.floor(users[i].osuName.length / teamSize * perTeamIterator), Math.floor(users[i].osuName.length / teamSize * perTeamIterator) + Math.floor(users[i].osuName.length / teamSize) + 1);
			}
		}

		if (interaction) {
			await interaction.editReply(`Creating match lobby for ${teamname1} vs ${teamname2}`);
		}

		for (let i = 0; i < 5; i++) {
			try {
				try {
					// console.log('Duel Match: Connecting to Bancho');
					await bancho.connect();
				} catch (error) {
					// console.log(`Duel Match: Error connecting to Bancho: ${error}`);
					if (!error.message === 'Already connected/connecting') {
						throw (error);
					}
				}
				// console.log('Duel Match: Creating match');
				if (users.length === 2) {
					channel = await bancho.createLobby(`ETX: (${teamname1}) vs (${teamname2})`);
				} else {
					channel = await bancho.createLobby(`ETX Teams: (${teamname1}) vs (${teamname2})`);
				}
				client.duels.push(parseInt(channel.lobby.id));
				// console.log('Duel Match: Created match');
				break;
			} catch (error) {
				if (i === 4) {
					if (interaction) {
						return await interaction.editReply('I am having issues creating the lobby and the match has been aborted.\nPlease try again later.');
					} else {
						return console.error('I am having issues creating a queued lobby and the match has been aborted.');
					}
				} else {
					await new Promise(resolve => setTimeout(resolve, 10000));
				}
			}
		}

		let lobbyStatus = 'Checking online status';

		let usersToCheck = [];
		let usersNotOnline = [];
		let usersOnline = [];

		channel.on('message', async (msg) => {
			// eslint-disable-next-line no-undef
			process.send(`osuuser ${msg.user.id}}`);

			module.exports.addMatchMessage(lobby.id, matchMessages, msg.user.ircUsername, msg.message);

			if (usersToCheck.length && msg.user.ircUsername === 'BanchoBot') {
				if (msg.message === 'The user is currently not online.') {
					usersNotOnline.push(usersToCheck.shift());
				} else if (msg.message.includes('is in') || msg.message === 'The user\'s location could not be determined.') {
					usersOnline.push(usersToCheck.shift());
				}
			}
		});

		const lobby = channel.lobby;
		module.exports.logMatchCreation(client, lobby.name, lobby.id);

		const password = Math.random().toString(36).substring(8);

		let matchMessages = [];
		await lobby.setPassword(password);
		await channel.sendMessage('!mp addref Eliteronix');
		await channel.sendMessage('!mp map 975342 0');
		if (users.length > 2) {
			await channel.sendMessage(`!mp set 2 3 ${users.length + 1}`);
		} else {
			await channel.sendMessage(`!mp set 0 3 ${users.length + 1}`);
		}
		await channel.sendMessage('!mp lock');

		if (queued) {
			for (let i = 0; i < users.length; i++) {
				usersToCheck.push(users[i]);
			}
		}

		while (usersToCheck.length) {
			await channel.sendMessage(`!where ${usersToCheck[0].osuName.replaceAll(' ', '_')}`);
			await new Promise(resolve => setTimeout(resolve, 5000));
		}

		if (usersNotOnline.length) {
			lobby.closeLobby();

			for (let i = 0; i < usersOnline.length; i++) {
				module.exports.logDatabaseQueries(2, 'utils.js DBProcessQueue duelQueue1v1 requeue');
				await DBProcessQueue.create({
					guildId: 'none',
					task: 'duelQueue1v1',
					additions: `${usersOnline[i].osuUserId};${usersOnline[i].osuDuelStarRating};0.5`,
					date: new Date(),
					priority: 9
				});
			}

			module.exports.updateQueueChannels(client);
			return;
		}

		lobbyStatus = 'Joining phase';
		let mapIndex = 0;

		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${users[i].osuUserId}`);
			let user = await client.users.fetch(users[i].userId);
			await messageUserWithRetries(user, interaction, `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}

		let pingMessage = null;
		if (interaction) {
			// eslint-disable-next-line no-undef
			await interaction.editReply(`<@${users.map(user => user.userId).join('>, <@')}> your match has been created. You have been invited ingame by \`${process.env.OSUNAME}\` and also got a DM as a backup. <https://osu.ppy.sh/mp/${lobby.id}>`);
			pingMessage = await interaction.channel.send(`<@${users.map(user => user.userId).join('>, <@')}>`);
			pingMessage.delete();
		}
		//Start the timer to close the lobby if not everyone joined by then
		await channel.sendMessage('!mp timer 300');

		let playerIds = users.map(user => user.osuUserId);
		let scores = [0, 0];

		let joinedUsers = [];

		let currentMapSelected = false;

		let waitedForMapdownload = false;

		//Add discord messages and also ingame invites for the timers
		channel.on('message', async (msg) => {
			if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
				//Banchobot countdown finished
				if (lobbyStatus === 'Joining phase') {
					if (queued) {
						//Requeue everyone who joined automatically
						joinedUsers.forEach(async (joinedUser) => {
							let user = users.find(user => user.osuUserId === joinedUser);

							//Requeue
							module.exports.logDatabaseQueries(2, 'utils.js DBProcessQueue duelQueue1v1 requeue 2');
							await DBProcessQueue.create({
								guildId: 'none',
								task: 'duelQueue1v1',
								additions: `${user.osuUserId};${user.osuDuelStarRating};0.5`,
								date: new Date(),
								priority: 9
							});

							module.exports.updateQueueChannels(client);

							//Message about requeueing
							const IRCUser = bancho.getUser(user.osuName);
							IRCUser.sendMessage('You have automatically been requeued for a 1v1 duel. You will be notified when a match is found.');
						});
					}

					//Not everyone joined and the lobby will be closed
					await channel.sendMessage('The lobby will be closed as not everyone joined.');
					await new Promise(resolve => setTimeout(resolve, 60000));
					return await lobby.closeLobby();
				} else if (lobbyStatus === 'Waiting for start') {
					let playerHasNoMap = false;
					for (let i = 0; i < 16; i++) {
						let player = lobby.slots[i];
						if (player && player.state === require('bancho.js').BanchoLobbyPlayerStates.NoMap) {
							playerHasNoMap = true;
						}
					}

					if (waitedForMapdownload || !playerHasNoMap) {
						//just start; we waited another minute already
						waitedForMapdownload = false;
						await channel.sendMessage('!mp start 5');
						await new Promise(resolve => setTimeout(resolve, 3000));
						await lobby.updateSettings();
						lobbyStatus === 'Map being played';
					} else {
						waitedForMapdownload = true;
						await channel.sendMessage('A player is missing the map. Waiting only 1 minute longer.');
						await channel.sendMessage('!mp timer 60');
					}
				}
			}
		});

		lobby.on('playerJoined', async (obj) => {
			// eslint-disable-next-line no-undef
			process.send(`osuuser ${obj.player.user.id}}`);

			orderMatchPlayers(lobby, channel, [...users]);

			//Add to an array of joined users for requeueing
			if (!joinedUsers.includes(obj.player.user.id.toString())) {
				joinedUsers.push(obj.player.user.id.toString());
			}

			if (!playerIds.includes(obj.player.user.id.toString())) {
				channel.sendMessage(`!mp kick #${obj.player.user.id}`);
			} else if (lobbyStatus === 'Joining phase') {
				let allPlayersJoined = true;
				for (let i = 0; i < users.length && allPlayersJoined; i++) {
					if (!lobby.playersById[users[i].osuUserId.toString()]) {
						allPlayersJoined = false;
					}
				}
				if (allPlayersJoined) {
					lobbyStatus = 'Waiting for start';

					await channel.sendMessage(`Average star rating of the mappool: ${Math.round(averageStarRating * 100) / 100}`);

					await channel.sendMessage('Looking for a map...');

					let nextMap = null;
					let tries = 0;
					while (tries === 0 || lobby._beatmapId != nextMap.beatmapId) {
						if (tries % 5 === 0) {
							if (bestOf === 1) {
								nextMap = await module.exports.getNextMap('TieBreaker', lowerBound, upperBound, onlyRanked, avoidMaps);
							} else {
								nextMap = await module.exports.getNextMap(modPools[mapIndex], lowerBound, upperBound, onlyRanked, avoidMaps);
							}
							avoidMaps.push(nextMap.beatmapId);
						}

						await channel.sendMessage('!mp abort');
						await channel.sendMessage(`!mp map ${nextMap.beatmapId}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
						await lobby.updateSettings();
						tries++;
					}

					let noFail = 'NF';
					if (modPools[mapIndex] === 'FreeMod') {
						noFail = '';
					}

					while (modPools[mapIndex] === 'FreeMod' && !lobby.freemod //There is no FreeMod combination otherwise
						|| modPools[mapIndex] !== 'FreeMod' && !lobby.mods
						|| modPools[mapIndex] === 'NM' && lobby.mods.length !== 1 //Only NM has only one mod
						|| modPools[mapIndex] !== 'FreeMod' && modPools[mapIndex] !== 'NM' && lobby.mods.length !== 2 //Only FreeMod and NM don't have two mods
						|| modPools[mapIndex] === 'HD' && !((lobby.mods[0].shortMod === 'hd' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'hd')) //Only HD has HD and NF
						|| modPools[mapIndex] === 'HR' && !((lobby.mods[0].shortMod === 'hr' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'hr')) //Only HR has HR and NF
						|| modPools[mapIndex] === 'DT' && !((lobby.mods[0].shortMod === 'dt' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'dt')) //Only DT has DT and NF
					) {
						await channel.sendMessage(`!mp mods ${modPools[mapIndex]} ${noFail}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
					}

					currentMapSelected = true;

					(async () => {
						let mapInfo = await getOsuMapInfo(nextMap);
						await channel.sendMessage(mapInfo);
					})();

					if (bestOf === 1) {
						await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be just as achieved.');
					} else if (modPools[mapIndex] === 'FreeMod') {
						await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be 0.5x of the score achieved.');
					}
					await channel.sendMessage('Everyone please ready up!');
					await channel.sendMessage('!mp timer 120');
				}
			}
		});

		lobby.on('allPlayersReady', async () => {
			await lobby.updateSettings();
			let playersInLobby = 0;
			for (let i = 0; i < 16; i++) {
				if (lobby.slots[i]) {
					playersInLobby++;
				}
			}
			if (currentMapSelected && lobbyStatus === 'Waiting for start' && playersInLobby === users.length) {
				await channel.sendMessage('!mp start 5');
				await new Promise(resolve => setTimeout(resolve, 3000));
				await lobby.updateSettings();
				lobbyStatus === 'Map being played';
			} else if (!currentMapSelected && lobbyStatus === 'Waiting for start' && playersInLobby === users.length) {
				await channel.sendMessage('Give me a moment, I am still searching for the best map ;w;');
			}
		});

		lobby.on('matchFinished', async (results) => {
			currentMapSelected = false;
			if (modPools[mapIndex] === 'FreeMod') {
				for (let i = 0; i < results.length; i++) {
					//Increase the score by 1.7 if EZ was played
					if (results[i].player.mods) {
						for (let j = 0; j < results[i].player.mods.length; j++) {
							if (results[i].player.mods[j].enumValue === 2) {
								results[i].score = results[i].score * 1.7;
							}
						}
					}
				}
			}

			if (modPools[mapIndex] === 'FreeMod' && mapIndex < bestOf - 1) {
				for (let i = 0; i < results.length; i++) {
					//Reduce the score by 0.5 if it was FreeMod and no mods / only nofail was picked
					if (!results[i].player.mods || results[i].player.mods.length === 0 || results[i].player.mods.length === 1 && results[i].player.mods[0].enumValue === 1) {
						results[i].score = results[i].score * 0.5;
					} else {
						let invalidModsPicked = false;
						for (let j = 0; j < results[i].player.mods.length; j++) {
							if (results[i].player.mods[j].enumValue !== 1 && results[i].player.mods[j].enumValue !== 2 && results[i].player.mods[j].enumValue !== 8 && results[i].player.mods[j].enumValue !== 16) {
								invalidModsPicked = true;
							}
						}

						if (invalidModsPicked) {
							results[i].score = results[i].score / 100;
						}
					}
				}
			}

			//Sort the results descending
			results.sort((a, b) => {
				return b.score - a.score;
			});

			let scoreTeam1 = 0;
			let scoreTeam2 = 0;

			//If the player is in the first team add to team 1, otherwise add to team 2
			//Create a helper array with the first half of the players
			let firstTeam = team1.map(user => user.osuUserId);

			for (let i = 0; i < results.length; i++) {
				// eslint-disable-next-line no-undef
				process.send(`osuuser ${results[i].player.user.id}}`);

				if (firstTeam.includes(results[i].player.user.id.toString())) {
					scoreTeam1 += parseFloat(results[i].score);
				} else {
					scoreTeam2 += parseFloat(results[i].score);
				}
			}

			if (results.length) {
				let winner = teamname1;

				if (scoreTeam1 < scoreTeam2) {
					winner = teamname2;
				}

				scoreTeam1 = Math.round(scoreTeam1);
				scoreTeam2 = Math.round(scoreTeam2);

				await channel.sendMessage(`Bo${bestOf} | ${teamname1}: ${module.exports.humanReadable(scoreTeam1)} | ${teamname2}: ${module.exports.humanReadable(scoreTeam2)} | Difference: ${module.exports.humanReadable(Math.abs(scoreTeam1 - scoreTeam2))} | Winner: ${winner}`);
			} else {
				await lobby.closeLobby();
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						module.exports.saveOsuMultiScores(match, client);
					})
					.catch(() => {
						//Nothing
					});

				return;
			}

			//Increase the score of the player at the top of the list
			if (scoreTeam1 > scoreTeam2) {
				scores[0]++;
			} else {
				scores[1]++;
			}
			await channel.sendMessage(`Score: ${teamname1} | ${scores[0]} - ${scores[1]} | ${teamname2}`);

			if (scores[0] < (bestOf + 1) / 2 && scores[1] < (bestOf + 1) / 2) {
				mapIndex++;
				lobbyStatus = 'Waiting for start';

				await channel.sendMessage('Looking for a map...');

				let nextMap = null;
				let tries = 0;
				while (tries === 0 || lobby._beatmapId != nextMap.beatmapId) {
					if (tries % 5 === 0) {
						if (scores[0] + scores[1] === bestOf - 1) {
							nextMap = await module.exports.getNextMap('TieBreaker', lowerBound, upperBound, onlyRanked, avoidMaps);
						} else {
							nextMap = await module.exports.getNextMap(modPools[mapIndex], lowerBound, upperBound, onlyRanked, avoidMaps);
						}

						avoidMaps.push(nextMap.beatmapId);
					}

					await channel.sendMessage('!mp abort');
					await channel.sendMessage(`!mp map ${nextMap.beatmapId}`);
					await new Promise(resolve => setTimeout(resolve, 5000));
					await lobby.updateSettings();
					tries++;
				}

				let noFail = 'NF';
				if (modPools[mapIndex] === 'FreeMod') {
					noFail = '';
				}

				while (modPools[mapIndex] === 'FreeMod' && !lobby.freemod //There is no FreeMod combination otherwise
					|| modPools[mapIndex] !== 'FreeMod' && !lobby.mods
					|| modPools[mapIndex] === 'NM' && lobby.mods.length !== 1 //Only NM has only one mod
					|| modPools[mapIndex] !== 'FreeMod' && modPools[mapIndex] !== 'NM' && lobby.mods.length !== 2 //Only FreeMod and NM don't have two mods
					|| modPools[mapIndex] === 'HD' && !((lobby.mods[0].shortMod === 'hd' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'hd')) //Only HD has HD and NF
					|| modPools[mapIndex] === 'HR' && !((lobby.mods[0].shortMod === 'hr' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'hr')) //Only HR has HR and NF
					|| modPools[mapIndex] === 'DT' && !((lobby.mods[0].shortMod === 'dt' && lobby.mods[1].shortMod === 'nf') || (lobby.mods[0].shortMod === 'nf' && lobby.mods[1].shortMod === 'dt')) //Only DT has DT and NF
				) {
					await channel.sendMessage(`!mp mods ${modPools[mapIndex]} ${noFail}`);
					await new Promise(resolve => setTimeout(resolve, 5000));
					await lobby.updateSettings();
				}

				currentMapSelected = true;

				(async () => {
					let mapInfo = await getOsuMapInfo(nextMap);
					await channel.sendMessage(mapInfo);
				})();

				await channel.sendMessage('Everyone please ready up!');
				if (modPools[mapIndex] === 'FreeMod' && mapIndex < bestOf - 1) {
					await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be 0.5x of the score achieved.');
				} else if (modPools[mapIndex] === 'FreeMod' && mapIndex === bestOf - 1) {
					await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be just as achieved.');
				}
				await channel.sendMessage('!mp timer 120');
			} else {
				lobbyStatus = 'Lobby finished';

				if (scores[0] === (bestOf + 1) / 2) {
					await channel.sendMessage(`Congratulations ${teamname1} for winning the match!`);
				} else {
					await channel.sendMessage(`Congratulations ${teamname2} for winning the match!`);
				}
				await channel.sendMessage('Thank you for playing! The lobby will automatically close in one minute.');
				await new Promise(resolve => setTimeout(resolve, 5000));

				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						await module.exports.saveOsuMultiScores(match, client);

						for (let i = 0; i < users.length; i++) {
							let userDuelStarRating = await module.exports.getUserDuelStarRating({ osuUserId: users[i].osuUserId, client: client });
							let messages = ['Your SR has been updated!'];
							if (Math.round(users[i].osuDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.total * 1000) / 1000) {
								messages.push(`SR: ${Math.round(users[i].osuDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.total * 1000) / 1000}`);
							}
							if (Math.round(users[i].osuNoModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.noMod * 1000) / 1000) {
								messages.push(`NM: ${Math.round(users[i].osuNoModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.noMod * 1000) / 1000}`);
							}
							if (Math.round(users[i].osuHiddenDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hidden * 1000) / 1000) {
								messages.push(`HD: ${Math.round(users[i].osuHiddenDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hidden * 1000) / 1000}`);
							}
							if (Math.round(users[i].osuHardRockDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hardRock * 1000) / 1000) {
								messages.push(`HR: ${Math.round(users[i].osuHardRockDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hardRock * 1000) / 1000}`);
							}
							if (Math.round(users[i].osuDoubleTimeDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.doubleTime * 1000) / 1000) {
								messages.push(`DT: ${Math.round(users[i].osuDoubleTimeDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}`);
							}
							if (Math.round(users[i].osuFreeModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.freeMod * 1000) / 1000) {
								messages.push(`FM: ${Math.round(users[i].osuFreeModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.freeMod * 1000) / 1000}`);
							}
							if (messages.length > 1) {
								const IRCUser = await bancho.getUser(users[i].osuName);
								for (let i = 0; i < messages.length; i++) {
									await IRCUser.sendMessage(messages[i]);
								}
							}
						}
					})
					.catch(() => {
						//Nothing
					});

				await new Promise(resolve => setTimeout(resolve, 55000));
				return await lobby.closeLobby();
			}
		});
	},
	async updateQueueChannels(client) {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting utils.js updateQueueChannels to shards...');
		}

		// eslint-disable-next-line no-empty-pattern
		client.shard.broadcastEval(async (c, { }) => {
			let voiceChannelId = '1010093794714189865';
			let textChannelId = '1045505232576184470';
			// eslint-disable-next-line no-undef
			if (process.env.SERVER === 'Dev') {
				voiceChannelId = '1010092736155762818';
				textChannelId = '1045483219555983381';
			}

			let textChannel = await c.channels.cache.get(textChannelId);
			if (textChannel && textChannel.guildId) {
				// eslint-disable-next-line no-undef
				const { DBProcessQueue } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				// eslint-disable-next-line no-undef
				const { getOsuPlayerName, logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

				logDatabaseQueries(4, 'utils.js DBProcessQueue existingQueueTasks');
				let existingQueueTasks = await DBProcessQueue.findAll({
					attributes: ['additions', 'createdAt'],
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

				await textChannel.bulkDelete(messages);

				// Send new message
				let players = [];

				for (let i = 0; i < existingQueueTasks.length; i++) {
					let args = existingQueueTasks[i].additions.split(';');

					let currentUser = args[0];
					let playername = await getOsuPlayerName(currentUser);
					let starRating = parseFloat(args[1]);

					players.push({ text: `${playername} - ${starRating.toFixed(2)}* <t:${Date.parse(existingQueueTasks[i].createdAt) / 1000}:R>`, starRating: starRating });
				}

				players.sort((a, b) => {
					return b.starRating - a.starRating;
				});

				players.reverse();

				players = players.map(player => player.text);

				textChannel.send(`There ${verb} currently ${existingQueueTasks.length} user${multipleString} in the 1v1 queue!\nRead <#1042938217684541551> for more information.\n\n${players.join('\n')}`);
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
			// eslint-disable-next-line no-undef
			if (process.env.SERVER === 'Dev') {
				textChannelId = '1089272362869985390';
			}

			let textChannel = await c.channels.cache.get(textChannelId);
			if (!textChannel || !textChannel.guildId) {
				return;
			}

			// eslint-disable-next-line no-undef
			const { DBProcessQueue } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
			// eslint-disable-next-line no-undef
			const { getOsuPlayerName, logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			logDatabaseQueries(4, 'utils.js DBProcessQueue updateCurrentMatchesChannel existingQueueTasks');
			let existingQueueTasks = await DBProcessQueue.findAll({
				attributes: ['additions', 'createdAt'],
				where: {
					task: 'importMatch',
				},
			});

			let multipleString = 'es';
			let verb = 'are';
			if (existingQueueTasks.length === 1) {
				multipleString = '';
				verb = 'is';
			}

			// Get all messages and delete
			let messages = await textChannel.messages.fetch({ limit: 100 });

			await textChannel.bulkDelete(messages);

			// Send new message
			let matches = [`There ${verb} currently ${existingQueueTasks.length} match${multipleString} running:\n`];

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

				let players = '';

				if (args[4]) {
					players = args[4].split(',');

					for (let j = 0; j < players.length; j++) {
						let playerName = await getOsuPlayerName(players[j]);

						if (playerName) {
							players[j] = playerName;
						}
					}

					players = ` - \`${players.join('`, `')}\``;
				}

				if (matchName.toLowerCase().includes('qualifiers')) {
					matchId = 'XXXXXXXXX';
				}

				let newEntry = `<https://osu.ppy.sh/mp/${matchId}> - <t:${matchCreation / 1000}:R> - \`${matchName.replace(/`/g, '')}\`${players}`;

				if (`${matches.join('\n')}\n${newEntry}`.length > 2000) {
					await textChannel.send(matches.join('\n'));
					matches = [];
				}

				matches.push(newEntry);
			}

			await textChannel.send(matches.join('\n'));

			textChannel.edit({ name: `${existingQueueTasks.length} current match${multipleString}` });
		}, { context: {} });
	},
	async createNewForumPostRecords(client) {
		await module.exports.awaitWebRequestPermission();
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
					module.exports.logDatabaseQueries(2, 'utils.js DBOsuForumPosts existingForumPost');
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

							module.exports.logDatabaseQueries(2, 'utils.js DBOsuForumPosts create');
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

							if (logBroadcastEval) {
								// eslint-disable-next-line no-console
								console.log('Broadcasting utils.js new tourney posts to shards...');
							}

							client.shard.broadcastEval(async (c, { message }) => {
								let guildId = '727407178499096597';

								// eslint-disable-next-line no-undef
								if (process.env.SERVER === 'Dev') {
									guildId = '800641468321759242';
								}

								const guild = await c.guilds.cache.get(guildId);

								if (!guild || guild.shardId !== c.shardId) {
									return;
								}

								let channelId = '1062637410594340874';

								// eslint-disable-next-line no-undef
								if (process.env.SERVER === 'Dev') {
									channelId = '1062644551271075930';
								}

								const channel = await guild.channels.cache.get(channelId);

								if (channel) {
									channel.send(message);
								}
							}, { context: { message: `There is a new tournament post: ${uniqueTopics[i]}` } });
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

		let beatmaps = null;
		if (modPool === 'NM') {
			module.exports.logDatabaseQueries(4, 'utils.js getValidTournamentBeatmap NM');
			beatmaps = await DBOsuBeatmaps.findAll({
				attributes: beatmapAttributes,
				where: {
					noModMap: true,
					mode: mode,
					mods: 0,
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
				},
				limit: 2500,
			});
		} else if (modPool === 'HD') {
			module.exports.logDatabaseQueries(4, 'utils.js getValidTournamentBeatmap HD');
			let HDLowerBound = lowerBound - 0.8;
			let HDUpperBound = upperBound - 0.1;
			beatmaps = await DBOsuBeatmaps.findAll({
				attributes: beatmapAttributes,
				where: {
					hiddenMap: true,
					mode: mode,
					mods: 0,
					usedOften: true,
					approvalStatus: {
						[Op.in]: rankedStatus,
					},
					starRating: {
						[Op.and]: {
							[Op.gte]: HDLowerBound,
							[Op.lte]: HDUpperBound,
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
				},
				limit: 2500,
			});
		} else if (modPool === 'HR') {
			module.exports.logDatabaseQueries(4, 'utils.js getValidTournamentBeatmap HR');
			beatmaps = await DBOsuBeatmaps.findAll({
				attributes: beatmapAttributes,
				where: {
					hardRockMap: true,
					mode: mode,
					mods: 16,
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
				},
				limit: 2500,
			});
		} else if (modPool === 'DT') {
			module.exports.logDatabaseQueries(4, 'utils.js getValidTournamentBeatmap DT');
			beatmaps = await DBOsuBeatmaps.findAll({
				attributes: beatmapAttributes,
				where: {
					doubleTimeMap: true,
					mode: mode,
					mods: 64,
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
				},
				limit: 2500,
			});
		} else if (modPool === 'FM') {
			module.exports.logDatabaseQueries(4, 'utils.js getValidTournamentBeatmap FM');
			beatmaps = await DBOsuBeatmaps.findAll({
				attributes: beatmapAttributes,
				where: {
					freeModMap: true,
					mode: mode,
					mods: 0,
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
				},
				limit: 2500,
			});
		}

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
			// 	console.log('Increased SR range to', input.lowerBound, '-', input.upperBound);
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

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuTrackingUsers processOsuTrack');
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

		module.exports.logDatabaseQueries(2, 'utils.js DBOsuTrackingUsers processOsuTrack count');
		let osuTrackQueueLength = await DBOsuTrackingUsers.count({
			where: {
				nextCheck: {
					[Op.lte]: now,
				},
			},
		});

		// eslint-disable-next-line no-undef
		process.send(`osuTrackQueue ${osuTrackQueueLength}`);

		if (osuTracker) {
			let osuUser = { osuUserId: osuTracker.osuUserId };

			// console.log(`Processing osu! track for ${osuTracker.osuUserId}...`);

			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting utils.js osu! track activity to shards...');
			}

			let recentActivities = client.shard.broadcastEval(async (c, { osuUser, lastUpdated }) => {
				const osu = require('node-osu');
				const { Op } = require('sequelize');
				const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
				// eslint-disable-next-line no-undef
				const { DBOsuGuildTrackers, DBOsuMultiScores } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				// eslint-disable-next-line no-undef
				const { getOsuPlayerName, multiToBanchoScore, logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				let recentActivity = false;

				logDatabaseQueries(2, 'utils.js DBOsuGuildTrackers processOsuTrack');
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
					} catch (err) {
						if (err.message === 'Missing Access' || err.message === 'Unknown Channel') {
							await guildTrackers[i].destroy();
							continue;
						}

						console.error(err);
						continue;
					}

					if (guildTrackers[i].medals || guildTrackers[i].osuLeaderboard || guildTrackers[i].taikoLeaderboard || guildTrackers[i].catchLeaderboard || guildTrackers[i].maniaLeaderboard) {
						if (!osuUser.osuUser) {
							// console.log(`Grabbing osu! user for ${osuUser.osuUserId}...`);
							try {
								// eslint-disable-next-line no-undef
								process.send('osu!API');
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
									console.error(err);
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
										let msg = {
											guild: guildTrackers[i].guild,
											channel: guildTrackers[i].channel,
											guildId: guildTrackers[i].guild.id,
											author: {
												id: 0
											}
										};
										let newArgs = [osuUser.osuUser.events[j].beatmapId, osuUser.osuUser.name, `--event${mapRank}`];
										if (modeName !== 'osu!') {
											newArgs.push(`--${modeName.substring(0, 1)}`);
										}
										// eslint-disable-next-line no-undef
										let scoreCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-score.js`);

										// eslint-disable-next-line no-undef
										process.send(`command ${scoreCommand.name}`);

										scoreCommand.execute(msg, newArgs);
										await new Promise(resolve => setTimeout(resolve, 5000));
									}
								}
							}
						}
					}

					if (guildTrackers[i].osuTopPlays) {
						if (guildTrackers[i].osuNumberTopPlays === undefined) {
							// console.log(`Getting osu! top plays for ${osuUser.osuUserId}...`);
							// eslint-disable-next-line no-undef
							process.send('osu!API');
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
							let msg = {
								guild: guildTrackers[i].guild,
								channel: guildTrackers[i].channel,
								guildId: guildTrackers[i].guild.id,
								author: {
									id: 0
								}
							};
							// eslint-disable-next-line no-undef
							let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

							// eslint-disable-next-line no-undef
							process.send(`command ${topCommand.name}`);

							topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].osuNumberTopPlays}`, '--tracking']);
							await new Promise(resolve => setTimeout(resolve, 5000));
						}
					}

					if (guildTrackers[i].taikoTopPlays) {
						if (guildTrackers[i].taikoNumberTopPlays === undefined) {
							// console.log(`Getting taiko top plays for ${osuUser.osuUserId}...`);
							// eslint-disable-next-line no-undef
							process.send('osu!API');
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
							let msg = {
								guild: guildTrackers[i].guild,
								channel: guildTrackers[i].channel,
								guildId: guildTrackers[i].guild.id,
								author: {
									id: 0
								}
							};
							// eslint-disable-next-line no-undef
							let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

							// eslint-disable-next-line no-undef
							process.send(`command ${topCommand.name}`);

							topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].taikoNumberTopPlays}`, '--tracking', '--t']);
							await new Promise(resolve => setTimeout(resolve, 5000));
						}
					}

					if (guildTrackers[i].catchTopPlays) {
						if (guildTrackers[i].catchNumberTopPlays === undefined) {
							// console.log(`Getting catch top plays for ${osuUser.osuUserId}...`);

							// eslint-disable-next-line no-undef
							process.send('osu!API');
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
							let msg = {
								guild: guildTrackers[i].guild,
								channel: guildTrackers[i].channel,
								guildId: guildTrackers[i].guild.id,
								author: {
									id: 0
								}
							};
							// eslint-disable-next-line no-undef
							let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

							// eslint-disable-next-line no-undef
							process.send(`command ${topCommand.name}`);

							topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].catchNumberTopPlays}`, '--tracking', '--c']);
							await new Promise(resolve => setTimeout(resolve, 5000));
						}
					}

					if (guildTrackers[i].maniaTopPlays) {
						if (guildTrackers[i].maniaNumberTopPlays === undefined) {
							// console.log(`Getting mania top plays for ${osuUser.osuUserId}...`);

							// eslint-disable-next-line no-undef
							process.send('osu!API');
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
							let msg = {
								guild: guildTrackers[i].guild,
								channel: guildTrackers[i].channel,
								guildId: guildTrackers[i].guild.id,
								author: {
									id: 0
								}
							};
							// eslint-disable-next-line no-undef
							let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

							// eslint-disable-next-line no-undef
							process.send(`command ${topCommand.name}`);

							topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].maniaNumberTopPlays}`, '--tracking', '--m']);
							await new Promise(resolve => setTimeout(resolve, 5000));
						}
					}

					if (guildTrackers[i].tournamentTopPlays) {
						if (guildTrackers[i].tournamentNumberTopPlays === undefined) {
							// console.log(`Getting tournament top plays for ${osuUser.osuUserId}...`);
							//Get all scores from tournaments
							logDatabaseQueries(2, 'utils.js DBOsuMultiScores processOsuTrack tournamentTopPlays');
							let multiScores = await DBOsuMultiScores.findAll({
								attributes: [
									'id',
									'score',
									'gameRawMods',
									'rawMods',
									'teamType',
									'pp',
									'beatmapId',
									'createdAt',
									'gameStartDate',
									'osuUserId',
									'count50',
									'count100',
									'count300',
									'countGeki',
									'countKatu',
									'countMiss',
									'maxCombo',
									'perfect',
									'matchName',
									'mode',
								],
								where: {
									osuUserId: osuUser.osuUserId,
									mode: 'Standard',
									tourneyMatch: true,
									score: {
										[Op.gte]: 10000
									}
								}
							});

							for (let j = 0; j < multiScores.length; j++) {
								if (parseInt(multiScores[j].score) <= 10000 || multiScores[j].teamType === 'Tag Team vs' || multiScores[j].teamType === 'Tag Co-op') {
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
								multiScores[j] = await multiToBanchoScore(multiScores[j]);

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
							let msg = {
								guild: guildTrackers[i].guild,
								channel: guildTrackers[i].channel,
								guildId: guildTrackers[i].guild.id,
								author: {
									id: 0
								}
							};
							// eslint-disable-next-line no-undef
							let topCommand = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-top.js`);

							// eslint-disable-next-line no-undef
							process.send(`command ${topCommand.name}`);

							topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].tournamentNumberTopPlays}`, '--tracking', '--tournaments']);
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
			}, { context: { osuUser: osuUser, lastUpdated: osuTracker.updatedAt } });

			// console.log(`Finished processing ${osuTracker.osuUserId}...`);

			// wait for either the recentactivities to resolve or reject after a 180s timeout
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					reject();
				}, 180000);

				Promise.all([recentActivities]).then(() => {
					resolve();
				}).catch(() => {
					reject();
				});
			});

			recentActivities = await recentActivities;

			module.exports.logDatabaseQueries(2, 'utils.js DBOsuGuildTrackers processOsuTrack updateActivity');
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
		if (!fs.existsSync('./matchLogs')) {
			fs.mkdirSync('./matchLogs');
		}

		fs.writeFile(`./matchLogs/${matchId}.txt`, matchLog, function (err) {
			if (err) {
				return console.error(err);
			}
		});
	},
	async getMapListCover(beatmapsetId, beatmapId) {
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
				await module.exports.awaitWebRequestPermission();
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
		} catch (err) {
			console.error(err);
		}

		try {
			return await Canvas.loadImage(path);
		} catch (err) {
			return null;
		}
	},
	async getBeatmapCover(beatmapsetId, beatmapId) {
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
				await module.exports.awaitWebRequestPermission();
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
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async getBeatmapSlimcover(beatmapsetId, beatmapId) {
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
				await module.exports.awaitWebRequestPermission();
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
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async getAvatar(osuUserId) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./avatars')) {
			fs.mkdirSync('./avatars');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./avatars/${osuUserId}.png`;

		try {
			// Doesn't exist or older than 24 hours
			if (!fs.existsSync(path) || fs.existsSync(path) && fs.statSync(path).mtime < new Date(new Date().getTime() - 1000 * 60 * 60 * 6)) {
				await module.exports.awaitWebRequestPermission();
				const res = await fetch(`http://s.ppy.sh/a/${osuUserId}`);

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
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async getBadgeImage(badgeName) {
		const fs = require('fs');

		//Check if the maps folder exists and create it if necessary
		if (!fs.existsSync('./badges')) {
			fs.mkdirSync('./badges');
		}

		//Check if the map is already downloaded and download if necessary
		const path = `./badges/${badgeName.replaceAll('/', '_').replaceAll('?', '__')}`;

		try {
			if (!fs.existsSync(path)) {
				await module.exports.awaitWebRequestPermission();
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
		} catch (err) {
			console.error(err);
		}

		return await Canvas.loadImage(path);
	},
	async updateTwitchNames(client) {
		module.exports.logDatabaseQueries(2, 'utils.js DBDiscordUsers updateTwitchNames');
		let twitchUsers = await DBDiscordUsers.findAll({
			attributes: ['id', 'twitchName', 'twitchId'],
			where: {
				twitchId: {
					[Op.not]: null,
				},
			},
		});

		// eslint-disable-next-line no-undef
		let response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
			method: 'POST',
		});

		let json = await response.json();

		let accessToken = json.access_token;

		for (let i = 0; i < twitchUsers.length; i++) {
			await new Promise(resolve => setTimeout(resolve, 5000));
			response = await fetch(`https://api.twitch.tv/helix/users?id=${twitchUsers[i].twitchId}`, {
				headers: {
					// eslint-disable-next-line no-undef
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					// eslint-disable-next-line no-undef
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (response.status === 200) {
				let json = await response.json();
				if (json.data.length > 0) {
					if (twitchUsers[i].twitchName !== json.data[0].login) {
						if (logBroadcastEval) {
							// eslint-disable-next-line no-console
							console.log('Broadcasting utils.js join twitch channel to shards...');
						}

						await client.shard.broadcastEval(async (c, { channelName }) => {
							if (c.shardId === 0) {
								c.twitchClient.join(channelName);
							}
						}, { context: { channelName: json.data[0].login } });
					}

					twitchUsers[i].twitchName = json.data[0].login;
					twitchUsers[i].twitchId = json.data[0].id;
					await twitchUsers[i].save();
				}
			}
		}
	},
	async awaitWebRequestPermission() {
		let randomString = Math.random().toString(36);

		// eslint-disable-next-line no-undef
		process.webRequestsWaiting.push(randomString);


		let iterator = 0;
		// eslint-disable-next-line no-undef
		while (process.webRequestsWaiting.includes(randomString)) {
			//Every 3 seconds send a message to the parent process to let it know that the bot is still waiting for a web request permission
			if (iterator % 100 === 0) {
				// eslint-disable-next-line no-undef
				process.send(`osu! website ${randomString}`);
			}

			await new Promise(resolve => setTimeout(resolve, 100));
			iterator++;
		}

		return;
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
	}
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

async function executeFoundTask(client, bancho, nextTask) {
	try {
		if (nextTask && !module.exports.wrongCluster(client, nextTask.id)) {
			const task = require(`./processQueueTasks/${nextTask.task}.js`);

			await task.execute(client, bancho, nextTask);
		}
	} catch (e) {
		console.error('Error executing process queue task', e);
		if (nextTask.task === 'saveMultiMatches') {
			nextTask.beingExecuted = false;
			await new Promise(resolve => setTimeout(resolve, 10000));
			try {
				await nextTask.save();
			} catch (e) {
				await new Promise(resolve => setTimeout(resolve, 10000));
				await nextTask.save();
			}
		} else {
			console.error('Process Queue entry:', nextTask);
			nextTask.destroy();
		}
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

async function checkWarmup(match, gameIndex, tourneyMatch, sameTournamentMatches, crossCheck) {

	let acronym = match.name.toLowerCase().replace(/:.+/gm, '').trim();

	//Matches without warmups
	if (!tourneyMatch || gameIndex > 1 || acronym === 'etx' || acronym === 'etx teams' || acronym === 'o!mm ranked' || acronym === 'o!mm private' || acronym === 'o!mm team ranked' || acronym === 'o!mm team private' || acronym === 'motd') {
		// console.log('Not a warmup due to naming / map #');
		return { warmup: false, byAmount: false };
	}

	let sameMapSameTournamentScore = null;

	for (let i = 0; i < sameTournamentMatches.length; i++) {
		if (sameTournamentMatches[i].beatmapId == match.games[gameIndex].beatmapId && sameTournamentMatches[i].matchId != match.id) {
			sameMapSameTournamentScore = sameTournamentMatches[i];
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
		let firstMapWarmup = await checkWarmup(match, 0, tourneyMatch, sameTournamentMatches, true);

		//Return not a warmup if the first map was not a warmup
		if (firstMapWarmup.warmup === false) {
			// console.log('Not a warmup due to first map not being a warmup');
			return { warmup: false, byAmount: false };
		}
	}

	//Check if the second map is a warmup
	if (gameIndex === 0 && match.games.length > 1 && !crossCheck) {
		// console.log('Crosscheck for second map warmup:');
		let secondMapWarmup = await checkWarmup(match, 1, tourneyMatch, sameTournamentMatches, true);

		//Return not a warmup if the first map was not a warmup
		if (secondMapWarmup.warmup === true) {
			// console.log('Warmup due to second map being a warmup');
			return { warmup: true, byAmount: false };
		}
	}

	//Check for unique matchIds
	let matchIds = [];
	for (let i = 0; i < sameTournamentMatches.length; i++) {
		if (!matchIds.includes(sameTournamentMatches[i].matchId) && sameTournamentMatches[i].matchId != match.id) {
			matchIds.push(sameTournamentMatches[i].matchId);
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
	score.score = parseFloat(score.score);
	if (score.score < 20000) {
		score.score = 20000;
	} else if (score.score > 950000) {
		score.score = 950000;
	}
	score.starRating = parseFloat(score.starRating);

	let rating = score.starRating;
	let oldRating = 0;

	while (oldRating.toFixed(3) !== rating.toFixed(3)) {
		oldRating = rating;
		rating = applyOsuDuelStarratingCorrection(rating, score, 1);
	}

	return rating;
}

function shuffle(array) {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

async function messageUserWithRetries(user, interaction, content) {
	for (let i = 0; i < 3; i++) {
		try {
			await user.send(content)
				.then(() => {
					i = Infinity;
				})
				.catch(async (error) => {
					throw (error);
				});
		} catch (error) {
			if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
				if (i === 2) {
					if (interaction) {
						interaction.followUp(`[Duel] <@${user.id}>, it seems like I can't DM you in Discord. Please enable DMs so that I can keep you up to date with the match procedure!`);
					}
				} else {
					await new Promise(resolve => setTimeout(resolve, 2500));
				}
			} else {
				i = Infinity;
				console.error(error);
			}
		}
	}
}

async function getOsuMapInfo(dbBeatmap) {
	module.exports.logDatabaseQueries(4, 'utils.js DBOsuMultiScores getOsuMapInfo');
	const mapScores = await DBOsuMultiScores.findAll({
		attributes: ['matchName'],
		where: {
			beatmapId: dbBeatmap.beatmapId,
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

	let tournaments = [];

	for (let i = 0; i < mapScores.length; i++) {
		let acronym = mapScores[i].matchName.replace(/:.+/gm, '');

		if (tournaments.indexOf(acronym) === -1) {
			tournaments.push(acronym);
		}
	}

	return `https://osu.ppy.sh/b/${dbBeatmap.beatmapId} | https://beatconnect.io/b/${dbBeatmap.beatmapsetId} | Map played ${mapScores.length} times in: ${tournaments.join(', ')}`;
}

async function orderMatchPlayers(lobby, channel, players) {
	for (let i = 0; i < players.length; i++) {
		players[i].slot = i;
		let slot = lobby._slots.find(slot => slot && slot.user._id.toString() === players[i].osuUserId);

		//Check if the players are in the correct teams
		if (players.length > 2) {
			let expectedTeam = 'Red';

			if (i >= players.length / 2) {
				expectedTeam = 'Blue';
			}

			if (slot && slot.team !== expectedTeam) {
				channel.sendMessage(`!mp team #${players[i].osuUserId} ${expectedTeam}`);
			}
		}
	}

	//Move players to their slots
	let initialPlayerAmount = players.length;
	let movedSomeone = true;
	let hasEmptySlots = true;
	while (players.length && hasEmptySlots) {
		if (!movedSomeone) {
			//Move someone to last slot if that is empty
			await channel.sendMessage(`!mp move #${players[0].osuUserId} ${initialPlayerAmount + 1}`);
			await new Promise(resolve => setTimeout(resolve, 2000));
		}

		movedSomeone = false;

		//Collect a list of empty slots
		let emptySlots = [];
		for (let i = 0; i < initialPlayerAmount + 1; i++) {
			if (lobby._slots[i] === null) {
				emptySlots.push(i);
			}
		}

		if (emptySlots.length === 0) {
			hasEmptySlots = false;
			continue;
		}

		//Move players to the correct slots
		for (let i = 0; i < players.length; i++) {
			let slotIndex = null;
			for (let j = 0; j < initialPlayerAmount + 1; j++) {
				if (lobby._slots[j] && lobby._slots[j].user._id.toString() === players[i].osuUserId) {
					slotIndex = j;
				}
			}

			if (slotIndex === null) {
				players.splice(i, 1);
				i--;
				continue;
			}

			if (players[i].slot !== slotIndex && emptySlots.includes(players[i].slot)) {
				await channel.sendMessage(`!mp move #${players[i].osuUserId} ${players[i].slot + 1}`);
				await new Promise(resolve => setTimeout(resolve, 2000));
				emptySlots.splice(emptySlots.indexOf(players[i].slot), 1);
				emptySlots.push(slotIndex);
				movedSomeone = true;
			} else if (players[i].slot === slotIndex) {
				players.splice(i, 1);
				i--;
				continue;
			}
		}
	}
}
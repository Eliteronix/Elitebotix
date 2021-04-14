const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue } = require('./dbObjects');
const { prefix } = require('./config.json');

module.exports = {
	getGuildPrefix: async function (msg) {
		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === 'dm') {
			//Set prefix to standard prefix
			guildPrefix = prefix;
		} else {
			//Get guild from the db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
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
					output = output + '.';
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
		let URL = 'https://osu.ppy.sh/assets/images/GradeSmall-D.6b170c4c.svg'; //D Rank

		if (rank === 'XH') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-SS-Silver.6681366c.svg';
		} else if (rank === 'X') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-SS.a21de890.svg';
		} else if (rank === 'SH') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg';
		} else if (rank === 'S') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg';
		} else if (rank === 'A') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg';
		} else if (rank === 'B') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-B.e19fc91b.svg';
		} else if (rank === 'C') {
			URL = 'https://osu.ppy.sh/assets/images/GradeSmall-C.6bb75adc.svg';
		}
		return URL;
	},
	getModImage: function (mod) {
		let URL = 'https://osu.ppy.sh/assets/images/mod_no-mod.d04b9d35.png';

		if (mod === 'NF') {
			URL = 'https://osu.ppy.sh/assets/images/mod_no-fail.ca1a6374.png';
		} else if (mod === 'EZ') {
			URL = 'https://osu.ppy.sh/assets/images/mod_easy.076c7e8c.png';
		} else if (mod === 'HT') {
			URL = 'https://osu.ppy.sh/assets/images/mod_half.3e707fd4.png';
		} else if (mod === 'HR') {
			URL = 'https://osu.ppy.sh/assets/images/mod_hard-rock.52c35a3a.png';
		} else if (mod === 'SD') {
			URL = 'https://osu.ppy.sh/assets/images/mod_sudden-death.d0df65c7.png';
		} else if (mod === 'PF') {
			URL = 'https://osu.ppy.sh/assets/images/mod_perfect.460b6e49.png';
		} else if (mod === 'DT') {
			URL = 'https://osu.ppy.sh/assets/images/mod_double-time.348a64d3.png';
		} else if (mod === 'NC') {
			URL = 'https://osu.ppy.sh/assets/images/mod_nightcore.240c22f2.png';
		} else if (mod === 'HD') {
			URL = 'https://osu.ppy.sh/assets/images/mod_hidden.cfc32448.png';
		} else if (mod === 'FL') {
			URL = 'https://osu.ppy.sh/assets/images/mod_flashlight.be8ff220.png';
		} else if (mod === 'SO') {
			URL = 'https://osu.ppy.sh/assets/images/mod_spun-out.989be71e.png';
		} else if (mod === 'TD') {
			URL = 'https://osu.ppy.sh/assets/images/mod_touchdevice.e5fa4271.png';
		} else if (mod === 'FI') {
			URL = 'https://osu.ppy.sh/assets/images/mod_fader@2x.03843f9a.png';
		} else if (mod === 'MI') {
			URL = 'https://osu.ppy.sh/assets/images/mod_mirror@2x.3f255fca.png';
		} else if (mod === '4K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_4K.fb93bec4.png';
		} else if (mod === '5K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_5K.c5928e1c.png';
		} else if (mod === '6K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_6K.1050cc50.png';
		} else if (mod === '7K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_7K.f8a7b7cc.png';
		} else if (mod === '8K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_8K.13caafe8.png';
		} else if (mod === '9K') {
			URL = 'https://osu.ppy.sh/assets/images/mod_9K.ffde81fe.png';
		}

		return URL;
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

		return mods;
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
	updateOsuDetailsforUser: async function (user, mode) {
		//get discordUser from db to update pp and rank
		DBDiscordUsers.findOne({
			where: { osuUserId: user.id },
		})
			.then(discordUser => {
				if (discordUser && discordUser.osuUserId) {
					discordUser.osuName = user.name;
					if (mode === 0) {
						discordUser.osuPP = user.pp.raw;
						discordUser.osuRank = user.pp.rank;
					} else if (mode === 1) {
						discordUser.taikoPP = user.pp.raw;
						discordUser.taikoRank = user.pp.rank;
					} else if (mode === 2) {
						discordUser.catchPP = user.pp.raw;
						discordUser.catchRank = user.pp.rank;
					} else if (mode === 3) {
						discordUser.maniaPP = user.pp.raw;
						discordUser.maniaRank = user.pp.rank;
					}
					discordUser.save();
				}
			})
			.catch(err => {
				console.log(err);
			});
		return;
	},
	getOsuUserServerMode: async function (msg, args) {
		let server = 'bancho';
		let mode = 0;

		//Check user settings
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		if (discordUser && discordUser.osuMainServer) {
			server = discordUser.osuMainServer;
		}

		if (discordUser && discordUser.osuMainMode) {
			mode = discordUser.osuMainMode;
		}

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--s' || args[i] === '--standard') {
				mode = 0;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--t' || args[i] === '--taiko') {
				mode = 1;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--c' || args[i] === '--catch') {
				mode = 2;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--m' || args[i] === '--mania') {
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
			}

		}
		const outputArray = [discordUser, server, mode];
		return outputArray;
	},
	updateServerUserActivity: async function (msg) {
		if (msg.channel.type !== 'dm') {
			const now = new Date();
			now.setSeconds(now.getSeconds() - 15);
			const serverUserActivity = await DBServerUserActivity.findOne({
				where: { guildId: msg.guild.id, userId: msg.author.id },
			});

			if (serverUserActivity && serverUserActivity.updatedAt < now) {
				msg.channel.messages.fetch({ limit: 100 })
					.then(async (messages) => {
						const messagesArray = messages.filter(m => m.author.id === msg.author.id && m.content === msg.content).array();
						if (!messagesArray[1]) {
							serverUserActivity.points = serverUserActivity.points + 1;
							serverUserActivity.save();
							const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 } });
							if (!existingTask) {
								DBProcessQueue.create({ guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 });
							}
						}
					});
			}

			if (!serverUserActivity) {
				DBServerUserActivity.create({ guildId: msg.guild.id, userId: msg.author.id });
				const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 } });
				if (!existingTask) {
					DBProcessQueue.create({ guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 });
				}
			}
		}
	},
	getMessageUserDisplayname: async function (msg) {
		let userDisplayName = msg.author.username;
		if (msg.channel.type !== 'dm') {
			const guildDisplayName = msg.guild.member(msg.author).displayName;
			if (guildDisplayName) {
				userDisplayName = msg.guild.member(msg.author).displayName;
			}
		}

		return userDisplayName;
	},
	executeNextProcessQueueTask: async function (client) {
		const taskInWork = await DBProcessQueue.findOne({
			where: { beingExecuted: true }
		});
		if (taskInWork) {
			return;
		}
		const nextPriorityTasklevel = await DBProcessQueue.findOne({
			order: [
				['priority', 'DESC']
			]
		});
		if (nextPriorityTasklevel) {
			const nextTask = await DBProcessQueue.findOne({
				where: { priority: nextPriorityTasklevel.priority },
				order: [
					['createdAt', 'ASC']
				]
			});
			try {
				const task = require(`./processQueueTasks/${nextTask.task}.js`);

				nextTask.beingExecuted = true;
				await nextTask.save();

				await task.execute(client, nextTask);

				nextTask.destroy();
			} catch (e) {
				console.log('Error executing process queue task', e);
				console.log('Process Queue entry:', nextTask);
				nextTask.destroy();
			}
		}
	}
};
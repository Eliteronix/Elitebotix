const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBActivityRoles, DBOsuBeatmaps, DBOsuMultiScores, DBBirthdayGuilds, DBOsuTourneyFollows, DBDuelRatingHistory, DBOsuForumPosts, DBOsuTrackingUsers, DBOsuGuildTrackers } = require('./dbObjects');
const { prefix, leaderboardEntriesPerPage, traceDatabaseQueries } = require('./config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const osu = require('node-osu');
const { Op } = require('sequelize');
const { Beatmap, Calculator } = require('rosu-pp');

module.exports = {
	getGuildPrefix: async function (msg) {
		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === 'DM') {
			//Set prefix to standard prefix
			guildPrefix = prefix;
		} else {
			logDatabaseQueriesFunction(3, 'utils.js getGuildPrefix');
			//Get guild from the db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
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
		return humanReadableFunction(input);
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
		return getModsFunction(input);
	},
	getModBits: function (input, noVisualMods) {
		return getModBitsFunction(input, noVisualMods);
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
		return getBeatmapModeIdFunction(beatmap);
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
		logDatabaseQueriesFunction(4, 'utils.js updateOsuDetailsforUser');
		//get discordUser from db to update pp and rank
		DBDiscordUsers.findOne({
			where: { osuUserId: user.id },
		})
			.then(async (discordUser) => {
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
					discordUser.badges = await getOsuBadgeNumberByIdFunction(discordUser.osuUserId);
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

		logDatabaseQueriesFunction(4, 'utils.js getOsuUserServerMode');
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
			if (args[i] === '--s' || args[i].toLowerCase() === '--standard') {
				mode = 0;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--t' || args[i].toLowerCase() === '--taiko') {
				mode = 1;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--c' || args[i].toLowerCase() === '--catch') {
				mode = 2;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--m' || args[i].toLowerCase() === '--mania') {
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
			if (msg.channel.type !== 'DM') {
				const now = new Date();
				now.setSeconds(now.getSeconds() - 15);
				logDatabaseQueriesFunction(3, 'utils.js DBServerUserActivity');
				const serverUserActivity = await DBServerUserActivity.findOne({
					where: { guildId: msg.guildId, userId: msg.author.id },
				});

				if (serverUserActivity && serverUserActivity.updatedAt < now) {
					serverUserActivity.points = serverUserActivity.points + 1;
					await serverUserActivity.save();
					logDatabaseQueriesFunction(3, 'utils.js old updateServerUserActivity activityRoles');
					const activityRoles = await DBActivityRoles.findAll({
						where: { guildId: msg.guildId }
					});
					if (activityRoles.length) {
						logDatabaseQueriesFunction(3, 'utils.js old updateServerUserActivity DBProcessQueue');
						const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (!existingTask) {
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 5);
							await DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
						}
					}
				}

				if (!serverUserActivity) {
					await DBServerUserActivity.create({ guildId: msg.guildId, userId: msg.author.id });
					logDatabaseQueriesFunction(3, 'utils.js new updateServerUserActivity DBProcessQueue');
					const activityRoles = await DBActivityRoles.findAll({
						where: { guildId: msg.guildId }
					});
					if (activityRoles.length) {
						logDatabaseQueriesFunction(3, 'utils.js new updateServerUserActivity DBProcessQueue');
						const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
						if (!existingTask) {
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
		if (msg.channel.type !== 'DM') {
			const member = await msg.guild.members.fetch(msg.author.id);
			const guildDisplayName = member.displayName;
			if (guildDisplayName) {
				userDisplayName = guildDisplayName;
			}
		}

		return userDisplayName;
	},
	executeNextProcessQueueTask: async function (client, bancho) {
		let now = new Date();
		logDatabaseQueriesFunction(1, 'utils.js DBProcessQueue nextTask');
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
			if (!wrongClusterFunction(nextTasks[i].id)) {
				nextTasks[i].beingExecuted = true;
				await nextTasks[i].save();

				executeFoundTask(client, bancho, nextTasks[i]);
				break;
			}
		}
	},
	refreshOsuRank: async function () {
		if (wrongClusterFunction()) {
			return;
		}

		let yesterday = new Date();
		yesterday.setUTCHours(yesterday.getUTCHours() - 24);

		logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: {
					[Op.not]: null
				},
				userId: {
					[Op.not]: null
				},
				updatedAt: {
					[Op.lt]: yesterday
				}
			},
			order: [
				['updatedAt', 'ASC'],
			]
		});

		if (discordUser) {
			logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (!existingTask) {
				let now = new Date();
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId, date: now });
			}
		}

		await new Promise(resolve => setTimeout(resolve, 30000));

		let lastMonth = new Date();
		lastMonth.setUTCDate(lastMonth.getUTCMonth() - 1);

		logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBDiscordUsers 2');
		discordUser = await DBDiscordUsers.findOne({
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
				]
			},
			order: [
				['updatedAt', 'ASC'],
			]
		});

		if (discordUser) {
			logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
			if (!existingTask) {
				let now = new Date();
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId, date: now });
			}
		}
	},
	async createLeaderboard(data, backgroundFile, title, filename, page) {
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
			rows = 2 + Math.floor((data.length - 3) / columns) + 1;
		} else if (data.length > 48) {
			columns = 4;
			rows = 2 + Math.floor((data.length - 3) / columns) + 1;
		} else if (data.length > 33) {
			columns = 3;
			rows = 2 + Math.floor((data.length - 3) / columns) + 1;
		} else if (data.length > 15) {
			columns = 2;
			rows = 2 + Math.floor((data.length - 3) / columns) + 1;
		}
		canvasWidth = canvasWidth * columns;
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
		fitTextOnMiddleCanvasFunction(ctx, title, 35, 'comfortaa, sans-serif', 50, canvas.width, 50);

		// Write the data
		ctx.textAlign = 'center';

		for (let i = 0; i < data.length && dataStart + i < dataEnd; i++) {
			let xPosition = canvas.width / 2;
			let yPositionName = 125 + i * 90;
			let yPositionValue = 160 + i * 90;
			if (columns > 1) {
				if (i + dataStart === 0) {
					xPosition = canvas.width / 2;
				} else if (i + dataStart === 1) {
					if (columns === 2) {
						xPosition = canvas.width / 3;
					} else {
						xPosition = canvas.width / 4;
					}
				} else if (i + dataStart === 2) {
					if (columns === 2) {
						xPosition = (canvas.width / 3) * 2;
					} else {
						xPosition = (canvas.width / 4) * 3;
					}
					yPositionName = 125 + (Math.floor((i - 3) / columns) + 2) * 90;
					yPositionValue = 160 + (Math.floor((i - 3) / columns) + 2) * 90;
				} else {
					if (dataStart === 0) {
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

			ctx.font = 'bold 25px comfortaa, sans-serif';
			ctx.fillText(`${i + 1 + dataStart}. ${data[i].name}`, xPosition, yPositionName);
			ctx.font = '25px comfortaa, sans-serif';
			ctx.fillText(data[i].value, xPosition, yPositionValue);
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
		return new Discord.MessageAttachment(canvas.toBuffer(), filename);
	},
	async getOsuBadgeNumberById(osuUserId) {
		return await getOsuBadgeNumberByIdFunction(osuUserId);
	},
	async restartProcessQueueTask() {
		logDatabaseQueriesFunction(5, 'utils.js restartProcessQueueTask');
		const tasksInWork = await DBProcessQueue.findAll({
			where: { beingExecuted: true }
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
		fitTextOnMiddleCanvasFunction(ctx, beatmap.artist, 40, 'comfortaa, sans-serif', 200, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, beatmap.title, 40, 'comfortaa, sans-serif', 240, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, `Mapper: ${beatmap.creator}`, 40, 'comfortaa, sans-serif', 280, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, `[${beatmap.version}]`, 100, 'comfortaa, sans-serif', 450, canvas.width, 220);
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
		fitTextOnMiddleCanvasFunction(ctx, `Mods: Freemod${doubletimeMod}`, 50, 'comfortaa, sans-serif', 575, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, '(All mods allowed except: Relax, Autopilot, Auto, ScoreV2)', 25, 'comfortaa, sans-serif', 600, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, `Length: ${Math.floor(beatmap.length.total / 60)}:${(beatmap.length.total % 60).toString().padStart(2, '0')}`, 35, 'comfortaa, sans-serif', 700, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, `SR: ${Math.round(beatmap.difficulty.rating * 100) / 100} | ${beatmap.bpm} BPM`, 35, 'comfortaa, sans-serif', 750, canvas.width, 220);
		fitTextOnMiddleCanvasFunction(ctx, `CS ${beatmap.difficulty.size} | HP ${beatmap.difficulty.drain} | OD ${beatmap.difficulty.overall} | AR ${beatmap.difficulty.approach}`, 35, 'comfortaa, sans-serif', 800, canvas.width, 220);

		let today = new Date().toLocaleDateString();

		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

		//Create as an attachment and return
		return new Discord.MessageAttachment(canvas.toBuffer(), `${stagename}.png`);
	}, pause(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	},
	getAccuracy(score, mode) {
		return getAccuracyFunction(score, mode);
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
	async saveOsuMultiScores(match) {
		await saveOsuMultiScoresFunction(match);
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
		return await getOsuBeatmapFunction(input);
	},
	logDatabaseQueries(level, output) {
		logDatabaseQueriesFunction(level, output);
	},
	fitTextOnMiddleCanvas(ctx, text, startingSize, fontface, yPosition, width, widthReduction) {
		return fitTextOnMiddleCanvasFunction(ctx, text, startingSize, fontface, yPosition, width, widthReduction);
	},
	getScoreModpool(dbScore) {
		return getScoreModpoolFunction(dbScore);
	},
	checkForBirthdays(client) {
		return checkForBirthdaysFunction(client);
	},
	async getUserDuelStarRating(input) {
		return await getUserDuelStarRatingFunction(input);
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
	adjustHDStarRating(starRating, approachRate) {
		return adjustHDStarRatingFunction(starRating, approachRate);
	},
	async twitchConnect(bancho) {
		if (wrongClusterFunction()) {
			return;
		}
		bancho.sentRequests = [];
		logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers twitchConnect');
		let twitchSyncUsers = await DBDiscordUsers.findAll({
			where: {
				twitchOsuMapSync: true
			}
		});

		let twitchChannels = [];

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
					logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers twitchConnect 2');
					let discordUser = await DBDiscordUsers.findOne({
						where: {
							twitchName: target.substring(1),
							twitchOsuMapSync: true
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

						let dbBeatmap = await getOsuBeatmapFunction({ beatmapId: map, modBits: 0 });

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
					}
				} catch (error) {
					if (error.message !== 'Currently disconnected!') {
						console.log(error);
					}
				}
			}
		}

		// Called every time the bot connects to Twitch chat
		function onConnectedHandler(addr, port) {
			console.log(`* Connected to ${addr}:${port}`);
		}

		return twitchClient;
	},
	async checkModsCompatibility(input, beatmapId) { //input = mods | beatmapMode needs to be NOT ID
		let beatmap = await getOsuBeatmapFunction({ beatmapId: beatmapId, modBits: input });
		if (beatmap) {
			let mods = getModsFunction(input);
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
	async getOsuPP(beatmapId, modBits, accuracy, misses, combo) {
		return await getOsuPPFunction(beatmapId, modBits, accuracy, misses, combo);
	},
	async multiToBanchoScore(inputScore) {
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
			raw_date: `${inputScore.gameStartDate.getUTCFullYear()}-${(inputScore.gameStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${(inputScore.gameStartDate.getUTCDate()).toString().padStart(2, '0')} ${(inputScore.gameStartDate.getUTCHours()).toString().padStart(2, '0')}:${(inputScore.gameStartDate.getUTCMinutes()).toString().padStart(2, '0')}:${(inputScore.gameStartDate.getUTCSeconds()).toString().padStart(2, '0')}`,
			rank: inputScore.rank,
			pp: inputScore.pp,
			hasReplay: false,
			raw_mods: parseInt(inputScore.gameRawMods) + parseInt(inputScore.rawMods),
			beatmap: undefined,
			matchName: inputScore.matchName,
			mapRank: inputScore.mapRank,
		};

		try {
			if (!outputScore.pp && outputScore.maxCombo) {
				const dbBeatmap = await getOsuBeatmapFunction({ beatmapId: outputScore.beatmapId, modBits: 0 });
				if (dbBeatmap) {
					let pp = await getOsuPPFunction(outputScore.beatmapId, outputScore.raw_mods, getAccuracyFunction(outputScore) * 100, parseInt(outputScore.counts.miss), parseInt(outputScore.maxCombo));
					inputScore.pp = pp;
					inputScore.save();
					outputScore.pp = pp;
				}
			}
		} catch (e) {
			console.log(`Error calculating pp for beatmap ${outputScore.beatmapId}`, e);
		}

		outputScore.rank = calculateGradeFunction(inputScore.mode, outputScore.counts, outputScore.raw_mods);

		return outputScore;
	},
	async cleanUpDuplicateEntries(manually) {
		//Only clean up during the night
		let date = new Date();
		if (date.getUTCHours() > 6 && !manually) {
			return;
		}

		const Sequelize = require('sequelize');

		const sequelize = new Sequelize('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: 'database.sqlite',
			retry: {
				max: 10, // Maximum rety 3 times
				backoffBase: 100, // Initial backoff duration in ms. Default: 100,
				backoffExponent: 1.15, // Exponent to increase backoff each try. Default: 1.1
			},
		});

		// Remove duplicate discorduser entries
		let duplicates = true;
		let deleted = 0;

		while (duplicates && deleted < 25) {
			let result = await sequelize.query(
				'SELECT * FROM DBDiscordUsers WHERE 0 < (SELECT COUNT(1) FROM DBDiscordUsers as a WHERE a.osuUserId = DBDiscordUsers.osuUserId AND a.id <> DBDiscordUsers.id) ORDER BY userId ASC LIMIT 1',
			);

			duplicates = result[0].length;

			if (result[0].length) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers cleanUpDuplicateEntries');
				let duplicate = await DBDiscordUsers.findOne({
					where: {
						id: result[0][0].id
					}
				});

				console.log(duplicate.userId, duplicate.osuUserId, duplicate.updatedAt);

				deleted++;
				await new Promise(resolve => setTimeout(resolve, 2000));
				await duplicate.destroy();
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		console.log(`Cleaned up ${deleted} duplicate users`);

		// // Remove duplicate discorduser entries
		// duplicates = true;
		// deleted = 0;

		// while (duplicates && deleted < 25) {
		// 	console.log(1);
		// 	let result = await sequelize.query(
		// 		'SELECT * FROM DBDuelRatingHistory WHERE 0 < (SELECT COUNT(1) FROM DBDuelRatingHistory as a WHERE a.osuUserId = DBDuelRatingHistory.osuUserId AND a.year = DBDuelRatingHistory.year AND a.month = DBDuelRatingHistory.month AND a.date = DBDuelRatingHistory.date AND a.id <> DBDuelRatingHistory.id) ORDER BY userId ASC LIMIT 1',
		// 	);

		// 	duplicates = result[0].length;

		// 	if (result[0].length) {
		// 		await new Promise(resolve => setTimeout(resolve, 2000));
		// 		logDatabaseQueriesFunction(2, 'utils.js DBDuelRatingHistory cleanUpDuplicateEntries');
		// 		let duplicate = await DBDiscordUsers.findOne({
		// 			where: {
		// 				id: result[0][0].id
		// 			}
		// 		});

		// 		console.log(duplicate.osuUserId, duplicate.date, duplicate.month, duplicate.year, duplicate.updatedAt);

		// 		deleted++;
		// 		await new Promise(resolve => setTimeout(resolve, 2000));
		// 		await duplicate.destroy();
		// 	}
		// 	await new Promise(resolve => setTimeout(resolve, 10000));
		// }

		// console.log(`Cleaned up ${deleted} duplicate duel rating histories`);

		duplicates = true;
		deleted = 0;
		let iterations = 0;

		while (duplicates && iterations < 10) {
			let result = await sequelize.query(
				'SELECT * FROM DBOsuMultiScores WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiScores as a WHERE a.osuUserId = DBOsuMultiScores.osuUserId AND a.matchId = DBOsuMultiScores.matchId AND a.gameId = DBOsuMultiScores.gameId AND a.id <> DBOsuMultiScores.id)',
			);

			iterations++;

			duplicates = result[0].length;

			if (result[0].length) {
				let gameIds = [];
				for (let i = 0; i < result[0].length; i++) {
					if (gameIds.indexOf(`${result[0][i].gameId}-${result[0][i].osuUserId}`) === -1) {
						gameIds.push(`${result[0][i].gameId}-${result[0][i].osuUserId}`);

						await new Promise(resolve => setTimeout(resolve, 2000));

						logDatabaseQueriesFunction(2, 'utils.js DBOsuMultiScores cleanUpDuplicateEntries');
						let duplicate = await DBOsuMultiScores.findOne({
							where: {
								id: result[0][i].id
							}
						});

						deleted++;

						console.log('#', deleted, 'iteration', iterations, 'matchId', duplicate.matchId, 'gameId', duplicate.gameId, 'osuUserId', duplicate.osuUserId, 'matchStartDate', duplicate.matchStartDate, 'updatedAt', duplicate.updatedAt);

						await new Promise(resolve => setTimeout(resolve, 2000));
						await duplicate.destroy();
					}
				}
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		console.log(`Cleaned up ${deleted} duplicate scores`);
	},
	wrongCluster(id) {
		return wrongClusterFunction(id);
	},
	async getDerankStats(discordUser) {
		return await getDerankStatsFunction(discordUser);
	},
	logMatchCreation(client, name, matchId) {
		logMatchCreationFunction(client, name, matchId);
	},
	async syncJiraCards(client) {
		// eslint-disable-next-line no-undef
		if (wrongClusterFunction() || process.env.SERVER !== 'Live') {
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

		const backlogChannel = await client.channels.fetch('1000372560552276028');
		const selectedForDevChannel = await client.channels.fetch('1000372600251351070');
		const inProgressChannel = await client.channels.fetch('1000372630060281856');
		const doneChannel = await client.channels.fetch('1000372653762285708');

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
			const issueEmbed = new Discord.MessageEmbed()
				.setColor(color)
				.setTitle(issues[i].fields.summary)
				.setFooter({ text: `Last updated: ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')} ${updatedDate.getUTCDate().toString().padStart(2, '0')}.${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${updatedDate.getUTCFullYear()}` });

			if (issues[i].fields.assignee) {
				issueEmbed.setAuthor({ name: `Assigned to: ${issues[i].fields.assignee.displayName}`, iconURL: issues[i].fields.assignee.avatarUrls['48x48'] });
			}

			if (issues[i].fields.parent) {
				issueEmbed.addField('Parent', `${issues[i].fields.parent.key} - ${issues[i].fields.parent.fields.summary}`);
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
	},
	async getOsuPlayerName(osuUserId) {
		return await getOsuPlayerNameFunction(osuUserId);
	},
	calculateGrade(mode, counts, modBits) {
		return calculateGradeFunction(mode, counts, modBits);
	},
	async createDuelMatch(client, bancho, interaction, averageStarRating, lowerBound, upperBound, bestOf, onlyRanked, users) {
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

		for (let i = 0; i < users.length; i++) {
			logDatabaseQueriesFunction(4, 'utils.js createDuelMatch DBOsuMultiScores player scores');

			const playerScores = await DBOsuMultiScores.findAll({
				where: {
					osuUserId: users[i].osuUserId,
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

			for (let j = 0; j < playerScores.length; j++) {
				if (playerScores[j].gameStartDate > threeMonthsAgo && !avoidMaps.includes(playerScores[j].beatmapId)) {
					avoidMaps.push(playerScores[j].beatmapId);
				}

				if (beatmapIds.includes(playerScores[j].beatmapId)) {
					beatmaps[beatmapIds.indexOf(playerScores[j].beatmapId)].count++;
				} else {
					beatmapIds.push(playerScores[j].beatmapId);
					beatmaps.push({ beatmapId: playerScores[j].beatmapId, count: 1 });
				}
			}
		}

		// Remove all maps that have not been played by all players
		for (let i = 0; i < beatmaps.length; i++) {
			if (beatmaps[i].count < users.length && !avoidMaps.includes(beatmaps[i].beatmapId)) {
				avoidMaps.push(beatmaps[i].beatmapId);
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
				// console.log('Duel Match: Created match');
				break;
			} catch (error) {
				if (i === 4) {
					if (interaction) {
						return await interaction.editReply('I am having issues creating the lobby and the match has been aborted.\nPlease try again later.');
					} else {
						return console.log('I am having issues creating the lobby and the match has been aborted.');
					}
				} else {
					await new Promise(resolve => setTimeout(resolve, 10000));
				}
			}
		}

		const lobby = channel.lobby;
		logMatchCreationFunction(client, lobby.name, lobby.id);

		const password = Math.random().toString(36).substring(8);

		let matchMessages = [];
		addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', `!mp password ${password}`);
		await lobby.setPassword(password);
		addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', '!mp addref Eliteronix');
		await channel.sendMessage('!mp addref Eliteronix');
		addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', '!mp map 975342 0');
		await channel.sendMessage('!mp map 975342 0');
		if (users.length > 2) {
			addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', `!mp set 2 3 ${users.length + 1}`);
			await channel.sendMessage(`!mp set 2 3 ${users.length + 1}`);
		} else {
			addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', `!mp set 0 3 ${users.length + 1}`);
			await channel.sendMessage(`!mp set 0 3 ${users.length + 1}`);
		}
		addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', '!mp lock');
		await channel.sendMessage('!mp lock');


		let lobbyStatus = 'Joining phase';
		let mapIndex = 0;

		for (let i = 0; i < users.length; i++) {
			addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', `!mp invite #${users[i].osuUserId}`);
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
		addMatchMessageFunction(lobby.id, matchMessages, 'Elitebotix', '!mp timer 300');
		await channel.sendMessage('!mp timer 300');

		let playerIds = users.map(user => user.osuUserId);
		let scores = [0, 0];

		//Add discord messages and also ingame invites for the timers
		channel.on('message', async (msg) => {
			addMatchMessageFunction(lobby.id, matchMessages, msg.user.ircUsername, msg.message);
			if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
				//Banchobot countdown finished
				if (lobbyStatus === 'Joining phase') {
					//Not everyone joined and the lobby will be closed
					await channel.sendMessage('The lobby will be closed as not everyone joined.');
					await new Promise(resolve => setTimeout(resolve, 60000));
					await channel.sendMessage('!mp close');

					return await channel.leave();
				} else if (lobbyStatus === 'Waiting for start') {
					await channel.sendMessage('!mp start 5');
					await new Promise(resolve => setTimeout(resolve, 30000));
					await channel.sendMessage('!mp aborttimer');

					lobbyStatus === 'Map being played';
				}
			}
		});

		lobby.on('playerJoined', async (obj) => {
			orderMatchPlayers(lobby, channel, [...users]);
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
					if (bestOf === 1) {
						nextMap = await getNextMapFunction('TieBreaker', lowerBound, upperBound, onlyRanked, avoidMaps);
					} else {
						nextMap = await getNextMapFunction(modPools[mapIndex], lowerBound, upperBound, onlyRanked, avoidMaps);
					}
					avoidMaps.push(nextMap.beatmapId);

					while (lobby._beatmapId != nextMap.beatmapId) {
						await channel.sendMessage(`!mp map ${nextMap.beatmapId}`);
						await new Promise(resolve => setTimeout(resolve, 5000));
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
			if (lobbyStatus === 'Waiting for start' && playersInLobby === users.length) {
				await channel.sendMessage('!mp start 5');
				await new Promise(resolve => setTimeout(resolve, 30000));
				await channel.sendMessage('!mp aborttimer');

				lobbyStatus === 'Map being played';
			}
		});

		lobby.on('matchFinished', async (results) => {
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

			quicksort(results);

			let scoreTeam1 = 0;
			let scoreTeam2 = 0;

			//If the player is in the first team add to team 1, otherwise add to team 2
			//Create a helper array with the first half of the players
			let firstTeam = team1.map(user => user.osuUserId);

			for (let i = 0; i < results.length; i++) {
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

				await channel.sendMessage(`Bo${bestOf} | ${teamname1}: ${humanReadableFunction(scoreTeam1)} | ${teamname2}: ${humanReadableFunction(scoreTeam2)} | Difference: ${humanReadableFunction(Math.abs(scoreTeam1 - scoreTeam2))} | Winner: ${winner}`);
			} else {
				await channel.sendMessage('!mp close');
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScoresFunction(match);
					})
					.catch(() => {
						//Nothing
					});

				return await channel.leave();
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
				if (scores[0] + scores[1] === bestOf - 1) {
					nextMap = await getNextMapFunction('TieBreaker', lowerBound, upperBound, onlyRanked, avoidMaps);
				} else {
					nextMap = await getNextMapFunction(modPools[mapIndex], lowerBound, upperBound, onlyRanked, avoidMaps);
				}
				try {
					avoidMaps.push(nextMap.beatmapId);
				} catch (err) {
					console.log(mapIndex, modPools[mapIndex], lowerBound, upperBound, onlyRanked, avoidMaps, err);
				}


				while (lobby._beatmapId != nextMap.beatmapId) {
					await channel.sendMessage(`!mp map ${nextMap.beatmapId}`);
					await new Promise(resolve => setTimeout(resolve, 5000));
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

				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScoresFunction(match);

						await new Promise(resolve => setTimeout(resolve, 15000));

						for (let i = 0; i < users.length; i++) {
							let userDuelStarRating = await getUserDuelStarRatingFunction({ osuUserId: users[i].osuUserId, client: client });
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
				await channel.sendMessage('!mp close');

				return await channel.leave();
			}
		});
	},
	async updateQueueChannels(client) {
		let existingQueueTasks = await DBProcessQueue.findAll({
			where: {
				task: 'duelQueue1v1',
			},
		});

		let channelId = '1010093794714189865';
		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Dev') {
			channelId = '1010092736155762818';
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'QA') {
			channelId = '1010093409840660510';
		}

		let channel = await client.channels.fetch(channelId);
		let multipleString = 's';
		if (existingQueueTasks.length === 1) {
			multipleString = '';
		}

		await channel.edit({ name: `1v1 Queue: ${existingQueueTasks.length} user${multipleString}` });
	},
	async createNewForumPostRecords(client) {
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
					let existingForumPost = await DBOsuForumPosts.findOne({
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
							if (titleMatch) {
								title = titleMatch[0].replace('<h1 class="forum-topic-title__title forum-topic-title__title--display">\n', '').trim();

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

							await DBOsuForumPosts.create({
								forumPost: uniqueTopics[i],
								discord: discord,
								host: host,
								title: title,
								format: format,
								rankRange: rankRange,
								gamemode: gamemode,
								posted: posted,
							});

							const eliteronixUser = await client.users.fetch('138273136285057025');
							eliteronixUser.send(`There is a new tournament post: ${uniqueTopics[i]}`);
						});
				}
			});
	},
	async getValidTournamentBeatmap(input) {
		return await getValidTournamentBeatmapFunction(input);
	},
	async processOsuTrack(client) {
		let now = new Date();
		let osuTracker = await DBOsuTrackingUsers.findOne({
			where: {
				nextCheck: {
					[Op.lte]: now,
				},
			},
			order: [
				['nextCheck', 'ASC'],
			],
		});

		if (osuTracker) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let recentActivity = false;

			let osuUser = { osuUserId: osuTracker.osuUserId };

			let guildTrackers = await DBOsuGuildTrackers.findAll({
				where: {
					osuUserId: osuTracker.osuUserId,
				},
			});

			for (let i = 0; i < guildTrackers.length; i++) {
				if (guildTrackers[i].osuLeaderboard || guildTrackers[i].taikoLeaderboard || guildTrackers[i].catchLeaderboard || guildTrackers[i].maniaLeaderboard) {
					if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
						guildTrackers.splice(i, 1);
						i--;
						continue;
					}

					if (!osuUser.osuUser) {
						try {
							let osuUserResult = await osuApi.getUser({ u: osuTracker.osuUserId });
							osuUser.osuUser = osuUserResult;
						} catch (err) {
							if (err.message === 'Not found') {
								await guildTrackers[i].channel.send(`Could not find user \`${osuUser.osuUserId}\` anymore and I will therefore stop tracking them.`);
								await guildTrackers[i].destroy();
								guildTrackers.splice(i, 1);
								i--;
								continue;
							}
						}
					}

					//Grab recent events and send it in
					if (osuUser.osuUser.events.length > 0) {
						for (let j = 0; j < osuUser.osuUser.events.length; j++) {
							//Remove older scores on the map to avoid duplicates
							for (let k = j + 1; k < osuUser.osuUser.events.length; k++) {
								if (osuUser.osuUser.events[j].beatmapId === osuUser.osuUser.events[k].beatmapId) {
									osuUser.osuUser.events.splice(k, 1);
									k--;
								}
							}

							if (guildTrackers[i].medals && !osuUser.medalsData) {
								// Fetch https://osekai.net/medals/api/medals_nogrouping.php
								let medalsData = await fetch('https://osekai.net/medals/api/medals_nogrouping.php');
								medalsData = await medalsData.json();
								osuUser.medalsData = medalsData;
							}

							if (osuUser.osuUser.events[j].html.includes('medal')) {
								if (!guildTrackers[i].medals) {
									continue;
								}

								//This only works if the local timezone is UTC
								if (new Date(osuUser.osuUser.events[j].raw_date) < osuTracker.updatedAt) {
									continue;
								}

								let medalName = osuUser.osuUser.events[j].html.replace('</b>" medal!', '').replace(/.+<b>/gm, '');

								//Find the medal in osuUser.medalsData with the same name
								let medal = osuUser.medalsData.find(medal => medal.name === medalName);

								if (!osuUser.osuName) {
									osuUser.osuName = await getOsuPlayerNameFunction(osuUser.osuUserId);
								}

								let medalEmbed = new Discord.MessageEmbed()
									.setColor('#583DA9')
									.setTitle(`${osuUser.osuName} unlocked the medal ${medalName}`)
									.setThumbnail(medal.link)
									.setDescription(medal.description)
									.addField('Medal Group', medal.grouping);

								if (medal.instructions) {
									medalEmbed.addField('Medal requirements', medal.instructions.replace('<b>', '**').replace('</b>', '**'));
								}

								await guildTrackers[i].channel.send({ embeds: [medalEmbed] });
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
								if (parseInt(mapRank) <= 50 && osuTracker.updatedAt <= new Date(osuUser.osuUser.events[j].raw_date)) {
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
									let scoreCommand = require('./commands/osu-score.js');
									scoreCommand.execute(msg, newArgs);
								}
							}
						}
					}
				}

				if (guildTrackers[i].osuTopPlays) {
					if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
						guildTrackers.splice(i, 1);
						i--;
						continue;
					}

					if (guildTrackers[i].osuNumberTopPlays === undefined) {
						guildTrackers[i].osuNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 0 })
							.then(scores => {
								let recentPlaysAmount = 0;
								for (let j = 0; j < scores.length; j++) {
									//This only works if the local timezone is UTC
									if (osuTracker.updatedAt <= new Date(scores[j].raw_date)) {
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
						recentActivity = true;
						let msg = {
							guild: guildTrackers[i].guild,
							channel: guildTrackers[i].channel,
							guildId: guildTrackers[i].guild.id,
							author: {
								id: 0
							}
						};
						let topCommand = require('./commands/osu-top.js');
						topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].osuNumberTopPlays}`, '--tracking']);
					}
				}

				if (guildTrackers[i].taikoTopPlays) {
					if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
						guildTrackers.splice(i, 1);
						i--;
						continue;
					}

					if (guildTrackers[i].taikoNumberTopPlays === undefined) {
						guildTrackers[i].taikoNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 1 })
							.then(scores => {
								let recentPlaysAmount = 0;
								for (let j = 0; j < scores.length; j++) {
									//This only works if the local timezone is UTC
									if (osuTracker.updatedAt <= new Date(scores[j].raw_date)) {
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
						recentActivity = true;
						let msg = {
							guild: guildTrackers[i].guild,
							channel: guildTrackers[i].channel,
							guildId: guildTrackers[i].guild.id,
							author: {
								id: 0
							}
						};
						let topCommand = require('./commands/osu-top.js');
						topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].taikoNumberTopPlays}`, '--tracking', '--t']);
					}
				}

				if (guildTrackers[i].catchTopPlays) {
					if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
						guildTrackers.splice(i, 1);
						i--;
						continue;
					}

					if (guildTrackers[i].catchNumberTopPlays === undefined) {
						guildTrackers[i].catchNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 2 })
							.then(scores => {
								let recentPlaysAmount = 0;
								for (let j = 0; j < scores.length; j++) {
									//This only works if the local timezone is UTC
									if (osuTracker.updatedAt <= new Date(scores[j].raw_date)) {
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
						recentActivity = true;
						let msg = {
							guild: guildTrackers[i].guild,
							channel: guildTrackers[i].channel,
							guildId: guildTrackers[i].guild.id,
							author: {
								id: 0
							}
						};
						let topCommand = require('./commands/osu-top.js');
						topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].catchNumberTopPlays}`, '--tracking', '--c']);
					}
				}

				if (guildTrackers[i].maniaTopPlays) {
					if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
						guildTrackers.splice(i, 1);
						i--;
						continue;
					}

					if (guildTrackers[i].maniaNumberTopPlays === undefined) {
						guildTrackers[i].maniaNumberTopPlays = await osuApi.getUserBest({ u: osuUser.osuUserId, limit: 100, m: 3 })
							.then(scores => {
								let recentPlaysAmount = 0;
								for (let j = 0; j < scores.length; j++) {
									//This only works if the local timezone is UTC
									if (osuTracker.updatedAt <= new Date(scores[j].raw_date)) {
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
						recentActivity = true;
						let msg = {
							guild: guildTrackers[i].guild,
							channel: guildTrackers[i].channel,
							guildId: guildTrackers[i].guild.id,
							author: {
								id: 0
							}
						};
						let topCommand = require('./commands/osu-top.js');
						topCommand.execute(msg, [osuUser.osuUserId, '--recent', `--${guildTrackers[i].maniaNumberTopPlays}`, '--tracking', '--m']);
					}
				}

				if (guildTrackers[i].osuAmeobea) {
					try {
						if (!guildTrackers[i].osuAmeobeaUpdated) {
							await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=0`, { method: 'POST', body: 'a=1' });
							guildTrackers[i].osuAmeobeaUpdated = true;
							await new Promise(resolve => setTimeout(resolve, 5000));
						}

						if (guildTrackers[i].showAmeobeaUpdates) {
							if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
								guildTrackers.splice(i, 1);
								i--;
								continue;
							}

							if (!osuUser.osuName) {
								osuUser.osuName = await getOsuPlayerNameFunction(osuUser.osuUserId);
							}

							await guildTrackers[i].channel.send(`Ameobea has updated the standard osu!track profile for \`${osuUser.osuName}\`!`);
						}
					} catch (err) {
						//Nothing
					}
				}

				if (guildTrackers[i].taikoAmeobea) {
					try {
						if (!guildTrackers[i].taikoAmeobeaUpdated) {
							await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=1`, { method: 'POST', body: 'a=1' });
							guildTrackers[i].taikoAmeobeaUpdated = true;
							await new Promise(resolve => setTimeout(resolve, 5000));
						}

						if (guildTrackers[i].showAmeobeaUpdates) {
							if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
								guildTrackers.splice(i, 1);
								i--;
								continue;
							}

							if (!osuUser.osuName) {
								osuUser.osuName = await getOsuPlayerNameFunction(osuUser.osuUserId);
							}

							await guildTrackers[i].channel.send(`Ameobea has updated the taiko osu!track profile for \`${osuUser.osuName}\`!`);
						}
					} catch (err) {
						//Nothing
					}
				}

				if (guildTrackers[i].catchAmeobea) {
					try {
						if (!guildTrackers[i].catchAmeobeaUpdated) {
							await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=2`, { method: 'POST', body: 'a=1' });
							guildTrackers[i].catchAmeobeaUpdated = true;
							await new Promise(resolve => setTimeout(resolve, 5000));
						}

						if (guildTrackers[i].showAmeobeaUpdates) {
							if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
								guildTrackers.splice(i, 1);
								i--;
								continue;
							}

							if (!osuUser.osuName) {
								osuUser.osuName = await getOsuPlayerNameFunction(osuUser.osuUserId);
							}

							await guildTrackers[i].channel.send(`Ameobea has updated the catch osu!track profile for \`${osuUser.osuName}\`!`);
						}
					} catch (err) {
						//Nothing
					}
				}

				if (guildTrackers[i].maniaAmeobea) {
					try {
						if (!guildTrackers[i].maniaAmeobeaUpdated) {
							await fetch(`https://osutrack-api.ameo.dev/update?user=${osuUser.osuUserId}&mode=3`, { method: 'POST', body: 'a=1' });
							guildTrackers[i].maniaAmeobeaUpdated = true;
							await new Promise(resolve => setTimeout(resolve, 5000));
						}

						if (guildTrackers[i].showAmeobeaUpdates) {
							if (await fetchChannelIfNeededOrDeleteAndReturnTrue(guildTrackers[i])) {
								guildTrackers.splice(i, 1);
								i--;
								continue;
							}

							if (!osuUser.osuName) {
								osuUser.osuName = await getOsuPlayerNameFunction(osuUser.osuUserId);
							}

							await guildTrackers[i].channel.send(`Ameobea has updated the mania osu!track profile for \`${osuUser.osuName}\`!`);
						}
					} catch (err) {
						//Nothing
					}
				}
			}

			if (recentActivity) {
				osuTracker.minutesBetweenChecks = 15;
			} else {
				osuTracker.minutesBetweenChecks = osuTracker.minutesBetweenChecks + 5;
			}

			let date = new Date();
			date.setMinutes(date.getMinutes() + osuTracker.minutesBetweenChecks);
			osuTracker.nextCheck = date;
			await osuTracker.save();
		}

		async function fetchChannelIfNeededOrDeleteAndReturnTrue(guildTracker) {
			if (guildTracker.channel) {
				return;
			}

			try {
				//Fetch the guild
				guildTracker.guild = await client.guilds.fetch(guildTracker.guildId);

				//Fetch the channel
				guildTracker.channel = await guildTracker.guild.channels.fetch(guildTracker.channelId);
				return;
			} catch (err) {
				if (err.message === 'Missing Access') {
					await guildTracker.destroy();
					return true;
				}
				return;
			}

		}
	},
	async getNextMap(modPool, lowerBound, upperBound, onlyRanked, avoidMaps) {
		return await getNextMapFunction(modPool, lowerBound, upperBound, onlyRanked, avoidMaps);
	},
	async addMatchMessage(matchId, array, user, message) {
		addMatchMessageFunction(matchId, array, user, message);
	}
};

async function getUserDuelStarRatingFunction(input) {
	//Try to get it from tournament data if available
	let userScores;

	let endDate = new Date();
	if (input.date) {
		endDate = input.date;
	}

	let startDate = new Date(endDate);
	startDate.setUTCFullYear(endDate.getUTCFullYear() - 1);

	//Check if it is the last moment of a year
	let completeYear = false;
	if (endDate.getUTCDate() === 31
		&& endDate.getUTCMonth() === 11
		&& endDate.getUTCHours() === 23
		&& endDate.getUTCMinutes() === 59
		&& endDate.getUTCSeconds() === 59
		&& endDate.getUTCMilliseconds() === 999) {
		completeYear = true;
	}

	let duelRatings = {
		total: null,
		noMod: null,
		hidden: null,
		hardRock: null,
		doubleTime: null,
		freeMod: null,
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

	let yearStats = null;
	if (completeYear) {
		logDatabaseQueriesFunction(4, 'utils.js getUserDuelStarRatingFunction DuelRatingHistory');
		yearStats = await DBDuelRatingHistory.findOne({
			where: {
				osuUserId: input.osuUserId,
				year: endDate.getUTCFullYear(),
				month: 12,
				date: 31
			}
		});

		let halfAYearAgo = new Date();
		halfAYearAgo.setUTCMonth(halfAYearAgo.getUTCMonth() - 6);

		if (yearStats && yearStats.updatedAt < halfAYearAgo) {
			await yearStats.destroy();
			yearStats = null;
		}
	}

	if (yearStats) {
		duelRatings.total = yearStats.osuDuelStarRating;
		duelRatings.noMod = yearStats.osuNoModDuelStarRating;
		duelRatings.hidden = yearStats.osuHiddenDuelStarRating;
		duelRatings.hardRock = yearStats.osuHardRockDuelStarRating;
		duelRatings.doubleTime = yearStats.osuDoubleTimeDuelStarRating;
		duelRatings.freeMod = yearStats.osuFreeModDuelStarRating;
		duelRatings.provisional = yearStats.osuDuelProvisional;
		duelRatings.outdated = yearStats.osuDuelOutdated;

		return duelRatings;
	}

	//Get the tournament data either limited by the date
	logDatabaseQueriesFunction(2, 'utils.js DBOsuMultiScores getUserDuelStarRating');
	userScores = await DBOsuMultiScores.findAll({
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
	quicksortGameId(userScores);

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
				if (getScoreModpoolFunction(userScores[i]) === modPools[modIndex]) {
					if (userMapIds.indexOf(userScores[i].beatmapId) === -1) {
						userMapIds.push(userScores[i].beatmapId);
						userMaps.push({ beatmapId: userScores[i].beatmapId, score: parseInt(userScores[i].score), matchId: userScores[i].matchId, matchName: userScores[i].matchName, matchStartDate: userScores[i].matchStartDate, modBits: parseInt(userScores[i].gameRawMods) + parseInt(userScores[i].rawMods) });
					}
				}
			}
		}

		// Get all the maps and fill in their data
		let relevantMaps = [];
		for (let i = 0; i < userMaps.length && i < scoresPerMod + outliersPerMod * 2; i++) {
			//Get the most recent data
			let dbBeatmap = null;
			if (modPools[modIndex] === 'HR') {
				dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: 16 });
			} else if (modPools[modIndex] === 'DT') {
				dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: 64 });
			} else if (modPools[modIndex] === 'FM') {
				let mods = getModsFunction(userMaps[i].modBits);

				if (mods.includes('EZ')) {
					mods.splice(mods.indexOf('EZ'), 1);
				}

				if (mods.length === 0) {
					mods = 0;
				} else {
					mods = getModBitsFunction(mods.join(''));
				}

				dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: mods });
			} else {
				dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: 0 });
			}

			//Filter by ranked maps > 4*
			if (dbBeatmap && parseFloat(dbBeatmap.starRating) > 3.5 && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved')) {
				//Standardize the score from the mod multiplier
				if (modPools[modIndex] === 'HD') {
					userMaps[i].score = userMaps[i].score / 1.06;
				} else if (modPools[modIndex] === 'HR') {
					userMaps[i].score = userMaps[i].score / 1.1;
				} else if (modPools[modIndex] === 'DT') {
					userMaps[i].score = userMaps[i].score / 1.2;
				} else if (modPools[modIndex] === 'FM') {
					if (getModsFunction(userMaps[i].modBits).includes('HD')) {
						userMaps[i].score = userMaps[i].score / 1.06;
					}
					if (getModsFunction(userMaps[i].modBits).includes('HR')) {
						userMaps[i].score = userMaps[i].score / 1.1;
					}
					if (getModsFunction(userMaps[i].modBits).includes('FL')) {
						userMaps[i].score = userMaps[i].score / 1.12;
					}
					if (getModsFunction(userMaps[i].modBits).includes('DT')) {
						userMaps[i].score = userMaps[i].score / 1.2;
					}
					if (getModsFunction(userMaps[i].modBits).includes('EZ')) {
						userMaps[i].score = userMaps[i].score / 0.5;
					}
					if (getModsFunction(userMaps[i].modBits).includes('HT')) {
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

				let mapStarRating = dbBeatmap.starRating;
				if (modPools[modIndex] === 'HD') {
					mapStarRating = adjustHDStarRatingFunction(dbBeatmap.starRating, dbBeatmap.approachRate);
				} else if (modPools[modIndex] === 'FM' && getModsFunction(dbBeatmap.mods).includes('HD') && !getModsFunction(dbBeatmap.mods).includes('DT')) {
					mapStarRating = adjustHDStarRatingFunction(dbBeatmap.starRating, dbBeatmap.approachRate);
				}

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

	//Check the past year for individual ratings and limit a potential drop to .2
	let lastYearStats = await DBDuelRatingHistory.findOne({
		where: {
			osuUserId: input.osuUserId,
			year: endDate.getUTCFullYear() - 1,
			month: 12,
			date: 31
		}
	});

	let halfAYearAgo = new Date();
	halfAYearAgo.setUTCMonth(halfAYearAgo.getUTCMonth() - 6);

	if (lastYearStats && lastYearStats.updatedAt < halfAYearAgo) {
		await lastYearStats.destroy();
		lastYearStats = null;
	}

	if (!lastYearStats && (duelRatings.noMod > 0 || duelRatings.hidden > 0 || duelRatings.hardRock > 0 || duelRatings.doubleTime > 0 || duelRatings.freeMod > 0)) {
		let newEndDate = new Date(endDate);
		newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() - 1);
		newEndDate.setUTCMonth(11);
		newEndDate.setUTCDate(31);
		newEndDate.setUTCHours(23);
		newEndDate.setUTCMinutes(59);
		newEndDate.setUTCSeconds(59);
		newEndDate.setUTCMilliseconds(999);

		let lastYearDuelRating = await getUserDuelStarRatingFunction({ osuUserId: input.osuUserId, client: input.client, date: newEndDate });

		lastYearStats = {
			osuUserId: input.osuUserId,
			osuDuelStarRating: lastYearDuelRating.total,
			osuNoModDuelStarRating: lastYearDuelRating.noMod,
			osuHiddenDuelStarRating: lastYearDuelRating.hidden,
			osuHardRockDuelStarRating: lastYearDuelRating.hardRock,
			osuDoubleTimeDuelStarRating: lastYearDuelRating.doubleTime,
			osuFreeModDuelStarRating: lastYearDuelRating.freeMod,
		};
	} else if (!lastYearStats) {
		lastYearStats = {
			osuUserId: input.osuUserId,
			osuDuelStarRating: null,
			osuNoModDuelStarRating: null,
			osuHiddenDuelStarRating: null,
			osuHardRockDuelStarRating: null,
			osuDoubleTimeDuelStarRating: null,
			osuFreeModDuelStarRating: null,
		};
	}

	//Get the modpool spread out of the past 100 user scores for the total value
	if (duelRatings.noMod || duelRatings.hidden || duelRatings.hardRock || duelRatings.doubleTime || duelRatings.freeMod) {

		if (lastYearStats && lastYearStats.osuNoModDuelStarRating && duelRatings.noMod < lastYearStats.osuNoModDuelStarRating - 0.2) {
			duelRatings.noMod = lastYearStats.osuNoModDuelStarRating - 0.2;
		}

		if (lastYearStats && lastYearStats.osuHiddenDuelStarRating && duelRatings.hidden < lastYearStats.osuHiddenDuelStarRating - 0.2) {
			duelRatings.hidden = lastYearStats.osuHiddenDuelStarRating - 0.2;
		}

		if (lastYearStats && lastYearStats.osuHardRockDuelStarRating && duelRatings.hardRock < lastYearStats.osuHardRockDuelStarRating - 0.2) {
			duelRatings.hardRock = lastYearStats.osuHardRockDuelStarRating - 0.2;
		}

		if (lastYearStats && lastYearStats.osuDoubleTimeDuelStarRating && duelRatings.doubleTime < lastYearStats.osuDoubleTimeDuelStarRating - 0.2) {
			duelRatings.doubleTime = lastYearStats.osuDoubleTimeDuelStarRating - 0.2;
		}

		if (lastYearStats && lastYearStats.osuFreeModDuelStarRating && duelRatings.freeMod < lastYearStats.osuFreeModDuelStarRating - 0.2) {
			duelRatings.freeMod = lastYearStats.osuFreeModDuelStarRating - 0.2;
		}

		//Get ratio of modPools played maps
		const modPoolAmounts = [0, 0, 0, 0, 0];
		for (let i = 0; i < userScores.length && i < 100; i++) {
			modPoolAmounts[modPools.indexOf(getScoreModpoolFunction(userScores[i]))]++;
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

		if (completeYear && !yearStats) {
			//Create the yearStats if they don't exist
			await DBDuelRatingHistory.create({
				osuUserId: input.osuUserId,
				year: endDate.getUTCFullYear(),
				month: endDate.getUTCMonth() + 1,
				date: endDate.getUTCDate(),
				osuDuelStarRating: duelRatings.total,
				osuNoModDuelStarRating: duelRatings.noMod,
				osuHiddenDuelStarRating: duelRatings.hidden,
				osuHardRockDuelStarRating: duelRatings.hardRock,
				osuDoubleTimeDuelStarRating: duelRatings.doubleTime,
				osuFreeModDuelStarRating: duelRatings.freeMod,
				osuDuelProvisional: duelRatings.provisional,
				osuDuelOutdated: duelRatings.outdated,
			});

			let futurePossiblyAffectedDuelRatings = await DBDuelRatingHistory.findAll({
				where: {
					osuUserId: input.osuUserId,
					year: {
						[Op.gt]: endDate.getUTCFullYear()
					}
				}
			});

			for (let i = 0; i < futurePossiblyAffectedDuelRatings.length; i++) {
				await futurePossiblyAffectedDuelRatings[i].destroy();
			}
		}

		//Log the values in the discords if they changed and the user is connected to the bot
		logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers getUserDuelStarRating');
		let discordUser = await DBDiscordUsers.findOne({
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
					const guild = await input.client.guilds.fetch(guildId);
					const channel = await guild.channels.fetch(channelId);
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

					let oldDerankStats = await getDerankStatsFunction(discordUser);
					//Setting the new values even tho it does that later just to get the new derank values
					discordUser.osuDuelStarRating = Math.round(duelRatings.total * 100000000000000) / 100000000000000;
					discordUser.osuNoModDuelStarRating = duelRatings.noMod;
					discordUser.osuHiddenDuelStarRating = duelRatings.hidden;
					discordUser.osuHardRockDuelStarRating = duelRatings.hardRock;
					discordUser.osuDoubleTimeDuelStarRating = duelRatings.doubleTime;
					discordUser.osuFreeModDuelStarRating = duelRatings.freeMod;
					discordUser.osuDuelProvisional = duelRatings.provisional;
					discordUser.osuDuelOutdated = duelRatings.outdated;
					let newDerankStats = await getDerankStatsFunction(discordUser);

					if (oldDerankStats.expectedPpRankOsu !== newDerankStats.expectedPpRankOsu) {
						message.push(`Deranked Rank change: #${oldDerankStats.expectedPpRankOsu} -> #${newDerankStats.expectedPpRankOsu} (${newDerankStats.expectedPpRankOsu - oldDerankStats.expectedPpRankOsu})`);
					}

					if (message.length > 1) {
						channel.send(`\`\`\`${message.join('\n')}\`\`\``);

						if (discordUser.osuDuelRatingUpdates) {
							const user = await input.client.users.fetch(discordUser.userId);
							if (user) {
								user.send(`Your duel ratings have been updated.\`\`\`${message.join('\n')}\`\`\``);
							}
						}

						let guildTrackers = await DBOsuGuildTrackers.findAll({
							where: {
								osuUserId: discordUser.osuUserId,
								duelRating: true,
							},
						});

						for (let i = 0; i < guildTrackers.length; i++) {
							try {
								let guild = await input.client.guilds.fetch(guildTrackers[i].guildId);
								let channel = await guild.channels.fetch(guildTrackers[i].channelId);
								channel.send(`\`\`\`${message.join('\n')}\`\`\``);
							} catch (err) {
								if (err.message === 'Missing Access') {
									await guildTrackers[i].destroy();
								} else {
									console.log(err);
								}
							}
						}
					}
				} catch (e) {
					console.log(e);
				}
			}

			discordUser.osuDuelStarRating = duelRatings.total;
			discordUser.osuNoModDuelStarRating = duelRatings.noMod;
			discordUser.osuHiddenDuelStarRating = duelRatings.hidden;
			discordUser.osuHardRockDuelStarRating = duelRatings.hardRock;
			discordUser.osuDoubleTimeDuelStarRating = duelRatings.doubleTime;
			discordUser.osuFreeModDuelStarRating = duelRatings.freeMod;
			discordUser.osuDuelProvisional = duelRatings.provisional;
			discordUser.osuDuelOutdated = duelRatings.outdated;
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
						console.log(err);
					}
				} else {
					await new Promise(resolve => setTimeout(resolve, 10000));
				}
			});
	}

	let stars = [];
	for (let i = 0; i < topScores.length; i++) {
		//Add difficulty ratings
		const dbBeatmap = await getOsuBeatmapFunction({ beatmapId: topScores[i].beatmapId, modBits: topScores[i].raw_mods });
		if (dbBeatmap && dbBeatmap.starRating && parseFloat(dbBeatmap.starRating) > 0) {
			stars.push(dbBeatmap.starRating);
		}
	}

	let averageStars = 0;
	for (let i = 0; i < stars.length; i++) {
		averageStars += parseFloat(stars[i]);
	}

	duelRatings.total = (averageStars / stars.length) * 0.9;
	duelRatings.noMod = null;
	duelRatings.hidden = null;
	duelRatings.hardRock = null;
	duelRatings.doubleTime = null;
	duelRatings.freeMod = null;

	logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers getUserDuelRatings backup');
	let discordUser = await DBDiscordUsers.findOne({
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
		await discordUser.save();
	}

	return duelRatings;
}

async function logMatchCreationFunction(client, name, matchId) {
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

	const guild = await client.guilds.fetch(guildId);
	const channel = await guild.channels.fetch(channelId);

	channel.send(`https://osu.ppy.sh/mp/${matchId}`);
}

async function getDerankStatsFunction(discordUser) {
	let ppDiscordUsers = await DBDiscordUsers.findAll({
		where: {
			osuUserId: {
				[Op.gt]: 0
			},
			osuPP: {
				[Op.gt]: 0
			},
			osuDuelStarRating: {
				[Op.gt]: 0
			}
		},
		order: [
			['osuPP', 'DESC']
		]
	});

	quicksortOsuPP(ppDiscordUsers);

	let duelDiscordUsers = await DBDiscordUsers.findAll({
		where: {
			osuUserId: {
				[Op.gt]: 0
			},
			osuPP: {
				[Op.gt]: 0
			},
			osuDuelStarRating: {
				[Op.gt]: 0
			}
		},
		order: [
			['osuDuelStarRating', 'DESC']
		]
	});

	let ppRank = null;

	for (let i = 0; i < ppDiscordUsers.length && !ppRank; i++) {
		if (parseFloat(discordUser.osuPP) >= parseFloat(ppDiscordUsers[i].osuPP)) {
			ppRank = i + 1;
		}
	}

	if (!ppRank) {
		ppRank = ppDiscordUsers.length;
	}

	let duelRank = null;

	for (let i = 0; i < duelDiscordUsers.length && !duelRank; i++) {
		if (parseFloat(discordUser.osuDuelStarRating) >= parseFloat(duelDiscordUsers[i].osuDuelStarRating)) {
			duelRank = i + 1;
		}
	}

	if (!duelRank) {
		duelRank = duelDiscordUsers.length + 1;
	}

	if (!discordUser.userId) {
		ppDiscordUsers.length = ppDiscordUsers.length + 1;
		duelDiscordUsers.length = duelDiscordUsers.length + 1;
	}

	let expectedPpRank = Math.round(duelRank / duelDiscordUsers.length * ppDiscordUsers.length);


	let rankOffset = 0;

	if (!discordUser.userId && expectedPpRank > 1) {
		rankOffset = 1;
	}

	let expectedPpRankPercentageDifference = Math.round((100 / ppDiscordUsers.length * ppRank - 100 / ppDiscordUsers.length * expectedPpRank) * 100) / 100;

	let expectedPpRankOsu = ppDiscordUsers[expectedPpRank - 1 - rankOffset].osuRank;

	return {
		ppRank: ppRank,
		ppUsersLength: ppDiscordUsers.length,
		duelRank: duelRank,
		duelUsersLength: duelDiscordUsers.length,
		expectedPpRank: expectedPpRank,
		expectedPpRankPercentageDifference: expectedPpRankPercentageDifference,
		expectedPpRankOsu: expectedPpRankOsu,
		expectedDuelRating: duelDiscordUsers[duelRank - 1 - rankOffset].osuDuelStarRating,
		expectedCurrentDuelRating: duelDiscordUsers[ppRank - 1 - rankOffset].osuDuelStarRating
	};
}

function wrongClusterFunction(id) {
	let clusterAmount = require('os').cpus().length;
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		clusterAmount = 4;
	}

	//Allow the modulo cluster to execute
	// eslint-disable-next-line no-undef
	if (id && id.toString().substring(id.toString().length - 3) % clusterAmount === parseInt(process.env.pm_id)) {
		return false;
	}

	// Allow cluster 0 if no id is provided
	// eslint-disable-next-line no-undef
	if (!id && process.env.pm_id === '0') {
		return false;
	}

	// Else its the wrong cluster
	return true;
}

async function getOsuPPFunction(beatmapId, modBits, accuracy, misses, combo, depth) {
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
	const dbBeatmap = await getOsuBeatmapFunction({ beatmapId: beatmapId, modBits: 0 });

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
		console.error(err);
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

	let map = new Beatmap({ path: `./maps/${beatmapId}.osu` });

	try {
		return new Calculator(arg).performance(map).pp;
	} catch (e) {
		if (depth < 3) {
			const path = `./maps/${beatmapId}.osu`;

			try {
				await fs.unlinkSync(path);
			} catch (err) {
				console.error(err);
			}

			depth++;

			return await getOsuPPFunction(beatmapId, modBits, accuracy, misses, combo, depth);
		} else {
			console.log(`error with map ${beatmapId}`, e);
			return null;
		}
	}
}

async function getOsuBadgeNumberByIdFunction(osuUserId) {
	return await fetch(`https://osu.ppy.sh/users/${osuUserId}/osu`)
		.then(async (res) => {
			let htmlCode = await res.text();
			htmlCode = htmlCode.replace(/&quot;/gm, '"');
			const badgesRegex = /,"badges".+,"beatmap_playcounts_count":/gm;
			const matches = badgesRegex.exec(htmlCode);
			if (matches && matches[0]) {
				const cleanedMatch = matches[0].replace(',"badges":[', '').replace('],"beatmap_playcounts_count":', '');
				const rawBadgesArray = cleanedMatch.split('},{');
				const badgeNameArray = [];
				for (let i = 0; i < rawBadgesArray.length; i++) {
					if (rawBadgesArray[i] !== '') {
						const badgeArray = rawBadgesArray[i].split('","');
						const badgeName = badgeArray[1].replace('description":"', '');
						if (!badgeName.startsWith('Beatmap Spotlights: ')
							&& !badgeName.includes(' contribution to the ')
							&& !badgeName.includes(' contributor')
							&& !badgeName.includes('Mapper\'s Favourite ')
							&& !badgeName.includes('Community Favourite ')
							&& !badgeName.includes('Mapping')
							&& !badgeName.includes('Aspire')
							&& !badgeName.includes('Beatmapping')
							&& !badgeName.includes('osu!idol')
							&& badgeName !== 'The official voice behind osu!'
							&& !badgeName.includes('Newspaper ')
							&& !badgeName.includes('Pending Cup ')) {
							badgeNameArray.push(badgeName);
						}
					}
				}
				return badgeNameArray.length;
			}
			return -1;
		});
}

function fitTextOnMiddleCanvasFunction(ctx, text, startingSize, fontface, yPosition, width, widthReduction) {

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

}

async function checkForBirthdaysFunction(client) {
	//get current date
	const currentDate = new Date();

	if (wrongClusterFunction()) {
		return;
	}

	//get birthday dates from DBBirthdayGuilds for all users in the database that have a birthday set
	logDatabaseQueriesFunction(2, 'utils.js DBBirthdayGuilds checkForBirthdaysFunction');
	let birthdayAnnouncements = await DBBirthdayGuilds.findAll({
		where: {
			birthdayTime: {
				[Op.lte]: currentDate
			},
		}
	});


	// iterate through all users and check if the current date is the same as the birthday date 
	for (let i = 0; i < birthdayAnnouncements.length; i++) {

		//Check if the birthday announcement is enabled on the guild
		logDatabaseQueriesFunction(2, 'utils.js DBGuilds checkForBirthdaysFunction');
		let dbGuild = await DBGuilds.findOne({
			where: {
				guildId: birthdayAnnouncements[i].guildId
			}
		});

		if (dbGuild && dbGuild.birthdayEnabled) {
			//Fetch the channel
			const birthdayMessageChannel = await client.channels.fetch(dbGuild.birthdayMessageChannel);

			if (birthdayMessageChannel) {
				// send a birthday gif from tenor 
				let index;
				// eslint-disable-next-line no-undef
				const birthdayGif = await fetch(`https://api.tenor.com/v1/search?q=anime_birthday&key=${process.env.TENORTOKEN}&limit=30&contentfilter=medium`)
					.then(async (res) => {
						let gifs = await res.json();
						index = Math.floor(Math.random() * gifs.results.length);
						return gifs.results[index].media[0].gif.url;
					});

				// send the birthday message
				birthdayMessageChannel.send(`<@${birthdayAnnouncements[i].userId}> is celebrating their birthday today! :partying_face: :tada:\n${birthdayGif}`);

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
}

async function getOsuBeatmapFunction(input) {
	let beatmapId = input.beatmapId;
	let modBits = 0;
	if (input.modBits) {
		modBits = input.modBits;
	}
	let forceUpdate = false;
	if (input.forceUpdate) {
		forceUpdate = true;
	}

	let lastRework = new Date();
	lastRework.setUTCFullYear(2022);
	lastRework.setUTCMonth(9);
	lastRework.setUTCDate(1);
	lastRework.setUTCHours(0);
	let lastWeek = new Date();
	lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);

	// //Date of reworked EZ values
	// if (getModsFunction(modBits).includes('EZ')) {
	// 	lastRework.setUTCFullYear(2022);
	// 	lastRework.setUTCMonth(2);
	// 	lastRework.setUTCDate(19);
	// }

	// //Date of reworked DT values
	// if (getModsFunction(modBits).includes('DT') || getModsFunction(modBits).includes('NC') || getModsFunction(modBits).includes('HT')) {
	// 	lastRework.setUTCFullYear(2022);
	// 	lastRework.setUTCMonth(7);
	// 	lastRework.setUTCDate(21);
	// }

	// //Date of reworked HR values
	// if (getModsFunction(modBits).includes('HR')) {
	// 	lastRework.setUTCFullYear(2022);
	// 	lastRework.setUTCMonth(7);
	// 	lastRework.setUTCDate(28);
	// }

	// //Date of reworked FL values
	// if (getModsFunction(modBits).includes('FL')) {
	// 	lastRework.setUTCFullYear(2022);
	// 	lastRework.setUTCMonth(7);
	// 	lastRework.setUTCDate(29);
	// }

	let dbBeatmap = null;

	//Repeat up to 3 times if errors appear
	for (let i = 0; i < 3; i++) {
		if (!dbBeatmap) {
			try {
				logDatabaseQueriesFunction(1, 'utils.js getOsuBeatmapFunction');
				dbBeatmap = await DBOsuBeatmaps.findOne({
					where: { beatmapId: beatmapId, mods: modBits }
				});

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
						await fs.unlinkSync(path);
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

					await osuApi.getBeatmaps({ b: beatmapId, mods: modBits })
						.then(async (beatmaps) => {
							let noVisualModBeatmap = beatmaps[0];
							if (getModsFunction(modBits).includes('MI') || getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FI') || getModsFunction(modBits).includes('NF') || getModsFunction(modBits).includes('NC') || getModsFunction(modBits).includes('PF') || getModsFunction(modBits).includes('SD')) {
								let realNoVisualModBeatmap = await getOsuBeatmapFunction({ beatmapId: beatmapId, modBits: getModBitsFunction(getModsFunction(modBits).join(''), true) });
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

							if (getModsFunction(modBits).includes('DT') || getModsFunction(modBits).includes('NC')) {
								bpm = parseFloat(beatmaps[0].bpm) * 1.5;
								drainLength = parseFloat(beatmaps[0].length.drain) / 1.5;
								totalLength = parseFloat(beatmaps[0].length.total) / 1.5;
								let ms;
								if (ar > 5) {
									ms = 200 + (11 - ar) * 100;
								} else ms = 800 + (5 - ar) * 80;

								if (ms < 300) {
									ar = 11;
								} else if (ms < 1200) {
									ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
								} else ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
							} else if (getModsFunction(modBits).includes('HT')) {
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

								bpm = parseFloat(beatmaps[0].bpm) * 0.75;
								drainLength = parseFloat(beatmaps[0].length.drain) / 0.75;
								totalLength = parseFloat(beatmaps[0].length.total) / 0.75;
							}

							//HR
							if (getModsFunction(modBits).includes('HR')) {
								cs = parseFloat(beatmaps[0].difficulty.size) * 1.3;
								ar = parseFloat(beatmaps[0].difficulty.approach) * 1.4;
								od = parseFloat(beatmaps[0].difficulty.overall) * 1.4;
								hpDrain = parseFloat(beatmaps[0].difficulty.drain) * 1.4;
							}

							//Limit AR to 10 if not DT or NC
							if (ar > 10 && !getModsFunction(modBits).includes('DT') && !getModsFunction(modBits).includes('NC')) {
								ar = 10;
							}

							//EZ
							if (getModsFunction(modBits).includes('EZ')) {
								cs = parseFloat(beatmaps[0].difficulty.size) / 2;
								ar = parseFloat(beatmaps[0].difficulty.approach) / 2;
								od = parseFloat(beatmaps[0].difficulty.overall) / 2;
								hpDrain = parseFloat(beatmaps[0].difficulty.drain) / 2;
							}

							cs = Math.min(Math.round(cs * 100) / 100, 10);
							ar = Math.min(Math.round(ar * 100) / 100, 11);
							od = Math.min(Math.round(od * 100) / 100, 10);
							hpDrain = Math.min(Math.round(hpDrain * 100) / 100, 10);

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
								await dbBeatmap.save();
							} else { // Map has to be added new
								//Get the tourney map flags
								let tourneyMap = false;
								let noModMap = false;
								let hiddenMap = false;
								let hardRockMap = false;
								let doubleTimeMap = false;
								let freeModMap = false;

								logDatabaseQueriesFunction(1, 'utils.js DBOsuMultiScores getOsuBeatmapFunction');
								let tourneyScores = await DBOsuMultiScores.findAll({
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
									if (getScoreModpoolFunction(tourneyScores[i]) === 'NM') {
										noModMap = true;
									} else if (getScoreModpoolFunction(tourneyScores[i]) === 'HD') {
										hiddenMap = true;
									} else if (getScoreModpoolFunction(tourneyScores[i]) === 'HR') {
										hardRockMap = true;
									} else if (getScoreModpoolFunction(tourneyScores[i]) === 'DT') {
										doubleTimeMap = true;
									} else if (getScoreModpoolFunction(tourneyScores[i]) === 'FM') {
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
								});
							}
						})
						.catch(async (error) => {
							//Nothing
							//Map is already saved; Delay next check until 7 days
							if (dbBeatmap) {
								dbBeatmap.approvalStatus = 'Not found';
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
	}

	if (dbBeatmap && dbBeatmap.approvalStatus === 'Not found') {
		return null;
	}

	return dbBeatmap;
}

function getModBitsFunction(input, noVisualMods) {
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
		} else if (input.substring(i, i + 2) === 'HD' && !noVisualMods) {
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
}

function getModsFunction(input) {
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
}

async function logDatabaseQueriesFunction(level, output) {
	//Level 5: Log rarely used queries
	//Level 4: Log queries used in commands
	//Level 3: Log queries used in (all) messages
	//Level 2: Log constant periodic queries
	//Level 1: Log all queries
	if (traceDatabaseQueries <= level) {
		console.log('traceDatabaseQueries: ', new Date(), output);
	}

	// Requiring module
	var process = require('process');

	let startTotal = process.memoryUsage().heapTotal / 1000000;

	for (let i = 0; i < 10; i++) {
		await new Promise(resolve => setTimeout(resolve, 1000));

		//if 50MiB increase, log it
		if (startTotal > (process.memoryUsage().heapTotal / 1000000) + 250) {
			console.log('traceDatabaseQueries: ', output, 'Memory usage increased by 250MB', new Date(), process.memoryUsage().heapTotal / 1000000, 'MiB in use right now');
			break;
		}
	}
}

function getScoreModpoolFunction(dbScore) {
	//Evaluate with which mods the game was played
	if (!dbScore.freeMod && dbScore.rawMods === '0' && (dbScore.gameRawMods === '0' || dbScore.gameRawMods === '1')) {
		return 'NM';
	} else if (!dbScore.freeMod && dbScore.rawMods === '0' && (dbScore.gameRawMods === '8' || dbScore.gameRawMods === '9')) {
		return 'HD';
	} else if (!dbScore.freeMod && dbScore.rawMods === '0' && (dbScore.gameRawMods === '16' || dbScore.gameRawMods === '17')) {
		return 'HR';
	} else if (!dbScore.freeMod && dbScore.rawMods === '0' && (dbScore.gameRawMods === '64' || dbScore.gameRawMods === '65' || dbScore.gameRawMods === '576' || dbScore.gameRawMods === '577')) {
		return 'DT';
	} else {
		return 'FM';
	}
}

function partitionGameId(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].gameId) >= parseInt(pivot.gameId)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortGameId(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionGameId(list, start, end);
		quicksortGameId(list, start, p - 1);
		quicksortGameId(list, p + 1, end);
	}
	return list;
}

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

function adjustHDStarRatingFunction(starRating, approachRate) {

	//Adapt starRating from 0.2 to 0.75 depending on the AR for the HD modpool only
	approachRate = parseFloat(approachRate);
	if (approachRate < 7.5) {
		approachRate = 7.5;
	} else if (approachRate > 9) {
		approachRate = 9;
	}

	let starRatingAdjust = (0.55 / 1.5 * Math.abs(approachRate - 9)) + 0.2;

	return parseFloat(starRating) + starRatingAdjust;
}

function getAccuracyFunction(score, mode) {
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
}

function calculateGradeFunction(mode, counts, modBits) {
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
			if (getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FL')) {
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
			if (getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FL')) {
				grade = grade + 'H';
			}
		}

		return grade;
	} else if (mode === 'Catch the Beat') {
		let grade = 'D';

		let accuracy = getAccuracyFunction({ counts: counts }, 2);

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
			if (getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FL')) {
				grade = grade + 'H';
			}
		}

		return grade;
	} else if (mode === 'Mania') {
		let grade = 'D';

		let accuracy = getAccuracyFunction({ counts: counts }, 3);

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
			if (getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FL')) {
				grade = grade + 'H';
			}
		}

		return grade;
	} else {
		return 'D';
	}
}

async function executeFoundTask(client, bancho, nextTask) {
	try {
		if (nextTask && !wrongClusterFunction(nextTask.id)) {
			const task = require(`./processQueueTasks/${nextTask.task}.js`);

			await task.execute(client, bancho, nextTask);
		}
	} catch (e) {
		console.log('Error executing process queue task', e);
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
			console.log('Process Queue entry:', nextTask);
			nextTask.destroy();
		}
	}
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) >= parseFloat(pivot.score)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
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
		let scoreMods = getModsFunction(match.games[gameIndex].scores[i].raw_mods);
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

function partitionOsuPP(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].osuPP) >= parseFloat(pivot.osuPP)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortOsuPP(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionOsuPP(list, start, end);
		quicksortOsuPP(list, start, p - 1);
		quicksortOsuPP(list, p + 1, end);
	}
	return list;
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

	while (oldRating.toFixed(5) !== rating.toFixed(5)) {
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
				console.log(error);
			}
		}
	}
}

async function getOsuMapInfo(dbBeatmap) {
	logDatabaseQueriesFunction(4, 'commands/osu-duel.js DBOsuMultiScores Mapinfo');
	const mapScores = await DBOsuMultiScores.findAll({
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

function humanReadableFunction(input) {
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
}

async function saveOsuMultiScoresFunction(match) {
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

	let tourneyMatchPlayers = [];
	let newMatchPlayers = [];
	let existingMatchPlayers = [];

	let tourneyMatch = false;
	if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
		tourneyMatch = true;
	}

	let acronym = match.name.toLowerCase().replace(/:.+/gm, '').trim();

	let weeksPrior = new Date(match.raw_start);
	weeksPrior.setUTCDate(weeksPrior.getUTCDate() - 14);

	let weeksAfter = new Date(match.raw_start);
	weeksAfter.setUTCDate(weeksAfter.getUTCDate() + 14);

	logDatabaseQueriesFunction(2, 'saveOsuMultiScores.js DBOsuMultiScores warmup detection same tourney');
	let sameTournamentMatches = await DBOsuMultiScores.findAll({
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
				let scoreMods = getModsFunction(match.games[gameIndex].scores[i].raw_mods);
				for (let j = 0; j < scoreMods.length; j++) {
					if (scoreMods[j] === 'HT' || scoreMods[j] === 'DT' || scoreMods[j] === 'NC') {
						scoreMods.splice(j, 1);
						j--;
					}
				}
				scoreMods = getModBitsFunction(scoreMods.join(''));

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
				quicksort(gameScores);

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
				let scoreMods = getModsFunction(match.games[gameIndex].scores[scoreIndex].raw_mods);
				for (let i = 0; i < scoreMods.length; i++) {
					if (scoreMods[i] === 'HT' || scoreMods[i] === 'DT' || scoreMods[i] === 'NC') {
						scoreMods.splice(i, 1);
						i--;
					}
				}
				scoreMods = getModBitsFunction(scoreMods.join(''));

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

					let score = await DBOsuMultiScores.create({
						osuUserId: match.games[gameIndex].scores[scoreIndex].userId,
						matchId: match.id,
						matchName: match.name,
						gameId: match.games[gameIndex].id,
						scoringType: match.games[gameIndex].scoringType,
						mode: match.games[gameIndex].mode,
						beatmapId: match.games[gameIndex].beatmapId,
						tourneyMatch: tourneyMatch,
						evaluation: evaluation,
						score: match.games[gameIndex].scores[scoreIndex].score,
						gameRawMods: match.games[gameIndex].raw_mods,
						rawMods: scoreMods,
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

					//Set the tournament flags on the corresponding beatmap
					if (tourneyMatch && !match.name.startsWith('MOTD:') && warmup === false) {
						logDatabaseQueriesFunction(2, 'saveOsuMultiScores.js DBOsuBeatmaps tourney flags new score');
						let dbBeatmaps = await DBOsuBeatmaps.findAll({
							where: {
								beatmapId: match.games[gameIndex].beatmapId,
							}
						});

						for (let i = 0; i < dbBeatmaps.length; i++) {
							if (!dbBeatmaps[i].tourneyMap) {
								dbBeatmaps[i].tourneyMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}

							if (getScoreModpoolFunction(score) === 'NM' && !dbBeatmaps[i].noModMap) {
								dbBeatmaps[i].noModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(score) === 'HD' && !dbBeatmaps[i].hiddenMap) {
								dbBeatmaps[i].hiddenMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(score) === 'HR' && !dbBeatmaps[i].hardRockMap) {
								dbBeatmaps[i].hardRockMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(score) === 'DT' && !dbBeatmaps[i].doubleTimeMap) {
								dbBeatmaps[i].doubleTimeMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(score) === 'FM' && !dbBeatmaps[i].freeModMap) {
								dbBeatmaps[i].freeModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}
						}
					}

					//Set back warmup flag if it was set by amount
					if (scoreIndex === 0 && tourneyMatch) {
						for (let i = 0; i < sameTournamentMatches.length; i++) {
							if (sameTournamentMatches[i].warmupDecidedByAmount && sameTournamentMatches[i].warmup !== null
								&& sameTournamentMatches[i].beatmapId == match.games[gameIndex].beatmapId
								&& sameTournamentMatches[i].matchId != match.id
								|| sameTournamentMatches[i].warmupDecidedByAmount && sameTournamentMatches[i].warmup === false
								&& sameTournamentMatches[i].matchId != match.id) {
								sameTournamentMatches[i].warmup = null;
								await sameTournamentMatches[i].save();
							}
						}
					}
				} else if (existingScore.warmup === null) {
					if (!existingMatchPlayers.includes(match.games[gameIndex].scores[scoreIndex].userId)) {
						existingMatchPlayers.push(match.games[gameIndex].scores[scoreIndex].userId);
					}

					existingScore.osuUserId = match.games[gameIndex].scores[scoreIndex].userId;
					existingScore.matchId = match.id;
					existingScore.matchName = match.name;
					existingScore.gameId = match.games[gameIndex].id;
					existingScore.scoringType = match.games[gameIndex].scoringType;
					existingScore.mode = match.games[gameIndex].mode;
					existingScore.beatmapId = match.games[gameIndex].beatmapId;
					existingScore.tourneyMatch = tourneyMatch;
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
					existingScore.changed('updatedAt', true);
					await existingScore.save();

					//Set the tournament flags on the corresponding beatmap
					if (tourneyMatch && !match.name.startsWith('MOTD:') && warmup === false) {
						logDatabaseQueriesFunction(2, 'saveOsuMultiScores.js DBOsuBeatmaps tourney flags old score');
						let dbBeatmaps = await DBOsuBeatmaps.findAll({
							where: {
								beatmapId: match.games[gameIndex].beatmapId,
							}
						});

						for (let i = 0; i < dbBeatmaps.length; i++) {
							if (!dbBeatmaps[i].tourneyMap) {
								dbBeatmaps[i].tourneyMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}

							if (getScoreModpoolFunction(existingScore) === 'NM' && !dbBeatmaps[i].noModMap) {
								dbBeatmaps[i].noModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(existingScore) === 'HD' && !dbBeatmaps[i].hiddenMap) {
								dbBeatmaps[i].hiddenMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(existingScore) === 'HR' && !dbBeatmaps[i].hardRockMap) {
								dbBeatmaps[i].hardRockMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(existingScore) === 'DT' && !dbBeatmaps[i].doubleTimeMap) {
								dbBeatmaps[i].doubleTimeMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpoolFunction(existingScore) === 'FM' && !dbBeatmaps[i].freeModMap) {
								dbBeatmaps[i].freeModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}
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

	if (tourneyMatch) {
		//Delete duel rating history entries for the players in the match
		let outdatedDuelRatings = await DBDuelRatingHistory.findAll({
			where: {
				osuUserId: {
					[Op.in]: tourneyMatchPlayers
				},
				year: {
					[Op.gte]: new Date(match.raw_end).getUTCFullYear()
				}
			}
		});

		for (let i = 0; i < outdatedDuelRatings.length; i++) {
			await outdatedDuelRatings[i].destroy();
		}
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
			await DBProcessQueue.create({ task: 'tourneyFollow', priority: 1, additions: `${usersToNotify[i].userId};${match.id};${usersToNotify[i].osuUserIds.join(',')}`, date: now });
		}
	}

	//Manage osu-track follows for guilds
	if (newMatchPlayers.length) {
		//Get all follows for the players in the match
		let guildTrackers = await DBOsuGuildTrackers.findAll({
			where: {
				osuUserId: {
					[Op.in]: newMatchPlayers
				},
				matchActivity: true
			}
		});

		let existingMatchPlayerTrackers = await DBOsuGuildTrackers.findAll({
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
			await DBProcessQueue.create({ task: 'guildTourneyFollow', priority: 1, additions: `${channelsToNotify[i].guildId};${channelsToNotify[i].channelId};${match.id};${channelsToNotify[i].osuUserIds.join(',')};${channelsToNotify[i].trackMatch}`, date: now });
		}
	}
}

async function getValidTournamentBeatmapFunction(input) {
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
	let upperApproach = 10;

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

	//Set if it should only be ranked maps
	let onlyRanked = false;

	if (input.onlyRanked) {
		onlyRanked = input.onlyRanked;
	}

	let beatmaps = null;
	if (modPool === 'NM') {
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				noModMap: true,
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: lowerBound,
						[Op.lte]: upperBound,
					}
				},
				beatmapId: {
					[Op.notIn]: finalAvoidList,
				},
			},
			limit: 2500,
		});
	} else if (modPool === 'HD') {
		let HDLowerBound = lowerBound - 0.8;
		let HDUpperBound = upperBound - 0.1;
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				hiddenMap: true,
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: HDLowerBound,
						[Op.lte]: HDUpperBound,
					}
				},
				beatmapId: {
					[Op.notIn]: finalAvoidList,
				},
			},
			limit: 2500,
		});
	} else if (modPool === 'HR') {
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				hardRockMap: true,
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: lowerBound,
						[Op.lte]: upperBound,
					}
				},
				beatmapId: {
					[Op.notIn]: finalAvoidList,
				},
			},
			limit: 2500,
		});
	} else if (modPool === 'DT') {
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				doubleTimeMap: true,
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: lowerBound,
						[Op.lte]: upperBound,
					}
				},
				beatmapId: {
					[Op.notIn]: finalAvoidList,
				},
			},
			limit: 2500,
		});
	} else if (modPool === 'FM') {
		beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				freeModMap: true,
				mode: mode,
				approvalStatus: {
					[Op.not]: 'Not found',
				},
				starRating: {
					[Op.and]: {
						[Op.gte]: lowerBound,
						[Op.lte]: upperBound,
					}
				},
				beatmapId: {
					[Op.notIn]: finalAvoidList,
				},
			},
			limit: 2500,
		});
	}

	console.log('Found', beatmaps.length, 'maps');

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
		console.log('Increased SR range to', input.lowerBound, '-', input.upperBound);
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
			randomBeatmap = await getOsuBeatmapFunction({ beatmapId: randomBeatmap.beatmapId, modBits: 0 });
		} else if (modPool == 'HD') {
			randomBeatmap = await getOsuBeatmapFunction({ beatmapId: randomBeatmap.beatmapId, modBits: 0 });

			if (!randomBeatmap) {
				beatmaps.splice(index, 1);
				continue;
			}

			randomBeatmap.starRating = adjustHDStarRatingFunction(randomBeatmap.starRating, randomBeatmap.approachRate);
		} else if (modPool == 'HR') {
			randomBeatmap = await getOsuBeatmapFunction({ beatmapId: randomBeatmap.beatmapId, modBits: 16 });
		} else if (modPool == 'DT') {
			randomBeatmap = await getOsuBeatmapFunction({ beatmapId: randomBeatmap.beatmapId, modBits: 64 });
		} else if (modPool == 'FM') {
			randomBeatmap = await getOsuBeatmapFunction({ beatmapId: randomBeatmap.beatmapId, modBits: 0 });
		}

		if (!randomBeatmap) {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Not available');
			input.alreadyCheckedOther.push(beatmapId);
			continue;
		}

		//Check drain length
		if (parseInt(randomBeatmap.drainLength) > upperDrain || parseInt(randomBeatmap.drainLength) < lowerDrain) {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Drain length out of bounds');
			input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
			continue;
		}

		//Check the approach rate
		if (parseFloat(randomBeatmap.approachRate) > upperApproach || parseFloat(randomBeatmap.approachRate) < lowerApproach) {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Approach rate out of bounds');
			input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
			continue;
		}

		//Check the circle size
		if (parseFloat(randomBeatmap.circleSize) > upperCircleSize || parseFloat(randomBeatmap.circleSize) < lowerCircleSize) {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Circle size out of bounds');
			input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
			continue;
		}

		//Check ranked status
		if (onlyRanked && randomBeatmap.approvalStatus !== 'Ranked') {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Not ranked');
			input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
			continue;
		}

		//Check star rating
		if (randomBeatmap.starRating > upperBound || randomBeatmap.starRating < lowerBound) {
			beatmaps.splice(index, 1);
			console.log('Map Selection: Star rating out of bounds', randomBeatmap.starRating);
			input.alreadyCheckedSR.push(randomBeatmap.beatmapId);
			continue;
		}

		//Check usage
		if (randomBeatmap.usedOften) {
			console.log('Map Selection: Used often');

			//Deep clone beatmap, use proper library if you ever need dates or functions of the beatmap or just refetch from the database
			let clone = JSON.parse(JSON.stringify(randomBeatmap));
			beatmaps = null;
			return clone;
		}

		const mapScoreAmount = await DBOsuMultiScores.count({
			where: {
				beatmapId: randomBeatmap.beatmapId,
				tourneyMatch: true,
				matchName: {
					[Op.notLike]: 'MOTD:%',
				},
				[Op.or]: [
					{ warmup: false },
					{ warmup: null }
				],
			},
			limit: 51,
		});

		if (mapScoreAmount < 50) {
			console.log('Map Selection: Not used often');
			beatmaps.splice(index, 1);
			input.alreadyCheckedOther.push(randomBeatmap.beatmapId);
			continue;
		}

		console.log('Map Selection: Now used often');
		randomBeatmap.usedOften = true;
		await randomBeatmap.save();
		//Deep clone beatmap, use proper library if you ever need dates or functions of the beatmap or just refetch from the database
		let clone = JSON.parse(JSON.stringify(randomBeatmap));
		beatmaps = null;
		return clone;
	}

	console.log('Map Selection: None found - Going again');
	//Return null
	return await getValidTournamentBeatmapFunction(input);
}

function getBeatmapModeIdFunction(beatmap) {
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
}

async function getNextMapFunction(modPool, lowerBound, upperBound, onlyRanked, avoidMaps) {
	let nextMap = null;
	if (modPool === 'NM') {
		nextMap = await getValidTournamentBeatmapFunction({
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
			nextMap = await getValidTournamentBeatmapFunction({
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
			nextMap = await getValidTournamentBeatmapFunction({
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
			nextMap = await getValidTournamentBeatmapFunction({
				modPool: 'HR',
				lowerBound: lowerBound,
				upperBound: upperBound,
				mode: 'Standard',
				upperDrain: 270,
				lowerDrain: 100,
				lowerCircleSize: 3.8,
				upperCircleSize: 4.6,
				avoidMaps: avoidMaps,
				onlyRanked: onlyRanked,
			});
		} else {
			//30% HR2
			nextMap = await getValidTournamentBeatmapFunction({
				modPool: 'HR',
				lowerBound: lowerBound,
				upperBound: upperBound,
				mode: 'Standard',
				upperDrain: 270,
				lowerDrain: 100,
				lowerCircleSize: 5,
				avoidMaps: avoidMaps,
				onlyRanked: onlyRanked,
			});
		}
	}

	if (modPool === 'DT') {
		nextMap = await getValidTournamentBeatmapFunction({
			modPool: 'DT',
			lowerBound: lowerBound,
			upperBound: upperBound,
			mode: 'Standard',
			upperDrain: 405,
			lowerDrain: 120,
			avoidMaps: avoidMaps,
			onlyRanked: onlyRanked,
		});
	}

	if (modPool === 'FreeMod' || modPool === 'FM') {
		if (Math.random() > 0.5) {
			//50% FM2
			nextMap = await getValidTournamentBeatmapFunction({
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
			nextMap = await getValidTournamentBeatmapFunction({
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
		nextMap = await getValidTournamentBeatmapFunction({
			modPool: 'FM',
			lowerBound: lowerBound,
			upperBound: upperBound,
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
		nextMap = await getNextMapFunction(modPool, lowerBound, upperBound, onlyRanked, avoidMaps);
	}

	return nextMap;
}

async function getOsuPlayerNameFunction(osuUserId) {
	let playerName = osuUserId;
	logDatabaseQueriesFunction(4, 'utils.js getOsuPlayerName');
	let discordUser = await DBDiscordUsers.findOne({
		where: { osuUserId: osuUserId }
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
}

async function addMatchMessageFunction(matchId, array, user, message) {
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
			return console.log(err);
		}
	});
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
	while (players.length) {
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
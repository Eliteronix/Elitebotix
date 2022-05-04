const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBActivityRoles, DBOsuBeatmaps, DBOsuMultiScores, DBBirthdayGuilds } = require('./dbObjects');
const { prefix, leaderboardEntriesPerPage, traceDatabaseQueries } = require('./config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const osu = require('node-osu');
const { Op } = require('sequelize');

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
					await msg.channel.messages.fetch({ limit: 100 })
						.then(async (messages) => {
							const lastMessage = messages.filter(m => m.author.id === msg.author.id && m.content === msg.content).last();
							if (lastMessage && msg.id === lastMessage.id) {
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
						});
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
		let nextTask = await DBProcessQueue.findOne({
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

		if (nextTask && !wrongClusterFunction(nextTask.id)) {
			nextTask.beingExecuted = true;
			await nextTask.save();

			executeFoundTask(client, bancho, nextTask);
		}

	},
	refreshOsuRank: async function () {
		if (wrongClusterFunction()) {
			return;
		}

		let date = new Date();
		date.setUTCHours(date.getUTCHours() - 24);

		logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: {
					[Op.not]: null
				},
				updatedAt: {
					[Op.lt]: date
				}
			},
			order: [
				['updatedAt', 'ASC'],
			]
		});

		if (discordUser) {
			logDatabaseQueriesFunction(2, 'utils.js refreshOsuRank DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.userId } });
			if (!existingTask) {
				let now = new Date();
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.userId, date: now });
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
				matchName: {
					[Op.like]: `${acronym}:%`,
				},
				gameStartDate: {
					[Op.gte]: weeksPrior
				},
				gameEndDate: {
					[Op.lte]: weeksAfter
				},
				tourneyMatch: true
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
					}
				} catch (error) {
					scoreIndex--;
				}
			}
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
		return await getOsuBeatmapFunction(input);
	},
	async getMatchesPlanned(startDate, endDate) {
		let matchesPlanned = 0;
		if (startDate.getUTCHours() <= 18 && endDate.getUTCHours() >= 18) {
			matchesPlanned += 2;
		}

		logDatabaseQueriesFunction(4, 'utils.js getMatchesPlanned DBProcessQueue tourneyMatchNotification');
		const tourneyMatchNotifications = await DBProcessQueue.findAll({
			where: { task: 'tourneyMatchNotification' }
		});

		for (let i = 0; i < tourneyMatchNotifications.length; i++) {
			const plannedStartDate = tourneyMatchNotifications[i].date;

			const additions = tourneyMatchNotifications[i].additions.split(';');

			const maps = additions[2].split(',');
			let plannedMatchLength = 1200 + 60 + 180 + 600; //Set to forfeit time by default + 1 end minute + 3 extra minutes backup + 10 minutes to make sure its in limits

			for (let i = 0; i < maps.length; i++) {
				logDatabaseQueriesFunction(4, 'utils.js getMatchesPlanned DBProcessQueue tourneyMatchNotification DBOsuBeatmaps');
				const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
					where: { id: maps[i] }
				});
				plannedMatchLength += parseInt(dbOsuBeatmap.totalLength) + 120;
			}

			let plannedEndDate = new Date();
			plannedEndDate.setUTCFullYear(plannedStartDate.getUTCFullYear());
			plannedEndDate.setUTCMonth(plannedStartDate.getUTCMonth());
			plannedEndDate.setUTCDate(plannedStartDate.getUTCDate());
			plannedEndDate.setUTCHours(plannedStartDate.getUTCHours());
			plannedEndDate.setUTCMinutes(plannedStartDate.getUTCMinutes());
			plannedEndDate.setUTCSeconds(0);
			plannedEndDate.setUTCSeconds(plannedMatchLength);

			if (startDate >= plannedStartDate && startDate <= plannedEndDate
				|| endDate >= plannedStartDate && endDate <= plannedEndDate
				|| startDate <= plannedStartDate && endDate >= plannedEndDate) {
				matchesPlanned++;
			}
		}

		logDatabaseQueriesFunction(4, 'utils.js getMatchesPlanned DBProcessQueue tourneyMatchReferee');
		const tourneyMatchReferees = await DBProcessQueue.findAll({
			where: { task: 'tourneyMatchReferee' }
		});

		for (let i = 0; i < tourneyMatchReferees.length; i++) {
			const plannedStartDate = tourneyMatchReferees[i].date;
			plannedStartDate.setUTCMinutes(plannedStartDate.getUTCMinutes() - 5);

			const additions = tourneyMatchReferees[i].additions.split(';');

			const maps = additions[2].split(',');
			let plannedMatchLength = 1200 + 60 + 180 + 600; //Set to forfeit time by default + 1 end minute + 3 extra minutes backup + 10 minutes to make sure its in limits

			for (let i = 0; i < maps.length; i++) {
				logDatabaseQueriesFunction(4, 'utils.js getMatchesPlanned DBProcessQueue tourneyMatchReferee DBOsuBeatmaps');
				const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
					where: { id: maps[i] }
				});
				plannedMatchLength += parseInt(dbOsuBeatmap.totalLength) + 120;
			}

			let plannedEndDate = new Date();
			plannedEndDate.setUTCFullYear(plannedStartDate.getUTCFullYear());
			plannedEndDate.setUTCMonth(plannedStartDate.getUTCMonth());
			plannedEndDate.setUTCDate(plannedStartDate.getUTCDate());
			plannedEndDate.setUTCHours(plannedStartDate.getUTCHours());
			plannedEndDate.setUTCMinutes(plannedStartDate.getUTCMinutes());
			plannedEndDate.setUTCSeconds(0);
			plannedEndDate.setUTCSeconds(plannedMatchLength);

			if (startDate >= plannedStartDate && startDate <= plannedEndDate
				|| endDate >= plannedStartDate && endDate <= plannedEndDate
				|| startDate <= plannedStartDate && endDate >= plannedEndDate) {
				matchesPlanned++;
			}
		}

		logDatabaseQueriesFunction(4, 'utils.js getMatchesPlanned DBProcessQueue customMOTD');
		const customMOTDs = await DBProcessQueue.findAll({
			where: { task: 'customMOTD' }
		});

		for (let i = 0; i < customMOTDs.length; i++) {
			const plannedStartDate = customMOTDs[i].date;

			let plannedEndDate = new Date();
			plannedEndDate.setUTCFullYear(plannedStartDate.getUTCFullYear());
			plannedEndDate.setUTCMonth(plannedStartDate.getUTCMonth());
			plannedEndDate.setUTCDate(plannedStartDate.getUTCDate());
			plannedEndDate.setUTCHours(plannedStartDate.getUTCHours());
			plannedEndDate.setUTCMinutes(plannedStartDate.getUTCMinutes());
			plannedEndDate.setUTCSeconds(0);
			plannedEndDate.setUTCSeconds(customMOTDs[i].additions);

			if (startDate >= plannedStartDate && startDate <= plannedEndDate
				|| endDate >= plannedStartDate && endDate <= plannedEndDate
				|| startDate <= plannedStartDate && endDate >= plannedEndDate) {
				matchesPlanned++;
			}
		}

		return matchesPlanned;
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
		//Try to get it from tournament data if available
		let userScores;

		//Get the tournament data either limited by the date or everything
		if (input.date) {
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
					gameEndDate: {
						[Op.lte]: input.date
					},
				}
			});
		} else {
			logDatabaseQueriesFunction(2, 'utils.js DBOsuMultiScores getUserDuelStarRating2');
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
				}
			});
		}

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

		//Sort it by match ID
		quicksortMatchId(userScores);

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
			outdated: outdated
		};

		let scoresPerMod = 35;

		let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];

		//Loop through all modpools
		for (let modIndex = 0; modIndex < modPools.length; modIndex++) {
			//Get only unique maps for each modpool
			const checkedMapIds = [];
			const userMapIds = [];
			const userMaps = [];
			for (let i = 0; i < userScores.length; i++) {
				if (checkedMapIds.indexOf(userScores[i].beatmapId) === -1 && parseInt(userScores[i].score) > 10000) {
					checkedMapIds.push(userScores[i].beatmapId);
					if (getScoreModpoolFunction(userScores[i]) === modPools[modIndex]) {
						if (userMapIds.indexOf(userScores[i].beatmapId) === -1) {
							userMapIds.push(userScores[i].beatmapId);
							userMaps.push({ beatmapId: userScores[i].beatmapId, score: parseInt(userScores[i].score), matchId: userScores[i].matchId, matchName: userScores[i].matchName, matchStartDate: userScores[i].matchStartDate, modBits: parseInt(userScores[i].gameRawMods) + parseInt(userScores[i].rawMods) });
						}
					}
				}
			}

			//Group the maps into steps of 0.1 of difficulty
			const steps = [];
			const stepData = [];
			for (let i = 0; i < userMaps.length && i < scoresPerMod; i++) {
				//Get the most recent data
				let dbBeatmap = null;
				if (modPools[modIndex] === 'HR') {
					dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: 16 });
				} else if (modPools[modIndex] === 'DT') {
					dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: 64 });
				} else if (modPools[modIndex] === 'FM') {
					dbBeatmap = await getOsuBeatmapFunction({ beatmapId: userMaps[i].beatmapId, modBits: userMaps[i].modBits });
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

					userMaps[i].weight = Math.abs(overPerformWeight + underPerformWeight - 1);

					let mapStarRating = dbBeatmap.starRating;
					if (modPools[modIndex] === 'HD') {
						mapStarRating = adjustHDStarRatingFunction(dbBeatmap.starRating, dbBeatmap.approachRate);
					} else if (modPools[modIndex] === 'FM' && getModsFunction(dbBeatmap.mods).includes('HD') && !getModsFunction(dbBeatmap.mods).includes('DT')) {
						mapStarRating = adjustHDStarRatingFunction(dbBeatmap.starRating, dbBeatmap.approachRate);
					}

					userMaps[i].starRating = mapStarRating;

					//Add the map to the scores array
					if (modIndex === 0) {
						duelRatings.scores.NM.push(userMaps[i]);
					} else if (modIndex === 1) {
						duelRatings.scores.HD.push(userMaps[i]);
					} else if (modIndex === 2) {
						duelRatings.scores.HR.push(userMaps[i]);
					} else if (modIndex === 3) {
						duelRatings.scores.DT.push(userMaps[i]);
					} else if (modIndex === 4) {
						duelRatings.scores.FM.push(userMaps[i]);
					}

					//Add the data to the 5 steps in the area of the maps' star rating -> 5.0 will be representing 4.8, 4.9, 5.0, 5.1, 5.2
					for (let i = 0; i < 5; i++) {
						let starRatingStep = Math.round((Math.round(mapStarRating * 10) / 10 + 0.1 * i - 0.2) * 10) / 10;
						if (steps.indexOf(starRatingStep) === -1) {
							stepData.push({
								step: starRatingStep,
								totalOverPerformWeight: overPerformWeight,
								totalUnderPerformWeight: underPerformWeight,
								amount: 1,
								averageOverPerformWeight: overPerformWeight,
								averageUnderPerformWeight: underPerformWeight,
								averageWeight: Math.abs(((overPerformWeight + underPerformWeight) / 1) - 1),
								overPerformWeightedStarRating: (starRatingStep) * overPerformWeight,
								underPerformWeightedStarRating: (starRatingStep) * underPerformWeight,
								weightedStarRating: (starRatingStep) * Math.abs(((overPerformWeight + underPerformWeight) / 1) - 1),
							});
							steps.push(starRatingStep);
						} else {
							stepData[steps.indexOf(starRatingStep)].totalOverPerformWeight += overPerformWeight;
							stepData[steps.indexOf(starRatingStep)].totalUnderPerformWeight += underPerformWeight;
							stepData[steps.indexOf(starRatingStep)].amount++;
							stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight = stepData[steps.indexOf(starRatingStep)].totalOverPerformWeight / stepData[steps.indexOf(starRatingStep)].amount;
							stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight = stepData[steps.indexOf(starRatingStep)].totalUnderPerformWeight / stepData[steps.indexOf(starRatingStep)].amount;
							stepData[steps.indexOf(starRatingStep)].averageWeight = Math.abs(stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight + stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight - 1);
							stepData[steps.indexOf(starRatingStep)].overPerformWeightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageOverPerformWeight;
							stepData[steps.indexOf(starRatingStep)].underPerformWeightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageUnderPerformWeight;
							stepData[steps.indexOf(starRatingStep)].weightedStarRating = stepData[steps.indexOf(starRatingStep)].step * stepData[steps.indexOf(starRatingStep)].averageWeight;
						}
					}
				} else {
					userMaps.splice(i, 1);
					i--;
				}
			}

			//Calculated the starrating for the modpool
			let totalWeight = 0;
			let totalWeightedStarRating = 0;
			for (let i = 0; i < stepData.length; i++) {
				if (stepData[i].amount > 1) {
					totalWeight += stepData[i].averageWeight;
					totalWeightedStarRating += stepData[i].weightedStarRating;
				}
			}

			if (userMaps.length < 5) {
				duelRatings.provisional = true;
			}

			//add the values to the modpool data
			if (totalWeight > 0 && userMaps.length > 0) {
				let weightedStarRating = totalWeightedStarRating / totalWeight;

				for (let i = 0; i < scoresPerMod; i++) {
					weightedStarRating = applyOsuDuelStarratingCorrection(weightedStarRating, userMaps[i % userMaps.length], Math.round((1 - (i * 1 / scoresPerMod)) * 100) / 100);
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

		//Get the modpool spread out of the past 100 user scores for the total value
		if (duelRatings.noMod || duelRatings.hidden || duelRatings.hardRock || duelRatings.doubleTime || duelRatings.freeMod) {
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

			//Log the values in the discords if they changed and the user is connected to the bot
			logDatabaseQueriesFunction(2, 'utils.js DBDiscordUsers getUserDuelStarRating');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					osuUserId: input.osuUserId
				}
			});
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
						let message = [`${discordUser.osuName}:`];
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
						if (message.length > 1) {
							channel.send(`\`\`\`${message.join('\n')}\`\`\``);
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
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: input.osuUserId
			}
		});
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

					if (discordUser) {
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

						await IRCUser.sendMessage(`${prefix}${context['display-name']} -> https://osu.ppy.sh/b/${dbBeatmap.beatmapId} [${dbBeatmap.approvalStatus}] ${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}] (mapped by ${dbBeatmap.mapper}) | ${Math.round(dbBeatmap.starRating * 100) / 100}* | ${dbBeatmap.bpm} BPM`);
						if (message) {
							await IRCUser.sendMessage(`${prefix}${context['display-name']} -> Comment: ${message}`);
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
			raw_date: inputScore.gameStartDate,
			rank: inputScore.rank,
			pp: inputScore.pp,
			hasReplay: false,
			raw_mods: parseInt(inputScore.gameRawMods) + parseInt(inputScore.rawMods),
			beatmap: undefined,
			matchName: inputScore.matchName,
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
	async cleanUpDuplicateMultiScores() {
		if (wrongClusterFunction()) {
			return;
		}
		let date = new Date();
		if (date.getUTCHours() < 1 || date.getUTCHours() > 6) {
			return;
		}
		let duplicates = true;
		let deleted = 0;

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

		while (duplicates && deleted < 25) {
			let result = await sequelize.query(
				'SELECT * FROM DBOsuMultiScores WHERE 0 < (SELECT COUNT(1) FROM DBOsuMultiScores as a WHERE a.osuUserId = DBOsuMultiScores.osuUserId AND a.matchId = DBOsuMultiScores.matchId AND a.gameId = DBOsuMultiScores.gameId AND a.id <> DBOsuMultiScores.id) ORDER BY maxCombo ASC LIMIT 1',
			);

			duplicates = result[0].length;

			if (result[0].length) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				logDatabaseQueriesFunction(2, 'utils.js DBOsuMultiScores cleanUpDuplicateMultiScores');
				let duplicate = await DBOsuMultiScores.findOne({
					where: {
						id: result[0][0].id
					}
				});

				console.log(duplicate.matchId, duplicate.gameId, duplicate.osuUserId, duplicate.matchStartDate, duplicate.updatedAt);

				deleted++;
				await new Promise(resolve => setTimeout(resolve, 2000));
				await duplicate.destroy();
			}
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		if (deleted) {
			console.log(`Cleaned up ${deleted} duplicate scores`);
		}
	},
	wrongCluster(id) {
		return wrongClusterFunction(id);
	}
};

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

async function getOsuPPFunction(beatmapId, modBits, accuracy, misses, combo) {
	const rosu = require('rosu-pp');
	const fs = require('fs');

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
		path: `./maps/${beatmapId}.osu`,
		mods: parseInt(modBits),
		acc: parseFloat(accuracy),
		nMisses: parseInt(misses),
		combo: parseInt(combo),
	};

	return rosu.calculate(arg)[0].pp;
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
	lastRework.setUTCFullYear(2021);
	lastRework.setUTCMonth(10);
	lastRework.setUTCDate(13);
	lastRework.setUTCHours(17);
	let lastWeek = new Date();
	lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);

	let dbBeatmap = null;

	//Repeat up to 3 times if errors appear
	for (let i = 0; i < 3; i++) {
		if (!dbBeatmap) {
			try {
				logDatabaseQueriesFunction(1, 'utils.js getOsuBeatmapFunction');
				dbBeatmap = await DBOsuBeatmaps.findOne({
					where: { beatmapId: beatmapId, mods: modBits }
				});

				//Date of reworked DT, HT, EZ and HR values
				if (getModsFunction(modBits).includes('DT') || getModsFunction(modBits).includes('HT') || getModsFunction(modBits).includes('EZ') || getModsFunction(modBits).includes('HR')) {
					lastRework.setUTCFullYear(2022);
					lastRework.setUTCMonth(2);
					lastRework.setUTCDate(19);
				}

				if (!dbBeatmap
					|| forceUpdate
					|| dbBeatmap && dbBeatmap.updatedAt < lastRework //If reworked
					|| dbBeatmap && dbBeatmap.approvalStatus !== 'Ranked' && dbBeatmap.approvalStatus !== 'Approved' && (!dbBeatmap.updatedAt || dbBeatmap.updatedAt.getTime() < lastWeek.getTime()) //Update if old non-ranked map
					|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && (!dbBeatmap.starRating || !dbBeatmap.maxCombo || dbBeatmap.starRating == 0 || !dbBeatmap.mode)) { //Always update ranked maps if values are missing
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
							if (getModsFunction(modBits).includes('MI') || getModsFunction(modBits).includes('HD') || getModsFunction(modBits).includes('FL') || getModsFunction(modBits).includes('FI') || getModsFunction(modBits).includes('NF') || getModsFunction(modBits).includes('NC') || getModsFunction(modBits).includes('PF') || getModsFunction(modBits).includes('SD')) {
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
							} else if (getModsFunction(modBits).includes('HT')) {
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

							//EZ
							if (getModsFunction(modBits).includes('EZ')) {
								cs = parseFloat(beatmaps[0].difficulty.size) / 2;
								ar = parseFloat(beatmaps[0].difficulty.approach) / 2;
								od = parseFloat(beatmaps[0].difficulty.overall) / 2;
								hpDrain = parseFloat(beatmaps[0].difficulty.drain) / 2;
							}

							cs = Math.min(Math.round(cs * 100) / 100, 10);
							ar = Math.min(Math.round(ar * 100) / 100, 10);
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
		} else if (input.substring(i, i + 2) === 'FL' && !noVisualMods) {
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

function logDatabaseQueriesFunction(level, output) {
	//Level 5: Log rarely used queries
	//Level 4: Log queries used in commands
	//Level 3: Log queries used in (all) messages
	//Level 2: Log constant periodic queries
	//Level 1: Log all queries
	if (traceDatabaseQueries <= level) {
		console.log('traceDatabaseQueries: ', output);
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

function partitionMatchId(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].matchId) >= parseInt(pivot.matchId)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortMatchId(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionMatchId(list, start, end);
		quicksortMatchId(list, start, p - 1);
		quicksortMatchId(list, p + 1, end);
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
	if (!tourneyMatch || gameIndex > 1 || acronym === 'etx' || acronym === 'o!mm ranked' || acronym === 'o!mm private' || acronym === 'o!mm team ranked' || acronym === 'o!mm team private' || acronym === 'motd') {
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
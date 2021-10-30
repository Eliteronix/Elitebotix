const { DBGuilds, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBOsuMultiScores, DBActivityRoles, DBOsuBeatmaps } = require('./dbObjects');
const { prefix, leaderboardEntriesPerPage } = require('./config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const osu = require('node-osu');

module.exports = {
	getGuildPrefix: async function (msg) {
		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === 'DM') {
			//Set prefix to standard prefix
			guildPrefix = prefix;
		} else {
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
		if (msg.channel.type !== 'DM') {
			const now = new Date();
			now.setSeconds(now.getSeconds() - 15);
			const serverUserActivity = await DBServerUserActivity.findOne({
				where: { guildId: msg.guildId, userId: msg.author.id },
			});

			if (serverUserActivity && serverUserActivity.updatedAt < now) {
				msg.channel.messages.fetch({ limit: 100 })
					.then(async (messages) => {
						const lastMessage = messages.filter(m => m.author.id === msg.author.id && m.content === msg.content).last();
						if (lastMessage && msg.id === lastMessage.id) {
							serverUserActivity.points = serverUserActivity.points + 1;
							serverUserActivity.save();
							const activityRoles = await DBActivityRoles.findAll({
								where: { guildId: msg.guildId }
							});
							if (activityRoles.length) {
								const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
								if (!existingTask) {
									let date = new Date();
									date.setUTCMinutes(date.getUTCMinutes() + 5);
									DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
								}
							}
						}
					});
			}

			if (!serverUserActivity) {
				DBServerUserActivity.create({ guildId: msg.guildId, userId: msg.author.id });
				const activityRoles = await DBActivityRoles.findAll({
					where: { guildId: msg.guildId }
				});
				if (activityRoles.length) {
					const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guildId, task: 'updateActivityRoles', priority: 5 } });
					if (!existingTask) {
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 5);
						DBProcessQueue.create({ guildId: msg.guildId, task: 'updateActivityRoles', priority: 5, date: date });
					}
				}
			}
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
		const tasksInWork = await DBProcessQueue.findAll({
			where: { beingExecuted: true }
		});
		if (tasksInWork.length >= 5) {
			return;
		}
		let now = new Date();
		let nextPriorityTasklevel = await DBProcessQueue.findAll({
			where: {
				beingExecuted: false,
			},
			order: [
				['priority', 'DESC']
			]
		});
		for (let i = 0; i < nextPriorityTasklevel.length; i++) {
			if (nextPriorityTasklevel[i].date && nextPriorityTasklevel[i].date > now) {
				nextPriorityTasklevel.splice(i, 1);
				i--;
			}
		}
		if (nextPriorityTasklevel.length > 0) {
			let nextTask = await DBProcessQueue.findAll({
				where: { beingExecuted: false, priority: nextPriorityTasklevel[0].priority },
				order: [
					['createdAt', 'ASC']
				]
			});
			for (let i = 0; i < nextTask.length; i++) {
				if (nextTask[i].date && nextTask[i].date > now) {
					nextTask.splice(i, 1);
					i--;
				}
			}
			try {
				if (nextTask[0]) {
					const task = require(`./processQueueTasks/${nextTask[0].task}.js`);

					nextTask[0].beingExecuted = true;
					await nextTask[0].save();

					await task.execute(client, bancho, nextTask[0]);
				}
			} catch (e) {
				console.log('Error executing process queue task', e);
				console.log('Process Queue entry:', nextTask[0]);
				nextTask[0].destroy();
			}
		}
	},
	refreshOsuRank: async function () {
		let date = new Date();
		date.setUTCHours(date.getUTCHours() - 12);

		const discordUsers = await DBDiscordUsers.findAll();

		for (let i = 0; i < discordUsers.length; i++) {
			if (discordUsers[i].osuUserId && discordUsers[i].updatedAt < date) {
				const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUsers[i].userId } });
				if (!existingTask) {
					DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUsers[i].userId });
				}
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
		fitTextOnMiddleCanvas(ctx, title, 35, 'comfortaa, sans-serif', 50, canvas.width, 50);

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
		fitTextOnMiddleCanvas(ctx, beatmap.artist, 40, 'comfortaa, sans-serif', 200, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, beatmap.title, 40, 'comfortaa, sans-serif', 240, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, `Mapper: ${beatmap.creator}`, 40, 'comfortaa, sans-serif', 280, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, `[${beatmap.version}]`, 100, 'comfortaa, sans-serif', 450, canvas.width, 220);
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
		fitTextOnMiddleCanvas(ctx, `Mods: Freemod${doubletimeMod}`, 50, 'comfortaa, sans-serif', 575, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, '(All mods allowed except: Relax, Autopilot, Auto, ScoreV2)', 25, 'comfortaa, sans-serif', 600, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, `Length: ${Math.floor(beatmap.length.total / 60)}:${(beatmap.length.total % 60).toString().padStart(2, '0')}`, 35, 'comfortaa, sans-serif', 700, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, `SR: ${Math.round(beatmap.difficulty.rating * 100) / 100} | ${beatmap.bpm} BPM`, 35, 'comfortaa, sans-serif', 750, canvas.width, 220);
		fitTextOnMiddleCanvas(ctx, `CS ${beatmap.difficulty.size} | HP ${beatmap.difficulty.drain} | OD ${beatmap.difficulty.overall} | AR ${beatmap.difficulty.approach}`, 35, 'comfortaa, sans-serif', 800, canvas.width, 220);

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
	saveOsuMultiScores(match) {
		let tourneyMatch = false;
		if (match.name.toLowerCase().match(/.+: .+ vs .+/g) || match.name.toLowerCase().match(/.+: .+ vs. .+/g)) {
			tourneyMatch = true;
		}
		match.games.forEach(game => {
			game.scores.forEach(async (score) => {
				//Calculate evaluation
				let evaluation = 0;

				let gameScores = [];
				for (let i = 0; i < game.scores.length; i++) {
					gameScores.push(game.scores[i]);
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
						if (!(gameScores.length % 2 === 0 && score.userId === gameScores[j].userId)) {
							sortedScores.push(gameScores[j].score);
						}
					}

					const middleScore = getMiddleScore(sortedScores);

					for (let i = 0; i < gameScores.length; i++) {
						if (score.userId === gameScores[i].userId) {
							evaluation = 1 / parseInt(middleScore) * parseInt(gameScores[i].score);
						}
					}
				}

				//Add score to db
				const existingScore = await DBOsuMultiScores.findOne({
					where: {
						osuUserId: score.userId,
						matchId: match.id,
						gameId: game.id,
					}
				});

				if (!existingScore && evaluation) {
					DBOsuMultiScores.create({
						osuUserId: score.userId,
						matchId: match.id,
						matchName: match.name,
						gameId: game.id,
						scoringType: game.scoringType,
						mode: game.mode,
						beatmapId: game.beatmapId,
						tourneyMatch: tourneyMatch,
						evaluation: evaluation,
						score: score.score,
						gameRawMods: game.raw_mods,
						rawMods: score.raw_mods,
						matchStartDate: match.raw_start,
						matchEndDate: match.raw_end,
						gameStartDate: game.raw_start,
						gameEndDate: game.raw_end,
					});
				}
			});
		});
	},
	async populateMsgFromInteraction(interaction) {
		let userMentions = new Discord.Collection();

		if (interaction.options._hoistedOptions) {
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].type === 'USER') {
					userMentions.set(interaction.options._hoistedOptions[i].user.id, interaction.options._hoistedOptions[i].user);
				} else if (interaction.options._hoistedOptions[i].value && interaction.options._hoistedOptions[i].type === 'STRING' && interaction.options._hoistedOptions[i].value.startsWith('<@') && interaction.options._hoistedOptions[i].value.endsWith('>')) {
					let user = await interaction.client.users.fetch(interaction.options._hoistedOptions[i].value.replace(/\D/g, ''));
					userMentions.set(user.id, user);
				}
			}
		}

		let mentions = {
			users: userMentions
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
		//For the development version
		//if the message is not in the Dev-Servers then return
		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Dev') {
			if (isDM) {
				return true;
			}
			if (!isDM && guildId != '800641468321759242' && guildId != '800641735658176553') {
				return true;
			}
			//For the QA version
			//if the message is in the QA-Servers then return
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'QA') {
			if (isDM) {
				return true;
			}
			if (!isDM && guildId != '800641367083974667' && guildId != '800641819086946344') {
				return true;
			}
			//For the Live version
			//if the message is in the Dev/QA-Servers then return
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'Live') {
			if (!isDM) {
				if (guildId === '800641468321759242' || guildId === '800641735658176553' || guildId === '800641367083974667' || guildId === '800641819086946344') {
					return true;
				}
			}
		}

		return false;
	},
	async getOsuBeatmap(beatmapId, modBits) {
		return await getOsuBeatmapFunction(beatmapId, modBits);
	},
	async populatePP(score, beatmap, accuracy) {
		if (!score.pp) {
			try {
				let response = await fetch(`https://osu.gatari.pw/api/v1/pp?b=${beatmap.beatmapId}&a=${accuracy}&x=${score.counts.miss}&c=${score.maxCombo}&m=${score.raw_mods}`);
				let htmlCode = await response.text();
				const ppRegex = /"pp":.+, "length"/gm;
				const matches = ppRegex.exec(htmlCode);
				score.pp = matches[0].replace('"pp": [', '').replace('], "length"', '');
			} catch (err) {
				console.log('error fetching osu pp', err);
				console.log(`https://osu.gatari.pw/api/v1/pp?b=${beatmap.beatmapId}&a=${accuracy}&x=${score.counts.miss}&c=${score.maxCombo}&m=${score.raw_mods}`);
			}
		}

		return score;
	},
};

async function getOsuBadgeNumberByIdFunction(osuUserId) {
	return await fetch(`https://osu.ppy.sh/users/${osuUserId}/osu`)
		.then(async (res) => {
			let htmlCode = await res.text();
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

function fitTextOnMiddleCanvas(ctx, text, startingSize, fontface, yPosition, width, widthReduction) {

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

async function getOsuBeatmapFunction(beatmapId, modBits) {
	let lastRework = new Date();
	lastRework.setUTCFullYear(2021);
	lastRework.setUTCMonth(7);
	lastRework.setUTCDate(20);
	let lastWeek = new Date();
	lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
	let dbBeatmap = await DBOsuBeatmaps.findOne({
		where: { beatmapId: beatmapId, mods: modBits }
	});

	if (!dbBeatmap
		|| dbBeatmap && dbBeatmap.updatedAt < lastRework
		|| dbBeatmap && dbBeatmap.approvalStatus !== 'Ranked' && dbBeatmap.approvalStatus !== 'Approved' && dbBeatmap.updatedAt.getTime() < lastWeek.getTime()
		|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && !dbBeatmap.starRating
		|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && !dbBeatmap.maxCombo
		|| dbBeatmap && dbBeatmap.approvalStatus === 'Ranked' && dbBeatmap.approvalStatus === 'Approved' && dbBeatmap.starRating == 0) {
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
					let realNoVisualModBeatmap = await getOsuBeatmapFunction(beatmapId, getModBitsFunction(getModsFunction(modBits).join(''), true));
					noVisualModBeatmap.difficulty.rating = realNoVisualModBeatmap.starRating;
					noVisualModBeatmap.difficulty.aim = realNoVisualModBeatmap.aimRating;
					noVisualModBeatmap.difficulty.speed = realNoVisualModBeatmap.speedRating;
					noVisualModBeatmap.maxCombo = realNoVisualModBeatmap.maxCombo;
				}

				//Map has to be updated
				if (dbBeatmap) {
					dbBeatmap.title = beatmaps[0].title;
					dbBeatmap.artist = beatmaps[0].artist;
					dbBeatmap.difficulty = beatmaps[0].version;
					dbBeatmap.starRating = noVisualModBeatmap.difficulty.rating;
					dbBeatmap.aimRating = noVisualModBeatmap.difficulty.aim;
					dbBeatmap.speedRating = noVisualModBeatmap.difficulty.speed;
					dbBeatmap.drainLength = beatmaps[0].length.drain;
					dbBeatmap.totalLength = beatmaps[0].length.total;
					dbBeatmap.circleSize = beatmaps[0].difficulty.size;
					dbBeatmap.approachRate = beatmaps[0].difficulty.approach;
					dbBeatmap.overallDifficulty = beatmaps[0].difficulty.overall;
					dbBeatmap.hpDrain = beatmaps[0].difficulty.drain;
					dbBeatmap.mapper = beatmaps[0].creator;
					dbBeatmap.beatmapsetId = beatmaps[0].beatmapSetId;
					dbBeatmap.bpm = beatmaps[0].bpm;
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
					dbBeatmap = await DBOsuBeatmaps.create({
						title: beatmaps[0].title,
						artist: beatmaps[0].artist,
						difficulty: beatmaps[0].version,
						starRating: noVisualModBeatmap.difficulty.rating,
						aimRating: noVisualModBeatmap.difficulty.aim,
						speedRating: noVisualModBeatmap.difficulty.speed,
						drainLength: beatmaps[0].length.drain,
						totalLength: beatmaps[0].length.total,
						circleSize: beatmaps[0].difficulty.size,
						approachRate: beatmaps[0].difficulty.approach,
						overallDifficulty: beatmaps[0].difficulty.overall,
						hpDrain: beatmaps[0].difficulty.drain,
						mapper: beatmaps[0].creator,
						beatmapId: beatmaps[0].id,
						beatmapsetId: beatmaps[0].beatmapSetId,
						bpm: beatmaps[0].bpm,
						mode: beatmaps[0].mode,
						approvalStatus: beatmaps[0].approvalStatus,
						maxCombo: noVisualModBeatmap.maxCombo,
						circles: beatmaps[0].objects.normal,
						sliders: beatmaps[0].objects.slider,
						spinners: beatmaps[0].objects.spinner,
						mods: modBits,
						userRating: beatmaps[0].rating,
					});
				}
			})
			.catch(async (error) => {
				//Nothing
				//Map is already saved; Delay next check until 7 days
				if (dbBeatmap) {
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
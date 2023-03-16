const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { DBOsuSoloScores, DBDiscordUsers, DBOsuTeamSheets, DBOsuMappools, DBOsuBeatmaps } = require('../dbObjects');
const { getMods, logDatabaseQueries } = require('../utils.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-scoreupload',
	description: 'Allows you to upload your solo scores to the database',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-scoreupload')
		.setNameLocalizations({
			'de': 'osu-scoreupload',
			'en-GB': 'osu-scoreupload',
			'en-US': 'osu-scoreupload',
		})
		.setDescription('Allows you to upload your solo scores to the database')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es dir, deine Solo-Scores in die Datenbank hochzuladen',
			'en-GB': 'Allows you to upload your solo scores to the database',
			'en-US': 'Allows you to upload your solo scores to the database',
		})
		.setDMPermission(true)
		.addAttachmentOption(option =>
			option.setName('file')
				.setNameLocalizations({
					'de': 'datei',
					'en-GB': 'file',
					'en-US': 'file',
				})
				.setDescription('The scores.db file from your osu! folder')
				.setDescriptionLocalizations({
					'de': 'Die scores.db Datei aus deinem osu! Ordner',
					'en-GB': 'The scores.db file from your osu! folder',
					'en-US': 'The scores.db file from your osu! folder',
				})
				.setRequired(true)
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.user.id
			}
		});

		if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
			return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
		}

		let attachedFile = interaction.options.getAttachment('file');

		if (attachedFile.name !== 'scores.db') {
			return await interaction.editReply('The attached file is not a scores.db file');
		}

		let file = await fetch(attachedFile.url);

		// Get the file in hex
		file = await file.arrayBuffer();

		file = buf2hex(file);

		// First int is the version
		// const version = convertHexIntToDecimal(file.substring(0, 8));
		file = file.slice(8);

		// Second int is the amount of beatmaps
		const amountOfBeatmaps = convertHexIntToDecimal(file.substring(0, 8));
		file = file.slice(8);

		const scoreData = [];

		// Loop through the beatmaps
		for (let i = 0; i < amountOfBeatmaps; i++) {
			// String	MD5 hash of the beatmap
			// const beatmapHash = getNextString(file).string;
			file = getNextString(file).newFile;

			// Int	Amount of scores
			const scores = convertHexIntToDecimal(file.substring(0, 8));
			file = file.slice(8);

			for (let j = 0; j < scores; j++) {
				const score = {
					uploaderId: discordUser.osuUserId,
				};

				// Byte	osu! gameplay mode (0x00 = osu!，0x01 = osu!taiko，0x02 = osu!catch，0x03 = osu!mania)
				score.mode = file.slice(0, 2);
				file = file.slice(2);

				// Int	Version of this score/replay (e.g. 20150203)
				score.version = convertHexIntToDecimal(file.substring(0, 8));
				file = file.slice(8);

				// String	Beatmap MD5 hash
				score.beatmapHash = getNextString(file).string;
				file = getNextString(file).newFile;

				// String	Player name
				score.playerName = getNextString(file).string;
				file = getNextString(file).newFile;

				// String	Replay MD5 hash
				score.replayHash = getNextString(file).string;
				file = getNextString(file).newFile;

				// Short	Number of 300's
				score.count300 = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Short	Number of 100's in osu!, 150's in osu!taiko, 100's in osu!catch, 100's in osu!mania
				score.count100 = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Short	Number of 50's in osu!, small fruit in osu!catch, 50's in osu!mania
				score.count50 = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Short	Number of Gekis in osu!, Max 300's in osu!mania
				score.countGeki = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Short	Number of Katus in osu!, 200's in osu!mania
				score.countKatu = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Short	Number of misses
				score.countMiss = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Int	Replay score
				score.score = convertHexIntToDecimal(file.substring(0, 8));
				file = file.slice(8);

				// Short	Max Combo
				score.maxCombo = convertHexIntToDecimal(file.substring(0, 4));
				file = file.slice(4);

				// Boolean	Perfect combo
				score.perfectCombo = file.slice(0, 2) !== '00';
				file = file.slice(2);

				// Int	Bitwise combination of mods used. See Osr (file format) for more information.
				score.mods = convertHexIntToDecimal(file.substring(0, 8));
				file = file.slice(8);

				// String	Should always be empty
				// const emptyString = getNextString(file).string;
				file = getNextString(file).newFile;

				// Long	Timestamp of replay, in Windows ticks
				score.timestamp = convertHexIntToDecimal(file.substring(0, 16));
				file = file.slice(16);

				// Int	Should always be 0xffffffff (-1).
				// const negativeOne = convertHexIntToDecimal(file.substring(0, 8));
				file = file.slice(8);

				// Long	Online Score ID
				score.onlineScoreId = convertHexIntToDecimal(file.substring(0, 16));
				file = file.slice(16);

				// Double	Additional mod information. Only present if Target Practice is enabled.
				if (getMods(score.mods).includes('TG')) {
					file = file.slice(16);
				}

				scoreData.push(score);
			}
		}

		// Create the scores in the database
		logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuSoloScores findAll');
		let uploaderScores = await DBOsuSoloScores.findAll({
			where: {
				uploaderId: discordUser.osuUserId,
			},
		});

		// Remove scores that are already in the database
		let highestTimestamp = 0;
		for (let i = 0; i < uploaderScores.length; i++) {
			const score = uploaderScores[i];

			if (Number(score.timestamp) > highestTimestamp) {
				highestTimestamp = Number(score.timestamp);
			}
		}

		const newScores = scoreData.filter(score => score.timestamp > highestTimestamp);

		// Add the new scores to the database
		logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuSoloScores create');
		await DBOsuSoloScores.bulkCreate(newScores);

		await interaction.editReply(`Successfully uploaded ${newScores.length} new score(s)!`);

		// Update teamsheets
		logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuTeamsheets update');
		let teamsheets = await DBOsuTeamSheets.findAll({
			where: {
				players: {
					[Op.like]: `%${discordUser.osuUserId}%`,
				},
			},
		});

		let newScoreMaps = await DBOsuBeatmaps.findAll({
			where: {
				hash: {
					[Op.in]: newScores.map(score => score.beatmapHash),
				},
			},
		});

		for (let i = 0; i < teamsheets.length; i++) {
			const teamsheet = teamsheets[i];

			logDatabaseQueries(4, 'commands/osu-teamsheet.js DBOsuMappools');
			let mappool = await DBOsuMappools.findAll({
				where: {
					creatorId: teamsheet.poolCreatorId,
					name: teamsheet.poolName,
					beatmapId: {
						[Op.in]: newScoreMaps.map(map => map.beatmapId),
					},
				},
				order: [
					['number', 'ASC']
				]
			});

			if (mappool.length === 0) {
				continue;
			}

			if (new Date() > new Date(teamsheet.updateUntil)) {
				teamsheet.destroy();
				continue;
			}

			// Delete the message of the teamsheet and create a new one
			await interaction.client.shard.broadcastEval(async (c, { guildId, channelId, messageId, teamsize, poolCreatorId, players, mappool, duelratingestimate, updateUntil }) => {
				const guild = await c.guilds.fetch(guildId);
				if (!guild) return;

				const channel = await guild.channels.fetch(channelId);
				if (!channel) return;

				const message = await channel.messages.fetch(messageId);
				if (!message) return;

				try {
					await message.delete();
				} catch (e) {
					//Nothing
				}
				// eslint-disable-next-line no-undef
				const { DBOsuTeamSheets, DBDiscordUsers } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);

				DBOsuTeamSheets.destroy({
					where: {
						messageId: messageId,
					}
				});

				// Create the new message
				// eslint-disable-next-line no-undef
				const command = require((`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-teamsheet.js`));

				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: poolCreatorId,
					}
				});

				let creator = await guild.members.fetch(discordUser.userId);

				//Setup artificial interaction
				let interaction = {
					id: null,
					channel: channel,
					client: c,
					guild: guild,
					user: creator.user,
					options: {
						getString: (string) => {
							if (string === 'players') {
								return players;
							} else if (string === 'mappool') {
								return mappool;
							}
						},
						getNumber: (string) => {
							if (string === 'teamsize') {
								return teamsize;
							} else if (string === 'updatefor') {
								return Math.ceil(updateUntil / 1000 / 60);
							}
						},
						getBoolean: (string) => {
							if (string === 'duelratingestimate') {
								return duelratingestimate;
							}
						}
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await channel.send(input);
					},
					editReply: async (input) => {
						return await channel.send(input);
					},
					reply: async (input) => {
						return await channel.send(input);
					}
				};

				command.execute(null, null, interaction);
			}, {
				context: {
					guildId: teamsheet.guildId,
					channelId: teamsheet.channelId,
					messageId: teamsheet.messageId,
					teamsize: teamsheet.teamsize,
					poolCreatorId: teamsheet.poolCreatorId,
					players: teamsheet.players,
					mappool: teamsheet.poolName,
					duelratingestimate: teamsheet.duelratingestimate,
					updatefor: teamsheet.updateUntil.getTime(),
				}
			});

		}
	},
};

function buf2hex(buffer) { // buffer is an ArrayBuffer
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');
}

function convertHexIntToDecimal(hexInput) {
	if (hexInput === '0000000000000000') {
		return 0;
	} else if (hexInput === '00000000') {
		return 0;
	} else if (hexInput === '0000') {
		return 0;
	} else if (hexInput === '00') {
		return 0;
	}

	while (hexInput.endsWith('00')) {
		hexInput = hexInput.slice(0, -2);
	}

	// Chunk the string into 2 characters
	hexInput = hexInput.match(/.{1,2}/g);

	// Reverse the array
	hexInput = hexInput.reverse();

	// Join the array
	hexInput = hexInput.join('');

	return parseInt(hexInput, 16);
}

function getNextString(file) {
	//First 2 characters should be 0b
	const indicator = file.slice(0, 2);

	file = file.slice(2);

	if (indicator === '00') {
		return { string: null, newFile: file };
	}

	let stringLength = parseInt(file.slice(0, 2), 16);

	file = file.slice(2);

	let outputString = file.slice(0, stringLength * 2);

	// eslint-disable-next-line no-undef
	outputString = Buffer.from(outputString, 'hex').toString('utf8');

	file = file.slice(stringLength * 2);

	return { string: outputString, newFile: file };
}
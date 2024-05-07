const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, logBroadcastEval } = require('../config.json');
const { DBOsuSoloScores, DBDiscordUsers, DBOsuTeamSheets, DBOsuMappools, DBOsuBeatmaps } = require('../dbObjects');
const { getMods, logDatabaseQueries, getOsuBeatmap, getModBits, getIDFromPotentialOsuLink } = require('../utils.js');
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
		.addSubcommand(subcommand =>
			subcommand.setName('fileupload')
				.setNameLocalizations({
					'de': 'dateiupload',
					'en-GB': 'fileupload',
					'en-US': 'fileupload',
				})
				.setDescription('Upload your scores.db file')
				.setDescriptionLocalizations({
					'de': 'Lade deine scores.db Datei hoch',
					'en-GB': 'Upload your scores.db file',
					'en-US': 'Upload your scores.db file',
				})
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
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('guesstimate')
				.setNameLocalizations({
					'de': 'schätzen',
					'en-GB': 'guesstimate',
					'en-US': 'guesstimate',
				})
				.setDescription('Add a score by guesstimating the score')
				.setDescriptionLocalizations({
					'de': 'Füge einen Score hinzu, indem du den Score schätzt',
					'en-GB': 'Add a score by guesstimating the score',
					'en-US': 'Add a score by guesstimating the score',
				})
				.addStringOption(option =>
					option.setName('beatmap')
						.setNameLocalizations({
							'de': 'beatmap',
							'en-GB': 'beatmap',
							'en-US': 'beatmap',
						})
						.setDescription('The beatmap id or link of the beatmap you want to add a score to')
						.setDescriptionLocalizations({
							'de': 'Die Beatmap ID der Beatmap, zu der du einen Score hinzufügen möchtest',
							'en-GB': 'The beatmap id of the beatmap you want to add a score to',
							'en-US': 'The beatmap id of the beatmap you want to add a score to',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option.setName('score')
						.setNameLocalizations({
							'de': 'score',
							'en-GB': 'score',
							'en-US': 'score',
						})
						.setDescription('The score you want to add')
						.setDescriptionLocalizations({
							'de': 'Der Score, den du hinzufügen möchtest',
							'en-GB': 'The score you want to add',
							'en-US': 'The score you want to add',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('mods')
						.setNameLocalizations({
							'de': 'mods',
							'en-GB': 'mods',
							'en-US': 'mods',
						})
						.setDescription('The mods you want to add')
						.setDescriptionLocalizations({
							'de': 'Die Mods, die du hinzufügen möchtest',
							'en-GB': 'The mods you want to add',
							'en-US': 'The mods you want to add',
						})
						.setRequired(false)
				)
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

		logDatabaseQueries(4, 'commands/osu-scoreupload.js DBDiscordUsers 1');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuVerified', 'userId', 'osuName'],
			where: {
				userId: interaction.user.id
			}
		});

		if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
			return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
		}

		if (interaction.options.getSubcommand() === 'fileupload') {
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
				attributes: ['replayHash'],
				where: {
					uploaderId: discordUser.osuUserId,
				},
			});

			// Remove scores that are already in the database
			for (let i = 0; i < uploaderScores.length; i++) {
				const score = uploaderScores[i];

				const existingScoreIndex = scoreData.findIndex(scoreData => scoreData.replayHash === score.replayHash);

				if (existingScoreIndex !== -1) {
					scoreData.splice(existingScoreIndex, 1);
				}
			}

			const newScores = scoreData;

			// Add the new scores to the database
			logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuSoloScores create');
			await DBOsuSoloScores.bulkCreate(newScores);

			await interaction.editReply(`Successfully uploaded ${newScores.length} new score(s)!`);

			updateTeamSheets(interaction, discordUser, newScores);
		} else if (interaction.options.getSubcommand() === 'guesstimate') {
			let beatmap = await getOsuBeatmap({ beatmapId: getIDFromPotentialOsuLink(interaction.options.getString('beatmap')) });

			if (beatmap === null) {
				return await interaction.followUp('Beatmap not found');
			}

			let mods = interaction.options.getString('mods');

			if (mods === null) {
				mods = '';
			}

			if (!mods.includes('V2')) {
				mods += 'V2';
			}

			let modBits = getModBits(mods);

			if (mods !== getMods(modBits).join('')) {
				return await interaction.followUp('Invalid mods');
			}

			let guesstimate = {
				beatmapHash: beatmap.hash,
				score: interaction.options.getInteger('score'),
				uploaderId: discordUser.osuUserId,
				mods: modBits,
				mode: '00',
				playerName: discordUser.osuName,
			};

			// Delete existing guesstimate
			let deleted = await DBOsuSoloScores.destroy({
				where: {
					uploaderId: discordUser.osuUserId,
					beatmapHash: beatmap.hash,
					mods: modBits,
					mode: '00',
					timestamp: null,
				}
			});

			if (deleted > 0) {
				await interaction.followUp('Deleted existing guesstimate');
			}

			// Create new guesstimate
			let newScores = [guesstimate];

			logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuSoloScores create');
			await DBOsuSoloScores.bulkCreate(newScores);

			await interaction.followUp({ content: `Successfully uploaded ${newScores.length} new guesstimate!`, ephemeral: true });

			updateTeamSheets(interaction, discordUser, newScores);
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

	outputString = Buffer.from(outputString, 'hex').toString('utf8');

	file = file.slice(stringLength * 2);

	return { string: outputString, newFile: file };
}

async function updateTeamSheets(interaction, discordUser, newScores) {
	// Update teamsheets
	logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuTeamsheets update');
	let teamsheets = await DBOsuTeamSheets.findAll({
		attributes: [
			'id',
			'poolCreatorId',
			'poolName',
			'updateUntil',
			'players',
			'guildId',
			'channelId',
			'messageId',
			'teamsize',
			'duelratingestimate',
			'EZMultiplier',
			'FLMultiplier',
		],
		where: {
			players: {
				[Op.like]: `%${discordUser.osuUserId}%`,
			},
		},
	});

	logDatabaseQueries(4, 'commands/osu-scoreupload.js DBOsuBeatmaps');
	let newScoreMaps = await DBOsuBeatmaps.findAll({
		attributes: ['beatmapId'],
		where: {
			hash: {
				[Op.in]: newScores.map(score => score.beatmapHash),
			},
		},
	});

	for (let i = 0; i < teamsheets.length; i++) {
		const teamsheet = teamsheets[i];

		logDatabaseQueries(4, 'commands/osu-teamsheet.js DBOsuMappools');
		let mappool = await DBOsuMappools.count({
			where: {
				creatorId: teamsheet.poolCreatorId,
				name: teamsheet.poolName,
				beatmapId: {
					[Op.in]: newScoreMaps.map(map => map.beatmapId),
				},
			},
		});

		if (mappool === 0) {
			continue;
		}

		if (new Date() > new Date(teamsheet.updateUntil)) {
			teamsheet.destroy();
			continue;
		}

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting commands/osu-scoreupload.js to shards...');
		}

		// Delete the message of the teamsheet and create a new one
		await interaction.client.shard.broadcastEval(async (c, { guildId, channelId, messageId, teamsize, poolCreatorId, players, mappool, duelratingestimate, EZMultiplier, FLMultiplier, updatefor }) => {
			const guild = await c.guilds.fetch(guildId);

			if (!guild || guild.shardId !== c.shardId) {
				return;
			}

			const channel = await guild.channels.fetch(channelId);
			if (!channel) return;

			const message = await channel.messages.fetch(messageId);
			if (!message) return;

			try {
				await message.delete();
			} catch (e) {
				//Nothing
			}
			const { DBOsuTeamSheets, DBDiscordUsers } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);

			const { logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			DBOsuTeamSheets.destroy({
				where: {
					messageId: messageId,
				}
			});

			// Create the new message
			const command = require((`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\commands\\osu-teamsheet.js`));

			logDatabaseQueries(4, 'commands/osu-scoreupload.js DBDiscordUsers 2');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['userId'],
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
							return updatefor;
						} else if (string === 'ezmultiplier') {
							return EZMultiplier;
						} else if (string === 'flmultiplier') {
							return FLMultiplier;
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
				EZMultiplier: teamsheet.EZMultiplier,
				FLMultiplier: teamsheet.FLMultiplier,
				updatefor: Math.round((teamsheet.updateUntil.getTime() - new Date().getTime()) / 1000 / 60),
			}
		});
	}
}
const { PermissionsBitField, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { DBOsuBeatmaps, DBDiscordUsers, DBOsuMappools, DBOsuPoolAccess } = require('../dbObjects');
const { getMods, getModBits, getIDFromPotentialOsuLink, getOsuBeatmap, getBeatmapSlimcover, pause, logDatabaseQueries } = require('../utils.js');
const { Op } = require('sequelize');
const Canvas = require('canvas');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const discordUsers = {};
const userMappools = [];

module.exports = {
	name: 'osu-mappool',
	description: 'Allows you to manage and view mappools',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-mappool')
		.setNameLocalizations({
			'de': 'osu-mappool',
			'en-GB': 'osu-mappool',
			'en-US': 'osu-mappool',
		})
		.setDescription('Allows you to manage and view mappools')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es dir, Mappools zu verwalten und anzuzeigen',
			'en-GB': 'Allows you to manage and view mappools',
			'en-US': 'Allows you to manage and view mappools',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('view')
				.setNameLocalizations({
					'de': 'ansehen',
					'en-GB': 'view',
					'en-US': 'view',
				})
				.setDescription('Shows a mappool')
				.setDescriptionLocalizations({
					'de': 'Zeigt einen Mappool an',
					'en-GB': 'Shows a mappool',
					'en-US': 'Shows a mappool',
				})
				.addStringOption(option =>
					option.setName('name')
						.setNameLocalizations({
							'de': 'name',
							'en-GB': 'name',
							'en-US': 'name',
						})
						.setDescription('The name of the mappool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Mappools',
							'en-GB': 'The name of the mappool',
							'en-US': 'The name of the mappool',
						})
						.setRequired(true)
						.setAutocomplete(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('createfromsheet')
				.setNameLocalizations({
					'de': 'aussheeterstellen',
					'en-GB': 'createfromsheet',
					'en-US': 'createfromsheet',
				})
				.setDescription('Creates new mappools from a google sheet')
				.setDescriptionLocalizations({
					'de': 'Erstellt neue Mappools aus einem Google Sheet',
					'en-GB': 'Creates new mappools from a google sheet',
					'en-US': 'Creates new mappools from a google sheet',
				})
				.addStringOption(option =>
					option.setName('sheetid')
						.setNameLocalizations({
							'de': 'sheetid',
							'en-GB': 'sheetid',
							'en-US': 'sheetid',
						})
						.setDescription('The ID of the google sheet')
						.setDescriptionLocalizations({
							'de': 'Die ID des Google Sheets',
							'en-GB': 'The ID of the google sheet',
							'en-US': 'The ID of the google sheet',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('sheetname')
						.setNameLocalizations({
							'de': 'sheetname',
							'en-GB': 'sheetname',
							'en-US': 'sheetname',
						})
						.setDescription('The name of the sheet')
						.setDescriptionLocalizations({
							'de': 'Der Name des Sheets',
							'en-GB': 'The name of the sheet',
							'en-US': 'The name of the sheet',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('create')
				.setNameLocalizations({
					'de': 'erstellen',
					'en-GB': 'create',
					'en-US': 'create',
				})
				.setDescription('Creates a new mappool')
				.setDescriptionLocalizations({
					'de': 'Erstellt einen neuen Mappool',
					'en-GB': 'Creates a new mappool',
					'en-US': 'Creates a new mappool',
				})
				.addStringOption(option =>
					option.setName('name')
						.setNameLocalizations({
							'de': 'name',
							'en-GB': 'name',
							'en-US': 'name',
						})
						.setDescription('The name of the mappool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Mappools',
							'en-GB': 'The name of the mappool',
							'en-US': 'The name of the mappool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool1')
						.setNameLocalizations({
							'de': 'modpool1',
							'en-GB': 'modpool1',
							'en-US': 'modpool1',
						})
						.setDescription('The first modpool')
						.setDescriptionLocalizations({
							'de': 'Der erste Modpool',
							'en-GB': 'The first modpool',
							'en-US': 'The first modpool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool1maps')
						.setNameLocalizations({
							'de': 'modpool1maps',
							'en-GB': 'modpool1maps',
							'en-US': 'modpool1maps',
						})
						.setDescription('The maps for the first modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den ersten Modpool',
							'en-GB': 'The maps for the first modpool',
							'en-US': 'The maps for the first modpool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool2')
						.setNameLocalizations({
							'de': 'modpool2',
							'en-GB': 'modpool2',
							'en-US': 'modpool2',
						})
						.setDescription('The second modpool')
						.setDescriptionLocalizations({
							'de': 'Der zweite Modpool',
							'en-GB': 'The second modpool',
							'en-US': 'The second modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool2maps')
						.setNameLocalizations({
							'de': 'modpool2maps',
							'en-GB': 'modpool2maps',
							'en-US': 'modpool2maps',
						})
						.setDescription('The maps for the second modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den zweiten Modpool',
							'en-GB': 'The maps for the second modpool',
							'en-US': 'The maps for the second modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool3')
						.setNameLocalizations({
							'de': 'modpool3',
							'en-GB': 'modpool3',
							'en-US': 'modpool3',
						})
						.setDescription('The third modpool')
						.setDescriptionLocalizations({
							'de': 'Der dritte Modpool',
							'en-GB': 'The third modpool',
							'en-US': 'The third modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool3maps')
						.setNameLocalizations({
							'de': 'modpool3maps',
							'en-GB': 'modpool3maps',
							'en-US': 'modpool3maps',
						})
						.setDescription('The maps for the third modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den dritten Modpool',
							'en-GB': 'The maps for the third modpool',
							'en-US': 'The maps for the third modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool4')
						.setNameLocalizations({
							'de': 'modpool4',
							'en-GB': 'modpool4',
							'en-US': 'modpool4',
						})
						.setDescription('The fourth modpool')
						.setDescriptionLocalizations({
							'de': 'Der vierte Modpool',
							'en-GB': 'The fourth modpool',
							'en-US': 'The fourth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool4maps')
						.setNameLocalizations({
							'de': 'modpool4maps',
							'en-GB': 'modpool4maps',
							'en-US': 'modpool4maps',
						})
						.setDescription('The maps for the fourth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den vierten Modpool',
							'en-GB': 'The maps for the fourth modpool',
							'en-US': 'The maps for the fourth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool5')
						.setNameLocalizations({
							'de': 'modpool5',
							'en-GB': 'modpool5',
							'en-US': 'modpool5',
						})
						.setDescription('The fifth modpool')
						.setDescriptionLocalizations({
							'de': 'Der fünfte Modpool',
							'en-GB': 'The fifth modpool',
							'en-US': 'The fifth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool5maps')
						.setNameLocalizations({
							'de': 'modpool5maps',
							'en-GB': 'modpool5maps',
							'en-US': 'modpool5maps',
						})
						.setDescription('The maps for the fifth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den fünften Modpool',
							'en-GB': 'The maps for the fifth modpool',
							'en-US': 'The maps for the fifth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool6')
						.setNameLocalizations({
							'de': 'modpool6',
							'en-GB': 'modpool6',
							'en-US': 'modpool6',
						})
						.setDescription('The sixth modpool')
						.setDescriptionLocalizations({
							'de': 'Der sechste Modpool',
							'en-GB': 'The sixth modpool',
							'en-US': 'The sixth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool6maps')
						.setNameLocalizations({
							'de': 'modpool6maps',
							'en-GB': 'modpool6maps',
							'en-US': 'modpool6maps',
						})
						.setDescription('The maps for the sixth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den sechsten Modpool',
							'en-GB': 'The maps for the sixth modpool',
							'en-US': 'The maps for the sixth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool7')
						.setNameLocalizations({
							'de': 'modpool7',
							'en-GB': 'modpool7',
							'en-US': 'modpool7',
						})
						.setDescription('The seventh modpool')
						.setDescriptionLocalizations({
							'de': 'Der siebte Modpool',
							'en-GB': 'The seventh modpool',
							'en-US': 'The seventh modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool7maps')
						.setNameLocalizations({
							'de': 'modpool7maps',
							'en-GB': 'modpool7maps',
							'en-US': 'modpool7maps',
						})
						.setDescription('The maps for the seventh modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den siebten Modpool',
							'en-GB': 'The maps for the seventh modpool',
							'en-US': 'The maps for the seventh modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool8')
						.setNameLocalizations({
							'de': 'modpool8',
							'en-GB': 'modpool8',
							'en-US': 'modpool8',
						})
						.setDescription('The eighth modpool')
						.setDescriptionLocalizations({
							'de': 'Der achte Modpool',
							'en-GB': 'The eighth modpool',
							'en-US': 'The eighth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool8maps')
						.setNameLocalizations({
							'de': 'modpool8maps',
							'en-GB': 'modpool8maps',
							'en-US': 'modpool8maps',
						})
						.setDescription('The maps for the eighth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den achten Modpool',
							'en-GB': 'The maps for the eighth modpool',
							'en-US': 'The maps for the eighth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool9')
						.setNameLocalizations({
							'de': 'modpool9',
							'en-GB': 'modpool9',
							'en-US': 'modpool9',
						})
						.setDescription('The ninth modpool')
						.setDescriptionLocalizations({
							'de': 'Der neunte Modpool',
							'en-GB': 'The ninth modpool',
							'en-US': 'The ninth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool9maps')
						.setNameLocalizations({
							'de': 'modpool9maps',
							'en-GB': 'modpool9maps',
							'en-US': 'modpool9maps',
						})
						.setDescription('The maps for the ninth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den neunten Modpool',
							'en-GB': 'The maps for the ninth modpool',
							'en-US': 'The maps for the ninth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool10')
						.setNameLocalizations({
							'de': 'modpool10',
							'en-GB': 'modpool10',
							'en-US': 'modpool10',
						})
						.setDescription('The tenth modpool')
						.setDescriptionLocalizations({
							'de': 'Der zehnte Modpool',
							'en-GB': 'The tenth modpool',
							'en-US': 'The tenth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool10maps')
						.setNameLocalizations({
							'de': 'modpool10maps',
							'en-GB': 'modpool10maps',
							'en-US': 'modpool10maps',
						})
						.setDescription('The maps for the tenth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den zehnten Modpool',
							'en-GB': 'The maps for the tenth modpool',
							'en-US': 'The maps for the tenth modpool',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('remove')
				.setNameLocalizations({
					'de': 'remove',
					'en-GB': 'remove',
					'en-US': 'remove',
				})
				.setDescription('Remove a mappool')
				.setDescriptionLocalizations({
					'de': 'Entferne einen Mappool',
					'en-GB': 'Remove a mappool',
					'en-US': 'Remove a mappool',
				})
				.addStringOption(option =>
					option.setName('name')
						.setNameLocalizations({
							'de': 'name',
							'en-GB': 'name',
							'en-US': 'name',
						})
						.setDescription('The name of the mappool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Mappools',
							'en-GB': 'The name of the mappool',
							'en-US': 'The name of the mappool',
						})
						.setRequired(true)
						.setAutocomplete(true)
				)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		let gotResponse = false;

		let cachedUser = discordUsers[interaction.user.id];

		if (!cachedUser) {
			logDatabaseQueries(4, 'commands/osu-mappool.js (autocomplete) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null
					},
					osuVerified: true,
				}
			});

			if (!discordUser) {
				return await interaction.respond({
					name: 'You need to link your osu! account first!',
					value: 'You need to link your osu! account first!',
				});
			}

			discordUsers[interaction.user.id] = discordUser.osuUserId;
			cachedUser = discordUser.osuUserId;
		}

		setTimeout(async () => {
			if (!gotResponse) {
				let filtered = userMappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) && choice.creatorId === cachedUser);

				filtered = filtered.slice(0, 25);

				if (filtered.length === 0) {
					try {
						await interaction.respond([{
							name: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
							value: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
						}]);
					} catch (error) {
						if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
							console.error(error);
						}
					}
					return;
				}

				try {
					await interaction.respond(
						filtered.map(choice => ({ name: choice.name, value: choice.name })),
					);
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
						console.error(error);
					}
				}
			}
		}, 1000);

		logDatabaseQueries(4, 'commands/osu-mappool.js (autocomplete) DBOsuMappools');
		const mappools = await DBOsuMappools.findAll({
			attributes: ['name'],
			where: {
				creatorId: cachedUser,
			},
			group: ['name'],
		});

		await pause(5000);

		mappools.forEach(mappool => {
			if (!userMappools.find(m => m.name === mappool.name && m.creatorId === cachedUser)) {
				userMappools.push({
					name: mappool.name,
					creatorId: cachedUser,
				});
			}
		});

		let filtered = mappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

		filtered = filtered.slice(0, 25);

		if (filtered.length === 0) {
			try {
				await interaction.respond([{
					name: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
					value: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
				}]);

				gotResponse = true;
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
					console.error(error);
				}
			}
			return;
		}

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.name })),
			);

			gotResponse = true;
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
				console.error(error);
			}
		}
	},
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		if (interaction.options.getSubcommand() === 'create') {
			logDatabaseQueries(4, 'commands/osu-mappool.js (create) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				}
			});

			if (!discordUser) {
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			let mappoolName = interaction.options.getString('name');

			logDatabaseQueries(4, 'commands/osu-mappool.js (create) DBOsuMappools');
			let existingMappool = await DBOsuMappools.count({
				where: {
					creatorId: discordUser.osuUserId,
					name: mappoolName,
				},
			});

			if (existingMappool) {
				return await interaction.editReply({ content: `You already have a mappool with the name \`${mappoolName.replace(/`/g, '')}\`. Please remove it first if you want to create a mappool with this name again.` });
			}

			let modPools = [];

			for (let i = 0; i < 6; i++) {
				modPools.push({
					mod: interaction.options.getString(`modpool${i + 1}`),
					maps: interaction.options.getString(`modpool${i + 1}maps`),
				});
			}

			modPools = modPools.filter(modPool => modPool.mod !== null || modPool.maps !== null);

			let uniqueModPools = [...new Set(modPools.map(modPool => modPool.mod))];

			if (uniqueModPools.length !== modPools.length) {
				return interaction.editReply({ content: 'You can\'t have the same modpool twice!' });
			}

			let maps = [];

			for (let i = 0; i < modPools.length; i++) {
				let checkingResult = checkViableModpool(modPools[i].mod);
				modPools[i].modBits = checkingResult.mods;
				modPools[i].FM = checkingResult.FM;
				modPools[i].TB = checkingResult.TB;

				if (modPools[i].modBits === false) {
					return await interaction.editReply({ content: `\`${modPools[i].mod.replace(/`/g, '')}\` is not a valid modpool.` });
				}

				if (modPools[i].maps === null) {
					return await interaction.editReply({ content: `You need to specify the maps for \`${modPools[i].mod.replace(/`/g, '')}\`` });
				}

				if (modPools[i].mod === null) {
					return await interaction.editReply({ content: `You need to specify the modpool for \`${modPools[i].maps.replace(/`/g, '')}\`` });
				}

				modPools[i].maps = modPools[i].maps.trim().split(/ +/);

				for (let j = 0; j < modPools[i].maps.length; j++) {
					let mapId = getIDFromPotentialOsuLink(modPools[i].maps[j]);

					if (mapId === '') {
						return await interaction.editReply({ content: `\`${modPools[i].maps[j].replace(/`/g, '')}\` is not a valid map.` });
					}

					maps.push({ beatmapId: mapId, modBits: modPools[i].modBits, modIndex: j + 1, FM: modPools[i].FM, TB: modPools[i].TB });
				}
			}

			logDatabaseQueries(4, 'commands/osu-mappool.js (create) DBOsuBeatmaps');
			let beatmaps = await DBOsuBeatmaps.findAll({
				attributes: [
					'beatmapId',
					'beatmapsetId',
					'approvalStatus',
					'mods',
					'updatedAt',
					'starRating',
					'maxCombo',
					'mode',
					'artist',
					'title',
					'difficulty',
				],
				where: {
					beatmapId: {
						[Op.in]: maps.map(map => map.beatmapId),
					},
				},
			});

			for (let i = 0; i < maps.length; i++) {
				let beatmap = beatmaps.find(beatmap => beatmap.beatmapId === maps[i].beatmapId && beatmap.mods === maps[i].modBits);

				beatmap = await getOsuBeatmap({ beatmapId: maps[i].beatmapId, modBits: maps[i].modBits, beatmap: beatmap });

				if (beatmap === null) {
					return await interaction.editReply({ content: `Could not find \`${maps[i].beatmapId.replace(/`/g, '')}\`.` });
				}

				maps[i].beatmap = beatmap;
				maps[i].index = i + 1;
			}

			let mappool = maps.map(map => {
				return {
					creatorId: discordUser.osuUserId,
					name: interaction.options.getString('name'),
					number: map.index,
					modPool: map.modBits,
					freeMod: map.FM,
					tieBreaker: map.TB,
					modPoolNumber: map.modIndex,
					beatmapId: map.beatmapId,
				};
			});

			await DBOsuMappools.bulkCreate(mappool);

			const mappoolImage = await createMappoolImage(mappool);

			let links = mappool.map(map => {
				let modPool = getMods(map.modPool);

				if (map.tieBreaker) {
					modPool = ['TB'];
				} else if (modPool.length === 0 && !map.freeMod) {
					modPool.push('NM');
				} else if (map.freeMod) {
					modPool.push('FM');
				}

				return `[${modPool.join('')}${map.modPoolNumber}](<https://osu.ppy.sh/b/${map.beatmapId}>)`;
			});

			let content = '';
			let currentPoolNumber = mappool[0].modPoolNumber;

			for (let i = 0; i < links.length; i++) {
				if (mappool[i].modPoolNumber <= currentPoolNumber || i === 0) {
					currentPoolNumber = mappool[i].modPoolNumber;
					content += '\n' + links[i];
				} else {
					content += ' | ' + links[i];
				}
			}

			await interaction.editReply({ content: `Successfully created mappool \`${interaction.options.getString('name').replace(/`/g, '')}\`\n${content}`, files: [mappoolImage] });
		} else if (interaction.options.getSubcommand() === 'remove') {
			logDatabaseQueries(1, 'commands/osu-mappool.js (remove) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				},
			});

			if (!discordUser) {
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			let mappoolName = interaction.options.getString('name');

			let mappool = await DBOsuMappools.destroy({
				where: {
					creatorId: discordUser.osuUserId,
					name: mappoolName,
				},
			});

			let mappoolIndex = userMappools.findIndex(mappool => mappool.name === mappoolName && mappool.creatorId === discordUser.osuUserId);

			if (mappoolIndex !== -1) {
				userMappools.splice(mappoolIndex, 1);
			}

			if (mappool === 0) {
				return await interaction.editReply(`Could not find mappool \`${mappoolName.replace(/`/g, '')}\`.`);
			}

			await interaction.editReply(`Successfully removed mappool \`${mappoolName.replace(/`/g, '')}\`.`);

			let poolAccesses = await DBOsuPoolAccess.destroy({
				where: {
					mappoolName: mappoolName.toLowerCase(),
					accessTakerId: discordUser.osuUserId,
				},
			});

			if (poolAccesses > 0) {
				await interaction.followUp(`Removed \`${poolAccesses}\` pool accesses.`);
			}
		} else if (interaction.options.getSubcommand() === 'view') {
			logDatabaseQueries(1, 'commands/osu-mappool.js (view) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				}
			});

			if (!discordUser) {
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			let mappoolName = interaction.options.getString('name');

			logDatabaseQueries(4, 'commands/osu-mappool.js (view) DBOsuMappools');
			let mappool = await DBOsuMappools.findAll({
				attributes: ['number', 'modPool', 'freeMod', 'tieBreaker', 'modPoolNumber', 'beatmapId'],
				where: {
					creatorId: discordUser.osuUserId,
					name: mappoolName,
				},
				order: [
					['number', 'ASC']
				]
			});

			if (mappool.length === 0) {
				return await interaction.editReply(`Could not find mappool \`${mappoolName.replace(/`/g, '')}\`.`);
			}

			const mappoolImage = await createMappoolImage(mappool);

			let links = mappool.map(map => {
				let modPool = getMods(map.modPool);

				if (map.tieBreaker) {
					modPool = ['TB'];
				} else if (modPool.length === 0 && !map.freeMod) {
					modPool.push('NM');
				} else if (map.freeMod) {
					modPool.push('FM');
				}

				return `[${modPool.join('')}${map.modPoolNumber}](<https://osu.ppy.sh/b/${map.beatmapId}>)`;
			});

			let content = '';
			let currentPoolNumber = mappool[0].modPoolNumber;

			for (let i = 0; i < links.length; i++) {
				if (mappool[i].modPoolNumber <= currentPoolNumber || i === 0) {
					currentPoolNumber = mappool[i].modPoolNumber;
					content += '\n' + links[i];
				} else {
					content += ' | ' + links[i];
				}
			}

			await interaction.editReply({ content: `Mappool \`${mappoolName.replace(/`/g, '')}\`\n${content}`, files: [mappoolImage] });
		} else if (interaction.options.getSubcommand() === 'createfromsheet') {
			logDatabaseQueries(4, 'commands/osu-mappool.js (createfromsheet) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				},
			});

			if (!discordUser) {
				return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
			}

			let sheetId = interaction.options.getString('sheetid').replace('https://docs.google.com/spreadsheets/d/', '').replace(/\/.*/g, '');

			// Initialize the sheet - doc ID is the long id in the sheets URL
			const doc = new GoogleSpreadsheet(sheetId);

			// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
			await doc.useServiceAccountAuth({
				// eslint-disable-next-line no-undef
				client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
				// eslint-disable-next-line no-undef
				private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
			});

			await doc.loadInfo(); // loads document properties and worksheet

			const sheet = doc.sheetsByTitle[interaction.options.getString('sheetname')];

			if (!sheet) {
				return await interaction.editReply(`Could not find sheet \`${interaction.options.getString('sheetname').replace(/`/g, '')}\`.`);
			}

			await sheet.loadCells(`A1:${sheet.lastColumnLetter}${sheet.rowCount}`);

			let headerRow = [];
			let headerRowFound = false;

			let dataRows = [];

			const modPoolHeaders = ['pick', 'mod', 'identifier'];

			const beatmapHeaders = ['map id'];

			for (let i = 0; i < sheet.rowCount; i++) {
				let currentRow = [];
				let currentRowHasData = false;

				for (let j = 0; j < sheet.columnCount; j++) {
					currentRow.push(sheet.getCell(i, j).value);

					if (sheet.getCell(i, j).value !== null) {
						currentRowHasData = true;
					}

					if (sheet.getCell(i, j).value && modPoolHeaders.concat(beatmapHeaders).includes(sheet.getCell(i, j).value.toString().toLowerCase())) {
						headerRowFound = true;
					}
				}

				if (headerRowFound && currentRowHasData && headerRow.length === 0) {
					headerRow = [...currentRow];
				}

				if (currentRowHasData) {
					dataRows.push(currentRow);
				}
			}

			let modPoolIndex = headerRow.findIndex(header => header && modPoolHeaders.includes(header.toString().toLowerCase()));

			if (modPoolIndex === -1) {
				return await interaction.editReply('Could not find the mod pool column.');
			}

			let beatmapIndex = headerRow.findIndex(header => header && beatmapHeaders.includes(header.toString().toLowerCase()));

			if (beatmapIndex === -1) {
				return await interaction.editReply('Could not find the beatmap column.');
			}

			let mappools = [];

			let currentMappool = {
				name: null,
				maps: [],
			};

			let invalidModpools = [];

			for (let i = 0; i < dataRows.length; i++) {
				let currentMap = {
					beatmapId: null,
					modPool: null,
				};

				for (let j = 0; j < dataRows[i].length; j++) {
					let data = dataRows[i][j];

					if (data === null || data === undefined) {
						continue;
					}

					if (data.toString().toLowerCase().includes('qualifiers') ||
						data.toString().toLowerCase().includes('quals') ||
						data.toString().toLowerCase().includes('group stage') ||
						data.toString().toLowerCase().includes('round of') ||
						data.toString().toLowerCase().includes('finals') ||
						data.toString().toLowerCase() === 'ql' ||
						data.toString().toLowerCase() === 'q' ||
						data.toString().toLowerCase() === 'gs' ||
						data.toString().toLowerCase() === 'ro64' ||
						data.toString().toLowerCase() === 'ro32' ||
						data.toString().toLowerCase() === 'ro16' ||
						data.toString().toLowerCase() === 'qf' ||
						data.toString().toLowerCase() === 'sf' ||
						data.toString().toLowerCase() === 'f' ||
						data.toString().toLowerCase() === 'gf') {
						if (currentMappool.name !== null) {
							mappools.push(currentMappool);
						}

						currentMappool = {
							name: `${doc.title} ${data}`,
							maps: [],
						};

						continue;
					}

					if (j === modPoolIndex && (data.toString().toUpperCase().match(/[A-Z]+ *\d+/g) || data.toString().toUpperCase() === 'TB')) {
						let modPool = data.toString().toUpperCase().replaceAll(' ', '').replace(/\d+/g, '');

						modPool = checkViableModpool(modPool);

						if (modPool === false) {
							invalidModpools.push(`\`${data.toString().replace(/`/g, '')}\``);

							modPool = {
								mods: 0,
								FM: true,
								TB: false,
							};
						}

						currentMap.modPool = modPool;
						continue;
					}

					if (j === beatmapIndex && data.toString().match(/\d+/g)) {
						currentMap.beatmapId = data;
						continue;
					}
				}

				if (currentMap.beatmapId !== null) {
					currentMappool.maps.push(currentMap);
				}
			}

			if (currentMappool.name !== null) {
				mappools.push(currentMappool);
			}

			await interaction.followUp({ content: `${invalidModpools.length} invalid modpool(s) have been replaced with FM ${invalidModpools.join(', ')}` });

			for (let i = 0; i < mappools.length; i++) {
				if (mappools[i].maps.length === 0) {
					continue;
				}

				logDatabaseQueries(4, 'commands/osu-mappool.js (createfromsheet) DBOsuBeatmaps 1');
				let beatmaps = await DBOsuBeatmaps.findAll({
					attributes: [
						'beatmapId',
						'beatmapsetId',
						'approvalStatus',
						'mods',
						'updatedAt',
						'starRating',
						'maxCombo',
						'mode',
						'artist',
						'title',
						'difficulty',
					],
					where: {
						beatmapId: {
							[Op.in]: mappools[i].maps.map(map => map.beatmapId),
						},
					},
				});

				let modPoolNumber = 0;
				let currentModPool = null;
				let freeMod = null;
				let tieBreaker = null;

				for (let j = 0; j < mappools[i].maps.length; j++) {
					if (currentModPool !== mappools[i].maps[j].modPool.mods || freeMod !== mappools[i].maps[j].modPool.FM || tieBreaker !== mappools[i].maps[j].modPool.TB) {
						modPoolNumber = 1;
						currentModPool = mappools[i].maps[j].modPool.mods;
						freeMod = mappools[i].maps[j].modPool.FM;
						tieBreaker = mappools[i].maps[j].modPool.TB;
					}

					let modPoolData = mappools[i].maps[j].modPool;

					let beatmap = beatmaps.find(beatmap => beatmap.beatmapId === mappools[i].maps[j].beatmapId && beatmap.mods === mappools[i].maps[j].modPool.mods);

					beatmap = await getOsuBeatmap({ beatmapId: mappools[i].maps[j].beatmapId, modBits: mappools[i].maps[j].modPool.mods, beatmap: beatmap });

					if (beatmap === null) {
						await interaction.followUp({ content: `Could not find \`${mappools[i].maps[j].beatmapId.replace(/`/g, '')}\` for mappool \`${mappools[i].name.replace(/`/g, '')}\`.` });
						continue;
					}

					mappools[i].maps[j].beatmap = beatmap;
					mappools[i].maps[j].index = i + 1;
					mappools[i].maps[j].FM = modPoolData.FM;
					mappools[i].maps[j].TB = modPoolData.TB;
					mappools[i].maps[j].modBits = modPoolData.mods;
					mappools[i].maps[j].modIndex = modPoolNumber;

					modPoolNumber++;
				}

				let mappool = mappools[i].maps.map(map => {
					return {
						creatorId: discordUser.osuUserId,
						name: mappools[i].name,
						number: map.index,
						modPool: map.modBits,
						freeMod: map.FM,
						tieBreaker: map.TB,
						modPoolNumber: map.modIndex,
						beatmapId: map.beatmapId,
						spreadsheetId: sheetId,
					};
				});

				logDatabaseQueries(4, 'commands/osu-mappool.js (createfromsheet) DBOsuMappools 2');
				let existingMappool = await DBOsuMappools.count({
					where: {
						creatorId: discordUser.osuUserId,
						name: mappools[i].name,
					},
				});

				if (existingMappool) {
					await interaction.followUp({ content: `Mappool \`${mappools[i].name.replace(/`/g, '')}\` was already saved.` });
					continue;
				}

				await DBOsuMappools.bulkCreate(mappool);

				let mappoolImage = await createMappoolImage(mappool);

				let links = mappool.map(map => {
					let modPool = getMods(map.modPool);

					if (map.tieBreaker) {
						modPool = ['TB'];
					} else if (modPool.length === 0 && !map.freeMod) {
						modPool.push('NM');
					} else if (map.freeMod) {
						modPool.push('FM');
					}

					return `[${modPool.join('')}${map.modPoolNumber}](<https://osu.ppy.sh/b/${map.beatmapId}>)`;
				});

				let content = '';
				let currentPoolNumber = mappool[0].modPoolNumber;

				for (let i = 0; i < links.length; i++) {
					if (mappool[i].modPoolNumber <= currentPoolNumber || i === 0) {
						currentPoolNumber = mappool[i].modPoolNumber;
						content += '\n' + links[i];
					} else {
						content += ' | ' + links[i];
					}
				}

				await interaction.followUp({ content: `Mappool \`${mappools[i].name.replace(/`/g, '')}\` was saved in the database.\n\n${content}`, files: [mappoolImage] });
			}

			await interaction.followUp({ content: 'Done. Any missing pools will need to be imported manually.' });
		}
	},
};

function checkViableModpool(modPool) {
	if (modPool === null) {
		return null;
	}

	if (modPool === 'TB') {
		return { mods: 0, FM: true, TB: true };
	}

	let FM = false;

	if (modPool.endsWith('FM')) {
		modPool = modPool.slice(0, -2);
		FM = true;
	}

	modPool = modPool.toUpperCase();

	let mods = getMods(getModBits(modPool));

	if (mods.length === 0 && !FM) {
		mods.push('NM');
	}

	if (mods.join('') !== modPool) {
		return false;
	}

	return { mods: getModBits(modPool), FM: FM, TB: false };
}

async function createMappoolImage(mappool) {
	// Draw the image
	const canvasWidth = 908;
	const canvasHeight = mappool.length * 100 + 8;

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	//Get context and load the image
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('./other/osu-background.png');

	for (let i = 0; i < canvas.height / background.height; i++) {
		for (let j = 0; j < canvas.width / background.width; j++) {
			ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
		}
	}

	let tourneyMaps = [];

	logDatabaseQueries(4, 'commands/osu-mappool.js (createMappoolImage) DBOsuBeatmaps');
	let dbBeatmaps = await DBOsuBeatmaps.findAll({
		attributes: [
			'beatmapId',
			'beatmapsetId',
			'approvalStatus',
			'mods',
			'updatedAt',
			'starRating',
			'maxCombo',
			'mode',
			'artist',
			'title',
			'difficulty',
		],
		where: {
			beatmapId: mappool.map(map => map.beatmapId)
		}
	});

	for (let i = 0; i < mappool.length; i++) {
		let map = mappool[i];

		let dbBeatmap = dbBeatmaps.find(beatmap => beatmap.beatmapId === map.beatmapId && beatmap.mods === map.modPool);

		dbBeatmap = await getOsuBeatmap({ beatmap: dbBeatmap, beatmapId: map.beatmapId, modBits: map.modPool });

		if (map.tieBreaker) {
			dbBeatmap.modPool = 'TB';
		} else {
			let mods = getMods(map.modPool);

			if (mods.length === 0 && map.freeMod) {
				dbBeatmap.modPool = 'FM';
			} else if (mods.length === 0) {
				dbBeatmap.modPool = 'NM';
			} else {
				dbBeatmap.modPool = mods.join('');
			}
		}

		dbBeatmap.modPoolCount = map.modPoolNumber;

		tourneyMaps.push(dbBeatmap);
	}

	for (let i = 0; i < tourneyMaps.length; i++) {
		let modColour = '#FFFFFF';

		if (tourneyMaps[i].modPool === 'NM') {
			modColour = '#6d9eeb';
		} else if (tourneyMaps[i].modPool === 'HD') {
			modColour = '#ffd966';
		} else if (tourneyMaps[i].modPool === 'HR') {
			modColour = '#e06666';
		} else if (tourneyMaps[i].modPool === 'DT') {
			modColour = '#b4a7d6';
		} else if (tourneyMaps[i].modPool === 'FM') {
			modColour = '#93c47d';
		} else if (tourneyMaps[i].modPool === 'TB') {
			modColour = '#76a5af';
		}

		// Draw a rectangle
		ctx.fillStyle = '#1E1E1E';
		ctx.fillRect(4, 4 + 100 * i, 100, 100);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(4, 4 + 100 * i, 100, 100);

		// Write the text
		ctx.font = 'bold 30px comfortaa';
		ctx.fillStyle = modColour;
		ctx.textAlign = 'center';
		ctx.fillText(`${tourneyMaps[i].modPool}${tourneyMaps[i].modPoolCount}`, 54, 66 + 100 * i, 75);

		// Draw the map image
		const mapImage = await getBeatmapSlimcover(tourneyMaps[i].beatmapsetId, tourneyMaps[i].beatmapId);
		ctx.drawImage(mapImage, 106, 6 + 100 * i, 396, 96);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(104, 4 + 100 * i, 400, 100);

		// Draw a rectangle
		ctx.fillStyle = '#1E1E1E';
		ctx.fillRect(504, 4 + 100 * i, 400, 100);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(504, 4 + 100 * i, 400, 100);

		// Draw the map title
		ctx.fillStyle = modColour;
		ctx.font = '22px comfortaa';
		ctx.textAlign = 'center';
		ctx.fillText(`${tourneyMaps[i].artist} - ${tourneyMaps[i].title}`, 705, 4 + 100 * i + 40, 375);
		ctx.fillText(`[${tourneyMaps[i].difficulty}]`, 705, 4 + 100 * i + 80, 375);
	}

	// Return the image
	return new AttachmentBuilder(canvas.toBuffer(), { name: 'mappool.png' });
}
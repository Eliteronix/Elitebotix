const { getIDFromPotentialOsuLink, getOsuBeatmap } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
	name: 'osu-mappack',
	description: 'Returns a mappack for the given maps',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-mappack')
		.setNameLocalizations({
			'de': 'osu-mappack',
			'en-GB': 'osu-mappack',
			'en-US': 'osu-mappack',
		})
		.setDescription('Returns a mappack for the given maps')
		.setDescriptionLocalizations({
			'de': 'Gibt ein Mappack für die angegebenen Maps zurück',
			'en-GB': 'Returns a mappack for the given maps',
			'en-US': 'Returns a mappack for the given maps',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('maps')
				.setNameLocalizations({
					'de': 'maps',
					'en-GB': 'maps',
					'en-US': 'maps',
				})
				.setDescription('Map IDs or links (separated by spaces)')
				.setDescriptionLocalizations({
					'de': 'Map IDs oder Links (durch Leerzeichen getrennt)',
					'en-GB': 'Map IDs or links (separated by spaces)',
					'en-US': 'Map IDs or links (separated by spaces)',
				})
				.setRequired(true)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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

		let maps = interaction.options.getString('maps').split(/ +/gm);

		let mapFiles = [];

		for (let i = 0; i < maps.length; i++) {
			await interaction.editReply(`Processing map ${i + 1}/${maps.length}...`);

			maps[i] = getIDFromPotentialOsuLink(maps[i]);

			let dbBeatmap = await getOsuBeatmap({ beatmapId: maps[i] });

			if (!dbBeatmap || dbBeatmap.approvalStatus === 'Not found') {
				await interaction.followUp(`The map with the ID \`${maps[i]}\` could not be found with the osu! API.`);

				maps.splice(i, 1);
				i--;

				if (maps.length === 0) {
					return await interaction.editReply('No valid maps left.');
				}

				continue;
			}

			let mapFile = await fetch(`https://beatconnect.io/b/${dbBeatmap.beatmapsetId}`);

			if (mapFile.status !== 200) {
				await interaction.followUp(`The map with the ID \`${maps[i]}\` could not be found on beatconnect.`);

				maps.splice(i, 1);
				i--;

				if (maps.length === 0) {
					return await interaction.editReply('No valid maps left.');
				}

				continue;
			}

			mapFile = await mapFile.buffer();

			mapFiles.push({
				name: `${dbBeatmap.artist} - ${dbBeatmap.title}.osz`,
				buffer: mapFile,
			});
		}

		// Create the zip file
		const zip = new (require('adm-zip'))();

		for (let i = 0; i < mapFiles.length; i++) {
			zip.addFile(mapFiles[i].name, mapFiles[i].buffer);
		}

		// Upload the zip file somewhere

	},
};
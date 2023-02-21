const osu = require('node-osu');
const { getIDFromPotentialOsuLink } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-collection',
	description: 'Adds the specified osu! beatmap collection to the database',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-collection')
		.setNameLocalizations({
			'de': 'osu-collection',
			'en-GB': 'osu-collection',
			'en-US': 'osu-collection',
		})
		.setDescription('Adds the specified osu! beatmap collection to the database')
		.setDescriptionLocalizations({
			'de': 'Fügt die angegebene osu! Beatmap-Sammlung der Datenbank hinzu',
			'en-GB': 'Adds the specified osu! beatmap collection to the database',
			'en-US': 'Adds the specified osu! beatmap collection to the database',
		})
		.setDMPermission(true)
		.addAttachmentOption(option =>
			option
				.setName('file')
				.setNameLocalizations({
					'de': 'datei',
					'en-GB': 'file',
					'en-US': 'file',
				})
				.setDescription('The current collection.db file')
				.setDescriptionLocalizations({
					'de': 'Die aktuelle collection.db Datei',
					'en-GB': 'The current collection.db file',
					'en-US': 'The current collection.db file',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('name')
				.setNameLocalizations({
					'de': 'name',
					'en-GB': 'name',
					'en-US': 'name',
				})
				.setDescription('The name of the collection')
				.setDescriptionLocalizations({
					'de': 'Der Name der Sammlung',
					'en-GB': 'The name of the collection',
					'en-US': 'The name of the collection',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('maps')
				.setNameLocalizations({
					'de': 'maps',
					'en-GB': 'maps',
					'en-US': 'maps',
				})
				.setDescription('The maps in the collection')
				.setDescriptionLocalizations({
					'de': 'Die Maps in der Sammlung',
					'en-GB': 'The maps in the collection',
					'en-US': 'The maps in the collection',
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

		let attachedFile = interaction.options.getAttachment('file');

		if (attachedFile.name !== 'collection.db') {
			return await interaction.editReply('The attached file is not a collection.db file');
		}

		let file = await fetch(attachedFile.url);

		// Get the file in hex
		file = await file.arrayBuffer();

		// Reply with the original file
		await interaction.editReply(`The original file is available here (as a backup just in case): ${attachedFile.url}`);

		file = buf2hex(file);

		// Get the amount of collections saved in the second int at the start of the file
		let collectionsAmount = file.substring(8, 16);

		// Convert the hex to int
		collectionsAmount = parseInt(collectionsAmount.replace(/0*/gm, ''), 16);

		// Add 1 to the amount of collections
		collectionsAmount++;

		// Convert the int to hex
		collectionsAmount = getInt(collectionsAmount);

		file = file.substring(0, 8) + collectionsAmount + file.substring(16);

		const collectionName = interaction.options.getString('name');

		// Add the collection name to the file
		file = addStringToFile(file, collectionName);

		const collectionMaps = interaction.options.getString('maps').split(/ +/gm);

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		for (let i = 0; i < collectionMaps.length; i++) {
			collectionMaps[i] = getIDFromPotentialOsuLink(collectionMaps[i]);

			let originalMap = collectionMaps[i];

			// Get the beatmap
			collectionMaps[i] = await osuApi.getBeatmaps({ b: collectionMaps[i] })
				.then(beatmaps => {
					return beatmaps[0];
				})
				.catch(() => {
					return null;
				});

			if (collectionMaps[i] === null) {
				await interaction.followUp({ content: `The beatmap \`${originalMap.replace(/`/g, '')}\` could not be found` });

				collectionMaps.splice(i, 1);
				i--;
			}
		}

		// Convert the maps amount to hex 
		const mapsAmountInt = getInt(collectionMaps.length);

		file = file + mapsAmountInt;

		for (let i = 0; i < collectionMaps.length; i++) {
			// Add the map to the file
			file = addStringToFile(file, collectionMaps[i].hash);
		}

		// Return the file as a follow up message
		// eslint-disable-next-line no-undef
		await interaction.followUp({ content: 'The new collection.db file is attached below.\nSave this file in your osu! directory. You will have an existing file that you will need to overwrite.\nBe sure to restart osu! before doing any changes on your collections after overwriting the file.', files: [{ attachment: Buffer.from(file, 'hex'), name: 'collection.db' }] });
	},
};

function buf2hex(buffer) { // buffer is an ArrayBuffer
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');
}

function addStringToFile(file, string) {
	// eslint-disable-next-line no-undef
	const bufferText = Buffer.from(string, 'utf8');
	const text = bufferText.toString('hex');

	const textLengthInt = getInt(Math.ceil(text.length / 2), true);

	// Add the collection name to the file
	file = file + '0b' + textLengthInt + text;

	return file;
}

function getInt(amount, ULEB128) {
	if (ULEB128) {
		//Turn the amount into binary
		amount = amount.toString(2);

		// Pad the binary with 0s to make it a multiple of 7
		amount = amount.padStart(Math.ceil(amount.length / 7) * 7, '0');

		// Split the binary into 7 bit chunks
		amount = amount.match(/.{1,7}/g);

		// Add the 1 to the start of each chunk
		for (let i = 0; i < amount.length; i++) {
			amount[i] = '1' + amount[i];
		}

		// Remove the 1 from the last chunk
		amount[amount.length - 1] = amount[amount.length - 1].replace('1', '0');

		// Convert the binary to hex
		for (let i = 0; i < amount.length; i++) {
			amount[i] = parseInt(amount[i], 2).toString(16).padStart(2, '0');
		}

		// Join the hex chunks together
		amount = amount.join('');

		return amount;
	} else {
		amount = amount.toString(16);

		// Pad the hex with 0s to make it a multiple of 2
		amount = amount.padStart(Math.ceil(amount.length / 2) * 2, '0');

		// Pad the hex with 0s to make it 4 bytes / 8 hex characters
		amount = amount.padEnd(8, '0');

		return amount;
	}
}
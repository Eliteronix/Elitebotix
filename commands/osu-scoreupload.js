const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

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

		if (attachedFile.name !== 'scores.db') {
			return await interaction.editReply('The attached file is not a scores.db file');
		}

		let file = await fetch(attachedFile.url);

		// Get the file in hex
		file = await file.arrayBuffer();

		file = buf2hex(file);

		// First int is the version
		const version = convertHexIntToDecimal(file.substring(0, 8));

		file = file.slice(8);

		// Second int is the amount of beatmaps
		const amountOfBeatmaps = convertHexIntToDecimal(file.substring(0, 8));

		file = file.slice(8);

		// Loop through the beatmaps
		for (let i = 0; i < amountOfBeatmaps; i++) {
			// String	MD5 hash of the beatmap
			file = getNextString(file).newFile;

			const scores = convertHexIntToDecimal(file.substring(0, 8));

			file = file.slice(8);

			for (let j = 0; j < scores; j++) {

			}
		}
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

		// Chunk the hex into 2 character chunks
		amount = amount.match(/.{1,2}/g);

		// Reverse the chunks
		amount = amount.reverse();

		// Join the chunks together
		amount = amount.join('');

		// Pad the hex with 0s to make it 4 bytes / 8 hex characters
		amount = amount.padEnd(8, '0');

		return amount;
	}
}

function convertHexIntToDecimal(hexInput) {
	if (hexInput === '00000000') {
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
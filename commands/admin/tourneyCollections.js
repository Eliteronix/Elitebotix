const { getOsuBeatmap } = require('../../utils');

module.exports = {
	name: 'tourneyCollections',
	usage: '<tourneyAcronym> [<NM/HD/HR/DT/FM/FFM/EZ/TB> [<mapIds seperated by spaces>]]',
	async execute(interaction) {
		let args = interaction.options.getString('argument').split(/ +/);

		const tourneyAcronym = args.shift();

		let tourneyMaps = {
			'NM': [],
			'HD': [],
			'HR': [],
			'DT': [],
			'FM': [],
			'FFM': [],
			'EZ': [],
			'TB': [],
			allMaps: [],
		};

		let mods = ['NM', 'HD', 'HR', 'DT', 'FM', 'FFM', 'EZ', 'TB'];

		let currentMod = null;

		for (let i = 0; i < args.length; i++) {
			if (mods.includes(args[i])) {
				currentMod = args[i];
			} else {
				if (!currentMod) {
					return await interaction.editReply('You need to specify a mod before the mapIds');
				}

				// Get the beatmap
				args[i] = await getOsuBeatmap({ beatmapId: args[i] });

				if (args[i] === null) {
					await interaction.editReply({ content: `The beatmap \`${args[i].replace(/`/g, '')}\` could not be found` });
				} else {
					tourneyMaps[currentMod].push(args[i].hash);
					tourneyMaps.allMaps.push(args[i].hash);
				}
			}
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

		let versionNumber = file.slice(0, 8);

		file = file.slice(16);

		// Manage the collections
		let collections = [];
		while (file.length) {
			// Get the collection name
			// First 2 characters should be 0b
			file = file.slice(2);

			let stringLength = parseInt(file.slice(0, 2), 16);

			file = file.slice(2);

			let collectionName = file.slice(0, stringLength * 2);

			// Convert the hex to string
			// eslint-disable-next-line no-undef
			collectionName = Buffer.from(collectionName, 'hex').toString('utf8');

			file = file.slice(stringLength * 2);

			// Get the amount of maps in the collection
			let mapAmount = file.slice(0, 8);

			if (mapAmount === '00000000') {
				mapAmount = 0;
			} else {
				while (mapAmount.endsWith('00')) {
					mapAmount = mapAmount.slice(0, -2);
				}

				// Chunk the string into 2 characters
				mapAmount = mapAmount.match(/.{1,2}/g);

				// Reverse the array
				mapAmount = mapAmount.reverse();

				// Join the array
				mapAmount = mapAmount.join('');

				mapAmount = parseInt(mapAmount, 16);
			}

			file = file.slice(8);

			// Get the mapIds
			let collection = {
				name: collectionName,
				mapAmount: mapAmount,
				mapHashes: [],
			};

			for (let i = 0; i < mapAmount; i++) {
				//Remove the 0b indicating the start of the string
				file = file.slice(2);

				// Get the length of the string
				stringLength = parseInt(file.slice(0, 2), 16);

				file = file.slice(2);

				// Get the mapHash
				let mapHash = file.slice(0, stringLength * 2);

				// Convert the hex to string
				// eslint-disable-next-line no-undef
				mapHash = Buffer.from(mapHash, 'hex').toString('utf8');

				collection.mapHashes.push(mapHash);

				file = file.slice(stringLength * 2);
			}

			collections.push(collection);
		}

		// Filter the collections based on the tourneyAcronym
		let tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		// Collections may not exist yet, so we need to create them
		let allCurrentPoolCollections = collections.filter(collection => collection.name.match(/2\.[2-9]\.1 .+/));

		let nextFreePoolNumber = 2;

		for (let i = 0; i < allCurrentPoolCollections.length; i++) {
			if (allCurrentPoolCollections[i].name.includes(`2.${nextFreePoolNumber}.1`)) {
				nextFreePoolNumber++;
			} else {
				break;
			}
		}

		if (tourneyCollections.length === 0) {
			collections.push({
				name: `2.${nextFreePoolNumber}.1 ${tourneyAcronym}`,
				mapAmount: 0,
				mapHashes: [],
			});
		} else {
			// set the nextFreePoolNumber to the current pool number
			nextFreePoolNumber = parseInt(tourneyCollections[0].name.split('.')[1]);
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.NM.length) {
			let noModCollection = tourneyCollections.find(collection => collection.name.includes('NoMod'));

			if (!noModCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} NoMod`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.HD.length) {
			let hiddenCollection = tourneyCollections.find(collection => collection.name.includes('Hidden'));

			if (!hiddenCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} Hidden`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.HR.length) {
			let hardRockCollection = tourneyCollections.find(collection => collection.name.includes('HardRock'));

			if (!hardRockCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} HardRock`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.DT.length) {
			let doubleTimeCollection = tourneyCollections.find(collection => collection.name.includes('DoubleTime'));

			if (!doubleTimeCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} DoubleTime`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.FFM.length || tourneyMaps.FM.length) {
			let freeModCollection = tourneyCollections.find(collection => collection.name.includes('FreeMod'));

			if (!freeModCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} FreeMod`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.EZ.length) {
			let easyCollection = tourneyCollections.find(collection => collection.name.includes('Easy'));

			if (!easyCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} Easy`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		if (tourneyMaps.TB.length) {
			let tieBreakerCollection = tourneyCollections.find(collection => collection.name.includes('TieBreaker'));

			if (!tieBreakerCollection) {
				collections.push({
					name: `2.${nextFreePoolNumber}.${tourneyCollections.length + 1} ${tourneyAcronym} TieBreaker`,
					mapAmount: 0,
					mapHashes: [],
				});
			}
		}

		tourneyCollections = collections.filter(collection => collection.name.includes(tourneyAcronym));

		// Empty the collections and add the maps from the tourneyMaps object
		for (let i = 0; i < tourneyCollections.length; i++) {
			tourneyCollections[i].mapAmount = 0;
			tourneyCollections[i].mapHashes = [];

			if (tourneyCollections[i].name.includes('NoMod')) {
				tourneyCollections[i].mapAmount = tourneyMaps.NM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.NM);
			} else if (tourneyCollections[i].name.includes('Hidden')) {
				tourneyCollections[i].mapAmount = tourneyMaps.HD.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.HD);
			} else if (tourneyCollections[i].name.includes('HardRock')) {
				tourneyCollections[i].mapAmount = tourneyMaps.HR.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.HR);
			} else if (tourneyCollections[i].name.includes('DoubleTime')) {
				tourneyCollections[i].mapAmount = tourneyMaps.DT.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.DT);
			} else if (tourneyCollections[i].name.includes('FreeMod')) {
				tourneyCollections[i].mapAmount = tourneyMaps.FM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.FM);
				tourneyCollections[i].mapAmount += tourneyMaps.FFM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.FFM);
			} else if (tourneyCollections[i].name.includes('Easy')) {
				tourneyCollections[i].mapAmount = tourneyMaps.EZ.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.EZ);
			} else if (tourneyCollections[i].name.includes('TieBreaker')) {
				tourneyCollections[i].mapAmount = tourneyMaps.TB.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.TB);
			} else if (tourneyCollections[i].name.endsWith(tourneyAcronym)) {
				// Add all the maps to the collection
				tourneyCollections[i].mapAmount = tourneyMaps.NM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.NM);
				tourneyCollections[i].mapAmount += tourneyMaps.HD.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.HD);
				tourneyCollections[i].mapAmount += tourneyMaps.HR.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.HR);
				tourneyCollections[i].mapAmount += tourneyMaps.DT.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.DT);
				tourneyCollections[i].mapAmount += tourneyMaps.FM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.FM);
				tourneyCollections[i].mapAmount += tourneyMaps.FFM.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.FFM);
				tourneyCollections[i].mapAmount += tourneyMaps.EZ.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.EZ);
				tourneyCollections[i].mapAmount += tourneyMaps.TB.length;
				tourneyCollections[i].mapHashes.push(...tourneyMaps.TB);
			}
		}

		// Add all maps to the unplayed collection
		let unplayedCollection = collections.find(collection => collection.name === '2.1.2 Pools unplayed');

		for (let i = 0; i < tourneyMaps.allMaps.length; i++) {
			if (!unplayedCollection.mapHashes.includes(tourneyMaps.allMaps[i])) {
				unplayedCollection.mapHashes.push(tourneyMaps.allMaps[i]);
				unplayedCollection.mapAmount++;
			}
		}

		// Reconstruct the all pools collection
		let allPoolsCollection = collections.find(collection => collection.name === '2.1.1 All Pools');

		allPoolsCollection.mapAmount = 0;
		allPoolsCollection.mapHashes = [];

		for (let i = 0; i < allCurrentPoolCollections.length; i++) {
			for (let j = 0; j < allCurrentPoolCollections[i].mapHashes.length; j++) {
				if (!allPoolsCollection.mapHashes.includes(allCurrentPoolCollections[i].mapHashes[j])) {
					allPoolsCollection.mapHashes.push(allCurrentPoolCollections[i].mapHashes[j]);
					allPoolsCollection.mapAmount++;
				}
			}
		}

		// Add the new maps to the need to work on collection
		let needToWorkOnCollection = collections.find(collection => collection.name === '1.01 Need to work on');

		for (let i = 0; i < tourneyMaps.allMaps.length; i++) {
			if (!needToWorkOnCollection.mapHashes.includes(tourneyMaps.allMaps[i])) {
				needToWorkOnCollection.mapHashes.push(tourneyMaps.allMaps[i]);
				needToWorkOnCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on NM collection
		let needToWorkOnNMCollection = collections.find(collection => collection.name === '1.02 Need to work on NM');

		for (let i = 0; i < tourneyMaps.NM.length; i++) {
			if (!needToWorkOnNMCollection.mapHashes.includes(tourneyMaps.NM[i])) {
				needToWorkOnNMCollection.mapHashes.push(tourneyMaps.NM[i]);
				needToWorkOnNMCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on HD collection
		let needToWorkOnHDCollection = collections.find(collection => collection.name === '1.03 Need to work on HD');

		for (let i = 0; i < tourneyMaps.HD.length; i++) {
			if (!needToWorkOnHDCollection.mapHashes.includes(tourneyMaps.HD[i])) {
				needToWorkOnHDCollection.mapHashes.push(tourneyMaps.HD[i]);
				needToWorkOnHDCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on HR collection
		let needToWorkOnHRCollection = collections.find(collection => collection.name === '1.04 Need to work on HR');

		for (let i = 0; i < tourneyMaps.HR.length; i++) {
			if (!needToWorkOnHRCollection.mapHashes.includes(tourneyMaps.HR[i])) {
				needToWorkOnHRCollection.mapHashes.push(tourneyMaps.HR[i]);
				needToWorkOnHRCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on DT collection
		let needToWorkOnDTCollection = collections.find(collection => collection.name === '1.05 Need to work on DT');

		for (let i = 0; i < tourneyMaps.DT.length; i++) {
			if (!needToWorkOnDTCollection.mapHashes.includes(tourneyMaps.DT[i])) {
				needToWorkOnDTCollection.mapHashes.push(tourneyMaps.DT[i]);
				needToWorkOnDTCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on FFM collection
		let needToWorkOnFFMCollection = collections.find(collection => collection.name === '1.07 Need to work on FFM');

		for (let i = 0; i < tourneyMaps.FFM.length; i++) {
			if (!needToWorkOnFFMCollection.mapHashes.includes(tourneyMaps.FFM[i])) {
				needToWorkOnFFMCollection.mapHashes.push(tourneyMaps.FFM[i]);
				needToWorkOnFFMCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on FM collection
		let needToWorkOnFMCollection = collections.find(collection => collection.name === '1.08 Need to work on FM');

		for (let i = 0; i < tourneyMaps.FM.length; i++) {
			if (!needToWorkOnFMCollection.mapHashes.includes(tourneyMaps.FM[i])) {
				needToWorkOnFMCollection.mapHashes.push(tourneyMaps.FM[i]);
				needToWorkOnFMCollection.mapAmount++;
			}
		}

		for (let i = 0; i < tourneyMaps.TB.length; i++) {
			if (!needToWorkOnFMCollection.mapHashes.includes(tourneyMaps.TB[i])) {
				needToWorkOnFMCollection.mapHashes.push(tourneyMaps.TB[i]);
				needToWorkOnFMCollection.mapAmount++;
			}
		}

		// Add the new maps to the need to work on EZ collection
		let needToWorkOnEZCollection = collections.find(collection => collection.name === '1.09 Need to work on EZ');

		for (let i = 0; i < tourneyMaps.EZ.length; i++) {
			if (!needToWorkOnEZCollection.mapHashes.includes(tourneyMaps.EZ[i])) {
				needToWorkOnEZCollection.mapHashes.push(tourneyMaps.EZ[i]);
				needToWorkOnEZCollection.mapAmount++;
			}
		}

		// Sort the collections by name
		collections.sort((a, b) => {
			if (a.name < b.name) {
				return -1;
			}
			if (a.name > b.name) {
				return 1;
			}
			return 0;
		});

		// Create the new file
		// Add the version number
		let newFile = versionNumber;

		// Add the amount of collections
		newFile = newFile + getInt(collections.length);

		// Add the collections
		for (let i = 0; i < collections.length; i++) {
			// Add the collection name to the file
			newFile = addStringToFile(newFile, collections[i].name);

			// Add the amount of maps in the collection
			newFile = newFile + getInt(collections[i].mapAmount);

			// Add the maps to the collection
			for (let j = 0; j < collections[i].mapHashes.length; j++) {
				newFile = addStringToFile(newFile, collections[i].mapHashes[j]);
			}
		}

		// Return the new file as a follow up message
		// eslint-disable-next-line no-undef
		await interaction.followUp({ content: 'The new collection.db file is attached below.\nSave this file in your osu! directory. You will have an existing file that you will need to overwrite.\nBe sure to restart osu! before doing any changes on your collections after overwriting the file. If you don\'t have some maps, download them before doing any changes to the collections otherwise the collection will be saved only with the maps that you have.', files: [{ attachment: Buffer.from(newFile, 'hex'), name: 'collection.db' }] });
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
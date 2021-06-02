const osu = require('node-osu');
const Discord = require('discord.js');
const { humanReadable } = require('../utils.js');
const { qualifier } = require('./qualifier.js');

module.exports = {
	setMapsForBracket: async function (client, bancho, SRLimit, NMBeatmaps, DTBeatmaps, upperRank, lowerRank, channelID, roleId, players) {

		let possibleNMBeatmaps = [];
		let possibleDTBeatmaps = [];

		//Filter NM maps by difficulty limit
		for (let i = 0; i < NMBeatmaps.length; i++) {
			if (Math.round(NMBeatmaps[i].difficulty.rating * 100) / 100 < SRLimit) {
				possibleNMBeatmaps.push(NMBeatmaps[i]);
			}
		}

		//Filter DT maps by difficulty limit
		for (let i = 0; i < DTBeatmaps.length; i++) {
			if (Math.round(DTBeatmaps[i].difficulty.rating * 100) / 100 < SRLimit) {
				possibleDTBeatmaps.push(DTBeatmaps[i]);
			}
		}

		if (possibleNMBeatmaps.length < 9) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			//Get The Big Black
			const bigBlack = await osuApi.getBeatmaps({ m: 0, b: '131891' });

			while (possibleNMBeatmaps.length < 9) {
				possibleNMBeatmaps.push(bigBlack[0]);
			}
		}

		let selectedNMMaps = [];

		//Get the 9 hardest NM maps
		for (let i = 0; i < 9; i++) {
			selectedNMMaps.push(possibleNMBeatmaps[possibleNMBeatmaps.length - 9 + i]);
		}

		//Push the chosen maps in correct order
		const mappoolInOrder = [];

		// Max 16 players join the lobby

		// 1 Maps for Qualifiers // 10 minuten
		mappoolInOrder.push(selectedNMMaps[4]);
		// First map 16 -> 14
		mappoolInOrder.push(selectedNMMaps[0]);
		// Second map 14 -> 12
		mappoolInOrder.push(selectedNMMaps[1]);
		// Third map 12 -> 10
		mappoolInOrder.push(selectedNMMaps[2]);
		// Fourth map (DT) 10 -> 8  -> Between difficulty of third and fifth
		const firstDTDifficulty = (parseFloat(selectedNMMaps[3].difficulty.rating) + parseFloat(selectedNMMaps[2].difficulty.rating)) / 2;
		let firstDTMap = possibleDTBeatmaps[0];
		for (let i = 1; i < possibleDTBeatmaps.length; i++) {
			if (Math.abs(firstDTMap.difficulty.rating - firstDTDifficulty) > Math.abs(possibleDTBeatmaps[i].difficulty.rating - firstDTDifficulty)) {
				firstDTMap = possibleDTBeatmaps[i];
			}
		}
		mappoolInOrder.push(firstDTMap);
		// Fifth map 8 -> 6
		mappoolInOrder.push(selectedNMMaps[3]);
		// Sixth map 6 -> 5
		mappoolInOrder.push(selectedNMMaps[5]);
		// Seventh map 5 -> 4
		mappoolInOrder.push(selectedNMMaps[6]);
		// Eigth map (DT) 4 -> 3  -> Between difficulty of sixth and seventh
		const secondDTDifficulty = (parseFloat(selectedNMMaps[5].difficulty.rating) + parseFloat(selectedNMMaps[6].difficulty.rating)) / 2;
		let secondDTMap = possibleDTBeatmaps[0];
		for (let i = 1; i < possibleDTBeatmaps.length; i++) {
			if (Math.abs(secondDTMap.difficulty.rating - secondDTDifficulty) > Math.abs(possibleDTBeatmaps[i].difficulty.rating - secondDTDifficulty)) {
				secondDTMap = possibleDTBeatmaps[i];
			}
		}
		mappoolInOrder.push(secondDTMap);
		// Ninth map 3 -> 2
		mappoolInOrder.push(selectedNMMaps[7]);
		// 10th map 2 -> 1
		mappoolInOrder.push(selectedNMMaps[8]);

		let mappoolLength = 0;
		let gameLength = 0;

		//Calculate match times
		for (let i = 0; i < mappoolInOrder.length; i++) {
			if (!(i === 0 && players.length < 17)) {
				mappoolLength = mappoolLength + parseInt(mappoolInOrder[i].length.total);
				if (i === 0) {
					gameLength = gameLength + 600;
				} else {
					gameLength = gameLength + 120 + parseInt(mappoolInOrder[i].length.total);
				}
			}
		}

		//Prepare official mappool message
		const today = new Date();
		const todayYear = today.getUTCFullYear();
		const todayMonth = (today.getUTCMonth() + 1).toString().padStart(2, '0');
		const todayDay = (today.getUTCDate()).toString().padStart(2, '0');
		const mappoolEmbed = new Discord.MessageEmbed()
			.setColor('#C45686')
			.setTitle(`Mappool from ${todayDay}.${todayMonth}.${todayYear} for ${humanReadable(upperRank)} - ${humanReadable(lowerRank)} BWS`)
			.setDescription(`Mappool for ${humanReadable(upperRank)} - ${humanReadable(lowerRank)} on ${todayDay}.${todayMonth}.${todayYear}`)
			.setFooter(`Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}`);

		for (let i = 0; i < mappoolInOrder.length; i++) {
			if (!(i === 0 && players.length < 17)) {
				let mapPrefix = '';
				if (i === 0) {
					mapPrefix = 'Qualifier:';
				} else if (i === 4 || i === 8) {
					mapPrefix = `Knockout #${i} (DT):`;
				} else {
					mapPrefix = `Knockout #${i}:`;
				}
				const embedName = `${mapPrefix} ${mappoolInOrder[i].artist} - ${mappoolInOrder[i].title} | [${mappoolInOrder[i].version}]`;
				const embedValue = `${Math.round(mappoolInOrder[i].difficulty.rating * 100) / 100}* | ${Math.floor(mappoolInOrder[i].length.total / 60)}:${(mappoolInOrder[i].length.total % 60).toString().padStart(2, '0')} | [Website](<https://osu.ppy.sh/b/${mappoolInOrder[i].id}>) | osu! direct: <osu://b/${mappoolInOrder[i].id}>`;
				mappoolEmbed.addField(embedName, embedValue);
			}
		}

		//Send official message into the correct channel
		const mapsOfTheDayChannel = await client.channels.fetch(channelID);
		// eslint-disable-next-line no-undef
		if (process.env.SERVER !== 'Dev') {
			mapsOfTheDayChannel.send(`<@&${roleId}> The new mappool is out!\nThe bot will send you a DM in a moment. Please follow the instructions given.`);
			mapsOfTheDayChannel.send(mappoolEmbed);
		}

		//Start qualifier process
		qualifier(client, bancho, mappoolInOrder, players);
	}
};
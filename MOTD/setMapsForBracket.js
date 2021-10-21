const Discord = require('discord.js');
const { humanReadable } = require('../utils.js');
const { qualifier } = require('./qualifier.js');
const { DBOsuBeatmaps, DBOsuMultiScores } = require('../dbObjects.js');

module.exports = {
	setMapsForBracket: async function (client, bancho, bracketName, SRLimit, NMBeatmaps, DTBeatmaps, upperRank, lowerRank, channelId, roleId, players) {

		let possibleNMBeatmaps = [];
		let possibleDTBeatmaps = [];

		//Filter NM maps by difficulty limit
		for (let i = 0; i < NMBeatmaps.length; i++) {
			if (Math.round(NMBeatmaps[i].difficulty.rating * 100) / 100 < SRLimit && Math.round(NMBeatmaps[i].difficulty.rating * 100) / 100 > 3.5) {
				possibleNMBeatmaps.push(NMBeatmaps[i]);
			}
		}

		//Filter DT maps by difficulty limit
		for (let i = 0; i < DTBeatmaps.length; i++) {
			if (Math.round(DTBeatmaps[i].difficulty.rating * 100) / 100 < SRLimit && Math.round(DTBeatmaps[i].difficulty.rating * 100) / 100 > 3.5) {
				possibleDTBeatmaps.push(DTBeatmaps[i]);
			}
		}

		//Remove maps if more than enough to make it scale better
		while (possibleNMBeatmaps.length > 9) {
			if (Math.round(possibleNMBeatmaps[0].difficulty.rating * 100) / 100 < 4) {
				possibleNMBeatmaps.splice(0, 1);
			} else {
				//Set initial object
				let smallestGap = {
					index: 1,
					gap: possibleNMBeatmaps[2].difficulty.rating - possibleNMBeatmaps[0].difficulty.rating,
				};

				//start at 2 because the first gap is already in initial object
				//Skip 0 and the end to avoid out of bounds exception
				for (let i = 2; i < possibleNMBeatmaps.length - 1; i++) {
					if (smallestGap.gap > possibleNMBeatmaps[i + 1].difficulty.rating - possibleNMBeatmaps[i - 1].difficulty.rating) {
						smallestGap.gap = possibleNMBeatmaps[i + 1].difficulty.rating - possibleNMBeatmaps[i - 1].difficulty.rating;
						smallestGap.index = i;
					}
				}

				//Remove the map that causes the smallest gap
				possibleNMBeatmaps.splice(smallestGap.index, 1);
			}
		}

		//Fill up maps if not enough
		if (possibleNMBeatmaps.length < 9) {
			const beatmaps = await DBOsuBeatmaps.findAll();

			for (let i = 0; i < beatmaps.length; i++) {
				if (beatmaps[i].mods !== 0 && beatmaps[i].mods !== 1) {
					beatmaps.splice(i, 1);
					i--;
				}
			}

			while (possibleNMBeatmaps.length < 9) {

				let beatmap = null;

				while (!beatmap) {
					const index = Math.floor(Math.random() * beatmaps.length);
					const dbBeatmap = beatmaps[index];

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
						&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6) {
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
							}
						});

						let onlyMOTD = true;
						for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
							if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
								onlyMOTD = false;
							}
						}

						beatmap = {
							id: dbBeatmap.beatmapId,
							beatmapSetId: dbBeatmap.beatmapsetId,
							title: dbBeatmap.title,
							creator: dbBeatmap.mapper,
							version: dbBeatmap.difficulty,
							artist: dbBeatmap.artist,
							rating: dbBeatmap.userRating,
							bpm: dbBeatmap.bpm,
							mode: dbBeatmap.mode,
							approvalStatus: dbBeatmap.approvalStatus,
							maxCombo: dbBeatmap.maxCombo,
							objects: {
								normal: dbBeatmap.circles,
								slider: dbBeatmap.sliders,
								spinner: dbBeatmap.spinners
							},
							difficulty: {
								rating: dbBeatmap.starRating,
								aim: dbBeatmap.aimRating,
								speed: dbBeatmap.speedRating,
								size: dbBeatmap.circleSize,
								overall: dbBeatmap.overallDifficulty,
								approach: dbBeatmap.approachRate,
								drain: dbBeatmap.hpDrain
							},
							length: {
								total: dbBeatmap.totalLength,
								drain: dbBeatmap.drainLength
							}
						};
					}

					beatmaps.splice(index, 1);
				}

				possibleNMBeatmaps.push(beatmap);
			}

			quicksort(possibleNMBeatmaps);
		}

		if (possibleDTBeatmaps.length < 2) {
			const beatmaps = await DBOsuBeatmaps.findAll({
				where: {
					mods: 64
				}
			});

			while (possibleDTBeatmaps.length < 2) {

				let beatmap = null;

				while (!beatmap) {
					const index = Math.floor(Math.random() * beatmaps.length);
					const dbBeatmap = beatmaps[index];

					if (dbBeatmap && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
						&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6) {
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
							}
						});

						let onlyMOTD = true;
						for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
							if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
								onlyMOTD = false;
							}
						}

						beatmap = {
							id: dbBeatmap.beatmapId,
							beatmapSetId: dbBeatmap.beatmapsetId,
							title: dbBeatmap.title,
							creator: dbBeatmap.mapper,
							version: dbBeatmap.difficulty,
							artist: dbBeatmap.artist,
							rating: dbBeatmap.userRating,
							bpm: dbBeatmap.bpm,
							mode: dbBeatmap.mode,
							approvalStatus: dbBeatmap.approvalStatus,
							maxCombo: dbBeatmap.maxCombo,
							objects: {
								normal: dbBeatmap.circles,
								slider: dbBeatmap.sliders,
								spinner: dbBeatmap.spinners
							},
							difficulty: {
								rating: dbBeatmap.starRating,
								aim: dbBeatmap.aimRating,
								speed: dbBeatmap.speedRating,
								size: dbBeatmap.circleSize,
								overall: dbBeatmap.overallDifficulty,
								approach: dbBeatmap.approachRate,
								drain: dbBeatmap.hpDrain
							},
							length: {
								total: dbBeatmap.totalLength,
								drain: dbBeatmap.drainLength
							}
						};
					}

					beatmaps.splice(index, 1);
				}

				possibleDTBeatmaps.push(beatmap);
			}

			quicksort(possibleDTBeatmaps);
		}

		//Artificially lower Beginner Bracket Maps
		if (bracketName === 'Beginner Bracket' && possibleNMBeatmaps.length > 9) {
			while (possibleNMBeatmaps.length > 9 && possibleNMBeatmaps[possibleNMBeatmaps.length - 1].difficulty.rating > 5.5 && possibleNMBeatmaps[possibleNMBeatmaps.length - 10].difficulty.rating > 4) {
				possibleNMBeatmaps.splice(possibleNMBeatmaps.length - 1, 1);
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
		let mapUsedIndex = 0;
		let firstDTMap = possibleDTBeatmaps[0];
		for (let i = 1; i < possibleDTBeatmaps.length; i++) {
			if (Math.abs(firstDTMap.difficulty.rating - firstDTDifficulty) > Math.abs(possibleDTBeatmaps[i].difficulty.rating - firstDTDifficulty)) {
				firstDTMap = possibleDTBeatmaps[i];
				mapUsedIndex = i;
			}
		}
		possibleDTBeatmaps.splice(mapUsedIndex, 1);

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
		const mapsOfTheDayChannel = await client.channels.fetch(channelId);
		// eslint-disable-next-line no-undef
		if (process.env.SERVER !== 'Dev') {
			mapsOfTheDayChannel.send('The new mappool is out!\nThe bot will send you a DM in a moment. Please follow the instructions given.');
			mapsOfTheDayChannel.send({ embeds: [mappoolEmbed] });
		}

		//Start qualifier process
		qualifier(client, bancho, bracketName, mappoolInOrder, players);
	}
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].difficulty.rating) <= parseFloat(pivot.difficulty.rating)) {
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
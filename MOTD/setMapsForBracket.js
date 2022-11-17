const { humanReadable, getOsuBeatmap, logDatabaseQueries } = require('../utils.js');
const { qualifier } = require('./qualifier.js');
const { DBOsuBeatmaps, DBOsuMultiScores } = require('../dbObjects.js');
const osu = require('node-osu');
const { Op } = require('sequelize');

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

		let amountOfMapsInDB = -1;

		if (possibleNMBeatmaps.length < 9 || possibleDTBeatmaps.length < 2) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});
			while (amountOfMapsInDB === -1) {
				const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

				const dbBeatmap = await getOsuBeatmap({ beatmapId: mostRecentBeatmap[0].id, modBits: 0 });

				if (dbBeatmap) {
					amountOfMapsInDB = dbBeatmap.id;
				}
			}
		}

		//Fill up maps if not enough
		if (possibleNMBeatmaps.length < 9) {
			let backupBeatmapIds = [];
			while (possibleNMBeatmaps.length < 9) {

				let beatmap = null;

				while (!beatmap) {
					const index = Math.floor(Math.random() * amountOfMapsInDB);

					logDatabaseQueries(2, 'MOTD/setMapsForBracket.js DBOsuBeatmaps 1');
					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});



					if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 300
						&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6
						&& (dbBeatmap.mods === 0 || dbBeatmap.mods === 1)
						&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
						backupBeatmapIds.push(dbBeatmap.beatmapId);
						logDatabaseQueries(2, 'MOTD/setMapsForBracket.js DBOsuMultiScores 1');
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId,
								[Op.or]: [
									{ warmup: false },
									{ warmup: null }
								],
							},
						});

						let onlyMOTD = true;
						for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
							if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
								onlyMOTD = false;
							}
						}

						if (!onlyMOTD) {
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
					}
				}

				possibleNMBeatmaps.push(beatmap);
			}

			quicksort(possibleNMBeatmaps);
		}

		if (possibleDTBeatmaps.length < 2) {

			let backupBeatmapIds = [];

			while (possibleDTBeatmaps.length < 2) {

				let beatmap = null;

				while (!beatmap) {
					const index = Math.floor(Math.random() * amountOfMapsInDB);

					logDatabaseQueries(2, 'MOTD/setMapsForBracket.js DBOsuBeatmaps 2');
					const dbBeatmap = await DBOsuBeatmaps.findOne({
						where: { id: index }
					});

					if (dbBeatmap && dbBeatmap.mode === 'Standard' && (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved') && parseInt(dbBeatmap.totalLength) <= 450
						&& parseFloat(dbBeatmap.starRating) >= 4 && parseFloat(dbBeatmap.starRating) <= 6
						&& (dbBeatmap.mods === 64 || dbBeatmap.mods === 65)
						&& !backupBeatmapIds.includes(dbBeatmap.beatmapId)) {
						backupBeatmapIds.push(dbBeatmap.beatmapId);
						logDatabaseQueries(2, 'MOTD/setMapsForBracket.js DBOsuMultiScores 2');
						const multiScores = await DBOsuMultiScores.findAll({
							where: {
								tourneyMatch: true,
								beatmapId: dbBeatmap.beatmapId,
								[Op.or]: [
									{ warmup: false },
									{ warmup: null }
								],
							}
						});

						let onlyMOTD = true;
						for (let i = 0; i < multiScores.length && onlyMOTD; i++) {
							if (multiScores[i].matchName && !multiScores[i].matchName.startsWith('MOTD')) {
								onlyMOTD = false;
							}
						}

						if (!onlyMOTD) {
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
					}
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
		// Eigth map (DT) 4 -> 3  -> Between difficulty of seventh and eigth
		const secondDTDifficulty = (parseFloat(selectedNMMaps[6].difficulty.rating) + parseFloat(selectedNMMaps[7].difficulty.rating)) / 2;
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

		let now = new Date();
		if (now.getUTCDate(1) === 1 && now.getUTCMonth() === 3) {
			for (let i = 0; i < mappoolInOrder.length; i++) {
				let dbBeatmap = null;
				if (i === 0) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1797548', modBits: 0 });
				} else if (i === 1) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1764213', modBits: 0 });
				} else if (i === 2) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1893461', modBits: 0 });
				} else if (i === 3) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1401608', modBits: 0 });
				} else if (i === 4) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1180037', modBits: 64 });
				} else if (i === 5) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '2030431', modBits: 0 });
				} else if (i === 6) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1383389', modBits: 0 });
				} else if (i === 7) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1321495', modBits: 0 });
				} else if (i === 8) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1948941', modBits: 64 });
				} else if (i === 9) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1797542', modBits: 0 });
				} else if (i === 10) {
					dbBeatmap = await getOsuBeatmap({ beatmapId: '1851299', modBits: 0 });
				}
				mappoolInOrder[i] = {
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
		}

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

		// eslint-disable-next-line no-undef
		if (process.env.SERVER !== 'Dev') {
			client.shard.broadcastEval(async (c, { channelId, title, description, footer, mappoolInOrder, playerAmount }) => {
				//Send official message into the correct channel
				const mapsOfTheDayChannel = await c.channels.fetch(channelId);
				if (mapsOfTheDayChannel) {
					const Discord = require('discord.js');
					const mappoolEmbed = new Discord.MessageEmbed()
						.setColor('#C45686')
						.setTitle(title)
						.setDescription(description)
						.setFooter({ text: footer });

					for (let i = 0; i < mappoolInOrder.length; i++) {
						if (!(i === 0 && playerAmount < 17)) {
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
					mapsOfTheDayChannel.send('The new mappool is out!\nThe bot will send you a DM in a moment. Please follow the instructions given.');
					mapsOfTheDayChannel.send({ embeds: [mappoolEmbed] });
				}
			}, {
				context: {
					channelId: channelId,
					title: `Mappool from ${todayDay}.${todayMonth}.${todayYear} for ${humanReadable(upperRank)} - ${humanReadable(lowerRank)} BWS`,
					description: `Mappool for ${humanReadable(upperRank)} - ${humanReadable(lowerRank)} on ${todayDay}.${todayMonth}.${todayYear}`,
					footer: `Mappool length: ${Math.floor(mappoolLength / 60)}:${(mappoolLength % 60).toString().padStart(2, '0')} | Estimated game length: ${Math.floor(gameLength / 60)}:${(gameLength % 60).toString().padStart(2, '0')}`,
					mappoolInOrder: mappoolInOrder,
					playerAmount: players.length
				}
			});
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
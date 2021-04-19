const osu = require('node-osu');
const { calculateStarRating } = require('osu-sr-calculator');
const { assignPlayerRoles } = require('./assignPlayerRoles');
const { setMapsForBracket } = require('./setMapsForBracket');

module.exports = {
	getMOTDMapsOnTime: async function (client) {
		const today = new Date();
		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA' && today.getUTCHours() === 18 && today.getUTCMinutes() === 0) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let yesterday = new Date();

			yesterday.setDate(today.getDate() - 1);

			const yesterdayYear = yesterday.getUTCFullYear();
			const yesterdayMonth = (yesterday.getUTCMonth() + 1).toString().padStart(2, '0');
			const yesterdayDay = (yesterday.getUTCDate()).toString().padStart(2, '0');
			const yesterdayHour = (yesterday.getUTCHours()).toString().padStart(2, '0');
			const yesterdayMinute = (yesterday.getUTCMinutes()).toString().padStart(2, '0');
			const yesterdaySecond = (yesterday.getUTCSeconds()).toString().padStart(2, '0');

			const yesterdayMySQLFormat = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay} ${yesterdayHour}:${yesterdayMinute}:${yesterdaySecond}`;

			osuApi.getBeatmaps({ m: 0, since: yesterdayMySQLFormat }) //mySQL date YYYY-MM-DD hh:mm:ss
				.then(async (beatmaps) => {
					let NMBeatmaps = [];

					let DTBeatmaps = [];

					for (let i = 0; i < beatmaps.length; i++) {
						if (beatmaps[i].approvalStatus === 'Ranked' && beatmaps[i].length.total <= 300) {
							NMBeatmaps.push(beatmaps[i]);
						}
						if (beatmaps[i].approvalStatus === 'Ranked' && beatmaps[i].length.total <= 450) {
							const beatmap = {
								id: beatmaps[i].id,
								beatmapSetId: beatmaps[i].beatmapSetId,
								hash: beatmaps[i].hash,
								title: beatmaps[i].title,
								creator: beatmaps[i].creator,
								version: beatmaps[i].version,
								source: beatmaps[i].source,
								artist: beatmaps[i].artist,
								genre: beatmaps[i].genre,
								language: beatmaps[i].language,
								rating: beatmaps[i].rating,
								bpm: beatmaps[i].bpm,
								mode: beatmaps[i].mode,
								tags: beatmaps[i].tags,
								approvalStatus: beatmaps[i].approvalStatus,
								raw_submitDate: beatmaps[i].raw_submitDate,
								raw_approvedDate: beatmaps[i].raw_approvedDate,
								raw_lastUpdate: beatmaps[i].raw_lastUpdate,
								maxCombo: beatmaps[i].maxCombo,
								objects: {
									normal: beatmaps[i].objects.normal,
									slider: beatmaps[i].objects.slider,
									spinner: beatmaps[i].objects.spinner
								},
								difficulty: {
									rating: beatmaps[i].difficulty.rating,
									aim: beatmaps[i].difficulty.aim,
									speed: beatmaps[i].difficulty.speed,
									size: beatmaps[i].difficulty.size,
									overall: beatmaps[i].difficulty.overall,
									approach: beatmaps[i].difficulty.approach,
									drain: beatmaps[i].difficulty.drain
								},
								length: {
									total: beatmaps[i].length.total,
									drain: beatmaps[i].length.drain
								},
								counts: {
									favorites: beatmaps[i].counts.favorites,
									favourites: beatmaps[i].counts.favourites,
									plays: beatmaps[i].counts.plays,
									passes: beatmaps[i].counts.passes
								},
								hasDownload: beatmaps[i].hasDownload,
								hasAudio: beatmaps[i].hasAudio,
							};

							DTBeatmaps.push(beatmap);
						}
					}

					for (let i = 0; i < DTBeatmaps.length; i++) {
						const starRating = await calculateStarRating(DTBeatmaps[i].id, ['DT'], false, true);

						DTBeatmaps[i].difficulty.rating = starRating.DT.total;
						DTBeatmaps[i].difficulty.aim = starRating.DT.aim;
						DTBeatmaps[i].difficulty.speed = starRating.DT.speed;
						DTBeatmaps[i].length.total = Math.round(DTBeatmaps[i].length.total / 3 * 2);
						DTBeatmaps[i].length.drain = Math.round(DTBeatmaps[i].length.drain / 3 * 2);
						DTBeatmaps[i].bpm = DTBeatmaps[i].bpm * 1.5;

					}

					quicksort(NMBeatmaps);

					quicksort(DTBeatmaps);

					const todayYear = today.getUTCFullYear();
					const todayMonth = (today.getUTCMonth() + 1).toString().padStart(2, '0');
					const todayDay = (today.getUTCDate()).toString().padStart(2, '0');

					let data = [];
					data.push(`NoMod maps from \`${todayDay}.${todayMonth}.${todayYear}\``);

					for (let i = 0; i < NMBeatmaps.length; i++) {
						data.push(`${NMBeatmaps[i].artist} - ${NMBeatmaps[i].title} | [${NMBeatmaps[i].version}]`);
						data.push(`${Math.round(NMBeatmaps[i].difficulty.rating * 100) / 100}* | ${Math.floor(NMBeatmaps[i].length.total / 60)}:${NMBeatmaps[i].length.total % 60} | ${NMBeatmaps[i].bpm} BPM | CS ${NMBeatmaps[i].difficulty.size} | HP ${NMBeatmaps[i].difficulty.drain} | OD ${NMBeatmaps[i].difficulty.overall} | AR ${NMBeatmaps[i].difficulty.approach} | [Website](<https://osu.ppy.sh/b/${NMBeatmaps[i].id}>) | osu! direct: <osu://dl/${NMBeatmaps[i].beatmapSetId}>`);
					}

					data.push(`DoubleTime maps from \`${todayDay}.${todayMonth}.${todayYear}\``);

					for (let i = 0; i < DTBeatmaps.length; i++) {
						data.push(`${DTBeatmaps[i].artist} - ${DTBeatmaps[i].title} | [${DTBeatmaps[i].version}]`);
						data.push(`${Math.round(DTBeatmaps[i].difficulty.rating * 100) / 100}* | ${Math.floor(DTBeatmaps[i].length.total / 60)}:${DTBeatmaps[i].length.total % 60} | ${DTBeatmaps[i].bpm} BPM | CS ${DTBeatmaps[i].difficulty.size} | HP ${DTBeatmaps[i].difficulty.drain} | OD ${DTBeatmaps[i].difficulty.overall} | AR ${DTBeatmaps[i].difficulty.approach} | [Website](<https://osu.ppy.sh/b/${DTBeatmaps[i].id}>) | osu! direct: <osu://dl/${DTBeatmaps[i].beatmapSetId}>`);
					}

					const mapsOfTheDayChannel = await client.channels.fetch('831959379800621147');
					mapsOfTheDayChannel.send(data, { split: true });

					const allPlayers = await assignPlayerRoles(client);

					// Trigger Mappool creation for the different brackets
					setMapsForBracket(client, 8, NMBeatmaps, DTBeatmaps, 1, 9999, '833076996258005002', '833313544400535613', allPlayers[0]);
					setMapsForBracket(client, 6.5, NMBeatmaps, DTBeatmaps, 10000, 49999, '833077384725921813', '833313704136540171', allPlayers[1]);
					setMapsForBracket(client, 6, NMBeatmaps, DTBeatmaps, 50000, 99999, '833077410328739890', '833313763188801578', allPlayers[2]);
					setMapsForBracket(client, 5.5, NMBeatmaps, DTBeatmaps, 100000, 9999999, '833077435687370752', '833313827172646912', allPlayers[3]);
				})
				.catch(e => {
					console.log(e);
				});
		}
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
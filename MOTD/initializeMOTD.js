const osu = require('node-osu');
const { assignPlayerRoles } = require('./assignPlayerRoles');
const { setMapsForBracket } = require('./setMapsForBracket');
const { createLeaderboard } = require('./createLeaderboard');
const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	initializeMOTD: async function (client, bancho, manualStart, manualLeaderboard) {
		//Start everything in that minute
		const today = new Date();
		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Live' && today.getUTCHours() === 19 && today.getUTCMinutes() === 0 || manualStart) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let yesterday = new Date();

			//Calculate yesterday
			yesterday.setDate(today.getDate() - 1);

			const yesterdayYear = yesterday.getUTCFullYear();
			const yesterdayMonth = (yesterday.getUTCMonth() + 1).toString().padStart(2, '0');
			const yesterdayDay = (yesterday.getUTCDate()).toString().padStart(2, '0');
			const yesterdayHour = (yesterday.getUTCHours()).toString().padStart(2, '0');
			const yesterdayMinute = (yesterday.getUTCMinutes()).toString().padStart(2, '0');
			const yesterdaySecond = (yesterday.getUTCSeconds()).toString().padStart(2, '0');

			const yesterdayMySQLFormat = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay} ${yesterdayHour}:${yesterdayMinute}:${yesterdaySecond}`;

			//Get all maps since yesterday
			osuApi.getBeatmaps({ m: 0, since: yesterdayMySQLFormat }) //mySQL date YYYY-MM-DD hh:mm:ss
				.then(async (beatmaps) => {
					let NMBeatmaps = [];

					let DTBeatmaps = [];

					for (let i = 0; i < beatmaps.length; i++) {
						//Push all maps which are ranked and below 5 minutes
						if (beatmaps[i].approvalStatus === 'Ranked' && beatmaps[i].length.total <= 300) {
							NMBeatmaps.push(beatmaps[i]);
						}

						//Push all maps which are ranked and below 7:30 minutes (for DT)
						if (beatmaps[i].approvalStatus === 'Ranked' && beatmaps[i].length.total <= 450) {
							//Create a new object for each map to avoid overwriting due to reference
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

					//Calculate Difficulties and other stuff for DT
					for (let i = 0; i < DTBeatmaps.length; i++) {
						const dtMap = await osuApi.getBeatmaps({ b: DTBeatmaps[i].id, mods: 64 });

						DTBeatmaps[i].difficulty.rating = dtMap[0].difficulty.rating;
						DTBeatmaps[i].difficulty.aim = dtMap[0].difficulty.aim;
						DTBeatmaps[i].difficulty.speed = dtMap[0].difficulty.speed;
						DTBeatmaps[i].length.total = Math.round(DTBeatmaps[i].length.total / 3 * 2);
						DTBeatmaps[i].length.drain = Math.round(DTBeatmaps[i].length.drain / 3 * 2);
						DTBeatmaps[i].difficulty.overall = Math.round(((79.5 - ((79.5 - 6 * DTBeatmaps[i].difficulty.overall) * 2 / 3)) / 6) * 100) / 100;
						DTBeatmaps[i].bpm = DTBeatmaps[i].bpm * 1.5;
						if (parseInt(DTBeatmaps[i].difficulty.approach) <= 5) {
							DTBeatmaps[i].difficulty.approach = Math.round(((1800 - ((1800 - DTBeatmaps[i].difficulty.approach * 120) * 2 / 3)) / 120) * 100) / 100;
						} else {
							DTBeatmaps[i].difficulty.approach = Math.round((((1200 - ((1200 - (DTBeatmaps[i].difficulty.approach - 5) * 150) * 2 / 3)) / 150) + 5) * 100) / 100;
						}
					}

					//Sort the maps by difficulty each
					quicksort(NMBeatmaps);

					quicksort(DTBeatmaps);

					// eslint-disable-next-line no-undef
					if (process.env.SERVER !== 'Dev') {
						//Assign roles to all players currently registered and remove unneeded roles
						await assignPlayerRoles(client);
					}

					//Get all players for today
					const allPlayers = await getPlayers(client);

					// Trigger Mappool creation for the different brackets
					// setMapsForBracket(client, bancho, 'Top Bracket', 8, NMBeatmaps, DTBeatmaps, 1, 9999, '833076996258005002', '833313544400535613', allPlayers[0]);
					// setMapsForBracket(client, bancho, 'Middle Bracket', 6.6, NMBeatmaps, DTBeatmaps, 10000, 49999, '833077384725921813', '833313704136540171', allPlayers[1]);
					// setMapsForBracket(client, bancho, 'Lower Bracket', 6.2, NMBeatmaps, DTBeatmaps, 50000, 99999, '833077410328739890', '833313763188801578', allPlayers[2]);
					// setMapsForBracket(client, bancho, 'Beginner Bracket', 5.8, NMBeatmaps, DTBeatmaps, 100000, 9999999, '833077435687370752', '833313827172646912', allPlayers[3]);
					setMapsForBracket(client, bancho, 'Knockout', 6.4, NMBeatmaps, DTBeatmaps, 1, 9999999, '893215604503351386', '833313361483530261', allPlayers[0]);
				})
				.catch(e => {
					console.log(e);
				});
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'Live' && today.getUTCHours() === 20 && today.getUTCMinutes() === 30 || manualLeaderboard) {
			//Maybe create all leaderboards daily anyway?
			//Get Dates
			let todayMorning = new Date();
			todayMorning.setHours(0);

			//Daily Leaderboards
			createLeaderboard(client, todayMorning, 1, 'Daily', '835187330087911505');

			let mondayMorning = new Date();
			mondayMorning.setHours(0);
			if (mondayMorning.getUTCDay() === 0) {
				mondayMorning.setUTCDate(mondayMorning.getUTCDate() - 6);
			} else {
				mondayMorning.setUTCDate(mondayMorning.getUTCDate() - (mondayMorning.getUTCDay() - 1));
			}

			//Weekly Leaderboard
			createLeaderboard(client, mondayMorning, 3, 'Weekly', '835187571625164800');

			let monthMorning = new Date();
			monthMorning.setHours(0);
			monthMorning.setUTCDate(1);

			//Monthly Leaderboard
			createLeaderboard(client, monthMorning, 15, 'Monthly', '835187660183699487');

			let quarterMorning = new Date();
			quarterMorning.setHours(0);
			quarterMorning.setUTCDate(1);
			quarterMorning.setUTCMonth(quarterMorning.getUTCMonth() - (quarterMorning.getUTCMonth() % 3));

			//Quarter Yearly Leaderboard
			createLeaderboard(client, quarterMorning, 45, 'Quarter Yearly', '835187745210499073');

			let beginningOfTime = new Date();
			beginningOfTime.setHours(0);
			beginningOfTime.setUTCDate(beginningOfTime.getUTCDate() - (beginningOfTime.getUTCDay() - 1));
			beginningOfTime.setUTCDate(1);
			beginningOfTime.setUTCMonth(beginningOfTime.getUTCMonth() - (beginningOfTime.getUTCMonth() % 3));
			beginningOfTime.setUTCFullYear(2000);

			//All Time Leaderboard
			createLeaderboard(client, beginningOfTime, 1000000, 'All Time', '835187880229339187');
			// eslint-disable-next-line no-undef
		} else if (process.env.SERVER === 'Live' && today.getUTCMinutes() % 10 === 0) {
			//Assign roles to all players currently registered and remove unneeded roles
			await assignPlayerRoles(client);
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

async function getPlayers(client) {
	logDatabaseQueries(2, 'MOTD/initializeMOTD.js DBDiscordUsers');
	const registeredUsers = await DBDiscordUsers.findAll({
		where: { osuMOTDRegistered: 1 }
	});

	let topBracketPlayers = [];
	let middleBracketPlayers = [];
	let lowerBracketPlayers = [];
	let beginnerBracketPlayers = [];

	for (let i = 0; i < registeredUsers.length; i++) {
		if (!registeredUsers[i].osuMOTDMuted) {
			if (registeredUsers[i].osuUserId) {
				// eslint-disable-next-line no-undef
				if (process.env.SERVER === 'Dev') {
					for (let j = 0; j < 1; j++) {
						topBracketPlayers.push(registeredUsers[i]);
						// middleBracketPlayers.push(registeredUsers[i]);
						// lowerBracketPlayers.push(registeredUsers[i]);
						// beginnerBracketPlayers.push(registeredUsers[i]);
					}
					// eslint-disable-next-line no-undef
				} else if (process.env.SERVER === 'QA') {
					lowerBracketPlayers.push(registeredUsers[i]);
				} else {
					// let BWSRank = Math.round(Math.pow(registeredUsers[i].osuRank, Math.pow(0.9937, Math.pow(registeredUsers[i].osuBadges, 2))));
					// if (BWSRank < 10000) {
					// 	topBracketPlayers.push(registeredUsers[i]);
					// } else if (BWSRank < 50000) {
					// 	middleBracketPlayers.push(registeredUsers[i]);
					// } else if (BWSRank < 100000) {
					// 	lowerBracketPlayers.push(registeredUsers[i]);
					// } else if (BWSRank < 10000000) {
					// 	beginnerBracketPlayers.push(registeredUsers[i]);
					// }
					topBracketPlayers.push(registeredUsers[i]);
				}
			} else {
				registeredUsers[i].osuMOTDRegistered = 0;
				await registeredUsers[i].save();

				client.users.fetch(registeredUsers[i].userId)
					.then(async (user) => {
						user.send('It seems like you removed your connected osu! account and have been removed as a player for the `Maps of the Day` competition because of that.\nIf you want to take part again please reconnect your osu! account and use `e!osu-motd register` again.');
					});
			}
		}
	}

	let allPlayers = [];
	allPlayers.push(topBracketPlayers);
	allPlayers.push(middleBracketPlayers);
	allPlayers.push(lowerBracketPlayers);
	allPlayers.push(beginnerBracketPlayers);

	return allPlayers;
}
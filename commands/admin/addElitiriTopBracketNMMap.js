const { logDatabaseQueries, logOsuAPICalls } = require('../../utils');
const osu = require('node-osu');
const { DBElitiriCupSubmissions } = require('../../dbObjects');
const { currentElitiriCup } = require('../../config.json');


module.exports = {
	name: 'addElitiriTopBracketNMMap',
	usage: '<beatmapId>',
	async execute(interaction) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		logOsuAPICalls('admin/addElitiriTopBracketNMMap.js');
		osuApi.getBeatmaps({ b: interaction.options.getString('argument') })
			.then(async (beatmaps) => {
				logDatabaseQueries(4, 'commands/admin/addElitiriTopBracketNMMap.js DBElitiriCupSubmissions');
				DBElitiriCupSubmissions.create({
					osuUserId: '-1',
					osuName: 'ECW 2021 Submission',
					bracketName: 'Top Bracket',
					tournamentName: currentElitiriCup,
					modPool: 'NM',
					title: beatmaps[0].title,
					artist: beatmaps[0].artist,
					difficulty: beatmaps[0].version,
					starRating: beatmaps[0].difficulty.rating,
					drainLength: beatmaps[0].length.drain,
					circleSize: beatmaps[0].difficulty.size,
					approachRate: beatmaps[0].difficulty.approach,
					overallDifficulty: beatmaps[0].difficulty.overall,
					hpDrain: beatmaps[0].difficulty.drain,
					mapper: beatmaps[0].creator,
					beatmapId: beatmaps[0].id,
					beatmapsetId: beatmaps[0].beatmapSetId,
					bpm: beatmaps[0].bpm,
				});
			})
			.catch(error => {
				console.error(error);
			});
	},
};
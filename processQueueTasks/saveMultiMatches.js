const osu = require('node-osu');
const { DBOsuMultiScores } = require('../dbObjects');
const { saveOsuMultiScores, logDatabaseQueries } = require('../utils');

//Archiving started around 40000000

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let matchID = args[0];

		// eslint-disable-next-line no-undef
		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchID) % process.env.OSUTOKENSV1.split('-').length];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Live' && matchID === '90305374') {
			matchID = '90305375';
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA' && matchID === '56267496') {
			// eslint-disable-next-line no-undef
			console.log(`Manually deleted task for saving Multi Matches for ${matchID} ${process.env.SERVER}`);
			return await processQueueEntry.destroy();
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Dev') {
			return await processIncompleteScores(osuApi, client, processQueueEntry, '964656429485154364');
		}

		await osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					let date = new Date();
					if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
						await saveOsuMultiScores(match);
						let now = new Date();
						let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
						let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
						let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);
						let channel;
						// eslint-disable-next-line no-undef
						if (process.env.SERVER === 'Live') {
							channel = await client.channels.fetch('891314445559676928');
						} else {
							channel = await client.channels.fetch('892873577479692358');
						}
						await channel.send(`<https://osu.ppy.sh/mp/${matchID}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m \`${match.name}\` done`);
					}
					//Go next if match found and ended / too long going already
					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Live') {
						processQueueEntry.additions = `${parseInt(matchID) + 1}`;
					} else {
						processQueueEntry.additions = `${parseInt(matchID) - 1}`;
					}
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				}

				return await processIncompleteScores(osuApi, client, processQueueEntry, '959499050246344754');
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					//Go next if match not found
					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Live') {
						processQueueEntry.additions = `${parseInt(matchID) + 1}`;
					} else {
						processQueueEntry.additions = `${parseInt(matchID) - 1}`;
					}
					let date = new Date();
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				} else {
					try {
						// Check using node fetch
						const fetch = require('node-fetch');
						let response = await fetch(`https://osu.ppy.sh/community/matches/${parseInt(matchID)}`);
						let htmlCode = await response.text();
						let isolatedContent = htmlCode.replace(/[\s\S]+<script id="json-events" type="application\/json">/gm, '').replace(/<\/script>[\s\S]+/gm, '');
						let json = JSON.parse(isolatedContent);
						if (Date.parse(json.events[json.events.length - 1].timestamp) - Date.parse(json.match.start_time) > 86400000) {
							//Go next if over 24 hours long game
							// eslint-disable-next-line no-undef
							if (process.env.SERVER === 'Live') {
								processQueueEntry.additions = `${parseInt(matchID) + 1}`;
							} else {
								processQueueEntry.additions = `${parseInt(matchID) - 1}`;
							}
							let date = new Date();
							processQueueEntry.date = date;
							processQueueEntry.beingExecuted = false;
							return await processQueueEntry.save();
						} else {
							//Go same if under 24 hours long game
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 1);
							processQueueEntry.date = date;
							processQueueEntry.beingExecuted = false;
							return await processQueueEntry.save();
						}
					} catch (error) {
						console.log(error, `going same saveMultiMatches.js https://osu.ppy.sh/community/matches/${parseInt(matchID)}`);
						//Go same if error
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 1);
						processQueueEntry.date = date;
						processQueueEntry.beingExecuted = false;
						return await processQueueEntry.save();
					}
				}
			});
	},
};

async function processIncompleteScores(osuApi, client, processQueueEntry, channelId) {
	//Go same if match found and not ended / too long going already
	//Reimport an old match to clean up the database
	logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores');
	let incompleteMatchScore = await DBOsuMultiScores.findOne({
		where: {
			tourneyMatch: true,
			warmup: null
		},
		order: [
			['updatedAt', 'ASC']
		]
	});

	if (incompleteMatchScore) {
		await osuApi.getMatch({ mp: incompleteMatchScore.matchId })
			.then(async (match) => {
				await saveOsuMultiScores(match);
				let channel = await client.channels.fetch(channelId);
				await channel.send(`<https://osu.ppy.sh/mp/${match.id}> | ${incompleteMatchScore.updatedAt.getUTCHours().toString().padStart(2, 0)}:${incompleteMatchScore.updatedAt.getUTCMinutes().toString().padStart(2, 0)} ${incompleteMatchScore.updatedAt.getUTCDate().toString().padStart(2, 0)}.${(incompleteMatchScore.updatedAt.getUTCMonth() + 1).toString().padStart(2, 0)}.${incompleteMatchScore.updatedAt.getUTCFullYear()} | \`${match.name}\``);
			})
			.catch(async (err) => {
				logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores backup');
				let incompleteScores = await DBOsuMultiScores.findAll({
					where: {
						matchId: incompleteMatchScore.matchId
					}
				});
				if (err.message === 'Not found') {
					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].warmup = false;
						incompleteScores[i].maxCombo = 0;
						incompleteScores[i].pp = 0;
						await incompleteScores[i].save();
					}
				} else {
					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].changed('updatedAt', true);
						await incompleteScores[i].save();
					}
				}
			});
	}

	let date = new Date();
	date.setUTCSeconds(date.getUTCSeconds() + 30);
	processQueueEntry.date = date;
	processQueueEntry.beingExecuted = false;
	return await processQueueEntry.save();
}
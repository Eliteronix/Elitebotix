const osu = require('node-osu');
const { saveOsuMultiScores } = require('../utils');

//Archiving started around 40000000

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		// eslint-disable-next-line no-undef
		let APItoken = process.env.OSUTOKENV1;

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA') {
			// eslint-disable-next-line no-undef
			APItoken = process.env.OSUTOKENV1BACKUP;
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Live' && matchID === '50000000') {
			matchID = '90000000';
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA' && matchID === '56267496') {
			matchID = '90000000';
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA' && matchID === '56267496') {
			// eslint-disable-next-line no-undef
			console.log(`Manually deleted task for saving Multi Matches for ${matchID} ${process.env.SERVER}`);
			return processQueueEntry.destroy();
		}

		// eslint-disable-next-line no-undef
		if (args[0] === '-1' || process.env.SERVER === 'Dev') {
			console.log(`Manually deleted task for saving Multi Matches for ${matchID}`);
			return processQueueEntry.destroy();
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
						saveOsuMultiScores(match);
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
						channel.send(`<https://osu.ppy.sh/mp/${matchID}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m ${match.name} done`);
					}
					//Go next if match found and ended / too long going already
					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Live') {
						processQueueEntry.additions = `${parseInt(matchID) + 1}`;
					} else {
						processQueueEntry.additions = `${parseInt(matchID) - 1}`;
					}
					let date = new Date();
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return processQueueEntry.save();
				}

				//Go same if match found and not ended / too long going already
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return processQueueEntry.save();
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
					return processQueueEntry.save();
				} else {
					//Go same if error
					let date = new Date();
					date.setUTCMinutes(date.getUTCMinutes() + 1);
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return processQueueEntry.save();
				}
			});
	},
};
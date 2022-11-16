const { saveOsuMultiScores } = require('../utils');
const osu = require('node-osu');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('importMatch');
		let args = processQueueEntry.additions.split(';');

		let matchId = args[0];

		// eslint-disable-next-line no-undef
		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchId) % process.env.OSUTOKENSV1.split('-').length];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		await osuApi.getMatch({ mp: matchId })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					//Match completed / 6 hours since start
					await saveOsuMultiScores(match);
					let now = new Date();
					let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
					let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
					let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);
					let channel;
					let ping = '';
					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Live') {
						channel = await client.channels.fetch('891314445559676928');
						// eslint-disable-next-line no-undef
					} else if (process.env.SERVER === 'QA') {
						channel = await client.channels.fetch('892873577479692358');
						ping = ' <@981205694340546571>';
					} else {
						channel = await client.channels.fetch('1013789721014571090');
					}
					await channel.send(`<https://osu.ppy.sh/mp/${matchId}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m \`${match.name}\` done${ping}`);

					return await processQueueEntry.destroy();
				}

				//Match has not been completed yet / 6 hours didn't pass
				await saveOsuMultiScores(match);
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 5);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			})
			.catch(async (error) => {
				console.log(error, `going same importMatch.js https://osu.ppy.sh/community/matches/${parseInt(matchId)}`);
				//Go same if error
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			});
	},
};
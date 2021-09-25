const osu = require('node-osu');
const { DBProcessQueue } = require('../dbObjects');
const { saveOsuMultiScores } = require('../utils');

//Archiving started around 40000000

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		// eslint-disable-next-line no-undef
		if (args[0] === '-1' || process.env.SERVER !== 'Live') {
			console.log(`Manually deleted task for saving Multi Matches for ${matchID}`);
			return processQueueEntry.destroy();
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				let oneDayAgo = new Date();
				oneDayAgo.setUTCDate(oneDayAgo.getUTCDate() - 1);
				if (match.raw_end || Date.parse(match.raw_start) < oneDayAgo) {
					if (match.name.toLowerCase().match(/.+: (.+) vs (.+)/g) || match.name.toLowerCase().match(/.+: (.+) vs. (.+)/g)) {
						saveOsuMultiScores(match);
						let now = new Date();
						let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
						let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
						let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);
						const channel = await client.channels.fetch('891314445559676928');
						channel.send(`<https://osu.ppy.sh/mp/${matchID}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m ${match.name} done`);
					} else {
						// console.log(`${matchID} ${match.name} is not a tourney match`);
					}
					const existingTask = await DBProcessQueue.findOne({ where: { task: 'saveMultiMatches', additions: `${parseInt(matchID) + 1}` } });
					if (!existingTask) {
						processQueueEntry.destroy();
						return DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${parseInt(matchID) + 1}`, priority: 0 });
					} else {
						processQueueEntry.destroy();
						return console.log(`A task for ${parseInt(matchID) + 1} already exists.`);
					}
				}
				// console.log(`${matchID} has not ended yet`);
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				processQueueEntry.destroy();
				return DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${matchID}`, priority: 0, date: date });
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					// console.log(`${matchID} could not be found`);
					const existingTask = await DBProcessQueue.findOne({ where: { task: 'saveMultiMatches', additions: `${parseInt(matchID) + 1}` } });
					if (!existingTask) {
						processQueueEntry.destroy();
						return DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${parseInt(matchID) + 1}`, priority: 0 });
					} else {
						processQueueEntry.destroy();
						return console.log(`A task for ${parseInt(matchID) + 1} already exists.`);
					}
				} else {
					console.log('processQueueTasks/saveMultiMatches.js', matchID, err);
					let date = new Date();
					date.setUTCMinutes(date.getUTCMinutes() + 1);
					processQueueEntry.destroy();
					return DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${matchID}`, priority: 0, date: date });
				}
			});
	},
};
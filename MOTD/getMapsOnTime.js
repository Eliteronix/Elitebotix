const osu = require('node-osu');

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
					for (let i = 0; i < beatmaps.length; i++) {
						if (beatmaps[i].approvalStatus !== 'Ranked') {
							beatmaps.splice(i, 1);
							i--;
						}
					}

					quicksort(beatmaps);

					let data = [];

					const todayYear = today.getUTCFullYear();
					const todayMonth = (today.getUTCMonth() + 1).toString().padStart(2, '0');
					const todayDay = (today.getUTCDate()).toString().padStart(2, '0');
					data.push(`Maps from \`${todayDay}.${todayMonth}.${todayYear}\``);

					for (let i = 0; i < beatmaps.length; i++) {
						data.push(`${Math.round(beatmaps[i].difficulty.rating * 100) / 100}* | ${beatmaps[i].artist} - ${beatmaps[i].title} [${beatmaps[i].version}]`);
					}

					const mapsOfTheDayChannel = await client.channels.fetch('831959379800621147');
					mapsOfTheDayChannel.send(data, { split: true });
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
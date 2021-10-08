const { DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');

//Events have to say the global rank on the map
//Text has to be different

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const channel = await client.channels.fetch(args[0]).catch(async () => {
			//Nothing
		});
		args.shift();

		if (channel) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: args[0] })
				.then(async (user) => {
					let recentActivity = false;
					//Grab recent events and send it in
					if (user.events.length > 0) {
						let scoreCommand = require('../commands/osu-score.js');
						for (let i = 0; i < user.events.length; i++) {
							//Remove older scores on the map to avoid duplicates
							for (let j = i + 1; j < user.events.length; j++) {
								if (user.events[i].beatmapId === user.events[j].beatmapId) {
									user.events.splice(j, 1);
									j--;
								}
							}

							//This only works if the local timezone is UTC
							let mapRank = user.events[i].html.replace(/.+<\/a><\/b> achieved rank #/gm, '').replace(/.+<\/a><\/b> achieved .+rank #/gm, '').replace(/ on <a href='\/b\/.+/gm, '').replace('</b>', '');
							let modeName = user.events[i].html.replace(/.+<\/a> \(osu!/gm, '');
							modeName = modeName.substring(0, modeName.length - 1);
							if (modeName.length === 0) {
								modeName = 'osu!';
							}
							if (parseInt(mapRank) <= 50 && processQueueEntry.createdAt.getTime() <= Date.parse(user.events[i].raw_date)) {
								recentActivity = true;
								let msg = {
									guild: channel.guild,
									channel: channel,
									guildId: channel.guild.id,
									author: {
										id: 0
									}
								};
								let newArgs = [user.events[i].beatmapId, user.name, `--event${mapRank}`];
								if (modeName !== 'osu!') {
									newArgs.push(`--${modeName.substring(0, 1)}`);
								}
								scoreCommand.execute(msg, newArgs);
							}
						}
					}

					//Grab recent top play number and send those in
					const osuHadPlays = await lookForTopPlays(processQueueEntry, args, channel, user, 0);
					const taikoHadPlays = await lookForTopPlays(processQueueEntry, args, channel, user, 1);
					const catchHadPlays = await lookForTopPlays(processQueueEntry, args, channel, user, 2);
					const maniaHadPlays = await lookForTopPlays(processQueueEntry, args, channel, user, 3);

					if (osuHadPlays || taikoHadPlays || catchHadPlays || maniaHadPlays) {
						recentActivity = true;
					}

					if (recentActivity) {
						let date = new Date();

						date.setUTCMinutes(date.getUTCMinutes() + 15);

						processQueueEntry.destroy();
						return await DBProcessQueue.create({ guildId: processQueueEntry.guildId, task: processQueueEntry.task, priority: processQueueEntry.priority, additions: `${channel.id};${user.id};${user.name}`, date: date });
					}

					//Retry later because there was no activity
					let date = new Date();

					date.setTime(date.getTime() + (date.getTime() - processQueueEntry.createdAt.getTime()));

					date.setUTCMinutes(date.getUTCMinutes() + 5);

					processQueueEntry.destroy();
					return await DBProcessQueue.create({ guildId: processQueueEntry.guildId, task: processQueueEntry.task, priority: processQueueEntry.priority, additions: `${channel.id};${user.id};${user.name}`, date: date });
				})
				.catch(async (err) => {
					console.log(err);
					if (err.message === 'Not found') {
						await channel.send(`Could not find user \`${args[1]}\` anymore and I will therefore stop tracking them. Maybe they changed their name?`);
						processQueueEntry.destroy();
					} else {
						console.log(err);
						processQueueEntry.destroy();
					}
				});
		} else {
			processQueueEntry.destroy();
		}
	},
};

async function lookForTopPlays(processQueueEntry, args, channel, user, mode) {
	let recentActivity = false;

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let numberRecentPlays = await osuApi.getUserBest({ u: user.id, limit: 100, m: mode })
		.then(scores => {
			let recentPlaysAmount = 0;
			for (let i = 0; i < scores.length; i++) {
				//This only works if the local timezone is UTC
				if (processQueueEntry.createdAt.getTime() <= Date.parse(scores[i].raw_date)) {
					recentPlaysAmount++;
				}
			}
			return recentPlaysAmount;
		})
		// eslint-disable-next-line no-unused-vars
		.catch(err => {
			return 0;
		});

	if (numberRecentPlays > 0) {
		recentActivity = true;
		let msg = {
			guild: channel.guild,
			channel: channel,
			guildId: channel.guild.id,
			author: {
				id: 0
			}
		};
		let topCommand = require('../commands/osu-top.js');
		if (mode === 0) {
			topCommand.execute(msg, [user.name, '--recent', `--${numberRecentPlays}`, '--tracking']);
		} else if (mode === 1) {
			topCommand.execute(msg, [user.name, '--recent', `--${numberRecentPlays}`, '--tracking', '--t']);
		} else if (mode === 2) {
			topCommand.execute(msg, [user.name, '--recent', `--${numberRecentPlays}`, '--tracking', '--c']);
		} else {
			topCommand.execute(msg, [user.name, '--recent', `--${numberRecentPlays}`, '--tracking', '--m']);
		}
	}
	return recentActivity;
}
//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'osu-profile',
	aliases: ['osu-player', 'osu-user', 'o-u', 'o-p'],
	description: 'Sends an info card about the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		if (!args[0]) {//Get profile by author if no argument
			const userDisplayName = msg.guild.member(msg.author).displayName;
			osuApi.getUser({ u: userDisplayName })
				.then(user => {
					//Calculate Playtimes
					const playSeconds = user.secondsPlayed % 60;
					const playMinutes = (user.secondsPlayed - playSeconds) / 60 % 60;
					const playHours = ((user.secondsPlayed - playSeconds - playMinutes * 60) / 60 / 60) % 24;
					const playDays = (user.secondsPlayed - playSeconds - playMinutes * 60 - playHours * 60 * 60) / 60 / 60 / 24;
					const playTimeString = playDays + ' d, ' + playHours + ' h, ' + playMinutes + ' m, ' + playSeconds + ' s';

					//Set join time
					const month = new Array();
					month[0] = 'January';
					month[1] = 'February';
					month[2] = 'March';
					month[3] = 'April';
					month[4] = 'May';
					month[5] = 'June';
					month[6] = 'July';
					month[7] = 'August';
					month[8] = 'September';
					month[9] = 'October';
					month[10] = 'November';
					month[11] = 'December';
					const joinDay = user.raw_joinDate.substring(8, 10);
					var joinDayEnding = 'th';
					if (joinDay % 10 === 1) {
						joinDayEnding = 'st';
					} else if (joinDay % 10 === 2) {
						joinDayEnding = 'nd';
					}
					const joinMonth = month[user.raw_joinDate.substring(5, 7) - 1];
					const joinYear = user.raw_joinDate.substring(0, 4);
					const joinDate = joinDay + joinDayEnding + ' ' + joinMonth + ' ' + joinYear;

					//Send embed
					const playerInfoEmbed = new Discord.MessageEmbed()
						.setColor('#FF66AB')
						.setTitle(`${user.name}'s profile info card`)
						.setThumbnail(`http://s.ppy.sh/a/${user.id}`)
						.addFields(
							{ name: 'Name', value: `${user.name}`, inline: true },
							{ name: 'Rank', value: `${user.pp.rank}`, inline: true },
							{ name: 'Country', value: `${user.country}`, inline: true },
							{ name: 'Country Rank', value: `#${user.pp.countryRank}`, inline: true },
							{ name: 'Level', value: `${user.level}`, inline: true },
							{ name: 'Accuracy', value: `${user.accuracyFormatted}`, inline: true },
							{ name: 'Joined', value: `${joinDate}`, inline: true },
							{ name: 'Playtime', value: `${playTimeString}`, inline: true },
							{ name: 'Ranked Score', value: `${user.scores.ranked}`, inline: true },
							{ name: 'Total Score', value: `${user.scores.total}`, inline: true },
							{ name: 'Silver SS', value: `${user.counts.SSH}`, inline: true },
							{ name: 'SS', value: `${user.counts.SS}`, inline: true },
							{ name: 'Silver S', value: `${user.counts.SH}`, inline: true },
							{ name: 'S', value: `${user.counts.S}`, inline: true },
							{ name: 'A', value: `${user.counts.A}`, inline: true },
							{ name: 'Plays', value: `${user.counts.plays}`, inline: true }
						)
						.setTimestamp();

					msg.channel.send(playerInfoEmbed);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user "${userDisplayName}".`);
					}
					console.log(err);
				});
		} else {
			//Get profiles by arguments
			let i;
			for (i = 0; i < args.length; i++) {
				const userDisplayName = args[i];
				osuApi.getUser({ u: userDisplayName })
					.then(user => {
						//Calculate playtime
						const playSeconds = user.secondsPlayed % 60;
						const playMinutes = (user.secondsPlayed - playSeconds) / 60 % 60;
						const playHours = ((user.secondsPlayed - playSeconds - playMinutes * 60) / 60 / 60) % 24;
						const playDays = (user.secondsPlayed - playSeconds - playMinutes * 60 - playHours * 60 * 60) / 60 / 60 / 24;
						const playTimeString = playDays + ' d, ' + playHours + ' h, ' + playMinutes + ' m, ' + playSeconds + ' s';

						//Set jointime
						const month = new Array();
						month[0] = 'January';
						month[1] = 'February';
						month[2] = 'March';
						month[3] = 'April';
						month[4] = 'May';
						month[5] = 'June';
						month[6] = 'July';
						month[7] = 'August';
						month[8] = 'September';
						month[9] = 'October';
						month[10] = 'November';
						month[11] = 'December';
						const joinDay = user.raw_joinDate.substring(8, 10);
						var joinDayEnding = 'th';
						if (joinDay % 10 === 1) {
							joinDayEnding = 'st';
						} else if (joinDay % 10 === 2) {
							joinDayEnding = 'nd';
						}
						const joinMonth = month[user.raw_joinDate.substring(5, 7) - 1];
						const joinYear = user.raw_joinDate.substring(0, 4);
						const joinDate = joinDay + joinDayEnding + ' ' + joinMonth + ' ' + joinYear;

						//Send embed
						const playerInfoEmbed = new Discord.MessageEmbed()
							.setColor('#FF66AB')
							.setTitle(`${user.name}'s profile info card`)
							.setThumbnail(`http://s.ppy.sh/a/${user.id}`)
							.addFields(
								{ name: 'Name', value: `${user.name}` },
								{ name: 'Rank', value: `${user.pp.rank}`, inline: true },
								{ name: 'Country', value: `${user.country}` },
								{ name: 'Country Rank', value: `#${user.pp.countryRank}`, inline: true },
								{ name: 'Level', value: `${user.level}` },
								{ name: 'Accuracy', value: `${user.accuracyFormatted}`, inline: true },
								{ name: 'Joined', value: `${joinDate}` },
								{ name: 'Playtime', value: `${playTimeString}`, inline: true },
								{ name: 'Ranked Score', value: `${user.scores.ranked}` },
								{ name: 'Total Score', value: `${user.scores.total}`, inline: true },
								{ name: 'Silver SS', value: `${user.counts.SSH}` },
								{ name: 'SS', value: `${user.counts.SS}`, inline: true },
								{ name: 'Silver S', value: `${user.counts.SH}` },
								{ name: 'S', value: `${user.counts.S}`, inline: true },
								{ name: 'A', value: `${user.counts.A}` },
								{ name: 'Plays', value: `${user.counts.plays}`, inline: true }
							)
							.setTimestamp();

						msg.channel.send(playerInfoEmbed);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user "${userDisplayName}".`);
						}
						console.log(err);
					});
			}
		}
	},
};
//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'osu-profile',
	description: 'Sends an info card about the specified player',
	aliases: ['osu-player', 'osu-user'],
	cooldown: 5,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			if (!args[0]) {
				const userDisplayName = msg.guild.member.displayName; //undefined
				osuApi.getUser({ u: userDisplayName })
					.then(user => {
						// inside a command, event listener, etc.
						const playSeconds = user.secondsPlayed % 60;
						const playMinutes = (user.secondsPlayed - playSeconds) / 60 % 60;
						const playHours = ((user.secondsPlayed - playSeconds - playMinutes * 60) / 60 / 60) % 24;
						const playDays = (user.secondsPlayed - playSeconds - playMinutes * 60 - playHours * 60 * 60) / 60 / 60 / 24;
						const playTimeString = playDays + ' d, ' + playHours + ' h, ' + playMinutes + ' m, ' + playSeconds + ' s';

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
								{ name: 'Joined', value: `${user.raw_joinDate}` },
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
			} else {
				let i;
				for (i = 0; i < args.length; i++) {
					osuApi.getUser({ u: args[i] })
						.then(user => {
							// inside a command, event listener, etc.
							const playSeconds = user.secondsPlayed % 60;
							const playMinutes = (user.secondsPlayed - playSeconds) / 60 % 60;
							const playHours = ((user.secondsPlayed - playSeconds - playMinutes * 60) / 60 / 60) % 24;
							const playDays = (user.secondsPlayed - playSeconds - playMinutes * 60 - playHours * 60 * 60) / 60 / 60 / 24;
							const playTimeString = playDays + ' d, ' + playHours + ' h, ' + playMinutes + ' m, ' + playSeconds + ' s';

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
									{ name: 'Joined', value: `${user.raw_joinDate}` },
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
								msg.channel.send(`Could not find user "${args[i]}".`);
							}
							console.log(err);
						});
				}
			}
		}
	},
};
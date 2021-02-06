//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'osu-beatmap',
	aliases: ['osu-map', 'beatmap-info'],
	description: 'Sends an info card about the specified beatmap',
	usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			for (let i = 0; i < args.length; i++) {
				osuApi.getBeatmaps({ b: args[i] })
					.then(beatmaps => {						
						let linkMode;
						if(beatmaps[0].mode === 'Standard'){
							linkMode = 'osu';
						} else if(beatmaps[0].mode === 'Taiko'){
							linkMode = 'taiko';
						} else if(beatmaps[0].mode === 'Mania'){
							linkMode = 'mania';
						} else if(beatmaps[0].mode === 'Catch the Beat'){
							linkMode = 'fruits';
						}
						
						const totalLengthSeconds = (beatmaps[0].length.total%60)+'';
						const totalLengthMinutes = (beatmaps[0].length.total-beatmaps[0].length.total%60)/60;
						const totalLength = totalLengthMinutes + ':' + totalLengthSeconds.padStart(2, '0');
						const drainLengthSeconds = (beatmaps[0].length.drain%60)+'';
						const drainLengthMinutes = (beatmaps[0].length.drain-beatmaps[0].length.drain%60)/60;
						const drainLength = drainLengthMinutes + ':' + drainLengthSeconds.padStart(2, '0');
						//Send embed
						const beatmapInfoEmbed = new Discord.MessageEmbed()
							.setColor('#FF66AB')
							.setTitle(`${beatmaps[0].artist} - ${beatmaps[0].title}`)
							.setURL(`https://osu.ppy.sh/beatmapsets/${beatmaps[0].beatmapSetId}#${linkMode}/${beatmaps[0].id}`)
							.setThumbnail(`https://b.ppy.sh/thumb/${beatmaps[0].beatmapSetId}.jpg`)
							.addFields(
								{ name: 'Creator', value: `${beatmaps[0].creator}`, inline: true },
								{ name: 'Mode', value: `${beatmaps[0].mode}`, inline: true },
								{ name: 'Ranked Status', value: `${beatmaps[0].approvalStatus}`, inline: true },
								{ name: 'BPM', value: `${beatmaps[0].bpm}`, inline: true },
								{ name: 'Max Combo', value: `${beatmaps[0].maxCombo}`, inline: true },
								{ name: 'Difficulty Name', value: `${beatmaps[0].version}`, inline: true },
								{ name: 'Star Rating', value: `${beatmaps[0].difficulty.rating}`, inline: true },
								{ name: 'Circle Size', value: `${beatmaps[0].difficulty.size}`, inline: true },
								{ name: 'Overall Difficulty', value: `${beatmaps[0].difficulty.overall}`, inline: true },
								{ name: 'Approach Rate', value: `${beatmaps[0].difficulty.approach}`, inline: true },
								{ name: 'HP Drain', value: `${beatmaps[0].difficulty.drain}`, inline: true },
								{ name: 'Length (Total)', value: `${totalLength}`, inline: true },
								{ name: 'Length (Drain)', value: `${drainLength}`, inline: true },
								{ name: 'Rating', value: `${beatmaps[0].rating}`, inline: true },
							)
							.setFooter(`ID: ${beatmaps[0].id}`)
							.setTimestamp();

						msg.channel.send(beatmapInfoEmbed);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find beatmap "${args[i]}".`);
						}
						console.log(err);
					});
			}
		}
	},
};

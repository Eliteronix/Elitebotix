//Import StarRating Calculator
// import { calculateStarRating } from 'osu-sr-calculator';

//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'ecw2021-check',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Sends an info card about the viability of the beatmap for the Elitiri Cup Winter 2021',
	usage: '<NM/HD/HR/DT/FM> <Top/Middle/Lower/Beginner> <id>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {

			if (args[0].toLowerCase() !== 'nm' && args[0].toLowerCase() !== 'hd' && args[0].toLowerCase() !== 'hr' && args[0].toLowerCase() !== 'dt' && args[0].toLowerCase() !== 'fm') {
				return msg.channel.send('Please specify in which pool the map is supposed to be. (NM, HD, HR, DT, FM)');
			}

			if (args[1].toLowerCase() !== 'top' && args[1].toLowerCase() !== 'middle' && args[1].toLowerCase() !== 'lower' && args[1].toLowerCase() !== 'beginner') {
				return msg.channel.send('Please specify in which bracket the map is supposed to be. (Top, Middle, Lower, Beginner)');
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			osuApi.getBeatmaps({ b: args[2] })
				.then(async (beatmaps) => {
					let linkMode;
					if (beatmaps[0].mode === 'Standard') {
						linkMode = 'osu';
					} else if (beatmaps[0].mode === 'Taiko') {
						linkMode = 'taiko';
					} else if (beatmaps[0].mode === 'Mania') {
						linkMode = 'mania';
					} else if (beatmaps[0].mode === 'Catch the Beat') {
						linkMode = 'fruits';
					}

					const totalLengthSeconds = (beatmaps[0].length.total % 60) + '';
					const totalLengthMinutes = (beatmaps[0].length.total - beatmaps[0].length.total % 60) / 60;
					const totalLength = totalLengthMinutes + ':' + totalLengthSeconds.padStart(2, '0');
					const drainLengthSeconds = (beatmaps[0].length.drain % 60) + '';
					const drainLengthMinutes = (beatmaps[0].length.drain - beatmaps[0].length.drain % 60) / 60;
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

					const viabilityEmbed = new Discord.MessageEmbed()
						.setColor('#00FF00')
						.setTitle('The Beatmap is viable for the tournament');

					console.log(beatmaps[0]);

					//The map has to have audio
					if (!(beatmaps[0].hasAudio)) {
						viabilityEmbed
							.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map has no audio', 'The map has to have audio / can\'t be muted');
					}

					//Mode has to be standard osu!
					if (beatmaps[0].mode !== 'Standard') {
						viabilityEmbed
							.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is not in Standard mode', 'The map has to be in the osu!Standard Mode');
					}

					//Map status: Ranked/Approved -> Allowed (except Aspire maps)
					if (beatmaps[0].id === '1033882' || beatmaps[0].id === '529285') {
						viabilityEmbed
							.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is an Aspire Map', 'The map can\'t be an Aspire map');
					}

					//Map status: Ranked/Approved -> Allowed (except Aspire maps)
					if (beatmaps[0].approvalStatus !== 'Ranked') {
						viabilityEmbed
							.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is not Ranked', 'The map has to be Ranked');
					}

					//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
					if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain < 90) {
						viabilityEmbed
							.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is too short', 'The Drain time should not be below 1:30');
					}

					//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
					if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain > 270) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is too long', 'The Drain time should not be above 4:30');
					}

					//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
					if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain < 135) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is too short', 'The Drain time should not be below 1:30 (after DT)');
					}

					//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
					if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain > 405) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is too long', 'The Drain time should not be above 4:30 (after DT)');
					}

					//Circle Size: FM maps may not exceed the circle size of 5 when played NoMod
					if (args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.size > 5) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('Map is has too small Circle Size', 'FreeMod maps may not exceed circle size 5 when played NoMod');
					}

					//Calculate all star ratings
					// const starRating = await calculateStarRating(beatmaps[0].id, [], true);
					//Top:
					const topLowerDiff = 6.1;
					const topUpperDiff = 7.2;
					//Middle:
					const middleLowerDiff = 5.5;
					const middleUpperDiff = 6.2;
					//Lower:
					const lowerLowerDiff = 4.7;
					const lowerUpperDiff = 5.6;
					//Middle:
					const beginnerLowerDiff = 4.0;
					const beginnerUpperDiff = 5.1;

					//Difficulty: Maps have to be between the specified diffculty
					if (args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < topLowerDiff ||
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < topLowerDiff ||
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'hr' && beatmaps[0].difficulty.rating < topLowerDiff ||
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'dt' && beatmaps[0].difficulty.rating < topLowerDiff ||						
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < topLowerDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too low', `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
					} else if (args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > topUpperDiff ||
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > topUpperDiff ||
						args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > topUpperDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too high', `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
					} else if (args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < middleLowerDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < middleLowerDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'hr' && beatmaps[0].difficulty.rating < middleLowerDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'dt' && beatmaps[0].difficulty.rating < middleLowerDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < middleLowerDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too low', `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
					} else if (args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > middleUpperDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > middleUpperDiff ||
						args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > middleUpperDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too high', `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
					} else if (args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'hr' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'dt' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < lowerLowerDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too low', `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
					} else if (args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > lowerUpperDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > lowerUpperDiff ||
						args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > lowerUpperDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too high', `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
					} else if (args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'hr' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'dt' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < beginnerLowerDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too low', `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
					} else if (args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > beginnerUpperDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > beginnerUpperDiff ||
						args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > beginnerUpperDiff) {
						viabilityEmbed.setColor('#FF0000')
							.setTitle('The Beatmap is NOT viable for the tournament')
							.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
							.addField('The Star Rating is too high', `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
					} else if (args[0].toLowerCase() === 'hr' || args[0].toLowerCase() === 'dt') {
						viabilityEmbed
							.addField('Star Rating not checked', 'The Star Rating for HR and DT maps is not automatically being checked at the moment but they should be in the range of the bracket after recalculations');
					}

					msg.channel.send(beatmapInfoEmbed);
					msg.channel.send(viabilityEmbed);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find beatmap "${args[2]}".`);
					}
					console.log(err);
				}
				);
		}
	}
};

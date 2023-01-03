const Discord = require('discord.js');
const osu = require('node-osu');
const { DBElitiriCupSignUp } = require('../dbObjects.js');
const { getIDFromPotentialOsuLink, logDatabaseQueries, populateMsgFromInteraction } = require('../utils.js');
const { currentElitiriCup } = require('../config.json');

module.exports = {
	name: 'elitiri-check',
	//aliases: ['osu-map', 'beatmap-info'],
	description: `Sends an info card about the viability of the beatmap for the ${currentElitiriCup}`,
	usage: '<NM/HD/HR/DT/FM> <id> [Bracket]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'elitiri',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.deferReply({ ephemeral: true });

			let modpool = null;
			let id = null;
			let bracket = null;
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'modpool') {
					modpool = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'id') {
					id = interaction.options._hoistedOptions[i].value;
				} else {
					bracket = interaction.options._hoistedOptions[i].value;
				}
			}
			args.push(modpool);
			args.push(id);
			if (bracket) {
				args.push(bracket);
			}
		}
		logDatabaseQueries(4, 'commands/elitiri-check.js DBElitiriCupSignUp');
		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { tournamentName: currentElitiriCup, userId: msg.author.id }
		});

		if (!elitiriSignUp && !args[2]) {
			if (msg.id) {
				return msg.reply('It seems like you are not registered for any bracket of the Elitiri Cup.\nFor checking a specific bracket manually add Top, Middle, Lower or Beginner after the BeatmapID.');
			}
			return interaction.editReply({ content: 'It seems like you are not registered for any bracket of the Elitiri Cup.\nFor checking a specific bracket manually add Top, Middle, Lower or Beginner after the BeatmapID.', ephemeral: true });
		} else if (!elitiriSignUp && args[2].toLowerCase() !== 'top' && args[2].toLowerCase() !== 'middle' && args[2].toLowerCase() !== 'lower' && args[2].toLowerCase() !== 'beginner') {
			if (msg.id) {
				return msg.reply('It seems like you are not registered for any bracket of the Elitiri Cup.\nFor checking a specific bracket manually add Top, Middle, Lower or Beginner after the BeatmapID.');
			}
			return interaction.editReply({ content: 'It seems like you are not registered for any bracket of the Elitiri Cup.\nFor checking a specific bracket manually add Top, Middle, Lower or Beginner after the BeatmapID.', ephemeral: true });
		}

		if (args[0].toLowerCase() !== 'nm' && args[0].toLowerCase() !== 'hd' && args[0].toLowerCase() !== 'hr' && args[0].toLowerCase() !== 'dt' && args[0].toLowerCase() !== 'fm') {
			if (msg.id) {
				return msg.reply('Please specify in which pool the map is supposed to be as the first argument. (NM, HD, HR, DT, FM)');
			}
			return interaction.editReply({ content: 'Please specify in which pool the map is supposed to be as the first argument. (NM, HD, HR, DT, FM)', ephemeral: true });
		}

		let bracket = '';
		if (elitiriSignUp) {
			let bracketNameParts = elitiriSignUp.bracketName.split(' ');
			bracket = bracketNameParts[0].toLowerCase();
		}

		if (args[2]) {
			bracket = args[2].toLowerCase();
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getBeatmaps({ b: getIDFromPotentialOsuLink(args[1]) })
			.then(async (beatmaps) => {
				getBeatmap(msg, args, interaction);

				const viabilityEmbed = new Discord.MessageEmbed()
					.setColor('#00FF00')
					.setTitle(`The Beatmap is viable for the tournament (${bracket} bracket)`)
					.setFooter({ text: `ID: ${beatmaps[0].id}; Checked by ${msg.author.username}#${msg.author.discriminator}` });

				//The map has to have audio
				if (!(beatmaps[0].hasAudio)) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map has no audio', 'The map has to have audio / can\'t be muted');
				}

				//Mode has to be standard osu!
				if (beatmaps[0].mode !== 'Standard') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not in Standard mode', 'The map has to be in the osu!Standard Mode');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].id === '1033882' || beatmaps[0].id === '529285') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is an Aspire Map', 'The map can\'t be an Aspire map');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].approvalStatus !== 'Ranked' && beatmaps[0].approvalStatus !== 'Approved') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not Ranked', 'The map has to be Ranked');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain < 130 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain < 130) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 2:10');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain > 270) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain < 195) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 2:10 (after DT)');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 2:10-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain > 405) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30 (after DT)');
				}

				//Circle Size: FM maps may not exceed the circle size of 5 when played NoMod
				if (args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.size > 5) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is has too small Circle Size', 'FreeMod maps may not exceed circle size 5 when played NoMod');
				}

				//Top:
				const topLowerDiff = 5.52;
				const topUpperDiff = 7.18;
				//Middle:
				const middleLowerDiff = 5.15;
				const middleUpperDiff = 6.48;
				//Lower:
				const lowerLowerDiff = 4.57;
				const lowerUpperDiff = 5.87;
				//Beginner:
				const beginnerLowerDiff = 3.91;
				const beginnerUpperDiff = 5.54;

				if (args[0].toLowerCase() === 'hr') {
					const hrMap = await osuApi.getBeatmaps({ b: getIDFromPotentialOsuLink(args[1]), mods: 16 });

					beatmaps[0].difficulty.rating = hrMap[0].difficulty.rating;
					beatmaps[0].difficulty.aim = hrMap[0].difficulty.aim;
					beatmaps[0].difficulty.speed = hrMap[0].difficulty.speed;
				} else if (args[0].toLowerCase() === 'dt') {
					const dtMap = await osuApi.getBeatmaps({ b: getIDFromPotentialOsuLink(args[1]), mods: 64 });

					beatmaps[0].difficulty.rating = dtMap[0].difficulty.rating;
					beatmaps[0].difficulty.aim = dtMap[0].difficulty.aim;
					beatmaps[0].difficulty.speed = dtMap[0].difficulty.speed;
					beatmaps[0].length.total = Math.round(beatmaps[0].length.total / 3 * 2);
					beatmaps[0].length.drain = Math.round(beatmaps[0].length.drain / 3 * 2);
					beatmaps[0].bpm = beatmaps[0].bpm * 1.5;
				}

				//Until blue moon rises is bugged; These are the ingame values hardcoded
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].id === '2081848' || args[0].toLowerCase() === 'hd' && beatmaps[0].id === '2081848' || args[0].toLowerCase() === 'fm' && beatmaps[0].id === '2081848') {
					beatmaps[0].difficulty.rating = 3.66;
				} else if (args[0].toLowerCase() === 'hr' && beatmaps[0].id === '2081848') {
					beatmaps[0].difficulty.rating = 4.63;
				} else if (args[0].toLowerCase() === 'dt' && beatmaps[0].id === '2081848') {
					beatmaps[0].difficulty.rating = 5.05;
				}

				//Difficulty: Maps have to be between the specified diffculty
				if (bracket === 'top' && beatmaps[0].difficulty.rating < topLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (bracket === 'top' && beatmaps[0].difficulty.rating > topUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (bracket === 'middle' && beatmaps[0].difficulty.rating < middleLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (bracket === 'middle' && beatmaps[0].difficulty.rating > middleUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (bracket === 'lower' && beatmaps[0].difficulty.rating < lowerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (bracket === 'lower' && beatmaps[0].difficulty.rating > lowerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (bracket === 'beginner' && beatmaps[0].difficulty.rating < beginnerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too low (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				} else if (bracket === 'beginner' && beatmaps[0].difficulty.rating > beginnerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle(`The Beatmap is NOT viable for the tournament (${bracket} bracket)`)
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField(`The Star Rating is too high (${Math.round(beatmaps[0].difficulty.rating * 100) / 100})`, `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				}

				if (msg.id) {
					return msg.reply({ embeds: [viabilityEmbed] });
				}
				return interaction.editReply({ embeds: [viabilityEmbed], ephemeral: true });
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find beatmap \`${args[1].replace(/`/g, '')}\`.`);
					}
					return interaction.editReply({ content: `Could not find beatmap \`${args[1].replace(/`/g, '')}\`.`, ephemeral: true });
				} else {
					console.error(err);
				}
			}
			);
	}
};

async function getBeatmap(msg, args, interaction) {
	let command = require('./osu-beatmap.js');
	let newArgs = [args[1]];
	try {
		command.execute(msg, newArgs, interaction);
	} catch (error) {
		console.error(error);
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		msg.reply('There was an error trying to execute that command. The developers have been alerted.');
		eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
	}
}
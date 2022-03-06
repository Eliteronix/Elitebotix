const Discord = require('discord.js');
const { DBOsuMultiScores } = require('../dbObjects');
const { populateMsgFromInteraction, getOsuBeatmap, pause, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-tournament',
	// aliases: ['os', 'o-s'],
	description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
	usage: '<acronym>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Data is being processed');

			args = [interaction.options._hoistedOptions[0].value];
		}

		if (args.join(' ').toLowerCase() === 'o!mm ranked'
			|| args.join(' ').toLowerCase() === 'o!mm private'
			|| args.join(' ').toLowerCase() === 'o!mm team ranked'
			|| args.join(' ').toLowerCase() === 'o!mm team private'
			|| args.join(' ').toLowerCase() === 'etx') {
			if (msg.id) {
				return msg.reply(`The acronym \`${args.join(' ').replace(/`/g, '')}\` can't be used for this command.`);
			}
			return interaction.followUp(`The acronym \`${args.join(' ').replace(/`/g, '')}\` can't be used for this command.`);
		}

		logDatabaseQueries(4, 'commands/osu-tournament.js DBOsuMultiScores');
		let userScores = await DBOsuMultiScores.findAll({
			where: {
				[Op.or]: [
					{
						matchName: {
							[Op.like]: `${args.join(' ')}:%`,
						},
					}, {
						matchName: {
							[Op.like]: `${args.join(' ')} :%`,
						}
					}
				]
			}
		});

		if (!userScores.length) {
			if (msg.id) {
				return msg.reply(`No tournament matches found with the acronym \`${args.join(' ').replace(/`/g, '')}\`.`);
			}
			return interaction.followUp(`No tournament matches found with the acronym \`${args.join(' ').replace(/`/g, '')}\`.`);
		} else {
			//Bubblesort userscores by matchId property descending
			userScores.sort((a, b) => {
				if (a.matchId > b.matchId) {
					return -1;
				}
				if (a.matchId < b.matchId) {
					return 1;
				}
				return 0;
			});

			let matchesPlayed = [];
			for (let i = 0; i < userScores.length; i++) {
				//Push matches for the history txt
				if (!matchesPlayed.includes(`${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`)) {
					matchesPlayed.push(`${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`);
				}
			}

			// eslint-disable-next-line no-undef
			matchesPlayed = new Discord.MessageAttachment(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), `multi-matches-${args.join(' ')}.txt`);

			if (msg.id) {
				msg.reply({ content: `All matches found for the acronym \`${args.join(' ').replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
			} else {
				interaction.followUp({ content: `All matches found for the acronym \`${args.join(' ').replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
			}

			//Save the maps locally
			for (let i = 0; i < userScores.length; i++) {
				let dbBeatmap = await getOsuBeatmap(userScores[i].beatmapId, userScores[i].gameRawMods);
				if (dbBeatmap && dbBeatmap.approvalStatus !== 'Approved' && dbBeatmap.approvalStatus !== 'Ranked') {
					await pause(500);
				}
			}
		}
	}
};
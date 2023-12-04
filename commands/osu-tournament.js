const Discord = require('discord.js');
const { DBOsuMultiMatches } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');

module.exports = {
	name: 'osu-tournament',
	description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-tournament')
		.setNameLocalizations({
			'de': 'osu-turnier',
			'en-GB': 'osu-tournament',
			'en-US': 'osu-tournament',
		})
		.setDescription('Sends a .txt file with all the data for the tournament matches with this acronym')
		.setDescriptionLocalizations({
			'de': 'Sendet eine .txt Datei mit allen Daten für die Turniermatches mit diesem Akronym',
			'en-GB': 'Sends a .txt file with all the data for the tournament matches with this acronym',
			'en-US': 'Sends a .txt file with all the data for the tournament matches with this acronym',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('acronym')
				.setNameLocalizations({
					'de': 'akronym',
					'en-GB': 'acronym',
					'en-US': 'acronym',
				})
				.setDescription('The acronym of the tournament')
				.setDescriptionLocalizations({
					'de': 'Das Akronym des Turniers',
					'en-GB': 'The acronym of the tournament',
					'en-US': 'The acronym of the tournament',
				})
				.setRequired(true)
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let acronym = interaction.options.getString('acronym');

		if (acronym.toLowerCase() === 'o!mm ranked'
			|| acronym.toLowerCase() === 'o!mm private'
			|| acronym.toLowerCase() === 'o!mm team ranked'
			|| acronym.toLowerCase() === 'o!mm team private'
			|| acronym.toLowerCase() === 'etx'
			|| acronym.toLowerCase() === 'etx teams') {

			return await interaction.editReply(`The acronym \`${acronym.replace(/`/g, '')}\` can't be used for this command.`);
		}

		logDatabaseQueries(4, 'commands/osu-tournament.js DBOsuMultiMatches');
		let tournamentScores = await DBOsuMultiMatches.findAll({
			attributes: ['matchId', 'matchName', 'matchStartDate'],
			where: {
				[Op.or]: [
					{
						matchName: {
							[Op.like]: `${acronym}:%`,
						},
					}, {
						matchName: {
							[Op.like]: `${acronym} :%`,
						}
					}
				],
				tourneyMatch: true,
			},
			order: [
				['matchId', 'DESC'],
			],
		});

		if (!tournamentScores.length) {
			return await interaction.editReply(`No tournament matches found with the acronym \`${acronym.replace(/`/g, '')}\`.`);
		}

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

		let matchesPlayed = [];
		for (let i = 0; i < tournamentScores.length; i++) {
			//Push matches for the history txt
			let date = new Date(tournamentScores[i].matchStartDate);

			if (date > hideQualifiers && tournamentScores[i].matchName.toLowerCase().includes('qualifier')) {
				tournamentScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
			}

			if (!matchesPlayed.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${tournamentScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${tournamentScores[i].matchId}`)) {
				matchesPlayed.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${tournamentScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${tournamentScores[i].matchId}`);
			}
		}

		// eslint-disable-next-line no-undef
		matchesPlayed = new Discord.AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${acronym}.txt` });

		try {
			await interaction.editReply({ content: `All matches found for the acronym \`${acronym.replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
		} catch (error) {
			if (error.message !== 'Unknown Message') {
				console.error(error);
			}
		}
	}
};
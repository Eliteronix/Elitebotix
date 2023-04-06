const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { getOsuPlayerName, logDatabaseQueries, getMods, multiToBanchoScore, getOsuBeatmap, getUserDuelStarRating, getGameModeName, getAdditionalOsuInfo } = require('../utils');
const { DBOsuMultiScores, DBOsuBeatmaps, DBDiscordUsers } = require('../dbObjects');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');
const { Op } = require('sequelize');
const osu = require('node-osu');

module.exports = {
	name: 'osu-host',
	description: 'Provides different utilities for osu! tournament hosts',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-host')
		.setNameLocalizations({
			'de': 'osu-host',
			'en-GB': 'osu-host',
			'en-US': 'osu-host',
		})
		.setDescription('Provides different utilities for osu! tournament hosts')
		.setDescriptionLocalizations({
			'de': 'Bietet verschiedene Dienste für osu! Turnierhosts',
			'en-GB': 'Provides different utilities for osu! tournament hosts',
			'en-US': 'Provides different utilities for osu! tournament hosts',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tournamenttopplays')
				.setNameLocalizations({
					'de': 'turniertopplays',
					'en-GB': 'tournamenttopplays',
					'en-US': 'tournamenttopplays',
				})
				.setDescription('Provides the tournament top plays of the provided tournament players')
				.setDescriptionLocalizations({
					'de': 'Liefert die Turnier Top Plays der bereitgestellten Turnierspieler',
					'en-GB': 'Provides the tournament top plays of the provided tournament players',
					'en-US': 'Provides the tournament top plays of the provided tournament players',
				})
				.addAttachmentOption(option =>
					option
						.setName('file')
						.setNameLocalizations({
							'de': 'datei',
							'en-GB': 'file',
							'en-US': 'file',
						})
						.setDescription('The .txt file containing the tournament players, one player id per line')
						.setDescriptionLocalizations({
							'de': 'Die .txt Datei, die die Turnierspieler enthält, eine Spieler ID pro Zeile',
							'en-GB': 'The .txt file containing the tournament players, one player id per line',
							'en-US': 'The .txt file containing the tournament players, one player id per line',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option.setName('amount')
						.setNameLocalizations({
							'de': 'anzahl',
							'en-GB': 'amount',
							'en-US': 'amount',
						})
						.setDescription('The amount of top plays to be provided per player')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der Top Plays, die pro Spieler bereitgestellt werden sollen',
							'en-GB': 'The amount of top plays to be provided per player',
							'en-US': 'The amount of top plays to be provided per player',
						})
						.setRequired(true)
						.setMinValue(1)
				)
				.addBooleanOption(option =>
					option.setName('onlyranked')
						.setNameLocalizations({
							'de': 'nurranked',
							'en-GB': 'onlyranked',
							'en-US': 'onlyranked',
						})
						.setDescription('Whether only ranked maps should be considered')
						.setDescriptionLocalizations({
							'de': 'Ob nur ranked Maps berücksichtigt werden sollen',
							'en-GB': 'Whether only ranked maps should be considered',
							'en-US': 'Whether only ranked maps should be considered',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('duelratings')
				.setNameLocalizations({
					'de': 'duelratings',
					'en-GB': 'duelratings',
					'en-US': 'duelratings',
				})
				.setDescription('Provides the duel ratings of the provided tournament players')
				.setDescriptionLocalizations({
					'de': 'Liefert die Duel Ratings der bereitgestellten Turnierspieler',
					'en-GB': 'Provides the duel ratings of the provided tournament players',
					'en-US': 'Provides the duel ratings of the provided tournament players',
				})
				.addAttachmentOption(option =>
					option
						.setName('file')
						.setNameLocalizations({
							'de': 'datei',
							'en-GB': 'file',
							'en-US': 'file',
						})
						.setDescription('The .txt file containing the tournament players, one player id per line')
						.setDescriptionLocalizations({
							'de': 'Die .txt Datei, die die Turnierspieler enthält, eine Spieler ID pro Zeile',
							'en-GB': 'The .txt file containing the tournament players, one player id per line',
							'en-US': 'The .txt file containing the tournament players, one player id per line',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('ppwithtournamenttopplays')
				.setNameLocalizations({
					'de': 'ppmitturniertopplays',
					'en-GB': 'ppwithtournamenttopplays',
					'en-US': 'ppwithtournamenttopplays',
				})
				.setDescription('Provides the pp with bancho and tournament top plays of the provided tournament players')
				.setDescriptionLocalizations({
					'de': 'Liefert die pp mit Bancho und Turnier Top Plays der bereitgestellten Turnierspieler',
					'en-GB': 'Provides the pp with bancho and tournament top plays of the provided tournament players',
					'en-US': 'Provides the pp with bancho and tournament top plays of the provided tournament players',
				})
				.addAttachmentOption(option =>
					option
						.setName('file')
						.setNameLocalizations({
							'de': 'datei',
							'en-GB': 'file',
							'en-US': 'file',
						})
						.setDescription('The .txt file containing the tournament players, one player id per line')
						.setDescriptionLocalizations({
							'de': 'Die .txt Datei, die die Turnierspieler enthält, eine Spieler ID pro Zeile',
							'en-GB': 'The .txt file containing the tournament players, one player id per line',
							'en-US': 'The .txt file containing the tournament players, one player id per line',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tournamentbanned')
				.setNameLocalizations({
					'de': 'tournamentbanned',
					'en-GB': 'tournamentbanned',
					'en-US': 'tournamentbanned',
				})
				.setDescription('Provides the tournament banned players of the provided tournament players')
				.setDescriptionLocalizations({
					'de': 'Liefert die Turnier gebannten Spieler der bereitgestellten Turnierspieler',
					'en-GB': 'Provides the tournament banned players of the provided tournament players',
					'en-US': 'Provides the tournament banned players of the provided tournament players',
				})
				.addAttachmentOption(option =>
					option
						.setName('file')
						.setNameLocalizations({
							'de': 'datei',
							'en-GB': 'file',
							'en-US': 'file',
						})
						.setDescription('The .txt file containing the tournament players, one player id per line')
						.setDescriptionLocalizations({
							'de': 'Die .txt Datei, die die Turnierspieler enthält, eine Spieler ID pro Zeile',
							'en-GB': 'The .txt file containing the tournament players, one player id per line',
							'en-US': 'The .txt file containing the tournament players, one player id per line',
						})
						.setRequired(true)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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

		let attachedFile = interaction.options.getAttachment('file');

		try {
			if (!attachedFile.contentType.startsWith('text/plain')) {
				return await interaction.editReply({ content: 'The attached file is not a .txt file.' });
			}
		} catch (error) {
			console.error(attachedFile);
			console.error(error);
		}

		// fetch the file
		let file = await fetch(attachedFile.url);

		// parse the file
		file = await file.text();

		// split the file into an array
		file = file.split('\n');

		// remove empty lines
		file = file.filter(line => line !== '');

		// remove duplicates
		file = [...new Set(file)];

		// check if the file contains only numbers
		if (file.some(line => isNaN(line))) {
			return await interaction.editReply({ content: 'The attached file contains invalid player ids. Be sure to only provide playerIds; one for each line.' });
		}

		// get the top plays of the players
		let amountPerPlayer = interaction.options.getInteger('amount');
		let onlyRanked = interaction.options.getBoolean('onlyranked');

		await interaction.editReply({ content: 'A proper file has been provided. Processing may take a while, depending on how many scores haven\'t been calculated since they have been set or the last pp update...' });

		let processingMessage = await interaction.channel.send('Processing...');

		let randomString = Math.random().toString(36);

		interaction.client.hostCommands.push(randomString);

		if (interaction.options.getSubcommand() === 'tournamenttopplays') {
			let tourneyTops = [];

			let lastUpdate = new Date();

			for (let i = 0; i < file.length; i++) {
				let osuUserId = file[i].trim();

				let osuName = await getOsuPlayerName(osuUserId);

				if (new Date() - lastUpdate > 15000) {
					await processingMessage.edit(`Processing ${osuName} (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				//Get all scores from tournaments
				logDatabaseQueries(4, 'commands/osu-host.js DBOsuMultiScores');
				let multiScores = await DBOsuMultiScores.findAll({
					attributes: [
						'id',
						'score',
						'gameRawMods',
						'rawMods',
						'teamType',
						'pp',
						'beatmapId',
						'createdAt',
						'gameStartDate',
						'osuUserId',
						'count50',
						'count100',
						'count300',
						'countGeki',
						'countKatu',
						'countMiss',
						'maxCombo',
						'perfect',
						'matchName',
						'mode',
					],
					where: {
						osuUserId: osuUserId,
						mode: 'Standard',
						tourneyMatch: true,
					}
				});

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuName} (Found ${multiScores.length} scores) (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuName} (Removing irrelevant scores from ${multiScores.length} found scores) (Account ${i + 1}/${file.length})...`);
						lastUpdate = new Date();
					}

					if (parseInt(multiScores[j].score) <= 10000 && getMods(parseInt(multiScores[j].gameRawMods) + parseInt(multiScores[j].rawMods)).includes('RX')) {
						multiScores.splice(j, 1);
						j--;
						continue;
					}

					if (parseInt(multiScores[j].score) <= 10000 || multiScores[j].teamType === 'Tag Team vs' || multiScores[j].teamType === 'Tag Co-op') {
						multiScores.splice(j, 1);
						j--;
						continue;
					}
				}

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuName} (Found ${multiScores.length} scores after removing irrelevant scores) (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				//Translate the scores to bancho scores
				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuName} (Score ${j + 1}/${multiScores.length}) (Account ${i + 1}/${file.length})...`);
						lastUpdate = new Date();
					}
					if (parseInt(multiScores[j].gameRawMods) % 2 === 1) {
						multiScores[j].gameRawMods = parseInt(multiScores[j].gameRawMods) - 1;
					}
					if (parseInt(multiScores[j].rawMods) % 2 === 1) {
						multiScores[j].rawMods = parseInt(multiScores[j].rawMods) - 1;
					}

					multiScores[j] = await multiToBanchoScore(multiScores[j]);

					if (!multiScores[j].pp || parseFloat(multiScores[j].pp) > 2000 || !parseFloat(multiScores[j].pp)) {
						multiScores.splice(j, 1);
						j--;
						continue;
					}
				}

				//Sort scores by pp descending
				multiScores.sort((a, b) => {
					return parseFloat(b.pp) - parseFloat(a.pp);
				});

				//Remove duplicates by beatmapId
				for (let j = 0; j < multiScores.length; j++) {
					for (let k = j + 1; k < multiScores.length; k++) {
						if (multiScores[j].beatmapId === multiScores[k].beatmapId) {
							multiScores.splice(k, 1);
							k--;
						}
					}
				}

				//Feed the scores into the array
				let scoreCount = 0;
				for (let j = 0; j < multiScores.length && scoreCount < amountPerPlayer; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuName} (Adding score ${j + 1}/${amountPerPlayer} to the output) (Account ${i + 1}/${file.length})...`);
						lastUpdate = new Date();
					}
					multiScores[j].beatmap = await getOsuBeatmap({ beatmapId: multiScores[j].beatmapId });
					if (onlyRanked) {
						if (!multiScores[j].beatmap || multiScores[j].beatmap && multiScores[j].beatmap.approvalStatus !== 'Approved' && multiScores[j].beatmap.approvalStatus !== 'Ranked') {
							continue;
						}
					}
					if (multiScores[j].pp) {
						tourneyTops.push(multiScores[j]);
						scoreCount++;
					}
				}
			}

			let exportScores = [];

			for (let i = 0; i < tourneyTops.length; i++) {
				if (tourneyTops[i].beatmap) {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: tourneyTops[i].beatmap.approvalStatus,
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: tourneyTops[i].beatmap.title,
						artist: tourneyTops[i].beatmap.artist,
						difficulty: tourneyTops[i].beatmap.difficulty,
						mode: tourneyTops[i].beatmap.mode,
					});
				} else {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: 'Deleted',
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: 'Unavailable',
						artist: 'Unavailable',
						difficulty: 'Unavailable',
						mode: 'Unavailable',
					});
				}
			}

			processingMessage.delete();

			let data = [];
			for (let i = 0; i < exportScores.length; i++) {
				data.push(exportScores[i]);

				if (i % 10000 === 0 && i > 0 || exportScores.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.AttachmentBuilder(buffer, { name: 'tournament-topplays.csv' });

					await interaction.channel.send({ content: 'Tournament Top Plays', files: [attachment] });
					data = [];
				}
			}

			if (interaction.client.hostCommands.includes(randomString)) {
				interaction.client.hostCommands.splice(interaction.client.hostCommands.indexOf(randomString), 1);
			}
		} else if (interaction.options.getSubcommand() === 'duelratings') {
			let csvData = [];

			let lastUpdate = new Date();

			for (let i = 0; i < file.length; i++) {
				let osuUserId = file[i].trim();

				if (new Date() - lastUpdate > 15000) {
					let osuName = await getOsuPlayerName(osuUserId);
					processingMessage.edit(`Processing ${osuName} (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				try {
					let duelRating = await getUserDuelStarRating({ osuUserId: osuUserId });

					csvData.push({
						osuUserId: osuUserId,
						duelRating: duelRating.total,
						noModDuelRating: duelRating.noMod,
						noModDuelRatingLimited: duelRating.Limited,
						hiddenDuelRating: duelRating.hidden,
						hiddenDuelRatingLimited: duelRating.hiddenLimited,
						hardRockDuelRating: duelRating.hardRock,
						hardRockDuelRatingLimited: duelRating.hardRockLimited,
						doubleTimeDuelRating: duelRating.doubleTime,
						doubleTimeDuelRatingLimited: duelRating.doubleTimeLimited,
						freeModDuelRating: duelRating.freeMod,
						freeModDuelRatingLimited: duelRating.freeModLimited,
						provisional: duelRating.provisional,
						outdated: duelRating.outdated,
					});
				} catch (e) {
					csvData.push({
						osuUserId: osuUserId,
						duelRating: e.message,
						noModDuelRating: 'Unavailable',
						noModDuelRatingLimited: 'Unavailable',
						hiddenDuelRating: 'Unavailable',
						hiddenDuelRatingLimited: 'Unavailable',
						hardRockDuelRating: 'Unavailable',
						hardRockDuelRatingLimited: 'Unavailable',
						doubleTimeDuelRating: 'Unavailable',
						doubleTimeDuelRatingLimited: 'Unavailable',
						freeModDuelRating: 'Unavailable',
						freeModDuelRatingLimited: 'Unavailable',
						provisional: 'Unavailable',
						outdated: 'Unavailable',
					});
				}
			}

			processingMessage.delete();

			let data = [];
			for (let i = 0; i < csvData.length; i++) {
				data.push(csvData[i]);

				if (i % 10000 === 0 && i > 0 || csvData.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.AttachmentBuilder(buffer, { name: 'duelratings.csv' });

					await interaction.channel.send({ content: 'Duel Ratings', files: [attachment] });
					data = [];
				}
			}

			if (interaction.client.hostCommands.includes(randomString)) {
				interaction.client.hostCommands.splice(interaction.client.hostCommands.indexOf(randomString), 1);
			}
		} else if (interaction.options.getSubcommand() === 'ppwithtournamenttopplays') {
			let csvData = [];

			let lastUpdate = new Date();

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			for (let i = 0; i < file.length; i++) {
				let osuUserId = file[i].trim();

				if (new Date() - lastUpdate > 15000) {
					let osuName = await getOsuPlayerName(osuUserId);
					processingMessage.edit(`Processing ${osuName} (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				let scores = [];

				let user = await osuApi.getUser({ u: osuUserId, m: 0 });

				let banchoTopPlays = await osuApi.getUserBest({ u: osuUserId, m: 0, limit: 100 });

				let topPlayData = await getTournamentTopPlayData(osuUserId, 0);

				let tournamentTopPlays = topPlayData.scores;

				scores = banchoTopPlays.concat(tournamentTopPlays);

				scores.sort((a, b) => {
					return parseFloat(b.pp) - parseFloat(a.pp);
				});

				// Remove duplicates
				for (let i = 0; i < scores.length; i++) {
					for (let j = i + 1; j < scores.length; j++) {
						if (scores[i].beatmapId == scores[j].beatmapId) {
							scores.splice(j, 1);
							j--;
						}
					}
				}

				// Calculate total pp
				let banchoTotalPP = parseFloat(user.pp.raw);

				// Calculate the part of the pp that is coming from the bancho top 100
				let banchoTopPlaysPP = 0;

				for (let i = 0; i < banchoTopPlays.length; i++) {
					banchoTopPlaysPP += parseFloat(banchoTopPlays[i].pp) * Math.pow(0.95, (i));
				}

				let additionalPP = banchoTotalPP - banchoTopPlaysPP;

				// Calculate the pp with the new scores
				let newScoresPP = 0;

				for (let i = 0; i < scores.length && i < 100; i++) {
					newScoresPP += parseFloat(scores[i].pp) * Math.pow(0.95, (i));
				}

				logDatabaseQueries(4, 'commands/osu-host.js DBDiscordUsers 1');
				let discordUsers = await DBDiscordUsers.findAll({
					attributes: ['osuPP', 'osuRank'],
				});

				let totalRankedPP = newScoresPP + additionalPP;

				//Find the closest users to the PP values
				let closestRankedPPUser = discordUsers[0];
				for (let i = 0; i < discordUsers.length; i++) {
					let currentDiscordUserPP = discordUsers[i].osuPP;
					let closestRankedPP = closestRankedPPUser.osuPP;

					if (Math.abs(currentDiscordUserPP - totalRankedPP) < Math.abs(closestRankedPP - totalRankedPP)) {
						closestRankedPPUser = discordUsers[i];
					}
				}

				csvData.push({
					osuUserId: user.id,
					banchoPP: banchoTotalPP,
					banchoRank: user.pp.rank,
					adaptedPP: totalRankedPP,
					adaptedRank: closestRankedPPUser.osuRank,
				});
			}

			processingMessage.delete();

			let data = [];
			for (let i = 0; i < csvData.length; i++) {
				data.push(csvData[i]);

				if (i % 10000 === 0 && i > 0 || csvData.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.AttachmentBuilder(buffer, { name: 'tournamentpp.csv' });

					await interaction.channel.send({ content: 'PP with tournament top plays', files: [attachment] });
					data = [];
				}
			}

			if (interaction.client.hostCommands.includes(randomString)) {
				interaction.client.hostCommands.splice(interaction.client.hostCommands.indexOf(randomString), 1);
			}
		} else if (interaction.options.getSubcommand() === 'tournamentbanned') {
			let csvData = [];

			let lastUpdate = new Date();

			for (let i = 0; i < file.length; i++) {
				let osuUserId = file[i].trim();

				if (new Date() - lastUpdate > 15000) {
					let osuName = await getOsuPlayerName(osuUserId);
					processingMessage.edit(`Processing ${osuName} (Account ${i + 1}/${file.length})...`);
					lastUpdate = new Date();
				}

				logDatabaseQueries(4, 'commands/osu-host.js DBDiscordUsers 2');
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: osuUserId,
					},
				});

				if (discordUser && discordUser.tournamentBannedUntil && discordUser.tournamentBannedUntil > new Date()) {
					csvData.push({
						osuUserId: osuUserId,
						tournamentBannedUntil: new Date(discordUser.tournamentBannedUntil).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
						tournamentBannedReason: discordUser.tournamentBannedReason,
					});

					continue;
				}

				let additionalInfo = await getAdditionalOsuInfo(osuUserId);

				if (additionalInfo.tournamentBan && additionalInfo.tournamentBan.tournamentBannedUntil > new Date()) {
					csvData.push({
						osuUserId: osuUserId,
						tournamentBannedUntil: new Date(additionalInfo.tournamentBan.tournamentBannedUntil).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
						tournamentBannedReason: additionalInfo.tournamentBan.description,
					});
				}
			}

			processingMessage.delete();

			if (csvData.length === 0) {
				if (interaction.client.hostCommands.includes(randomString)) {
					interaction.client.hostCommands.splice(interaction.client.hostCommands.indexOf(randomString), 1);
				}

				return await interaction.channel.send({ content: 'No tournament banned users found.' });
			}

			let data = [];
			for (let i = 0; i < csvData.length; i++) {
				data.push(csvData[i]);

				if (i % 10000 === 0 && i > 0 || csvData.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.AttachmentBuilder(buffer, { name: 'tournamentbans.csv' });

					await interaction.channel.send({ content: 'Tournament banned users', files: [attachment] });
					data = [];
				}
			}

			if (interaction.client.hostCommands.includes(randomString)) {
				interaction.client.hostCommands.splice(interaction.client.hostCommands.indexOf(randomString), 1);
			}
		}
	},
};

async function getTournamentTopPlayData(osuUserId, mode) {
	let modeName = getGameModeName(mode);
	modeName = modeName.substring(0, 1).toUpperCase() + modeName.substring(1);

	if (modeName === 'Catch') {
		modeName = 'Catch the Beat';
	}

	let where = {
		osuUserId: osuUserId,
		mode: modeName,
		tourneyMatch: true,
		score: {
			[Op.gte]: 10000,
		},
		scoringType: 'Score v2',
	};

	//Get all scores from tournaments
	logDatabaseQueries(4, 'commands/osu-host.js DBOsuMultiScores 1');
	let multiScores = await DBOsuMultiScores.findAll({
		attributes: [
			'id',
			'score',
			'gameRawMods',
			'rawMods',
			'teamType',
			'pp',
			'beatmapId',
			'createdAt',
			'gameStartDate',
			'osuUserId',
			'count50',
			'count100',
			'count300',
			'countGeki',
			'countKatu',
			'countMiss',
			'maxCombo',
			'perfect',
			'matchName',
			'mode',
		],
		where: where
	});

	for (let i = 0; i < multiScores.length; i++) {
		if (parseInt(multiScores[i].score) <= 10000 || multiScores[i].teamType === 'Tag Team vs' || multiScores[i].teamType === 'Tag Co-op') {
			multiScores.splice(i, 1);
			i--;
		}
	}

	//Translate the scores to bancho scores
	for (let i = 0; i < multiScores.length; i++) {
		if (parseInt(multiScores[i].gameRawMods) % 2 === 1) {
			multiScores[i].gameRawMods = parseInt(multiScores[i].gameRawMods) - 1;
		}
		if (parseInt(multiScores[i].rawMods) % 2 === 1) {
			multiScores[i].rawMods = parseInt(multiScores[i].rawMods) - 1;
		}
		multiScores[i] = await multiToBanchoScore(multiScores[i]);

		if (!multiScores[i].pp || parseFloat(multiScores[i].pp) > 2000 || !parseFloat(multiScores[i].pp)) {
			multiScores.splice(i, 1);
			i--;
			continue;
		}
	}

	//Sort scores by pp
	multiScores.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

	//Remove duplicates by beatmapId
	for (let i = 0; i < multiScores.length; i++) {
		for (let j = i + 1; j < multiScores.length; j++) {
			if (multiScores[i].beatmapId === multiScores[j].beatmapId) {
				multiScores.splice(j, 1);
				j--;
			}
		}
	}

	logDatabaseQueries(4, 'commands/osu-host.js DBOsuBeatmaps 1');
	let dbBeatmaps = await DBOsuBeatmaps.findAll({
		attributes: [
			'beatmapId',
			'beatmapsetId',
			'approvalStatus',
			'mods',
			'updatedAt',
			'starRating',
			'maxCombo',
			'mode',
		],
		where: {
			beatmapId: {
				[Op.in]: multiScores.map(score => score.beatmapId)
			},
			mods: 0
		}
	});

	for (let i = 0; i < multiScores.length; i++) {
		let dbBeatmap = dbBeatmaps.find(dbBeatmap => dbBeatmap.beatmapId === multiScores[i].beatmapId);

		multiScores[i].beatmap = await getOsuBeatmap({ beatmapId: multiScores[i].beatmapId, beatmap: dbBeatmap });

		if (!multiScores[i].beatmap || multiScores[i].beatmap.approvalStatus !== 'Approved' && multiScores[i].beatmap.approvalStatus !== 'Ranked') {
			multiScores.splice(i, 1);
			i--;
			continue;
		}
	}

	let data = {
		scores: []
	};

	//Feed the scores into the array
	for (let i = 0; i < multiScores.length && i < 100; i++) {
		if (multiScores[i].pp) {
			data.scores.push(multiScores[i]);
		}
	}

	return data;
}
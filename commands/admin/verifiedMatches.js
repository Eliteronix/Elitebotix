const { DBOsuMultiScores, DBDiscordUsers } = require('../../dbObjects');
const { Op } = require('sequelize');
const ObjectsToCsv = require('objects-to-csv');
const { AttachmentBuilder } = require('discord.js');
const { getAccuracy } = require('../../utils');

module.exports = {
	name: 'verifiedMatches',
	usage: 'None',
	async execute(interaction) {
		await interaction.editReply('Getting verified matches...');

		let startTime = new Date();

		const verifiedMatches = await DBOsuMultiScores.findAll({
			attributes: ['osuUserId', 'matchId', 'gameId', 'scoringType', 'score', 'beatmapId', 'gameRawMods', 'rawMods', 'matchName', 'mode', 'matchStartDate', 'gameStartDate', 'freeMod', 'forceMod', 'teamType', 'team', 'count50', 'count100', 'count300', 'countMiss', 'countKatu', 'countGeki'],
			where: {
				verifiedAt: {
					[Op.not]: null,
				},
				tourneyMatch: true,
				warmup: {
					[Op.not]: true,
				},
				[Op.and]: [
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%qual%'
							},
						},
					},
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%qf-%'
							},
						},
					},
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%o!mm%'
							},
						},
					},
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%scrim%'
							},
						},
					},
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%etx%'
							},
						},
					},
					{
						[Op.not]: {
							matchName: {
								[Op.like]: '%tryout%'
							},
						},
					},
				]
			},
		});

		await interaction.channel.send(`Found ${verifiedMatches.length} verified matchscores. Took ${new Date() - startTime}ms.`);

		// Remove entries with only one player per gameId
		const gameIds = verifiedMatches.map(match => match.gameId);
		const gameIdsUnique = [...new Set(gameIds)];

		await interaction.channel.send(`Found ${gameIdsUnique.length} unique gameIds. Took ${new Date() - startTime}ms.`);

		const gameIdsUniqueCount = gameIdsUnique.map(gameId => {
			return {
				gameId: gameId,
				count: gameIds.filter(gameId2 => gameId2 === gameId).length,
			};
		});

		await interaction.channel.send(`Found ${gameIdsUniqueCount.length} unique gameIds with their count. Took ${new Date() - startTime}ms.`);

		const gameIdsUniqueCountFiltered = gameIdsUniqueCount.filter(gameId => gameId.count > 1);

		await interaction.channel.send(`Found ${gameIdsUniqueCountFiltered.length} unique gameIds with more than one player. Took ${new Date() - startTime}ms.`);

		const verifiedMatchesFiltered = verifiedMatches.filter(match => gameIdsUniqueCountFiltered.find(gameId => gameId.gameId === match.gameId));

		await interaction.channel.send(`Found ${verifiedMatchesFiltered.length} verified matchscores with more than one player per gameId. Took ${new Date() - startTime}ms.`);

		const players = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', 'osuName', 'osuRank', 'osuBadges', 'osuDuelStarRating'],
			where: {
				osuUserId: {
					[Op.in]: verifiedMatchesFiltered.map(match => match.osuUserId),
				},
			},
		});

		await interaction.channel.send(`Found ${players.length} players. Took ${new Date() - startTime}ms.`);

		for (let i = 0; i < verifiedMatchesFiltered.length; i++) {
			const player = players.find(player => player.osuUserId === verifiedMatchesFiltered[i].osuUserId);
			verifiedMatchesFiltered[i].dataValues.osuName = player.osuName;
			verifiedMatchesFiltered[i].dataValues.osuRank = player.osuRank;
			verifiedMatchesFiltered[i].dataValues.osuBadges = player.osuBadges;
			verifiedMatchesFiltered[i].dataValues.osuDuelStarRating = player.osuDuelStarRating;

			const score = verifiedMatchesFiltered[i].dataValues;

			let mode = 0;

			if (score.mode === 'Mania') {
				mode = 3;
			} else if (score.mode === 'Catch the Beat') {
				mode = 2;
			} else if (score.mode === 'Taiko') {
				mode = 1;
			}

			verifiedMatchesFiltered[i].dataValues.accuracy = getAccuracy({ counts: { 300: score.count300, 100: score.count100, 50: score.count50, miss: score.countMiss, katu: score.countKatu, geki: score.countGeki } }, mode) * 100;

			delete verifiedMatchesFiltered[i].dataValues.count300;
			delete verifiedMatchesFiltered[i].dataValues.count100;
			delete verifiedMatchesFiltered[i].dataValues.count50;
			delete verifiedMatchesFiltered[i].dataValues.countMiss;
			delete verifiedMatchesFiltered[i].dataValues.countKatu;
			delete verifiedMatchesFiltered[i].dataValues.countGeki;
		}

		await interaction.channel.send(`Creating CSV. Took ${new Date() - startTime}ms.`);

		let data = [];

		for (let i = 0; i < verifiedMatchesFiltered.length; i++) {
			data.push(verifiedMatchesFiltered[i].dataValues);

			if (i % 100000 === 0 && i > 0 || verifiedMatchesFiltered.length - 1 === i) {
				const developerUser = await interaction.client.users.cache.find(user => user.id === interaction.user.id);
				let csv = new ObjectsToCsv(data);
				csv = await csv.toString();
				// eslint-disable-next-line no-undef
				const buffer = Buffer.from(csv);
				//Create as an attachment
				// eslint-disable-next-line no-undef
				const attachment = new AttachmentBuilder(buffer, { name: `verified-matches-${process.env.SERVER}-${process.env.PROVIDER}-${i}.csv` });
				// eslint-disable-next-line no-undef
				await developerUser.send({ content: `verified matches - ${process.env.SERVER} Environment on ${process.env.PROVIDER} (${i})`, files: [attachment] });
				data = [];
			}
		}

		return await interaction.channel.send(`Verified matches sent to ${interaction.user.username} in DM. Took ${new Date() - startTime}ms.`);
	},
};
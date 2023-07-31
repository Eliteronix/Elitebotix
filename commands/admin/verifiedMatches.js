const { DBOsuMultiScores, DBDiscordUsers, DBOsuBeatmaps } = require('../../dbObjects');
const { Op } = require('sequelize');
const ObjectsToCsv = require('objects-to-csv');
const { AttachmentBuilder } = require('discord.js');
const { getAccuracy, getOsuBeatmap } = require('../../utils');

module.exports = {
	name: 'verifiedMatches',
	usage: 'None',
	async execute(interaction) {
		await interaction.editReply('Getting verified matches...');

		let startTime = new Date();

		const gameIdCounts = await DBOsuMultiScores.findAll({
			attributes: ['gameId', [DBOsuMultiScores.sequelize.fn('COUNT', DBOsuMultiScores.sequelize.col('gameId')), 'count']],
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
			group: ['gameId'],
			having: {
				count: {
					[Op.gt]: 1,
				},
			},
		});

		await interaction.channel.send(`Found ${gameIdCounts.length} gameIds with more than one player. Took ${new Date() - startTime}ms.`);

		const verifiedMatches = await DBOsuMultiScores.findAll({
			attributes: ['osuUserId', 'matchId', 'gameId', 'scoringType', 'score', 'beatmapId', 'gameRawMods', 'rawMods', 'matchName', 'mode', 'matchStartDate', 'gameStartDate', 'freeMod', 'forceMod', 'teamType', 'team', 'count50', 'count100', 'count300', 'countMiss', 'countKatu', 'countGeki'],
			where: {
				gameId: {
					[Op.in]: gameIdCounts.map(gameIdCount => gameIdCount.gameId),
				},
			},
		});

		await interaction.channel.send(`Found ${verifiedMatches.length} verified matchscores. Took ${new Date() - startTime}ms.`);

		const players = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', 'osuName', 'osuRank', 'osuBadges', 'osuDuelStarRating'],
			where: {
				osuUserId: {
					[Op.in]: verifiedMatches.map(match => match.osuUserId),
				},
			},
		});

		await interaction.channel.send(`Found ${players.length} players. Took ${new Date() - startTime}ms.`);

		for (let i = 0; i < verifiedMatches.length; i++) {
			const player = players.find(player => player.osuUserId === verifiedMatches[i].osuUserId);

			if (player) {
				verifiedMatches[i].dataValues.osuName = player.osuName;
				verifiedMatches[i].dataValues.osuRank = player.osuRank;
				verifiedMatches[i].dataValues.osuBadges = player.osuBadges;
				verifiedMatches[i].dataValues.osuDuelStarRating = player.osuDuelStarRating;
			}

			const score = verifiedMatches[i].dataValues;

			let mode = 0;

			if (score.mode === 'Mania') {
				mode = 3;
			} else if (score.mode === 'Catch the Beat') {
				mode = 2;
			} else if (score.mode === 'Taiko') {
				mode = 1;
			}

			verifiedMatches[i].dataValues.accuracy = getAccuracy({ counts: { 300: score.count300, 100: score.count100, 50: score.count50, miss: score.countMiss, katu: score.countKatu, geki: score.countGeki } }, mode) * 100;

			delete verifiedMatches[i].dataValues.count300;
			delete verifiedMatches[i].dataValues.count100;
			delete verifiedMatches[i].dataValues.count50;
			delete verifiedMatches[i].dataValues.countMiss;
			delete verifiedMatches[i].dataValues.countKatu;
			delete verifiedMatches[i].dataValues.countGeki;
		}

		await interaction.channel.send(`Added accuracy and player stats. Took ${new Date() - startTime}ms.`);

		const beatmaps = await DBOsuBeatmaps.findAll({
			where: {
				beatmapId: {
					[Op.in]: verifiedMatches.map(score => score.beatmapId),
				},
			},
		});

		await interaction.channel.send(`Found ${beatmaps.length} beatmaps. Took ${new Date() - startTime}ms.`);

		let unavailableBeatmaps = [];

		for (let i = 0; i < verifiedMatches.length; i++) {
			if (i % 5000 === 0 && i > 0) {
				await interaction.channel.send(`Assigned beatmap stats to ${i} scores. Took ${new Date() - startTime}ms.`);
			}

			let beatmap = beatmaps.find(beatmap => beatmap.beatmapId === verifiedMatches[i].beatmapId && beatmap.mods === parseInt(verifiedMatches[i].rawMods) + parseInt(verifiedMatches[i].gameRawMods));

			verifiedMatches[i].dataValues.CS = null;
			verifiedMatches[i].dataValues.AR = null;
			verifiedMatches[i].dataValues.OD = null;

			if (!beatmap && !unavailableBeatmaps.includes(verifiedMatches[i].beatmapId)) {
				beatmap = await getOsuBeatmap({ beatmapId: verifiedMatches[i].beatmapId, modBits: parseInt(verifiedMatches[i].rawMods) + parseInt(verifiedMatches[i].gameRawMods) });

				if (beatmap) {
					beatmaps.push(beatmap);
				} else {
					unavailableBeatmaps.push(verifiedMatches[i].beatmapId);
				}
			}

			if (beatmap) {
				verifiedMatches[i].dataValues.CS = beatmap.circleSize;
				verifiedMatches[i].dataValues.AR = beatmap.approachRate;
				verifiedMatches[i].dataValues.OD = beatmap.overallDifficulty;
			}
		}

		await interaction.channel.send(`Added beatmap stats. Took ${new Date() - startTime}ms.`);

		let data = [];

		for (let i = 0; i < verifiedMatches.length; i++) {
			data.push(verifiedMatches[i].dataValues);

			if (i % 100000 === 0 && i > 0 || verifiedMatches.length - 1 === i) {
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
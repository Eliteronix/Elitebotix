const { DBOsuMultiScores } = require('../../dbObjects');
const { Op } = require('sequelize');
const ObjectsToCsv = require('objects-to-csv');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
	name: 'verifiedMatches',
	usage: 'None',
	async execute(interaction) {
		const verifiedMatches = await DBOsuMultiScores.findAll({
			attributes: ['matchId', 'osuUserId', 'score', 'beatmapId', 'matchName'],
			where: {
				verifiedAt: {
					[Op.not]: null,
				},
				tourneyMatch: true,
			},
		});

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
				const attachment = new AttachmentBuilder(buffer, { name: `verified-matches-${process.env.SERVER}-${process.env.PROVIDER}.csv` });
				// eslint-disable-next-line no-undef
				await developerUser.send({ content: `verified matches - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, files: [attachment] });
				data = [];
			}
		}

		return await interaction.editReply(`Verified matches sent to ${interaction.user.username}`);
	},
};
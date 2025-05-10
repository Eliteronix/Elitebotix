const { DBProcessQueue, DBDiscordUsers } = require('../../dbObjects');

module.exports = {
	name: 'updateOsuPlayer',
	usage: '<osuUserId>',
	async execute(interaction) {
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuName'],
			where: {
				osuUserId: interaction.options.getString('argument')
			}
		});

		const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });

		if (existingTask === 0) {
			DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId });
		}

		await interaction.editReply(`Updated ${discordUser.osuName}!`);
	},
};
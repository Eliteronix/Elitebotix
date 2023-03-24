const { DBProcessQueue, DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'updateOsuPlayer',
	usage: '<osuUserId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuName'],
			where: {
				osuUserId: interaction.options.getString('argument')
			}
		});

		logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js updateElitiriRanks DBProcessQueue');
		const existingTask = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });

		if (existingTask === 0) {
			logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBProcessQueue create');
			DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId });
		}

		await interaction.editReply(`Updated ${discordUser.osuName}!`);
	},
};
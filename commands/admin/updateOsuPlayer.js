const { DBProcessQueue, DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'updateOsuPlayer',
	usage: '<osuUserId>',
	async execute(interaction) {
		//TODO: Attributes
		logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: interaction.options.getString('argument')
			}
		});

		//TODO: Attributes
		logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js updateElitiriRanks DBProcessQueue');
		const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId } });
		if (!existingTask) {
			logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBProcessQueue create');
			DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: discordUser.osuUserId });
		}

		await interaction.editReply(`Updated ${discordUser.osuName}!`);
	},
};
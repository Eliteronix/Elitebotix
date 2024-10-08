const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'removeTwitchSyncEnable',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/removeTwitchSyncEnable.js DBDiscordUsers');
		let twitchSyncUsers = await DBDiscordUsers.findAll({
			attributes: ['id', 'twitchOsuMapSync'],
			where: {
				twitchOsuMapSync: true
			}
		});

		for (let i = 0; i < twitchSyncUsers.length; i++) {
			twitchSyncUsers[i].twitchOsuMapSync = false;
			await twitchSyncUsers[i].save();
		}

		await interaction.editReply('Removed twitch sync enable from all users');
	},
};
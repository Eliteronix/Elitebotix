const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'removeTwitchSyncEnable',
	usage: 'None',
	async execute(interaction) {
		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/admin/removeTwitchSyncEnable.js DBDiscordUsers');
		let twitchSyncUsers = await DBDiscordUsers.findAll({
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
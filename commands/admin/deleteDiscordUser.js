const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'deleteDiscordUser',
	usage: '<userId>',
	async execute(interaction) {
		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/admin/deleteDiscordUser.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.options.getString('argument')
			}
		});

		if (discordUser) {
			await discordUser.destroy();
			return await interaction.editReply('Deleted discord user');
		}

		return await interaction.editReply('Could not find discord user');
	},
};
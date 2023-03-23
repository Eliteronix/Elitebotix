const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'deleteDiscordUser',
	usage: '<userId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/deleteDiscordUser.js DBDiscordUsers');
		let deleted = await DBDiscordUsers.destroy({
			where: {
				userId: interaction.options.getString('argument')
			}
		});

		if (deleted) {
			return await interaction.editReply(`Deleted ${deleted} discord user`);
		}

		return await interaction.editReply('Could not find discord user');
	},
};
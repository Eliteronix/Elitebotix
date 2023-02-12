const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'patreon',
	usage: '<userId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/patreon.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.options.getString('argument')
			}
		});

		if (discordUser.patreon) {
			discordUser.patreon = false;
			await interaction.editReply('Patreon status set to false');
		} else {
			discordUser.patreon = true;
			await interaction.editReply('Patreon status set to true');
		}
		discordUser.save();
	},
};
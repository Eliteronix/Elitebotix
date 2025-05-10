const { DBDiscordUsers } = require('../../dbObjects');

module.exports = {
	name: 'patreon',
	usage: '<userId>',
	async execute(interaction) {
		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'patreon'],
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
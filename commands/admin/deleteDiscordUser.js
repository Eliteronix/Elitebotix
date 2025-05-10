const { DBDiscordUsers } = require('../../dbObjects');

module.exports = {
	name: 'deleteDiscordUser',
	usage: '<userId>',
	async execute(interaction) {
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
const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'removeOsuUserConnection',
	usage: '<osuUserId>',
	async execute(interaction) {
		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/admin/removeOsuUserConnection.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				osuUserId: interaction.options.getString('argument'),
				osuVerified: true
			}
		});

		if (discordUser) {
			discordUser.osuUserId = null;
			discordUser.osuVerificationCode = null;
			discordUser.osuVerified = false;
			discordUser.osuName = null;
			discordUser.osuBadges = 0;
			discordUser.osuPP = null;
			discordUser.osuRank = null;
			discordUser.taikoPP = null;
			discordUser.taikoRank = null;
			discordUser.catchPP = null;
			discordUser.catchRank = null;
			discordUser.maniaPP = null;
			discordUser.maniaRank = null;
			discordUser.save();

			await interaction.editReply('Removed osuUserId and verification for:', interaction.options.getString('argument'));
		} else {
			await interaction.editReply('User not found');
		}
	},
};
const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'connectOsuUser',
	usage: '<discordId> <osuUserId>',
	async execute(interaction) {
		let args = interaction.options.getString('argument').split(/ +/);

		let discordId = args[0];

		logDatabaseQueries(4, 'commands/admin/connectOsuUser.js DBDiscordUsers discordId');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['id', 'osuUserId'],
			where: {
				userId: discordId
			}
		});

		let osuUserId = args[1];

		logDatabaseQueries(4, 'commands/admin/connectOsuUser.js DBDiscordUsers osuUserId');
		let osuUsers = await DBDiscordUsers.findAll({
			attributes: ['id', 'userId'],
			where: {
				osuUserId: osuUserId
			}
		});

		if (discordUsers.length) {
			for (let i = 0; i < discordUsers.length; i++) {
				discordUsers[i].osuUserId = osuUserId;
				await discordUsers[i].save();
			}

			await interaction.followUp(`Connected ${discordUsers.length} discord users to osu user ${osuUserId}`);

			for (let i = 0; i < osuUsers.length; i++) {
				await osuUsers[i].destroy();
			}

			await interaction.followUp(`Deleted ${osuUsers.length} osu users`);
		} else if (osuUsers.length) {
			osuUsers[0].userId = discordId;
			await osuUsers[0].save();

			await interaction.followUp(`Connected osu user ${osuUserId} to discord user <@${discordId}>`);
		} else {
			await DBDiscordUsers.create({
				userId: discordId,
				osuUserId: osuUserId
			});

			await interaction.followUp(`Created new connection between discord user <@${discordId}> and osu user ${osuUserId}`);
		}
	},
};
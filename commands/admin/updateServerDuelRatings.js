const { DBDiscordUsers } = require('../../dbObjects');
const { getUserDuelStarRating, logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'updateServerDuelRatings',
	usage: 'None',
	async execute(interaction) {
		await interaction.editReply('Updating server duel ratings...');
		const sentMessage = await interaction.channel.send('Fetching members...');

		try {
			let members = await interaction.guild.members.fetch({ time: 300000 })
				.catch((err) => {
					throw new Error(err);
				});

			members = members.filter(member => member.user.bot !== true).map(member => member);

			for (let i = 0; i < members.length; i++) {
				if (i % 25 === 0) {
					sentMessage.edit(`${i} out of ${members.length} done`);
				}

				logDatabaseQueries(4, 'commands/admin/updateServerDuelRatings.js DBDiscordUsers');
				const discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId'],
					where: {
						userId: members[i].id
					},
				});

				if (discordUser) {
					try {
						await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
					} catch (e) {
						if (e.message !== 'No standard plays') {
							console.error('commands/admin/updateServerDuelRatings.js | getUserDuelStarRating', e);
						}
					}
				}
			}

			sentMessage.edit(`Updated ${members.length} members`);
		} catch (e) {
			if (e.message !== 'Members didn\'t arrive in time.') {
				console.error('commands/tempvoice.js | text enable guild exists check bot permissions', e);
				return;
			}
		}
	},
};
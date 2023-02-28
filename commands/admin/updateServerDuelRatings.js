const { DBDiscordUsers } = require('../../dbObjects');
const { getUserDuelStarRating, logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'updateServerDuelRatings',
	usage: 'None',
	async execute(interaction) {
		await interaction.editReply('Updating server duel ratings...');
		const sentMessage = await interaction.channel.send('Fetching members...');
		await interaction.guild.members.fetch()
			.then(async (guildMembers) => {

				const members = [];
				guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

				for (let i = 0; i < members.length; i++) {
					if (i % 25 === 0) {
						sentMessage.edit(`${i} out of ${members.length} done`);
					}
					logDatabaseQueries(4, 'commands/admin/updateServerDuelRatings.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						where: {
							userId: members[i].id
						},
					});

					if (discordUser) {
						await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
					}
				}

				sentMessage.edit(`Updated ${members.length} members`);
			})
			.catch(error => {
				console.error(error);
			});
	},
};
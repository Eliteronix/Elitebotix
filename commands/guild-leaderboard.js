const { DBServerUserActivity } = require('../dbObjects');
const { createLeaderboard, humanReadable } = require('../utils.js');

module.exports = {
	name: 'server-leaderboard',
	aliases: ['guild-leaderboard', 'guild-ranking'],
	description: 'Sends a leaderboard of the top users in the guild',
	usage: '<page>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let processingMessage = await msg.channel.send('Processing guild leaderboard...');

		msg.guild.members.fetch()
			.then(async (guildMembers) => {
				const members = guildMembers.filter(member => member.user.bot !== true).array();
				let discordUsers = [];
				for (let i = 0; i < members.length; i++) {
					const serverUserActivity = await DBServerUserActivity.findOne({
						where: { userId: members[i].id, guildId: msg.guild.id },
					});

					if (serverUserActivity) {
						discordUsers.push(serverUserActivity);
					}
				}

				quicksort(discordUsers);

				let leaderboardData = [];

				for (let i = 0; i < discordUsers.length; i++) {
					const member = await msg.guild.members.fetch(discordUsers[i].userId);

					let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

					if (member.nickname) {
						userDisplayName = `${member.nickname} / ${userDisplayName}`;
					}

					let dataset = {
						name: userDisplayName,
						value: `${humanReadable(discordUsers[i].points)} point(s)`,
					};

					leaderboardData.push(dataset);
				}

				let page;

				if (args[0] && !isNaN(args[0])) {
					page = parseInt(args[0]);
				}

				const attachment = await createLeaderboard(leaderboardData, 'discord-background.png', `${msg.guild.name}'s activity leaderboard`, `guild-leaderboard-${msg.guild.name}.png`, page);

				//Send attachment
				await msg.channel.send('The leaderboard shows the most active users of the server.', attachment);

				processingMessage.delete();
			})
			.catch(err => {
				processingMessage.edit('Error');
				console.log(err);
			});
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].points) >= parseFloat(pivot.points)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}
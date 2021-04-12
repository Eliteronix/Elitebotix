const { DBServerUserActivity, DBActivityRoles } = require('../dbObjects');

module.exports = {
	async execute(client, processQueueEntry) {
		const activityRoles = DBActivityRoles.findAll({
			where: { guildId: processQueueEntry.guildId }
		});

		if(!activityRoles){
			return;
		}

		const guild = await client.guilds.fetch(processQueueEntry.guildId);

		guild.members.fetch()
			.then(async (guildMembers) => {
				const members = guildMembers.filter(member => member.user.bot !== true).array();
				let discordUsers = [];
				for (let i = 0; i < members.length; i++) {
					const serverUserActivity = await DBServerUserActivity.findOne({
						where: { userId: members[i].id, guildId: guild.id },
					});

					if (serverUserActivity) {
						discordUsers.push(serverUserActivity);
					}
				}

				quicksort(discordUsers);

				for (let i = 0; i < discordUsers.length; i++) {
					let user = {
						id: discordUsers[i].userId,
						points: discordUsers[i].points,
						rank: i+1,
						percentage: 100/members.length*i,
					};

					for(let j = 0; j < activityRoles.length; j++){
						let shouldHaveRole = true;

						if(activityRoles[j].pointsCutoff && activityRoles[j].pointsCutoff > user.points){
							shouldHaveRole = false;
						}
						if(shouldHaveRole && activityRoles[j].rankCutoff && activityRoles[j].rankCutoff > user.rank){
							shouldHaveRole = false;
						}
						if(shouldHaveRole && activityRoles[j].percentageCutoff && activityRoles[j].percentageCutoff > user.percentage){
							shouldHaveRole = false;
						}

						if(shouldHaveRole){
							//Assign role if user doesn't have it //does it matter or can I just assign?
						} else {
							//Remove role if user has it //does it matter or can I just remove?
						}
					}
				}
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
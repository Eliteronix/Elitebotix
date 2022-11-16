const { DBServerUserActivity, DBActivityRoles } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('updateActivityRoles');
		logDatabaseQueries(2, 'processQueueTasks/updateActivityRoles.js DBActivityRoles');
		const activityRoles = await DBActivityRoles.findAll({
			where: { guildId: processQueueEntry.guildId }
		});

		if (!activityRoles.length) {
			processQueueEntry.destroy();
			return;
		}

		let guild;

		try {
			// TODO: Change to broadcast
			guild = await client.guilds.fetch(processQueueEntry.guildId);
		} catch (e) {
			if (e.message === 'Missing Access') {
				processQueueEntry.destroy();
				return;
			} else {
				processQueueEntry.destroy();
				return console.log(e);
			}
		}

		let activityRoleObjects = [];

		for (let i = 0; i < activityRoles.length; i++) {
			const role = await guild.roles.cache.get(activityRoles[i].roleId);
			if (role) {
				activityRoleObjects.push(role);
			} else {
				activityRoles.splice(i, 1);
				i--;
			}
		}

		await guild.members.fetch()
			.then(async (guildMembers) => {

				const members = [];
				guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));
				let discordUsers = [];
				for (let i = 0; i < members.length; i++) {
					logDatabaseQueries(2, 'processQueueTasks/updateActivityRoles.js DBServerUserActivity');
					const serverUserActivity = await DBServerUserActivity.findOne({
						where: { userId: members[i].id, guildId: guild.id },
					});

					if (serverUserActivity) {
						discordUsers.push(serverUserActivity);
					}
				}

				quicksort(discordUsers);

				let missingPermissionsMessage = false;

				for (let i = 0; i < discordUsers.length; i++) {
					let user = {
						id: discordUsers[i].userId,
						points: discordUsers[i].points,
						rank: i + 1,
						percentage: 100 / members.length * i,
					};

					let member;

					for (let j = 0; j < members.length && !member; j++) {
						if (members[j].user.id === discordUsers[i].userId) {
							member = members[j];
						}
					}

					for (let j = 0; j < activityRoles.length; j++) {
						let shouldHaveRole = true;

						if (activityRoles[j].pointsCutoff && activityRoles[j].pointsCutoff > user.points) {
							shouldHaveRole = false;
						}
						if (shouldHaveRole && activityRoles[j].rankCutoff && activityRoles[j].rankCutoff < user.rank) {
							shouldHaveRole = false;
						}
						if (shouldHaveRole && activityRoles[j].percentageCutoff && activityRoles[j].percentageCutoff < user.percentage) {
							shouldHaveRole = false;
						}

						if (shouldHaveRole) {
							try {
								if (!member.roles.cache.has(activityRoles[j].roleId)) {
									//Assign role if not there yet
									await member.roles.add(activityRoleObjects[j]);
								}
							} catch (e) {
								if (e.message === 'Missing Access') {
									if (!missingPermissionsMessage) {
										const owner = await member.client.users.fetch(member.guild.ownerId);
										if (owner) {
											owner.send(`I could not assign an activityrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
											missingPermissionsMessage = true;
										}
									}
									processQueueEntry.destroy();
									return;
								} else {
									processQueueEntry.destroy();
									return console.log(e);
								}
							}
						} else {
							try {
								if (member.roles.cache.has(activityRoles[j].roleId)) {
									//remove role if the role is there
									await member.roles.remove(activityRoleObjects[j]);
								}
							} catch (e) {
								if (e.message === 'Missing Access') {
									if (!missingPermissionsMessage) {
										const owner = await member.client.users.fetch(member.guild.ownerId);
										if (owner) {
											owner.send(`I could not remove an activityrole from an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
											missingPermissionsMessage = true;
										}
									}
									processQueueEntry.destroy();
									return;
								} else {
									processQueueEntry.destroy();
									return console.log(e);
								}
							}
						}
					}
				}
			});

		processQueueEntry.destroy();
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
const { logDatabaseQueries } = require('../utils');
const { DBActivityRoles } = require('../dbObjects');
const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('updateActivityRoles');
		logDatabaseQueries(2, 'processQueueTasks/updateActivityRoles.js DBActivityRoles');
		const activityRoles = await DBActivityRoles.findAll({
			where: { guildId: processQueueEntry.guildId }
		});

		if (!activityRoles.length) {
			processQueueEntry.destroy();
			return;
		}

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting processQueueTasks/updateActivtyRoles.js to shards...');
		}

		client.shard.broadcastEval(async (c, { guildId, activityRoles }) => {
			// eslint-disable-next-line no-undef
			const { logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			let guild;

			try {
				guild = await c.guilds.cache.get(guildId);
			} catch (e) {
				if (e.message === 'Missing Access') {
					return;
				} else {
					return console.error(e);
				}
			}

			if (!guild || guild.shardId !== c.shardId) {
				return;
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

			//Fetch all members
			let members = null;
			try {
				members = await guild.members.fetch({ time: 300000 });

				members = members.filter(member => member.user.bot !== true).map(member => member);
			} catch (e) {
				if (e.message !== 'Members didn\'t arrive in time.') {
					console.error('processQueueTasks/updateActivityRoles.js | Get members', e);
					return;
				}
			}

			let discordUsers = [];
			for (let i = 0; i < members.length; i++) {
				// eslint-disable-next-line no-undef
				const { DBServerUserActivity } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				logDatabaseQueries(2, 'processQueueTasks/updateActivityRoles.js DBServerUserActivity');
				const serverUserActivity = await DBServerUserActivity.findOne({
					where: { userId: members[i].id, guildId: guild.id },
				});

				if (serverUserActivity) {
					discordUsers.push(serverUserActivity);
				}
			}

			discordUsers.sort((a, b) => parseInt(b.points) - parseInt(a.points));

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
							if (e.message === 'Missing Access' || e.message === 'Missing Permissions') {
								if (!missingPermissionsMessage) {
									const owner = await member.client.users.fetch(member.guild.ownerId);
									if (owner) {
										owner.send(`I could not assign an activityrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\` or because the role is higher than my highest role.`);
										missingPermissionsMessage = true;
									}
								}
								return;
							} else {
								return console.error(e);
							}
						}
					} else {
						try {
							if (member.roles.cache.has(activityRoles[j].roleId)) {
								//remove role if the role is there
								await member.roles.remove(activityRoleObjects[j]);
							}
						} catch (e) {
							if (e.message === 'Missing Access' || e.message === 'Missing Permissions') {
								if (!missingPermissionsMessage) {
									const owner = await member.client.users.fetch(member.guild.ownerId);
									if (owner) {
										owner.send(`I could not remove an activityrole from an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\` or because the role is higher than my highest role.`);
										missingPermissionsMessage = true;
									}
								}
								return;
							} else {
								return console.error(e);
							}
						}
					}
				}
			}
		}, { context: { guildId: processQueueEntry.guildId, activityRoles: activityRoles } });

		processQueueEntry.destroy();
	},
};
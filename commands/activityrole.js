const { DBActivityRoles, DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'activityrole',
	aliases: ['activityroles'],
	description: 'Assigns roles depending on how active your users are; Recommended for use in a private channel to not mention every user with that role',
	usage: '<add/remove/list> <@role> <topx/topx%/xpoints> [topx/topx%/xpoints]',
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	botPermissions: 'MANAGE_ROLES',
	botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//Check the first argument
		if (args[0] === 'add') {
			//Check if any roles were memtioned
			if (msg.mentions.roles.first()) {
				//Remove <@& > and get roleId
				const activityRoleId = args[1].replace('<@&', '').replace('>', '');
				//get role object with id
				let activityRoleName = msg.guild.roles.cache.get(args[1].replace('<@&', '').replace('>', ''));
				//try to find that activityrole in the db
				const activityRole = await DBActivityRoles.findOne({
					where: { guildId: msg.guild.id, roleId: activityRoleId },
				});

				//If activityrole already exists
				if (activityRole) {
					msg.channel.send(`${activityRoleName.name} is already an activityrole.`);
				} else {
					let rankCutoff;
					let percentageCutoff;
					let pointsCutoff;
					for (let i = 0; i < args.length; i++) {
						if (args[i].startsWith('top') && args[i].endsWith('%')) {
							const percentage = args[i].substring(3, args[i].length - 1);
							if (isNaN(percentage)) {
								return msg.channel.send(`\`${percentage.replace(/`/g, '')}\` is not a valid percentage. (\`${args[i].replace(/`/g, '')}\`)`);
							}
							percentageCutoff = percentage;
						} else if (args[i].endsWith('points')) {
							const points = args[i].substring(0, args[i].length - 6);
							if (isNaN(points)) {
								return msg.channel.send(`\`${points.replace(/`/g, '')}\` is not a valid amount of points. (\`${args[i].replace(/`/g, '')}\`)`);
							}
							pointsCutoff = points;
						} else if (args[i].startsWith('top')) {
							const rank = args[i].substring(3, args[i].length);
							if (isNaN(rank)) {
								return msg.channel.send(`\`${rank.replace(/`/g, '')}\` is not a valid rank. (\`${args[i].replace(/`/g, '')}\`)`);
							}
							rankCutoff = rank;
						}
					}

					//If activityrole doesn't exist in db then create it
					DBActivityRoles.create({ guildId: msg.guild.id, roleId: activityRoleId, percentageCutoff: percentageCutoff, pointsCutoff: pointsCutoff, rankCutoff: rankCutoff });
					const existingTask = await DBProcessQueue.findOne({ where: { guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 } });
					if (!existingTask) {
						DBProcessQueue.create({ guildId: msg.guild.id, task: 'updateActivityRoles', priority: 5 });
					}
					msg.channel.send(`${activityRoleName.name} has been added as an activityrole. The roles will get updated periodically and will not happen right after a user reached a new milestone.`);
				}
			} else {
				//If no roles were mentioned
				msg.reply('you didn\'t mention any roles.');
			}
			//check for first argument
		} else if (args[0] === 'remove') {
			//check if any roles were mentioned
			if (msg.mentions.roles.first()) {
				//Remove <@& > and get roleId
				const activityRoleId = args[1].replace('<@&', '').replace('>', '');
				//get role object with id
				let activityRoleName = msg.guild.roles.cache.get(args[1].replace('<@&', '').replace('>', ''));
				//Delete roles with roleId and guildId
				const rowCount = await DBActivityRoles.destroy({ where: { guildId: msg.guild.id, roleId: activityRoleId } });
				//Send feedback message accordingly
				if (rowCount > 0) {
					msg.guild.members.forEach(member => {
						if (member.roles.find(r => r.id == activityRoleName.id)){
							member.removeRole(activityRoleName.id);
						}
					});
					msg.channel.send(`${activityRoleName.name} has been removed from activityroles.`);
				} else {
					msg.channel.send(`${activityRoleName.name} was no activityrole.`);
				}
			} else {
				//if no roles were mentioned
				msg.reply('you didn\'t mention any roles.');
			}
			//Check first argument
		} else if (args[0] === 'list') { // has to be adapted still
			//get all activityRoles for the guild
			const activityRolesList = await DBActivityRoles.findAll({ where: { guildId: msg.guild.id } });
			//iterate for every activityrole in the array
			for (let i = 0; i < activityRolesList.length; i++) {
				//get role object by role Id
				let activityRole = msg.guild.roles.cache.get(activityRolesList[i].roleId);

				//Check if deleted role
				if (activityRole) {
					//Set array index to the role name for the output
					activityRolesList[i] = activityRole.name;
				} else {
					DBActivityRoles.destroy({ where: { guildId: msg.guild.id, roleId: activityRolesList[i].roleId } });
					activityRolesList.shift();
				}
			}
			//Set the output string
			const activityRolesString = activityRolesList.join(', ') || 'No activityroles found.';
			//Output activityrole list
			msg.channel.send(`List of activityroles: ${activityRolesString}`);
		} else {
			let guildPrefix = await getGuildPrefix(msg);

			//If no proper first argument is given
			msg.channel.send(`Please declare if you want to add, remove or list the activityrole(s). Proper usage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}
	},
};

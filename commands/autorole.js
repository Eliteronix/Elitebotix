const { DBAutoRoles } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'autorole',
	aliases: ['autoroles', 'ar'],
	description: 'Assigns roles on joining the server; Recommended for use in a private channel to not mention every user with that role',
	usage: '<add/remove/list> <@role>',
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
				const autoRoleId = args[1].replace('<@&', '').replace('>', '');
				//get role object with id
				let autoRoleName = msg.guild.roles.cache.get(args[1].replace('<@&', '').replace('>', ''));
				//try to find that autorole in the db
				const autoRole = await DBAutoRoles.findOne({
					where: { guildId: msg.guild.id, roleId: autoRoleId },
				});

				//If autorole already exists
				if (autoRole) {
					msg.channel.send(`${autoRoleName.name} is already an autorole.`);
				} else {
					//If autorole doesn't exist in db then create it
					DBAutoRoles.create({ guildId: msg.guild.id, roleId: autoRoleId });
					msg.channel.send(`${autoRoleName.name} has been added as an autorole.`);

					//Get all members of the guild
					const guildMembers = await msg.guild.members.fetch();

					//Assign the role to every member
					guildMembers.forEach(autoRole => {
						autoRole.roles.add(autoRoleName);
					});
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
				const autoRoleId = args[1].replace('<@&', '').replace('>', '');
				//get role object with id
				let autoRoleName = msg.guild.roles.cache.get(args[1].replace('<@&', '').replace('>', ''));
				//Delete roles with roleId and guildId
				const rowCount = await DBAutoRoles.destroy({ where: { guildId: msg.guild.id, roleId: autoRoleId } });
				//Send feedback message accordingly
				if (rowCount > 0) {
					msg.channel.send(`${autoRoleName.name} has been removed from autoroles.`);
				} else {
					msg.channel.send(`${autoRoleName.name} was no autorole.`);
				}
			} else {
				//if no roles were mentioned
				msg.reply('you didn\'t mention any roles.');
			}
			//Check first argument
		} else if (args[0] === 'list') {
			//get all autoRoles for the guild
			const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: msg.guild.id } });
			//iterate for every autorole in the array
			for (let i = 0; i < autoRolesList.length; i++) {
				//get role object by role Id
				let autoRole = msg.guild.roles.cache.get(autoRolesList[i].roleId);
				//Set array index to the role name for the output
				autoRolesList[i] = autoRole.name;
			}
			//Set the output string
			const autoRolesString = autoRolesList.join(', ') || 'No autoroles found.';
			//Output autorole list
			msg.channel.send(`List of autoroles: ${autoRolesString}`);
		} else {
			let guildPrefix = await getGuildPrefix(msg);

			//If no proper first argument is given
			msg.channel.send(`Please add if you want to add, remove or list the autorole(s). Proper usage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}
	},
};

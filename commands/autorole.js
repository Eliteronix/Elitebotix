const { AutoRoles } = require('../dbObjects');

//import the config variables from config.json
const { prefix } = require('../config.json');

module.exports = {
	name: 'autorole',
	//aliases: ['developer'],
	description: 'Assigns roles on joining the server; Recommended for use in a private channel to not mention every user with that role',
	usage: '<add/remove/list> <@role>',
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (args[0] === 'add') {
				if (msg.mentions.roles.first()) {
					const autoRoleId = args[1].replace('<@', '').replace('>', '');

					const autoRole = await AutoRoles.findOne({
						where: { guildId: msg.guild.id, roleId: autoRoleId },
					});

					if (autoRole) {
						msg.channel.send('The role is already an autorole.');
					} else {
						AutoRoles.create({ guildId: msg.guild.id, roleId: autoRoleId });
						msg.channel.send('The role has been added as an autorole.');
					}
				} else {
					msg.reply('you didn\'t mention any roles.');
				}
			} else if (args[0] === 'remove') {
				if (msg.mentions.roles.first()) {
					const autoRoleId = args[1].replace('<@', '').replace('>', '');
					const rowCount = await AutoRoles.destroy({ where: { guildId: msg.guild.id, roleId: autoRoleId } });
					if (rowCount > 0) {
						msg.channel.send('The role has been removed from autoroles.');
					} else {
						msg.channel.send('The role was no autorole.');
					}
				} else {
					msg.reply('you didn\'t mention any roles.');
				}
			} else if (args[0] === 'list') {
				const autoRolesList = await AutoRoles.findAll({ where: { guildId: msg.guild.id } });
				const autoRolesString = autoRolesList.map(t => t.roleId).join(', ') || 'No autoroles found.';
				msg.channel.send(`List of autoroles: ${autoRolesString}`);
			} else {
				msg.channel.send(`Please add if you want to add, remove or list the autorole. Proper usage: \`${prefix}${this.name} ${this.usage}\``);
			}
		}
	},
};
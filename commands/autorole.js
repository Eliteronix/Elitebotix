const { DBAutoRoles } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'autorole',
	aliases: ['autoroles', 'ar'],
	description: 'Assigns roles on joining the server; Recommended for use in a private channel to not mention every user with that role',
	usage: '<add/remove/list> <@role>',
	permissions: Permissions.FLAGS.MANAGE_ROLES,
	permissionsTranslated: 'Manage Roles',
	botPermissions: [Permissions.FLAGS.MANAGE_ROLES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let role = interaction.options.getRole('role');

		if (interaction.options._subcommand === 'add') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles add');
			const autoRole = await DBAutoRoles.findOne({
				where: { guildId: interaction.guildId, roleId: role.id },
			});

			if (autoRole) {
				return interaction.editReply(`${role.name} is already an autorole.`);
			}

			await DBAutoRoles.create({ guildId: interaction.guildId, roleId: role.id });

			interaction.editReply(`${role.name} has been added as an autorole.`);

			const guildMembers = await interaction.guild.members.fetch();

			//Assign the role to every member
			guildMembers.forEach(autoRole => {
				autoRole.roles.add(role);
			});
		} else if (interaction.options._subcommand === 'remove') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles remove');
			const rowCount = await DBAutoRoles.destroy({ where: { guildId: interaction.guildId, roleId: role.id } });

			if (rowCount > 0) {
				return interaction.editReply(`${role.name} has been removed from autoroles.`);
			} else {
				return interaction.editReply(`${role.name} was no autorole.`);
			}
		} else if (interaction.options._subcommand === 'list') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles list');
			const autoRolesList = await DBAutoRoles.findAll({
				where: {
					guildId: interaction.guildId
				}
			});

			//iterate for every autorole in the array
			for (let i = 0; i < autoRolesList.length; i++) {
				//get role object by role Id
				let autoRole = interaction.guild.roles.cache.get(autoRolesList[i].roleId);

				if (autoRole) {
					autoRolesList[i] = autoRole.name;
				} else {
					DBAutoRoles.destroy({ where: { guildId: interaction.guildId, roleId: autoRolesList[i].roleId } });
					autoRolesList.shift();
				}
			}

			const autoRolesString = autoRolesList.join(', ') || 'No autoroles found.';

			return interaction.editReply(`List of autoroles: ${autoRolesString}`);
		}

	},
};

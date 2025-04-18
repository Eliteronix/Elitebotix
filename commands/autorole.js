const { DBAutoRoles } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	name: 'autorole',
	description: 'Assigns roles on joining the server',
	botPermissions: [PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages and Manage Roles',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('autorole')
		.setNameLocalizations({
			'de': 'automatischerollenvergabe',
			'en-GB': 'autorole',
			'en-US': 'autorole',
		})
		.setDescription('Lets you set up roles that will be automatically assigned on joining')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es dir, Rollen einzurichten, die automatisch bei Server beitritt vergeben werden',
			'en-GB': 'Lets you set up roles that will be automatically assigned on joining',
			'en-US': 'Lets you set up roles that will be automatically assigned on joining',
		})
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.setDMPermission(false)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setNameLocalizations({
					'de': 'hinzufügen',
					'en-GB': 'add',
					'en-US': 'add',
				})
				.setDescription('Lets you add a new role that will be automatically assigned on joining')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir, eine neue Rolle hinzuzufügen, die automatisch bei Server beitritt vergeben wird',
					'en-GB': 'Lets you add a new role that will be automatically assigned on joining',
					'en-US': 'Lets you add a new role that will be automatically assigned on joining',
				})
				.addRoleOption(option =>
					option
						.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role that should be an autorole')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die automatisch vergeben werden soll',
							'en-GB': 'The role that should be an autorole',
							'en-US': 'The role that should be an autorole',
						})
						.setRequired(true),
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setNameLocalizations({
					'de': 'entfernen',
					'en-GB': 'remove',
					'en-US': 'remove',
				})
				.setDescription('Lets you remove an existing autorole')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir, eine bestehende automatische Rollenvergabe zu entfernen',
					'en-GB': 'Lets you remove an existing autorole',
					'en-US': 'Lets you remove an existing autorole',
				})
				.addRoleOption(option =>
					option
						.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role that should no longer be an autorole')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die nicht mehr automatisch vergeben werden soll',
							'en-GB': 'The role that should no longer be an autorole',
							'en-US': 'The role that should no longer be an autorole',
						})
						.setRequired(true),
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Show which autoroles are set up')
				.setDescriptionLocalizations({
					'de': 'Zeigt an, welche Rollen automatisch vergeben werden',
					'en-GB': 'Show which autoroles are set up',
					'en-US': 'Show which autoroles are set up',
				}),
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let role = interaction.options.getRole('role');

		if (interaction.options.getSubcommand() === 'add') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles add');
			const autoRole = await DBAutoRoles.count({
				where: { guildId: interaction.guildId, roleId: role.id },
			});

			if (autoRole) {
				return await interaction.editReply(`${role.name} is already an autorole.`);
			}

			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles add create');
			await DBAutoRoles.create({ guildId: interaction.guildId, roleId: role.id });

			await interaction.editReply(`${role.name} has been added as an autorole.`);

			let guildMembers = null;

			while (!guildMembers) {
				try {
					guildMembers = await interaction.guild.members.fetch({ time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('autorole.js | Adding roles to all members', e);
						return;
					}
				}
			}

			let errorSent = false;

			//Assign the role to every member
			guildMembers.forEach(async (autoRole) => {
				try {
					await autoRole.roles.add(role);
				} catch (error) {
					if (!errorSent) {
						await interaction.followUp(`Error assigning role to users. Make sure the bot has at least one role above the role it is trying to assign to other users.`);
						errorSent = true;
					}
				}
			});
		} else if (interaction.options.getSubcommand() === 'remove') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles remove');
			const rowCount = await DBAutoRoles.destroy({ where: { guildId: interaction.guildId, roleId: role.id } });

			if (rowCount > 0) {
				return await interaction.editReply(`${role.name} has been removed from autoroles.`);
			} else {
				return await interaction.editReply(`${role.name} was no autorole.`);
			}
		} else if (interaction.options.getSubcommand() === 'list') {
			logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles list');
			const autoRolesList = await DBAutoRoles.findAll({
				attributes: ['roleId'],
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
					logDatabaseQueries(4, 'commands/autorole.js DBAutoRoles list destroy');
					DBAutoRoles.destroy({ where: { guildId: interaction.guildId, roleId: autoRolesList[i].roleId } });
					autoRolesList.shift();
				}
			}

			const autoRolesString = autoRolesList.join(', ') || 'No autoroles found.';

			return await interaction.editReply(`List of autoroles: ${autoRolesString}`);
		}

	},
};

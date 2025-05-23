const { DBActivityRoles, DBProcessQueue } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	name: 'activityrole',
	description: 'Assigns roles depending on how active your users are',
	botPermissions: [PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages and Manage Roles',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('activityrole')
		.setNameLocalizations({
			'de': 'aktivitätsrolle',
			'en-GB': 'activityrole',
			'en-US': 'activityrole',
		})
		.setDescription('Assigns roles depending on how active your users are')
		.setDescriptionLocalizations({
			'de': 'Weist Rollen je nach Aktivität deiner Benutzer zu',
			'en-GB': 'Assigns roles depending on how active your users are',
			'en-US': 'Assigns roles depending on how active your users are',
		})
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.setDMPermission(false)
		.addSubcommand(subcommand =>
			subcommand.setName('add')
				.setNameLocalizations({
					'de': 'hinzufügen',
					'en-GB': 'add',
					'en-US': 'add',
				})
				.setDescription('Lets you add a new role which will be assigned based on useractivity')
				.setDescriptionLocalizations({
					'de': 'Lässt dich eine neue Rolle hinzufügen, die je nach Aktivität des Benutzers zugewiesen wird',
					'en-GB': 'Lets you add a new role which will be assigned based on useractivity',
					'en-US': 'Lets you add a new role which will be assigned based on useractivity',
				})
				.addRoleOption(option =>
					option.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role that should be an activityrole')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die als Aktivitätsrolle zugewiesen werden soll',
							'en-GB': 'The role that should be an activityrole',
							'en-US': 'The role that should be an activityrole',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option.setName('rank')
						.setNameLocalizations({
							'de': 'rang',
							'en-GB': 'rank',
							'en-US': 'rank',
						})
						.setDescription('The required rank for getting the role')
						.setDescriptionLocalizations({
							'de': 'Der erforderliche Rang für die Rolle',
							'en-GB': 'The required rank for getting the role',
							'en-US': 'The required rank for getting the role',
						})
						.setRequired(false)
						.setMinValue(1)
				)
				.addIntegerOption(option =>
					option.setName('percentage')
						.setNameLocalizations({
							'de': 'prozent',
							'en-GB': 'percentage',
							'en-US': 'percentage',
						})
						.setDescription('The required topx% rank for getting the role')
						.setDescriptionLocalizations({
							'de': 'Der erforderliche topx% Rang für die Rolle',
							'en-GB': 'The required topx% rank for getting the role',
							'en-US': 'The required topx% rank for getting the role',
						})
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(99)
				)
				.addIntegerOption(option =>
					option.setName('points')
						.setNameLocalizations({
							'de': 'punkte',
							'en-GB': 'points',
							'en-US': 'points',
						})
						.setDescription('The required points for getting the role')
						.setDescriptionLocalizations({
							'de': 'Die erforderlichen Punkte für die Rolle',
							'en-GB': 'The required points for getting the role',
							'en-US': 'The required points for getting the role',
						})
						.setRequired(false)
						.setMinValue(1)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('remove')
				.setNameLocalizations({
					'de': 'entfernen',
					'en-GB': 'remove',
					'en-US': 'remove',
				})
				.setDescription('Remove an existing activityrole')
				.setDescriptionLocalizations({
					'de': 'Entfernt eine bestehende Aktivitätsrolle',
					'en-GB': 'Remove an existing activityrole',
					'en-US': 'Remove an existing activityrole',
				})
				.addRoleOption(option =>
					option.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role that should no longer be an activityrole')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die nicht mehr als Aktivitätsrolle zugewiesen werden soll',
							'en-GB': 'The role that should no longer be an activityrole',
							'en-US': 'The role that should no longer be an activityrole',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Show which activityroles are set up')
				.setDescriptionLocalizations({
					'de': 'Zeigt welche Aktivitätsrollen existieren sind',
					'en-GB': 'Show which activityroles are set up',
					'en-US': 'Show which activityroles are set up',
				})
		),
	async execute(interaction) {
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
			let rank = interaction.options.getInteger('rank');
			let percentage = interaction.options.getInteger('percentage');
			let points = interaction.options.getInteger('points');

			const activityRole = await DBActivityRoles.count({
				attributes: ['roleId'],
				where: {
					guildId: interaction.guildId,
					roleId: role.id
				},
			});

			if (activityRole) {
				return await interaction.editReply(`${role.name} is already an activityrole.`);
			}

			if (!rank && !percentage && !points) {
				return await interaction.editReply('Please declare conditions using the at least one of the optional arguments.');
			}

			await DBActivityRoles.create({ guildId: interaction.guildId, roleId: role.id, percentageCutoff: percentage, pointsCutoff: points, rankCutoff: rank });

			const existingTask = await DBProcessQueue.count({ where: { guildId: interaction.guildId, task: 'updateActivityRoles', priority: 5 } });
			if (existingTask === 0) {
				await DBProcessQueue.create({ guildId: interaction.guildId, task: 'updateActivityRoles', priority: 5 });
			}

			return await interaction.editReply(`${role.name} has been added as an activityrole. The roles will get updated periodically and will not happen right after a user reached a new milestone.`);
		} else if (interaction.options.getSubcommand() === 'remove') {
			const rowCount = await DBActivityRoles.destroy({ where: { guildId: interaction.guildId, roleId: role.id } });

			//Send feedback message accordingly
			if (rowCount > 0) {
				interaction.guild.members.cache.forEach(member => {
					if (member.roles.cache.find(r => r.id == role.id)) {
						member.roles.remove(role.id);
					}
				});
				return await interaction.editReply(`${role.name} has been removed from activityroles.`);
			} else {
				return await interaction.editReply(`${role.name} was no activityrole.`);
			}
		} else if (interaction.options.getSubcommand() === 'list') {
			const activityRolesList = await DBActivityRoles.findAll({
				attributes: ['roleId', 'rankCutoff', 'percentageCutoff', 'pointsCutoff'],
				where: {
					guildId: interaction.guildId
				}
			});

			let activityRolesString = '';

			//iterate for every activityrole in the array
			for (let i = 0; i < activityRolesList.length; i++) {
				//get role object by role Id
				let activityRole = interaction.guild.roles.cache.get(activityRolesList[i].roleId);

				let conditions = '';

				if (activityRolesList[i].rankCutoff) {
					conditions = `Rank top ${activityRolesList[i].rankCutoff}`;
				}

				if (activityRolesList[i].percentageCutoff) {
					if (conditions !== '') {
						conditions = `${conditions} & `;
					}

					conditions = `${conditions}Rank top ${activityRolesList[i].percentageCutoff}%`;
				}

				if (activityRolesList[i].pointsCutoff) {
					if (conditions !== '') {
						conditions = `${conditions} & `;
					}

					conditions = `${conditions}minimum ${activityRolesList[i].pointsCutoff} points`;
				}

				//Check if deleted role
				if (activityRole) {
					activityRolesString = `${activityRolesString}\n${activityRole.name} -> ${conditions}`;
				} else {
					DBActivityRoles.destroy({ where: { guildId: interaction.guildId, roleId: activityRolesList[i].roleId } });
					activityRolesList.shift();
				}
			}

			if (activityRolesString === '') {
				activityRolesString = 'No activityroles found.';
			}

			//Output activityrole list
			return await interaction.editReply(`List of activityroles: ${activityRolesString}`);
		}
	},
};

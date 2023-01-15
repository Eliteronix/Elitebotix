const { DBActivityRoles, DBProcessQueue } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'activityrole',
	aliases: ['activityroles'],
	description: 'Assigns roles depending on how active your users are; Recommended for use in a private channel to not mention every user with that role',
	usage: '<add/remove/list> <@role> <topx/topx%/xpoints> [topx/topx%/xpoints] [topx/topx%/xpoints]',
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
			let rank = interaction.options.getInteger('rank');
			let percentage = interaction.options.getInteger('percentage');
			let points = interaction.options.getInteger('points');

			logDatabaseQueries(4, 'commands/activityrole.js DBActivityRoles add');
			const activityRole = await DBActivityRoles.findOne({
				where: {
					guildId: interaction.guildId,
					roleId: role.id
				},
			});

			if (activityRole) {
				return interaction.editReply(`${role.name} is already an activityrole.`);
			}

			if (!rank && !percentage && !points) {
				return interaction.editReply('Please declare conditions using the at least one of the optional arguments.');
			}

			if (points & points < 1) {
				return interaction.editReply(`\`${points}\` is below the minimum of 1 point.`);
			}

			if (percentage & percentage < 1) {
				return interaction.editReply(`\`${percentage}\` is below the minimum of top 1%.`);
			}

			if (percentage & percentage > 99) {
				return interaction.editReply(`\`${percentage}\` is above the maximum of top 99%.`);
			}

			if (rank & rank < 1) {
				return interaction.editReply(`\`${rank}\` is below the minimum of rank #1.`);
			}

			await DBActivityRoles.create({ guildId: interaction.guildId, roleId: role.id, percentageCutoff: percentage, pointsCutoff: points, rankCutoff: rank });

			logDatabaseQueries(4, 'commands/activityrole.js DBProcessQueue add');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: interaction.guildId, task: 'updateActivityRoles', priority: 5 } });
			if (!existingTask) {
				await DBProcessQueue.create({ guildId: interaction.guildId, task: 'updateActivityRoles', priority: 5 });
			}

			return interaction.editReply(`${role.name} has been added as an activityrole. The roles will get updated periodically and will not happen right after a user reached a new milestone.`);
		} else if (interaction.options._subcommand === 'remove') {
			logDatabaseQueries(4, 'commands/activityrole.js DBActivityRoles remove');
			const rowCount = await DBActivityRoles.destroy({ where: { guildId: interaction.guildId, roleId: role.id } });

			//Send feedback message accordingly
			if (rowCount > 0) {
				interaction.guild.members.cache.forEach(member => {
					if (member.roles.cache.find(r => r.id == role.id)) {
						member.roles.remove(role.id);
					}
				});
				return interaction.editReply(`${role.name} has been removed from activityroles.`);
			} else {
				return interaction.editReply(`${role.name} was no activityrole.`);
			}
		} else if (interaction.options._subcommand === 'list') {
			logDatabaseQueries(4, 'commands/activityrole.js DBActivityRoles list');
			const activityRolesList = await DBActivityRoles.findAll({
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
			return interaction.editReply(`List of activityroles: ${activityRolesString}`);
		}
	},
};

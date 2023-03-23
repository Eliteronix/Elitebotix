const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (oldChannel, newChannel) {
	if (newChannel.type === Discord.ChannelType.DM) {
		return;
	}

	if (isWrongSystem(newChannel.guild.id, newChannel.type === Discord.ChannelType.DM)) {
		return;
	}

	logDatabaseQueries(2, 'channelUpdate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: newChannel.guild.id,
			loggingChannelUpdate: true
		},
	});

	if (guild && guild.loggingChannel) {
		let loggingChannel;
		try {
			loggingChannel = await newChannel.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newChannel.client.users.fetch(newChannel.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${newChannel.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`<#${newChannel.id}> has been updated!`)
			.addFields(
				{ name: 'Channel Updated', value: `<#${newChannel.id}>` },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: channelupdate' });

		if (oldChannel.name !== newChannel.name) {
			changeEmbed.addFields([{ name: 'Name', value: `\`${oldChannel.name}\` -> \`${newChannel.name}\`` }]);
		}

		if (oldChannel.bitrate !== newChannel.bitrate) {
			changeEmbed.addFields([{ name: 'Bitrate', value: `\`${oldChannel.bitrate}\` -> \`${newChannel.bitrate}\`` }]);
		}

		if (oldChannel.userLimit !== newChannel.userLimit) {
			changeEmbed.addFields([{ name: 'User Limit', value: `\`${oldChannel.userLimit}\` -> \`${newChannel.userLimit}\`` }]);
		}

		if (oldChannel.topic !== newChannel.topic) {
			changeEmbed.addFields([{ name: 'Topic', value: `\`${oldChannel.topic}\` -> \`${newChannel.topic}\`` }]);
		}

		if (oldChannel.nsfw !== newChannel.nsfw) {
			changeEmbed.addFields([{ name: 'NSFW', value: `\`${oldChannel.nsfw}\` -> \`${newChannel.nsfw}\`` }]);
		}

		if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
			changeEmbed.addFields([{ name: 'Rate Limit Per User (Slowmode)', value: `\`${oldChannel.rateLimitPerUser}\` -> \`${newChannel.rateLimitPerUser}\`` }]);
		}

		const oldPermissionGroups = oldChannel.permissionOverwrites.array();
		const newPermissionGroups = newChannel.permissionOverwrites.array();

		for (let i = 0; i < oldPermissionGroups.length; i++) {
			let groupIsThereAnymore = false;
			for (let j = 0; j < newPermissionGroups.length; j++) {
				if (oldPermissionGroups[i].id === newPermissionGroups[j].id) {
					let oldPermissionsAllowReadable = 'None';
					if (oldPermissionGroups[i].allow.toArray().length > 0) {
						oldPermissionsAllowReadable = oldPermissionGroups[i].allow.toArray().join(', ');
					}

					let oldPermissionsDenyReadable = 'None';
					if (oldPermissionGroups[i].deny.toArray().length > 0) {
						oldPermissionsDenyReadable = oldPermissionGroups[i].deny.toArray().join(', ');
					}

					let newPermissionsAllowReadable = 'None';
					if (newPermissionGroups[j].allow.toArray().length > 0) {
						newPermissionsAllowReadable = newPermissionGroups[j].allow.toArray().join(', ');
					}

					let newPermissionsDenyReadable = 'None';
					if (newPermissionGroups[j].deny.toArray().length > 0) {
						newPermissionsDenyReadable = newPermissionGroups[j].deny.toArray().join(', ');
					}

					if (oldPermissionsAllowReadable !== newPermissionsAllowReadable || oldPermissionsDenyReadable !== newPermissionsDenyReadable) {
						if (oldPermissionGroups[i].type === 'role') {
							changeEmbed.addFields([{ name: 'Permissions updated for', value: `<@&${oldPermissionGroups[i].id}>` }]);
						} else {
							changeEmbed.addFields([{ name: 'Permissions updated for', value: `<@${oldPermissionGroups[i].id}>` }]);
						}
					}

					if (oldPermissionsAllowReadable !== newPermissionsAllowReadable) {
						changeEmbed.addFields([{ name: 'Allow', value: `Old Permissions:\n\`${oldPermissionsAllowReadable}\`\n\nNew Permissions:\n\`${newPermissionsAllowReadable}\`` }]);
					}

					if (oldPermissionsDenyReadable !== newPermissionsDenyReadable) {
						changeEmbed.addFields([{ name: 'Deny', value: `Old Permissions:\n\`${oldPermissionsDenyReadable}\`\n\nNew Permissions:\n\`${newPermissionsDenyReadable}\`` }]);
					}

					newPermissionGroups.splice(j, 1);
					groupIsThereAnymore = true;
					break;
				}
			}

			if (!groupIsThereAnymore) {
				if (oldPermissionGroups[i].type === 'role') {
					changeEmbed.addFields([{ name: 'Permissions removed for', value: `<@&${oldPermissionGroups[i].id}>` }]);
				} else {
					changeEmbed.addFields([{ name: 'Permissions removed for', value: `<@${oldPermissionGroups[i].id}>` }]);
				}
			}
		}

		newPermissionGroups.forEach(permissionGroup => {
			if (permissionGroup.type === 'role') {
				changeEmbed.addFields([{ name: 'Added permissions for', value: `<@&${permissionGroup.id}>` }]);
			} else {
				changeEmbed.addFields([{ name: 'Added permissions for', value: `<@${permissionGroup.id}>` }]);
			}

			let permissionsAllowReadable = 'None';
			if (permissionGroup.allow.toArray().length > 0) {
				permissionsAllowReadable = permissionGroup.allow.toArray().join(', ');
			}
			changeEmbed.addFields([{ name: 'Allow', value: permissionsAllowReadable }]);

			let permissionsDenyReadable = 'None';
			if (permissionGroup.deny.toArray().length > 0) {
				permissionsDenyReadable = permissionGroup.deny.toArray().join(', ');
			}
			changeEmbed.addFields([{ name: 'Deny', value: permissionsDenyReadable }]);
		});

		loggingChannel.send({ embeds: [changeEmbed] });
	}
};
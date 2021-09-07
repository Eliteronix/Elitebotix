const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem } = require('./utils');

module.exports = async function (oldChannel, newChannel) {
	if (newChannel.type === 'DM') {
		return;
	}

	if (isWrongSystem(newChannel.guild.id, newChannel.type === 'DM')) {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newChannel.guild.id, loggingChannelUpdate: true },
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
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`<#${newChannel.id}> has been updated!`)
			.addFields(
				{ name: 'Channel Updated', value: `<#${newChannel.id}>` },
			)
			.setTimestamp()
			.setFooter('Eventname: channelupdate');

		if (oldChannel.name !== newChannel.name) {
			changeEmbed.addField('Name', `\`${oldChannel.name}\` -> \`${newChannel.name}\``);
		}

		if (oldChannel.bitrate !== newChannel.bitrate) {
			changeEmbed.addField('Bitrate', `\`${oldChannel.bitrate}\` -> \`${newChannel.bitrate}\``);
		}

		if (oldChannel.userLimit !== newChannel.userLimit) {
			changeEmbed.addField('User Limit', `\`${oldChannel.userLimit}\` -> \`${newChannel.userLimit}\``);
		}

		if (oldChannel.topic !== newChannel.topic) {
			changeEmbed.addField('Topic', `\`${oldChannel.topic}\` -> \`${newChannel.topic}\``);
		}

		if (oldChannel.nsfw !== newChannel.nsfw) {
			changeEmbed.addField('NSFW', `\`${oldChannel.nsfw}\` -> \`${newChannel.nsfw}\``);
		}

		if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
			changeEmbed.addField('Rate Limit Per User (Slowmode)', `\`${oldChannel.rateLimitPerUser}\` -> \`${newChannel.rateLimitPerUser}\``);
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
							changeEmbed.addField('Permissions updated for', `<@&${oldPermissionGroups[i].id}>`);
						} else {
							changeEmbed.addField('Permissions updated for', `<@${oldPermissionGroups[i].id}>`);
						}
					}

					if (oldPermissionsAllowReadable !== newPermissionsAllowReadable) {
						changeEmbed.addField('Allow', `Old Permissions:\n\`${oldPermissionsAllowReadable}\`\n\nNew Permissions:\n\`${newPermissionsAllowReadable}\``);
					}

					if (oldPermissionsDenyReadable !== newPermissionsDenyReadable) {
						changeEmbed.addField('Deny', `Old Permissions:\n\`${oldPermissionsDenyReadable}\`\n\nNew Permissions:\n\`${newPermissionsDenyReadable}\``);
					}

					newPermissionGroups.splice(j, 1);
					groupIsThereAnymore = true;
					break;
				}
			}

			if (!groupIsThereAnymore) {
				if (oldPermissionGroups[i].type === 'role') {
					changeEmbed.addField('Permissions removed for', `<@&${oldPermissionGroups[i].id}>`);
				} else {
					changeEmbed.addField('Permissions removed for', `<@${oldPermissionGroups[i].id}>`);
				}
			}
		}

		newPermissionGroups.forEach(permissionGroup => {
			if (permissionGroup.type === 'role') {
				changeEmbed.addField('Added permissions for', `<@&${permissionGroup.id}>`);
			} else {
				changeEmbed.addField('Added permissions for', `<@${permissionGroup.id}>`);
			}

			let permissionsAllowReadable = 'None';
			if (permissionGroup.allow.toArray().length > 0) {
				permissionsAllowReadable = permissionGroup.allow.toArray().join(', ');
			}
			changeEmbed.addField('Allow', permissionsAllowReadable);

			let permissionsDenyReadable = 'None';
			if (permissionGroup.deny.toArray().length > 0) {
				permissionsDenyReadable = permissionGroup.deny.toArray().join(', ');
			}
			changeEmbed.addField('Deny', permissionsDenyReadable);
		});

		loggingChannel.send({ embeds: [changeEmbed] });
	}
};
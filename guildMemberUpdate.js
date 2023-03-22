const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (oldMember, newMember) {
	if (isWrongSystem(newMember.guild.id, false)) {
		return;
	}

	if (oldMember.nickname !== newMember.nickname) {
		//TODO: Attributes
		logDatabaseQueries(2, 'guildMemberUpdate.js DBGuilds Nickname');
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingNicknames) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.message.client.users.fetch(newMember.guild.ownerId);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let oldUserDisplayName = oldMember.user.username;

			if (oldMember.nickname) {
				oldUserDisplayName = oldMember.nickname;
			}

			let newUserDisplayName = newMember.user.username;

			if (newMember.nickname) {
				newUserDisplayName = newMember.nickname;
			}

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${newMember.user.username}#${newMember.user.discriminator}`, iconURL: newMember.user.displayAvatarURL() })
				.setDescription(`<@${newMember.user.id}> has updated their profile!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.addFields(
					{ name: 'Nickname', value: `\`${oldUserDisplayName}\` -> \`${newUserDisplayName}\`` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: nicknames' });

			channel.send({ embeds: [changeEmbed] });
		}
	}

	let sameRoles = true;
	for (let i = 0; i < oldMember._roles.length && sameRoles; i++) {
		if (!newMember._roles[i] || newMember._roles[i] !== oldMember._roles[i]) {
			sameRoles = false;
		}
	}
	if (!sameRoles) {
		//TODO: Attributes
		logDatabaseQueries(2, 'guildMemberUpdate.js DBGuilds Roles');
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingUserroles) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.message.client.users.fetch(newMember.guild.ownerId);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let removedRoles = '';

			oldMember._roles.forEach(role => {
				if (!newMember._roles.includes(role)) {
					if (removedRoles) {
						removedRoles = `${removedRoles}, <@&${role}>`;
					} else {
						removedRoles = `<@&${role}>`;
					}
				}
			});

			let addedRoles = '';

			newMember._roles.forEach(role => {
				if (!oldMember._roles.includes(role)) {
					if (addedRoles) {
						addedRoles = `${addedRoles}, <@&${role}>`;
					} else {
						addedRoles = `<@&${role}>`;
					}
				}
			});

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${newMember.user.username}#${newMember.user.discriminator}`, iconURL: oldMember.user.displayAvatarURL() })
				.setDescription(`<@${newMember.user.id}> roles have changed!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.setTimestamp()
				.setFooter({ text: 'Eventname: userroles' });

			if (removedRoles) {
				changeEmbed.addFields(
					{ name: 'Removed Roles', value: removedRoles },
				);
			}

			if (addedRoles) {
				changeEmbed.addFields(
					{ name: 'Added Roles', value: addedRoles },
				);
			}

			channel.send({ embeds: [changeEmbed] });
		}
	}
};

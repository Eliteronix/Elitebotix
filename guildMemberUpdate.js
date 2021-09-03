const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newMember.guild.id != '800641468321759242' && newMember.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newMember.guild.id != '800641367083974667' && newMember.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newMember.guild.id === '800641468321759242' || newMember.guild.id === '800641735658176553' || newMember.guild.id === '800641367083974667' || newMember.guild.id === '800641819086946344') {
			return;
		}
	}

	if (oldMember.nickname !== newMember.nickname) {
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
				console.log(error);
			}

			let oldUserDisplayName = oldMember.user.username;

			if (oldMember.nickname) {
				oldUserDisplayName = oldMember.nickname;
			}

			let newUserDisplayName = newMember.user.username;

			if (newMember.nickname) {
				newUserDisplayName = newMember.nickname;
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${newMember.user.username}#${newMember.user.discriminator}`, newMember.user.displayAvatarURL())
				.setDescription(`<@${newMember.user.id}> has updated their profile!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.addFields(
					{ name: 'Nickname', value: `\`${oldUserDisplayName}\` -> \`${newUserDisplayName}\`` },
				)
				.setTimestamp()
				.setFooter('Eventname: nicknames');

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
				console.log(error);
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

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${newMember.user.username}#${newMember.user.discriminator}`, oldMember.user.displayAvatarURL())
				.setDescription(`<@${newMember.user.id}> roles have changed!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.setTimestamp()
				.setFooter('Eventname: userroles');

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

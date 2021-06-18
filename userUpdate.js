const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {
	console.log('userUpdate');
	console.log(oldMember, newMember);

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

	if (oldMember.user.username !== newMember.user.username) {
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingUsernames) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.message.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${newMember.user.username}#${newMember.user.discriminator}`, newMember.user.displayAvatarURL())
				.setDescription(`<@${newMember.user.id}> has updated their profile!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.addFields(
					{ name: 'Username', value: `\`${oldMember.user.username}\` -> \`${newMember.user.username}\`` },
				)
				.setTimestamp()
				.setFooter('Eventname: usernames');

			channel.send(changeEmbed);
		}
	}

	if (oldMember.user.discriminator !== newMember.user.discriminator) {
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingUsernames) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.message.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${newMember.user.discriminator}#${newMember.user.discriminator}`, newMember.user.displayAvatarURL())
				.setDescription(`<@${newMember.user.id}> has updated their profile!`)
				.setThumbnail(newMember.user.displayAvatarURL())
				.addFields(
					{ name: 'Discriminator', value: `\`${oldMember.user.discriminator}\` -> \`${newMember.user.discriminator}\`` },
				)
				.setTimestamp()
				.setFooter('Eventname: userdiscriminator');

			channel.send(changeEmbed);
		}
	}
};

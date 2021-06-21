const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (invite) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (invite.guild.id != '800641468321759242' && invite.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (invite.guild.id != '800641367083974667' && invite.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (invite.guild.id === '800641468321759242' || invite.guild.id === '800641735658176553' || invite.guild.id === '800641367083974667' || invite.guild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: invite.guild.id, loggingInviteCreate: true },
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await invite.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await invite.client.users.fetch(invite.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${invite.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor(`${invite.inviter.username}#${invite.inviter.discriminator}`, invite.inviter.displayAvatarURL())
			.setDescription('Invite has been created')
			.setThumbnail(invite.inviter.displayAvatarURL())
			.addFields(
				{ name: 'Creator', value: `<@${invite.inviter.id}>` },
				{ name: 'Code', value: invite.code },
				{ name: 'Temporary', value: invite.temporary },
				{ name: 'Max Uses', value: invite.maxUses },
			)
			.setTimestamp()
			.setFooter('Eventname: invitecreate');

		channel.send(changeEmbed);
	}
};

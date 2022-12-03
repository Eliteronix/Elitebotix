const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (invite) {
	if (isWrongSystem(invite.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'inviteCreate.js DBGuilds');
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
				const owner = await invite.client.users.fetch(invite.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${invite.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor({ name: `${invite.inviter.username}#${invite.inviter.discriminator}`, iconURL: invite.inviter.displayAvatarURL() })
			.setDescription('Invite has been created')
			.setThumbnail(invite.inviter.displayAvatarURL())
			.addFields(
				{ name: 'Creator', value: `<@${invite.inviter.id}>` },
				{ name: 'Code', value: invite.code },
				{ name: 'Temporary', value: invite.temporary },
				{ name: 'Max Uses', value: invite.maxUses },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: invitecreate' });

		channel.send({ embeds: [changeEmbed] });
	}
};

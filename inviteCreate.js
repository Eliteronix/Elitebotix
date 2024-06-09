const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { logDatabaseQueries } = require('./utils');

module.exports = async function (invite) {
	logDatabaseQueries(2, 'inviteCreate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: invite.guild.id,
			loggingInviteCreate: true
		},
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
				return await owner.send(`It seems like the logging channel on the guild \`${invite.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error('inviteCreate.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
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

		await channel.send({ embeds: [changeEmbed] });
	}
};

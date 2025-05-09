const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (invite) {
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: invite.guild.id,
			loggingInviteDelete: true
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
			console.error('inviteDelete.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription('Invite has been deleted')
			.addFields(
				{ name: 'Code', value: invite.code },
				{ name: 'Temporary', value: invite.temporary },
				{ name: 'Max Uses', value: invite.maxUses },
				{ name: 'Uses', value: invite.uses },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: invitedelete' });

		await channel.send({ embeds: [changeEmbed] });
	}
};

const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries, wrongCluster } = require('./utils');

module.exports = async function (invite) {
	if (wrongCluster(invite.guild.id)) {
		return;
	}

	if (isWrongSystem(invite.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'inviteDelete.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: invite.guild.id, loggingInviteDelete: true },
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
			.setDescription('Invite has been deleted')
			.addFields(
				{ name: 'Code', value: invite.code },
				{ name: 'Temporary', value: invite.temporary },
				{ name: 'Max Uses', value: invite.maxUses },
				{ name: 'Uses', value: invite.uses },
			)
			.setTimestamp()
			.setFooter('Eventname: invitedelete');

		channel.send({ embeds: [changeEmbed] });
	}
};

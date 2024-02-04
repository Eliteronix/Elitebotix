const Discord = require('discord.js');
const { DBGuilds, DBBirthdayGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (member) {
	if (isWrongSystem(member.guild.id, false)) {
		return;
	}

	if (member.id === member.client.user.id) {
		return;
	}

	logDatabaseQueries(2, 'guildMemberRemove.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'sendGoodbyeMessage', 'goodbyeMessageChannel', 'goodbyeMessageText', 'loggingChannel', 'loggingMemberRemove'],
		where: {
			guildId: member.guild.id
		},
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a goodbye-message should be sent
		if (guild.sendGoodbyeMessage) {
			//get the channel id for the goodbye message
			const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
			//get the channel object from the id
			const guildGoodbyeMessageChannel = await member.client.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
			//get the goodbye message text
			const guildGoodbyeMessageText = guild.goodbyeMessageText.replace('@member', member.user.username + '#' + member.user.discriminator);
			try {
				//send the goodbye message text into the channel
				guildGoodbyeMessageChannel.send(guildGoodbyeMessageText);
			} catch (e) {
				if (e.message === 'Missing Access') {
					const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
					return owner.send(`I could not send a goodbye message for a new user into the channel \`${guildGoodbyeMessageChannel.name}\` on \`${member.guild.name}\` due to missing permissions.`);
				} else {
					return console.error('guildMemberRemove.js | goodbye message' + e);
				}
			}
		}

		if (guild.loggingChannel && guild.loggingMemberRemove) {
			let channel;
			try {
				channel = await member.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await member.message.client.users.fetch(member.guild.ownerId);
					return owner.send(`It seems like the logging channel on the guild \`${member.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error('guildMemberRemove.js | logging' + error);
			}

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL() })
				.setDescription(`<@${member.user.id}> left the server!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Left the server', value: `<@${member.user.id}>` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: userleaving' });

			channel.send({ embeds: [changeEmbed] });
		}
		logDatabaseQueries(2, 'guildMemberAdd.js DBBirthdayGuilds destroy');
		// destroy the guild dataset in the db
		await DBBirthdayGuilds.destroy({
			where: {
				userId: member.user.username,
				guildId: member.guild.id
			}
		});
	}
};

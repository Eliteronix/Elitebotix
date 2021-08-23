const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (member) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (member.guild.id != '800641468321759242' && member.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (member.guild.id != '800641367083974667' && member.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (member.guild.id === '800641468321759242' || member.guild.id === '800641735658176553' || member.guild.id === '800641367083974667' || member.guild.id === '800641819086946344') {
			return;
		}
	}

	if (member.id === 784836063058329680) {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: member.guild.id },
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
					const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
					return owner.send(`I could not send a welcome message for a new user into the channel \`${guildGoodbyeMessageChannel.name}\` on \`${member.guild.name}\` due to missing permissions.`);
				} else {
					return console.log(e);
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
					const owner = await member.message.client.users.fetch(member.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${member.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> left the server!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Left the server', value: `<@${member.user.id}>` },
				)
				.setTimestamp()
				.setFooter('Eventname: userleaving');

			channel.send({ embeds: [changeEmbed] });
		}
	}
};

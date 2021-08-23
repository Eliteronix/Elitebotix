const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldMsg, newMsg) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newMsg.channel.type === 'dm') {
			return;
		}
		if (newMsg.channel.type !== 'dm' && newMsg.guild.id != '800641468321759242' && newMsg.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newMsg.channel.type === 'dm') {
			return;
		}
		if (newMsg.channel.type !== 'dm' && newMsg.guild.id != '800641367083974667' && newMsg.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newMsg.channel.type !== 'dm') {
			if (newMsg.guild.id === '800641468321759242' || newMsg.guild.id === '800641735658176553' || newMsg.guild.id === '800641367083974667' || newMsg.guild.id === '800641819086946344') {
				return;
			}
		}
	}

	if (newMsg.channel.type === 'dm') {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newMsg.guild.id, loggingMessageUpdate: true },
	});

	if (guild && guild.loggingChannel && newMsg.author) {
		let channel;
		try {
			channel = await newMsg.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newMsg.client.users.fetch(newMsg.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${newMsg.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor(`${newMsg.author.username}#${newMsg.author.discriminator}`, newMsg.author.displayAvatarURL())
			.setDescription('A message has been updated')
			.setThumbnail(newMsg.author.displayAvatarURL())
			.addFields(
				{ name: 'Channel', value: `<#${newMsg.channel.id}>` },
				{ name: 'Author', value: `<@${newMsg.author.id}>` },
			)
			.setTimestamp()
			.setFooter('Eventname: messageupdate');

		if (oldMsg.content !== newMsg.content) {
			changeEmbed.addField('Content', `\`${oldMsg.content}\` -> \`${newMsg.content}\``);

			channel.send({ embeds: [changeEmbed] });
		}
	}
};

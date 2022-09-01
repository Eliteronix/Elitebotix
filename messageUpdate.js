const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries, wrongCluster } = require('./utils');

module.exports = async function (oldMsg, newMsg) {
	if (wrongCluster(newMsg.id)) {
		return;
	}

	if (isWrongSystem(newMsg.guildId, newMsg.channel.type === 'DM')) {
		return;
	}

	if (newMsg.channel.type === 'DM') {
		return;
	}

	logDatabaseQueries(2, 'messageUpdate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newMsg.guildId, loggingMessageUpdate: true },
	});

	if (guild && guild.loggingChannel && newMsg.author) {
		let channel;
		try {
			channel = await newMsg.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newMsg.client.users.fetch(newMsg.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${newMsg.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor({ name: `${newMsg.author.username}#${newMsg.author.discriminator}`, iconURL: newMsg.author.displayAvatarURL() })
			.setDescription('A message has been updated')
			.setThumbnail(newMsg.author.displayAvatarURL())
			.addFields(
				{ name: 'Channel', value: `<#${newMsg.channel.id}>` },
				{ name: 'Author', value: `<@${newMsg.author.id}>` },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: messageupdate' });

		if (oldMsg.content !== newMsg.content) {
			changeEmbed.addField('Content', `\`${oldMsg.content}\` -> \`${newMsg.content}\``);

			channel.send({ embeds: [changeEmbed] });
		}
	}
};

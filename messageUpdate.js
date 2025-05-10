const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldMsg, newMsg) {
	if (newMsg.channel.type === Discord.ChannelType.DM) {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: newMsg.guildId,
			loggingMessageUpdate: true
		},
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
				return await owner.send(`It seems like the logging channel on the guild \`${newMsg.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error('messageUpdate.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
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
			changeEmbed.addFields([{ name: 'Content', value: `\`${oldMsg.content}\` -> \`${newMsg.content}\`` }]);

			await channel.send({ embeds: [changeEmbed] });
		}
	}
};

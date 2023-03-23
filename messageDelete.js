const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (msg) {
	if (isWrongSystem(msg.guildId, msg.channel.type === Discord.ChannelType.DM)) {
		return;
	}

	if (msg.channel.type === Discord.ChannelType.DM) {
		return;
	}

	logDatabaseQueries(2, 'messageDelete.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: msg.guildId,
			loggingMessageDelete: true
		},
	});

	if (guild && guild.loggingChannel && msg.author) {
		let channel;
		try {
			channel = await msg.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await msg.client.users.fetch(msg.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${msg.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		let content = 'None';
		if (msg.content) {
			content = msg.content;
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setAuthor({ name: `${msg.author.username}#${msg.author.discriminator}`, iconURL: msg.author.displayAvatarURL() })
			.setDescription('A message has been deleted')
			.setThumbnail(msg.author.displayAvatarURL())
			.addFields(
				{ name: 'Channel', value: `<#${msg.channel.id}>` },
				{ name: 'Author', value: `<@${msg.author.id}>` },
				{ name: 'Content', value: content },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: messagedelete' });

		if (msg.attachments.array().length > 0) {
			msg.attachments.forEach(attachment => {
				changeEmbed.addFields([{ name: 'Attachment', value: attachment.name }]);
			});
		}

		channel.send({ embeds: [changeEmbed] });
	}
};

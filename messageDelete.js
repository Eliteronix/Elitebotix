const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (msg) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (msg.channel.type === 'dm') {
			return;
		}
		if (msg.channel.type !== 'dm' && msg.guild.id != '800641468321759242' && msg.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (msg.channel.type === 'dm') {
			return;
		}
		if (msg.channel.type !== 'dm' && msg.guild.id != '800641367083974667' && msg.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (msg.channel.type !== 'dm') {
			if (msg.guild.id === '800641468321759242' || msg.guild.id === '800641735658176553' || msg.guild.id === '800641367083974667' || msg.guild.id === '800641819086946344') {
				return;
			}
		}
	}

	if (msg.channel.type === 'dm') {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: msg.guild.id, loggingMessageDelete: true },
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
			console.log(error);
		}

		let content = 'None';
		if (msg.content) {
			content = msg.content;
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor(`${msg.author.username}#${msg.author.discriminator}`, msg.author.displayAvatarURL())
			.setDescription('A message has been deleted')
			.setThumbnail(msg.author.displayAvatarURL())
			.addFields(
				{ name: 'Channel', value: `<#${msg.channel.id}>` },
				{ name: 'Author', value: `<@${msg.author.id}>` },
				{ name: 'Content', value: content },
			)
			.setTimestamp()
			.setFooter('Eventname: messagedelete');

		if (msg.attachments.array().length > 0) {
			msg.attachments.forEach(attachment => {
				changeEmbed.addField('Attachment', attachment.name);
			});
		}

		channel.send({ embeds: [changeEmbed] });
	}
};

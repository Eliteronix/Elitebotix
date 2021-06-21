const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldEmoji, newEmoji) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newEmoji.guild.id != '800641468321759242' && newEmoji.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newEmoji.guild.id != '800641367083974667' && newEmoji.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newEmoji.guild.id === '800641468321759242' || newEmoji.guild.id === '800641735658176553' || newEmoji.guild.id === '800641367083974667' || newEmoji.guild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newEmoji.guild.id, loggingEmojiUpdate: true },
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await newEmoji.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newEmoji.client.users.fetch(newEmoji.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${newEmoji.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`${newEmoji.name} has been updated`)
			.setImage(newEmoji.url)
			.addFields(
				{ name: 'Name', value: `\`${oldEmoji.name}\` -> \`${newEmoji.name}\`` },
			)
			.setTimestamp()
			.setFooter('Eventname: emojiupdate');

		channel.send(changeEmbed);
	}
};

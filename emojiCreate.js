const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (emoji) {
	if (isWrongSystem(emoji.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'emojiCreate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: emoji.guild.id, loggingEmojiCreate: true },
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await emoji.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await emoji.client.users.fetch(emoji.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${emoji.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`${emoji.name} has been created`)
			.setImage(emoji.url)
			.addFields(
				{ name: 'Name', value: emoji.name },
				{ name: 'Animated', value: emoji.animated },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: emojicreate' });

		channel.send({ embeds: [changeEmbed] });
	}
};

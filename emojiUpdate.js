const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldEmoji, newEmoji) {
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: newEmoji.guild.id,
			loggingEmojiUpdate: true
		},
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await newEmoji.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newEmoji.client.users.fetch(newEmoji.guild.ownerId);
				return await owner.send(`It seems like the logging channel on the guild \`${newEmoji.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error('emojiUpdate.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`${newEmoji.name} has been updated`)
			.setImage(newEmoji.url)
			.addFields(
				{ name: 'Name', value: `\`${oldEmoji.name}\` -> \`${newEmoji.name}\`` },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: emojiupdate' });

		await channel.send({ embeds: [changeEmbed] });
	}
};

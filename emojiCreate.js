const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (emoji) {
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: emoji.guild.id,
			loggingEmojiCreate: true
		},
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
				return await owner.send(`It seems like the logging channel on the guild \`${emoji.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error('emojiCreate.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`${emoji.name} has been created`)
			.setImage(emoji.url)
			.addFields(
				{ name: 'Name', value: emoji.name },
				{ name: 'Animated', value: emoji.animated },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: emojicreate' });

		await channel.send({ embeds: [changeEmbed] });
	}
};

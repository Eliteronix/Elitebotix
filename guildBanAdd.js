const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem } = require('./utils');

module.exports = async function (discordGuild, user) {
	if (isWrongSystem(discordGuild.id, false)) {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: discordGuild.id, loggingBanAdd: true },
	});

	//check if a guild was found in the db
	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await discordGuild.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await discordGuild.client.users.fetch(discordGuild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${discordGuild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor(`${user.username}#${user.discriminator}`, user.displayAvatarURL())
			.setDescription(`<@${user.id}> was banned from the server!`)
			.setThumbnail(user.displayAvatarURL())
			.addFields(
				{ name: 'Banned from the server', value: `<@${user.id}>` },
			)
			.setTimestamp()
			.setFooter('Eventname: banadd');

		channel.send({ embeds: [changeEmbed] });
	}
};

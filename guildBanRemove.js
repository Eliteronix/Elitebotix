const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (discordGuild, user) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (discordGuild.id != '800641468321759242' && discordGuild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (discordGuild.id != '800641367083974667' && discordGuild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (discordGuild.id === '800641468321759242' || discordGuild.id === '800641735658176553' || discordGuild.id === '800641367083974667' || discordGuild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: discordGuild.id, loggingBanRemove: true },
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
			.setDescription(`<@${user.id}> was unbanned from the server!`)
			.setThumbnail(user.displayAvatarURL())
			.addFields(
				{ name: 'Unbanned from the server', value: `<@${user.id}>` },
			)
			.setTimestamp()
			.setFooter('Eventname: banremove');

		channel.send({ embeds: [changeEmbed] });
	}
};

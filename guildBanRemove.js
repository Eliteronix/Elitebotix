const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries, wrongCluster } = require('./utils');

module.exports = async function (guildBan) {
	if (wrongCluster(guildBan.guild.id)) {
		return;
	}

	if (isWrongSystem(guildBan.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'guildBanRemove.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: guildBan.guild.id, loggingBanRemove: true },
	});

	//check if a guild was found in the db
	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await guildBan.guild.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await guildBan.guild.client.users.fetch(guildBan.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${guildBan.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor({ name: `${guildBan.user.username}#${guildBan.user.discriminator}`, iconURL: guildBan.user.displayAvatarURL() })
			.setDescription(`<@${guildBan.user.id}> was unbanned from the server!`)
			.setThumbnail(guildBan.user.displayAvatarURL())
			.addFields(
				{ name: 'Unbanned from the server', value: `<@${guildBan.user.id}>` },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: banremove' });

		channel.send({ embeds: [changeEmbed] });
	}
};

const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (channel) {
	if (channel.type === Discord.ChannelType.DM) {
		return;
	}

	if (isWrongSystem(channel.guild.id, channel.type === Discord.ChannelType.DM)) {
		return;
	}

	logDatabaseQueries(2, 'channelCreate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: channel.guild.id, loggingChannelCreate: true },
	});

	if (guild && guild.loggingChannel) {
		let loggingChannel;
		try {
			loggingChannel = await channel.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await channel.client.users.fetch(channel.guild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${channel.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`<#${channel.id}> has been created`)
			.addFields(
				{ name: 'Channel Created', value: `<#${channel.id}>` },
				{ name: 'Type', value: channel.type },
				{ name: 'Name', value: channel.name },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: channelcreate' });

		if (channel.type === Discord.ChannelType.GuildVoice) {
			changeEmbed.addFields([{ name: 'Bitrate', value: channel.bitrate }, { name: 'User Limit', value: channel.userLimit }]);
		} else if (channel.type === Discord.ChannelType.GuildText) {
			if (channel.topic) {
				changeEmbed.addFields([{ name: 'Topic', value: channel.topic }]);
			}
			changeEmbed.addFields([{ name: 'NSFW', value: channel.nsfw }, { name: 'Rate Limit Per User (Slowmode)', value: channel.rateLimitPerUser }]);
		}

		channel.permissionOverwrites.forEach(permissionGroup => {
			if (permissionGroup.type === 'role') {
				changeEmbed.addFields([{ name: 'Permissions for', value: `<@&${permissionGroup.id}>` }]);
			} else {
				changeEmbed.addFields([{ name: 'Permissions for', value: `<@${permissionGroup.id}>` }]);
			}

			let permissionsAllowReadable = 'None';
			if (permissionGroup.allow.toArray().length > 0) {
				permissionsAllowReadable = permissionGroup.allow.toArray().join(', ');
			}
			changeEmbed.addFields([{ name: 'Allow', value: permissionsAllowReadable }]);

			let permissionsDenyReadable = 'None';
			if (permissionGroup.deny.toArray().length > 0) {
				permissionsDenyReadable = permissionGroup.deny.toArray().join(', ');
			}
			changeEmbed.addFields([{ name: 'Deny', value: permissionsDenyReadable }]);
		});

		loggingChannel.send({ embeds: [changeEmbed] });
	}
};
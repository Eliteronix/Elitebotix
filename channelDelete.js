const Discord = require('discord.js');
const { DBGuilds, DBTemporaryVoices } = require('./dbObjects');
const { isWrongSystem, pause, logDatabaseQueries } = require('./utils');

module.exports = async function (channel) {
	if (channel.type === Discord.ChannelType.DM) {
		return;
	}

	if (isWrongSystem(channel.guild.id, channel.type === Discord.ChannelType.DM)) {
		return;
	}

	logDatabaseQueries(2, 'channelDelete.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: channel.guild.id,
			loggingChannelDelete: true
		},
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
			.setDescription(`${channel.name} has been deleted`)
			.addFields(
				{ name: 'Channel Deleted', value: channel.name },
				{ name: 'Type', value: channel.type },
				{ name: 'Name', value: channel.name },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: channeldelete' });

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

	await pause(5000);

	logDatabaseQueries(2, 'channelDelete.js DBTemporaryVoices 1');
	const temporaryVoice = await DBTemporaryVoices.findOne({
		attributes: ['id', 'textChannelId'],
		where: {
			guildId: channel.guild.id,
			channelId: channel.id
		}
	});

	logDatabaseQueries(2, 'channelDelete.js DBTemporaryVoices 2');
	const temporaryText = await DBTemporaryVoices.findOne({
		attributes: ['id', 'channelId'],
		where: {
			guildId: channel.guild.id,
			textChannelId: channel.id
		}
	});

	if (temporaryVoice || temporaryText) {
		if (temporaryVoice) {
			const textChannel = await channel.guild.channels.fetch(temporaryVoice.textChannelId);
			await temporaryVoice.destroy();
			if (textChannel) {
				await textChannel.delete();
			}
		} else if (temporaryText) {
			const voiceChannel = await channel.guild.channels.fetch(temporaryText.channelId);
			await temporaryText.destroy();
			if (voiceChannel) {
				await voiceChannel.delete();
			}
		}
	}
};
const Discord = require('discord.js');
const { DBGuilds, DBTemporaryVoices } = require('./dbObjects');
const { isWrongSystem } = require('./utils');

module.exports = async function (channel) {
	if (channel.type === 'DM') {
		return;
	}

	if (isWrongSystem(channel.guild.id, channel.type === 'DM')) {
		return;
	}

	const temporaryVoice = await DBTemporaryVoices.findOne({
		where: { guildId: channel.guild.id, channelId: channel.id }
	});

	const temporaryText = await DBTemporaryVoices.findOne({
		where: { guildId: channel.guild.id, textChannelId: channel.id }
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

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: channel.guild.id, loggingChannelDelete: true },
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
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`${channel.name} has been deleted`)
			.addFields(
				{ name: 'Channel Deleted', value: channel.name },
				{ name: 'Type', value: channel.type },
				{ name: 'Name', value: channel.name },
			)
			.setTimestamp()
			.setFooter('Eventname: channeldelete');

		if (channel.type === 'voice') {
			changeEmbed.addField('Bitrate', channel.bitrate);
			changeEmbed.addField('User Limit', channel.userLimit);
		} else if (channel.type === 'text') {
			if (channel.topic) {
				changeEmbed.addField('Topic', channel.topic);
			}
			changeEmbed.addField('NSFW', channel.nsfw);
			changeEmbed.addField('Rate Limit Per User (Slowmode)', channel.rateLimitPerUser);
		}

		channel.permissionOverwrites.forEach(permissionGroup => {
			if (permissionGroup.type === 'role') {
				changeEmbed.addField('Permissions for', `<@&${permissionGroup.id}>`);
			} else {
				changeEmbed.addField('Permissions for', `<@${permissionGroup.id}>`);
			}

			let permissionsAllowReadable = 'None';
			if (permissionGroup.allow.toArray().length > 0) {
				permissionsAllowReadable = permissionGroup.allow.toArray().join(', ');
			}
			changeEmbed.addField('Allow', permissionsAllowReadable);

			let permissionsDenyReadable = 'None';
			if (permissionGroup.deny.toArray().length > 0) {
				permissionsDenyReadable = permissionGroup.deny.toArray().join(', ');
			}
			changeEmbed.addField('Deny', permissionsDenyReadable);
		});

		loggingChannel.send({ embeds: [changeEmbed] });
	}
};
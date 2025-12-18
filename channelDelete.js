const Discord = require('discord.js');
const { DBTemporaryVoices } = require('./dbObjects');

module.exports = async function (channel) {
	if (channel.type === Discord.ChannelType.DM) {
		return;
	}

	const temporaryVoice = await DBTemporaryVoices.findOne({
		attributes: ['id', 'textChannelId'],
		where: {
			guildId: channel.guild.id,
			channelId: channel.id
		}
	});

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
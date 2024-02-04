const { isWrongSystem } = require('./utils');
const Discord = require('discord.js');

module.exports = async function (guild) {
	if (isWrongSystem(guild.id, false)) {
		return;
	}

	let message = `Thanks for adding me to the server!\nUse </help:${guild.client.slashCommandData.find(command => command.name === 'help').id}> to get a list of commands!\nTo provide feedback please use </feedback:${guild.client.slashCommandData.find(command => command.name === 'feedback').id}>`;

	try {
		const systemChannel = await guild.channels.cache.get(guild.systemChannelId);
		if (systemChannel) {
			systemChannel.send(message);
		} else {
			const generalChannel = await guild.channels.cache.find(channel => channel.name === 'general');
			if (generalChannel) {
				generalChannel.send(message);
			} else {
				const otherChannel = guild.channels.cache.find(channel => channel.type === Discord.ChannelType.GuildText && channel.permissionsFor(guild.members.cache.find(member => member.id === guild.client.user.id)).has('SEND_MESSAGES'));
				if (otherChannel) {
					otherChannel.send(message);
				}
			}
		}
	} catch (error) {
		console.error('guildCreate.js | added message' + error);
	}
};

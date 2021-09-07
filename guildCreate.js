const { isWrongSystem } = require('./utils');

module.exports = async function (guild) {
	if (isWrongSystem(guild.id, false)) {
		return;
	}

	try {
		const systemChannel = await guild.channels.cache.get(guild.systemChannelId);
		if (systemChannel) {
			systemChannel.send('Thanks for adding me to the server!\nUse `e!help` to get a list of commands!\nTo provide feedback please use `e!feedback`\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');
		} else {
			const generalChannel = await guild.channels.cache.find(channel => channel.name === 'general');
			if (generalChannel) {
				generalChannel.send('Thanks for adding me to the server!\nUse `e!help` to get a list of commands!\nTo provide feedback please use `e!feedback`\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');
			} else {
				const otherChannel = guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'));
				otherChannel.send('Thanks for adding me to the server!\nUse `e!help` to get a list of commands!\nTo provide feedback please use `e!feedback`\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');
			}
		}
	} catch (error) {
		console.log(error);
	}
};

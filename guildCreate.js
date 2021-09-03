module.exports = async function (guild) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (guild.id != '800641468321759242' && guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (guild.id != '800641367083974667' && guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (guild.id === '800641468321759242' || guild.id === '800641735658176553' || guild.id === '800641367083974667' || guild.id === '800641819086946344') {
			return;
		}
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

const { DBGuilds, DBBirthdayGuilds } = require('./dbObjects');

module.exports = async function (member) {
	if (member.id === member.client.user.id) {
		return;
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'sendGoodbyeMessage', 'goodbyeMessageChannel', 'goodbyeMessageText'],
		where: {
			guildId: member.guild.id
		},
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a goodbye-message should be sent
		if (guild.sendGoodbyeMessage) {
			//get the channel id for the goodbye message
			const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
			//get the channel object from the id
			const guildGoodbyeMessageChannel = await member.client.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
			//get the goodbye message text
			const guildGoodbyeMessageText = guild.goodbyeMessageText.replace('@member', member.user.username + '#' + member.user.discriminator);
			try {
				//send the goodbye message text into the channel
				await guildGoodbyeMessageChannel.send(guildGoodbyeMessageText);
			} catch (e) {
				if (e.message === 'Missing Access') {
					const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
					return await owner.send(`I could not send a goodbye message for a new user into the channel \`${guildGoodbyeMessageChannel.name}\` on \`${member.guild.name}\` due to missing permissions.`);
				} else {
					return console.error('guildMemberRemove.js | goodbye message' + e);
				}
			}
		}

		// destroy the guild dataset in the db
		await DBBirthdayGuilds.destroy({
			where: {
				userId: member.user.username,
				guildId: member.guild.id
			}
		});
	}
};

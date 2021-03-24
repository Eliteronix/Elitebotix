//Import Tables
const { DBGuilds, DBAutoRoles } = require('./dbObjects');

module.exports = async function (member) {
	
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (member.guild.id != '800641468321759242' && member.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (member.guild.id != '800641367083974667' && member.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (member.guild.id === '800641468321759242' || member.guild.id === '800641735658176553' || member.guild.id === '800641367083974667' || member.guild.id === '800641819086946344') {
			return;
		}
	}
	
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: member.guild.id },
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a welcome-message should be sent
		if (guild.sendWelcomeMessage) {
			//get the channel id for the welcome message
			const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
			//get the channel object from the id
			const guildWelcomeMessageChannel = member.client.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
			//get the welcome message text
			const guildWelcomeMessageText = guild.welcomeMessageText.replace('@member', '<@' + member.user.id + '>');
			//send the welcome message text into the channel
			guildWelcomeMessageChannel.send(guildWelcomeMessageText);
		}
	}

	//get all autoroles for the guild
	const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: member.guild.id } });
	//iterate for every autorole gathered
	for (let i = 0; i < autoRolesList.length; i++) {
		//get the role object from the array
		let autoRole = member.guild.roles.cache.get(autoRolesList[i].roleId);

		//Check if deleted role
		if(autoRole){
			//add the role to the member
			member.roles.add(autoRole);
		} else {
			DBAutoRoles.destroy({ where: { guildId: member.guild.id, roleId: autoRolesList[i].roleId } });
			autoRolesList.shift();
		}
	}
};

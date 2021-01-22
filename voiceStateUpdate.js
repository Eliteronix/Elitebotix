//Import Tables
const { DBGuilds, DBTemporaryVoices } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newMember.guild.id != '800641468321759242' && newMember.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newMember.guild.id != '800641367083974667' && newMember.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newMember.guild.id === '800641468321759242' || newMember.guild.id === '800641735658176553' || newMember.guild.id === '800641367083974667' || newMember.guild.id === '800641819086946344') {
			return;
		}
	}

	const newUserChannelId = newMember.channelID;
	const oldUserChannelId = oldMember.channelID;

	const newUserChannel = oldMember.client.channels.cache.get(newUserChannelId);
	const oldUserChannel = oldMember.client.channels.cache.get(oldUserChannelId);

	if (newUserChannel && newUserChannel.name.startsWith('➕')) {
	
		const dbGuild = DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});
		
		if(dbGuild){
			if(dbGuild.temporaryVoices){
				//Clone the channel and get the new channel
				let createdChannel = await newUserChannel.clone();
				
				let createdText;
				
				if(dbGuild.addTemporaryText){
					const createdCategoryId = createdChannel.parentID;
					
					
					//Move further down to avoid waiting time
					createdText = await newMember.guild.createChannel('temporaryText', 'text');
					
					createdText.setParent(createdCategoryId);
				}

				DBTemporaryVoices.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id, textChannelId: createdText.id });

				//Get Member ID
				const newMemberId = newMember.id;
				//Get member
				const member = await newMember.guild.members.fetch(newMemberId);

				//Get the name of the user
				let memberName = member.user.username;
				if (member.nickname) {
					memberName = member.nickname;
				}

				let channelName = '🕓 ' + memberName;
				if (memberName.toLowerCase().endsWith('x') || memberName.toLowerCase().endsWith('s')) {
					channelName = channelName + '\' voice';
				} else {
					channelName = channelName + '\'s voice';
				}
				//Rename the channel
				await createdChannel.edit({ name: `${channelName}` });
				//Set all permissions for the creator
				await createdChannel.overwritePermissions([
					{
						id: newMember.id,
						allow: ['MANAGE_CHANNELS','MANAGE_ROLES','MUTE_MEMBERS','DEAFEN_MEMBERS','MOVE_MEMBERS','CONNECT','SPEAK','VIEW_CHANNEL','CREATE_INSTANT_INVITE','STREAM','USE_VAD'],
					},
				]);
				//Move user
				member.voice.setChannel(createdChannel);
			}
		}
	}

	if (oldUserChannel) {
		
		const dbGuild = DBGuilds.findOne({
			where: { guildId: oldMember.guild.id }
		});

		const dbTemporaryVoices = await DBTemporaryVoices.findOne({
			where: { guildId: oldUserChannel.guild.id, channelId: oldUserChannel.id }
		});

		if (dbTemporaryVoices) {
			const voiceStates = oldUserChannel.guild.voiceStates.cache;

			let usersLeft = false;

			voiceStates.forEach(voiceState => {
				if (voiceState.channelID === dbTemporaryVoices.channelId) {
					usersLeft = true;
				}
			});

			if (!(usersLeft)) {
				await oldUserChannel.delete();
				await dbTemporaryVoices.destroy();
			}
		}
	}
};

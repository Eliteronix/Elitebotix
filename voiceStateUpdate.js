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

	let dbTemporaryVoicesNew;

	if (newUserChannel) {
		dbTemporaryVoicesNew = await DBTemporaryVoices.findOne({
			where: { guildId: newUserChannel.guild.id, channelId: newUserChannel.id }
		});
	}

	if (newUserChannel && newUserChannel.name.startsWith('➕') && !(dbTemporaryVoicesNew)) {

		const dbGuild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (dbGuild) {
			if (dbGuild.temporaryVoices) {
				//Clone the channel and get the new channel
				let createdChannel = await newUserChannel.clone();

				let createdText;

				if (dbGuild.addTemporaryText) {
					const createdCategoryId = createdChannel.parentID;


					//Move further down to avoid waiting time
					createdText = await newMember.guild.channels.create('temporaryText', 'text');

					await createdText.setParent(createdCategoryId);

					DBTemporaryVoices.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id, textChannelId: createdText.id, creatorId: newMember.id });
				} else {
					DBTemporaryVoices.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id, creatorId: newMember.id });
				}

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
				//Rename the channel(s)
				await createdChannel.edit({ name: `${channelName}` });

				if (createdText) {
					let textChannelName = '💬 ' + memberName;
					if (memberName.toLowerCase().endsWith('x') || memberName.toLowerCase().endsWith('s')) {
						textChannelName = textChannelName + '\' text';
					} else {
						textChannelName = textChannelName + '\'s text';
					}
					createdText.edit({ name: `${textChannelName}` });
				}
				//Move user
				member.voice.setChannel(createdChannel);
				//Set all permissions for the creator
				await createdChannel.overwritePermissions([
					{
						id: newMember.id,
						allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'CONNECT', 'SPEAK', 'VIEW_CHANNEL', 'CREATE_INSTANT_INVITE', 'STREAM', 'USE_VAD'],
					},
				]);
				//Set all permissions for the creator and deny @everyone to view the text channel
				let everyone = newMember.guild.roles.cache.find(r => r.name === '@everyone');
				await createdText.overwritePermissions([
					{
						id: newMember.id,
						allow: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY', 'SEND_TTS_MESSAGES'],
					},
					{
						id: everyone.id,
						deny: ['VIEW_CHANNEL'],
					},
				]);
				createdText.send(`<@${newMemberId}>, you are now admin for this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel.`);
			}
		}
	} else if (dbTemporaryVoicesNew && newUserChannel.id === dbTemporaryVoicesNew.channelId && newMember.id !== dbTemporaryVoicesNew.creatorId) {
		let textChannel;

		if (dbTemporaryVoicesNew.textChannelId) {
			textChannel = oldMember.client.channels.cache.get(dbTemporaryVoicesNew.textChannelId);
		}
		await textChannel.overwritePermissions([
			{
				id: newMember.id,
				allow: ['VIEW_CHANNEL', 'CREATE_INSTANT_INVITE', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'READ_MESSAGE_HISTORY'],
			},
		]);
		textChannel.send(`<@${newMember.id}>, you now have access to this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel. You will also lose access to this channel if you leave the voice channel.`);
	}

	if (oldUserChannel) {

		const dbTemporaryVoices = await DBTemporaryVoices.findOne({
			where: { guildId: oldUserChannel.guild.id, channelId: oldUserChannel.id }
		});

		if (dbTemporaryVoices) {

			let textChannel;

			if (dbTemporaryVoices.textChannelId) {
				textChannel = oldMember.client.channels.cache.get(dbTemporaryVoices.textChannelId);
			}

			const voiceStates = oldUserChannel.guild.voiceStates.cache;

			let usersLeft = false;

			voiceStates.forEach(voiceState => {
				if (voiceState.channelID === dbTemporaryVoices.channelId) {
					usersLeft = true;
				}
			});

			if (!(usersLeft)) {
				if (dbTemporaryVoices.textChannelId) {
					await textChannel.delete();
				}
				await oldUserChannel.delete();
				await dbTemporaryVoices.destroy();
			} else if(oldMember.id !== dbTemporaryVoices.creatorId){
				await textChannel.overwritePermissions([
					{
						id: newMember.id,
						deny: ['VIEW_CHANNEL'],
					},
				]);
			}
		}
	}
};

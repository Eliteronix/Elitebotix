const Discord = require('discord.js');
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

	if (oldMember.serverMute !== null && oldMember.serverMute !== newMember.serverMute) {
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingServerMute) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			let member;
			try {
				member = await newMember.guild.members.fetch(newMember.id);
			} catch (error) {
				//nothing
			}

			if (!member) {
				return;
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> has been updated!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Server Mute', value: `\`${oldMember.serverMute}\` -> \`${newMember.serverMute}\`` },
				)
				.setTimestamp()
				.setFooter('Eventname: servermute');

			channel.send({ embeds: [changeEmbed] });
		}
	}

	if (oldMember.serverDeaf !== newMember.serverDeaf) {
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && guild.loggingChannel && guild.loggingServerDeaf) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			let member;
			try {
				member = await newMember.guild.members.fetch(newMember.id);
			} catch (error) {
				//nothing
			}

			if (!member) {
				return;
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> has been updated!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Server Deaf', value: `\`${oldMember.serverDeaf}\` -> \`${newMember.serverDeaf}\`` },
				)
				.setTimestamp()
				.setFooter('Eventname: serverdeaf');

			channel.send({ embeds: [changeEmbed] });
		}
	}

	if (oldMember.channelID !== newMember.channelID) {
		const guild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (guild && newMember.channelID && guild.loggingChannel && guild.loggingJoinVoice) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			let member;
			try {
				member = await newMember.guild.members.fetch(newMember.id);
			} catch (error) {
				//nothing
			}

			if (!member) {
				return;
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> has joined a voice channel!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Joined Voice Channel', value: `<#${newMember.channelID}>` },
				)
				.setTimestamp()
				.setFooter('Eventname: joinvoice');

			channel.send({ embeds: [changeEmbed] });
		}

		if (guild && oldMember.channelID && guild.loggingChannel && guild.loggingLeaveVoice) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			let member;
			try {
				member = await newMember.guild.members.fetch(newMember.id);
			} catch (error) {
				//nothing
			}

			if (!member) {
				return;
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> has left a voice channel!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Left Voice Channel', value: `<#${oldMember.channelID}>` },
				)
				.setTimestamp()
				.setFooter('Eventname: leavevoice');

			channel.send({ embeds: [changeEmbed] });
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

	if (newUserChannel && newUserChannel.name.startsWith('➕') && !(dbTemporaryVoicesNew) && newUserChannel !== oldUserChannel) {

		const dbGuild = await DBGuilds.findOne({
			where: { guildId: newMember.guild.id }
		});

		if (dbGuild) {
			if (dbGuild.temporaryVoices) {
				//Clone the channel and get the new channel
				let createdChannel;
				try {
					createdChannel = await newUserChannel.clone();
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
						return owner.send(`I could not create a new temporary voicechannel because I am missing the \`Manage Channels\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.log(e);
					}
				}

				let createdText;

				if (dbGuild.addTemporaryText) {
					const createdCategoryId = createdChannel.parentID;

					try {
						//Move further down to avoid waiting time
						createdText = await newMember.guild.channels.create('temporaryText', 'text');
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
							return owner.send(`I could not create a new temporary voicechannel because I am missing the \`Manage Channels\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.log(e);
						}
					}

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
					await createdText.edit({ name: `${textChannelName}` });
				}
				try {
					//Move user
					await member.voice.setChannel(createdChannel);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
						return owner.send(`I could not move a user to their temporary voicechannel because I am missing the \`Move Members\` permission on \`${member.guild.name}\`.`);
					} else if (e.message === 'Target user is not connected to voice.') {
						if (createdText) {
							try {
								await createdText.delete();
							} catch (e) {
								if (e.message === 'Missing Access') {
									const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerID);
									return owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${newMember.guild.name}\`.`);
								} else {
									return console.log(e);
								}
							}
						}
						try {
							return await createdChannel.delete();
						} catch (e) {
							if (e.message === 'Missing Access') {
								const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerID);
								return owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${newMember.guild.name}\`.`);
							} else {
								return console.log(e);
							}
						}
					} else {
						return console.log(e);
					}
				}
				//Set all permissions for the creator
				const newUser = newMember.client.users.cache.find(user => user.id === newMember.id);
				try {
					await createdChannel.updateOverwrite(newUser, { MANAGE_CHANNELS: true, MANAGE_ROLES: true, MUTE_MEMBERS: true, DEAFEN_MEMBERS: true, MOVE_MEMBERS: true, CONNECT: true, SPEAK: true, VIEW_CHANNEL: true, CREATE_INSTANT_INVITE: true, STREAM: true, USE_VAD: true });
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
						return owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${member.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
					} else {
						return console.log(e);
					}
				}
				if (createdText) {
					//Set all permissions for the creator and deny @everyone to view the text channel
					let everyone = newMember.guild.roles.everyone;
					try {
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
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
							return owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${member.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
						} else if (e.message !== 'Unknown Channel') { //Channel might be deleted already
							console.log(createdText);
							return console.log(e);
						}
					}
					createdText.send(`<@${newMemberId}>, you are now admin for this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel.\n\nNote that bots also don't have permissions to read messages in this channel except if they have admin rights. This is the case if they don't appear in the user list on the right side. To change that, update the permissions in the channel for the bot you want to use.`);
				}
			}
		}
	} else if (dbTemporaryVoicesNew && newUserChannel.id === dbTemporaryVoicesNew.channelId && newMember.id !== dbTemporaryVoicesNew.creatorId && newUserChannel !== oldUserChannel) {
		let textChannel;

		if (dbTemporaryVoicesNew.textChannelId) {
			textChannel = oldMember.client.channels.cache.get(dbTemporaryVoicesNew.textChannelId);
		}
		const newUser = newMember.client.users.cache.find(user => user.id === newMember.id);
		try {
			await textChannel.updateOverwrite(newUser, { VIEW_CHANNEL: true, CREATE_INSTANT_INVITE: true, SEND_MESSAGES: true, EMBED_LINKS: true, ATTACH_FILES: true, ADD_REACTIONS: true, USE_EXTERNAL_EMOJIS: true, READ_MESSAGE_HISTORY: true });
		} catch (e) {
			if (e.message === 'Missing Access') {
				const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerID);
				return owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${newMember.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
			} else {
				return console.log(e);
			}
		}
		textChannel.send(`<@${newMember.id}>, you now have access to this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel. You will also lose access to this channel if you leave the voice channel.`);
	}

	if (oldUserChannel && newUserChannel !== oldUserChannel) {

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
					try {
						await textChannel.delete();
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await oldMember.client.users.cache.find(user => user.id === oldMember.guild.ownerID);
							return owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${oldMember.guild.name}\`.`);
						} else {
							return console.log(e);
						}
					}
				}
				try {
					await oldUserChannel.delete();
				} catch (e) {
					if (e.message === 'Missing Access') {
						await dbTemporaryVoices.destroy();
						const owner = await oldMember.client.users.cache.find(user => user.id === oldMember.guild.ownerID);
						return owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${oldMember.guild.name}\`.`);
					} else {
						await dbTemporaryVoices.destroy();
						return console.log(e);
					}
				}
				await dbTemporaryVoices.destroy();
			} else if (oldMember.id !== dbTemporaryVoices.creatorId) {
				const newUser = newMember.client.users.cache.find(user => user.id === newMember.id);
				try {
					await textChannel.updateOverwrite(newUser, { VIEW_CHANNEL: false });
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerID);
						return owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${newMember.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
					} else {
						return console.log(e);
					}
				}
			}
		}
	}
};

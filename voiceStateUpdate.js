const Discord = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');
const { DBGuilds, DBTemporaryVoices } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {
	if (oldMember.serverMute !== null && oldMember.serverMute !== newMember.serverMute) {
		const guild = await DBGuilds.findOne({
			attributes: ['id', 'loggingChannel', 'loggingServerMute'],
			where: {
				guildId: newMember.guild.id
			}
		});

		if (guild && guild.loggingChannel && guild.loggingServerMute) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerId);
					return await owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let member = null;

			while (!member) {
				try {
					member = await newMember.guild.members.fetch({ user: [newMember.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('voiceStateUpdate.js | server mute', e);
						return;
					}
				}
			}

			member = member.first();

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL() })
				.setDescription(`<@${member.user.id}> has been updated!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Server Mute', value: `\`${oldMember.serverMute}\` -> \`${newMember.serverMute}\`` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: servermute' });

			await channel.send({ embeds: [changeEmbed] });
		}
	}

	if (oldMember.serverDeaf !== newMember.serverDeaf) {
		const guild = await DBGuilds.findOne({
			attributes: ['id', 'loggingChannel', 'loggingServerDeaf'],
			where: {
				guildId: newMember.guild.id
			}
		});

		if (guild && guild.loggingChannel && guild.loggingServerDeaf) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerId);
					return await owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let member = null;

			while (!member) {
				try {
					member = await newMember.guild.members.fetch({ user: [newMember.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('voiceStateUpdate.js | server deafened', e);
						return;
					}
				}
			}

			member = member.first();

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL() })
				.setDescription(`<@${member.user.id}> has been updated!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Server Deaf', value: `\`${oldMember.serverDeaf}\` -> \`${newMember.serverDeaf}\`` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: serverdeaf' });

			await channel.send({ embeds: [changeEmbed] });
		}
	}

	if (oldMember.channelId !== newMember.channelId) {
		const guild = await DBGuilds.findOne({
			attributes: ['id', 'loggingChannel', 'loggingJoinVoice'],
			where: {
				guildId: newMember.guild.id
			}
		});

		if (guild && newMember.channelId && guild.loggingChannel && guild.loggingJoinVoice) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerId);
					return await owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let member = null;

			while (!member) {
				try {
					member = await newMember.guild.members.fetch({ user: [newMember.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('voiceStateUpdate.js | joined voice', e);
						return;
					}
				}
			}

			member = member.first();

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL() })
				.setDescription(`<@${member.user.id}> has joined a voice channel!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Joined Voice Channel', value: `<#${newMember.channelId}>` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: joinvoice' });

			await channel.send({ embeds: [changeEmbed] });
		}

		if (guild && oldMember.channelId && guild.loggingChannel && guild.loggingLeaveVoice) {
			let channel;
			try {
				channel = await newMember.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newMember.client.users.fetch(newMember.guild.ownerId);
					return await owner.send(`It seems like the logging channel on the guild \`${newMember.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.error(error);
			}

			let member = null;

			while (!member) {
				try {
					member = await newMember.guild.members.fetch({ user: [newMember.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('voiceStateUpdate.js | left voice', e);
						return;
					}
				}
			}

			member = member.first();

			const changeEmbed = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL() })
				.setDescription(`<@${member.user.id}> has left a voice channel!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Left Voice Channel', value: `<#${oldMember.channelId}>` },
				)
				.setTimestamp()
				.setFooter({ text: 'Eventname: leavevoice' });

			await channel.send({ embeds: [changeEmbed] });
		}
	}

	const newUserChannelId = newMember.channelId;
	const oldUserChannelId = oldMember.channelId;

	const newUserChannel = oldMember.client.channels.cache.get(newUserChannelId);
	const oldUserChannel = oldMember.client.channels.cache.get(oldUserChannelId);

	let dbTemporaryVoicesNew;

	if (newUserChannel) {
		dbTemporaryVoicesNew = await DBTemporaryVoices.findOne({
			attributes: ['textChannelId', 'creatorId', 'channelId'],
			where: {
				guildId: newUserChannel.guild.id, channelId: newUserChannel.id
			}
		});
	}

	if (newUserChannel && newUserChannel.name.startsWith('➕') && !dbTemporaryVoicesNew && newUserChannel !== oldUserChannel) {
		const dbGuild = await DBGuilds.findOne({
			attributes: ['temporaryVoices', 'addTemporaryText'],
			where: {
				guildId: newMember.guild.id
			}
		});

		if (dbGuild) {
			if (dbGuild.temporaryVoices) {
				//Clone the channel and get the new channel
				let createdChannel;
				try {
					createdChannel = await newUserChannel.clone();
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return await owner.send(`I could not create a new temporary voicechannel because I am missing the \`Manage Channels\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.error(e);
					}
				}

				let createdText;

				if (dbGuild.addTemporaryText) {
					const createdCategoryId = createdChannel.parentId;

					try {
						//Move further down to avoid waiting time
						createdText = await newMember.guild.channels.create({
							name: 'temporaryText',
							type: Discord.ChannelType.GuildText,
						});
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return await owner.send(`I could not create a new temporary voicechannel because I am missing the \`Manage Channels\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.error(e);
						}
					}

					await createdText.setParent(createdCategoryId);

					DBTemporaryVoices.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id, textChannelId: createdText.id, creatorId: newMember.id });
				} else {
					DBTemporaryVoices.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id, creatorId: newMember.id });
				}

				//Get Member Id //???????
				const newMemberId = newMember.id;
				//Get member			
				let member = null;

				while (!member) {
					try {
						member = await newMember.guild.members.fetch({ user: [newMember.id], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('voiceStateUpdate.js | temp channel', e);
							return;
						}
					}
				}

				member = member.first();

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
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return await owner.send(`I could not move a user to their temporary voicechannel because I am missing the \`Move Members\` permission on \`${member.guild.name}\`.`);
					} else if (e.message === 'Target user is not connected to voice.') {
						if (createdText) {
							try {
								await createdText.delete();
							} catch (e) {
								if (e.message === 'Missing Access') {
									const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerId);
									return await owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${newMember.guild.name}\`.`);
								} else {
									return console.error(e);
								}
							}
						}
						try {
							return await createdChannel.delete();
						} catch (e) {
							if (e.message === 'Missing Access') {
								const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerId);
								return await owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${newMember.guild.name}\`.`);
							} else {
								return console.error(e);
							}
						}
					} else {
						return console.error(e);
					}
				}
				//Set all permissions for the creator
				const newUser = newMember.client.users.cache.find(user => user.id === newMember.id);
				try {
					await createdChannel.permissionOverwrites.edit(newUser, { ManageChannels: true, MoveMembers: true, Connect: true, Speak: true, ViewChannel: true, CreateInstantInvite: true, Stream: true, UseVAD: true });
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return await owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${member.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
					} else {
						return console.error(e);
					}
				}
				if (createdText) {
					//Set all permissions for the creator and deny @everyone to view the text channel
					let everyone = newMember.guild.roles.everyone;
					try {
						await createdText.permissionOverwrites.set([
							{
								id: newMember.id,
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ManageChannels,
									PermissionFlagsBits.CreateInstantInvite,
									PermissionFlagsBits.ManageWebhooks,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.EmbedLinks,
									PermissionFlagsBits.AttachFiles,
									PermissionFlagsBits.AddReactions,
									PermissionFlagsBits.UseExternalEmojis,
									PermissionFlagsBits.MentionEveryone,
									PermissionFlagsBits.ManageMessages,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendTTSMessages,
								],
							},
							{
								id: everyone.id,
								deny: [
									PermissionFlagsBits.ViewChannel
								],
							},
						]);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return await owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${member.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
						} else if (e.message !== 'Unknown Channel') { //Channel might be deleted already
							return console.error(e);
						}
					}

					try {
						await createdText.send(`<@${newMemberId}>, you are now admin for this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel.\n\nNote that bots also don't have permissions to read messages in this channel except if they have admin rights. This is the case if they don't appear in the user list on the right side.`);
					} catch (e) {
						if (e.message !== 'Unknown Channel') {
							console.error(e);
						}
					}
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
			if (textChannel) {
				await textChannel.permissionOverwrites.edit(newUser, { ViewChannel: true, CreateInstantInvite: true, SendMessages: true, EmbedLinks: true, AttachFiles: true, AddReactions: true, UseExternalEmojis: true, ReadMessageHistory: true });
			}
		} catch (e) {
			if (e.message === 'Missing Access') {
				const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerId);
				return await owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${newMember.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
			} else {
				return console.error(e);
			}
		}
		if (textChannel) {
			await textChannel.send(`<@${newMember.id}>, you now have access to this text channel. The channel will be deleted as soon as everyone left the corresponding voice channel. You will also lose access to this channel if you leave the voice channel.`);
		}
	}

	if (oldUserChannel && newUserChannel !== oldUserChannel) {
		const dbTemporaryVoices = await DBTemporaryVoices.findOne({
			attributes: ['id', 'channelId', 'textChannelId', 'creatorId'],
			where: {
				guildId: oldUserChannel.guild.id, channelId: oldUserChannel.id
			}
		});

		if (dbTemporaryVoices) {

			let textChannel;

			if (dbTemporaryVoices.textChannelId) {
				textChannel = oldMember.client.channels.cache.get(dbTemporaryVoices.textChannelId);
			}

			const voiceStates = oldUserChannel.guild.voiceStates.cache;

			let usersLeft = false;

			voiceStates.forEach(voiceState => {
				if (voiceState.channelId === dbTemporaryVoices.channelId) {
					usersLeft = true;
				}
			});

			if (!(usersLeft)) {
				if (dbTemporaryVoices.textChannelId) {
					try {
						if (textChannel) {
							await textChannel.delete();
						}
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await oldMember.client.users.cache.find(user => user.id === oldMember.guild.ownerId);
							return await owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${oldMember.guild.name}\`.`);
						} else {
							return console.error(e);
						}
					}
				}
				try {
					await oldUserChannel.delete();
				} catch (e) {
					if (e.message === 'Missing Access') {
						await dbTemporaryVoices.destroy();
						const owner = await oldMember.client.users.cache.find(user => user.id === oldMember.guild.ownerId);
						return await owner.send(`I could not delete a temporary textchannel because I am missing the \`Manage Channels\` permission on \`${oldMember.guild.name}\`.`);
					} else if (e.message === 'Unknown Channel') {
						await dbTemporaryVoices.destroy();
					} else {
						await dbTemporaryVoices.destroy();
						return console.error(e);
					}
				}
				await dbTemporaryVoices.destroy();
			} else if (oldMember.id !== dbTemporaryVoices.creatorId) {
				const newUser = newMember.client.users.cache.find(user => user.id === newMember.id);
				try {
					if (textChannel) {
						await textChannel.permissionOverwrites.edit(newUser, { ViewChannel: false });
					}
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await newMember.client.users.cache.find(user => user.id === newMember.guild.ownerId);
						return await owner.send(`I could not setup the rights in a new temporary textchannel because I am missing the \`Administrator\` permission on \`${newMember.guild.name}\`. I need the admin permissions because no other permissions are sufficient for setting up the textchannel properly.`);
					} else {
						return console.error(e);
					}
				}
			}
		}
	}
};

const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles, DBGuilds, DBStarBoardMessages } = require('./dbObjects');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	//Check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which needs to be handled
		try {
			await reaction.fetch();
		} catch (error) {
			if (error.message !== 'Unknown Message' && error.message !== 'Missing Access') {
				console.error('Something went wrong when fetching the message: ', error);
				// Return as `reaction.message.author` may be undefined/null
				return;
			}
		}
	}

	//Return if the bot reacted itself or if it was not a bot message
	if (user.id === reaction.client.user.id) {
		return;
	}

	process.send(`discorduser ${user.id}}`);

	if (reaction._emoji.name === '⭐') {
		const guild = await DBGuilds.findOne({
			attributes: ['id', 'starBoardEnabled', 'starBoardMinimum', 'starBoardChannel'],
			where: {
				guildId: reaction.message.guild.id
			}
		});

		if (guild && guild.starBoardEnabled && parseInt(guild.starBoardMinimum) <= reaction.count && guild.starBoardChannel !== reaction.message.channel.id) {
			const starBoardedMessage = await DBStarBoardMessages.findOne({
				attributes: ['id', 'starBoardMessageId', 'starBoardChannelId', 'starBoardMessageStarsQuantityMax'],
				where: {
					originalMessageId: reaction.message.id
				}
			});

			if (starBoardedMessage) {
				let channel;
				try {
					channel = await reaction.client.channels.fetch(starBoardedMessage.starBoardChannelId);
				} catch (error) {
					if (error.message !== 'Unknown Channel') {
						console.error(error);
					}
				}
				if (channel) {
					let message;
					try {
						message = await channel.messages.fetch({ message: starBoardedMessage.starBoardMessageId });
					} catch (error) {
						if (error.message !== 'Unknown Message') {
							console.error(error);
						}
					}

					//Check that the message was sent from itself (Avoiding migration issues from legacy messages)
					if (message && message.author.id === reaction.client.user.id) {
						const starBoardMessageEmbed = new Discord.EmbedBuilder()
							.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
							.setColor('#d9b51c')
							.setDescription(reaction.message.content)
							.addFields(
								{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
							)
							.setTimestamp();

						reaction.message.attachments.forEach(attachment => {
							starBoardMessageEmbed
								.addFields([{ name: 'Attachment', value: attachment.name }])
								.setImage(attachment.url);
						});

						if (starBoardedMessage.starBoardMessageStarsQuantityMax <= reaction.count || starBoardedMessage.starBoardMessageStarsQuantityMax == null) {
							starBoardedMessage.starBoardMessageStarsQuantityMax = reaction.count;
							starBoardedMessage.save();
							return message.edit(`${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, starBoardMessageEmbed);
						} else {
							return message.edit(`${reaction.count} ⭐ in <#${reaction.message.channel.id}>\nMaximum ⭐: ${starBoardedMessage.starBoardMessageStarsQuantityMax}`, starBoardMessageEmbed);
						}
					}
				}

				//Try to resend the message
				const starBoardMessageEmbed = new Discord.EmbedBuilder()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.setDescription(reaction.message.content)
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addFields([{ name: 'Attachment', value: attachment.name }])
						.setImage(attachment.url);
				});

				try {
					channel = await reaction.client.channels.fetch(guild.starBoardChannel);
				} catch (error) {
					if (error.message === 'Unknown Channel') {
						guild.starBoardEnabled = false;
						guild.save();
						const owner = await reaction.message.client.users.fetch(reaction.message.guild.ownerId);
						return await owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.error(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				starBoardedMessage.starBoardChannelId = starBoardMessage.channel.id;
				starBoardedMessage.starBoardMessageId = starBoardMessage.id;
				starBoardedMessage.save();
			} else {
				const starBoardMessageEmbed = new Discord.EmbedBuilder()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				if (reaction.message.content) {
					starBoardMessageEmbed.setDescription(reaction.message.content);
				}

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addFields([{ name: 'Attachment', value: attachment.name }])
						.setImage(attachment.url);
				});

				let channel;
				try {
					channel = await reaction.client.channels.fetch(guild.starBoardChannel);
				} catch (error) {
					if (error.message === 'Unknown Channel') {
						guild.starBoardEnabled = false;
						guild.save();
						const owner = await reaction.message.client.users.fetch(reaction.message.guild.ownerId);
						return await owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.error(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				DBStarBoardMessages.create({ originalChannelId: reaction.message.channel.id, originalMessageId: reaction.message.id, starBoardChannelId: starBoardMessage.channel.id, starBoardMessageId: starBoardMessage.id, starBoardedMessagestarBoardMessageStarsQuantityMax: 1 });
			}
		}

		return;
	}

	if (!reaction.message.author ||
		reaction.message.author.id !== reaction.client.user.id &&
		reaction.message.author.id !== '784836063058329680') {
		return;
	}

	if (reaction.message.channel.type === Discord.ChannelType.DM) {
		return;
	}

	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		attributes: ['id'],
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			attributes: ['roleId'],
			where: {
				dbReactionRolesHeaderId: dbReactionRolesHeader.id,
				emoji: reaction._emoji.name
			}
		});

		if (dbReactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(dbReactionRole.roleId);

			//Check if deleted role
			if (reactionRoleObject) {
				//Get member
				let member = null;

				while (!member) {
					try {
						member = await reaction.message.guild.members.fetch({ user: [user.id], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('reactionAdded.js | Reactionrole assign 1', e);
							return;
						}
					}
				}

				member = member.first();

				try {
					//Assign role
					await member.roles.add(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return await owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.error(e);
					}
				}
			} else {
				DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRole.roleId } });
				editEmbed(reaction.message, dbReactionRolesHeader);
			}
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<%:' + reaction._emoji.name + ':';

			//Get the reactionRole from the db by all the string (works for general emojis)
			const dbReactionRoleBackup = await DBReactionRoles.findOne({
				attributes: ['roleId'],
				where: {
					dbReactionRolesHeaderId: dbReactionRolesHeader.id,
					emoji: {
						[Op.like]: emoji + '%'
					}
				}
			});

			if (dbReactionRoleBackup) {
				//Get role object
				const reactionRoleBackupObject = reaction.message.guild.roles.cache.get(dbReactionRoleBackup.roleId);

				//Check if deleted role
				if (reactionRoleBackupObject) {
					//Get member
					let member = null;

					while (!member) {
						try {
							member = await reaction.message.guild.members.fetch({ user: [user.id], time: 300000 })
								.catch((err) => {
									throw new Error(err);
								});
						} catch (e) {
							if (e.message !== 'Members didn\'t arrive in time.') {
								console.error('reactionAdded.js | Reactionrole assign 2', e);
								return;
							}
						}
					}

					member = member.first();

					try {
						//Assign role
						await member.roles.add(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return await owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.error(e);
						}
					}
				} else {
					DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRoleBackup.roleId } });
					editEmbed(reaction.message, dbReactionRolesHeader);
				}
			} else {
				console.error(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.EmbedBuilder()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter({ text: `Reactionrole - EmbedId: ${reactionRolesHeader.id}` });

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		attributes: ['emoji', 'roleId', 'description'],
		where: {
			dbReactionRolesHeaderId: reactionRolesHeader.id
		}
	});

	//Add roles to embed
	reactionRoles.forEach(reactionRole => {
		//Get role object
		let reactionRoleName = msg.guild.roles.cache.get(reactionRole.roleId);
		//Add field to embed
		reactionRoleEmbed.addFields([{ name: reactionRole.emoji + ': ' + reactionRoleName.name, value: reactionRole.description }]);
	});

	//Get the Id of the message
	const embedMessageId = reactionRolesHeader.reactionHeaderId;
	//get the Id of the channel
	const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
	//Get the channel object
	let embedChannel;
	try {
		embedChannel = msg.guild.channels.cache.get(embedChannelId);
	} catch (e) {
		await msg.channel.send('Couldn\'t find an embed with this EmbedId');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guildId, id: reactionRolesHeader.id },
		});
		return console.error(e);
	}
	//Get the message object
	const embedMessage = await embedChannel.messages.fetch({ message: embedMessageId });
	//Edit the message
	embedMessage.edit(reactionRoleEmbed);

	//Remove all reactions from the embed
	embedMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));

	//Add reactions to embed
	for (let i = 0; i < reactionRoles.length; i++) {
		try {
			//Add reaction
			await embedMessage.react(reactionRoles[i].emoji);
		} catch (e) {
			if (e.message === 'Missing Access') {
				const owner = await msg.client.users.cache.find(user => user.id === msg.guild.ownerId);
				return await owner.send(`I could not add reactions to a reactionrole-embed because I'm missing the \`Add Reactions\` permission on \`${msg.guild.name}\`.`);
			} else {
				return console.error(e);
			}
		}
	}
}
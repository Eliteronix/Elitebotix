const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles, DBGuilds, DBStarBoardMessages } = require('./dbObjects');

//Import Sequelize for operations
const Sequelize = require('sequelize');
const { isWrongSystem, logDatabaseQueries } = require('./utils');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	if (reaction.message.guild && isWrongSystem(reaction.message.guild.id, reaction.message.channel.type === Discord.ChannelType.DM)) {
		return;
	}

	//Check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which needs to be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	if (reaction.message.channel.type === Discord.ChannelType.DM) {
		return;
	}

	logDatabaseQueries(2, 'reactionRemoved.js DBReactionRolesHeader');
	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		attributes: ['id'],
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
		logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 1');
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			attributes: ['roleId'],
			where: {
				dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: reaction._emoji.name
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
							console.error('reactionRemoved.js | Reactionrole remove 1', e);
							return;
						}
					}
				}

				member = member.first();

				try {
					//Assign role
					await member.roles.remove(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.error(e);
					}
				}
			} else {
				logDatabaseQueries(2, 'reactionAdded.js DBReactionRoles destroy');
				DBReactionRoles.destroy({
					where: {
						dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRole.roleId
					}
				});
				editEmbed(reaction.message, dbReactionRolesHeader);
			}
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<%:' + reaction._emoji.name + ':';

			logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 2');
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
								console.error('reactionRemoved.js | Reactionrole remove 2', e);
								return;
							}
						}
					}

					member = member.first();

					try {
						//Assign role
						await member.roles.remove(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.error(e);
						}
					}
				} else {
					logDatabaseQueries(2, 'reactionAdded.js DBReactionRoles destroy 2');
					DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRoleBackup.roleId } });
					editEmbed(reaction.message, dbReactionRolesHeader);
				}
			} else {
				console.error(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
	if (reaction._emoji.name === '⭐') {
		logDatabaseQueries(2, 'reactionRemoved.js DBGuilds Starboard');
		const guild = await DBGuilds.findOne({
			attributes: ['starBoardEnabled', 'starBoardMinimum', 'starBoardChannel'],
			where: {
				guildId: reaction.message.guild.id
			}
		});

		if (guild && guild.starBoardEnabled && parseInt(guild.starBoardMinimum) <= reaction.count && guild.starBoardChannel !== reaction.message.channel.id) {
			logDatabaseQueries(2, 'reactionRemoved.js DBStarBoardMessages Starboardmessage');
			const starBoardedMessage = await DBStarBoardMessages.findOne({
				attributes: ['id', 'starBoardChannelId', 'starBoardMessageId', 'starBoardMessageStarsQuantityMax'],
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
					if (message) {
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
							starBoardedMessage.starBoardMessageStarsQuantityMax = reaction.count + 1;
							starBoardedMessage.save();
						}

						return message.edit(`${reaction.count} ⭐ in <#${reaction.message.channel.id}>\nMaximum ⭐: ${starBoardedMessage.starBoardMessageStarsQuantityMax}`, starBoardMessageEmbed);
					}
				}
			}
		}

		return;
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

	logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 3');
	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		attributes: ['emoji', 'description', 'roleId'],
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
		msg.channel.send('Couldn\'t find an embed with this EmbedId');
		logDatabaseQueries(2, 'reactionAdded.js DBReactionRolesHeader destroy');
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
				return owner.send(`I could not add reactions to a reactionrole-embed because I'm missing the \`Add Reactions\` permission on \`${msg.guild.name}\`.`);
			} else {
				return console.error(e);
			}
		}
	}
}

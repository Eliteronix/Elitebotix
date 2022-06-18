const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles, DBGuilds, DBStarBoardMessages } = require('./dbObjects');

//Import Sequelize for operations
const Sequelize = require('sequelize');
const { isWrongSystem, logDatabaseQueries, wrongCluster } = require('./utils');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	if (wrongCluster(user.id)) {
		return;
	}

	if (reaction.message.guild && isWrongSystem(reaction.message.guild.id, reaction.message.channel.type === 'DM')) {
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

	if (reaction.message.channel.type === 'DM') {
		return;
	}

	logDatabaseQueries(2, 'reactionRemoved.js DBReactionRolesHeader');
	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
		logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 1');
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: reaction._emoji.name }
		});

		if (dbReactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(dbReactionRole.roleId);

			//Check if deleted role
			if (reactionRoleObject) {
				//Get member
				const member = await reaction.message.guild.members.fetch(user.id);
				try {
					//Assign role
					await member.roles.remove(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.log(e);
					}
				}
			} else {
				DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRole.roleId } });
				editEmbed(reaction.message, dbReactionRolesHeader);
			}
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<:' + reaction._emoji.name + ':';

			logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 2');
			//Get the reactionRole from the db by all the string (works for general emojis)
			const dbReactionRoleBackup = await DBReactionRoles.findOne({
				where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: { [Op.like]: emoji + '%' } }
			});

			if (dbReactionRoleBackup) {
				//Get role object
				const reactionRoleBackupObject = reaction.message.guild.roles.cache.get(dbReactionRoleBackup.roleId);
				//Check if deleted role
				if (reactionRoleBackupObject) {
					//Get member
					const member = await reaction.message.guild.members.fetch(user.id);
					try {
						//Assign role
						await member.roles.remove(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.log(e);
						}
					}
				} else {
					DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRoleBackup.roleId } });
					editEmbed(reaction.message, dbReactionRolesHeader);
				}
			} else {
				console.log(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
	if (reaction._emoji.name === '⭐') {
		logDatabaseQueries(2, 'reactionRemoved.js DBGuilds Starboard');
		const guild = await DBGuilds.findOne({
			where: { guildId: reaction.message.guild.id }
		});

		if (guild && guild.starBoardEnabled && parseInt(guild.starBoardMinimum) <= reaction.count && guild.starBoardChannel !== reaction.message.channel.id) {
			logDatabaseQueries(2, 'reactionRemoved.js DBStarBoardMessages Starboardmessage');
			const starBoardedMessage = await DBStarBoardMessages.findOne({
				where: { originalMessageId: reaction.message.id }
			});

			if (starBoardedMessage) {
				let channel;
				try {
					channel = await reaction.client.channels.fetch(starBoardedMessage.starBoardChannelId);
				} catch (error) {
					if (error.message !== 'Unknown Channel') {
						console.log(error);
					}
				}
				if (channel) {
					let message;
					try {
						message = await channel.messages.fetch(starBoardedMessage.starBoardMessageId);
					} catch (error) {
						if (error.message !== 'Unknown Message') {
							console.log(error);
						}
					}
					if (message) {
						const starBoardMessageEmbed = new Discord.MessageEmbed()
							.setAuthor(reaction.message.author.username, reaction.message.author.displayAvatarURL())
							.setColor('#d9b51c')
							.setDescription(reaction.message.content)
							.addFields(
								{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
							)
							.setTimestamp();

						reaction.message.attachments.forEach(attachment => {
							starBoardMessageEmbed
								.addField('Attachment', attachment.name)
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
	const reactionRoleEmbed = new Discord.MessageEmbed()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter(`Reactionrole - EmbedId: ${reactionRolesHeader.id}`);

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	logDatabaseQueries(2, 'reactionRemoved.js DBReactionRoles 3');
	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		where: { dbReactionRolesHeaderId: reactionRolesHeader.id }
	});

	//Add roles to embed
	reactionRoles.forEach(reactionRole => {
		//Get role object
		let reactionRoleName = msg.guild.roles.cache.get(reactionRole.roleId);
		//Add field to embed
		reactionRoleEmbed.addField(reactionRole.emoji + ': ' + reactionRoleName.name, reactionRole.description);
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
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guildId, id: reactionRolesHeader.id },
		});
		return console.log(e);
	}
	//Get the message object
	const embedMessage = await embedChannel.messages.fetch(embedMessageId);
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
				return console.log(e);
			}
		}
	}
}

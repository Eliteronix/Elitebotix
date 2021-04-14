const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles } = require('./dbObjects');

//Import Sequelize for operations
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (reaction.message.channel.type === 'dm') {
			return;
		}
		if (reaction.message.channel.type !== 'dm' && reaction.message.guild.id != '800641468321759242' && reaction.message.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (reaction.message.channel.type === 'dm') {
			return;
		}
		if (reaction.message.channel.type !== 'dm' && reaction.message.guild.id != '800641367083974667' && reaction.message.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (reaction.message.channel.type !== 'dm') {
			if (reaction.message.guild.id === '800641468321759242' || reaction.message.guild.id === '800641735658176553' || reaction.message.guild.id === '800641367083974667' || reaction.message.guild.id === '800641819086946344') {
				return;
			}
		}
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

	if (user.id === '784836063058329680') {
		return;
	}

	const didYouMeanRegex = /<@.+>, I could not find the command `.+`.\nDid you mean `.+`?/gm;
	if (reaction.message.content.substring(3).startsWith(user.id) && reaction.message.content.match(didYouMeanRegex)
		|| reaction.message.content.substring(2).startsWith(user.id) && reaction.message.content.match(didYouMeanRegex)) {
		if (reaction._emoji.name === '✅') {
			let newMessage = reaction.message;
			newMessage.author = user;

			const didYouMeanBeginningRegex = /<@.+>, I could not find the command `.+`.\nDid you mean `/gm;
			newMessage.content = reaction.message.content.substring(0, reaction.message.content.length - 2).replace(didYouMeanBeginningRegex, '');

			//Get gotMessage
			const gotMessage = require('./gotMessage');

			gotMessage(newMessage);

			return reaction.message.delete();
		} else if (reaction._emoji.name === '❌') {
			return reaction.message.delete();
		}
	}

	if (reaction._emoji.id === '827974793365159997') {
		const scoreRegex = /.+\nSpectate: .+\nBeatmap: .+\nosu! direct: .+\nTry `.+/gm;
		if (reaction.message.content.match(scoreRegex)) {
			const beginningRegex = /.+\nSpectate: .+\nBeatmap: <https:\/\/osu.ppy.sh\/b\//gm;
			const endingRegex = />\nosu! direct:.+\nTry.+/gm;
			const beatmapId = reaction.message.content.replace(beginningRegex, '').replace(endingRegex, '');

			let args = [beatmapId];

			const command = require('./commands/osu-score.js');

			//Set author of the message to the reacting user to not break the commands
			reaction.message.author = user;

			try {
				command.execute(reaction.message, args, true);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
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
					await member.roles.add(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
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
						await member.roles.add(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
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
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.MessageEmbed()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter(`Reactionrole - EmbedID: ${reactionRolesHeader.id}`);

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

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

	//Get the ID of the message
	const embedMessageId = reactionRolesHeader.reactionHeaderId;
	//get the ID of the channel
	const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
	//Get the channel object
	let embedChannel;
	try {
		embedChannel = msg.guild.channels.cache.get(embedChannelId);
	} catch (e) {
		msg.channel.send('Couldn\'t find an embed with this EmbedID');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guild.id, id: reactionRolesHeader.id },
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
				const owner = await msg.client.users.cache.find(user => user.id === msg.guild.ownerID);
				return owner.send(`I could not add reactions to a reactionrole-embed because I'm missing the \`Add Reactions\` permission on \`${msg.guild.name}\`.`);
			} else {
				return console.log(e);
			}
		}
	}
}
//Import Tables
const { DBReactionRolesHeader, DBReactionRoles } = require('./dbObjects');

//Import Sequelize for operations
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (reaction.message.guild.id != '800641468321759242' && reaction.message.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (reaction.message.guild.id != '800641367083974667' && reaction.message.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (reaction.message.guild.id === '800641468321759242' || reaction.message.guild.id === '800641735658176553' || reaction.message.guild.id === '800641367083974667' || reaction.message.guild.id === '800641819086946344') {
			return;
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

	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		where: { guildId: reaction.message.guild.id, reactionHeaderId: reaction.message.id }
	});

	if (dbReactionRolesHeader) {
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: reaction._emoji.name }
		});

		if (dbReactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(dbReactionRole.roleId);
			//Get member
			const member = await reaction.message.guild.members.fetch(user.id);
			//Assign role
			member.roles.add(reactionRoleObject);
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
				//Get member
				const member = await reaction.message.guild.members.fetch(user.id);
				//Assign role
				member.roles.add(reactionRoleBackupObject);
			} else {
				console.log(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
};

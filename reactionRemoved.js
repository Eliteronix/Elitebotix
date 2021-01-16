//Import Tables
const { ReactionRolesHeader, ReactionRoles } = require('./dbObjects');

//Import Sequelize for operations
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = async function (reaction, user){

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
	const reactionRolesHeader = await ReactionRolesHeader.findOne({
		where: { guildId: reaction.message.guild.id, reactionHeaderId: reaction.message.id }
	});

	if (reactionRolesHeader) {
		//Get the reactionRole from the db by all the string (works for general emojis)
		const reactionRole = await ReactionRoles.findOne({
			where: { headerId: reactionRolesHeader.reactionRolesHeaderId, emoji: reaction._emoji.name }
		});

		if (reactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(reactionRole.roleId);
			//Get member
			const member = await reaction.message.guild.members.fetch(user.id);
			//Assign role
			member.roles.remove(reactionRoleObject);
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<:' + reaction._emoji.name + ':';

			//Get the reactionRole from the db by all the string (works for general emojis)
			const reactionRoleBackup = await ReactionRoles.findOne({
				where: { headerId: reactionRolesHeader.reactionRolesHeaderId, emoji: { [Op.like]: emoji + '%' } }
			});

			if (reactionRoleBackup) {
				//Get role object
				const reactionRoleBackupObject = reaction.message.guild.roles.cache.get(reactionRoleBackup.roleId);
				//Get member
				const member = await reaction.message.guild.members.fetch(user.id);
				//Assign role
				member.roles.remove(reactionRoleBackupObject);
			} else {
				console.log(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	} else {
		console.log(`There was an error trying to get a ReactionRolesHeader from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
	}
};
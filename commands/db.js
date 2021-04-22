const { DBAutoRoles, DBDiscordUsers, DBGuilds, DBReactionRoles, DBReactionRolesHeader, DBServerUserActivity, DBTemporaryVoices, DBProcessQueue, DBActivityRoles, DBMOTDPoints } = require('../dbObjects');
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');

module.exports = {
	name: 'db',
	//aliases: ['developer'],
	description: 'Sends the data found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let data = [];
		let dbTableName;

		if (args[0] === 'autoroles') {
			const dbList = await DBAutoRoles.findAll();
			dbTableName = 'DBAutoRoles';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					roleId: dbList[i].roleId,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'discordusers') {
			const dbList = await DBDiscordUsers.findAll();
			dbTableName = 'DBDiscordUsers';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					userId: dbList[i].userId,
					osuUserId: dbList[i].osuUserId,
					osuVerificationCode: dbList[i].osuVerificationCode,
					osuVerified: dbList[i].osuVerified,
					osuName: dbList[i].osuName,
					osuPP: dbList[i].osuPP,
					osuRank: dbList[i].osuRank,
					taikoPP: dbList[i].taikoPP,
					taikoRank: dbList[i].taikoRank,
					catchPP: dbList[i].catchPP,
					catchRank: dbList[i].catchRank,
					maniaPP: dbList[i].maniaPP,
					maniaRank: dbList[i].maniaRank,
					osuMainServer: dbList[i].osuMainServer,
					osuMainMode: dbList[i].osuMainMode,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'guilds') {
			const dbList = await DBGuilds.findAll();
			dbTableName = 'DBGuilds';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					guildName: dbList[i].guildName,
					customPrefixUsed: dbList[i].customPrefixUsed,
					customPrefix: dbList[i].customPrefix,
					dadmodeEnabled: dbList[i].dadmodeEnabled,
					saluteEnabled: dbList[i].saluteEnabled,
					owoEnabled: dbList[i].owoEnabled,
					sendWelcomeMessage: dbList[i].sendWelcomeMessage,
					welcomeMessageChannel: dbList[i].welcomeMessageChannel,
					welcomeMessageText: dbList[i].welcomeMessageText,
					sendGoodbyeMessage: dbList[i].sendGoodbyeMessage,
					goodbyeMessageChannel: dbList[i].goodbyeMessageChannel,
					goodbyeMessageText: dbList[i].goodbyeMessageText,
					temporaryVoices: dbList[i].temporaryVoices,
					addTemporaryText: dbList[i].addTemporaryText,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'reactionroles') {
			const dbList = await DBReactionRoles.findAll();
			dbTableName = 'DBReactionRoles';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					dbReactionRolesHeaderId: dbList[i].dbReactionRolesHeaderId,
					roleId: dbList[i].roleId,
					emoji: dbList[i].emoji,
					description: dbList[i].description,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'reactionrolesheader') {
			const dbList = await DBReactionRolesHeader.findAll();
			dbTableName = 'DBReactionRolesHeader';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					reactionHeaderId: dbList[i].reactionHeaderId,
					reactionChannelHeaderId: dbList[i].reactionChannelHeaderId,
					reactionTitle: dbList[i].reactionTitle,
					reactionColor: dbList[i].reactionColor,
					reactionDescription: dbList[i].reactionDescription,
					reactionImage: dbList[i].reactionImage,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'serveruseractivity') {
			const dbList = await DBServerUserActivity.findAll();
			dbTableName = 'DBServerUserActivity';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					userId: dbList[i].userId,
					points: dbList[i].points,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'temporaryvoices') {
			const dbList = await DBTemporaryVoices.findAll();
			dbTableName = 'DBTemporaryVoices';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					channelId: dbList[i].channelId,
					textChannelId: dbList[i].textChannelId,
					creatorId: dbList[i].creatorId,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'processqueue') {
			const dbList = await DBProcessQueue.findAll();
			dbTableName = 'DBProcessQueue';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					task: dbList[i].task,
					priority: dbList[i].priority,
					filters: dbList[i].filters,
					additions: dbList[i].additions,
					beingExecuted: dbList[i].beingExecuted,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'activityroles') {
			const dbList = await DBActivityRoles.findAll();
			dbTableName = 'DBActivityRoles';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					guildId: dbList[i].guildId,
					roleId: dbList[i].roleId,
					rankCutoff: dbList[i].rankCutoff,
					percentageCutoff: dbList[i].percentageCutoff,
					pointsCutoff: dbList[i].pointsCutoff,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else if (args[0] === 'motdpoints') {
			const dbList = await DBMOTDPoints.findAll();
			dbTableName = 'DBMOTDPoints';

			for (let i = 0; i < dbList.length; i++) {
				data.push({
					id: dbList[i].id,
					userId: dbList[i].userId,
					osuUserId: dbList[i].osuUserId,
					osuRank: dbList[i].osuRank,
					totalPoints: dbList[i].totalPoints,
					qualifierPoints: dbList[i].qualifierPoints,
					qualifierRank: dbList[i].qualifierRank,
					qualifierPlayers: dbList[i].qualifierPlayers,
					knockoutPoints: dbList[i].knockoutPoints,
					knockoutRank: dbList[i].knockoutRank,
					knockoutPlayers: dbList[i].knockoutPlayers,
					matchDate: dbList[i].matchDate,
					paranoid: dbList[i].paranoid,
					createdAt: dbList[i].createdAt,
					updatedAt: dbList[i].updatedAt,
				});
			}
		} else {
			return msg.reply('no corresponding table found');
		}

		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		let csv = new ObjectsToCsv(data);
		csv = await csv.toString();
		// eslint-disable-next-line no-undef
		const buffer = Buffer.from(csv);
		//Create as an attachment
		// eslint-disable-next-line no-undef
		const attachment = new Discord.MessageAttachment(buffer, `${dbTableName}-${process.env.SERVER}-${process.env.PROVIDER}.csv`);
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`${dbTableName} - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, attachment);
	},
};
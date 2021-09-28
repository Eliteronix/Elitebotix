const { DBAutoRoles, DBDiscordUsers, DBGuilds, DBReactionRoles, DBReactionRolesHeader, DBServerUserActivity, DBTemporaryVoices, DBProcessQueue, DBActivityRoles, DBMOTDPoints, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBStarBoardMessages, DBTickets, DBOsuMultiScores, DBOsuBeatmaps } = require('../dbObjects');
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
		let dbList = [];

		if (args[0] === 'autoroles') {
			dbList = await DBAutoRoles.findAll();
			dbTableName = 'DBAutoRoles';
		} else if (args[0] === 'discordusers') {
			dbList = await DBDiscordUsers.findAll();
			dbTableName = 'DBDiscordUsers';
		} else if (args[0] === 'guilds') {
			dbList = await DBGuilds.findAll();
			dbTableName = 'DBGuilds';
		} else if (args[0] === 'reactionroles') {
			dbList = await DBReactionRoles.findAll();
			dbTableName = 'DBReactionRoles';
		} else if (args[0] === 'reactionrolesheader') {
			dbList = await DBReactionRolesHeader.findAll();
			dbTableName = 'DBReactionRolesHeader';
		} else if (args[0] === 'serveruseractivity') {
			dbList = await DBServerUserActivity.findAll();
			dbTableName = 'DBServerUserActivity';
		} else if (args[0] === 'temporaryvoices') {
			dbList = await DBTemporaryVoices.findAll();
			dbTableName = 'DBTemporaryVoices';
		} else if (args[0] === 'processqueue') {
			dbList = await DBProcessQueue.findAll();
			dbTableName = 'DBProcessQueue';
		} else if (args[0] === 'activityroles') {
			dbList = await DBActivityRoles.findAll();
			dbTableName = 'DBActivityRoles';
		} else if (args[0] === 'motdpoints') {
			dbList = await DBMOTDPoints.findAll();
			dbTableName = 'DBMOTDPoints';
		} else if (args[0] === 'elitiricupsignup') {
			dbList = await DBElitiriCupSignUp.findAll();
			dbTableName = 'DBElitiriCupSignUp';
		} else if (args[0] === 'elitiricupsubmissions') {
			dbList = await DBElitiriCupSubmissions.findAll();
			dbTableName = 'DBElitiriCupSubmissions';
		} else if (args[0] === 'starboardmessages') {
			dbList = await DBStarBoardMessages.findAll();
			dbTableName = 'DBStarBoardMessages';
		} else if (args[0] === 'tickets') {
			dbList = await DBTickets.findAll();
			dbTableName = 'DBTickets';
		} else if (args[0] === 'osumultiscores') {
			dbList = await DBOsuMultiScores.findAll();
			dbTableName = 'DBOsuMultiScores';
		} else if (args[0] === 'osubeatmaps') {
			dbList = await DBOsuBeatmaps.findAll();
			dbTableName = 'DBOsuBeatmaps';
		} else {
			return msg.reply('no corresponding table found');
		}

		for (let i = 0; i < dbList.length; i++) {
			data.push(dbList[i].dataValues);

			if (i % 10000 === 0 && i > 0 || dbList.length - 1 === i) {
				const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
				let csv = new ObjectsToCsv(data);
				csv = await csv.toString();
				// eslint-disable-next-line no-undef
				const buffer = Buffer.from(csv);
				//Create as an attachment
				// eslint-disable-next-line no-undef
				const attachment = new Discord.MessageAttachment(buffer, `${dbTableName}-${process.env.SERVER}-${process.env.PROVIDER}.csv`);
				// eslint-disable-next-line no-undef
				await eliteronixUser.send({ content: `${dbTableName} - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, files: [attachment] });
				data = [];
			}
		}
	},
};
const { DBAutoRoles, DBDiscordUsers, DBGuilds, DBReactionRoles, DBReactionRolesHeader, DBServerUserActivity, DBTemporaryVoices, DBProcessQueue, DBActivityRoles, DBMOTDPoints, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBStarBoardMessages, DBTickets, DBOsuMultiScores } = require('../dbObjects');
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
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'discordusers') {
			const dbList = await DBDiscordUsers.findAll();
			dbTableName = 'DBDiscordUsers';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'guilds') {
			const dbList = await DBGuilds.findAll();
			dbTableName = 'DBGuilds';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'reactionroles') {
			const dbList = await DBReactionRoles.findAll();
			dbTableName = 'DBReactionRoles';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'reactionrolesheader') {
			const dbList = await DBReactionRolesHeader.findAll();
			dbTableName = 'DBReactionRolesHeader';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'serveruseractivity') {
			const dbList = await DBServerUserActivity.findAll();
			dbTableName = 'DBServerUserActivity';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'temporaryvoices') {
			const dbList = await DBTemporaryVoices.findAll();
			dbTableName = 'DBTemporaryVoices';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'processqueue') {
			const dbList = await DBProcessQueue.findAll();
			dbTableName = 'DBProcessQueue';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'activityroles') {
			const dbList = await DBActivityRoles.findAll();
			dbTableName = 'DBActivityRoles';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'motdpoints') {
			const dbList = await DBMOTDPoints.findAll();
			dbTableName = 'DBMOTDPoints';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'elitiricupsignup') {
			const dbList = await DBElitiriCupSignUp.findAll();
			dbTableName = 'DBElitiriCupSignUp';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'elitiricupsubmissions') {
			const dbList = await DBElitiriCupSubmissions.findAll();
			dbTableName = 'DBElitiriCupSubmissions';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'starboardmessages') {
			const dbList = await DBStarBoardMessages.findAll();
			dbTableName = 'DBStarBoardMessages';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'tickets') {
			const dbList = await DBTickets.findAll();
			dbTableName = 'DBTickets';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
			}
		} else if (args[0] === 'osumultiscores') {
			const dbList = await DBOsuMultiScores.findAll();
			dbTableName = 'DBOsuMultiScores';

			for (let i = 0; i < dbList.length; i++) {
				data.push(dbList[i].dataValues);
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
const { DBAutoRoles, DBDiscordUsers, DBGuilds, DBBirthdayGuilds, DBReactionRoles, DBReactionRolesHeader, DBServerUserActivity, DBTemporaryVoices, DBProcessQueue, DBActivityRoles, DBMOTDPoints, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBStarBoardMessages, DBTickets, DBOsuMultiScores, DBOsuBeatmaps, DBElitiriCupStaff, DBElitiriCupLobbies, DBOsuTourneyFollows, DBDuelRatingHistory, DBOsuForumPosts, DBOsuTrackingUsers, DBOsuGuildTrackers } = require('../dbObjects');
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');
const { logDatabaseQueries } = require('../utils');
const { developers } = require('../config.json');

module.exports = {
	name: 'db',
	description: 'Sends the data found in the db',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!developers.includes(msg.author.id)) {
			return;
		}

		let data = [];
		let dbTableName;
		let dbList = [];

		if (args[0] === 'autoroles') {
			logDatabaseQueries(4, 'commands/db.js DBAutoRoles');
			dbList = await DBAutoRoles.findAll();
			dbTableName = 'DBAutoRoles';
		} else if (args[0] === 'discordusers') {
			logDatabaseQueries(4, 'commands/db.js DBDiscordUsers');
			dbList = await DBDiscordUsers.findAll();
			dbTableName = 'DBDiscordUsers';
		} else if (args[0] === 'guilds') {
			logDatabaseQueries(4, 'commands/db.js DBGuilds');
			dbList = await DBGuilds.findAll();
			dbTableName = 'DBGuilds';
		} else if (args[0] === 'reactionroles') {
			logDatabaseQueries(4, 'commands/db.js DBReactionRoles');
			dbList = await DBReactionRoles.findAll();
			dbTableName = 'DBReactionRoles';
		} else if (args[0] === 'reactionrolesheader') {
			logDatabaseQueries(4, 'commands/db.js DBReactionRolesHeader');
			dbList = await DBReactionRolesHeader.findAll();
			dbTableName = 'DBReactionRolesHeader';
		} else if (args[0] === 'serveruseractivity') {
			logDatabaseQueries(4, 'commands/db.js DBServerUserActivity');
			dbList = await DBServerUserActivity.findAll();
			dbTableName = 'DBServerUserActivity';
		} else if (args[0] === 'temporaryvoices') {
			logDatabaseQueries(4, 'commands/db.js DBTemporaryVoices');
			dbList = await DBTemporaryVoices.findAll();
			dbTableName = 'DBTemporaryVoices';
		} else if (args[0] === 'processqueue') {
			logDatabaseQueries(4, 'commands/db.js DBProcessQueue');
			dbList = await DBProcessQueue.findAll();
			dbTableName = 'DBProcessQueue';
		} else if (args[0] === 'activityroles') {
			logDatabaseQueries(4, 'commands/db.js DBActivityRoles');
			dbList = await DBActivityRoles.findAll();
			dbTableName = 'DBActivityRoles';
		} else if (args[0] === 'motdpoints') {
			logDatabaseQueries(4, 'commands/db.js DBMOTDPoints');
			dbList = await DBMOTDPoints.findAll();
			dbTableName = 'DBMOTDPoints';
		} else if (args[0] === 'elitiricupsignup') {
			logDatabaseQueries(4, 'commands/db.js DBElitiriCupSignUp');
			dbList = await DBElitiriCupSignUp.findAll();
			dbTableName = 'DBElitiriCupSignUp';
		} else if (args[0] === 'elitiricuplobbies') {
			logDatabaseQueries(4, 'commands/db.js DBElitiriCupLobbies');
			dbList = await DBElitiriCupLobbies.findAll();
			dbTableName = 'DBElitiriCupLobbies';
		} else if (args[0] === 'elitiricupstaff') {
			logDatabaseQueries(4, 'commands/db.js DBElitiriCupStaff');
			dbList = await DBElitiriCupStaff.findAll();
			dbTableName = 'DBElitiriCupStaff';
		} else if (args[0] === 'elitiricupsubmissions') {
			logDatabaseQueries(4, 'commands/db.js DBElitiriCupSubmissions');
			dbList = await DBElitiriCupSubmissions.findAll();
			dbTableName = 'DBElitiriCupSubmissions';
		} else if (args[0] === 'starboardmessages') {
			logDatabaseQueries(4, 'commands/db.js DBStarBoardMessages');
			dbList = await DBStarBoardMessages.findAll();
			dbTableName = 'DBStarBoardMessages';
		} else if (args[0] === 'tickets') {
			logDatabaseQueries(4, 'commands/db.js DBTickets');
			dbList = await DBTickets.findAll();
			dbTableName = 'DBTickets';
		} else if (args[0] === 'osumultiscores') {
			logDatabaseQueries(4, 'commands/db.js DBOsuMultiScores');
			dbList = await DBOsuMultiScores.findAll();
			dbTableName = 'DBOsuMultiScores';
		} else if (args[0] === 'osubeatmaps') {
			logDatabaseQueries(4, 'commands/db.js DBOsuBeatmaps');
			dbList = await DBOsuBeatmaps.findAll();
			dbTableName = 'DBOsuBeatmaps';
		} else if (args[0] === 'birthdayguilds') {
			logDatabaseQueries(4, 'commands/db.js DBBirthdayGuilds');
			dbList = await DBBirthdayGuilds.findAll();
			dbTableName = 'DBBirthdayGuilds';
		} else if (args[0] === 'osutourneyfollows') {
			logDatabaseQueries(4, 'commands/db.js DBOsuTourneyFollows');
			dbList = await DBOsuTourneyFollows.findAll();
			dbTableName = 'DBOsuTourneyFollows';
		} else if (args[0] === 'duelratinghistory') {
			logDatabaseQueries(4, 'commands/db.js DBDuelRatingHistory');
			dbList = await DBDuelRatingHistory.findAll();
			dbTableName = 'DBDuelRatingHistory';
		} else if (args[0] === 'osuforumposts') {
			logDatabaseQueries(4, 'commands/db.js DBOsuForumPosts');
			dbList = await DBOsuForumPosts.findAll();
			dbTableName = 'DBOsuForumPosts';
		} else if (args[0] === 'osutrackingusers') {
			logDatabaseQueries(4, 'commands/db.js DBOsuTrackingUsers');
			dbList = await DBOsuTrackingUsers.findAll();
			dbTableName = 'DBOsuTrackingUsers';
		} else if (args[0] === 'osuguildtrackers') {
			logDatabaseQueries(4, 'commands/db.js DBOsuGuildTrackers');
			dbList = await DBOsuGuildTrackers.findAll();
			dbTableName = 'DBOsuGuildTrackers';
		} else {
			return msg.reply('no corresponding table found');
		}

		if (dbList.length === 0) {
			return msg.reply(`no entries found in ${dbTableName}`);
		}

		for (let i = 0; i < dbList.length; i++) {
			data.push(dbList[i].dataValues);

			if (i % 10000 === 0 && i > 0 || dbList.length - 1 === i) {
				const developerUser = await msg.client.users.cache.find(user => user.id === msg.author.id);
				let csv = new ObjectsToCsv(data);
				csv = await csv.toString();
				// eslint-disable-next-line no-undef
				const buffer = Buffer.from(csv);
				//Create as an attachment
				// eslint-disable-next-line no-undef
				const attachment = new Discord.AttachmentBuilder(buffer, { name: `${dbTableName}-${process.env.SERVER}-${process.env.PROVIDER}.csv` });
				// eslint-disable-next-line no-undef
				await developerUser.send({ content: `${dbTableName} - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, files: [attachment] });
				data = [];
			}
		}
	},
};
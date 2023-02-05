const { DBOsuMultiScores, DBProcessQueue, DBDiscordUsers, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBOsuForumPosts, DBDuelRatingHistory } = require('../dbObjects');
const { pause, logDatabaseQueries, getUserDuelStarRating, cleanUpDuplicateEntries, saveOsuMultiScores, humanReadable, multiToBanchoScore, getOsuBeatmap, getMods } = require('../utils');
const osu = require('node-osu');
const { developers, currentElitiriCup } = require('../config.json');
const { Op } = require('sequelize');
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');

module.exports = {
	name: 'admin',
	description: 'Sends a message with the bots server',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (!developers.includes(msg.author.id)) {
			return;
		}

		let manageChannels = (1 << 4).toString();
		let manageGuild = (1 << 5).toString();
		let manageMessages = (1 << 13).toString();
		let manageRoles = (1 << 28).toString();

		if (args[0] === 'guildCommands') {
			const { REST, Routes } = require('discord.js');
			const fs = require('fs');

			const commands = [];
			// Grab all the command files from the commands directory you created earlier
			const commandFiles = fs.readdirSync('./commands');

			// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
			for (const file of commandFiles) {
				const command = require(`./${file}`);

				if (args.includes(command.name)) {
					commands.push(command.data.toJSON());
				}
			}

			// Construct and prepare an instance of the REST module
			// eslint-disable-next-line no-undef
			const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

			// and deploy your commands!
			(async () => {
				try {
					await msg.reply(`Started adding ${commands.length} application (/) commands.`);

					// The put method is used to fully refresh all commands in the guild with the current set
					await rest.put(
						Routes.applicationGuildCommands(msg.client.user.id, msg.guildId),
						{ body: commands },
					);

					await msg.reply(`Successfully added ${commands.length} application (/) commands.`);
				} catch (error) {
					// And of course, make sure you catch and log any errors!
					console.error(error);
				}
			})();

			return;

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-top',
			// 		description: 'Sends an info card about the topplays of the specified player',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'sorting',
			// 				'description': 'Sort your top plays by...',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Approach Rate',
			// 						'value': '--ar',
			// 					},
			// 					{
			// 						'name': 'Circle Size',
			// 						'value': '--cs',
			// 					},
			// 					{
			// 						'name': 'Overall Difficulty',
			// 						'value': '--od',
			// 					},
			// 					{
			// 						'name': 'HP Drain',
			// 						'value': '--hp',
			// 					},
			// 					{
			// 						'name': 'Beats Per Minute',
			// 						'value': '--bpm',
			// 					},
			// 					{
			// 						'name': 'Length',
			// 						'value': '--length',
			// 					},
			// 					{
			// 						'name': 'Recent',
			// 						'value': '--new',
			// 					},
			// 					{
			// 						'name': 'Star Rating',
			// 						'value': '--sr',
			// 					},
			// 					{
			// 						'name': 'Accuracy',
			// 						'value': '--acc',
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'ascending',
			// 				'description': 'Sort your top plays in ascending order?',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'True',
			// 						'value': '--asc'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of topplays to be displayed',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'gamemode',
			// 				'description': 'Gamemode',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Standard',
			// 						'value': 's',
			// 					},
			// 					{
			// 						'name': 'Mania',
			// 						'value': 'm',
			// 					},
			// 					{
			// 						'name': 'Catch The Beat',
			// 						'value': 'c',
			// 					},
			// 					{
			// 						'name': 'Taiko',
			// 						'value': 't',
			// 					},
			// 				]
			// 			}, {
			// 				'name': 'server',
			// 				'description': 'The server from which the results will be displayed',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Bancho',
			// 						'value': 'b',
			// 					},
			// 					{
			// 						'name': 'Ripple',
			// 						'value': 'r',
			// 					},
			// 					{
			// 						'name': 'Tournaments',
			// 						'value': 'tournaments',
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'csv',
			// 				'description': 'Should a csv file be attached',
			// 				'type': 5, // 5 is type BOOLEAN
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-mostplayed',
			// 		description: 'Sends an info card about the most played maps',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'Get the stats for a user',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The amount of most played maps to be displayed',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'server',
			// 						'description': 'The server from which the results will be displayed',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': 'Bancho',
			// 								'value': 'b',
			// 							},
			// 							{
			// 								'name': 'Ripple',
			// 								'value': 'r',
			// 							},
			// 							{
			// 								'name': 'Tournaments',
			// 								'value': 'tournaments',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'mode',
			// 						'description': 'The gamemode you want to get the leaderboard from (tourney only)',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			//							{
			//								'name': 'Standard',
			//								'value': 'Standard'
			//							},
			//							{
			//								'name': 'Taiko',
			//								'value': 'Taiko'
			//							},
			//							{
			//								'name': 'Catch the Beat',
			//								'value': 'Catch the Beat'
			//							},
			//							{
			//								'name': 'Mania',
			//								'value': 'Mania'
			//							},
			//						]
			// 					},
			// 					{
			// 						'name': 'username',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username2',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username3',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username4',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username5',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'tourneybeatmaps',
			// 				'description': 'Get the stats for a beatmap',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The amount of most played maps to be displayed',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'page',
			// 						'description': 'The page of the results',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'dontfiltermm',
			// 						'description': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
			// 						'type': 5, // 5 is type BOOLEAN
			// 						'required': false
			// 					},
			// 					// {
			// 					// 	'name': 'modpool',
			// 					// 	'description': 'The modpool the maps appeared in',
			// 					// 	'type': 3,
			// 					// 	'required': false,
			// 					// 	'choices': [
			// 					// 		{
			// 					// 			'name': 'NM',
			// 					// 			'value': 'NM',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'HD',
			// 					// 			'value': 'HD',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'HR',
			// 					// 			'value': 'HR',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'DT',
			// 					// 			'value': 'DT',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'FM',
			// 					// 			'value': 'FM',
			// 					// 		}
			// 					// 	]
			// 					// },
			// 					{
			// 						'name': 'csv',
			// 						'description': 'Should a csv file be attached',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-tournament',
			// 		description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'acronym',
			// 				'description': 'The acronym of the tournament',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-track',
			// 		description: 'Tracks new scores/matches set by the specified users / acronym',
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
			// 		options: [
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Lets you add a new user to track',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'usernames',
			// 						'description': 'The user(s) to track (separate them with a \',\')',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'topplays',
			// 						'description': '1 = std, 2 = taiko, 3 = catch, 4 = mania & 5 = tourneys; e.g. \'125\' for std, taiko & tourneys',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'leaderboardplays',
			// 						'description': 'Which modes should be tracked',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'osu! only',
			// 								'value': 'o',
			// 							},
			// 							{
			// 								'name': 'taiko only',
			// 								'value': 't',
			// 							},
			// 							{
			// 								'name': 'catch only',
			// 								'value': 'c',
			// 							},
			// 							{
			// 								'name': 'mania only',
			// 								'value': 'm',
			// 							},
			// 							{
			// 								'name': 'osu! & taiko',
			// 								'value': 'ot',
			// 							},
			// 							{
			// 								'name': 'osu! & catch',
			// 								'value': 'oc',
			// 							},
			// 							{
			// 								'name': 'osu! & mania',
			// 								'value': 'om',
			// 							},
			// 							{
			// 								'name': 'taiko & catch',
			// 								'value': 'tc',
			// 							},
			// 							{
			// 								'name': 'taiko & mania',
			// 								'value': 'tm',
			// 							},
			// 							{
			// 								'name': 'catch & mania',
			// 								'value': 'cm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & catch',
			// 								'value': 'otc',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & mania',
			// 								'value': 'otm',
			// 							},
			// 							{
			// 								'name': 'osu!, catch & mania',
			// 								'value': 'ocm',
			// 							},
			// 							{
			// 								'name': 'taiko, catch & mania',
			// 								'value': 'tcm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko, catch & mania',
			// 								'value': 'otcm',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'ameobea',
			// 						'description': 'Which modes should be updated for ameobea.me/osutrack/',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'osu! only',
			// 								'value': 'o',
			// 							},
			// 							{
			// 								'name': 'taiko only',
			// 								'value': 't',
			// 							},
			// 							{
			// 								'name': 'catch only',
			// 								'value': 'c',
			// 							},
			// 							{
			// 								'name': 'mania only',
			// 								'value': 'm',
			// 							},
			// 							{
			// 								'name': 'osu! & taiko',
			// 								'value': 'ot',
			// 							},
			// 							{
			// 								'name': 'osu! & catch',
			// 								'value': 'oc',
			// 							},
			// 							{
			// 								'name': 'osu! & mania',
			// 								'value': 'om',
			// 							},
			// 							{
			// 								'name': 'taiko & catch',
			// 								'value': 'tc',
			// 							},
			// 							{
			// 								'name': 'taiko & mania',
			// 								'value': 'tm',
			// 							},
			// 							{
			// 								'name': 'catch & mania',
			// 								'value': 'cm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & catch',
			// 								'value': 'otc',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & mania',
			// 								'value': 'otm',
			// 							},
			// 							{
			// 								'name': 'osu!, catch & mania',
			// 								'value': 'ocm',
			// 							},
			// 							{
			// 								'name': 'taiko, catch & mania',
			// 								'value': 'tcm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko, catch & mania',
			// 								'value': 'otcm',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'showameobeaupdate',
			// 						'description': 'Should messages be sent when ameobea is updated',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'medals',
			// 						'description': 'Should achieved medals be tracked',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'duelrating',
			// 						'description': 'Should duel rating changes be tracked',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'matchactivity',
			// 						'description': 'Should matches be tracked',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'Notify on matches',
			// 								'value': 'matches',
			// 							},
			// 							{
			// 								'name': 'Notify on matches and auto matchtrack',
			// 								'value': 'matches (auto matchtrack)',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'acronym',
			// 						'description': 'The acronyms to track (separate with \',\')',
			// 						'type': 3,
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'tourneyenable',
			// 				'description': 'Lets you add an acronym to track',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'acronym',
			// 						'description': 'The acronym to track',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'matchactivity',
			// 						'description': 'Should matches be tracked',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Notify on matches',
			// 								'value': 'matches',
			// 							},
			// 							{
			// 								'name': 'Notify on matches and auto matchtrack',
			// 								'value': 'matches (auto matchtrack)',
			// 							},
			// 						]
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Stop tracking a user',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'usernames',
			// 						'description': 'The user(s) to stop tracking (separate them with a \',\')',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'topplays',
			// 						'description': 'Stop tracking top plays',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'leaderboardplays',
			// 						'description': 'Stop tracking leaderboard plays',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'ameobea',
			// 						'description': 'Stop tracking ameobea updates',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'showameobeaupdates',
			// 						'description': 'Stop tracking showing ameobea updates',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'medals',
			// 						'description': 'Stop tracking medals',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'duelrating',
			// 						'description': 'Stop tracking duel rating changes',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'matchactivity',
			// 						'description': 'Stop tracking match activity',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'acronym',
			// 						'description': 'Stop tracking only these acronyms',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'tourneydisable',
			// 				'description': 'Lets you remove an acronym to track',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'acronym',
			// 						'description': 'The acronym to stop tracking',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'list',
			// 				'description': 'Show which users/acronyms are being tracked in the channel',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// let wrappedYears = [];

			// for (let i = 2018; i <= new Date().getFullYear() - 1; i++) {
			// 	wrappedYears.push({
			// 		'name': i.toString(),
			// 		'value': i,
			// 	});
			// }

			// wrappedYears.reverse();

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-wrapped',
			// 		description: 'Sums up the year in osu! for a user',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'year',
			// 				'description': 'The year to get the wrapped for',
			// 				'type': 4,
			// 				'required': false,
			// 				'choices': wrappedYears
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'pat',
			// 		description: 'Lets you send a gif to pat a user',
			// 		dm_permission: false,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'poll',
			// 		description: 'Start a vote / poll',
			// 		dm_permission: false,
			// 		options: [
			// 			{
			// 				'name': 'topic',
			// 				'description': 'The poll topic',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'option1',
			// 				'description': 'The first option of the poll',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'option2',
			// 				'description': 'The second option of the poll',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the end of the poll',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the end of the poll',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the end of the poll',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the end of the poll',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the end of the poll',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option3',
			// 				'description': 'The third option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option4',
			// 				'description': 'The fourth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option5',
			// 				'description': 'The fifth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option6',
			// 				'description': 'The sixth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option7',
			// 				'description': 'The seventh option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option8',
			// 				'description': 'The eigth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option9',
			// 				'description': 'The ninth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option10',
			// 				'description': 'The tenth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'prune',
			// 		description: 'Delete recent messages',
			// 		dm_permission: false,
			// 		default_member_permissions: manageMessages,
			// 		options: [
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of messages to delete',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reactionrole',
			// 		description: 'Set up roles that users can assign themselves',
			// 		dm_permission: false,
			// 		default_member_permissions: manageRoles,
			// 		options: [
			// 			{
			// 				'name': 'embedadd',
			// 				'description': 'Create a new embed for reactionroles',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'name',
			// 						'description': 'The name of the embed',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'embedremove',
			// 				'description': 'Remove an existing embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'embedchange',
			// 				'description': 'Change an existing embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'property',
			// 						'description': 'The property to change',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Title',
			// 								'value': 'title'
			// 							},
			// 							{
			// 								'name': 'Description',
			// 								'value': 'description'
			// 							},
			// 							{
			// 								'name': 'Color',
			// 								'value': 'color'
			// 							},
			// 							{
			// 								'name': 'Image',
			// 								'value': 'image'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'value',
			// 						'description': 'The new title/description/color/image URL',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'roleadd',
			// 				'description': 'Add a role to an embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji to represent the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'role',
			// 						'description': 'The emoji to represent the role',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'description',
			// 						'description': 'The description for the reactionrole',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'roleremove',
			// 				'description': 'Remove an existing reactionrole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji that represents the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'rolechange',
			// 				'description': 'Change an existing reactionrole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji that represents the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'property',
			// 						'description': 'The property to change',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Emoji',
			// 								'value': 'emoji'
			// 							},
			// 							{
			// 								'name': 'Description',
			// 								'value': 'description'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'value',
			// 						'description': 'The new emoji/description',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders',
			// 		description: 'Sends your set reminders',
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders-delete',
			// 		description: 'Delete a selected reminder',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using /reminders command)',
			// 				'type': 4,
			// 				'required': true
			// 			}
			// 		],
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders-edit',
			// 		description: 'Edit your reminders',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using /reminders command)',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'message',
			// 				'description': 'The message of the reminder',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'years',
			// 				'description': 'The years until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'remindme',
			// 		description: 'Sends a reminder at the specified time',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'message',
			// 				'description': 'The message of the reminder',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'years',
			// 				'description': 'The years until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the reminder',
			// 				'type': 4,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'roll',
			// 		description: 'Rolls a number between 1 and 100 or 1 and the number specified',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'maximum',
			// 				'description': 'The maximum number you can roll',
			// 				'type': 4,
			// 				'required': false
			// 			}
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'rollgame',
			// 		description: 'Start a round of rollgame'
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'server-info',
			// 		description: 'Sends an info card about the server'
			// 		dm_permission: false,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'settings',
			// 		description: 'Sends an info card about the settings of the bot for the server'
			// 		dm_permission: false,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ship',
			// 		description: 'Lets you check how compatible two users are.',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user or name to ship',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user or name to ship',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'slap',
			// 		description: 'Lets you send a gif to slap a user',
			// 		dm_permission: false,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'starboard',
			// 		description: 'Highlight favourite messages with a star emoji!',
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
			// 		options: [
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Enable the starboard for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Disable the starboard for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'channel',
			// 				'description': 'Set the starboard channel where starred messages get sent to',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'channel',
			// 						'description': 'The channel to send messages to',
			// 						'type': 7, // 7 is type CHANNEL
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'minimum',
			// 				'description': 'Set the minimum amount of stars needed to highlight',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The minimum amount of stars needed',
			// 						'type': 4,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'tempvoice',
			// 		description: 'Create temporary voice- and textchannels',
			// 		dm_permission: false,
			// 		default_member_permissions: manageChannels,
			// 		options: [
			// 			{
			// 				'name': 'enablevoice',
			// 				'description': 'Enable temporary voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disablevoice',
			// 				'description': 'Disable temporary voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'enabletext',
			// 				'description': 'Enable temporary textchannels along voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disabletext',
			// 				'description': 'Disable temporary textchannels along voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ticket',
			// 		description: 'Create and manage tickets',
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
			// 		options: [
			// 			{
			// 				'name': 'create',
			// 				'description': 'Create a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'issue',
			// 						'description': 'The issue description for your ticket',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'state',
			// 				'description': 'Manage a ticket\'s workflow state',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'state',
			// 						'description': 'The ticket\'s workflow state',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Responded',
			// 								'value': 'responded'
			// 							},
			// 							{
			// 								'name': 'In action',
			// 								'value': 'action'
			// 							},
			// 							{
			// 								'name': 'Close',
			// 								'value': 'close'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'addrole',
			// 				'description': 'Add a role to a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to add to the ticket',
			// 						'type': 8,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'removerole',
			// 				'description': 'Remove a role from a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to remove from the ticket',
			// 						'type': 8,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'time',
			// 		description: 'Sends current time of the given location',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'location',
			// 				'description': 'The location of which you want to find out the time',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'tournament-feed',
			// 		description: 'Toggles receiving new tournament notifications',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'togglenotifications',
			// 				'description': 'Toggles receiving notifications',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'settings',
			// 				'description': 'Update your settings with this command',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'gamemode',
			// 						'description': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'badged',
			// 						'description': 'Should you only get notifications for badged tournaments',
			// 						'type': 5, // 5 is type BOOLEAN
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'maxrank',
			// 						'description': 'Example: 10000 = tournaments that allow 4 digits to play will not be shown',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'twitch',
			// 		description: 'Allows control of the twitch integration',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'connect',
			// 				'description': 'Allows you to connect your twitch account to the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'Your twitch name as found in your URL',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'disconnect',
			// 				'description': 'Removes the currently connected twitch account',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'togglemp',
			// 				'description': 'Toggle the !mp command',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'togglemapsync',
			// 				'description': 'Toggle the twitch to osu! map sync',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'user-profile',
			// 		description: 'Sends an info card about the specified user',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'weather-set',
			// 		description: 'Allows you to set the default degree type/location for the weather command',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'location',
			// 				'description': 'The location name or zip',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location name or zip',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'unit',
			// 				'description': 'The unit that should be used',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The unit that should be used',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							},
			// 						]
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'weather-track',
			// 		description: 'Get hourly/daily weather updates for a specified location',
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
			// 		options: [
			// 			{
			// 				'name': 'list',
			// 				'description': 'List the currently tracked locations',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'add',
			// 				'description': 'Track a new location',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location or zipcode to track',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'frequency',
			// 						'description': 'The tracking frequency',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Daily',
			// 								'value': 'daily'
			// 							},
			// 							{
			// 								'name': 'Hourly',
			// 								'value': 'hourly'
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The tracking unit',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Stop tracking a location',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The tracking unit',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location or zipcode to track',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 		]
			// 	},
			// });
		} else if (args[0] === 'globalCommands') {
			const { REST, Routes } = require('discord.js');
			const fs = require('node:fs');

			const commands = [];
			// Grab all the command files from the commands directory you created earlier
			const commandFiles = fs.readdirSync('./commands');

			// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
			for (const file of commandFiles) {
				const command = require(`./${file}`);

				if (command.tags !== 'debug' && command.data) {
					commands.push(command.data.toJSON());
				}
			}

			// Construct and prepare an instance of the REST module
			// eslint-disable-next-line no-undef
			const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

			// and deploy your commands!
			(async () => {
				try {
					await msg.reply(`Started refreshing ${commands.length} application (/) commands.`);

					// The put method is used to fully refresh all commands in the guild with the current set
					const data = await rest.put(
						Routes.applicationCommands(msg.client.user.id),
						{ body: commands },
					);

					await msg.reply(`Successfully reloaded ${data.length} application (/) commands.`);
				} catch (error) {
					// And of course, make sure you catch and log any errors!
					console.error(error);
				}
			})();

			return;

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-top',
					description: 'Sends an info card about the topplays of the specified player',
					dm_permission: true,
					options: [
						{
							'name': 'sorting',
							'description': 'Sort your top plays by...',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Approach Rate',
									'value': '--ar',
								},
								{
									'name': 'Circle Size',
									'value': '--cs',
								},
								{
									'name': 'Overall Difficulty',
									'value': '--od',
								},
								{
									'name': 'HP Drain',
									'value': '--hp',
								},
								{
									'name': 'Beats Per Minute',
									'value': '--bpm',
								},
								{
									'name': 'Length',
									'value': '--length',
								},
								{
									'name': 'Recent',
									'value': '--new',
								},
								{
									'name': 'Star Rating',
									'value': '--sr',
								},
								{
									'name': 'Accuracy',
									'value': '--acc',
								},
							]
						},
						{
							'name': 'ascending',
							'description': 'Sort your top plays in ascending order?',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'True',
									'value': '--asc'
								},
							]
						},
						{
							'name': 'amount',
							'description': 'The amount of topplays to be displayed',
							'type': 4,
							'required': false
						},
						{
							'name': 'gamemode',
							'description': 'Gamemode',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Standard',
									'value': 's',
								},
								{
									'name': 'Mania',
									'value': 'm',
								},
								{
									'name': 'Catch The Beat',
									'value': 'c',
								},
								{
									'name': 'Taiko',
									'value': 't',
								},
							]
						}, {
							'name': 'server',
							'description': 'The server from which the results will be displayed',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Bancho',
									'value': 'b',
								},
								{
									'name': 'Ripple',
									'value': 'r',
								},
								{
									'name': 'Tournaments',
									'value': 'tournaments',
								},
							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'csv',
							'description': 'Should a csv file be attached',
							'type': 5, // 5 is type BOOLEAN
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-mostplayed',
					description: 'Sends an info card about the most played maps',
					dm_permission: true,
					options: [
						{
							'name': 'user',
							'description': 'Get the stats for a user',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'amount',
									'description': 'The amount of most played maps to be displayed',
									'type': 4,
									'required': false
								},
								{
									'name': 'server',
									'description': 'The server from which the results will be displayed',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': 'Bancho',
											'value': 'b',
										},
										{
											'name': 'Ripple',
											'value': 'r',
										},
										{
											'name': 'Tournaments',
											'value': 'tournaments',
										},
									]
								},
								{
									'name': 'mode',
									'description': 'The gamemode you want to get the leaderboard from (tourney only)',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': 'Standard',
											'value': 'Standard'
										},
										{
											'name': 'Taiko',
											'value': 'Taiko'
										},
										{
											'name': 'Catch the Beat',
											'value': 'Catch the Beat'
										},
										{
											'name': 'Mania',
											'value': 'Mania'
										},
									]
								},
								{
									'name': 'username',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username2',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username3',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username4',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username5',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
							]
						},
						{
							'name': 'tourneybeatmaps',
							'description': 'Get the stats for a beatmap',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'amount',
									'description': 'The amount of most played maps to be displayed',
									'type': 4,
									'required': false
								},
								{
									'name': 'page',
									'description': 'The page of the results',
									'type': 4,
									'required': false
								},
								{
									'name': 'dontfiltermm',
									'description': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								// {
								// 	'name': 'modpool',
								// 	'description': 'The modpool the maps appeared in',
								// 	'type': 3,
								// 	'required': false,
								// 	'choices': [
								// 		{
								// 			'name': 'NM',
								// 			'value': 'NM',
								// 		},
								// 		{
								// 			'name': 'HD',
								// 			'value': 'HD',
								// 		},
								// 		{
								// 			'name': 'HR',
								// 			'value': 'HR',
								// 		},
								// 		{
								// 			'name': 'DT',
								// 			'value': 'DT',
								// 		},
								// 		{
								// 			'name': 'FM',
								// 			'value': 'FM',
								// 		}
								// 	]
								// },
								{
									'name': 'csv',
									'description': 'Should a csv file be attached',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-tournament',
					description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
					dm_permission: true,
					options: [
						{
							'name': 'acronym',
							'description': 'The acronym of the tournament',
							'type': 3,
							'required': true
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-track',
					description: 'Tracks new scores/matches set by the specified users / acronym',
					dm_permission: false,
					default_member_permissions: manageGuild,
					options: [
						{
							'name': 'enable',
							'description': 'Lets you add a new user to track',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'usernames',
									'description': 'The user(s) to track (separate them with a \',\')',
									'type': 3,
									'required': true
								},
								{
									'name': 'topplays',
									'description': '1 = std, 2 = taiko, 3 = catch, 4 = mania & 5 = tourneys; e.g. \'125\' for std, taiko & tourneys',
									'type': 3,
								},
								{
									'name': 'leaderboardplays',
									'description': 'Which modes should be tracked',
									'type': 3,
									'choices': [
										{
											'name': 'osu! only',
											'value': 'o',
										},
										{
											'name': 'taiko only',
											'value': 't',
										},
										{
											'name': 'catch only',
											'value': 'c',
										},
										{
											'name': 'mania only',
											'value': 'm',
										},
										{
											'name': 'osu! & taiko',
											'value': 'ot',
										},
										{
											'name': 'osu! & catch',
											'value': 'oc',
										},
										{
											'name': 'osu! & mania',
											'value': 'om',
										},
										{
											'name': 'taiko & catch',
											'value': 'tc',
										},
										{
											'name': 'taiko & mania',
											'value': 'tm',
										},
										{
											'name': 'catch & mania',
											'value': 'cm',
										},
										{
											'name': 'osu!, taiko & catch',
											'value': 'otc',
										},
										{
											'name': 'osu!, taiko & mania',
											'value': 'otm',
										},
										{
											'name': 'osu!, catch & mania',
											'value': 'ocm',
										},
										{
											'name': 'taiko, catch & mania',
											'value': 'tcm',
										},
										{
											'name': 'osu!, taiko, catch & mania',
											'value': 'otcm',
										},
									]
								},
								{
									'name': 'ameobea',
									'description': 'Which modes should be updated for ameobea.me/osutrack/',
									'type': 3,
									'choices': [
										{
											'name': 'osu! only',
											'value': 'o',
										},
										{
											'name': 'taiko only',
											'value': 't',
										},
										{
											'name': 'catch only',
											'value': 'c',
										},
										{
											'name': 'mania only',
											'value': 'm',
										},
										{
											'name': 'osu! & taiko',
											'value': 'ot',
										},
										{
											'name': 'osu! & catch',
											'value': 'oc',
										},
										{
											'name': 'osu! & mania',
											'value': 'om',
										},
										{
											'name': 'taiko & catch',
											'value': 'tc',
										},
										{
											'name': 'taiko & mania',
											'value': 'tm',
										},
										{
											'name': 'catch & mania',
											'value': 'cm',
										},
										{
											'name': 'osu!, taiko & catch',
											'value': 'otc',
										},
										{
											'name': 'osu!, taiko & mania',
											'value': 'otm',
										},
										{
											'name': 'osu!, catch & mania',
											'value': 'ocm',
										},
										{
											'name': 'taiko, catch & mania',
											'value': 'tcm',
										},
										{
											'name': 'osu!, taiko, catch & mania',
											'value': 'otcm',
										},
									]
								},
								{
									'name': 'showameobeaupdate',
									'description': 'Should messages be sent when ameobea is updated',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'medals',
									'description': 'Should achieved medals be tracked',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'duelrating',
									'description': 'Should duel rating changes be tracked',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'matchactivity',
									'description': 'Should matches be tracked',
									'type': 3,
									'choices': [
										{
											'name': 'Notify on matches',
											'value': 'matches',
										},
										{
											'name': 'Notify on matches and auto matchtrack',
											'value': 'matches (auto matchtrack)',
										},
									]
								},
								{
									'name': 'acronym',
									'description': 'The acronyms to track (separate with \',\')',
									'type': 3,
								},
							]
						},
						{
							'name': 'tourneyenable',
							'description': 'Lets you add an acronym to track',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'acronym',
									'description': 'The acronym to track',
									'type': 3,
									'required': true
								},
								{
									'name': 'matchactivity',
									'description': 'Should matches be tracked',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Notify on matches',
											'value': 'matches',
										},
										{
											'name': 'Notify on matches and auto matchtrack',
											'value': 'matches (auto matchtrack)',
										},
									]
								},
							]
						},
						{
							'name': 'disable',
							'description': 'Stop tracking a user',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'usernames',
									'description': 'The user(s) to stop tracking (separate them with a \',\')',
									'type': 3,
									'required': true
								},
								{
									'name': 'topplays',
									'description': 'Stop tracking top plays',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'leaderboardplays',
									'description': 'Stop tracking leaderboard plays',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'ameobea',
									'description': 'Stop tracking ameobea updates',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'showameobeaupdates',
									'description': 'Stop tracking showing ameobea updates',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'medals',
									'description': 'Stop tracking medals',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'duelrating',
									'description': 'Stop tracking duel rating changes',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'matchactivity',
									'description': 'Stop tracking match activity',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'acronym',
									'description': 'Stop tracking only these acronyms',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'tourneydisable',
							'description': 'Lets you remove an acronym to track',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'acronym',
									'description': 'The acronym to stop tracking',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'list',
							'description': 'Show which users/acronyms are being tracked in the channel',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			let wrappedYears = [];

			for (let i = 2018; i <= new Date().getFullYear() - 1; i++) {
				wrappedYears.push({
					'name': i.toString(),
					'value': i,
				});
			}

			wrappedYears.reverse();

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-wrapped',
					description: 'Sums up the year in osu! for a user',
					dm_permission: true,
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'year',
							'description': 'The year to get the wrapped for',
							'type': 4,
							'required': false,
							'choices': wrappedYears
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'pat',
					description: 'Lets you send a gif to pat a user',
					dm_permission: false,
					options: [
						{
							'name': 'user',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'poll',
					description: 'Start a vote / poll',
					dm_permission: false,
					options: [
						{
							'name': 'topic',
							'description': 'The poll topic',
							'type': 3,
							'required': true
						},
						{
							'name': 'option1',
							'description': 'The first option of the poll',
							'type': 3,
							'required': true
						},
						{
							'name': 'option2',
							'description': 'The second option of the poll',
							'type': 3,
							'required': true
						},
						{
							'name': 'months',
							'description': 'The months until the end of the poll',
							'type': 4,
							'required': false
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the end of the poll',
							'type': 4,
							'required': false
						},
						{
							'name': 'days',
							'description': 'The days until the end of the poll',
							'type': 4,
							'required': false
						},
						{
							'name': 'hours',
							'description': 'The hours until the end of the poll',
							'type': 4,
							'required': false
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the end of the poll',
							'type': 4,
							'required': false
						},
						{
							'name': 'option3',
							'description': 'The third option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option4',
							'description': 'The fourth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option5',
							'description': 'The fifth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option6',
							'description': 'The sixth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option7',
							'description': 'The seventh option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option8',
							'description': 'The eigth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option9',
							'description': 'The ninth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option10',
							'description': 'The tenth option of the poll',
							'type': 3,
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'prune',
					description: 'Delete recent messages',
					dm_permission: false,
					default_member_permissions: manageMessages,
					options: [
						{
							'name': 'amount',
							'description': 'The amount of messages to delete',
							'type': 4,
							'required': true
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reactionrole',
					description: 'Set up roles that users can assign themselves',
					dm_permission: false,
					default_member_permissions: manageRoles,
					options: [
						{
							'name': 'embedadd',
							'description': 'Create a new embed for reactionroles',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'name',
									'description': 'The name of the embed',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'embedremove',
							'description': 'Remove an existing embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								}
							]
						},
						{
							'name': 'embedchange',
							'description': 'Change an existing embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'property',
									'description': 'The property to change',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Title',
											'value': 'title'
										},
										{
											'name': 'Description',
											'value': 'description'
										},
										{
											'name': 'Color',
											'value': 'color'
										},
										{
											'name': 'Image',
											'value': 'image'
										}
									]
								},
								{
									'name': 'value',
									'description': 'The new title/description/color/image URL',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'roleadd',
							'description': 'Add a role to an embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji to represent the role',
									'type': 3,
									'required': true
								},
								{
									'name': 'role',
									'description': 'The emoji to represent the role',
									'type': 8, // 8 is type ROLE
									'required': true
								},
								{
									'name': 'description',
									'description': 'The description for the reactionrole',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'roleremove',
							'description': 'Remove an existing reactionrole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji that represents the role',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'rolechange',
							'description': 'Change an existing reactionrole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji that represents the role',
									'type': 3,
									'required': true
								},
								{
									'name': 'property',
									'description': 'The property to change',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Emoji',
											'value': 'emoji'
										},
										{
											'name': 'Description',
											'value': 'description'
										}
									]
								},
								{
									'name': 'value',
									'description': 'The new emoji/description',
									'type': 3,
									'required': true,
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders',
					description: 'Sends your set reminders',
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders-delete',
					description: 'Delete a selected reminder',
					dm_permission: true,
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using /reminders command)',
							'type': 4,
							'required': true
						}
					],
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders-edit',
					description: 'Edit your reminders',
					dm_permission: true,
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using /reminders command)',
							'type': 4,
							'required': true
						},
						{
							'name': 'message',
							'description': 'The message of the reminder',
							'type': 3,
							'required': true
						},
						{
							'name': 'years',
							'description': 'The years until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'months',
							'description': 'The months until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'days',
							'description': 'The days until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'hours',
							'description': 'The hours until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the reminder',
							'type': 4,
							'required': false,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'remindme',
					description: 'Sends a reminder at the specified time',
					dm_permission: true,
					options: [
						{
							'name': 'message',
							'description': 'The message of the reminder',
							'type': 3,
							'required': true
						},
						{
							'name': 'years',
							'description': 'The years until the reminder',
							'type': 4,
						},
						{
							'name': 'months',
							'description': 'The months until the reminder',
							'type': 4,
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the reminder',
							'type': 4,
						},
						{
							'name': 'days',
							'description': 'The days until the reminder',
							'type': 4,
						},
						{
							'name': 'hours',
							'description': 'The hours until the reminder',
							'type': 4,
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the reminder',
							'type': 4,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'roll',
					description: 'Rolls a number between 1 and 100 or 1 and the number specified',
					dm_permission: true,
					options: [
						{
							'name': 'maximum',
							'description': 'The maximum number you can roll',
							'type': 4,
							'required': false
						}
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'rollgame',
					description: 'Start a round of rollgame',
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'server-info',
					description: 'Sends an info card about the server',
					dm_permission: false,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'settings',
					description: 'Sends an info card about the settings of the bot for the server',
					dm_permission: false,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ship',
					description: 'Lets you check how compatible two users are.',
					dm_permission: true,
					options: [
						{
							'name': 'user',
							'description': 'The user or name to ship',
							'type': 3,
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user or name to ship',
							'type': 3,
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'slap',
					description: 'Lets you send a gif to slap a user',
					dm_permission: false,
					options: [
						{
							'name': 'user',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'starboard',
					description: 'Highlight favourite messages with a star emoji!',
					dm_permission: false,
					default_member_permissions: manageGuild,
					options: [
						{
							'name': 'enable',
							'description': 'Enable the starboard for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disable',
							'description': 'Disable the starboard for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'channel',
							'description': 'Set the starboard channel where starred messages get sent to',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'channel',
									'description': 'The channel to send messages to',
									'type': 7, // 7 is type CHANNEL
									'required': true
								}
							]
						},
						{
							'name': 'minimum',
							'description': 'Set the minimum amount of stars needed to highlight',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'amount',
									'description': 'The minimum amount of stars needed',
									'type': 4,
									'required': true
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'tempvoice',
					description: 'Create temporary voice- and textchannels',
					dm_permission: false,
					default_member_permissions: manageChannels,
					options: [
						{
							'name': 'enablevoice',
							'description': 'Enable temporary voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disablevoice',
							'description': 'Disable temporary voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'enabletext',
							'description': 'Enable temporary textchannels along voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disabletext',
							'description': 'Disable temporary textchannels along voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ticket',
					description: 'Create and manage tickets',
					dm_permission: false,
					default_member_permissions: manageGuild,
					options: [
						{
							'name': 'create',
							'description': 'Create a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'issue',
									'description': 'The issue description for your ticket',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'state',
							'description': 'Manage a ticket\'s workflow state',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'state',
									'description': 'The ticket\'s workflow state',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Responded',
											'value': 'responded'
										},
										{
											'name': 'In action',
											'value': 'action'
										},
										{
											'name': 'Close',
											'value': 'close'
										}
									]
								}
							]
						},
						{
							'name': 'addrole',
							'description': 'Add a role to a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role to add to the ticket',
									'type': 8,
									'required': true,
								}
							]
						},
						{
							'name': 'removerole',
							'description': 'Remove a role from a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role to remove from the ticket',
									'type': 8,
									'required': true,
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'time',
					description: 'Sends current time of the given location',
					dm_permission: true,
					options: [
						{
							'name': 'location',
							'description': 'The location of which you want to find out the time',
							'type': 3,
							'required': true
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'tournament-feed',
					description: 'Toggles receiving new tournament notifications',
					dm_permission: true,
					options: [
						{
							'name': 'togglenotifications',
							'description': 'Toggles receiving notifications',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'settings',
							'description': 'Update your settings with this command',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'gamemode',
									'description': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
									'type': 3,
									'required': false
								},
								{
									'name': 'badged',
									'description': 'Should you only get notifications for badged tournaments',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								{
									'name': 'maxrank',
									'description': 'Example: 10000 = tournaments that allow 4 digits to play will not be shown',
									'type': 4,
									'required': false
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'twitch',
					description: 'Allows control of the twitch integration',
					dm_permission: true,
					options: [
						{
							'name': 'connect',
							'description': 'Allows you to connect your twitch account to the bot',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'Your twitch name as found in your URL',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'disconnect',
							'description': 'Removes the currently connected twitch account',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'togglemp',
							'description': 'Toggle the !mp command',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'togglemapsync',
							'description': 'Toggle the twitch to osu! map sync',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'user-profile',
					description: 'Sends an info card about the specified user',
					dm_permission: true,
					options: [
						{
							'name': 'user',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user2',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'weather-set',
					description: 'Allows you to set the default degree type/location for the weather command',
					dm_permission: true,
					options: [
						{
							'name': 'location',
							'description': 'The location name or zip',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'location',
									'description': 'The location name or zip',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'unit',
							'description': 'The unit that should be used',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'unit',
									'description': 'The unit that should be used',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										},
									]
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'weather-track',
					description: 'Get hourly/daily weather updates for a specified location',
					dm_permission: false,
					default_member_permissions: manageGuild,
					options: [
						{
							'name': 'list',
							'description': 'List the currently tracked locations',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'add',
							'description': 'Track a new location',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'location',
									'description': 'The location or zipcode to track',
									'type': 3,
									'required': true
								},
								{
									'name': 'frequency',
									'description': 'The tracking frequency',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Daily',
											'value': 'daily'
										},
										{
											'name': 'Hourly',
											'value': 'hourly'
										},
									]
								},
								{
									'name': 'unit',
									'description': 'The tracking unit',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										}
									]
								}
							]
						},
						{
							'name': 'remove',
							'description': 'Stop tracking a location',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'unit',
									'description': 'The tracking unit',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										}
									]
								},
								{
									'name': 'location',
									'description': 'The location or zipcode to track',
									'type': 3,
									'required': true
								},
							]
						},
					]
				},
			});
		} else if (args[0] === 'saveMultiMatches') {
			const processQueueTasks = await DBProcessQueue.findAll({ where: { task: 'saveMultiMatches' } });
			for (let i = 0; i < processQueueTasks.length; i++) {
				await processQueueTasks[i].destroy();
			}

			let now = new Date();
			DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${args[1]}`, priority: 2, date: now });
		} else if (args[0] === 'removeOsuUserConnection') {
			let DBDiscordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: args[1], osuVerified: true }
			});

			if (DBDiscordUser) {
				DBDiscordUser.osuUserId = null;
				DBDiscordUser.osuVerificationCode = null;
				DBDiscordUser.osuVerified = false;
				DBDiscordUser.osuName = null;
				DBDiscordUser.osuBadges = 0;
				DBDiscordUser.osuPP = null;
				DBDiscordUser.osuRank = null;
				DBDiscordUser.taikoPP = null;
				DBDiscordUser.taikoRank = null;
				DBDiscordUser.catchPP = null;
				DBDiscordUser.catchRank = null;
				DBDiscordUser.maniaPP = null;
				DBDiscordUser.maniaRank = null;
				DBDiscordUser.save();
				// eslint-disable-next-line no-console
				console.log('Removed osuUserId and verification for:', args[1]);
			} else {
				msg.reply('User not found');
			}
		} else if (args[0] === 'deleteElitiriSignup') {
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { id: args[1] }
			});

			if (DBElitiriSignup) {
				DBElitiriSignup.destroy();
				// eslint-disable-next-line no-console
				console.log('Deleted Elitiri Signup:', args[1]);
			} else {
				msg.reply('Signup not found');
			}
		} else if (args[0] === 'updateElitiriRanks') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignups = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup }
			});

			for (let i = 0; i < DBElitiriSignups.length; i++) {
				logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
				const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId } });
				if (!existingTask) {
					DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId });
				}
			}
		} else if (args[0] === 'updateElitiriPlayer') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { tournamentName: currentElitiriCup, osuUserId: args[1] }
			});

			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId } });
			if (!existingTask) {
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId });
			}
			// DBElitiriSignup.osuRank = args[2];
			// DBElitiriSignup.bracketName = args[3] + ' ' + args[4];
			// DBElitiriSignup.save();
		} else if (args[0] === 'multiScoresDBSize') {
			const mapScoreAmount = await DBOsuMultiScores.count();

			// eslint-disable-next-line no-console
			console.log(mapScoreAmount);
		} else if (args[0] === 'updateServerDuelRatings') {
			let sentMessage = await msg.reply('Processing...');
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {

					const members = [];
					guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

					for (let i = 0; i < members.length; i++) {
						if (i % 25 === 0) {
							sentMessage.edit(`${i} out of ${members.length} done`);
						}
						logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: {
								userId: members[i].id
							},
						});

						if (discordUser) {
							await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client });
						}
					}

					sentMessage.delete();
				})
				.catch(error => {
					console.error(error);
				});
		} else if (args[0] === 'addElitiriTopBracketNMMap') {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			osuApi.getBeatmaps({ b: args[1] })
				.then(async (beatmaps) => {
					DBElitiriCupSubmissions.create({
						osuUserId: '-1',
						osuName: 'ECW 2021 Submission',
						bracketName: 'Top Bracket',
						tournamentName: currentElitiriCup,
						modPool: 'NM',
						title: beatmaps[0].title,
						artist: beatmaps[0].artist,
						difficulty: beatmaps[0].version,
						starRating: beatmaps[0].difficulty.rating,
						drainLength: beatmaps[0].length.drain,
						circleSize: beatmaps[0].difficulty.size,
						approachRate: beatmaps[0].difficulty.approach,
						overallDifficulty: beatmaps[0].difficulty.overall,
						hpDrain: beatmaps[0].difficulty.drain,
						mapper: beatmaps[0].creator,
						beatmapId: beatmaps[0].id,
						beatmapsetId: beatmaps[0].beatmapSetId,
						bpm: beatmaps[0].bpm,
					});
				})
				.catch(error => {
					console.error(error);
				});
		} else if (args[0] === 'patreon') {
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser.patreon) {
				discordUser.patreon = false;
				msg.reply('Patreon status set to false');
			} else {
				discordUser.patreon = true;
				msg.reply('Patreon status set to true');
			}
			discordUser.save();
		} else if (args[0] === 'removeTwitchSyncEnable') {
			let twitchSyncUsers = await DBDiscordUsers.findAll({
				where: {
					twitchOsuMapSync: true
				}
			});

			for (let i = 0; i < twitchSyncUsers.length; i++) {
				twitchSyncUsers[i].twitchOsuMapSync = false;
				await twitchSyncUsers[i].save();
			}
		} else if (args[0] === 'cleanUp') {
			cleanUpDuplicateEntries(true);
		} else if (args[0] === 'clearForumPosts') {
			let forumPosts = await DBOsuForumPosts.findAll();
			for (let i = 0; i < forumPosts.length; i++) {
				await forumPosts[i].destroy();
			}
		} else if (args[0] === 'runningMatches') {
			let importMatchTasks = await DBProcessQueue.findAll({
				where: {
					task: 'importMatch',
				}
			});

			for (let i = 0; i < importMatchTasks.length; i++) {
				await msg.reply(`https://osu.ppy.sh/mp/${importMatchTasks[i].additions}`);
			}
		} else if (args[0] === 'deleteDiscordUser') {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser) {
				await discordUser.destroy();
				return await msg.reply('Deleted discord user');
			}

			return await msg.reply('Could not find discord user');
		} else if (args[0] === 'resetSavedPPValues') {
			// Reset saved pp values in DBOsuMultiScores using an update statement
			await msg.reply('Resetting...');
			let count = await DBOsuMultiScores.update({
				pp: null,
			}, {
				where: {
					pp: {
						[Op.ne]: null
					}
				}
			});

			return msg.reply(`Reset ${humanReadable(count)} scores' pp values`);
		} else if (args[0] === 'duelAdminCommand') {
			//TODO: Move to command file
			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'osu-duel-admin',
					description: 'Duel admin commands',
					default_member_permissions: '0',
					options: [
						{
							'name': 'createduel1v1',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'createduel2v2',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdplayer',
									'description': 'The third player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthplayer',
									'description': 'The fourth player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
					]
				},
			});
		} else if (args[0] === 'averageRating') {
			let discordUsers = await DBDiscordUsers.findAll({
				where: {
					osuUserId: {
						[Op.gt]: 0
					},
					osuPP: {
						[Op.gt]: 0
					},
					osuDuelStarRating: {
						[Op.gt]: 0
					},
					osuDuelProvisional: {
						[Op.not]: true,
					}
				}
			});

			let totalRating = 0;
			let totalPlayers = 0;

			for (let i = 0; i < discordUsers.length; i++) {
				let discordUser = discordUsers[i];

				if (discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[1]) && parseInt(discordUser.osuRank) <= parseInt(args[2])) {
					totalRating += parseFloat(discordUser.osuDuelStarRating);
					totalPlayers++;
				}
			}

			let averageRating = totalRating / totalPlayers;

			return msg.reply(`The average rating for players ranked ${args[1]} to ${args[2]} is ${averageRating.toFixed(2)}`);
		} else if (args[0] === 'serverTourneyTops') {
			if (args.length < 3) {
				return msg.reply('Correct usage: `e!admin serverTourneyTops amountPerPlayer <onlyRanked: true/false> [@Elitebotix]`');
			}

			let amountPerPlayer = parseInt(args[1]);
			let onlyRanked = false;

			if (args[2] === 'true') {
				onlyRanked = true;
			}

			let processingMessage = await msg.reply('Processing...');

			let osuAccounts = [];
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {
					const members = [];
					guildMembers.each(member => members.push(member.id));

					logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers serverTourneyTops');
					const discordUsers = await DBDiscordUsers.findAll({
						where: {
							userId: {
								[Op.in]: members
							},
							osuUserId: {
								[Op.not]: null,
							}
						},
					});

					for (let i = 0; i < discordUsers.length; i++) {
						osuAccounts.push({
							userId: discordUsers[i].userId,
							osuUserId: discordUsers[i].osuUserId,
							osuName: discordUsers[i].osuName,
						});
					}
				})
				.catch(err => {
					console.error(err);
				});

			let tourneyTops = [];

			for (let i = 0; i < osuAccounts.length; i++) {
				await processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Account ${i + 1}/${osuAccounts.length})...`);

				let lastUpdate = new Date();
				//Get all scores from tournaments
				logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores');
				let multiScores = await DBOsuMultiScores.findAll({
					where: {
						osuUserId: osuAccounts[i].osuUserId,
						mode: 'Standard',
						tourneyMatch: true,
						score: {
							[Op.gte]: 10000
						}
					}
				});

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Found ${multiScores.length} scores) (Account ${i + 1}/${osuAccounts.length})...`);
					lastUpdate = new Date();
				}

				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Removing irrelevant scores from ${multiScores.length} found scores) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}

					if (parseInt(multiScores[j].score) <= 10000 && getMods(parseInt(multiScores[j].gameRawMods) + parseInt(multiScores[j].rawMods)).includes('RX')) {
						multiScores.splice(j, 1);
						j--;
					}
				}

				let multisToUpdate = [];
				for (let j = 0; j < multiScores.length; j++) {
					if (!multiScores[j].maxCombo && !multisToUpdate.includes(multiScores[j].matchId)) {
						multisToUpdate.push(multiScores[j].matchId);
					}
				}

				for (let j = 0; j < multisToUpdate.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Updating legacy matches ${j + 1}/${multisToUpdate.length}) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					await osuApi.getMatch({ mp: multisToUpdate[j] })
						.then(async (match) => {
							await saveOsuMultiScores(match);
						})
						.catch(() => {
							//Nothing
						});
					await pause(5000);
				}

				if (multisToUpdate.length) {
					//Get all scores from tournaments
					logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores2');
					multiScores = await DBOsuMultiScores.findAll({
						where: {
							osuUserId: osuAccounts[i].osuUserId,
							mode: 'Standard',
							tourneyMatch: true,
							score: {
								[Op.gte]: 10000
							}
						}
					});
				}

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Found ${multiScores.length} scores after legacy match update) (Account ${i + 1}/${osuAccounts.length})...`);
					lastUpdate = new Date();
				}

				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Removing irrelevant data from ${multiScores.length} found scores after legacy match update) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					if (parseInt(multiScores[j].score) <= 10000 || multiScores[j].teamType === 'Tag Team vs' || multiScores[j].teamType === 'Tag Co-op') {
						multiScores.splice(j, 1);
						j--;
					}
				}

				//Translate the scores to bancho scores
				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Score ${j + 1}/${multiScores.length}) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					if (parseInt(multiScores[j].gameRawMods) % 2 === 1) {
						multiScores[j].gameRawMods = parseInt(multiScores[j].gameRawMods) - 1;
					}
					if (parseInt(multiScores[j].rawMods) % 2 === 1) {
						multiScores[j].rawMods = parseInt(multiScores[j].rawMods) - 1;
					}
					multiScores[j] = await multiToBanchoScore(multiScores[j]);

					if (!multiScores[j].pp || parseFloat(multiScores[j].pp) > 2000 || !parseFloat(multiScores[j].pp)) {
						multiScores.splice(j, 1);
						j--;
						continue;
					}
				}

				//Sort scores by pp
				quicksortPP(multiScores);

				//Remove duplicates by beatmapId
				for (let j = 0; j < multiScores.length; j++) {
					for (let k = j + 1; k < multiScores.length; k++) {
						if (multiScores[j].beatmapId === multiScores[k].beatmapId) {
							multiScores.splice(k, 1);
							k--;
						}
					}
				}

				//Feed the scores into the array
				let scoreCount = 0;
				for (let j = 0; j < multiScores.length && scoreCount < amountPerPlayer; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Adding score ${j + 1}/${amountPerPlayer} to the output) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					multiScores[j].beatmap = await getOsuBeatmap({ beatmapId: multiScores[j].beatmapId });
					if (onlyRanked) {
						if (!multiScores[j].beatmap || multiScores[j].beatmap && multiScores[j].beatmap.approvalStatus !== 'Approved' && multiScores[j].beatmap.approvalStatus !== 'Ranked') {
							continue;
						}
					}
					if (multiScores[j].pp) {
						tourneyTops.push(multiScores[j]);
						scoreCount++;
					}
				}
			}

			let exportScores = [];

			for (let i = 0; i < tourneyTops.length; i++) {
				if (tourneyTops[i].beatmap) {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: tourneyTops[i].beatmap.approvalStatus,
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: tourneyTops[i].beatmap.title,
						artist: tourneyTops[i].beatmap.artist,
						difficulty: tourneyTops[i].beatmap.difficulty,
						mode: tourneyTops[i].beatmap.mode,
					});
				} else {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: 'Deleted',
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: 'Unavailable',
						artist: 'Unavailable',
						difficulty: 'Unavailable',
						mode: 'Unavailable',
					});
				}
			}

			processingMessage.delete();

			let data = [];
			for (let i = 0; i < exportScores.length; i++) {
				data.push(exportScores[i]);

				if (i % 10000 === 0 && i > 0 || exportScores.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.AttachmentBuilder(buffer, { name: `${msg.guild.name}-tournament-topplays.csv` });

					await msg.reply({ content: `${msg.guild.name} - Tournament Top Plays`, files: [attachment] });
					data = [];
				}
			}
		} else if (args[0] === 'restart') {
			let guildSizes = await msg.client.shard.fetchClientValues('guilds.cache.size');
			let startDates = await msg.client.shard.fetchClientValues('startDate');
			let duels = await msg.client.shard.fetchClientValues('duels');
			let other = await msg.client.shard.fetchClientValues('otherMatches');
			let matchtracks = await msg.client.shard.fetchClientValues('matchTracks');
			let bingoMatches = await msg.client.shard.fetchClientValues('bingoMatches');
			let update = await msg.client.shard.fetchClientValues('update');

			// eslint-disable-next-line no-console
			console.log('duels', duels);
			// eslint-disable-next-line no-console
			console.log('other', other);
			// eslint-disable-next-line no-console
			console.log('matchtracks', matchtracks);

			let output = `Options: \`all\`, \`free\`, \`shardId\`, \`update\`\n\`\`\`Cur.: ${msg.client.shardId} | Started          | Guilds | Duels | Other | Matchtrack | Bingo | Update\n`;
			for (let i = 0; i < guildSizes.length; i++) {
				output = output + '--------|------------------|--------|-------|-------|------------|-------|--------\n';
				let startDate = new Date(startDates[i]);
				let startedString = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')} ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${startDate.getUTCFullYear()}`;
				let guildSize = guildSizes[i].toString().padStart(6, ' ');
				let duelSize = duels[i].length.toString().padStart(5, ' ');
				let otherSize = other[i].length.toString().padStart(5, ' ');
				let matchtrackSize = matchtracks[i].length.toString().padStart(10, ' ');
				let bingoMatchSize = bingoMatches[i].toString().padStart(5, ' ');
				let updateString = update[i].toString().padStart(6, ' ');
				output = output + `Shard ${i} | ${startedString} | ${guildSize} | ${duelSize} | ${otherSize} | ${matchtrackSize} | ${bingoMatchSize} | ${updateString}\n`;
			}
			output = output + '```';
			await msg.reply(output);

			// Restart relevant ones
			await msg.client.shard.broadcastEval(async (c, { condition }) => {
				if (condition === 'all' ||
					condition === 'free' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks === 0 && c.bingoMatches === 0 ||
					!isNaN(condition) && c.shardId === parseInt(condition) ||
					condition === 'update' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches === 0) {

					// eslint-disable-next-line no-undef
					process.exit();
				} else if (condition === 'update') {
					c.update = 1;
				}
			}, { context: { condition: args[1] } });
			return;
		} else if (args[0] === 'resetSavedRatings') {
			let deleted = await DBDuelRatingHistory.destroy({
				where: {
					id: {
						[Op.gt]: 0,
					},
				}
			});

			await msg.reply(`Deleted ${deleted} duel rating histories.`);

			let updated = await DBDiscordUsers.update({
				lastDuelRatingUpdate: null,
			}, {
				where: {
					lastDuelRatingUpdate: {
						[Op.not]: null,
					},
				},
				silent: true
			});

			return await msg.reply(`Updated ${updated} discord users.`);
		} else if (args[0] === 'removeProcessQueueTask') {
			await DBProcessQueue.destroy({
				where: {
					id: args[1],
				}
			});

			return await msg.reply('Deleted the processqueue entry.');
		} else if (args[0] === 'remainingUsers') {
			let count = await DBDiscordUsers.count({
				where: {
					osuUserId: {
						[Op.not]: null
					},
					userId: null,
					osuRank: null,
					nextOsuPPUpdate: {
						[Op.eq]: null
					},
				},
			});

			return msg.reply(`Remaining users: ${count}`);
		} else if (args[0] === 'warmupnull') {
			let count = await DBOsuMultiScores.count({
				where: {
					warmup: null,
				},
			});

			return msg.reply(`Warmup null: ${count}`);
		} else {
			msg.reply('Invalid command');
		}

		msg.reply('Done.');
	},
};

function quicksortPP(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionPP(list, start, end);
		quicksortPP(list, start, p - 1);
		quicksortPP(list, p + 1, end);
	}
	return list;
}

function partitionPP(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].pp) >= parseFloat(pivot.pp)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}
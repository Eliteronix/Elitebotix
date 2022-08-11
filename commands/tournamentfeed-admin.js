const { developers } = require('../config.json');
const { DBOsuForumPosts } = require('../dbObjects');
const { populateMsgFromInteraction } = require('../utils.js');
const Discord = require('discord.js');

module.exports = {
	name: 'tournamentfeed-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the tournament feed',
	// usage: '<recalculate/fix/start/createLeaderboard>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	// args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		msg = await populateMsgFromInteraction(interaction);
		if (!developers.includes(msg.author.id)) {
			return;
		}
		if (!interaction) {
			return msg.reply('Please use the / command `/tournamentfeed-admin`');
		}

		await interaction.deferReply();

		if (interaction.options._subcommand === 'list') {
			let forumPosts = await DBOsuForumPosts.findAll({
				where: {
					pinged: false,
					outdated: false,
					noTournament: false
				}
			});

			if (forumPosts.length === 0) {
				return interaction.editReply('No tournament posts open to ping.');
			}

			interaction.editReply(`${forumPosts.length} tournament posts open to ping.`);

			for (let i = 0; i < forumPosts.length; i++) {
				let post = forumPosts[i];

				//Create embed
				const embed = new Discord.MessageEmbed()
					.setTitle(post.title);

				embed.addField('Forum Post', post.forumPost);

				if (post.discord) {
					embed.addField('Discord', post.discord);
				}

				if (post.host) {
					embed.addField('Host', post.host);
				}

				if (post.format) {
					embed.addField('Format', post.format);
				} else {
					embed.addField('Format', 'No format specified');
				}

				if (post.rankRange) {
					embed.addField('Rank Range', post.rankRange);
				} else {
					embed.addField('Rank Range', 'No rank range specified');
				}

				if (post.gamemode) {
					embed.addField('Gamemode', post.gamemode);
				} else {
					embed.addField('Gamemode', 'No gamemode specified');
				}

				if (post.notes) {
					embed.addField('Notes', post.notes);
				} else {
					embed.addField('Notes', 'No notes specified');
				}

				if (post.bws) {
					embed.addField('BWS', 'Yes');
				} else {
					embed.addField('BWS', 'No');
				}

				interaction.followUp({ embeds: [embed] });
			}
		} else if (interaction.options._subcommand === 'ping') {

		} else if (interaction.options._subcommand === 'update') {
			let id = null;
			let format = null;
			let rankrange = null;
			let gamemode = null;
			let notes = null;
			let bws = null;
			let outdated = null;
			let notournament = null;

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'id') {
					id = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'format') {
					format = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'rankrange') {
					rankrange = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'gamemode') {
					gamemode = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'notes') {
					notes = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'bws') {
					if (interaction.options._hoistedOptions[i].value === true) {
						bws = true;
					} else {
						bws = false;
					}
				} else if (interaction.options._hoistedOptions[i].name === 'outdated') {
					if (interaction.options._hoistedOptions[i].value === true) {
						outdated = true;
					} else {
						outdated = false;
					}
				} else if (interaction.options._hoistedOptions[i].name === 'notournament') {
					if (interaction.options._hoistedOptions[i].value === true) {
						notournament = true;
					} else {
						notournament = false;
					}
				}
			}

			let forumPost = await DBOsuForumPosts.findOne({
				where: {
					forumPost: `https://osu.ppy.sh/community/forums/topics/${id}`
				}
			});

			if (!forumPost) {
				return interaction.editReply('Could not find forum post.');
			}

			if (format) {
				forumPost.format = format;
			}
			if (rankrange) {
				forumPost.rankRange = rankrange;
			}
			if (gamemode) {
				forumPost.gamemode = gamemode;
			}
			if (notes) {
				forumPost.notes = notes;
			}
			if (bws) {
				forumPost.bws = bws;
			}
			if (outdated) {
				forumPost.outdated = outdated;
			}
			if (notournament) {
				forumPost.noTournament = notournament;
			}

			await forumPost.save();

			//Create embed
			const embed = new Discord.MessageEmbed()
				.setTitle(forumPost.title);

			embed.addField('Forum Post', forumPost.forumPost);

			if (forumPost.discord) {
				embed.addField('Discord', forumPost.discord);
			}

			if (forumPost.host) {
				embed.addField('Host', forumPost.host);
			}

			if (forumPost.format) {
				embed.addField('Format', forumPost.format);
			} else {
				embed.addField('Format', 'No format specified');
			}

			if (forumPost.rankRange) {
				embed.addField('Rank Range', forumPost.rankRange);
			} else {
				embed.addField('Rank Range', 'No rank range specified');
			}

			if (forumPost.gamemode) {
				embed.addField('Gamemode', forumPost.gamemode);
			} else {
				embed.addField('Gamemode', 'No gamemode specified');
			}

			if (forumPost.notes) {
				embed.addField('Notes', forumPost.notes);
			} else {
				embed.addField('Notes', 'No notes specified');
			}

			if (forumPost.bws) {
				embed.addField('BWS', 'Yes');
			} else {
				embed.addField('BWS', 'No');
			}

			if (forumPost.outdated) {
				embed.addField('Outdated', 'Yes');
			}

			if (forumPost.noTournament) {
				embed.addField('Not a tournament', 'Yes');
			}

			interaction.editReply({ embeds: [embed] });
		}
	}
};
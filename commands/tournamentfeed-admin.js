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
		}
	}
};
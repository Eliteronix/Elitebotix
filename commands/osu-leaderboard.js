const { DBDiscordUsers } = require('../dbObjects');
const { humanReadable, createLeaderboard, populateMsgFromInteraction, logDatabaseQueries, getOsuUserServerMode, getGameModeName } = require('../utils');
const { leaderboardEntriesPerPage } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-leaderboard',
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-leaderboard')
		.setNameLocalizations({
			'de': 'osu-rangliste',
			'en-GB': 'osu-leaderboard',
			'en-US': 'osu-leaderboard',
		})
		.setDescription('Sends a leaderboard of all the players in the guild that have their account connected')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Rangliste aller Spieler in dem Server, die ihr Konto verbunden haben',
			'en-GB': 'Sends a leaderboard of all the players in the guild that have their account connected',
			'en-US': 'Sends a leaderboard of all the players in the guild that have their account connected',
		})
		.setDMPermission(false)
		.addIntegerOption(option =>
			option.setName('page')
				.setNameLocalizations({
					'de': 'seite',
					'en-GB': 'page',
					'en-US': 'page',
				})
				.setDescription('The page of the leaderboard to display')
				.setDescriptionLocalizations({
					'de': 'Die Seite der Rangliste, die angezeigt werden soll',
					'en-GB': 'The page of the leaderboard to display',
					'en-US': 'The page of the leaderboard to display',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('mode')
				.setNameLocalizations({
					'de': 'modus',
					'en-GB': 'mode',
					'en-US': 'mode',
				})
				.setDescription('The osu! mode')
				.setDescriptionLocalizations({
					'de': 'Der osu! Modus',
					'en-GB': 'The osu! mode',
					'en-US': 'The osu! mode',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'standard', value: '--s' },
					{ name: 'taiko', value: '--t' },
					{ name: 'catch', value: '--c' },
					{ name: 'mania', value: '--m' },
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('osu! leaderboard will be created');

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}

		let processingMessage;
		if (msg.id) {
			processingMessage = await msg.reply('Processing osu! leaderboard...');
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const mode = commandConfig[2];

		let discordUsers = [];

		try {
			let members = await msg.guild.members.fetch({ time: 300000 });

			members = members.map(member => member.id);

			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-leaderboard.js DBDiscordUsers');
			discordUsers = await DBDiscordUsers.findAll({
				where: {
					userId: {
						[Op.in]: members,
					}
				},
			});
		} catch (e) {
			if (e.message !== 'Members didn\'t arrive in time.') {
				console.error('commands/osu-leaderboard.js | Get members', e);
				return;
			}
		}

		let osuAccounts = [];
		for (let i = 0; i < discordUsers.length; i++) {
			if (discordUsers[i].osuUserId) {
				if (mode === 0 && parseInt(discordUsers[i].osuPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].osuRank,
						pp: discordUsers[i].osuPP,
					});
				} else if (mode === 1 && parseInt(discordUsers[i].taikoPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].taikoRank,
						pp: discordUsers[i].taikoPP,
					});
				} else if (mode === 2 && parseInt(discordUsers[i].catchPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].catchRank,
						pp: discordUsers[i].catchPP,
					});
				} else if (mode === 3 && parseInt(discordUsers[i].maniaPP) > 0) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						rank: discordUsers[i].maniaRank,
						pp: discordUsers[i].maniaPP,
					});
				}
			}
		}

		osuAccounts.sort((a, b) => {
			return parseFloat(b.pp) - parseFloat(a.pp);
		});

		let leaderboardData = [];

		let messageToAuthor = '';
		let authorPlacement = 0;

		for (let i = 0; i < osuAccounts.length; i++) {
			if (msg.author.id === osuAccounts[i].userId) {
				messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
				authorPlacement = i + 1;
			}

			let member = await msg.guild.members.cache.get(osuAccounts[i].userId);

			let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

			if (member.nickname) {
				userDisplayName = `${member.nickname} / ${userDisplayName}`;
			}

			let verified = 'x';

			if (osuAccounts[i].osuVerified) {
				verified = '✔';
			}

			let dataset = {
				name: userDisplayName
			};

			dataset.value = `#${humanReadable(osuAccounts[i].rank)} | ${humanReadable(Math.floor(osuAccounts[i].pp).toString())}pp | ${verified} ${osuAccounts[i].osuName}`;

			leaderboardData.push(dataset);
		}

		let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

		let page;

		if (args[0] && !isNaN(args[0])) {
			page = Math.abs(parseInt(args[0]));
		}

		if (!page && leaderboardData.length > 150) {
			page = 1;
			if (authorPlacement) {
				page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
			}
		}

		if (totalPages === 1) {
			page = null;
		}

		let filename = `osu-leaderboard-${msg.author.id}-mode-${getGameModeName(mode)}-${msg.guild.name}.png`;

		if (page) {
			filename = `osu-leaderboard-${msg.author.id}-mode-${getGameModeName(mode)}-${msg.guild.name}-page${page}.png`;
		}

		const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${msg.guild.name}'s osu! ${getGameModeName(mode)} leaderboard`, filename, page);

		//Send attachment
		let leaderboardMessage;
		if (msg.id) {
			leaderboardMessage = await msg.reply({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse </osu-link connect:1064502370710605836> to connect your osu! account.\nData is being updated once a day or when </osu-profile:1064502472044970004> is being used.`, files: [attachment] });
		} else if (interaction) {
			leaderboardMessage = await interaction.followUp({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse </osu-link connect:1064502370710605836> to connect your osu! account.\nData is being updated once a day or when </osu-profile:1064502472044970004> is being used.`, files: [attachment] });
		} else {
			leaderboardMessage = await msg.channel.send({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse </osu-link connect:1064502370710605836> to connect your osu! account.\nData is being updated once a day or when </osu-profile:1064502472044970004> is being used.`, files: [attachment] });
		}

		if (page) {
			if (page > 1) {
				await leaderboardMessage.react('◀️');
			}

			if (page < totalPages) {
				await leaderboardMessage.react('▶️');
			}
		}

		if (processingMessage) {
			processingMessage.delete();
		}
	},
};
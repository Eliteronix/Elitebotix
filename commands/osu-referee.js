const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, getOsuBeatmap, updateOsuDetailsforUser } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-referee',
	aliases: ['osu-match'],
	description: 'Lets you schedule a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; Use --o/--t/--c/--m for modes)',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	// botPermissions: Permissions.FLAGS.ATTACH_FILES,
	// botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (msg) {
			msg.reply('Please set up the game using the / command `/osu-referee`');
		}
		if (interaction) {
			await interaction.reply('Information is being processed');

			let date = new Date();
			date.setUTCSeconds(0);
			let dbMaps = [];
			let dbPlayers = [];
			let useNoFail = false;
			let channel = null;
			let matchname = '';
			let mappoolReadable = '';
			let scoreMode = 0;
			let matchLength = 600 + 60 + 180; //Set to forfeit time by default + 1 end minute + 3 extra minutes backup
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'date') {
					date.setUTCDate(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'month') {
					date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
				} else if (interaction.options._hoistedOptions[i].name === 'year') {
					date.setUTCFullYear(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'hour') {
					date.setUTCHours(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'minute') {
					date.setUTCMinutes(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'mappool') {
					let maps = interaction.options._hoistedOptions[i].value.split(',');
					mappoolReadable = interaction.options._hoistedOptions[i].value;

					for (let j = 0; j < maps.length; j++) {
						if (!maps[j].match(/[a-zA-Z][a-zA-Z]\d+/gm)) {
							return interaction.followUp(`${maps[j]} is not a valid map`);
						}
						let modBits;

						if (maps[j].toLowerCase().startsWith('nm')) {
							modBits = 0;
						} else if (maps[j].toLowerCase().startsWith('hd')) {
							modBits = 8;
						} else if (maps[j].toLowerCase().startsWith('hr')) {
							modBits = 16;
						} else if (maps[j].toLowerCase().startsWith('dt')) {
							modBits = 64;
						} else {
							return interaction.followUp(`${maps[j].substring(0, 2)} is not a valid mod.`);
						}

						let dbBeatmap = await getOsuBeatmap(maps[j].substring(2), modBits);

						if (dbBeatmap) {
							dbMaps.push(dbBeatmap.id);
							matchLength += 120 + parseInt(dbMaps.totalLength);
						} else {
							return interaction.followUp(`The beatmap \`${maps[j].substring(2)}\` could not be found.`);
						}
					}
				} else if (interaction.options._hoistedOptions[i].name === 'players') {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});
					let players = interaction.options._hoistedOptions[i].value.split(',');

					for (let j = 0; j < players.length; j++) {
						const response = await osuApi.getUser({ u: getIDFromPotentialOsuLink(players[j]), m: 0 })
							.then(async (user) => {
								updateOsuDetailsforUser(user, 0);

								const dbDiscordUser = await DBDiscordUsers.findOne({
									where: { osuUserId: user.id }
								});

								if (dbDiscordUser) {
									dbPlayers.push(dbDiscordUser.id);
								} else {
									return interaction.followUp(`${user.name}\` doesn't have their account connected. Please tell them to connect their account using \`/osu-link connect\`. (Use \`_\` instead of spaces)`);
								}
							})
							.catch(err => {
								if (err.message === 'Not found') {
									return interaction.followUp(`Could not find user \`${getIDFromPotentialOsuLink(players[j]).replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
								} else {
									return interaction.followUp(`The bot ran into an error processing the user ${getIDFromPotentialOsuLink(players[j])}. Please try again.`);
								}
							});

						if (response) {
							return;
						}
					}
				} else if (interaction.options._hoistedOptions[i].name === 'usenofail' && interaction.options._hoistedOptions[i].value) {
					useNoFail = true;
				} else if (interaction.options._hoistedOptions[i].name === 'channel') {
					channel = await interaction.guild.channels.fetch(interaction.options._hoistedOptions[i].value);
					if (channel.type !== 'GUILD_TEXT') {
						return interaction.followUp(`<#${channel.id}> is not a valid text channel.`);
					}
				} else if (interaction.options._hoistedOptions[i].name === 'matchname') {
					matchname = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'score') {
					scoreMode = interaction.options._hoistedOptions[i].value;
				}
			}

			let now = new Date();
			if (now > date) {
				return interaction.followUp('You are trying to schedule a match in the past which is not allowed.');
			} else if (now.setUTCDate(now.getUTCDate() + 14) < date) {
				return interaction.followUp('You are trying to schedule a match more than 2 weeks in the future which is not allowed.');
			}

			//Calculate if there are going to be other matches running during that time
			let matchesPlanned = 0;
			let endDate = new Date();
			endDate.setUTCFullYear(date.getUTCFullYear());
			endDate.setUTCMonth(date.getUTCMonth());
			endDate.setUTCDate(date.getUTCDate());
			endDate.setUTCHours(date.setUTCHours());
			endDate.setUTCMinutes(date.setUTCMinutes());
			endDate.setUTCSeconds(0);
			endDate.setUTCSeconds(matchLength);
			if (date.getUTCHours() <= 18 && endDate.getUTCHours >= 18) {
				matchesPlanned += 2;
			}

			const tourneyMatchNotifications = await DBProcessQueue.findAll({
				where: { task: 'tourneyMatchNotification' }
			});

			date.setUTCMinutes(date.getUTCMinutes() - 15);

			DBProcessQueue.create({ guildId: interaction.guildId, task: 'tourneyMatchNotification', priority: 10, additions: `${interaction.user.id};${channel.id};${dbMaps.join(',')};${dbPlayers.join(',')};${useNoFail};${matchname};${mappoolReadable};${scoreMode}`, date: date });
			return interaction.followUp('The match has been scheduled. The players will be informed as soon as it happens. To look at your scheduled matches please use `/osu-referee scheduled`');
		}
	},
};
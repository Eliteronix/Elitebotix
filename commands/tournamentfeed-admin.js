const { DBOsuForumPosts, DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'tournamentfeed-admin',
	description: 'Admin control for the tournament feed',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	data: new SlashCommandBuilder()
		.setName('tournamentfeed-admin')
		.setNameLocalizations({
			'de': 'turnierfeed-admin',
			'en-GB': 'tournamentfeed-admin',
			'en-US': 'tournamentfeed-admin',
		})
		.setDescription('Admin control for the tournament feed')
		.setDescriptionLocalizations({
			'de': 'Admin Kontrolle für den Turnierfeed',
			'en-GB': 'Admin control for the tournament feed',
			'en-US': 'Admin control for the tournament feed',
		})
		.setDefaultMemberPermissions('0')
		.addSubcommand(subcommand =>
			subcommand
				.setName('update')
				.setNameLocalizations({
					'de': 'update',
					'en-GB': 'update',
					'en-US': 'update',
				})
				.setDescription('Allows for updating the tournament feed')
				.setDescriptionLocalizations({
					'de': 'Erlaubt das Updaten des Turnierfeeds',
					'en-GB': 'Allows for updating the tournament feed',
					'en-US': 'Allows for updating the tournament feed',
				})
				.addIntegerOption(option =>
					option
						.setName('id')
						.setNameLocalizations({
							'de': 'id',
							'en-GB': 'id',
							'en-US': 'id',
						})
						.setDescription('The forum post id')
						.setDescriptionLocalizations({
							'de': 'Die Forum Post ID',
							'en-GB': 'The forum post id',
							'en-US': 'The forum post id',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('format')
						.setNameLocalizations({
							'de': 'format',
							'en-GB': 'format',
							'en-US': 'format',
						})
						.setDescription('The format of the tournament')
						.setDescriptionLocalizations({
							'de': 'Das Format des Turniers',
							'en-GB': 'The format of the tournament',
							'en-US': 'The format of the tournament',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('rankrange')
						.setNameLocalizations({
							'de': 'rangbereich',
							'en-GB': 'rankrange',
							'en-US': 'rankrange',
						})
						.setDescription('The rankrange of the tournament')
						.setDescriptionLocalizations({
							'de': 'Der Rangbereich des Turniers',
							'en-GB': 'The rankrange of the tournament',
							'en-US': 'The rankrange of the tournament',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('gamemode')
						.setNameLocalizations({
							'de': 'spielmodus',
							'en-GB': 'gamemode',
							'en-US': 'gamemode',
						})
						.setDescription('The gamemode of the tournament')
						.setDescriptionLocalizations({
							'de': 'Der Spielmodus des Turniers',
							'en-GB': 'The gamemode of the tournament',
							'en-US': 'The gamemode of the tournament',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Standard', value: 'Standard' },
							{ name: 'Taiko', value: 'Taiko' },
							{ name: 'Catch the Beat', value: 'Catch the Beat' },
							{ name: 'Mania', value: 'Mania' },
							{ name: 'Multimode', value: 'Multimode' },
						)
				)
				.addStringOption(option =>
					option
						.setName('region')
						.setNameLocalizations({
							'de': 'region',
							'en-GB': 'region',
							'en-US': 'region',
						})
						.setDescription('The region of the tournament (Africa, Asia, Europe, North America, Oceania, South America | Detail)')
						.setDescriptionLocalizations({
							'de': 'Die Region des Turniers (Africa, Asia, Europe, North America, Oceania, South America | Detail)',
							'en-GB': 'The region of the tournament (Africa, Asia, Europe, North America, Oceania, South America | Detail)',
							'en-US': 'The region of the tournament (Africa, Asia, Europe, North America, Oceania, South America | Detail)',
						})
						.setRequired(false)
						.setAutocomplete(true)
				)
				.addStringOption(option =>
					option
						.setName('notes')
						.setNameLocalizations({
							'de': 'anmerkungen',
							'en-GB': 'notes',
							'en-US': 'notes',
						})
						.setDescription('Additional information about the tournament')
						.setDescriptionLocalizations({
							'de': 'Zusätzliche Informationen zum Turnier',
							'en-GB': 'Additional information about the tournament',
							'en-US': 'Additional information about the tournament',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('bws')
						.setNameLocalizations({
							'de': 'bws',
							'en-GB': 'bws',
							'en-US': 'bws',
						})
						.setDescription('Is the rank range bws')
						.setDescriptionLocalizations({
							'de': 'Ist der Rangbereich bws',
							'en-GB': 'Is the rank range bws',
							'en-US': 'Is the rank range bws',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('badged')
						.setNameLocalizations({
							'de': 'badged',
							'en-GB': 'badged',
							'en-US': 'badged',
						})
						.setDescription('Is the tourney going for badged')
						.setDescriptionLocalizations({
							'de': 'Ist das Turnier badged',
							'en-GB': 'Is the tourney going for badged',
							'en-US': 'Is the tourney going for badged',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('outdated')
						.setNameLocalizations({
							'de': 'veraltet',
							'en-GB': 'outdated',
							'en-US': 'outdated',
						})
						.setDescription('Is the tournament post outdated')
						.setDescriptionLocalizations({
							'de': 'Ist der Turnierpost veraltet',
							'en-GB': 'Is the tournament post outdated',
							'en-US': 'Is the tournament post outdated',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('notournament')
						.setNameLocalizations({
							'de': 'keinturnier',
							'en-GB': 'notournament',
							'en-US': 'notournament',
						})
						.setDescription('Is the post not a tournament')
						.setDescriptionLocalizations({
							'de': 'Ist der Post kein Turnier',
							'en-GB': 'Is the post not a tournament',
							'en-US': 'Is the post not a tournament',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('ping')
				.setNameLocalizations({
					'de': 'pingen',
					'en-GB': 'ping',
					'en-US': 'ping',
				})
				.setDescription('Pings a new tournament')
				.setDescriptionLocalizations({
					'de': 'Pingt ein neues Turnier',
					'en-GB': 'Pings a new tournament',
					'en-US': 'Pings a new tournament',
				})
				.addIntegerOption(option =>
					option
						.setName('id')
						.setNameLocalizations({
							'de': 'id',
							'en-GB': 'id',
							'en-US': 'id',
						})
						.setDescription('The forum post id')
						.setDescriptionLocalizations({
							'de': 'Die Forum Post ID',
							'en-GB': 'The forum post id',
							'en-US': 'The forum post id',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setNameLocalizations({
					'de': 'löschen',
					'en-GB': 'delete',
					'en-US': 'delete',
				})
				.setDescription('Deletes a saved tournament record')
				.setDescriptionLocalizations({
					'de': 'Löscht einen gespeicherten Turnier Eintrag',
					'en-GB': 'Deletes a saved tournament record',
					'en-US': 'Deletes a saved tournament record',
				})
				.addIntegerOption(option =>
					option
						.setName('id')
						.setNameLocalizations({
							'de': 'id',
							'en-GB': 'id',
							'en-US': 'id',
						})
						.setDescription('The forum post id')
						.setDescriptionLocalizations({
							'de': 'Die Forum Post ID',
							'en-GB': 'The forum post id',
							'en-US': 'The forum post id',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Show open forum posts')
				.setDescriptionLocalizations({
					'de': 'Zeigt offene Forum Posts',
					'en-GB': 'Show open forum posts',
					'en-US': 'Show open forum posts',
				})
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		const continents = [
			'Africa | Detail',
			'Asia | Detail',
			'Europe | Detail',
			'North America | Detail',
			'Oceania | Detail',
			'South America | Detail',
		];

		let filtered = continents.filter(choice => choice.includes(focusedValue));

		filtered = filtered.slice(0, 25);

		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

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

			await interaction.editReply(`${forumPosts.length} tournament posts open to ping.`);

			for (let i = 0; i < forumPosts.length; i++) {
				let post = forumPosts[i];

				//Create embed
				const embed = new Discord.EmbedBuilder()
					.setTitle(post.title);

				embed.addFields([{ name: 'Forum Post', value: post.forumPost }]);

				if (post.discord) {
					embed.addFields([{ name: 'Discord', value: post.discord }]);
				}

				if (post.host) {
					embed.addFields([{ name: 'Host', value: post.host }]);
				}

				if (post.format) {
					embed.addFields([{ name: 'Format', value: post.format }]);
				} else {
					embed.addFields([{ name: 'Format', value: 'No format specified' }]);
				}

				if (post.rankRange) {
					embed.addFields([{ name: 'Rank Range', value: post.rankRange }]);
				} else {
					embed.addFields([{ name: 'Rank Range', value: 'No rank range specified' }]);
				}

				if (post.gamemode) {
					embed.addFields([{ name: 'Gamemode', value: post.gamemode }]);
				} else {
					embed.addFields([{ name: 'Gamemode', value: 'No gamemode specified' }]);
				}

				if (post.region) {
					embed.addFields([{ name: 'Region', value: post.region }]);
				}

				if (post.notes) {
					embed.addFields([{ name: 'Notes', value: post.notes }]);
				} else {
					embed.addFields([{ name: 'Notes', value: 'No notes specified' }]);
				}

				if (post.bws) {
					embed.addFields([{ name: 'BWS', value: 'Yes' }]);
				} else {
					embed.addFields([{ name: 'BWS', value: 'No' }]);
				}

				if (post.badged) {
					embed.addFields([{ name: 'Badged', value: 'Yes' }]);
				} else {
					embed.addFields([{ name: 'Badged', value: 'No' }]);
				}

				if (post.posted) {
					let date = new Date(post.posted);
					embed.setFooter({ text: `Posted: ${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()} by ${post.host}` });
				}

				interaction.followUp({ embeds: [embed] });
			}
		} else if (interaction.options._subcommand === 'ping') {
			let forumPost = await DBOsuForumPosts.findOne({
				where: {
					forumPost: `https://osu.ppy.sh/community/forums/topics/${interaction.options._hoistedOptions[0].value}`
				}
			});

			if (!forumPost) {
				return interaction.editReply('Could not find forum post.');
			}

			//Create embed
			const embed = new Discord.EmbedBuilder()
				.setTitle(forumPost.title);

			embed.addFields([{ name: 'Forum Post', value: forumPost.forumPost }]);

			if (forumPost.discord) {
				embed.addFields([{ name: 'Discord', value: forumPost.discord }]);
			}

			if (forumPost.host) {
				embed.addFields([{ name: 'Host', value: forumPost.host }]);
			}

			if (forumPost.format) {
				embed.addFields([{ name: 'Format', value: forumPost.format }]);
			} else {
				embed.addFields([{ name: 'Format', value: 'No format specified' }]);
			}

			if (forumPost.rankRange) {
				embed.addFields([{ name: 'Rank Range', value: forumPost.rankRange }]);
			} else {
				embed.addFields([{ name: 'Rank Range', value: 'No rank range specified' }]);
			}

			if (forumPost.gamemode) {
				embed.addFields([{ name: 'Gamemode', value: forumPost.gamemode }]);
			} else {
				embed.addFields([{ name: 'Gamemode', value: 'No gamemode specified' }]);
			}

			if (forumPost.region) {
				embed.addFields([{ name: 'Region', value: forumPost.region }]);
			}

			if (forumPost.bws) {
				embed.addFields([{ name: 'BWS', value: 'Yes' }]);
			} else {
				embed.addFields([{ name: 'BWS', value: 'No' }]);
			}

			if (forumPost.badged) {
				embed.addFields([{ name: 'Badged', value: 'Yes' }]);
			} else {
				embed.addFields([{ name: 'Badged', value: 'No' }]);
			}

			if (forumPost.notes) {
				embed.addFields([{ name: 'Notes', value: forumPost.notes }]);
			}

			if (forumPost.posted) {
				embed.setFooter({ text: `Posted: ${forumPost.posted.getUTCDate()}.${forumPost.posted.getUTCMonth() + 1}.${forumPost.posted.getUTCFullYear()} by ${forumPost.host}` });
			}

			// eslint-disable-next-line no-undef
			if (process.env.SERVER === 'Live') {
				let channel = await interaction.client.channels.fetch('1010602094694244362');
				let sentMessage = await channel.send({ embeds: [embed] });
				sentMessage.crosspost();
			}

			let pingUsers = await DBDiscordUsers.findAll({
				where: {
					tournamentPings: true
				}
			});

			let pingedUsers = 0;

			//Load the country data csv and get the continent
			const fs = require('fs');
			let countryData = fs.readFileSync('./other/country-and-continent-codes-list.csv', 'utf8');
			let countryDataArray = countryData.split('\r\n');
			for (let i = 0; i < countryDataArray.length; i++) {
				countryDataArray[i] = countryDataArray[i].split(',');

				for (let j = 0; j < countryDataArray[i].length; j++) {
					while (countryDataArray[i][j].startsWith('"') && !countryDataArray[i][j].endsWith('"')) {
						countryDataArray[i][j] = countryDataArray[i][j] + ',' + countryDataArray[i][j + 1];
						countryDataArray[i].splice(j + 1, 1);
						j--;
					}

					if (countryDataArray[i][j].startsWith('"')) {
						countryDataArray[i][j] = countryDataArray[i][j].substring(1, countryDataArray[i][j].length - 1);
					}
				}
			}

			for (let i = 0; i < pingUsers.length; i++) {
				try {
					let user = pingUsers[i];
					if (user.userId) {
						//Check the rank range
						let validRank = false;
						let rankRange = forumPost.rankRange.split('|');
						for (let j = 0; j < rankRange.length; j++) {
							if (rankRange[j].toLowerCase().includes('open rank')) {
								rankRange[j] = '1-∞';
							}
							rankRange[j] = rankRange[j].split('-');

							// Standardize rank range
							for (let k = 0; k < rankRange[j].length; k++) {
								rankRange[j][k] = rankRange[j][k].trim();
								rankRange[j][k] = rankRange[j][k].toLowerCase().replace('infinity', '999999999');
								rankRange[j][k] = rankRange[j][k].replace('∞', '999999999');
								rankRange[j][k] = rankRange[j][k].replace('.', '');
								rankRange[j][k] = rankRange[j][k].replace(',', '');
								rankRange[j][k] = rankRange[j][k].replace(/ /gm, '');
								rankRange[j][k] = rankRange[j][k].replace('k', '000');
								rankRange[j][k] = parseInt(rankRange[j][k]);
							}

							// Get the correct rank
							let osuRank = parseInt(user.osuRank);

							if (forumPost.gamemode === 'Taiko') {
								osuRank = parseInt(user.taikoRank);
							} else if (forumPost.gamemode === 'Catch the Beat') {
								osuRank = parseInt(user.catchRank);
							} else if (forumPost.gamemode === 'Mania') {
								osuRank = parseInt(user.maniaRank);
							}

							// adapt the rank to bws rank if bws is enabled
							if (forumPost.bws) {
								osuRank = Math.round(Math.pow(osuRank, Math.pow(0.9937, Math.pow(parseInt(user.osuBadges), 2))));
							}

							//Swap the rank range if it's backwards
							if (rankRange[j][0] > rankRange[j][1]) {
								let temp = rankRange[j][0];
								rankRange[j][0] = rankRange[j][1];
								rankRange[j][1] = temp;
							}

							let maxRank = 1;

							if (user.tournamentPingsStartingFrom) {
								maxRank = Number(user.tournamentPingsStartingFrom);
							}

							if (osuRank >= rankRange[j][0] && osuRank <= rankRange[j][1] && rankRange[j][0] >= maxRank) {
								validRank = true;
								break;
							}
						}

						if (validRank) {
							if (user.tournamentPingsBadged && !forumPost.badged) {
								continue;
							}

							//Check for mode restrictions
							if (forumPost.gamemode === 'Standard') {
								if (user.tournamentPingsMode && user.tournamentPingsMode !== 'all' && !user.tournamentPingsMode.includes('s')) {
									continue;
								}
							} else if (forumPost.gamemode === 'Taiko') {
								if (!user.tournamentPingsMode || user.tournamentPingsMode !== 'all' && !user.tournamentPingsMode.includes('t')) {
									continue;
								}
							} else if (forumPost.gamemode === 'Catch the Beat') {
								if (!user.tournamentPingsMode || user.tournamentPingsMode !== 'all' && !user.tournamentPingsMode.includes('c')) {
									continue;
								}
							} else if (forumPost.gamemode === 'Mania') {
								if (!user.tournamentPingsMode || user.tournamentPingsMode !== 'all' && !user.tournamentPingsMode.includes('m')) {
									continue;
								}
							}

							if (user.country && forumPost.region && forumPost.region.toLowerCase() !== 'international') {
								let userCountry = null;
								for (let k = 0; k < countryDataArray.length; k++) {
									if (countryDataArray[k][3] === user.country) {
										userCountry = countryDataArray[k];
										break;
									}
								}

								if (!forumPost.region.includes(userCountry[0])) {
									continue;
								}
							}

							let userDM = await interaction.client.users.fetch(user.userId);
							await userDM.send({ content: 'A new tournament has been announced.', embeds: [embed] });
							pingedUsers++;
						}
					}
				} catch (err) {
					if (err.message === 'Cannot send messages to this user') {
						pingUsers[i].tournamentPings = false;
						await pingUsers[i].save();
					} else {
						console.error(err);
					}
				}
			}

			forumPost.pinged = true;
			await forumPost.save();

			interaction.editReply(`Ping sent. (Pinged ${pingedUsers} users)`);

		} else if (interaction.options._subcommand === 'update') {
			let id = interaction.options.getString('id');
			let format = interaction.options.getString('format');
			let rankrange = interaction.options.getString('rankrange');
			let gamemode = interaction.options.getString('gamemode');
			let region = interaction.options.getString('region');
			let notes = interaction.options.getString('notes');
			let bws = interaction.options.getBoolean('bws');
			let badged = interaction.options.getBoolean('badged');
			let outdated = interaction.options.getBoolean('outdated');
			let notournament = interaction.options.getBoolean('notournament');

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
			if (region) {
				forumPost.region = region;
			}
			if (notes) {
				forumPost.notes = notes;
			}
			if (bws !== null) {
				forumPost.bws = bws;
			}
			if (badged !== null) {
				forumPost.badged = badged;
			}
			if (outdated !== null) {
				forumPost.outdated = outdated;
			}
			if (notournament !== null) {
				forumPost.noTournament = notournament;
			}

			await forumPost.save();

			//Create embed
			const embed = new Discord.EmbedBuilder()
				.setTitle(forumPost.title);

			embed.addFields([{ name: 'Forum Post', value: forumPost.forumPost }]);

			if (forumPost.discord) {
				embed.addFields([{ name: 'Discord', value: forumPost.discord }]);
			}

			if (forumPost.host) {
				embed.addFields([{ name: 'Host', value: forumPost.host }]);
			}

			if (forumPost.format) {
				embed.addFields([{ name: 'Format', value: forumPost.format }]);
			} else {
				embed.addFields([{ name: 'Format', value: 'No format specified' }]);
			}

			if (forumPost.rankRange) {
				embed.addFields([{ name: 'Rank Range', value: forumPost.rankRange }]);
			} else {
				embed.addFields([{ name: 'Rank Range', value: 'No rank range specified' }]);
			}

			if (forumPost.gamemode) {
				embed.addFields([{ name: 'Gamemode', value: forumPost.gamemode }]);
			} else {
				embed.addFields([{ name: 'Gamemode', value: 'No gamemode specified' }]);
			}

			if (forumPost.region) {
				embed.addFields([{ name: 'Region', value: forumPost.region }]);
			}

			if (forumPost.notes) {
				embed.addFields([{ name: 'Notes', value: forumPost.notes }]);
			} else {
				embed.addFields([{ name: 'Notes', value: 'No notes specified' }]);
			}

			if (forumPost.bws) {
				embed.addFields([{ name: 'BWS', value: 'Yes' }]);
			} else {
				embed.addFields([{ name: 'BWS', value: 'No' }]);
			}

			if (forumPost.badged) {
				embed.addFields([{ name: 'Badged', value: 'Yes' }]);
			} else {
				embed.addFields([{ name: 'Badged', value: 'No' }]);
			}

			if (forumPost.outdated) {
				embed.addFields([{ name: 'Outdated', value: 'Yes' }]);
			}

			if (forumPost.noTournament) {
				embed.addFields([{ name: 'Not a tournament', value: 'Yes' }]);
			}

			if (forumPost.posted) {
				let posted = new Date(forumPost.posted);
				embed.setFooter({ text: `Posted: ${posted.getUTCDate()}.${posted.getUTCMonth() + 1}.${posted.getUTCFullYear()} by ${forumPost.host}` });
			}

			interaction.editReply({ embeds: [embed] });
		} else if (interaction.options._subcommand === 'delete') {
			let forumPost = await DBOsuForumPosts.findOne({
				where: {
					forumPost: `https://osu.ppy.sh/community/forums/topics/${interaction.options._hoistedOptions[0].value}`
				}
			});

			if (!forumPost) {
				return interaction.editReply('Could not find forum post.');
			}

			await forumPost.destroy();
			return interaction.editReply('Deleted forum post.');
		}
	}
};
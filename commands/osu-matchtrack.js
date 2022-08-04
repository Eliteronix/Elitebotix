const osu = require('node-osu');
const { getGuildPrefix, getIDFromPotentialOsuLink, populateMsgFromInteraction, pause, getOsuPlayerName } = require('../utils');
const { Permissions } = require('discord.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');

module.exports = {
	name: 'osu-matchtrack',
	aliases: ['osu-matchfollow'],
	description: 'Sends an evaluation of how valuable all the players in the match were',
	usage: '<match ID or URL> [# of warmups] [avg]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			await interaction.deferReply();

			msg = await populateMsgFromInteraction(interaction);

			args = [];

			args.push(interaction.options._hoistedOptions[0].value);
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		if (isNaN(matchID)) {
			if (args[0].startsWith('https://osu.ppy.sh/community/matches/') || args[0].startsWith('https://osu.ppy.sh/mp/')) {
				matchID = getIDFromPotentialOsuLink(args[0]);
			} else {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					return msg.reply(`You didn't provide a valid match ID or URL.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
				} else {
					return interaction.editReply(`You didn't provide a valid match ID or URL.\nUsage: \`/${this.name} ${this.usage}\``);
				}
			}
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				if (match.raw_end) {
					if (msg.id) {
						return msg.reply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					} else {
						return interaction.editReply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					}
				}

				let initialMessage = null;

				if (msg.id) {
					initialMessage = msg.reply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				} else {
					initialMessage = await interaction.editReply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				}

				let stop = false;

				const reactionCollector = initialMessage.createReactionCollector();

				reactionCollector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '🛑' && user.id === msg.author.id) {
						reactionCollector.stop();
					}
				});

				reactionCollector.on('end', () => {
					stop = true;
					initialMessage.reactions.removeAll().catch(() => { });
					if (msg.id) {
						msg.reply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					} else {
						interaction.editReply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					}
				});

				reactionCollector.on('error', (error) => {
					console.log(error);
				});

				initialMessage.react('🛑');

				let latestEventId = null;

				let lastMessage = null;
				let lastMessageType = 'mapresult';

				while (!stop) {
					console.log(match.id, latestEventId, lastMessageType);
					await fetch(`https://osu.ppy.sh/community/matches/${match.id}`)
						.then(async (res) => {
							let htmlCode = await res.text();
							htmlCode = htmlCode.replace(/&quot;/gm, '"');
							// console.log(htmlCode);
							const matchRunningRegex = /{"match".+,"current_game_id":d+}/gm;
							const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
							const matchesRunning = matchRunningRegex.exec(htmlCode);
							const matchesPaused = matchPausedRegex.exec(htmlCode);

							let regexMatch = null;
							if (matchesRunning && matchesRunning[0]) {
								regexMatch = matchesRunning[0];
							}

							if (matchesPaused && matchesPaused[0]) {
								regexMatch = matchesPaused[0];
							}

							if (regexMatch) {
								let json = JSON.parse(regexMatch);

								if (!latestEventId) {
									latestEventId = json.latest_event_id;
								}

								if (json.latest_event_id > latestEventId) {
									let playerUpdates = [];
									for (let i = 0; i < json.events.length; i++) {
										if (json.events[i].detail.type === 'other') {
											playerUpdates = [];
										} else if (json.events[i].detail.type === 'host-changed') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`${playerName} became the host.`);
										} else if (json.events[i].detail.type === 'player-joined') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`${playerName} joined the game.`);
										} else if (json.events[i].detail.type === 'player-left') {
											let playerName = await getOsuPlayerName(json.events[i].user_id);
											playerUpdates.push(`${playerName} left the game.`);
										} else if (json.events[i].detail.type === 'match-disbanded') {
											playerUpdates.push('The match has been closed.');
										} else {
											playerUpdates.push(`${json.events[i].detail.type}, ${json.events[i].user_id}`);
										}

										if (json.events[i].id > latestEventId) {
											console.log(json.events[i]);

											if (json.events[i].detail.type === 'match-disbanded') {
												reactionCollector.stop();
											}

											if (lastMessageType === 'mapresult' && json.events[i].detail.type !== 'other') {
												let embed = new Discord.MessageEmbed()
													.setColor(0x0099FF)
													.setTitle(`Match \`${match.name.replace(/`/g, '')}\``)
													.setDescription(`${playerUpdates.join('\n')}`);

												lastMessage = await msg.channel.send({ embeds: [embed] });
											} else if (json.events[i].detail.type === 'other') {
												let message = `Match \`${match.name.replace(/`/g, '')}\` Map: ${json.events[i].game.beatmap.id}`;
												lastMessage = await msg.channel.send(message);
											} else if (json.events[i].detail.type !== 'other') {
												let embed = new Discord.MessageEmbed()
													.setColor(0x0099FF)
													.setTitle(`Match \`${match.name.replace(/`/g, '')}\``)
													.setDescription(`${playerUpdates.join('\n')}`);

												lastMessage.edit({ embeds: [embed] });
											}


											if (json.events[i].detail.type === 'other') {
												lastMessageType = 'mapresult';
											} else {
												lastMessageType = 'updates';
											}
										}
									}

									latestEventId = json.latest_event_id;
								}
							}
						});

					await pause(15000);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					} else {
						return interaction.editReply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					}
				} else {
					console.log(err);
				}
			});
	},
};
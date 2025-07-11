const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles, DBGuilds, DBStarBoardMessages } = require('./dbObjects');
const cooldowns = new Discord.Collection();
const { developers } = require('./config.json');
//Import Sequelize for operations
const Sequelize = require('sequelize');
const { getMods, getOsuBeatmap, pause, getBeatmapModeId } = require('./utils');
const Op = Sequelize.Op;

module.exports = async function (reaction, user) {
	//Check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which needs to be handled
		try {
			await reaction.fetch();
		} catch (error) {
			if (error.message !== 'Unknown Message' && error.message !== 'Missing Access') {
				console.error('Something went wrong when fetching the message: ', error);
				// Return as `reaction.message.author` may be undefined/null
				return;
			}
		}
	}

	//Return if the bot reacted itself or if it was not a bot message
	if (user.id === reaction.client.user.id) {
		return;
	}

	process.send(`discorduser ${user.id}}`);

	if (reaction._emoji.name === '⭐') {
		const guild = await DBGuilds.findOne({
			attributes: ['id', 'starBoardEnabled', 'starBoardMinimum', 'starBoardChannel'],
			where: {
				guildId: reaction.message.guild.id
			}
		});

		if (guild && guild.starBoardEnabled && parseInt(guild.starBoardMinimum) <= reaction.count && guild.starBoardChannel !== reaction.message.channel.id) {
			const starBoardedMessage = await DBStarBoardMessages.findOne({
				attributes: ['id', 'starBoardMessageId', 'starBoardChannelId', 'starBoardMessageStarsQuantityMax'],
				where: {
					originalMessageId: reaction.message.id
				}
			});

			if (starBoardedMessage) {
				let channel;
				try {
					channel = await reaction.client.channels.fetch(starBoardedMessage.starBoardChannelId);
				} catch (error) {
					if (error.message !== 'Unknown Channel') {
						console.error(error);
					}
				}
				if (channel) {
					let message;
					try {
						message = await channel.messages.fetch({ message: starBoardedMessage.starBoardMessageId });
					} catch (error) {
						if (error.message !== 'Unknown Message') {
							console.error(error);
						}
					}

					//Check that the message was sent from itself (Avoiding migration issues from legacy messages)
					if (message && message.author.id === reaction.client.user.id) {
						const starBoardMessageEmbed = new Discord.EmbedBuilder()
							.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
							.setColor('#d9b51c')
							.setDescription(reaction.message.content)
							.addFields(
								{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
							)
							.setTimestamp();

						reaction.message.attachments.forEach(attachment => {
							starBoardMessageEmbed
								.addFields([{ name: 'Attachment', value: attachment.name }])
								.setImage(attachment.url);
						});

						if (starBoardedMessage.starBoardMessageStarsQuantityMax <= reaction.count || starBoardedMessage.starBoardMessageStarsQuantityMax == null) {
							starBoardedMessage.starBoardMessageStarsQuantityMax = reaction.count;
							starBoardedMessage.save();
							return message.edit(`${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, starBoardMessageEmbed);
						} else {
							return message.edit(`${reaction.count} ⭐ in <#${reaction.message.channel.id}>\nMaximum ⭐: ${starBoardedMessage.starBoardMessageStarsQuantityMax}`, starBoardMessageEmbed);
						}
					}
				}

				//Try to resend the message
				const starBoardMessageEmbed = new Discord.EmbedBuilder()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.setDescription(reaction.message.content)
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addFields([{ name: 'Attachment', value: attachment.name }])
						.setImage(attachment.url);
				});

				try {
					channel = await reaction.client.channels.fetch(guild.starBoardChannel);
				} catch (error) {
					if (error.message === 'Unknown Channel') {
						guild.starBoardEnabled = false;
						guild.save();
						const owner = await reaction.message.client.users.fetch(reaction.message.guild.ownerId);
						return await owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.error(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				starBoardedMessage.starBoardChannelId = starBoardMessage.channel.id;
				starBoardedMessage.starBoardMessageId = starBoardMessage.id;
				starBoardedMessage.save();
			} else {
				const starBoardMessageEmbed = new Discord.EmbedBuilder()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				if (reaction.message.content) {
					starBoardMessageEmbed.setDescription(reaction.message.content);
				}

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addFields([{ name: 'Attachment', value: attachment.name }])
						.setImage(attachment.url);
				});

				let channel;
				try {
					channel = await reaction.client.channels.fetch(guild.starBoardChannel);
				} catch (error) {
					if (error.message === 'Unknown Channel') {
						guild.starBoardEnabled = false;
						guild.save();
						const owner = await reaction.message.client.users.fetch(reaction.message.guild.ownerId);
						return await owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.error(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				DBStarBoardMessages.create({ originalChannelId: reaction.message.channel.id, originalMessageId: reaction.message.id, starBoardChannelId: starBoardMessage.channel.id, starBoardMessageId: starBoardMessage.id, starBoardedMessagestarBoardMessageStarsQuantityMax: 1 });
			}
		}

		return;
	}

	if (!reaction.message.author ||
		reaction.message.author.id !== reaction.client.user.id &&
		reaction.message.author.id !== '784836063058329680') {
		return;
	}

	if (!reaction.message.attachments.size) {
		// Refetch the message to get the attachments
		try {
			reaction.message = await reaction.message.fetch({ force: true });
		} catch (error) {
			if (error.message !== 'Unknown Message') {
				console.error(error);
			}
			return;
		}
	}

	let firstAttachment = reaction.message.attachments.first();

	if (firstAttachment) {

		if (firstAttachment.name.match(/.+leaderboard.+page.+/g)) {
			let commandName = firstAttachment.name.match(/.+leaderboard/g);
			let page = firstAttachment.name.replace(/.+page/g, '').replace('.png', '');
			let mode = firstAttachment.name.replace(/.+mode-/gm, '').replace(/-.+/gm, '');

			if (firstAttachment.name.replace(/.+leaderboard-/g, '').replace(/-.+/g, '') !== user.id) {
				return;
			}
			if (reaction._emoji.name === '◀️') {
				page--;
			} else if (reaction._emoji.name === '▶️') {
				page++;
			} else {
				return;
			}
			let message;
			if (commandName[0] !== 'osu-duelrating-leaderboard') {
				const command = require(`./commands/${commandName[0]}.js`);
				if (commandName[0] == 'osu-leaderboard') {
					message = {
						client: reaction.message.client,
						guild: reaction.message.guild,
						guildId: reaction.message.guild.id,
						content: `e!${commandName[0]} --${mode} ${page}`,
						author: user,
						channel: reaction.message.channel,
					};

					process.send(`command ${command.name}`);

					command.execute(null, message, [page, `--${mode}`]);
				} else {
					message = {
						client: reaction.message.client,
						guild: reaction.message.guild,
						guildId: reaction.message.guild.id,
						content: `e!${commandName[0]} ${page}`,
						author: user,
						channel: reaction.message.channel,
					};

					process.send(`command ${command.name}`);

					command.execute(null, message, [page]);
				}
			} else {
				let guild = null;
				let guildId = null;
				if (reaction.message.guild) {
					guild = reaction.message.guild;
					guildId = reaction.message.guild.id;
				}
				let interaction = {
					guild: guild,
					guildId: guildId,
					options: {
						_subcommand: 'rating-leaderboard',
						_hoistedOptions: [{ name: 'page', value: page }]
					},
					user: user,
					channel: reaction.message.channel,
				};

				const command = require('./commands/osu-duel.js');

				process.send(`command ${command.name}`);

				command.execute(interaction, null, [page]);
			}

			return await reaction.message.delete();
		}

		//For the compare emoji
		if (reaction._emoji.id === '827974793365159997') {
			if (firstAttachment.name.startsWith('osu-recent') || firstAttachment.name.startsWith('osu-score')) {
				const beatmapId = firstAttachment.name.replace(/osu-(recent|score)-\d+-/, '').replace(/-.*/gm, '');

				const beatmap = await getOsuBeatmap({ beatmapId: beatmapId });

				let args = [beatmapId, `--${beatmap.mode}`];

				const command = require('./commands/osu-score.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					commandName: 'osu-score',
					channel: reaction.message.channel,
					client: reaction.message.client,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'beatmap') {
								return beatmapId;
							}
						},
						getNumber: (string) => {
							if (string === 'gamemode') {
								return getBeatmapModeId(beatmap);
							}
						},
						getInteger: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			} else if (firstAttachment.name.startsWith('osu-beatmap')) {
				const beatmapId = firstAttachment.name.replace('osu-beatmap-', '').replace(/-.+/gm, '');

				const command = require('./commands/osu-score.js');

				if (await checkCooldown(reaction, command, user, beatmapId) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					commandName: 'osu-score',
					channel: reaction.message.channel,
					client: reaction.message.client,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'beatmap') {
								return beatmapId;
							}
						},
						getNumber: () => { },
						getInteger: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			} else if (firstAttachment.name.startsWith('osu-game-')) {
				const beatmapId = firstAttachment.name.replace(/osu-game-\d+-/gm, '').replace(/-.*/gm, '');

				const command = require('./commands/osu-score.js');

				if (await checkCooldown(reaction, command, user, beatmapId) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					commandName: 'osu-score',
					channel: reaction.message.channel,
					client: reaction.message.client,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'beatmap') {
								return beatmapId;
							} else if (string === 'server') {
								return 'tournaments';
							}
						},
						getNumber: () => { },
						getInteger: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//Check if reacted for map information
		if (reaction._emoji.name === '🗺️') {
			//Check if it is actually a scorepost
			if (firstAttachment.name.startsWith('osu-recent-') || firstAttachment.name.startsWith('osu-score')) {
				//Regex the beatmapId out of there
				const beatmapId = firstAttachment.name.replace(/osu-(recent|score)-\d+-/, '').replace(/-.*/gm, '');

				//get the mods used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				let mods = getMods(modBits);

				if (!mods[0]) {
					mods = ['NM'];
				}

				//Setup artificial arguments
				let args = [beatmapId, `--${mods.join('')}`];

				const command = require('./commands/osu-beatmap.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					commandName: 'osu-beatmap',
					channel: reaction.message.channel,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'mods') {
								return getMods(modBits).join('');
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			} else if (firstAttachment.name.startsWith('osu-game-')) {
				const beatmapId = firstAttachment.name.replace(/osu-game-\d+-/gm, '').replace(/-.*/gm, '');

				//get the mods used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				let mods = getMods(modBits);

				if (!mods[0]) {
					mods = ['NM'];
				}

				let args = [beatmapId, `--${mods.join('')}`];

				const command = require('./commands/osu-beatmap.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					commandName: 'osu-beatmap',
					channel: reaction.message.channel,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'mods') {
								return getMods(modBits).join('');
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//Check if reacted for skills information
		if (reaction._emoji.name === '📈') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-profile') || firstAttachment.name.startsWith('osu-top') || firstAttachment.name.startsWith('osu-league-ratings') || firstAttachment.name.startsWith('osu-mostplayed')) {
				//get the osuUserId used
				let osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');
				if (firstAttachment.name.startsWith('osu-top')) {
					osuUserId = firstAttachment.name.replace(/.mode./gm, '').replace('.png', '').replace(/.*-/, '');
				}

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-skills.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.client,
					channel: reaction.message.channel,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId.toString();
							}
						},
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				try {
					process.send(`command ${command.name}`);

					command.execute(interaction);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
					reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
					await eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
				}
			}
		}

		//Check if reacted for profile information
		if (reaction._emoji.name === '👤') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-score') || firstAttachment.name.startsWith('osu-recent') || firstAttachment.name.startsWith('osu-league-ratings') || firstAttachment.name.startsWith('osu-topPlayStats') || firstAttachment.name.startsWith('osu-mostplayed')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace('osu-recent-', '').replace('osu-score-', '').replace('osu-league-ratings-', '').replace('osu-topPlayStats-', '').replace('osu-mostplayed-', '').replace(/-.+.png/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-profile.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					channel: reaction.message.channel,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId.toString();
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			} else if (firstAttachment.name.startsWith('osu-topPlayStats') || firstAttachment.name.startsWith('osu-top')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace(/.mode./gm, '').replace('.png', '').replace(/.*-/, '');
				let mode = firstAttachment.name.replace(/.+.mode/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId, mode];

				const command = require('./commands/osu-profile.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					channel: reaction.message.channel,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId.toString();
							}
						},
						getNumber: (string) => {
							if (string === 'gamemode') {
								return mode;
							}
						},
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//Check if reacted for schedule information
		if (reaction._emoji.name === '📊') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-topPlayStats') || firstAttachment.name.startsWith('osu-profile') || firstAttachment.name.startsWith('osu-league-ratings')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-schedule.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Set author of a temporary message copy to the reacting user to not break the commands
				let guildId = null;

				if (reaction.message.guild) {
					guildId = reaction.message.guild.id;
				}

				let tempMessage = {
					guild: reaction.message.guild,
					guildId: guildId,
					content: `e!osu-schedule ${osuUserId}`,
					author: user,
					channel: reaction.message.channel,
				};

				try {
					process.send(`command ${command.name}`);

					command.execute(null, tempMessage, args);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
					reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
					await eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
				}
			}
		}

		//Check if reacted for schedule information
		if (reaction._emoji.name === '🥇') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-topPlayStats') || firstAttachment.name.startsWith('osu-profile') || firstAttachment.name.startsWith('osu-league-ratings')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-top.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					channel: reaction.message.channel,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId.toString();
							}
						},
						getNumber: () => { },
						getInteger: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			} else if (firstAttachment.name.startsWith('osu-game-')) {
				//get the osuUserId used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				const beatmapId = firstAttachment.name.replace(`-${modBits}.png`, '').replace(/.+-/gm, '');

				const command = require('./commands/osu-mapleaderboard.js');

				let args = [beatmapId, modBits];

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'server') {
								return 'tournaments';
							} else if (string === 'mods') {
								return getMods(modBits).join('');
							}
						},
						getInteger: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				try {
					process.send(`command ${command.name}`);

					command.execute(interaction);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
					reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
					await eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
				}
			}
		}

		//Check if reacted for matchup information
		if (reaction._emoji.name === '🆚') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-topPlayStats') || firstAttachment.name.startsWith('osu-profile') || firstAttachment.name.startsWith('osu-league-ratings')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-matchup.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					channel: reaction.message.channel,
					client: reaction.message.client,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId;
							}
						},
						getInteger: () => { },
						getBoolean: () => { },
						getSubcommand: () => {
							return '1v1';
						},
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
					editReply: async (input) => {
						if (typeof input === 'string' && input.includes('Processing')) {
							return;
						}
						return await reaction.message.channel.send(input);
					},
				};

				try {
					process.send(`command ${command.name}`);

					command.execute(interaction);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
					reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
					await eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
				}
			}
		}

		if (reaction._emoji.name === '🔵' || reaction._emoji.name === '🔴') {
			//Check if it is a matchup
			if (firstAttachment.name.startsWith('osu-matchup')) {
				//get the osuUserId used
				let osuUserId;
				if (reaction._emoji.name === '🔴') {
					osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');
				} else {
					osuUserId = firstAttachment.name.replace('osu-matchup-', '').replace(/-.+/, '');
				}
				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-profile.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					channel: reaction.message.channel,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'username') {
								return osuUserId.toString();
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//Check if reacted for osu-duel-rating information
		if (reaction._emoji.id === '951396806653255700') {
			//Check if it is a profile
			if (firstAttachment.name.startsWith('osu-profile') || firstAttachment.name.startsWith('osu-topPlayStats')) {
				//get the osuUserId used
				const osuUserId = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				//Setup artificial arguments
				let args = [osuUserId];

				const command = require('./commands/osu-duel.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Set author of a temporary message copy to the reacting user to not break the commands
				let guildId = null;

				if (reaction.message.guild) {
					guildId = reaction.message.guild.id;
				}

				let interaction = {
					client: reaction.client,
					guild: reaction.message.guild,
					guildId: guildId,
					options: {
						_subcommand: 'rating',
						_hoistedOptions: [{ name: 'username', value: args[0] }]
					},
					user: user,
					channel: reaction.message.channel,
				};

				try {
					process.send(`command ${command.name}`);

					command.execute(interaction, null, args);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
					reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
					await eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
				}
			}
		}

		//For the compare emoji | EZ | HT | HD | DT | HR | FL | FI
		if (reaction._emoji.id === '918920760586805259'
			|| reaction._emoji.id === '918921193426411544'
			|| reaction._emoji.id === '918922015182827531'
			|| reaction._emoji.id === '918920670023397396'
			|| reaction._emoji.id === '918938816377671740'
			|| reaction._emoji.id === '918920836755382343'
			|| reaction._emoji.id === '918922047994880010') {
			if (firstAttachment.name.startsWith('osu-beatmap')) {
				const beatmapId = firstAttachment.name.replace('osu-beatmap-', '').replace(/-.+/gm, '');

				const dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

				//get the mods used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				let mods = getMods(modBits);

				if (reaction._emoji.name === 'EZ' && mods.includes('HR')) {
					mods.splice(mods.indexOf('HR'), 1);
				} else if (reaction._emoji.name === 'HR' && mods.includes('EZ')) {
					mods.splice(mods.indexOf('EZ'), 1);
				} else if (reaction._emoji.name === 'HT' && mods.includes('DT')) {
					mods.splice(mods.indexOf('DT'), 1);
				} else if (reaction._emoji.name === 'DT' && mods.includes('HT')) {
					mods.splice(mods.indexOf('HT'), 1);
				} else if (reaction._emoji.name === 'HD' && dbBeatmap.mode === 'Mania' && mods.includes('FL')) {
					mods.splice(mods.indexOf('FL'), 1);
				} else if (reaction._emoji.name === 'HD' && dbBeatmap.mode === 'Mania' && mods.includes('FI')) {
					mods.splice(mods.indexOf('FI'), 1);
				} else if (reaction._emoji.name === 'FL' && dbBeatmap.mode === 'Mania' && mods.includes('FI')) {
					mods.splice(mods.indexOf('FI'), 1);
				} else if (reaction._emoji.name === 'FL' && dbBeatmap.mode === 'Mania' && mods.includes('HD')) {
					mods.splice(mods.indexOf('HD'), 1);
				} else if (reaction._emoji.name === 'FI' && dbBeatmap.mode === 'Mania' && mods.includes('HD')) {
					mods.splice(mods.indexOf('HD'), 1);
				} else if (reaction._emoji.name === 'FI' && dbBeatmap.mode === 'Mania' && mods.includes('FL')) {
					mods.splice(mods.indexOf('FL'), 1);
				}

				if (!mods.includes(reaction._emoji.name)) {
					mods.push(reaction._emoji.name);
				} else {
					mods.splice(mods.indexOf(reaction._emoji.name), 1);
				}

				if (!mods[0]) {
					mods = ['NM'];
				}

				let args = [beatmapId, `--${mods.join('')}`];

				const command = require('./commands/osu-beatmap.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					commandName: 'osu-beatmap',
					channel: reaction.message.channel,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'mods') {
								return mods.join('');
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//For the compare emoji
		if (reaction._emoji.id === '918935327215861760') {
			if (firstAttachment.name.startsWith('osu-beatmap')) {
				const beatmapId = reaction.message.content.replace('osu-beatmap-', '').replace(/-.+/gm, '');

				//get the mods used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				let mods = getMods(modBits);

				if (!mods.includes('HD') && !mods.includes('HR')) {
					mods.push('HD');
					mods.push('HR');
				} else if (mods.includes('HD') && !mods.includes('HR')) {
					mods.push('HR');
				} else if (!mods.includes('HD') && mods.includes('HR')) {
					mods.push('HD');
				} else {
					mods.splice(mods.indexOf('HD'), 1);
					mods.splice(mods.indexOf('HR'), 1);
				}

				if (!mods[0]) {
					mods = ['NM'];
				}

				let args = [beatmapId, `--${mods.join('')}`];

				const command = require('./commands/osu-beatmap.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					commandName: 'osu-beatmap',
					channel: reaction.message.channel,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'mods') {
								return getMods(modBits).join('');
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}

		//For the compare emoji
		if (reaction._emoji.id === '918935350125142036') {
			if (firstAttachment.name.startsWith('osu-beatmap')) {
				const beatmapId = reaction.message.content.replace('osu-beatmap-', '').replace(/-.+/gm, '');

				//get the mods used
				const modBits = firstAttachment.name.replace(/.+-/gm, '').replace('.png', '');

				let mods = getMods(modBits);

				if (!mods.includes('HD') && !mods.includes('DT')) {
					mods.push('HD');
					mods.push('DT');
				} else if (mods.includes('HD') && !mods.includes('DT')) {
					mods.push('DT');
				} else if (!mods.includes('HD') && mods.includes('DT')) {
					mods.push('HD');
				} else {
					mods.splice(mods.indexOf('HD'), 1);
					mods.splice(mods.indexOf('DT'), 1);
				}

				if (!mods[0]) {
					mods = ['NM'];
				}

				let args = [beatmapId, `--${mods.join('')}`];

				const command = require('./commands/osu-beatmap.js');

				if (await checkCooldown(reaction, command, user, args) !== undefined) {
					return;
				}

				//Setup artificial interaction
				let interaction = {
					id: null,
					client: reaction.message.client,
					commandName: 'osu-beatmap',
					channel: reaction.message.channel,
					guild: reaction.message.guild,
					user: user,
					options: {
						getString: (string) => {
							if (string === 'id') {
								return beatmapId;
							} else if (string === 'mods') {
								return getMods(modBits).join('');
							}
						},
						getNumber: () => { },
						getBoolean: () => { },
					},
					deferReply: () => { },
					followUp: async (input) => {
						return await reaction.message.channel.send(input);
					},
				};

				process.send(`command ${command.name}`);

				command.execute(interaction);
			}
		}
	}

	if (reaction.message.channel.type === Discord.ChannelType.DM) {
		return;
	}

	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		attributes: ['id'],
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			attributes: ['roleId'],
			where: {
				dbReactionRolesHeaderId: dbReactionRolesHeader.id,
				emoji: reaction._emoji.name
			}
		});

		if (dbReactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(dbReactionRole.roleId);

			//Check if deleted role
			if (reactionRoleObject) {
				//Get member
				let member = null;

				while (!member) {
					try {
						member = await reaction.message.guild.members.fetch({ user: [user.id], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('reactionAdded.js | Reactionrole assign 1', e);
							return;
						}
					}
				}

				member = member.first();

				try {
					//Assign role
					await member.roles.add(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return await owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.error(e);
					}
				}
			} else {
				DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRole.roleId } });
				editEmbed(reaction.message, dbReactionRolesHeader);
			}
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<%:' + reaction._emoji.name + ':';

			//Get the reactionRole from the db by all the string (works for general emojis)
			const dbReactionRoleBackup = await DBReactionRoles.findOne({
				attributes: ['roleId'],
				where: {
					dbReactionRolesHeaderId: dbReactionRolesHeader.id,
					emoji: {
						[Op.like]: emoji + '%'
					}
				}
			});

			if (dbReactionRoleBackup) {
				//Get role object
				const reactionRoleBackupObject = reaction.message.guild.roles.cache.get(dbReactionRoleBackup.roleId);

				//Check if deleted role
				if (reactionRoleBackupObject) {
					//Get member
					let member = null;

					while (!member) {
						try {
							member = await reaction.message.guild.members.fetch({ user: [user.id], time: 300000 })
								.catch((err) => {
									throw new Error(err);
								});
						} catch (e) {
							if (e.message !== 'Members didn\'t arrive in time.') {
								console.error('reactionAdded.js | Reactionrole assign 2', e);
								return;
							}
						}
					}

					member = member.first();

					try {
						//Assign role
						await member.roles.add(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return await owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.error(e);
						}
					}
				} else {
					DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRoleBackup.roleId } });
					editEmbed(reaction.message, dbReactionRolesHeader);
				}
			} else {
				console.error(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.EmbedBuilder()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter({ text: `Reactionrole - EmbedId: ${reactionRolesHeader.id}` });

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		attributes: ['emoji', 'roleId', 'description'],
		where: {
			dbReactionRolesHeaderId: reactionRolesHeader.id
		}
	});

	//Add roles to embed
	reactionRoles.forEach(reactionRole => {
		//Get role object
		let reactionRoleName = msg.guild.roles.cache.get(reactionRole.roleId);
		//Add field to embed
		reactionRoleEmbed.addFields([{ name: reactionRole.emoji + ': ' + reactionRoleName.name, value: reactionRole.description }]);
	});

	//Get the Id of the message
	const embedMessageId = reactionRolesHeader.reactionHeaderId;
	//get the Id of the channel
	const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
	//Get the channel object
	let embedChannel;
	try {
		embedChannel = msg.guild.channels.cache.get(embedChannelId);
	} catch (e) {
		await msg.channel.send('Couldn\'t find an embed with this EmbedId');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guildId, id: reactionRolesHeader.id },
		});
		return console.error(e);
	}
	//Get the message object
	const embedMessage = await embedChannel.messages.fetch({ message: embedMessageId });
	//Edit the message
	embedMessage.edit(reactionRoleEmbed);

	//Remove all reactions from the embed
	embedMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));

	//Add reactions to embed
	for (let i = 0; i < reactionRoles.length; i++) {
		try {
			//Add reaction
			await embedMessage.react(reactionRoles[i].emoji);
		} catch (e) {
			if (e.message === 'Missing Access') {
				const owner = await msg.client.users.cache.find(user => user.id === msg.guild.ownerId);
				return await owner.send(`I could not add reactions to a reactionrole-embed because I'm missing the \`Add Reactions\` permission on \`${msg.guild.name}\`.`);
			} else {
				return console.error(e);
			}
		}
	}
}


async function checkCooldown(reaction, command, user, args) {
	if (!cooldowns.has(command.name + args)) {
		cooldowns.set(command.name + args, new Discord.Collection());
	}

	//Set current time
	const now = Date.now();
	//gets the collections for the current command used
	const timestamps = cooldowns.get(command.name + args);
	//set necessary cooldown amount; if non stated in command default to 5; calculate ms afterwards
	const cooldownAmount = (command.cooldown || 5) * 1000;

	//get expiration times for the cooldowns for the reaction author
	if (timestamps.has(user.id)) {
		const expirationTime = timestamps.get(user.id) + cooldownAmount;

		//If cooldown didn't expire yet send cooldown message
		if (command.noCooldownMessage) {
			return;
		} else if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return await reaction.message.channel.send(`<@${user.id}>, you need to wait ${timeLeft.toFixed(1)} seconds before you can use this command again.`)
				.then(async (msg) => {
					await pause(5000);
					await msg.delete();
				});
		}
	}

	//Set timestamp for the used command
	if (!developers.includes(user.id)) {
		timestamps.set(user.id, now);
	}
	//Automatically delete the timestamp after the cooldown
	setTimeout(() => timestamps.delete(user.id), cooldownAmount);
}
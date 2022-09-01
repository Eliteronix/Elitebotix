const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles, DBGuilds, DBStarBoardMessages } = require('./dbObjects');
const cooldowns = new Discord.Collection();
const { developers } = require('./config.json');
//Import Sequelize for operations
const Sequelize = require('sequelize');
const { isWrongSystem, getMods, logDatabaseQueries, getOsuBeatmap, pause } = require('./utils');
const Op = Sequelize.Op;

module.exports = async function (reaction, user, additionalObjects) {
	if (reaction.message.guild && isWrongSystem(reaction.message.guild.id, reaction.message.channel.type === 'DM')) {
		return;
	}

	//Check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which needs to be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	//Return if the bot reacted itself or if it was not a bot message
	if (user.id === reaction.client.user.id) {
		return;
	}

	if (reaction._emoji.name === '⭐') {
		logDatabaseQueries(2, 'reactionAdded.js DBGuilds Starboard');
		const guild = await DBGuilds.findOne({
			where: { guildId: reaction.message.guild.id }
		});

		if (guild && guild.starBoardEnabled && parseInt(guild.starBoardMinimum) <= reaction.count && guild.starBoardChannel !== reaction.message.channel.id) {
			logDatabaseQueries(2, 'reactionAdded.js DBStarBoardMessages Starboardmessage');
			const starBoardedMessage = await DBStarBoardMessages.findOne({
				where: { originalMessageId: reaction.message.id }
			});

			if (starBoardedMessage) {
				let channel;
				try {
					channel = await reaction.client.channels.fetch(starBoardedMessage.starBoardChannelId);
				} catch (error) {
					if (error.message !== 'Unknown Channel') {
						console.log(error);
					}
				}
				if (channel) {
					let message;
					try {
						message = await channel.messages.fetch(starBoardedMessage.starBoardMessageId);
					} catch (error) {
						if (error.message !== 'Unknown Message') {
							console.log(error);
						}
					}

					//Check that the message was sent from itself (Avoiding migration issues from legacy messages)
					if (message && message.author.id === reaction.client.user.id) {
						const starBoardMessageEmbed = new Discord.MessageEmbed()
							.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
							.setColor('#d9b51c')
							.setDescription(reaction.message.content)
							.addFields(
								{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
							)
							.setTimestamp();

						reaction.message.attachments.forEach(attachment => {
							starBoardMessageEmbed
								.addField('Attachment', attachment.name)
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
				const starBoardMessageEmbed = new Discord.MessageEmbed()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.setDescription(reaction.message.content)
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addField('Attachment', attachment.name)
						.setImage(attachment.url);
				});

				try {
					channel = await reaction.client.channels.fetch(guild.starBoardChannel);
				} catch (error) {
					if (error.message === 'Unknown Channel') {
						guild.starBoardEnabled = false;
						guild.save();
						const owner = await reaction.message.client.users.fetch(reaction.message.guild.ownerId);
						return owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.log(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				starBoardedMessage.starBoardChannelId = starBoardMessage.channel.id;
				starBoardedMessage.starBoardMessageId = starBoardMessage.id;
				starBoardedMessage.save();
			} else {
				const starBoardMessageEmbed = new Discord.MessageEmbed()
					.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
					.setColor('#d9b51c')
					.setDescription(reaction.message.content)
					.addFields(
						{ name: 'Link', value: `[Open](https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id})` },
					)
					.setTimestamp();

				reaction.message.attachments.forEach(attachment => {
					starBoardMessageEmbed
						.addField('Attachment', attachment.name)
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
						return owner.send(`It seems like the starboard channel on the guild \`${reaction.message.guild.name}\` has been deleted.\nThe starboard has been deactivated.`);
					}
					console.log(error);
				}

				const starBoardMessage = await channel.send({ content: `${reaction.count} ⭐ in <#${reaction.message.channel.id}>`, embeds: [starBoardMessageEmbed] });
				DBStarBoardMessages.create({ originalChannelId: reaction.message.channel.id, originalMessageId: reaction.message.id, starBoardChannelId: starBoardMessage.channel.id, starBoardMessageId: starBoardMessage.id, starBoardedMessagestarBoardMessageStarsQuantityMax: 1 });
			}
		}

		return;
	}

	if (reaction.message.author.id !== reaction.client.user.id && reaction.message.author.id !== '784836063058329680') {
		return;
	}

	if (reaction.message.attachments.first() && reaction.message.attachments.first().name.match(/.+leaderboard.+page.+/g)) {
		let commandName = reaction.message.attachments.first().name.match(/.+leaderboard/g);
		let page = reaction.message.attachments.first().name.replace(/.+page/g, '').replace('.png', '');
		let mode = reaction.message.attachments.first().name.replace(/.+mode-/gm, '').replace(/-.+/gm, '');

		if (reaction.message.attachments.first().name.replace(/.+leaderboard-/g, '').replace(/-.+/g, '') !== user.id) {
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
					guild: reaction.message.guild,
					guildId: reaction.message.guild.id,
					content: `e!${commandName[0]} --${mode} ${page}`,
					author: user,
					channel: reaction.message.channel,
				};
				command.execute(message, [page, `--${mode}`], null, additionalObjects);
			} else {
				message = {
					guild: reaction.message.guild,
					guildId: reaction.message.guild.id,
					content: `e!${commandName[0]} ${page}`,
					author: user,
					channel: reaction.message.channel,
				};
				command.execute(message, [page], null, additionalObjects);
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

			command.execute(null, [page], interaction, additionalObjects);
		}

		return reaction.message.delete();
	}

	const didYouMeanRegex = /I could not find the command `.+`.\nDid you mean `.+`?/gm;
	if (reaction.message.content && reaction.message.mentions.repliedUser && reaction.message.mentions.repliedUser.id && reaction.message.mentions.repliedUser.id === user.id && reaction.message.content.match(didYouMeanRegex)
		|| reaction.message.content && reaction.message.mentions.repliedUser && reaction.message.mentions.repliedUser.id && reaction.message.mentions.repliedUser.id === user.id && reaction.message.content.match(didYouMeanRegex)) {
		if (reaction._emoji.name === '✅') {
			//Grab old message and change content instead
			reaction.message.channel.messages.fetch(reaction.message.reference.messageId).then(async (message) => {

				if (message) {
					const didYouMeanBeginningRegex = /I could not find the command `.+`.\nDid you mean `/gm;
					message.content = reaction.message.content.substring(0, reaction.message.content.length - 2).replace(didYouMeanBeginningRegex, '');

					//Get gotMessage
					const gotMessage = require('./gotMessage');

					gotMessage(message);

					return reaction.message.delete();
				} else {
					reaction.message.channel.send(`<@${user.id}>, the autocorrected message seems to be too old to retrieve. Please send a new one.`);
				}
			});
		} else if (reaction._emoji.name === '❌') {
			return reaction.message.delete();
		}
	}

	//For the compare emoji
	if (reaction._emoji.id === '827974793365159997') {
		const scoreRegex = /.+\nSpectate: .+\nBeatmap: .+\nosu! direct: .+/gm;
		const beatmapRegex = /Website: <https:\/\/osu.ppy.sh\/b\/.+>\nosu! direct: <osu:\/\/b\/.+>/gm;
		if (reaction.message.content.match(scoreRegex)) {
			const beginningRegex = /.+\nSpectate: .+\nBeatmap: <https:\/\/osu.ppy.sh\/b\//gm;
			const endingRegex = />\nosu! direct:.+/gm;
			const beatmapId = reaction.message.content.replace(beginningRegex, '').replace(endingRegex, '');

			const beatmap = await getOsuBeatmap({ beatmapId: beatmapId });

			let args = [beatmapId, `--${beatmap.mode}`];

			const command = require('./commands/osu-score.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-score ${beatmapId} --${beatmap.mode}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		} else if (reaction.message.content.match(beatmapRegex)) {
			const beginningRegex = /Website: https:\/\/osu.ppy.sh\/b\/.+\nosu! direct: osu:\/\/b\//gm;
			const beatmapId = reaction.message.content.replace(beginningRegex, '').replace('>', '');

			let args = [beatmapId];

			const command = require('./commands/osu-score.js');

			if (checkCooldown(reaction, command, user, beatmapId) !== undefined) {
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
				content: `e!osu-score ${beatmapId}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}

		}
	}

	//Check if reacted for map information
	if (reaction._emoji.name === '🗺️') {
		const scoreRegex = /.+\nSpectate: .+\nBeatmap: .+\nosu! direct: .+/gm;
		//Check if it is actually a scorepost
		if (reaction.message.content.match(scoreRegex)) {
			//Regex the beatmapId out of there
			const beginningRegex = /.+\nSpectate: .+\nBeatmap: <https:\/\/osu.ppy.sh\/b\//gm;
			const endingRegex = />\nosu! direct:.+/gm;
			const beatmapId = reaction.message.content.replace(beginningRegex, '').replace(endingRegex, '');

			//get the mods used
			const modBits = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

			let mods = getMods(modBits);

			if (!mods[0]) {
				mods = ['NM'];
			}

			//Setup artificial arguments
			let args = [beatmapId, `--${mods.join('')}`];

			const command = require('./commands/osu-beatmap.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-beatmap ${beatmapId} --${mods.join('')}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for skills information
	if (reaction._emoji.name === '📈') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-profile') || reaction.message.attachments.first().name.startsWith('osu-top') || reaction.message.attachments.first().name.startsWith('osu-league-rankings') || reaction.message.attachments.first().name.startsWith('osu-mostplayed')) {
			//get the osuUserId used
			let osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');
			if (reaction.message.attachments.first().name.startsWith('osu-top')) {
				osuUserId = reaction.message.attachments.first().name.replace(/.mode./gm, '').replace('.png', '').replace(/.*-/, '');
			}

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-skills.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-skills ${osuUserId}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for profile information
	if (reaction._emoji.name === '👤') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-score') || reaction.message.attachments.first().name.startsWith('osu-recent') || reaction.message.attachments.first().name.startsWith('osu-league-rankings') || reaction.message.attachments.first().name.startsWith('osu-topPlayStats') || reaction.message.attachments.first().name.startsWith('osu-mostplayed')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace('osu-recent-', '').replace('osu-score-', '').replace('osu-league-rankings-', '').replace('osu-topPlayStats-', '').replace('osu-mostplayed-', '').replace(/-.+.png/gm, '').replace('.png', '');

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-profile.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-profile ${osuUserId}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		} else if (reaction.message.attachments.first().name.startsWith('osu-topPlayStats') || reaction.message.attachments.first().name.startsWith('osu-top')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace(/.mode./gm, '').replace('.png', '').replace(/.*-/, '');
			let mode = reaction.message.attachments.first().name.replace(/.+.mode/gm, '').replace('.png', '');

			if (mode == 0) {
				mode = '--s';
			} else if (mode == 1) {
				mode = '--t';
			} else if (mode == 2) {
				mode = '--c';
			} else if (mode == 3) {
				mode = '--m';
			}

			//Setup artificial arguments
			let args = [osuUserId, mode];

			const command = require('./commands/osu-profile.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-profile ${osuUserId} ${mode}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for schedule information
	if (reaction._emoji.name === '📊') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-topPlayStats') || reaction.message.attachments.first().name.startsWith('osu-profile') || reaction.message.attachments.first().name.startsWith('osu-league-ratings')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-schedule.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for schedule information
	if (reaction._emoji.name === '🥇') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-topPlayStats') || reaction.message.attachments.first().name.startsWith('osu-profile') || reaction.message.attachments.first().name.startsWith('osu-league-ratings')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-top.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-top ${osuUserId}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for matchup information
	if (reaction._emoji.name === '🆚') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-topPlayStats') || reaction.message.attachments.first().name.startsWith('osu-profile') || reaction.message.attachments.first().name.startsWith('osu-league-ratings')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-matchup.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
				return;
			}

			//Set author of a temporary message copy to the reacting user to not break the commands
			let guildId = null;

			if (reaction.message.guild) {
				guildId = reaction.message.guild.id;
			}

			let tempMessage = {
				id: 1,
				guild: reaction.message.guild,
				guildId: guildId,
				content: `e!osu-matchup ${osuUserId}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	if (reaction._emoji.name === '🔵' || reaction._emoji.name === '🔴') {
		//Check if it is a matchup
		if (reaction.message.attachments.first().name.startsWith('osu-matchup')) {
			//get the osuUserId used
			let osuUserId;
			if (reaction._emoji.name === '🔴') {
				osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');
			} else {
				osuUserId = reaction.message.attachments.first().name.replace('osu-matchup-', '').replace(/-.+/, '');
			}
			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-profile.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-profile ${args}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//Check if reacted for osu-duel-rating information
	if (reaction._emoji.id === '951396806653255700') {
		//Check if it is a profile
		if (reaction.message.attachments.first().name.startsWith('osu-profile') || reaction.message.attachments.first().name.startsWith('osu-topPlayStats')) {
			//get the osuUserId used
			const osuUserId = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

			//Setup artificial arguments
			let args = [osuUserId];

			const command = require('./commands/osu-duel.js');

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				command.execute(null, args, interaction, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
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
		if (reaction.message.attachments.first().name.startsWith('osu-beatmap')) {
			const beatmapId = reaction.message.attachments.first().name.replace('osu-beatmap-', '').replace(/-.+/gm, '');

			const dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });

			//get the mods used
			const modBits = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

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

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-score ${beatmapId} --${mods.join('')}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//For the compare emoji
	if (reaction._emoji.id === '918935327215861760') {
		if (reaction.message.attachments.first().name.startsWith('osu-beatmap')) {
			const beatmapId = reaction.message.content.replace('osu-beatmap-', '').replace(/-.+/gm, '');

			//get the mods used
			const modBits = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

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

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-score ${beatmapId} --${mods.join('')}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	//For the compare emoji
	if (reaction._emoji.id === '918935350125142036') {
		if (reaction.message.attachments.first().name.startsWith('osu-beatmap')) {
			const beatmapId = reaction.message.content.replace('osu-beatmap-', '').replace(/-.+/gm, '');

			//get the mods used
			const modBits = reaction.message.attachments.first().name.replace(/.+-/gm, '').replace('.png', '');

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

			if (checkCooldown(reaction, command, user, args) !== undefined) {
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
				content: `e!osu-score ${beatmapId} --${mods.join('')}`,
				author: user,
				channel: reaction.message.channel,
			};

			try {
				command.execute(tempMessage, args, null, additionalObjects);
			} catch (error) {
				console.error(error);
				const eliteronixUser = await reaction.message.client.users.cache.find(user => user.id === '138273136285057025');
				reaction.message.reply('There was an error trying to execute that command. The developers have been alerted.');
				eliteronixUser.send(`There was an error trying to execute a command.\nReaction by ${user.username}#${user.discriminator}: \`Compare Reaction\`\n\n${error}`);
			}
		}
	}

	if (reaction.message.channel.type === 'DM') {
		return;
	}

	logDatabaseQueries(2, 'reactionAdded.js DBReactionRolesHeader');
	//Get the header message from the db
	const dbReactionRolesHeader = await DBReactionRolesHeader.findOne({
		where: {
			guildId: reaction.message.guild.id,
			reactionHeaderId: reaction.message.id
		}
	});

	if (dbReactionRolesHeader) {
		logDatabaseQueries(2, 'reactionAdded.js DBReactionRoles 1');
		//Get the reactionRole from the db by all the string (works for general emojis)
		const dbReactionRole = await DBReactionRoles.findOne({
			where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: reaction._emoji.name }
		});

		if (dbReactionRole) {
			//Get role object
			const reactionRoleObject = reaction.message.guild.roles.cache.get(dbReactionRole.roleId);

			//Check if deleted role
			if (reactionRoleObject) {
				//Get member
				const member = await reaction.message.guild.members.fetch(user.id);
				try {
					//Assign role
					await member.roles.add(reactionRoleObject);
				} catch (e) {
					if (e.message === 'Missing Access') {
						const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
						return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
					} else {
						return console.log(e);
					}
				}
			} else {
				DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRole.roleId } });
				editEmbed(reaction.message, dbReactionRolesHeader);
			}
		} else {
			//Put the emoji name into the correct format for comparing it in case it's an guild emoji
			let emoji = '<:' + reaction._emoji.name + ':';

			logDatabaseQueries(2, 'reactionAdded.js DBReactionRoles 2');
			//Get the reactionRole from the db by all the string (works for general emojis)
			const dbReactionRoleBackup = await DBReactionRoles.findOne({
				where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, emoji: { [Op.like]: emoji + '%' } }
			});

			if (dbReactionRoleBackup) {
				//Get role object
				const reactionRoleBackupObject = reaction.message.guild.roles.cache.get(dbReactionRoleBackup.roleId);

				//Check if deleted role
				if (reactionRoleBackupObject) {
					//Get member
					const member = await reaction.message.guild.members.fetch(user.id);
					try {
						//Assign role
						await member.roles.add(reactionRoleBackupObject);
					} catch (e) {
						if (e.message === 'Missing Access') {
							const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerId);
							return owner.send(`I could not assign a reactionrole to an user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
						} else {
							return console.log(e);
						}
					}
				} else {
					DBReactionRoles.destroy({ where: { dbReactionRolesHeaderId: dbReactionRolesHeader.id, roleId: dbReactionRoleBackup.roleId } });
					editEmbed(reaction.message, dbReactionRolesHeader);
				}
			} else {
				console.log(`There was an error trying to get a ReactionRole from the db for message ${reaction.message.id}, in ${reaction.message.guild.name} on a reaction.`);
			}
		}
	}
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.MessageEmbed()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter({ text: `Reactionrole - EmbedId: ${reactionRolesHeader.id}` });

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	logDatabaseQueries(2, 'reactionAdded.js DBReactionRoles 3');
	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		where: { dbReactionRolesHeaderId: reactionRolesHeader.id }
	});

	//Add roles to embed
	reactionRoles.forEach(reactionRole => {
		//Get role object
		let reactionRoleName = msg.guild.roles.cache.get(reactionRole.roleId);
		//Add field to embed
		reactionRoleEmbed.addField(reactionRole.emoji + ': ' + reactionRoleName.name, reactionRole.description);
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
		msg.channel.send('Couldn\'t find an embed with this EmbedId');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guildId, id: reactionRolesHeader.id },
		});
		return console.log(e);
	}
	//Get the message object
	const embedMessage = await embedChannel.messages.fetch(embedMessageId);
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
				return owner.send(`I could not add reactions to a reactionrole-embed because I'm missing the \`Add Reactions\` permission on \`${msg.guild.name}\`.`);
			} else {
				return console.log(e);
			}
		}
	}
}


function checkCooldown(reaction, command, user, args) {
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
			return reaction.message.channel.send(`<@${user.id}>, you need to wait ${timeLeft.toFixed(1)} seconds before you can use this command again.`)
				.then(async (msg) => {
					await pause(5000);
					msg.delete();
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
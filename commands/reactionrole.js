const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'reactionrole',
	aliases: ['reactionroles', 'rr'],
	description: 'Create and manage reaction roles',
	usage: 'help <- For a detailed help in using the command',
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	botPermissions: ['MANAGE_ROLES', 'MANAGE_MESSAGES'],
	botPermissionsTranslated: 'Manage Roles and Manage Messages',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//Check the first argument
		if (args[0].toLowerCase() === 'embed') {
			//Check the second argument
			if (args[1].toLowerCase() === 'add') {
				//Check if a name was set for the embed
				if (args[2]) {
					//Remove the first two items
					args.shift();
					args.shift();
					//Join the name string
					const embedName = args.join(' ');
					//Get the last created record for the next embedID
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						order: [
							['id', 'DESC'],
						],
					});

					//Predict the next embedId
					let embedId;
					if (reactionRolesHeader) {
						embedId = reactionRolesHeader.id + 1;
					} else {
						embedId = '1';
					}

					//Create embed
					const reactionRoleEmbed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle(embedName)
						.setFooter(`Reactionrole - EmbedID: ${embedId}`);
					//Send embed
					const embedMessage = await msg.channel.send(reactionRoleEmbed);
					//Create the record for the embed in the db
					DBReactionRolesHeader.create({ guildId: embedMessage.guild.id, reactionHeaderId: embedMessage.id, reactionChannelHeaderId: msg.channel.id, reactionTitle: embedName, reactionColor: '#0099ff' });
				} else {
					msg.channel.send('Please specify what name you want to give the embed you want to create.');
					sendHelp(msg);
				}

				//Check the second argument
			} else if (args[1].toLowerCase() === 'remove') {
				if (!(isNaN(args[2]))) {
					//Get the embed which should get deleted
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						where: { guildId: msg.guild.id, id: args[2] },
					});

					//Check if it was found in the db
					if (reactionRolesHeader) {
						//Get the ID of the message
						const embedMessageId = reactionRolesHeader.reactionHeaderId;
						//get the ID of the channel
						const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
						//Get the channel object
						let embedChannel;
						try {
							embedChannel = msg.guild.channels.cache.get(embedChannelId);
						} catch (e) {
							msg.channel.send('Couldn\'t find an embed with this EmbedID');
							DBReactionRolesHeader.destroy({
								where: { guildId: msg.guild.id, id: args[2] },
							});
							return console.log(e);
						}
						//Get the message object
						const embedMessage = await embedChannel.messages.fetch(embedMessageId);
						//Delete the embed
						embedMessage.delete();
						//Delete the record from the db
						DBReactionRolesHeader.destroy({
							where: { guildId: msg.guild.id, id: args[2] },
						});
					} else {
						msg.channel.send('Couldn\'t find an embed with this EmbedID');
					}
				} else {
					msg.channel.send('Please specify what ID the embed has you want to remove. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else if (args[1].toLowerCase() === 'change') {
				if (!(isNaN(args[2]))) {
					if (args[3].toLowerCase() === 'title') {
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guild.id, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionTitle = args.join(' ');
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader)
							);

							msg.channel.send('The title for the specified embed has been changed.');
						} else {
							msg.channel.send('Couldn\'t find an embed with this EmbedID');
						}
					} else if (args[3].toLowerCase() === 'description') {
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guild.id, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionDescription = args.join(' ');
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader)
							);

							msg.channel.send('The description for the specified embed has been changed.');
						} else {
							msg.channel.send('Couldn\'t find an embed with this EmbedID');
						}
					} else if (args[3].toLowerCase() === 'color') {
						if (args[4].startsWith('#') && args[4].length === 7) {

							const embedColor = args[4];

							//Get embed from the db
							const reactionRolesHeader = await DBReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, id: args[2] },
							});

							//Check if it was found in the db
							if (reactionRolesHeader) {
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								reactionRolesHeader.reactionColor = embedColor;
								reactionRolesHeader.save().then(
									editEmbed(msg, reactionRolesHeader)
								);

								msg.channel.send('The color for the specified embed has been changed.');
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else {
							msg.channel.send('Please send a color in a format like \'#0099ff\'');
						}
					} else if (args[3].toLowerCase() === 'image') {

						const embedImage = args[4];

						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guild.id, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionImage = embedImage;
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader)
							);

							msg.channel.send('The image for the specified embed has been changed.');
						} else {
							msg.channel.send('Couldn\'t find an embed with this EmbedID');
						}
					} else {
						msg.channel.send('Please specify what you want to change: <title/description/color/image>');
						sendHelp(msg);
					}
				} else {
					msg.channel.send('Please specify what ID the embed has you want to change. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else {
				//incorrect second argument
				msg.channel.send('Please specify if you want to add, remove or change the embed.');
				sendHelp(msg);
			}
			//Check the first argument
		} else if (args[0].toLowerCase() === 'role') {
			//Check the second argument
			if (args[1].toLowerCase() === 'add') {
				//Check the third argument if it is an possible embedID
				if (!(isNaN(args[2]))) {
					//Check if there is a role mentioned in the message
					if (msg.mentions.roles.first() && args[4].startsWith('<@&')) {
						if (args[5]) {

							const headerId = args[2];
							const roleMentioned = args[4].replace('<@&', '').replace('>', '');

							//Get embed from the db
							const reactionRolesHeader = await DBReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, id: headerId },
							});

							if (reactionRolesHeader) {
								const reactionRolesEmoji = await DBReactionRoles.findOne({
									where: { dbReactionRolesHeaderId: headerId, emoji: args[3] },
								});

								const reactionRolesRole = await DBReactionRoles.findOne({
									where: { dbReactionRolesHeaderId: headerId, roleId: roleMentioned },
								});

								if (reactionRolesEmoji) {
									return msg.channel.send('There is already a reactionrole with this emoji in the specified embed.');
								} else if (reactionRolesRole) {
									return msg.channel.send('There is already a reactionrole with this role in the specified embed.');
								} else {
									const emoji = args[3];
									args.shift();
									args.shift();
									args.shift();
									args.shift();
									args.shift();
									DBReactionRoles.create({ dbReactionRolesHeaderId: headerId, roleId: roleMentioned, emoji: emoji, description: args.join(' ') });
									msg.channel.send('The role has been added as an reactionrole.'); //Specify which role (print the name)

									//Edit embed
									editEmbed(msg, reactionRolesHeader);
								}
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else {
							msg.channel.send('You didn\'t provide a description for the role!');
							sendHelp(msg);
						}
					} else {
						msg.channel.send('You didn\'t specify the role you want to add to the embed!');
						sendHelp(msg);
					}
				} else {
					msg.channel.send('Please specify what ID the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
				//Check the second argument
			} else if (args[1].toLowerCase() === 'remove') {
				//Check the third argument if it is an possible embedID
				if (!(isNaN(args[2]))) {
					//Check for a fourth argument
					if (args[3]) {
						//Get headerId
						const headerId = args[2];
						const emoji = args[3];

						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guild.id, id: headerId },
						});

						if (reactionRolesHeader) {
							const rowCount = await DBReactionRoles.destroy({
								where: { dbReactionRolesHeaderId: headerId, emoji: emoji }
							});

							if (rowCount > 0) {
								//Edit embed
								editEmbed(msg, reactionRolesHeader);
							} else {
								msg.channel.send('There were no reactionrole found in the embed with this emoji.');
							}
						}
					}
				} else {
					msg.channel.send('Please specify what ID the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
				//Check the second argument
			} else if (args[1].toLowerCase() === 'change') {
				//Check the third argument if it is an possible embedID
				if (!(isNaN(args[2]))) {
					//Get headerId
					const headerId = args[2];

					//Get embed from the db
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						where: { guildId: msg.guild.id, id: headerId },
					});

					//Check if there was an embed found in the same guild
					if (reactionRolesHeader) {
						//Get emoji
						const emoji = args[3];
						//Try to get a reactionRole from the db where there is the same emoji for the embed
						const reactionRolesEmoji = await DBReactionRoles.findOne({
							where: { dbReactionRolesHeaderId: headerId, emoji: emoji },
						});

						//Check if there is an reactionRole with this emoji
						if (reactionRolesEmoji) {
							if (args[4].toLowerCase() === 'emoji') {
								reactionRolesEmoji.emoji = args[5];
								reactionRolesEmoji.save()
									.then(editEmbed(msg, reactionRolesHeader));
							} else if (args[4].toLowerCase() === 'description') {
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								reactionRolesEmoji.description = args.join(' ');
								reactionRolesEmoji.save()
									.then(editEmbed(msg, reactionRolesHeader));
							} else {
								msg.channel.send('Please specify if you want to change the emoji or the description.');
								sendHelp(msg);
							}
						} else {
							msg.channel.send('Couldn\'t find a reactionrole with this emoji in the specified embed.');
						}
					} else {
						msg.channel.send('Couldn\'t find an embed with this EmbedID');
					}
				} else {
					msg.channel.send('Please specify what ID the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else {
				//incorrect second argument
				msg.channel.send('Please specify if you want to add or remove the embed.');
				sendHelp(msg);
			}
		} else if (args[0].toLowerCase() === 'help') {
			sendHelp(msg);
		} else {
			//Incorrect first argument
			msg.channel.send('Please provide what kind of object you want to add / remove.');
			sendHelp(msg);
		}
	},
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.MessageEmbed()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter(`Reactionrole - EmbedID: ${reactionRolesHeader.id}`);

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

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

	//Get the ID of the message
	const embedMessageId = reactionRolesHeader.reactionHeaderId;
	//get the ID of the channel
	const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
	//Get the channel object
	let embedChannel;
	try {
		embedChannel = msg.guild.channels.cache.get(embedChannelId);
	} catch (e) {
		msg.channel.send('Couldn\'t find an embed with this EmbedID');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guild.id, id: reactionRolesHeader.id },
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
		//Add reaction
		await embedMessage.react(reactionRoles[i].emoji);
	}
}

async function sendHelp(msg) {
	let guildPrefix = await getGuildPrefix(msg);

	let helpString = `Correct usage for creating a new embed:\n\`\`\`${guildPrefix}reactionrole embed add <name of the embed>\`\`\``;
	helpString += `Correct usage for removing an existing embed:\n\`\`\`${guildPrefix}reactionrole embed remove <embedID which can be found in the footer>\`\`\``;
	helpString += `Correct usage for changing an existing embed's appearance:\n\`\`\`${guildPrefix}reactionrole embed change <embedID> <title/description/color/image> <new title/description/color/image URL>\`\`\``;
	helpString += `Correct usage for adding a role to an embed:\n\`\`\`${guildPrefix}reactionrole role add <embedID> <emoji for the role> <@role> <description>\`\`\``;
	helpString += `Correct usage for removing a role from an embed:\n\`\`\`${guildPrefix}reactionrole role remove <embedID> <emoji of the role>\`\`\``;
	helpString += `Correct usage for changing a role in an embed:\n\`\`\`${guildPrefix}reactionrole role change <embedID> <emoji of the role> <emoji/description> <new emoji/description>\`\`\``;
	msg.channel.send(helpString);
}

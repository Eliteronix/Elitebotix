//require the discord.js module
const Discord = require('discord.js');

//require the ReactionRolesHeader Table
const { ReactionRolesHeader, ReactionRoles } = require('../dbObjects');

module.exports = {
	name: 'reactionrole',
	aliases: ['reactionroles', 'rr'],
	description: 'Create and manage reaction roles',
	usage: '<embed/role> <add/remove/change> <name of new embed/existing embed ID> <emoji> <@role> <@description>', //Change
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//Check the first argument
			if (args[0] === 'embed') {
				//Check the second argument
				if (args[1] === 'add') {
					//Check if a name was set for the embed
					if (args[2]) {
						//Remove the first two items
						args.shift();
						args.shift();
						//Join the name string
						const embedName = args.join(' ');
						//Get the last created record for the next embedID
						const reactionRolesHeader = await ReactionRolesHeader.findOne({
							order: [
								['reactionRolesHeaderId', 'DESC'],
							],
						});

						//Predict the next embedId
						let embedId;
						if (reactionRolesHeader) {
							embedId = reactionRolesHeader.reactionRolesHeaderId + 1;
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
						ReactionRolesHeader.create({ guildId: embedMessage.guild.id, reactionHeaderId: embedMessage.id, reactionChannelHeaderId: msg.channel.id, reactionTitle: embedName, reactionColor: '#0099ff' });
					} else {
						msg.channel.send('Please specify what name you want to give the embed you want to create.');
					}

					//Check the second argument
				} else if (args[1] === 'remove') {
					if (!(isNaN(args[2]))) {
						//Get the embed which should get deleted
						const reactionRolesHeader = await ReactionRolesHeader.findOne({
							where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
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
								ReactionRolesHeader.destroy({
									where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
								});
								return console.log(e);
							}
							//Get the message object
							const embedMessage = await embedChannel.messages.fetch(embedMessageId);
							//Delete the embed
							embedMessage.delete();
							//Delete the record from the db
							ReactionRolesHeader.destroy({
								where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
							});
						} else {
							msg.channel.send('Couldn\'t find an embed with this EmbedID');
						}
					} else {
						msg.channel.send('Please specify what ID the embed has you want to remove. (Can be found in the footer of the embed.)');
					}
				} else if (args[1] === 'change') {
					if (!(isNaN(args[2]))) {
						if (args[3] === 'title') {
							//Get embed from the db
							const reactionRolesHeader = await ReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
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
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else if (args[3] === 'description') {
							//Get embed from the db
							const reactionRolesHeader = await ReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
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
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else if (args[3] === 'color') {
							if (args[4].startsWith('#') && args[4].length === 7) {

								const embedColor = args[4];

								//Get embed from the db
								const reactionRolesHeader = await ReactionRolesHeader.findOne({
									where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
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
								} else {
									msg.channel.send('Couldn\'t find an embed with this EmbedID');
								}
							} else {
								msg.channel.send('Please send a color in a format like \'#0099ff\'');
							}
						} else if (args[3] === 'image') {

							const embedImage = args[4];

							//Get embed from the db
							const reactionRolesHeader = await ReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
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
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else {
							msg.channel.send('Please specify what you want to change: <title/description/color/image>');
						}
					} else {
						msg.channel.send('Please specify what ID the embed has you want to change. (Can be found in the footer of the embed.)');
					}
				} else {
					//incorrect second argument
					msg.channel.send('Please specify if you want to add, remove or change the embed.');
				}
				//Check the first argument
			} else if (args[0] === 'role') {
				//Check the second argument
				if (args[1] === 'add') {
					//Check the the third argument if it is an possible embedID
					if (!(isNaN(args[2]))) {
						//Check if there is a role mentioned in the message
						if (msg.mentions.roles.first()) {
							if (args[6]) {
								//Try to get an entry from the db where the same emoji was used for this Header

								const headerId = args[2];
								const roleMentioned = args[4].replace('<@&', '').replace('>', '');

								//Get embed from the db
								const reactionRolesHeader = await ReactionRolesHeader.findOne({
									where: { guildId: msg.guild.id, reactionRolesHeaderId: headerId },
								});

								if (reactionRolesHeader) {
									const reactionRolesEmoji = await ReactionRoles.findOne({
										where: { reactionRolesHeaderId: headerId, emoji: args[3] },
									});

									const reactionRolesRole = await ReactionRoles.findOne({
										where: { reactionRolesHeaderId: headerId, roleId: roleMentioned },
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
										ReactionRoles.create({ headerId: headerId, roleId: roleMentioned, emoji: emoji, description: args.join(' ') });
										msg.channel.send('The role has been added as an reactionrole.'); //Specify which role (print the name)

										//Edit embed
										editEmbed(msg, reactionRolesHeader);
									}
								} else {
									msg.channel.send('Couldn\'t find an embed with this EmbedID');
								}
							} else {
								msg.channel.send('You didn\'t provide a description for the role!');
							}
						} else {
							msg.channel.send('You didn\'t specify the role you want to add to the embed!');
						}
					} else {
						msg.channel.send('Please specify what ID the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					}
					//Check for double emoji
					//Check the second argument
				} else if (args[1] === 'remove') {

					//Check the second argument
				} else if (args[1] === 'change') {

				} else {
					//incorrect second argument
					msg.channel.send('Please specify if you want to add or remove the embed.');
				}
			} else {
				//Incorrect first argument
				msg.channel.send('Please provide what kind of object you want to add / remove.');
			}
			//e!rr embed 	add 	<name> //Write ID in Footer
			//e!rr embed 	remove 	<name> or <ID>
			//e!rr role 	add 	<embedId> 	<emoji>		<@role> 	<description>
			//e!rr role 	remove 	<embedId> 	<emoji>
		}
	},
};

async function editEmbed(msg, reactionRolesHeader) {
	//Create embed
	const reactionRoleEmbed = new Discord.MessageEmbed()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter(`Reactionrole - EmbedID: ${reactionRolesHeader.reactionRolesHeaderId}`);

	//Set description if available
	if(reactionRolesHeader.reactionDescription){
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	//Get roles from db
	const reactionRoles = await ReactionRoles.findAll({
		where: { headerId: reactionRolesHeader.reactionRolesHeaderId }
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
		ReactionRolesHeader.destroy({
			where: { guildId: msg.guild.id, reactionRolesHeaderId: reactionRolesHeader.reactionRolesHeaderId },
		});
		return console.log(e);
	}
	//Get the message object
	const embedMessage = await embedChannel.messages.fetch(embedMessageId);
	//Edit the message
	embedMessage.edit(reactionRoleEmbed);
}
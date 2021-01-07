//require the discord.js module
const Discord = require('discord.js');

//require the ReactionRolesHeader Table
const { ReactionRolesHeader } = require('../dbObjects');

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

						if (reactionRolesHeader) {
							const embedMessageId = reactionRolesHeader.reactionHeaderId;
							const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
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
							const embedMessage = await embedChannel.messages.fetch(embedMessageId);
							embedMessage.delete();
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
							const reactionRolesHeader = ReactionRolesHeader.findOne({
								where: { guildId: msg.guild.id, reactionRolesHeaderId: args[2] },
							});

							if (reactionRolesHeader) {
								args.shift();
								args.shift();
								args.shift();
								reactionRolesHeader.reactionTitle = args.join(' ');
								reactionRolesHeader.save();

								//Create embed
								const reactionRoleEmbed = new Discord.MessageEmbed()
									.setColor(reactionRolesHeader.reactionColor)
									.setTitle(args.join(' '))
									.setFooter(`Reactionrole - EmbedID: ${reactionRolesHeader.reactionRolesHeaderId}`);
									//NULL VALUES?
								//Edit embed
								msg.edit(reactionRoleEmbed); //MSG has to be replaced with the embedMessage
							} else {
								msg.channel.send('Couldn\'t find an embed with this EmbedID');
							}
						} else if (args[3] === 'description') {

						} else if (args[3] === 'color') {

						} else if (args[3] === 'image') {

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

					//Check the second argument
				} else if (args[1] === 'remove') {

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
			//e!rr role 	remove 	<embedId> 	<@role>

			//reactionRoles.forEach(entry => {
			//	embed.addField(entry, 'looped field');
			//});
		}
	},
};

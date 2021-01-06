//require the discord.js module
const Discord = require('discord.js');

//require the ReactionRolesHeader Table
const { ReactionRolesHeader } = require('../dbObjects');

//require the sequelize module
const Sequelize = require('sequelize');

module.exports = {
	name: 'reactionrole',
	aliases: ['reactionroles','rr'],
	description: 'Create and manage reaction roles', //Maybe change color, description.. afterwards with set
	usage: '<embed/role> <name of new embed/existing embed ID> <emoji> <@role> <@description>', //Change
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//Check the first argument
			if(args[0] === 'embed'){
				//Check the second argument
				if(args[1] === 'add'){
					//Check if a name was set for the embed
					if(args[2]){
						//Remove the first two items
						args.shift();
						args.shift();
						//Join the name string
						const embedName = args.join(' ');
						const reactionRolesHeader = await ReactionRolesHeader.findOne({
							order: Sequelize.fn('max', Sequelize.col('reactionRolesHeaderId')),
						});
						let embedId;
						if(reactionRolesHeader){
							embedId = reactionRolesHeader.reactionHeaderId + 1;
						} else {
							embedId = '1';
						}
						const reactionRoleEmbed = new Discord.MessageEmbed()
							.setColor('#0099ff')
							.setTitle(embedName)
							.setFooter(`Reactionrole - EmbedId: ${embedId}`);

						msg.channel.send(reactionRoleEmbed);
					} else {
						msg.channel.send('Please specify what name you want to give the embed you want to create.');
					}

				//Check the second argument
				} else if(args[1] === 'remove'){

				} else {
					//incorrect second argument
					msg.channel.send('Please specify if you want to add or remove the embed.');
				}
			//Check the first argument
			} else if(args[0] === 'role'){
				//Check the second argument
				if(args[1] === 'add'){

				//Check the second argument
				} else if(args[1] === 'remove'){

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

const { Permissions } = require('discord.js');
const { DBDiscordUsers, DBBirthdayGuilds } = require('../dbObjects');

module.exports = {
	name: 'birthday',
	// aliases: ['dice', 'ouo'],
	description: 'Set your birthday',
	usage: '<set> <month> <date> | <enable> | <disable>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	// args: true,
	cooldown: 10,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('please use `/birthday` instead');
		} else {
			if (interaction.options._subcommand === 'set'){
				let date = new Date();
				date.setUTCSeconds(0);
				date.setUTCHours(0);
				date.setUTCMinutes(0);
				date.setUTCMilliseconds(0);
				date.setUTCFullYear(0);
                
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'date') {
						date.setUTCDate(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'month') {
						date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
					}
				}
				let user = await DBDiscordUsers.findOne({
					where: {
						userId: interaction.member.user.id,
					},
				});
                
				if (!user) {
					user = await DBDiscordUsers.create({
						userId: interaction.member.user.id,
					});
				}
				
				if (user.birthday) {
					return interaction.reply({ content: 'You already have a birthday set.', ephemeral: true });
				}

				user.birthday = date;
				user.save();
            
				// date string in the following format "Full Month Name, Day"
				let dateString = date.toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
				});
				return interaction.reply({content:`Your birthday has been set for \`${dateString}\``, ephemeral: true});
			} else if (interaction.options._subcommand === 'enable') {
                
				let currentGuild = await DBBirthdayGuilds.findOne({
					where: {
						guildId: interaction.guild.id,
						userId: interaction.member.user.id,
					},
				});
			
				if (!currentGuild) {
					currentGuild = await DBBirthdayGuilds.create({
						guildId: interaction.guild.id,
						guildName: interaction.guild.name,
						userId: interaction.member.user.id,
					});
				}
                
				if (currentGuild.birthdayEnabled) {
					return interaction.reply({content:`You already have birthday logging enabled for ${interaction.guild.name}`, ephemeral: true});
				}
            
				currentGuild.birthdayEnabled = true;
				currentGuild.save();
                
				return interaction.reply({ content: `Birthday logging has been enabled for ${interaction.guild.name}`, ephemeral: true });
            
			} else if (interaction.options._subcommand === 'disable') {
				let currentGuild = await DBBirthdayGuilds.findOne({
					where: {
						guildId: interaction.guild.id,
						userId: interaction.member.user.id,
					},
				});
            
				if (!currentGuild) {
					currentGuild = await DBBirthdayGuilds.create({
						guildId: interaction.guild.id,
						guildName: interaction.guild.name,
						userId: interaction.member.user.id,
						birthdayEnabled: false,
					});
				}
                
				if (!currentGuild.birthdayEnabled) {
					// you already have birthday logging disabled for ${guild.name}}
					return interaction.reply({ content: `You already have birthday logging disabled for ${interaction.guild.name}`, ephemeral: true });
				} 
				currentGuild.birthdayEnabled = false;
				currentGuild.save();
                
				// birthday logging disabled for ${guild.name}}
				return interaction.reply({ content: `Birthday logging disabled for ${interaction.guild.name}`, ephemeral: true });
            
			}
                
		}
	}
};
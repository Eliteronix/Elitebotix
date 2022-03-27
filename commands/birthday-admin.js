const { Permissions } = require('discord.js');
const {  DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'birthday-admin',
	// aliases: ['dice', 'ouo'],
	description: 'Manage birthday logging on your server',
	usage: '<set>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	// args: true,
	cooldown: 10,
	// noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('please use `/birthday` instead');
		} else {
			let guild = await DBGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
				},
			});
            
			if (interaction.options._subcommand === 'enable'){
				if (!guild) {
					guild = await DBGuilds.create({
						guildId: interaction.guild.id,
						guildName: interaction.guild.name,
						birthdayLogging: true,
					});
				}
                
				guild.birthdayLogging = true;
				guild.save();
				return interaction.reply({ content: 'Birthday logging has been enabled.', ephemeral: true });
			} else if (interaction.options._subcommand === 'disable') {
				if (!guild) {
					guild = await DBGuilds.create({
						guildId: interaction.guild.id,
						guildName: interaction.guild.name,
						birthdayLogging: false,
					});
				}
                
				guild.birthdayLogging = false;
				guild.save();
				return interaction.reply({ content: 'Birthday logging has been disabled.', ephemeral: true });
			} else if (interaction.options._subcommand === 'channel') {
				let channel;
				console.log(interaction.options._hoistedOptions);
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'set') {
						channel = interaction.options._hoistedOptions[i].value;
					}
				}

				if (!channel) {
					return interaction.reply({ content: 'Please mention a channel.', ephemeral: true });
				}

				if (!guild) {
					guild = await DBGuilds.create({
						guildId: interaction.guild.id,
						guildName: interaction.guild.name,
						birthdayLogging: false,
					});
				}

				guild.birthdayLoggingChannel = channel;
				guild.save();
				return interaction.reply({content: `Birthday logging channel has been set to <#${channel}>`, ephemeral: true });
			}
		}
	}
};
//Require discord.js module
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
	name: 'creator',
	aliases: ['developer', 'donate', 'support', 'creators', 'developers', 'devs'],
	description: 'Sends an info card about the developers',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	//guildOnly: true,
	//args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: deferReply
		const eliteronixUser = await additionalObjects[0].users.fetch('138273136285057025');
		const roddyUser = await additionalObjects[0].users.fetch('212511522407055360');

		const canvas = Canvas.createCanvas(261, 128);
		const ctx = canvas.getContext('2d');


		const eliteAvatar = await Canvas.loadImage(eliteronixUser.displayAvatarURL({ format: 'jpg' }));
		ctx.drawImage(eliteAvatar, 0, 0, 128, canvas.height);
		const roddyAvatar = await Canvas.loadImage(roddyUser.displayAvatarURL({ format: 'jpg' }));
		ctx.drawImage(roddyAvatar, 133, 0, 128, canvas.height);

		const file = new MessageAttachment(canvas.toBuffer(), 'profileImages.jpg');


		//Create new embed
		const creatorInfoEmbed = new MessageEmbed()
			.setColor('#0492C2')
			.setTitle('Developers info card')
			.setDescription('We are working on this bot during our free time -\nfeel free to support us by using the links below.')
			.setThumbnail('attachment://profileImages.jpg')
			.addFields(
				{ name: 'Discord', value: '[Eliteronix#4208](https://discord.com/invite/Asz5Gfe)', inline: true },
				{ name: 'Discord', value: '[Roddy#0160](https://discord.com/invite/Asz5Gfe)', inline: true },
				{ name: '\u200B', value: '\u200B', inline: true })
			.addFields(
				{ name: 'Github', value: '[Eliteronix](https://github.com/Eliteronix)', inline: true },
				{ name: 'Github', value: '[Roddy](https://github.com/Roddyyyy)', inline: true },
				{ name: '\u200B', value: '\u200B', inline: true })
			.addFields(
				{ name: 'Twitter', value: '[@Eliteronix](https://twitter.com/Eliteronix)', inline: true },
				{ name: 'Twitter', value: '[@RoddyOsu](https://twitter.com/RoddyOsu)', inline: true },
				{ name: '\u200B', value: '\u200B', inline: true })
			.addFields(
				{ name: 'Twitch', value: '[Eliteronix](https://twitch.tv/Eliteronix)', inline: true },
				{ name: 'Twitch', value: '[Roddy](https://twitch.tv/Roddythegod)', inline: true },
				{ name: '\u200B', value: '\u200B', inline: true })
			.addFields(
				{ name: 'Paypal', value: '[paypal.me/Eliteronix](https://paypal.me/Eliteronix)', inline: true },
				{ name: 'Patreon', value: '[Elitebotix Patreon](https://www.patreon.com/Elitebotix)', inline: true },
				{ name: '\u200B', value: '\u200B', inline: true })
			.setTimestamp();

		return interaction.reply({ embeds: [creatorInfoEmbed], files: [file] });
	},
};
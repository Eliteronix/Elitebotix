const { AttachmentBuilder, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'creator',
	description: 'Sends an info card about the developers',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 15,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('creator')
		.setNameLocalizations({
			'de': 'entwickler',
			'en-GB': 'creator',
			'en-US': 'creator',
		})
		.setDescription('Sends an info card about the developers')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die Entwickler',
			'en-GB': 'Sends an info card about the developers',
			'en-US': 'Sends an info card about the developers',
		})
		.setDMPermission(true),
	async execute(interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		const eliteronixUser = await interaction.client.users.fetch('138273136285057025');
		const roddyUser = await interaction.client.users.fetch('212511522407055360');

		const canvas = Canvas.createCanvas(261, 128);
		const ctx = canvas.getContext('2d');

		const eliteAvatar = await Canvas.loadImage(eliteronixUser.displayAvatarURL().replace('.webp', '.png'));
		ctx.drawImage(eliteAvatar, 0, 0, 128, canvas.height);
		const roddyAvatar = await Canvas.loadImage(roddyUser.displayAvatarURL().replace('.webp', '.png'));
		ctx.drawImage(roddyAvatar, 133, 0, 128, canvas.height);

		const file = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profileImages.jpg' });

		//Create new embed
		const creatorInfoEmbed = new EmbedBuilder()
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

		return await interaction.editReply({ embeds: [creatorInfoEmbed], files: [file] });
	},
};
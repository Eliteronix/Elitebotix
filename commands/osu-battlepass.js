const { PermissionsBitField, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { showUnknownInteractionError, developers } = require('../config.json');
const { DBDiscordUsers, DBOsuBattlepass } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils.js');
const Canvas = require('canvas');

module.exports = {
	name: 'osu-battlepass',
	description: 'Allows you to view and manage your battlepass',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-battlepass')
		.setNameLocalizations({
			'de': 'osu-battlepass',
			'en-GB': 'osu-battlepass',
			'en-US': 'osu-battlepass',
		})
		.setDescription('Allows you to view and manage your battlepass')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, deinen Battlepass anzuzeigen und zu verwalten',
			'en-GB': 'Allows you to view and manage your battlepass',
			'en-US': 'Allows you to view and manage your battlepass',
		})
		.setDMPermission(true),
	async execute(msg, args, interaction) {
		if (!developers.includes(interaction.user.id)) {
			try {
				return await interaction.reply({ content: 'Only developers may use this command at the moment. As soon as development is finished it will be made public.', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
		}

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

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuVerified'],
			where: {
				userId: interaction.user.id
			}
		});

		if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
			return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
		}

		// Draw the image
		const canvasWidth = 1000;
		const canvasHeight = 500;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		//Get context and load the image
		const ctx = canvas.getContext('2d');
		const background = await Canvas.loadImage('./other/osu-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuBattlepass');
		let battlepass = await DBOsuBattlepass.findOne({
			where: {
				osuUserId: discordUser.osuUserId
			}
		});

		if (!battlepass) {
			// Create a new battlepass
			logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuBattlepass create');
			battlepass = await DBOsuBattlepass.create({
				osuUserId: discordUser.osuUserId,
				experience: 0,
			});
		}

		// Draw the next levels




		// Create as an attachment
		const files = [new AttachmentBuilder(canvas.toBuffer(), { name: 'battlepass.png' })];

		await interaction.editReply({ content: 'Your current battlepass progress and quests can be seen below.', files: files });
	},
};
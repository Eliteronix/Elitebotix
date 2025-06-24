const Discord = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { developers, logBroadcastEval } = require('../config.json');

module.exports = {
	name: 'changelog',
	description: 'Sends where to find the changelog',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('changelog')
		.setNameLocalizations({
			'de': 'changelog',
			'en-GB': 'changelog',
			'en-US': 'changelog',
		})
		.setDescription('Sends where to find the changelog')
		.setDescriptionLocalizations({
			'de': 'Sendet wo man das Changelog finden kann',
			'en-GB': 'Sends where to find the changelog',
			'en-US': 'Sends where to find the changelog',
		})
		.setDMPermission(true)
		.addNumberOption(option =>
			option.setName('height')
				.setNameLocalizations({
					'de': 'höhe',
					'en-GB': 'height',
					'en-US': 'height',
				})
				.setDescription('The height of the generated image (Admin only)')
				.setDescriptionLocalizations({
					'de': 'Die Höhe des generierten Bildes (Nur für Admins)',
					'en-GB': 'The height of the generated image (Admin only)',
					'en-US': 'The height of the generated image (Admin only)',
				})
		)
		.addStringOption(option =>
			option.setName('title')
				.setNameLocalizations({
					'de': 'titel',
					'en-GB': 'title',
					'en-US': 'title',
				})
				.setDescription('The title of the changelog (Admin only)')
				.setDescriptionLocalizations({
					'de': 'Der Titel des Changelogs (Nur für Admins)',
					'en-GB': 'The title of the changelog (Admin only)',
					'en-US': 'The title of the changelog (Admin only)',
				})
		)
		.addStringOption(option =>
			option.setName('changes')
				.setNameLocalizations({
					'de': 'änderungen',
					'en-GB': 'changes',
					'en-US': 'changes',
				})
				.setDescription('The changes of the changelog (Admin only)')
				.setDescriptionLocalizations({
					'de': 'Die Änderungen des Changelogs (Nur für Admins)',
					'en-GB': 'The changes of the changelog (Admin only)',
					'en-US': 'The changes of the changelog (Admin only)',
				})
		),
	async execute(interaction) {
		if (!developers.includes(interaction.user.id)) {
			return await interaction.reply({
				content: 'You can find the changelogs in this channel: <#804658828883787784>\n\nIf you don\'t have the server - [here](https://discord.gg/Asz5Gfe) is the invite.',
			});
		}

		const canvasHeight = interaction.options.getNumber('height');
		const title = interaction.options.getString('title');
		let changes = interaction.options.getString('changes');

		if (!canvasHeight || !title || !changes) {
			return await interaction.reply({
				content: 'You need to provide a height, title and changes for the changelog image.',
				flags: MessageFlags.Ephemeral,
			});
		}

		changes = changes.split('\\n');

		const canvasWidth = 1000;

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
		Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/discord-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		// Write the title of the changelog
		ctx.font = 'bold 35px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(title, canvas.width / 2, 50);

		let today = new Date().toLocaleDateString();

		ctx.font = '12px comfortaa, arial';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

		ctx.font = 'bold 25px comfortaa, arial';
		ctx.textAlign = 'left';
		for (let i = 0; i < changes.length; i++) {
			ctx.fillText(changes[i], 100, 150 + (i * 30));
		}


		//Create as an attachment
		const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'elitebotix-changelog.png' });

		if (process.env.SERVER === 'Dev' || process.env.SERVER === 'QA') {
			await interaction.reply({ content: `**Elitebotix has been updated** - Please report any bugs by using </feedback:${interaction.client.slashCommandData.find(command => command.name === 'feedback').id}>.`, files: [attachment] });
		} else if (process.env.SERVER === 'Live') {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting commands/changelog.js to shards...');
			}

			interaction.client.shard.broadcastEval(async (c, { canvasHeight, title, changes }) => {
				const changelogChannel = await c.channels.cache.get('804658828883787784');
				if (changelogChannel) {
					const canvasWidth = 1000;

					//Create Canvas
					const Canvas = require('@napi-rs/canvas');
					const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

					Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');

					//Get context and load the image
					const ctx = canvas.getContext('2d');

					const background = await Canvas.loadImage('./other/discord-background.png');

					for (let i = 0; i < canvas.height / background.height; i++) {
						for (let j = 0; j < canvas.width / background.width; j++) {
							ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
						}
					}

					// Write the title of the changelog
					ctx.font = 'bold 35px comfortaa, arial';
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.fillText(title, canvas.width / 2, 50);

					let today = new Date().toLocaleDateString();

					ctx.font = '12px comfortaa, arial';
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'right';
					ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

					ctx.font = 'bold 25px comfortaa, arial';
					ctx.textAlign = 'left';
					ctx.fillText(changes, 100, 150);

					//Create as an attachment
					const Discord = require('discord.js');
					const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'elitebotix-changelog.png' });

					let sentMessage = await changelogChannel.send({ content: `**Elitebotix has been updated** - Please report any bugs by using </feedback:${c.slashCommandData.find(command => command.name === 'feedback').id}>.`, files: [attachment] });
					sentMessage.crosspost();
				}
			}, { context: { args: canvasHeight, title, changes } });

			await interaction.reply({
				content: `The following message has been posted:\n\n**Elitebotix has been updated** - Please report any bugs by using </feedback:${interaction.client.slashCommandData.find(command => command.name === 'feedback').id}>.`,
				files: [attachment],
			});
		}
	},
};